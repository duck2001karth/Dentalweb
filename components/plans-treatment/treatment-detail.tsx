"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

import { OdontogramaTab } from "@/components/patients-file/odontogram-tab"
import { TreatmentSidebar } from "./treatment-sidebar"
import { TreatmentTable } from "./treatment-table"
import { TreatmentPrintView } from "./treatment-print-view"
import { TreatmentExtraSection } from "./treatment-extra"
import { TreatmentDetailHeader } from "./treatment-detail-header"
import { TreatmentDetailDialogs } from "./treatment-detail-dialogs"
import { TreatmentPlan, TreatmentItem, EvolutionInput } from "@/types/treatments"

interface TreatmentPlanDetailProps {
  plan: TreatmentPlan
  patient: any
  onBack: () => void
  onSaveComment: (text: string) => void
  isSavingComment: boolean
  onPlanUpdate?: () => void
}

export function TreatmentPlanDetail({
  plan,
  patient,
  onBack,
  onSaveComment,
  isSavingComment,
  onPlanUpdate
}: TreatmentPlanDetailProps) {
  const { data: session } = useSession()
  const currentUser = session?.user as any
  const { toast } = useToast()

  const [planItems, setPlanItems] = useState<TreatmentItem[]>(plan.items || [])
  const [isEditingComments, setIsEditingComments] = useState(false)
  const [commentText, setCommentText] = useState(plan.commentsToPatient || "")
  
  const [discountPercent, setDiscountPercent] = useState(0)
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
  const [tempDiscount, setTempDiscount] = useState("0")

  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
  const [catalogItems, setCatalogItems] = useState<any[]>([])
  const [catalogSearch, setCatalogSearch] = useState("")
  const [isAddingProcedure, setIsAddingProcedure] = useState(false)

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [sectionName, setSectionName] = useState("")

  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false)
  const [evolutionProgress, setEvolutionProgress] = useState(0)
  const [selectedItemToEvolve, setSelectedItemToEvolve] = useState<TreatmentItem | null>(null)
  const [evolutionNote, setEvolutionNote] = useState("")

  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("")

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteMode, setDeleteMode] = useState<"ALL" | "SELECTED">("ALL")
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([])

  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false)
  const [collaborators, setCollaborators] = useState<string[]>([])
  const [printMode, setPrintMode] = useState<string>("COMPLETO")

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [planSignature, setPlanSignature] = useState<string | null>(
    plan.status === "ACTIVE" ? ((plan as any).signatureBase64 || null) : null
  )

  useEffect(() => { 
    setPlanItems(plan.items || []) 
  }, [plan.items])

  const refreshPlanData = useCallback(async () => {
    try {
      const res = await fetch(`/api/treatments?patientId=${patient?.id}`)
      if (res.ok) {
        const data = await res.json()
        const currentPlan = data.find((p: any) => p.id === plan.id)
        if (currentPlan && currentPlan.items) setPlanItems(currentPlan.items)
      }
      if (onPlanUpdate) onPlanUpdate()
    } catch (e) { 
      console.error("Error al refrescar plan", e) 
    }
  }, [patient?.id, plan.id, onPlanUpdate])

  const docList = patient?.clinicalDocument || (plan as any)?.patient?.clinicalDocument || []
  const signedConsents = docList.filter((doc: any) => doc.patientSignature)

  const { baseTotal, discountAmount, finalTotalCost, totalPaid, debt } = useMemo(() => {
    const calcBase = planItems.reduce((acc, item) => {
      const cost = item.cost || 0
      const dscto = item.discount || 0
      return acc + (cost - (cost * (dscto / 100)))
    }, 0)
    
    const calcDisc = calcBase * (discountPercent / 100)
    const calcFinal = calcBase - calcDisc
    const calcPaid = planItems.reduce((acc, item) => acc + (item.paidAmount || 0), 0)

    return { 
      baseTotal: calcBase, 
      discountAmount: calcDisc, 
      finalTotalCost: calcFinal, 
      totalPaid: calcPaid, 
      debt: Math.max(0, calcFinal - calcPaid) 
    }
  }, [planItems, discountPercent])

  const handleApproveWithSavedSignature = async () => {
    const savedSig = 
      patient?.signatureBase64 || 
      patient?.signature || 
      patient?.patientSignature ||
      (plan as any)?.patient?.signatureBase64 ||
      (signedConsents.length > 0 ? signedConsents[0].patientSignature : null)

    if (!savedSig) {
      setIsSignatureModalOpen(true)
      return
    }

    await handleSaveSignature(savedSig)
  }

  const handleSaveSignature = async (base64Signature: string) => {
    setPlanSignature(base64Signature)
    try {
      await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureBase64: base64Signature })
      })

      const res = await fetch(`/api/treatments/${plan.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureBase64: base64Signature })
      })

      if (!res.ok) throw new Error()

      toast({ title: "Plan Aprobado y Activado", variant: "success" })
      await refreshPlanData()
    } catch (e) { 
      toast({ title: "Error al activar el plan", variant: "destructive" }) 
    }
  }

  const openCatalogModal = async () => {
    setIsCatalogModalOpen(true)
    try {
      const res = await fetch('/api/admin/catalog')
      if (res.ok) {
        const data = await res.json()
        setCatalogItems(data.filter((item: any) => item.isActive))
      }
    } catch (e) {
      toast({ title: "Error al obtener el catálogo", variant: "destructive" })
    }
  }

  const handleAddManualProcedure = async (procedure: any, toothNum?: string) => {
    setIsAddingProcedure(true)
    try {
      const res = await fetch(`/api/treatments/${plan.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureId: procedure.id,
          procedureName: procedure.name || procedure.procedureName,
          cost: procedure.basePrice || procedure.price || 0,
          tooth: toothNum || null
        })
      })

      if (!res.ok) throw new Error()

      toast({ title: "Prestación agregada exitosamente", variant: "success" })
      setIsCatalogModalOpen(false)
      await refreshPlanData()
    } catch (e) {
      toast({ title: "Error al agregar prestación", variant: "destructive" })
    } finally {
      setIsAddingProcedure(false)
    }
  }

  const executeDeleteSelected = async () => {
    try {
      const res = await fetch(`/api/treatments/${plan.id}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: itemsToDelete })
      })

      if (!res.ok) throw new Error()

      toast({ title: "Prestaciones eliminadas", variant: "success" })
      setIsDeleteModalOpen(false)
      await refreshPlanData()
    } catch (e) {
      toast({ title: "Error al eliminar ítems", variant: "destructive" })
    }
  }

  const handleClearPlan = async () => {
    try {
      const res = await fetch(`/api/treatments/${plan.id}/clear`, { method: "DELETE" })
      if (!res.ok) throw new Error()

      toast({ title: "Presupuesto vaciado correctamente", variant: "success" })
      setIsDeleteModalOpen(false)
      await refreshPlanData()
    } catch (e) {
      toast({ title: "Error al vaciar presupuesto", variant: "destructive" })
    }
  }

  const handleSaveEvolution = async (evolutionData?: EvolutionInput) => {
    if (!selectedItemToEvolve) return
    const prog = evolutionData?.progress ?? evolutionProgress

    try {
      const res = await fetch(`/api/treatments/items/${selectedItemToEvolve.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress: prog,
          isCompleted: prog === 100,
          note: evolutionData?.note ?? evolutionNote
        })
      })

      if (!res.ok) throw new Error()

      toast({ title: "Evolución registrada correctamente", variant: "success" })
      setIsEvolutionModalOpen(false)
      await refreshPlanData()
    } catch (e) {
      toast({ title: "Error al registrar la evolución", variant: "destructive" })
    }
  }

  const filteredCatalog = catalogItems.filter((p: any) => 
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(catalogSearch.toLowerCase())
  )

  const getSignatureSrc = (b64: string) => 
    b64.includes('data:image') ? b64 : `data:image/png;base64,${b64}`

  return (
    <div className="w-full animate-in fade-in duration-300 pb-20 relative font-sans antialiased">
      <TreatmentPrintView 
        plan={{ ...plan, items: planItems }} 
        patient={patient} 
        patientAge="" 
        baseTotal={baseTotal} 
        discountPercent={discountPercent} 
        discountAmount={discountAmount} 
        finalTotalCost={finalTotalCost} 
        commentText={commentText} 
        autoRecoveredSignature={planSignature} 
        getSignatureSrc={getSignatureSrc} 
        printMode={printMode} 
      />

      <div className="print-hidden space-y-6">
        {/* NAVEGACIÓN Y TÍTULOS */}
        <TreatmentDetailHeader 
          planId={plan.id} 
          patient={patient} 
          onBack={onBack} 
        />

        {/* ESTRUCTURA GRID 12 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SIDEBAR AZUL (COLUMNA IZQUIERDA - 3/12) */}
          <div className="lg:col-span-4 xl:col-span-3">
            <TreatmentSidebar 
              plan={plan} 
              patient={patient} 
              finalTotalCost={finalTotalCost} 
              discountPercent={discountPercent} 
              setTempDiscount={setTempDiscount} 
              setIsDiscountModalOpen={setIsDiscountModalOpen} 
              totalPaid={totalPaid} 
              debt={debt} 
              setIsCollaboratorsOpen={setIsCollaboratorsOpen} 
              collaborators={collaborators} 
              appointmentList={patient?.appointments || []} 
              planItems={planItems} 
            />
          </div>

          {/* COLUMNA DERECHA PRINCIPAL (9/12) */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            
            {/* ODONTOGRAMA DENTRO DE LA COLUMNA DERECHA */}
            <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
              <div className="p-4 bg-muted/20 border-b border-border/80">
                <OdontogramaTab 
                  patientId={patient?.id} 
                  planId={plan.id} 
                  isPlanView={true} 
                  onPlanUpdate={refreshPlanData} 
                />
              </div>
            </div>

            {/* TABLA DE PRESTACIONES */}
            <TreatmentTable 
              planItems={planItems} 
              setIsSectionModalOpen={setIsSectionModalOpen} 
              openCatalogModal={openCatalogModal} 
              setIsDiagnosisModalOpen={setIsDiagnosisModalOpen} 
              setIsConfirmClearOpen={() => { 
                setDeleteMode("ALL")
                setIsDeleteModalOpen(true) 
              }} 
              onDeleteSelectedItems={(selectedIds: string[]) => {
                setItemsToDelete(selectedIds)
                setDeleteMode("SELECTED")
                setIsDeleteModalOpen(true)
              }} 
              openEvolutionModal={(item: TreatmentItem, prog: number) => {
                setSelectedItemToEvolve(item)
                setEvolutionProgress(prog)
                setIsEvolutionModalOpen(true)
              }} 
              onUpdateItemDiscount={async (itemId: string, discount: number) => {
                await fetch(`/api/treatments/items/${itemId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ discount })
                })
                refreshPlanData()
              }} 
              onUpdateItemRegion={async (itemId: string, regionName: string) => {
                await fetch(`/api/treatments/items/${itemId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ tooth: regionName })
                })
                refreshPlanData()
              }} 
              onSelectPrintMode={setPrintMode} 
            />

            {/* SECCIÓN DE FIRMA Y CONSENTIMIENTOS */}
            <TreatmentExtraSection 
              patient={patient} 
              plan={plan} 
              planSignature={planSignature} 
              setIsSignatureModalOpen={setIsSignatureModalOpen} 
              signedConsents={signedConsents} 
              commentText={commentText} 
              setCommentText={setCommentText} 
              isEditingComments={isEditingComments} 
              setIsEditingComments={setIsEditingComments} 
              handleSaveComments={() => { 
                onSaveComment(commentText)
                setIsEditingComments(false) 
              }} 
              isSavingComment={isSavingComment} 
              onApproveWithSavedSignature={handleApproveWithSavedSignature} 
            />
          </div>
        </div>
      </div>

      <TreatmentDetailDialogs 
        plan={plan} 
        patient={patient} 
        currentUser={currentUser} 
        planItems={planItems} 
        isSectionModalOpen={isSectionModalOpen} 
        setIsSectionModalOpen={setIsSectionModalOpen} 
        sectionName={sectionName} 
        setSectionName={setSectionName} 
        isDiscountModalOpen={isDiscountModalOpen} 
        setIsDiscountModalOpen={setIsDiscountModalOpen} 
        tempDiscount={tempDiscount} 
        setTempDiscount={setTempDiscount} 
        handleApplyDiscount={() => { 
          setDiscountPercent(parseFloat(tempDiscount) || 0)
          setIsDiscountModalOpen(false) 
        }} 
        isCatalogModalOpen={isCatalogModalOpen} 
        setIsCatalogModalOpen={setIsCatalogModalOpen} 
        catalogSearch={catalogSearch} 
        setCatalogSearch={setCatalogSearch} 
        filteredCatalog={filteredCatalog} 
        handleAddManualProcedure={handleAddManualProcedure} 
        isAddingProcedure={isAddingProcedure} 
        isEvolutionModalOpen={isEvolutionModalOpen} 
        setIsEvolutionModalOpen={setIsEvolutionModalOpen} 
        evolutionProgress={evolutionProgress} 
        selectedItemToEvolve={selectedItemToEvolve} 
        evolutionNote={evolutionNote} 
        setEvolutionNote={setEvolutionNote} 
        handleSaveEvolution={handleSaveEvolution} 
        isDiagnosisModalOpen={isDiagnosisModalOpen} 
        setIsDiagnosisModalOpen={setIsDiagnosisModalOpen} 
        selectedDiagnosis={selectedDiagnosis} 
        setSelectedDiagnosis={setSelectedDiagnosis} 
        isSignatureModalOpen={isSignatureModalOpen} 
        setIsSignatureModalOpen={setIsSignatureModalOpen} 
        handleSaveSignature={handleSaveSignature} 
        isCollaboratorsOpen={isCollaboratorsOpen} 
        setIsCollaboratorsOpen={setIsCollaboratorsOpen} 
        collaborators={collaborators} 
        setCollaborators={setCollaborators} 
        isDeleteModalOpen={isDeleteModalOpen} 
        setIsDeleteModalOpen={setIsDeleteModalOpen} 
        deleteMode={deleteMode} 
        handleClearPlan={handleClearPlan} 
        executeDeleteSelected={executeDeleteSelected} 
        itemsToDelete={itemsToDelete} 
      />
    </div>
  )
}