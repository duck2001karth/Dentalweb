"use client"

import React, { useState, useEffect } from "react"
import { 
  DollarSign, Loader2, AlertCircle, Banknote, ArrowLeftRight, CreditCard 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import type { PaymentFormData, PaymentMethod, PaymentRecord } from "@/types/billing"
import { PaymentAuditForm } from "./payment-audit-form"
import { PaymentPatientTargetForm } from "./payment-patient-form"
import { cn } from "@/lib/utils"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  editingPayment?: PaymentRecord | null
  patients: any[]
  isSaving: boolean
  onSave: (data: PaymentFormData & { 
    treatmentPlanId?: string
    reference?: string
    receiptImage?: string | null
  }) => Promise<boolean>
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: any }[] = [
  { id: "CASH", label: "Efectivo", icon: Banknote },
  { id: "TRANSFER", label: "Transferencia / QR", icon: ArrowLeftRight },
  { id: "CREDIT_CARD", label: "Tarjeta de Crédito", icon: CreditCard },
  { id: "DEBIT_CARD", label: "Tarjeta de Débito", icon: CreditCard },
]

export function PaymentModal({ 
  isOpen, 
  onClose, 
  editingPayment, 
  patients = [], 
  isSaving, 
  onSave 
}: PaymentModalProps) {
  const isEditing = Boolean(editingPayment)
  const [patientSearchQuery, setPatientSearchQuery] = useState("")
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false)
  const [isManualReceipt, setIsManualReceipt] = useState(false)
  const [autoReceiptNumber, setAutoReceiptNumber] = useState("")

  const [reference, setReference] = useState("")
  const [cardType, setCardType] = useState<"CORRIENTE" | "DIFERIDO">("CORRIENTE")
  const [installments, setInstallments] = useState("3")
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  // Estados de Paciente y Planes
  const [paymentType, setPaymentType] = useState<"GENERAL" | "PLAN">("PLAN")
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
      setPatientSearchQuery(
        `${editingPayment.patient?.firstName || ""} ${editingPayment.patient?.lastName || ""} - CI: ${editingPayment.patient?.ci || ""}`
      )
      setIsManualReceipt(true)
    } else {
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
      setPaymentType("PLAN")
    }
  }, [editingPayment, isOpen])

  // Cargar número de recibo correlativo
  useEffect(() => {
    if (isOpen && !editingPayment) {
      setIsLoadingReceipt(true)
      fetch("/api/payments/next-receipt")
        .then((res) => res.json())
        .then((data) => {
          const nextVal = data.nextReceipt || data.nextReceiptNumber
          if (nextVal) {
            setAutoReceiptNumber(nextVal)
            if (!isManualReceipt) {
              setFormData((prev) => ({ ...prev, receiptNumber: nextVal }))
            }
          }
        })
        .catch(() => console.error("No se pudo obtener correlativo"))
        .finally(() => setIsLoadingReceipt(false))
    }
  }, [isOpen, editingPayment, isManualReceipt])

  useEffect(() => {
    if (!editingPayment) {
      setFormData((prev) => ({
        ...prev,
        receiptNumber: isManualReceipt ? "" : autoReceiptNumber,
      }))
    }
  }, [isManualReceipt, autoReceiptNumber, editingPayment])

  // Cargar planes activos del paciente
  useEffect(() => {
    if (!formData.patientId) {
      setPatientPlans([])
      setSelectedPatientObj(null)
      setPaymentType("GENERAL")
      return
    }

    const foundPatient = patients.find((p) => p.id === formData.patientId)
    setSelectedPatientObj(foundPatient || null)

    let isMounted = true
    setIsLoadingPlans(true)
    fetch(`/api/treatments?patientId=${formData.patientId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!isMounted) return
        const list = Array.isArray(data) ? data : data.plans || []
        const activeWithDebt = list.filter((p: any) => {
          const debt = Number(p.pendingBalance ?? (Number(p.totalCost || 0) - Number(p.totalPaid || 0)))
          return debt > 0.01 && p.status !== "CANCELLED"
        })
        setPatientPlans(activeWithDebt)
        if (activeWithDebt.length > 0 && !formData.treatmentPlanId && !editingPayment) {
          setPaymentType("PLAN")
          const firstPlan = activeWithDebt[0]
          const debt = Number(firstPlan.pendingBalance ?? (Number(firstPlan.totalCost || 0) - Number(firstPlan.totalPaid || 0)))
          setFormData((prev) => ({
            ...prev,
            treatmentPlanId: firstPlan.id,
            amount: debt > 0 ? debt.toFixed(2) : prev.amount,
          }))
        }
      })
      .catch((err) => console.error("Error al cargar planes:", err))
      .finally(() => {
        if (isMounted) setIsLoadingPlans(false)
      })

    return () => {
      isMounted = false
    }
  }, [formData.patientId, patients, editingPayment])

  const selectedPlanData = patientPlans.find((p) => p.id === formData.treatmentPlanId)
  const patientConvenio = selectedPatientObj?.convenio || selectedPlanData?.agreement?.name || selectedPlanData?.agreementName

  const isCard = formData.method === "CREDIT_CARD" || formData.method === "DEBIT_CARD"
  const isTransfer = formData.method === "TRANSFER"
  const needsReference = isCard || isTransfer

  const isPatientMissing = !formData.patientId
  const isAmountMissing = !formData.amount || Number(formData.amount) <= 0
  const isReferenceMissing = needsReference && !reference.trim()

  const handleSubmit = async () => {
    setShowErrors(true)
    if (isPatientMissing || isAmountMissing || isReferenceMissing) return

    let structuredNotes = formData.notes || ""
    if (formData.method === "CREDIT_CARD") {
      const modalInfo = cardType === "DIFERIDO" 
        ? `[TARJETA CRÉDITO - DIFERIDO ${installments} MESES]` 
        : `[TARJETA CRÉDITO - CORRIENTE]`
      structuredNotes = structuredNotes ? `${modalInfo} ${structuredNotes}` : modalInfo
    } else if (formData.method === "DEBIT_CARD") {
      structuredNotes = structuredNotes ? `[TARJETA DÉBITO]` : `[TARJETA DÉBITO]`
    }

    const payload = {
      ...formData,
      treatmentPlanId: formData.treatmentPlanId || undefined,
      notes: structuredNotes,
      reference: reference.trim() || undefined,
      receiptImage: receiptImage || undefined,
    }

    const success = await onSave(payload)
    if (success) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[960px] w-[96vw] bg-card text-foreground border border-border/70 rounded-[24px] p-0 shadow-2xl overflow-visible">
        
        {/* CABECERA */}
        <DialogHeader className="px-6 py-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between rounded-t-[24px]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#008bcd]/15 text-[#008bcd] flex items-center justify-center border border-[#008bcd]/20 shadow-xs">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                {editingPayment ? "Modificar Registro de Cobro" : "Registrar Cobro en Caja"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium">Gestión de ingresos y arqueo de turnos.</p>
            </div>
          </div>
        </DialogHeader>

        {/* CONTENIDO DISTRIBUIDO EN 2 COLUMNAS (6 y 6) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA: PACIENTE Y DESTINO */}
          <div className="md:col-span-6">
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

          {/* COLUMNA DERECHA: MONTO, MÉTODO, VOUCHER Y RECIBO */}
          <div className="md:col-span-6 space-y-4">
            
            {/* MONTO A COBRAR */}
            <div
              className={cn(
                "bg-muted/10 border rounded-xl p-3.5 transition-colors",
                showErrors && isAmountMissing ? "border-rose-500/80 bg-rose-500/5" : "border-border/60"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Monto a Cobrar (USD) <span className="text-rose-500">*</span>
                </Label>
                {showErrors && isAmountMissing && (
                  <span className="text-[10px] text-rose-500 font-bold">Requerido</span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="pl-7 h-11 bg-background font-mono text-xl font-black text-foreground rounded-xl focus-visible:ring-[#008bcd]"
                />
              </div>
            </div>

            {/* MÉTODO DE COBRO */}
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
                        "flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#008bcd]/15 border-[#008bcd] text-[#008bcd] shadow-2xs"
                          : "bg-background border-border hover:bg-muted/40 text-foreground"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-[#008bcd]" : "text-muted-foreground")} />
                      <span className="truncate leading-none text-xs">{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* AUDITORÍA Y VOUCHER */}
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

        {/* PIE DE PÁGINA */}
        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row gap-3 sm:justify-between items-center rounded-b-[24px]">
          <div className="text-[11px] font-medium">
            {showErrors && (isPatientMissing || isAmountMissing || isReferenceMissing) ? (
              <span className="text-rose-500 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {isReferenceMissing 
                  ? "Debe ingresar el código de autorización o referencia del voucher."
                  : isAmountMissing 
                  ? "Ingrese un monto válido para el cobro."
                  : "Seleccione el paciente titular."}
              </span>
            ) : (
              <p className="text-muted-foreground hidden sm:block">
                Verifique voucher y datos antes de confirmar el ingreso a caja.
              </p>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="rounded-lg text-xs font-bold h-9 px-4 border-border hover:bg-muted w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-[#008bcd] hover:bg-[#0073ab] text-white rounded-lg text-xs font-bold h-9 px-5 shadow-xs transition-all active:scale-95 w-full sm:w-auto"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <DollarSign className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
              )}
              {editingPayment ? "Guardar Cambios" : "Procesar Cobro"}
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}

export default PaymentModal