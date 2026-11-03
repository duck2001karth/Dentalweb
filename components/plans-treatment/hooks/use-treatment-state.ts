"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { TreatmentItem, EvolutionInput } from "@/types/treatments"

export function useTreatmentState(initialPlan: any, patient: any, currentUser: any, toast: any) {
  // --- ESTADOS LOCALES ---
  const [currentPlan, setCurrentPlan] = useState<any>(initialPlan)
  const [planItems, setPlanItems] = useState<TreatmentItem[]>(initialPlan?.items || [])
  const [discountPercent, setDiscountPercent] = useState<number>(Number(initialPlan?.commercialDiscount ?? 0))
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
  const deletingRef = useRef(false)

  // --- SINCRONIZACIÓN DE PLAN (CORREGIDO PARA F5) ---
  useEffect(() => {
    if (initialPlan) {
      setCurrentPlan(initialPlan)
      setPlanItems(initialPlan.items || [])
      setDiscountPercent(Number(initialPlan.commercialDiscount ?? 0))
      setTempDiscount(String(initialPlan.commercialDiscount ?? 0))
      setCollaborators(Array.isArray(initialPlan.collaborators) ? initialPlan.collaborators : [])
      
      if (initialPlan.id) {
        fetch(`/api/treatments/${initialPlan.id}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.plan) {
              const freshPlan = data.plan
              setCurrentPlan((prev: any) => ({
                ...freshPlan,
                sections: freshPlan.sections !== undefined ? freshPlan.sections : (prev?.sections || [])
              }))
              setPlanItems(freshPlan.items || [])
              if (freshPlan.commercialDiscount !== undefined) {
                setDiscountPercent(Number(freshPlan.commercialDiscount))
                setTempDiscount(String(freshPlan.commercialDiscount))
              }
              if (Array.isArray(freshPlan.collaborators)) {
                setCollaborators(freshPlan.collaborators)
              }
            }
          })
          .catch((e) => console.error("Error al sincronizar plan inicial:", e))
      }
    }
  }, [initialPlan?.id])

  useEffect(() => {
    if (!patient?.id || !initialPlan?.id) {
      setSignedConsents([])
      return
    }
    let cancelled = false
    const query = new URLSearchParams({
      patientId: String(patient.id),
      treatmentPlanId: String(initialPlan.id),
    })
    fetch(`/api/clinical-documents?${query.toString()}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : (Array.isArray(data?.documents) ? data.documents : [])
        setSignedConsents(list.filter((doc: any) =>
          Boolean(doc.patientSignature) &&
          !doc.isVoided &&
          String(doc.treatmentPlanId ?? "") === String(initialPlan.id)
        ))
      })
      .catch(err => {
        if (!cancelled) console.error("Error al cargar consentimientos:", err)
      })
    return () => { cancelled = true }
  }, [patient?.id, initialPlan?.id])

  // --- CÁLCULOS EN TIEMPO REAL ---
  const calculatedTotals = useMemo(() => {
    let subtotal = 0
    let totalProgressSum = 0

    planItems.forEach((item: any) => {
      const cost = Number(item.cost ?? item.price ?? 0)
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

  // --- HANDLERS ---
  const refreshPlanData = async () => {
    if (!initialPlan?.id) return
    try {
      const res = await fetch(`/api/treatments/${initialPlan.id}`)
      if (res.ok) {
        const data = await res.json()
        const fetchedPlan = data.plan || data
        
        setCurrentPlan((prev: any) => ({
          ...fetchedPlan,
          sections: fetchedPlan.sections !== undefined ? fetchedPlan.sections : (prev?.sections || [])
        }))
        setPlanItems(fetchedPlan.items || [])
        if (Array.isArray(fetchedPlan.collaborators)) setCollaborators(fetchedPlan.collaborators)
        if (fetchedPlan.commercialDiscount !== undefined) {
          setDiscountPercent(Number(fetchedPlan.commercialDiscount))
          setTempDiscount(String(fetchedPlan.commercialDiscount))
        }
      }
    } catch (e) {
      console.error("Error al refrescar plan:", e)
    }
  }

  const handleApplyDiscount = async () => {
    const raw = String(tempDiscount ?? "").trim()
    const val = Number(raw)
    if (raw === "" || !Number.isFinite(val) || val < 0 || val > 100) {
      toast({ title: "Descuento inválido", description: "Ingresa un porcentaje entre 0% y 100%.", variant: "destructive" })
      return
    }
    try {
      const res = await fetch(`/api/treatments/${initialPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commercialDiscount: val })
      })
      if (!res.ok) throw new Error()
      
      const json = await res.json()
      const updated = json.plan || json

      setDiscountPercent(val)
      setCurrentPlan(updated)
      setIsDiscountModalOpen(false)
      toast({ title: "Descuento comercial aplicado", variant: "success" })
      
      await refreshPlanData()
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el descuento comercial.", variant: "destructive" })
    }
  }

  const handleApplyAgreement = async (agreement: any) => {
    try {
      const newDiscount = Number(agreement?.discount || agreement?.discountValue || 10)
      const agreementName = agreement?.name || agreement?.nombre || "IESS"

      const res = await fetch(`/api/treatments/${initialPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId: agreement?.id || null, agreementName, convenio: agreementName })
      })
      if (!res.ok) throw new Error()

      const json = await res.json()
      setDiscountPercent(newDiscount)
      setCurrentPlan(json.plan || json)
      toast({ title: "Convenio aplicado", description: `Se aplicó el convenio ${agreementName}.`, variant: "success" })
      await refreshPlanData()
    } catch {
      toast({ title: "Error", description: "No se pudo guardar el convenio.", variant: "destructive" })
    }
  }

  const handleUpdateItemDiscount = async (itemId: string, itemDiscount: number): Promise<boolean> => {
    if (!Number.isFinite(itemDiscount) || itemDiscount < 0 || itemDiscount > 100) {
      toast({ title: "Descuento inválido", description: "Ingresa un porcentaje entre 0% y 100%.", variant: "destructive" })
      return false
    }
    try {
      setPlanItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, discount: itemDiscount } : item))
      )

      const res = await fetch(`/api/treatments/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount: itemDiscount })
      })

      if (!res.ok) {
        throw new Error("No se pudo actualizar el descuento de la pieza")
      }

      toast({ 
        title: "Descuento por pieza aplicado", 
        description: `Se asignó ${itemDiscount}% a esta prestación.`, 
        variant: "success" 
      })
      await refreshPlanData()
      return true
    } catch (err: any) {
      toast({
        title: "Error al actualizar descuento",
        description: err.message || "Error al comunicarse con el servidor.",
        variant: "destructive"
      })
      await refreshPlanData()
      return false
    }
  }

  const handleUpdateItemRegion = async (itemId: string, region: string) => {
    try {
      setPlanItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, tooth: region } : item))
      )

      const res = await fetch(`/api/treatments/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tooth: region })
      })

      if (!res.ok) throw new Error()
      await refreshPlanData()
    } catch (err) {
      console.error("Error al actualizar región:", err)
      await refreshPlanData()
    }
  }

  const handleAddManualProcedure = async (procedure: any, toothNum?: string) => {
    setIsAddingProcedure(true)
    try {
      const targetTooth = toothNum || targetToothOrRegion || null
      const targetSection = procedure.sectionId || null

      const res = await fetch(`/api/treatments/${initialPlan.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureName: procedure.name || procedure.procedureName,
          cost: Number(procedure.basePrice ?? procedure.price ?? procedure.cost ?? 0),
          tooth: targetTooth ? String(targetTooth) : null,
          sectionId: targetSection, 
          discount: 0
        })
      })
      if (!res.ok) throw new Error()
      const resData = await res.json()
      const newItem = resData.item || resData
      
      setPlanItems((prev) => [...prev, newItem])
      setIsCatalogModalOpen(false)
      toast({ title: "Prestación agregada", variant: "success" })
      await refreshPlanData()
      return true
    } catch {
      toast({ title: "Error al agregar", description: "No se pudo agregar la prestación.", variant: "destructive" })
      return false
    } finally {
      setIsAddingProcedure(false)
      setTargetToothOrRegion(undefined)
    }
  }

  const handleSaveEvolution = async (data?: EvolutionInput) => {
    if (!selectedItemToEvolve) return
    if (/\b(consulta|consultas|valoraci[oó]n|evaluaci[oó]n)\b/i.test(String(selectedItemToEvolve.procedureName || ""))) {
      toast({ title: "No corresponde evolución", description: "Registra la atención en la historia clínica; las consultas generales no se evolucionan como tratamientos.", variant: "destructive" })
      return
    }
    try {
      const progress = data?.progress ?? evolutionProgress
      const res = await fetch(`/api/treatments/items/${selectedItemToEvolve.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress,
          isCompleted: progress === 100,
          note: data?.note ?? evolutionNote,
          hasIncident: data?.hasIncident,
          hasAdverseEvent: data?.hasAdverseEvent,
          isPrivate: data?.isPrivate,
          fileUrl: data?.fileUrl,
          doctorId: data?.doctorId || currentUser?.id
        })
      })
      if (!res.ok) throw new Error()
      setIsEvolutionModalOpen(false)
      setSelectedItemToEvolve(null)
      toast({ title: "Evolución registrada", variant: "success" })
      await refreshPlanData()
    } catch {
      toast({ title: "Error al registrar", description: "No se pudo guardar la evolución.", variant: "destructive" })
    }
  }

  const approvalErrorMessage = (code: unknown, status: number): string => {
    const messages: Record<string, string> = {
      PLAN_EMPTY: "Agrega al menos una prestación antes de aprobar el presupuesto.",
      PLAN_NOT_FOUND: "No se encontró el presupuesto solicitado.",
      PLAN_NOT_DRAFT: "Este presupuesto ya no está pendiente de aprobación.",
      PLAN_ALREADY_APPROVED: "Este presupuesto ya fue aprobado previamente.",
      PATIENT_SIGNATURE_REQUIRED: "El paciente debe registrar su firma.",
      INVALID_DISCOUNT: "El descuento comercial no es válido.",
      INVALID_GLOBAL_DISCOUNT: "El descuento global no es válido.",
      INVALID_ITEM_AMOUNT: "Revisa los precios y descuentos de las prestaciones.",
    }
    if (typeof code === "string" && messages[code]) return messages[code]
    if (typeof code === "string" && code.trim()) return code
    if (status === 404) return "No se encontró la ruta de aprobación o el presupuesto solicitado. Revisa Network → Response."
    return `No se pudo aprobar el presupuesto (HTTP ${status}).`
  }

  const handleSaveSignature = async (base64Signature: string) => {
    if (!window.confirm("¿El paciente acepta expresamente este presupuesto y sus condiciones?")) return
    try {
      const res = await fetch(`/api/treatments/${initialPlan.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, signatureBase64: base64Signature })
      })
      if (!res.ok) {
        const result = await res.json().catch(() => null)
        throw new Error(approvalErrorMessage(result?.error ?? result?.message, res.status))
      }
      await refreshPlanData()
      toast({ title: "Presupuesto aprobado", description: "Aceptación enviada y confirmada por el servidor.", variant: "success" })
      setIsSignatureModalOpen(false)
    } catch (error) {
      toast({ title: "Error al aprobar", description: error instanceof Error ? error.message : "No se pudo registrar la aprobación.", variant: "destructive" })
    }
  }

  const handleApprovePlan = async (): Promise<boolean> => {
    if (currentPlan?.status === "ACTIVE" || currentPlan?.status === "COMPLETED") {
      toast({ title: "Presupuesto ya aprobado", description: "Este plan ya fue aprobado; no es necesario firmarlo otra vez." })
      return false
    }
    const signature = currentPlan?.patient?.signatureBase64 || patient?.signatureBase64
    if (!signature) {
      toast({ title: "Firma requerida", description: "No hay firma guardada para este paciente.", variant: "destructive" })
      return false
    }

    try {
      const res = await fetch(`/api/treatments/${initialPlan.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      })
      if (!res.ok) {
        const result = await res.json().catch(() => null)
        throw new Error(approvalErrorMessage(result?.error ?? result?.message, res.status))
      }
      await refreshPlanData()
      toast({ title: "Presupuesto aprobado", description: "La aprobación fue confirmada por el servidor.", variant: "success" })
      return true
    } catch (error) {
      toast({ title: "Error al aprobar", description: error instanceof Error ? error.message : "No se pudo aprobar el plan.", variant: "destructive" })
      return false
    }
  }

  const handleClearPlan = async () => {
    try {
      await fetch(`/api/treatments/${initialPlan.id}/clear-items`, { method: "DELETE" })
      setPlanItems([])
      setIsDeleteModalOpen(false)
      await refreshPlanData()
    } catch {}
  }

  const executeDeleteSelected = async () => {
    if (deletingRef.current) return

    const existingIds = new Set(planItems.map((item) => item.id))
    const validIds = [...new Set(itemsToDelete)].filter((id) => existingIds.has(id))

    if (validIds.length === 0) {
      setItemsToDelete([])
      setIsDeleteModalOpen(false)
      toast({
        title: "Sin prestaciones válidas",
        description: "Actualiza la selección antes de eliminar.",
        variant: "destructive",
      })
      return
    }

    deletingRef.current = true
    try {
      const response = await fetch(`/api/treatments/${initialPlan.id}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: validIds }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.error || `No se pudieron eliminar (HTTP ${response.status})`)
      }

      const deletedIds = new Set(validIds)
      setPlanItems((prev) => prev.filter((item) => !deletedIds.has(item.id)))
      setItemsToDelete([])
      setIsDeleteModalOpen(false)
      toast({ title: "Prestaciones eliminadas", variant: "success" })
      await refreshPlanData()
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "No se pudieron eliminar los ítems.",
        variant: "destructive",
      })
    } finally {
      deletingRef.current = false
    }
  }

  const handleDeleteSelected = (ids: string[]) => {
    const existingIds = new Set(planItems.map((item) => item.id))
    const validIds = [...new Set(ids)].filter((id) => existingIds.has(id))
    if (validIds.length === 0) return
    setItemsToDelete(validIds)
    setDeleteMode("SELECTED")
    setIsDeleteModalOpen(true)
  }

  const handleCreateSection = async (customName?: string) => {
    const finalName = (customName || sectionName).trim()
    if (!finalName) {
      toast({
        title: "Campo requerido",
        description: "Debes escribir el nombre de la sección o fase.",
        variant: "destructive",
      })
      return
    }
    try {
      const res = await fetch(`/api/treatments/${initialPlan?.id}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalName }),
      })

      if (res.ok) {
        const createdData = await res.json()
        const newSec = createdData.section || createdData
        setCurrentPlan((prev: any) => ({
          ...prev,
          sections: [...(prev?.sections || []), newSec]
        }))
      } else {
        const newLocalSec = { id: crypto.randomUUID(), name: finalName, treatmentPlanId: initialPlan?.id }
        setCurrentPlan((prev: any) => ({
          ...prev,
          sections: [...(prev?.sections || []), newLocalSec]
        }))
      }

      toast({
        title: "Sección creada",
        description: `Se agregó "${finalName}" al plan de tratamiento.`,
        variant: "success",
      })
      setSectionName("")
      setIsSectionModalOpen(false)
      await refreshPlanData()
    } catch (err: any) {
      toast({
        title: "Error al crear sección",
        description: err.message || "Problema de conexión con el servidor.",
        variant: "destructive",
      })
    }
  }

  return {
    state: {
      currentPlan,
      planItems,
      discountPercent,
      signedConsents,
      collaborators,
      isSectionModalOpen,
      sectionName,
      isDiscountModalOpen,
      tempDiscount,
      isCatalogModalOpen,
      catalogSearch,
      targetToothOrRegion,
      isAddingProcedure,
      isEvolutionModalOpen,
      selectedItemToEvolve,
      evolutionProgress,
      evolutionNote,
      isDiagnosisModalOpen,
      selectedDiagnosis,
      isSignatureModalOpen,
      isCollaboratorsOpen,
      isDeleteModalOpen,
      deleteMode,
      itemsToDelete,
      calculatedTotals,
    },
    setters: {
      setIsSectionModalOpen,
      setSectionName,
      setIsDiscountModalOpen,
      setTempDiscount,
      setIsCatalogModalOpen,
      setCatalogSearch,
      setTargetToothOrRegion,
      setIsEvolutionModalOpen,
      setSelectedItemToEvolve,
      setEvolutionProgress,
      setEvolutionNote,
      setIsDiagnosisModalOpen,
      setSelectedDiagnosis,
      setIsSignatureModalOpen,
      setIsCollaboratorsOpen,
      setCollaborators,
      setIsDeleteModalOpen,
      setDeleteMode,
    },
    handlers: {
      refreshPlanData,
      handleApplyDiscount,
      handleApplyAgreement,
      handleUpdateItemDiscount,
      handleUpdateItemRegion,
      handleAddManualProcedure,
      handleSaveEvolution,
      handleSaveSignature,
      handleApprovePlan,
      handleClearPlan,
      executeDeleteSelected,
      handleDeleteSelected,
      handleCreateSection,
    },
  }
}