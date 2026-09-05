"use client"

import React, { useState, useEffect } from "react"
import { DollarSign, Loader2, AlertCircle, Banknote, ArrowLeftRight, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import type { PaymentFormData, PaymentMethod, PaymentRecord } from "@/types/billing"

import { PaymentDetailsForm } from "./payment-details-form"
import { PaymentAuditForm } from "./payment-audit-form"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  editingPayment?: PaymentRecord | null
  patients: any[]
  isSaving: boolean
  onSave: (data: PaymentFormData & { 
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
  const [patientSearchQuery, setPatientSearchQuery] = useState("")
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false)
  const [isManualReceipt, setIsManualReceipt] = useState(false)
  const [autoReceiptNumber, setAutoReceiptNumber] = useState("")

  const [reference, setReference] = useState("")
  const [cardType, setCardType] = useState<"CORRIENTE" | "DIFERIDO">("CORRIENTE")
  const [installments, setInstallments] = useState("3")
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  const [formData, setFormData] = useState<PaymentFormData>({
    patientId: "",
    amount: "",
    method: "CASH",
    status: "COMPLETED",
    receiptNumber: "",
    notes: ""
  })

  useEffect(() => {
    setShowErrors(false)
    if (editingPayment) {
      setFormData({
        patientId: editingPayment.patient?.id || "",
        amount: editingPayment.amount,
        method: editingPayment.method,
        status: editingPayment.status,
        receiptNumber: editingPayment.receiptNumber || "",
        notes: editingPayment.notes || ""
      })
      setReference(editingPayment.reference || "")
      setReceiptImage(editingPayment.receiptImage || null)
      setPatientSearchQuery(
        `${editingPayment.patient?.firstName || ""} ${editingPayment.patient?.lastName || ""} - CI: ${editingPayment.patient?.ci || ""}`
      )
      setIsManualReceipt(true)
    } else {
      setFormData({
        patientId: "",
        amount: "",
        method: "CASH",
        status: "COMPLETED",
        receiptNumber: "",
        notes: ""
      })
      setReference("")
      setCardType("CORRIENTE")
      setInstallments("3")
      setReceiptImage(null)
      setPatientSearchQuery("")
      setIsManualReceipt(false)
    }
  }, [editingPayment, isOpen])

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
        .catch(() => console.error("No se pudo obtener el correlativo"))
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
      notes: structuredNotes,
      reference: reference.trim() || undefined,
      receiptImage: receiptImage || undefined,
    }

    const success = await onSave(payload)
    if (success) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[940px] w-[96vw] bg-card text-foreground border border-border/70 rounded-[24px] p-0 shadow-2xl overflow-visible">
        
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

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          <div className="md:col-span-5">
            <PaymentDetailsForm
              formData={formData}
              setFormData={setFormData}
              patients={patients}
              patientSearchQuery={patientSearchQuery}
              setPatientSearchQuery={setPatientSearchQuery}
              isEditing={!!editingPayment}
              showErrors={showErrors}
              isPatientMissing={isPatientMissing}
              isAmountMissing={isAmountMissing}
              paymentMethods={PAYMENT_METHODS}
            />
          </div>

          <div className="md:col-span-7">
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
              isEditing={!!editingPayment}
              showErrors={showErrors}
              isReferenceMissing={isReferenceMissing}
            />
          </div>
        </div>

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