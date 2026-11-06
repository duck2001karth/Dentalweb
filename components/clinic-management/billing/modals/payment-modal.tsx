"use client"

import React, { useState, useEffect, useRef } from "react"
import { DollarSign, Loader2, AlertCircle, Banknote, ArrowLeftRight, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { PaymentAuditForm } from "../tables/payment-audit-form"
import { PaymentPatientTargetForm } from "../tables/payment-patient-form"
import type { PaymentFormData, PaymentMethod, PaymentRecord, PaymentState } from "@/types/billing"
import { cn } from "@/lib/utils"
import { useClinicSettings } from "@/config/clinic-settings"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  editingPayment?: PaymentRecord | null
  prefilledData?: { patientId: string; planId: string; amount: number } | null
  patients: any[]
  isSaving: boolean
  onSave: (data: PaymentFormData) => Promise<boolean>
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: any }[] = [
  { id: "CASH", label: "Efectivo", icon: Banknote },
  { id: "TRANSFER", label: "Transferencia", icon: ArrowLeftRight },
  { id: "CREDIT_CARD", label: "T. Crédito", icon: CreditCard },
  { id: "DEBIT_CARD", label: "T. Débito", icon: CreditCard },
]

export function PaymentModal({
  isOpen,
  onClose,
  editingPayment,
  prefilledData,
  patients = [],
  isSaving,
  onSave
}: PaymentModalProps) {
  const { settings } = useClinicSettings()
  const currencySymbol = (settings as any)?.currencySymbol || "$"
  const isEditing = Boolean(editingPayment)
  
  const [patientSearchQuery, setPatientSearchQuery] = useState("")
  const [isLoadingReceipt] = useState(false)
  const [isManualReceipt, setIsManualReceipt] = useState(false)
  const submitLock = useRef(false)
  const [localSubmitting, setLocalSubmitting] = useState(false)
  const [autoReceiptNumber, setAutoReceiptNumber] = useState("")
  
  const [reference, setReference] = useState("")
  const [cardType, setCardType] = useState<"CORRIENTE" | "DIFERIDO">("CORRIENTE")
  const [installments, setInstallments] = useState("3")
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  
  const [showErrors, setShowErrors] = useState(false)
  const [paymentType, setPaymentType] = useState<"GENERAL" | "PLAN">("GENERAL")
  const [patientPlans, setPatientPlans] = useState<any[]>([])
  const [selectedPatientObj, setSelectedPatientObj] = useState<any>(null)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  
  const [formData, setFormData] = useState<PaymentFormData & { treatmentPlanId?: string }>({
    patientId: "",
    treatmentPlanId: undefined,
    amount: "",
    method: "CASH",
    status: "COMPLETED",
    receiptNumber: "",
    notes: ""
  })

  // INICIALIZACIÓN
  useEffect(() => {
    setShowErrors(false)
    if (editingPayment) {
      const planId = (editingPayment as any).treatmentPlanId || undefined
      const rawNotes = editingPayment.notes || ""
      const isJsonNotes = typeof rawNotes === "string" && rawNotes.trim().startsWith("[{")
      const cleanNotes = isJsonNotes ? "" : rawNotes.replace(/\[.*?\]/g, "").trim()
      
      setFormData({
        patientId: editingPayment.patient?.id || "",
        treatmentPlanId: planId,
        amount: String(editingPayment.amount || ""),
        method: editingPayment.method,
        status: editingPayment.status,
        receiptNumber: editingPayment.receiptNumber || "",
        notes: cleanNotes,
      })
      setPaymentType(planId ? "PLAN" : "GENERAL")
      setReference(editingPayment.reference || "")
      setReceiptImage(editingPayment.receiptImage || null)
      setPatientSearchQuery(`${editingPayment.patient?.firstName || ""} ${editingPayment.patient?.lastName || ""} - CI: ${editingPayment.patient?.ci || ""}`)
      setIsManualReceipt(true)
    } else if (prefilledData && isOpen) {
      const pt = patients.find(p => p.id === prefilledData.patientId)
      setFormData({
        patientId: prefilledData.patientId,
        treatmentPlanId: prefilledData.planId,
        amount: String(prefilledData.amount),
        method: "CASH",
        status: "COMPLETED",
        receiptNumber: "",
        notes: "",
      })
      setPaymentType("PLAN")
      setReference("")
      setCardType("CORRIENTE")
      setReceiptImage(null)
      setIsManualReceipt(false)
      if (pt) {
        setPatientSearchQuery(`${pt.firstName} ${pt.lastName} - CI: ${pt.ci || ""}`)
      }
    } else if (isOpen) {
      setFormData({
        patientId: "",
        treatmentPlanId: undefined,
        amount: "",
        method: "CASH",
        status: "COMPLETED",
        receiptNumber: "",
        notes: "",
      })
      setReference("")
      setCardType("CORRIENTE")
      setInstallments("3")
      setReceiptImage(null)
      setPatientSearchQuery("")
      setIsManualReceipt(false)
      setPaymentType("GENERAL")
    }
  }, [editingPayment, prefilledData, isOpen])

  // Una referencia única por apertura: PostgreSQL evita reintentos duplicados.
  useEffect(() => {
    if (!isOpen || editingPayment) return
    const number = `REC-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`
    setAutoReceiptNumber(number)
    setFormData(prev => ({ ...prev, receiptNumber: number }))
    submitLock.current = false
    setLocalSubmitting(false)
  }, [isOpen, editingPayment])

  useEffect(() => {
    if (!editingPayment && !isManualReceipt) {
      setFormData(prev => ({ ...prev, receiptNumber: autoReceiptNumber }))
    }
  }, [isManualReceipt, autoReceiptNumber, editingPayment])

  useEffect(() => {
    if (!formData.patientId) {
      setPatientPlans([])
      setSelectedPatientObj(null)
      return
    }
    const foundPatient = patients.find((p) => p.id === formData.patientId)
    setSelectedPatientObj(foundPatient || null)
    let isMounted = true
    setPatientPlans([])
    setIsLoadingPlans(true)
    
    fetch(`/api/treatments?patientId=${formData.patientId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!isMounted) return
        const list = Array.isArray(data) ? data : (Array.isArray(data?.plans) ? data.plans : [])
        const activeWithDebt = list.filter((p: any) => {
          const debt = Number(p.pendingBalance ?? Math.max(0, Number(p.totalCost || 0) - Number(p.totalPaid || 0)))
          return debt > 0.01 && p.status === "ACTIVE"
        })
        setPatientPlans(activeWithDebt)
        
        // Nunca seleccionamos un plan automáticamente al elegir un paciente.
        // Mostrador sigue siendo la opción explícita por defecto.
      })
      .catch((err) => {
        console.error("Error al cargar planes:", err)
        if (isMounted) setPatientPlans([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingPlans(false)
      })
    return () => { isMounted = false }
  }, [formData.patientId, patients, editingPayment, prefilledData])

  const selectedPlanData = patientPlans.find((p) => p.id === formData.treatmentPlanId)
  const patientConvenio = selectedPatientObj?.convenio || selectedPlanData?.agreement?.name || selectedPlanData?.agreementName

  const isCard = formData.method === "CREDIT_CARD" || formData.method === "DEBIT_CARD"
  const isTransfer = formData.method === "TRANSFER"
  const needsReference = isCard || isTransfer
  const isPatientMissing = !formData.patientId
  const amountValue = Number(formData.amount)
  const isAmountMissing = !Number.isFinite(amountValue) || amountValue <= 0 ||
    Math.abs(amountValue * 100 - Math.round(amountValue * 100)) > 0.00001
  const isPlanMissing = !isEditing && paymentType === "PLAN" && !formData.treatmentPlanId
  const isConceptMissing = !isEditing && paymentType === "GENERAL" && !formData.notes?.trim()
  const isReferenceMissing = needsReference && !reference.trim()
  const selectedPlanBalance = selectedPlanData
    ? Number(selectedPlanData.pendingBalance ?? Math.max(0,
        Number(selectedPlanData.totalCost || 0) - Number(selectedPlanData.totalPaid || 0)))
    : 0
  const isPlanUnavailable = !isEditing && paymentType === "PLAN" && (
    isLoadingPlans || !selectedPlanData || !Number.isFinite(selectedPlanBalance) || selectedPlanBalance <= 0
  )
  const isOverPlanBalance = !isEditing && paymentType === "PLAN" &&
    Boolean(selectedPlanData) && amountValue > selectedPlanBalance + 0.00001

  const handleSubmit = async () => {
    setShowErrors(true)
    if (submitLock.current || isSaving || localSubmitting) return
    if (isPatientMissing || isAmountMissing || isReferenceMissing || isPlanMissing || isConceptMissing || isPlanUnavailable || isOverPlanBalance) return

    let structuredNotes = formData.notes || ""
    if (formData.method === "CREDIT_CARD") {
      const modalInfo = cardType === "DIFERIDO"
        ? `[TARJETA CRÉDITO - DIFERIDO ${installments} MESES]`
        : `[TARJETA CRÉDITO - CORRIENTE]`
      structuredNotes = structuredNotes ? `${modalInfo} ${structuredNotes}` : modalInfo
    } else if (formData.method === "DEBIT_CARD") {
      structuredNotes = structuredNotes ? `[TARJETA DÉBITO] ${structuredNotes}` : `[TARJETA DÉBITO]`
    }

    const payload: PaymentFormData = {
      ...formData,
      destination: paymentType === "PLAN" ? "PLAN" : "COUNTER",
      treatmentPlanId: paymentType === "PLAN" ? formData.treatmentPlanId : undefined,
      notes: structuredNotes,
      reference: reference.trim() || undefined,
      receiptImage: receiptImage || undefined,
    }
    submitLock.current = true
    setLocalSubmitting(true)
    try {
      const success = await onSave(payload)
      if (success) onClose()
    } finally {
      submitLock.current = false
      setLocalSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* 
        PREMIUM UX: Limitamos la altura máxima y agregamos scroll interno
        para evitar que el modal se desborde fuera de la pantalla.
      */}
      <DialogContent className="sm:max-w-[900px] w-[96vw] max-h-[95vh] flex flex-col bg-card text-foreground border border-border/70 rounded-[24px] p-0 shadow-2xl overflow-hidden font-sans">
        
        <DialogHeader className="px-6 py-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#008bcd]/15 text-[#008bcd] flex items-center justify-center border border-[#008bcd]/20 shadow-xs">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground leading-none">
                {editingPayment ? "Modificar Registro de Cobro" : "Registrar Cobro en Caja"}
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Gestión de ingresos y arqueo de turnos.</p>
            </div>
          </div>
        </DialogHeader>

        {/* CONTENEDOR CON SCROLL PARA PANTALLAS PEQUEÑAS */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* COLUMNA IZQUIERDA: PACIENTE Y DESTINO */}
            <div className="md:col-span-6 space-y-4">
              <PaymentPatientTargetForm
                formData={formData}
                setFormData={setFormData}
                patients={patients}
                patientSearchQuery={patientSearchQuery}
                setPatientSearchQuery={setPatientSearchQuery}
                isEditing={isEditing}
                showErrors={showErrors}
                isPatientMissing={isPatientMissing}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                patientPlans={patientPlans}
                isLoadingPlans={isLoadingPlans}
                patientConvenio={patientConvenio}
              />
            </div>

            {/* COLUMNA DERECHA: PAGOS Y AUDITORÍA */}
            <div className="md:col-span-6 space-y-4">
              
              {/* MONTO A COBRAR Y MÉTODO COMPACTOS */}
              <div className="grid grid-cols-2 gap-4">
                <div className={cn("bg-muted/10 border rounded-xl p-3 transition-colors", showErrors && isAmountMissing ? "border-rose-500/80 bg-rose-500/5" : "border-border/60")}>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Monto a Cobrar <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">{currencySymbol}</span>
                    <Input
                      type="number"
                      step="0.01"
                      readOnly={isEditing}
                      value={formData.amount}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="pl-7 h-10 bg-background font-mono text-lg font-black text-foreground rounded-lg focus-visible:ring-[#008bcd]"
                    />
                  </div>
                </div>

                <div className="bg-muted/10 border border-border/60 rounded-xl p-3 flex flex-col justify-center">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Estado del Cobro
                  </Label>
                  <select
                    value={formData.status}
                    disabled={isEditing || (paymentType === "PLAN" && !isEditing)}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as PaymentState }))}
                    className="w-full h-10 px-2 rounded-lg border border-border bg-background text-foreground text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="COMPLETED">Completado / Caja</option>
                    <option value="PENDING">Pendiente / Chequeo</option>
                  </select>
                </div>
              </div>

              {paymentType === "PLAN" && !isEditing && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300" role="status">
                  Los planes activos se muestran por saldo. La autorización B2 y la integridad del presupuesto
                  se verifican en el servidor al procesar el cobro. Si falta autorización, no se registra el pago.
                </p>
              )}

              {/* MÉTODOS DE PAGO EN GRID COMPACTO */}
              <div className="bg-muted/10 border border-border/60 rounded-xl p-3.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#008bcd]" /> Método de Cobro <span className="text-rose-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon
                    const isSelected = formData.method === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFormData((prev: any) => ({ ...prev, method: m.id }))}
                        className={cn(
                          "flex items-center gap-1.5 p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer",
                          isSelected ? "bg-[#008bcd]/15 border-[#008bcd] text-[#008bcd] shadow-2xs" : "bg-background border-border hover:bg-muted/40 text-foreground"
                        )}
                      >
                        <Icon className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-[#008bcd]" : "text-muted-foreground")} />
                        <span className="truncate leading-none text-[11px]">{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* AUDITORÍA (REFERENCIAS Y FOTOS) */}
              <PaymentAuditForm
                formData={formData}
                setFormData={setFormData}
                reference={reference}
                setReference={setReference}
                cardType={cardType}
                setCardType={setCardType}
                installments={installments}
                setInstallments={setInstallments}
                receiptImage={receiptImage}
                setReceiptImage={setReceiptImage}
                isManualReceipt={isManualReceipt}
                setIsManualReceipt={setIsManualReceipt}
                isLoadingReceipt={isLoadingReceipt}
                isEditing={isEditing}
                showErrors={showErrors}
                isReferenceMissing={isReferenceMissing}
              />
            </div>
          </div>
        </div>

        {/* PIE DEL MODAL */}
        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-between shrink-0">
          <div className="text-[11px] font-medium hidden sm:block">
            {showErrors && (isPatientMissing || isAmountMissing || isReferenceMissing || isPlanMissing || isConceptMissing || isPlanUnavailable || isOverPlanBalance) ? (
              <span className="text-rose-500 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {isPlanMissing ? "Selecciona un plan aprobado." : isConceptMissing ? "Indica el concepto del cobro de Mostrador." : "Complete los campos obligatorios en rojo."}
              </span>
            ) : (
              <p className="text-muted-foreground">Verifique la información antes de procesar.</p>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="rounded-lg text-xs font-bold h-9 px-4 border-border hover:bg-muted w-full sm:w-auto cursor-pointer">
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSaving || localSubmitting || (paymentType === "PLAN" && !isEditing && (isPlanUnavailable || isOverPlanBalance))} className="bg-[#008bcd] hover:bg-[#0073ab] text-white rounded-lg text-xs font-bold h-9 px-5 shadow-xs transition-all active:scale-95 w-full sm:w-auto cursor-pointer">
              {(isSaving || localSubmitting) ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <DollarSign className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />}
              {editingPayment ? "Guardar Cambios" : "Procesar Cobro"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}