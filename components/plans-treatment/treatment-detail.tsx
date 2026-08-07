"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { ChevronLeft, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { OdontogramaTab } from "@/components/patients-file/odontogram-tab"
import { TreatmentSidebar } from "./treatment-sidebar"
import { TreatmentTable } from "./treatment-table"
import { TreatmentPlanModals } from "./treatment-plan-modals"
import { TreatmentPrintView } from "./treatment-print-view"
import { AssignCollaboratorsModal } from "./treatment-collaborators"
import { SignaturePadModal } from "./signature-modal"
import { TreatmentExtraSection } from "./treatment-extra"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { TreatmentPlan, TreatmentItem } from "@/types/treatments"

const calculateAge = (birthDateString?: string | Date | null) => {
  if (!birthDateString) return ""
  const today = new Date()
  const birthDate = new Date(birthDateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

export function TreatmentPlanDetail({
  plan, 
  patient, 
  onBack, 
  onSaveComment, 
  isSavingComment,
}: {
  plan: TreatmentPlan; 
  patient: any; 
  onBack: () => void; 
  onSaveComment: (text: string) => void; 
  isSavingComment: boolean
}) {
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
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false)

  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false)
  const [collaborators, setCollaborators] = useState<string[]>([])
  const [isMultiConvenioOpen, setIsMultiConvenioOpen] = useState(false)
  const [printMode, setPrintMode] = useState<string>("COMPLETO")

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [patientSignature, setPatientSignature] = useState<string | null>(
    patient?.signatureBase64 || (plan as any)?.patient?.signatureBase64 || null
  )
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedItemToPay, setSelectedItemToPay] = useState<TreatmentItem | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("CASH")

  useEffect(() => { 
    setPlanItems(plan.items || []) 
  }, [plan.items])

  // REFRESH LOCAL SIN RERENDERIZAR RUTA ENTERA (Evita refrescar citas)
  const refreshPlanData = useCallback(async () => {
    try {
      const res = await fetch(`/api/treatments?patientId=${patient?.id}`)
      if (res.ok) {
        const data = await res.json()
        const currentPlan = data.find((p: any) => p.id === plan.id)
        if (currentPlan && currentPlan.items) setPlanItems(currentPlan.items)
      }
    } catch (e) { 
      console.error("Error al refrescar plan", e) 
    }
  }, [patient?.id, plan.id])

  const baseTotal = planItems.reduce((acc, item) => {
    const itemDscto = item.discount || 0
    const itemCost = item.cost || 0
    return acc + (itemCost - (itemCost * (itemDscto / 100)))
  }, 0)

  const discountAmount = baseTotal * (discountPercent / 100)
  const finalTotalCost = baseTotal - discountAmount
  const totalPaid = planItems.reduce((acc, item) => acc + (item.paidAmount || 0), 0)
  const debt = Math.max(0, finalTotalCost - totalPaid)

  const docList = patient?.clinicalDocument || (plan as any)?.patient?.clinicalDocument || []
  const signedConsents = docList.filter((doc: any) => doc.patientSignature)
  
  const autoRecoveredSignature = 
    patientSignature ||
    patient?.signatureBase64 || 
    (signedConsents.length > 0 ? signedConsents[0].patientSignature : null)

  const hasCompletedItems = planItems.some(
    (item) => item.isCompleted || item.progress === 100
  )
  const isSignaturePending = hasCompletedItems && !autoRecoveredSignature

  const realPatientAge = calculateAge(patient?.birthDate)

  const handleSaveComments = () => { 
    onSaveComment(commentText)
    setIsEditingComments(false) 
  }

  const handleApplyDiscount = () => {
    const val = parseFloat(tempDiscount)
    if (!isNaN(val) && val >= 0 && val <= 100) setDiscountPercent(val)
    setIsDiscountModalOpen(false)
  }

  const openCatalogModal = async () => {
    setIsCatalogModalOpen(true)
    try {
      const res = await fetch('/api/admin/catalog')
      if (res.ok) setCatalogItems((await res.json()).filter((item: any) => item.isActive))
    } catch (error) { 
      toast({ title: "Error catálogo", variant: "destructive" }) 
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
          name: procedure.name, 
          price: procedure.basePrice, 
          toothNumber: toothNum || null, 
          surfaces: [] 
        })
      })
      if (!res.ok) throw new Error()
      toast({ title: "Prestación agregada", variant: "success" })
      setIsCatalogModalOpen(false)
      await refreshPlanData()
        toast({ title: "Error", variant: "destructive" }) 
    } catch (e) { 
      toast({ title: "Error", variant: "destructive" }) 
    } finally { 
      setIsAddingProcedure(false) 
    }
  }

  const handleClearPlan = async () => {
    try {
      const res = await fetch(`/api/treatments/${plan.id}/clear`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Presupuesto vaciado", variant: "success" })
      setIsConfirmClearOpen(false)
      await refreshPlanData()
    } catch (e) { 
      toast({ title: "Error al vaciar", variant: "destructive" }) 
    }
  }

  const openEvolutionModal = (item: TreatmentItem, progress: number) => { 
    setSelectedItemToEvolve(item)
    setEvolutionProgress(progress)
    setEvolutionNote("")
    setIsEvolutionModalOpen(true) 
  }

  const handleSaveEvolution = async () => { 
    if (!selectedItemToEvolve) return
    try {
      const res = await fetch(`/api/treatments/items/${selectedItemToEvolve.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress: evolutionProgress,
          isCompleted: evolutionProgress === 100
        })
      })

      if (!res.ok) throw new Error()

      setPlanItems(prev => prev.map(item => 
        item.id === selectedItemToEvolve.id 
          ? { ...item, progress: evolutionProgress, isCompleted: evolutionProgress === 100 } 
          : item
      ))

      setIsEvolutionModalOpen(false) 
      refreshPlanData()
    } catch (e) {
      toast({ title: "Error al registrar evolución", variant: "destructive" })
    }
  }

  const handleUpdateItemDiscount = async (itemId: string, discount: number) => {
    try {
      const res = await fetch(`/api/treatments/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount })
      })
      if (!res.ok) throw new Error()

      setPlanItems(prev => prev.map(item => item.id === itemId ? { ...item, discount } : item))
      toast({ title: "Descuento aplicado", variant: "success" })
    } catch (e) {
      toast({ title: "Error al guardar descuento", variant: "destructive" })
    }
  }

  const handleOpenPaymentModal = (item: TreatmentItem) => {
    setSelectedItemToPay(item)
    setPaymentAmount("")
    setIsPaymentModalOpen(true)
  }

  const handleSavePayment = async () => {
    if (!selectedItemToPay) return
    const amountVal = parseFloat(paymentAmount)
    if (isNaN(amountVal) || amountVal <= 0) return

    const itemCost = selectedItemToPay.cost || 0
    const itemDscto = selectedItemToPay.discount || 0
    const finalItemPrice = itemCost - (itemCost * (itemDscto / 100))
    const currentPaid = selectedItemToPay.paidAmount || 0
    const newPaidAmount = currentPaid + amountVal
    const isFullyPaid = newPaidAmount >= finalItemPrice

    try {
      const res = await fetch(`/api/treatments/items/${selectedItemToPay.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: newPaidAmount, isPaid: isFullyPaid })
      })

      if (!res.ok) throw new Error()

      setPlanItems(prev => prev.map(item => 
        item.id === selectedItemToPay.id 
          ? { ...item, paidAmount: newPaidAmount, isPaid: isFullyPaid } 
          : item
      ))

      setIsPaymentModalOpen(false)
      toast({ title: "Abono registrado", variant: "success" })
      refreshPlanData()
    } catch (e) {
      toast({ title: "Error al registrar pago", variant: "destructive" })
    }
  }

  const handleSaveSignature = async (base64Signature: string) => {
    setPatientSignature(base64Signature)
    try {
      await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureBase64: base64Signature })
      })
      toast({ title: "Firma vinculada con éxito", variant: "success" })
    } catch (e) {
      console.error("Error al vincular firma", e)
    }
  }

  const filteredCatalog = catalogItems.filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || p.category.toLowerCase().includes(catalogSearch.toLowerCase()))
  const getSignatureSrc = (base64String: string) => base64String.includes('data:image') ? base64String : `data:image/png;base64,${base64String}`

  return (
    <div className="w-full animate-in fade-in duration-500 pb-20 relative">
      
      {/* VISTA DE IMPRESIÓN OCULTA */}
      <TreatmentPrintView 
        plan={{ ...plan, items: planItems }} 
        patient={patient} 
        patientAge={realPatientAge} 
        baseTotal={baseTotal} 
        discountPercent={discountPercent} 
        discountAmount={discountAmount} 
        finalTotalCost={finalTotalCost} 
        commentText={commentText} 
        autoRecoveredSignature={autoRecoveredSignature} 
        getSignatureSrc={getSignatureSrc} 
        printMode={printMode}
      />

      <div className="print-hidden">
        {/* CABECERA */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
          <Button variant="outline" size="icon" onClick={onBack} className="h-9 w-9 rounded-xl border-border bg-background hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              Plan de tratamiento <span className="text-[#008bcd] font-medium">#{plan.id?.slice(-6)?.toUpperCase()}</span>
            </h2>
            <p className="text-sm text-muted-foreground font-medium">Paciente: {patient?.firstName} {patient?.lastName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SIDEBAR DE CITAS Y MÉTRICAS */}
          <TreatmentSidebar 
            plan={plan} 
            patient={patient} 
            finalTotalCost={finalTotalCost}
            discountPercent={discountPercent} 
            setTempDiscount={setTempDiscount}
            setIsDiscountModalOpen={setIsDiscountModalOpen} 
            totalPaid={totalPaid}
            debt={debt} 
            handleCotizarConvenio={() => setIsMultiConvenioOpen(true)}
            setIsCollaboratorsOpen={setIsCollaboratorsOpen} 
            collaborators={collaborators}
            appointmentList={patient?.appointments || patient?.citas || []} 
            planItems={planItems}
          />

          {/* PANEL PRINCIPAL */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-muted/20 border-b border-border">
                <OdontogramaTab patientId={patient?.id} planId={plan.id} isPlanView={true} onPlanUpdate={refreshPlanData} />
              </div>
            </div>

            {/* TABLA DE PRESTACIONES */}
            <TreatmentTable 
              planItems={planItems}
              setIsSectionModalOpen={setIsSectionModalOpen}
              openCatalogModal={openCatalogModal}
              setIsDiagnosisModalOpen={setIsDiagnosisModalOpen}
              setIsConfirmClearOpen={setIsConfirmClearOpen}
              openEvolutionModal={openEvolutionModal}
              onUpdateItemDiscount={handleUpdateItemDiscount}
              onSelectPrintMode={(mode: string) => setPrintMode(mode)}
              onOpenPaymentModal={handleOpenPaymentModal}
            />

            {/* COMPONENTE EXTRA EXTRAÍDO */}
            <TreatmentExtraSection 
              patient={patient}
              autoRecoveredSignature={autoRecoveredSignature}
              isSignaturePending={isSignaturePending}
              getSignatureSrc={getSignatureSrc}
              setIsSignatureModalOpen={setIsSignatureModalOpen}
              signedConsents={signedConsents}
              commentText={commentText}
              setCommentText={setCommentText}
              isEditingComments={isEditingComments}
              setIsEditingComments={setIsEditingComments}
              handleSaveComments={handleSaveComments}
              isSavingComment={isSavingComment}
            />
          </div>
        </div>
      </div>

      {/* MODALES DEL PLAN */}
      <TreatmentPlanModals 
        plan={{ ...plan, items: planItems }} patient={patient} currentUser={currentUser}
        isSectionModalOpen={isSectionModalOpen} setIsSectionModalOpen={setIsSectionModalOpen} sectionName={sectionName} setSectionName={setSectionName} handleAddSection={() => setIsSectionModalOpen(false)}
        isDiscountModalOpen={isDiscountModalOpen} setIsDiscountModalOpen={setIsDiscountModalOpen} tempDiscount={tempDiscount} setTempDiscount={setTempDiscount} handleApplyDiscount={handleApplyDiscount}
        isCatalogModalOpen={isCatalogModalOpen} setIsCatalogModalOpen={setIsCatalogModalOpen} catalogSearch={catalogSearch} setCatalogSearch={setCatalogSearch} filteredCatalog={filteredCatalog} handleAddManualProcedure={handleAddManualProcedure} isAddingProcedure={isAddingProcedure}
        isEvolutionModalOpen={isEvolutionModalOpen} setIsEvolutionModalOpen={setIsEvolutionModalOpen} evolutionProgress={evolutionProgress} selectedItemToEvolve={selectedItemToEvolve} evolutionNote={evolutionNote} setEvolutionNote={setEvolutionNote} handleSaveEvolution={handleSaveEvolution}
        isDiagnosisModalOpen={isDiagnosisModalOpen} setIsDiagnosisModalOpen={setIsDiagnosisModalOpen} selectedDiagnosis={selectedDiagnosis} setSelectedDiagnosis={setSelectedDiagnosis} handleSaveDiagnosis={() => setIsDiagnosisModalOpen(false)}
        isMultiConvenioOpen={isMultiConvenioOpen} setIsMultiConvenioOpen={setIsMultiConvenioOpen} onApplyMultiConvenio={(dsctoVal: number) => setDiscountPercent(dsctoVal)}
        isPaymentModalOpen={isPaymentModalOpen} setIsPaymentModalOpen={setIsPaymentModalOpen} selectedItemToPay={selectedItemToPay} paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} handleSavePayment={handleSavePayment}
      />

      {/* FIRMA Y VACIAR */}
      <SignaturePadModal isOpen={isSignatureModalOpen} setIsOpen={setIsSignatureModalOpen} onSaveSignature={handleSaveSignature} patientName={`${patient?.firstName || ''} ${patient?.lastName || ''}`} />
      <AssignCollaboratorsModal isOpen={isCollaboratorsOpen} setIsOpen={setIsCollaboratorsOpen} doctorsList={[]} currentCollaborators={collaborators} onSaveCollaborators={(sel) => setCollaborators(sel)} />

      <AlertDialog open={isConfirmClearOpen} onOpenChange={setIsConfirmClearOpen}>
        <AlertDialogContent className="bg-card border-border rounded-[24px] shadow-2xl sm:max-w-[420px]">
          <AlertDialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-foreground">¿Vaciar todo el presupuesto?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">Esta acción eliminará de forma permanente todas las prestaciones cargadas a este plan de tratamiento.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="w-full flex sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="border-border hover:bg-accent text-foreground font-bold rounded-xl h-11 px-5">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearPlan} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl h-11 px-6 shadow-xs">Sí, Vaciar Presupuesto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}