// components/plans-treatment/use-treatment-state.ts
import { useState, useEffect, useMemo } from "react"
import { TreatmentItem, EvolutionInput } from "@/types/treatments"

export function useTreatmentState(initialPlan: any, patient: any, currentUser: any, toast: any) {
  // --- ESTADOS LOCALES ---
  const [currentPlan, setCurrentPlan] = useState<any>(initialPlan)
  const [planItems, setPlanItems] = useState<TreatmentItem[]>(initialPlan?.items || [])
  const [discountPercent, setDiscountPercent] = useState<number>(Number(initialPlan?.discount || 0))
  const [signedConsents, setSignedConsents] = useState<any[]>([])
  
  const [collaborators, setCollaborators] = useState<string[]>(() => {
    if (Array.isArray(initialPlan?.collaborators)) return initialPlan.collaborators
    if (typeof initialPlan?.collaborators === "string") {
      try {
        const parsed = JSON.parse(initialPlan.collaborators)
        return Array.isArray(parsed) ? parsed : [initialPlan.collaborators]
      } catch {
        return initialPlan.collaborators ? [initialPlan.collaborators] : []
      }
    }
    return []
  })

  // --- MODALES Y DIÁLOGOS ---
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [sectionName, setSectionName] = useState("")
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
  const [tempDiscount, setTempDiscount] = useState(String(discountPercent))
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState("")
  const [targetToothOrRegion, setTargetToothOrRegion] = useState<string | undefined>(undefined)
  const [isAddingProcedure, setIsAddingProcedure] = useState(false)
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false)
  const [selectedItemToEvolve, setSelectedItemToEvolve] = useState<TreatmentItem | null>(null)
  const [evolutionProgress, setEvolutionProgress] = useState(0)
  const [evolutionNote, setEvolutionNote] = useState("")
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("")
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteMode, setDeleteMode] = useState<"ALL" | "SELECTED">("ALL")
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([])

  // --- EFECTOS ---
  useEffect(() => {
    if (initialPlan) {
      setCurrentPlan(initialPlan)
      setPlanItems(initialPlan.items || [])
      setDiscountPercent(Number(initialPlan.discount || 0)) 
      setCollaborators(Array.isArray(initialPlan.collaborators) ? initialPlan.collaborators : [])
    }
  }, [initialPlan])

  useEffect(() => {
    if (patient?.id) {
      fetch(`/api/clinical-documents?patientId=${patient.id}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const list = Array.isArray(data) ? data : data.documents || []
          setSignedConsents(list.filter((doc: any) => doc.patientSignature))
        })
        .catch(err => console.error("Error al cargar consentimientos:", err))
    }
  }, [patient?.id])

  // --- CÁLCULOS ---
  const calculatedTotals = useMemo(() => {
    let subtotal = 0
    let totalProgressSum = 0

    planItems.forEach((item: any) => {
      const cost = Number(item.cost || item.price || 0)
      const itemDisc = Number(item.discount || 0)
      const effectiveDisc = itemDisc > 0 ? itemDisc : discountPercent
      subtotal += Math.max(0, cost - (cost * (effectiveDisc / 100)))
      totalProgressSum += item.isCompleted ? 100 : Number(item.progress || 0)
    })

    const totalPaid = Number(currentPlan?.totalPaid || 0)
    return { 
      subtotal, 
      totalPaid, 
      pendingBalance: Math.max(0, subtotal - totalPaid), 
      progress: planItems.length > 0 ? Math.round(totalProgressSum / planItems.length) : 0 
    }
  }, [planItems, discountPercent, currentPlan?.totalPaid])

  // --- FUNCIONES Y HANDLERS ---
  const refreshPlanData = async () => {
    if (!initialPlan?.id) return
    try {
      const res = await fetch(`/api/treatments/${initialPlan.id}`)
      if (res.ok) {
        const { plan: fetchedPlan } = await res.json()
        setCurrentPlan(fetchedPlan)
        setPlanItems(fetchedPlan.items || [])
        if (Array.isArray(fetchedPlan.collaborators)) setCollaborators(fetchedPlan.collaborators)
        if (fetchedPlan.discount !== undefined) setDiscountPercent(Number(fetchedPlan.discount))
        else if (fetchedPlan.agreement?.discountValue) setDiscountPercent(Number(fetchedPlan.agreement.discountValue))
      }
    } catch (e) { console.error("Error al refrescar plan:", e) }
  }

  const handleApplyDiscount = async () => {
    const val = Math.max(0, Math.min(100, parseFloat(tempDiscount) || 0))
    try {
      const res = await fetch(`/api/treatments/${initialPlan.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discount: val })
      })
      if (!res.ok) throw new Error()
      setDiscountPercent(val)
      setIsDiscountModalOpen(false)
      toast({ title: "Descuento aplicado", variant: "success" })
      refreshPlanData()
    } catch { toast({ title: "Error", description: "No se pudo actualizar el descuento.", variant: "destructive" }) }
  }

  const handleApplyAgreement = async (agreement: any) => {
    try {
      const newDiscount = Number(agreement?.discount || agreement?.discountValue || 10)
      const agreementName = agreement?.name || agreement?.nombre || "IESS"
      
      const res = await fetch(`/api/treatments/${initialPlan.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId: agreement?.id || null, agreementName, convenio: agreementName })
      })
      if (!res.ok) throw new Error()
      
      const json = await res.json()
      setDiscountPercent(newDiscount)
      setCurrentPlan(json.plan || json)
      if (Array.isArray((json.plan || json).collaborators)) setCollaborators((json.plan || json).collaborators)
      
      toast({ title: "Convenio aplicado", description: `Se aplicó el convenio ${agreementName}.`, variant: "success" })
      refreshPlanData()
    } catch { toast({ title: "Error", description: "No se pudo guardar el convenio.", variant: "destructive" }) }
  }

  const handleUpdateItemDiscount = async (itemId: string, itemDiscount: number) => {
    try {
      await fetch(`/api/treatment-items/${itemId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discount: itemDiscount })
      })
      setPlanItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, discount: itemDiscount } : item)))
      refreshPlanData()
    } catch { }
  }

  const handleUpdateItemRegion = async (itemId: string, region: string) => {
    try {
      await fetch(`/api/treatment-items/${itemId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tooth: region })
      })
      setPlanItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, tooth: region } : item)))
      refreshPlanData()
    } catch { }
  }

  const handleAddManualProcedure = async (procedure: any, toothNum?: string) => {
    setIsAddingProcedure(true)
    try {
      const targetTooth = toothNum || targetToothOrRegion || null
      const res = await fetch(`/api/treatments/${initialPlan.id}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureName: procedure.name || procedure.procedureName,
          cost: Number(procedure.basePrice ?? procedure.price ?? procedure.cost ?? 0),
          tooth: targetTooth ? String(targetTooth) : null,
          discount: 0
        })
      })
      if (!res.ok) throw new Error()
      const resData = await res.json()
      setPlanItems((prev) => [...prev, resData.item || resData])
      setIsCatalogModalOpen(false)
      toast({ title: "Prestación agregada", variant: "success" })
      refreshPlanData()
    } catch {
      toast({ title: "Error al agregar", description: "No se pudo agregar la prestación.", variant: "destructive" })
    } finally {
      setIsAddingProcedure(false)
      setTargetToothOrRegion(undefined)
    }
  }

  const handleSaveEvolution = async (data?: EvolutionInput) => {
    if (!selectedItemToEvolve) return
    try {
      const progress = data?.progress ?? evolutionProgress
      const res = await fetch(`/api/treatments/items/${selectedItemToEvolve.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress, isCompleted: progress === 100, note: data?.note ?? evolutionNote,
          hasIncident: data?.hasIncident, hasAdverseEvent: data?.hasAdverseEvent,
          isPrivate: data?.isPrivate, fileUrl: data?.fileUrl, doctorId: data?.doctorId || currentUser?.id
        })
      })
      if (!res.ok) throw new Error()
      setIsEvolutionModalOpen(false)
      setSelectedItemToEvolve(null)
      toast({ title: "Evolución registrada", variant: "success" })
      refreshPlanData()
    } catch { toast({ title: "Error al registrar", description: "No se pudo guardar la evolución.", variant: "destructive" }) }
  }

  const handleSaveSignature = async (base64Signature: string) => {
    try {
      await fetch(`/api/treatments/${initialPlan.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureBase64: base64Signature, status: "ACTIVE" })
      })
      setCurrentPlan((prev: any) => ({ ...prev, status: "ACTIVE", patient: { ...prev.patient, signatureBase64: base64Signature } }))
      toast({ title: "Presupuesto aprobado", description: "Firma registrada exitosamente.", variant: "success" })
      setIsSignatureModalOpen(false)
      refreshPlanData()
    } catch { toast({ title: "Error", description: "No se pudo vincular la firma.", variant: "destructive" }) }
  }

  const handleApprovePlan = async () => {
    try {
      await fetch(`/api/treatments/${initialPlan.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ACTIVE" }) 
      })
      setCurrentPlan((prev: any) => ({ ...prev, status: "ACTIVE" }))
      toast({ title: "Presupuesto aprobado", description: "Se ha vinculado la firma del paciente.", variant: "success" })
      refreshPlanData()
    } catch { toast({ title: "Error", description: "No se pudo aprobar el plan.", variant: "destructive" }) }
  }

  const handleClearPlan = async () => {
    try {
      await fetch(`/api/treatments/${initialPlan.id}/clear-items`, { method: "DELETE" })
      setPlanItems([])
      setIsDeleteModalOpen(false)
      refreshPlanData()
    } catch { }
  }

  const executeDeleteSelected = async () => {
    try {
      await fetch(`/api/treatments/${initialPlan.id}/items`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemIds: itemsToDelete })
      })
      setPlanItems((prev) => prev.filter((item) => !itemsToDelete.includes(item.id)))
      setIsDeleteModalOpen(false)
      setItemsToDelete([])
      toast({ title: "Prestaciones eliminadas", variant: "success" })
      refreshPlanData()
    } catch { toast({ title: "Error", description: "No se pudieron eliminar los ítems.", variant: "destructive" }) }
  }

  const handleDeleteSelected = (ids: string[]) => {
    setItemsToDelete(ids)
    setDeleteMode("SELECTED")
    setIsDeleteModalOpen(true)
  }

  return {
    state: {
      currentPlan, planItems, discountPercent, signedConsents, collaborators,
      isSectionModalOpen, sectionName, isDiscountModalOpen, tempDiscount,
      isCatalogModalOpen, catalogSearch, targetToothOrRegion, isAddingProcedure,
      isEvolutionModalOpen, selectedItemToEvolve, evolutionProgress, evolutionNote,
      isDiagnosisModalOpen, selectedDiagnosis, isSignatureModalOpen, isCollaboratorsOpen,
      isDeleteModalOpen, deleteMode, itemsToDelete, calculatedTotals
    },
    setters: {
      setIsSectionModalOpen, setSectionName, setIsDiscountModalOpen, setTempDiscount,
      setIsCatalogModalOpen, setCatalogSearch, setTargetToothOrRegion, setIsEvolutionModalOpen,
      setSelectedItemToEvolve, setEvolutionProgress, setEvolutionNote, setIsDiagnosisModalOpen,
      setSelectedDiagnosis, setIsSignatureModalOpen, setIsCollaboratorsOpen, setCollaborators,
      setIsDeleteModalOpen, setDeleteMode
    },
    handlers: {
      refreshPlanData, handleApplyDiscount, handleApplyAgreement, handleUpdateItemDiscount,
      handleUpdateItemRegion, handleAddManualProcedure, handleSaveEvolution, handleSaveSignature,
      handleApprovePlan, handleClearPlan, executeDeleteSelected, handleDeleteSelected
    }
  }
}