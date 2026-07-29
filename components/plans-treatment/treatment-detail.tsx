"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ChevronLeft, Plus, CheckCircle, AlertCircle, FileSignature, Loader2, Save, Edit, FileText, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { OdontogramaTab } from "@/components/patients-file/odontogram-tab"
import { TreatmentSidebar } from "./treatment-sidebar"
import { TreatmentTable } from "./treatment-table"
import { TreatmentPlanModals } from "./treatment-plan-modals"
import { TreatmentPrintView } from "./treatment-print-view"
import { AssignCollaboratorsModal } from "./treatment-collaborators"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
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
  plan, patient, onBack, onSaveComment, isSavingComment,
}: {
  plan: TreatmentPlan; patient: any; onBack: () => void; onSaveComment: (text: string) => void; isSavingComment: boolean
}) {
  const { data: session } = useSession()
  const currentUser = session?.user as any
  const { toast } = useToast()
  const router = useRouter()

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

  // Modal de Cobro / Abono
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedItemToPay, setSelectedItemToPay] = useState<TreatmentItem | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("CASH")

  useEffect(() => { setPlanItems(plan.items || []) }, [plan.items])

  const refreshPlanData = useCallback(async () => {
    try {
      const res = await fetch(`/api/treatments?patientId=${patient?.id}`)
      if (res.ok) {
        const data = await res.json()
        const currentPlan = data.find((p: any) => p.id === plan.id)
        if (currentPlan && currentPlan.items) setPlanItems(currentPlan.items)
      }
    } catch (e) { console.error("Error al refrescar", e) }
    router.refresh()
  }, [patient?.id, plan.id, router])

  const baseTotal = planItems.reduce((acc, item) => {
    const itemDscto = item.discount || 0;
    const itemCost = item.cost || 0;
    return acc + (itemCost - (itemCost * (itemDscto / 100)));
  }, 0)

  const discountAmount = baseTotal * (discountPercent / 100)
  const finalTotalCost = baseTotal - discountAmount
  const totalPaid = planItems.reduce((acc, item) => acc + (item.paidAmount || 0), 0)
  const debt = Math.max(0, finalTotalCost - totalPaid)

  const docList = patient?.clinicalDocument || (plan as any)?.patient?.clinicalDocument || []
  const appointmentList = patient?.appointments || (plan as any)?.patient?.appointments || []
  const signedConsents = docList.filter((doc: any) => doc.patientSignature)
  
  const autoRecoveredSignature = 
    patient?.signatureBase64 || (plan as any)?.patient?.signatureBase64 ||
    (signedConsents.length > 0 ? signedConsents[0].patientSignature : null)

  const realPatientAge = calculateAge(patient?.birthDate)

  const handleSaveComments = () => { onSaveComment(commentText); setIsEditingComments(false) }
  const handleApplyDiscount = () => {
    const val = parseFloat(tempDiscount); if (!isNaN(val) && val >= 0 && val <= 100) setDiscountPercent(val)
    setIsDiscountModalOpen(false)
  }

  const openCatalogModal = async () => {
    setIsCatalogModalOpen(true)
    try {
      const res = await fetch('/api/admin/catalog'); if (res.ok) setCatalogItems((await res.json()).filter((item: any) => item.isActive))
    } catch (error) { toast({ title: "Error catálogo", variant: "destructive" }) }
  }

  const handleAddManualProcedure = async (procedure: any, toothNum?: string) => {
    setIsAddingProcedure(true)
    try {
      const res = await fetch(`/api/treatments/${plan.id}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ procedureId: procedure.id, name: procedure.name, price: procedure.basePrice, toothNumber: toothNum || null, surfaces: [] })
      });
      if (!res.ok) throw new Error();
      toast({ title: "Prestación agregada", variant: "success" });
      setIsCatalogModalOpen(false);
      await refreshPlanData();
    } catch (e) { toast({ title: "Error", variant: "destructive" }) } finally { setIsAddingProcedure(false) }
  }

  const handleClearPlan = async () => {
    try {
      const res = await fetch(`/api/treatments/${plan.id}/clear`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Presupuesto vaciado", variant: "success" });
      setIsConfirmClearOpen(false);
      await refreshPlanData();
    } catch (e) { toast({ title: "Error al vaciar", variant: "destructive" }) }
  }

  const openEvolutionModal = (item: TreatmentItem, progress: number) => { 
    setSelectedItemToEvolve(item); 
    setEvolutionProgress(progress); 
    setEvolutionNote(""); 
    setIsEvolutionModalOpen(true) 
  }

  // GUARDAR EVOLUCIÓN CON SOLICITUD DE FIRMA AUTOMÁTICA SI SE HACE AL 100%
  const handleSaveEvolution = async () => { 
    if (!selectedItemToEvolve) return;
    try {
      const res = await fetch(`/api/treatments/items/${selectedItemToEvolve.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress: evolutionProgress,
          isCompleted: evolutionProgress === 100
        })
      });

      if (!res.ok) throw new Error();

      setPlanItems(prev => prev.map(item => 
        item.id === selectedItemToEvolve.id 
          ? { ...item, progress: evolutionProgress, isCompleted: evolutionProgress === 100 } 
          : item
      ));

      setIsEvolutionModalOpen(false); 

      if (evolutionProgress === 100 && !autoRecoveredSignature) {
        toast({ 
          title: "Evolución al 100% completada", 
          description: "Se requiere la firma del paciente para validar la evolución.", 
          variant: "success" 
        });

        const signatureSection = document.getElementById("firma-conformidad-section");
        if (signatureSection) signatureSection.scrollIntoView({ behavior: "smooth" });
      } else {
        toast({ title: "Evolución registrada", description: `Progreso al ${evolutionProgress}%`, variant: "success" });
      }

      refreshPlanData();
    } catch (e) {
      toast({ title: "Error al registrar evolución", variant: "destructive" });
    }
  }

  const handleUpdateItemDiscount = async (itemId: string, discount: number) => {
    try {
      const res = await fetch(`/api/treatments/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount })
      });
      if (!res.ok) throw new Error();

      setPlanItems(prev => prev.map(item => item.id === itemId ? { ...item, discount } : item));
      toast({ title: "Descuento aplicado", description: `${discount}% de descuento en el ítem`, variant: "success" });
    } catch (e) {
      toast({ title: "Error al guardar descuento", variant: "destructive" });
    }
  }

  const handleOpenPaymentModal = (item: TreatmentItem) => {
    setSelectedItemToPay(item);
    setPaymentAmount("");
    setIsPaymentModalOpen(true);
  }

  const handleSavePayment = async () => {
    if (!selectedItemToPay) return;

    const amountVal = parseFloat(paymentAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast({ title: "Monto inválido", description: "Ingrese un valor mayor a $0.00", variant: "destructive" });
      return;
    }

    const itemCost = selectedItemToPay.cost || 0;
    const itemDscto = selectedItemToPay.discount || 0;
    const finalItemPrice = itemCost - (itemCost * (itemDscto / 100));
    const currentPaid = selectedItemToPay.paidAmount || 0;
    const pendingBalance = Math.max(0, finalItemPrice - currentPaid);

    if (amountVal > pendingBalance + 0.01) {
      toast({ 
        title: "El abono excede el saldo", 
        description: `El monto máximo a abonar para esta prestación es $${pendingBalance.toFixed(2)}`, 
        variant: "destructive" 
      });
      return;
    }

    const newPaidAmount = currentPaid + amountVal;
    const isFullyPaid = newPaidAmount >= finalItemPrice;

    try {
      const res = await fetch(`/api/treatments/items/${selectedItemToPay.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidAmount: newPaidAmount,
          isPaid: isFullyPaid
        })
      });

      if (!res.ok) throw new Error();

      setPlanItems(prev => prev.map(item => 
        item.id === selectedItemToPay.id 
          ? { ...item, paidAmount: newPaidAmount, isPaid: isFullyPaid } 
          : item
      ));

      setIsPaymentModalOpen(false);
      toast({ title: "Abono registrado", description: `Se guardó el pago de $${amountVal.toFixed(2)}`, variant: "success" });
      refreshPlanData();
    } catch (e) {
      toast({ title: "Error al registrar el pago", variant: "destructive" });
    }
  }

  const filteredCatalog = catalogItems.filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || p.category.toLowerCase().includes(catalogSearch.toLowerCase()))
  const getSignatureSrc = (base64String: string) => base64String.includes('data:image') ? base64String : `data:image/png;base64,${base64String}`

  return (
    <div className="w-full animate-in fade-in duration-500 pb-20 relative">
      
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
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
          <Button variant="outline" size="icon" onClick={onBack} className="h-9 w-9 rounded-xl border-border bg-background hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              Plan de tratamiento <span className="text-[#00b0e9] font-medium">#{plan.id?.slice(-6)?.toUpperCase()}</span>
            </h2>
            <p className="text-sm text-muted-foreground font-medium">Paciente: {patient?.firstName} {patient?.lastName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <TreatmentSidebar 
            plan={plan} patient={patient} finalTotalCost={finalTotalCost}
            discountPercent={discountPercent} setTempDiscount={setTempDiscount}
            setIsDiscountModalOpen={setIsDiscountModalOpen} totalPaid={totalPaid}
            debt={debt} handleCotizarConvenio={() => setIsMultiConvenioOpen(true)}
            setIsCollaboratorsOpen={setIsCollaboratorsOpen} collaborators={collaborators}
            appointmentList={appointmentList} planItems={planItems}
          />

          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-muted/20 border-b border-border">
                <OdontogramaTab patientId={patient?.id} planId={plan.id} isPlanView={true} onPlanUpdate={refreshPlanData} />
              </div>
            </div>

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

            {/* SECCIÓN FIRMA Y CONSENTIMIENTOS CON ANCLA */}
            <div id="firma-conformidad-section" className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
              <div className="border-b border-border pb-4 flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <CheckCircle className="w-5 h-5 text-emerald-500" /> Firma del paciente
                  </h4>
                  <p className="text-xs text-muted-foreground">(Se incluirán en la impresión de evoluciones)</p>
                </div>
              </div>

              {autoRecoveredSignature ? (
                 <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                   <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center h-20 w-40">
                     <img src={getSignatureSrc(autoRecoveredSignature)} alt="Firma" className="max-h-full max-w-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                   </div>
                   <div>
                     <p className="font-extrabold text-emerald-800 dark:text-emerald-400 text-sm mb-0.5">Firma recuperada automáticamente</p>
                     <p className="text-xs text-emerald-600/80 dark:text-emerald-500 font-medium">El sistema ha vinculado una firma válida de los registros clínicos previos del paciente.</p>
                   </div>
                 </div>
              ) : (
                 <div className="p-8 bg-slate-50/50 dark:bg-muted/10 border border-border rounded-xl text-center space-y-3">
                   <p className="text-sm font-semibold text-muted-foreground">Hay 1 documento pendiente por firmar</p>
                   <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-6 rounded-xl shadow-sm">
                     <FileSignature className="w-4 h-4 mr-2"/> Solicitar firma
                   </Button>
                 </div>
              )}

              <div className="border-t border-border pt-6">
                <h5 className="font-bold text-sm mb-3 flex items-center gap-2 text-foreground"><FileText className="w-4 h-4 text-muted-foreground"/> Consentimientos Informados</h5>
                {signedConsents.length > 0 ? (
                   <div className="space-y-2 mb-4">
                     {signedConsents.map((doc: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-muted/20 border border-border rounded-lg">
                          <span className="text-sm font-semibold text-foreground">{doc.title || "Consentimiento Informado"}</span>
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">Firmado</span>
                        </div>
                     ))}
                   </div>
                ) : ( <p className="text-sm text-muted-foreground mb-4">No se han registrado consentimientos firmados para este paciente.</p> )}
                
                <Link href={`/paciente/${patient.id}?tab=consentimientos`}>
                  <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 bg-transparent font-medium rounded-lg">
                    <Plus className="w-4 h-4 mr-1.5"/> Redactar nuevo consentimiento
                  </Button>
                </Link>
              </div>

              {/* COMENTARIOS */}
              <div className="border-t border-border pt-6">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h5 className="font-bold text-sm text-foreground">Comentarios para el paciente</h5>
                    <p className="text-xs text-muted-foreground">Se incluirán en la impresión de presupuestos</p>
                  </div>

                  {isEditingComments ? (
                    <Button onClick={handleSaveComments} disabled={isSavingComment} size="sm" className="bg-[#00b0e9] hover:bg-[#0095c6] text-white shadow-sm rounded-xl h-8 px-4 font-bold">
                      {isSavingComment ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />} Guardar
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingComments(true)} className="text-[#00b0e9] hover:bg-[#00b0e9]/10 rounded-xl h-8 px-4 font-bold">
                      <Edit className="w-3 h-3 mr-1.5" /> Editar
                    </Button>
                  )}
                </div>
                
                {isEditingComments ? (
                  <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} className="min-h-[120px] bg-background border-border rounded-xl shadow-inner focus-visible:ring-[#00b0e9] resize-none p-4 text-sm font-medium" placeholder="Recomendaciones post-tratamiento, condiciones de validez del presupuesto..." />
                ) : (
                  <div className="p-4 bg-muted/10 rounded-xl border border-border min-h-[80px] text-sm text-foreground/80 leading-relaxed shadow-sm">
                    {commentText || <span className="italic text-muted-foreground">Validez del plan de tratamiento por 30 días. Plan sujeto a evaluación clínica.</span>}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* MODALES CON PERMISOS Y PLANTILLAS REALES */}
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
            <AlertDialogAction onClick={handleClearPlan} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl h-11 px-6 shadow-sm">Sí, Vaciar Presupuesto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}