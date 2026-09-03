"use client"

import React, { useState, useRef, useEffect } from "react"
import { 
  DollarSign, Loader2, Search, Check, FileText, 
  CreditCard, User, AlertCircle, Lock, Upload, Image as ImageIcon, X,
  Banknote, ArrowLeftRight, ChevronDown
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import type { PaymentFormData, PaymentState, PaymentMethod, PaymentRecord } from "@/types/billing"
import { cn } from "@/lib/utils"

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
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false)
  const [isManualReceipt, setIsManualReceipt] = useState(false)
  const [autoReceiptNumber, setAutoReceiptNumber] = useState("")

  const [reference, setReference] = useState("")
  const [cardType, setCardType] = useState<"CORRIENTE" | "DIFERIDO">("CORRIENTE")
  const [installments, setInstallments] = useState("3")
  const [receiptImage, setReceiptImage] = useState<string | null>(null)

  // Control de errores visuales
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
      fetch("/api/cajas/payments/next-receipt")
        .then(res => res.json())
        .then(data => {
          const nextVal = data.nextReceipt || data.nextReceiptNumber
          if (nextVal) {
            setAutoReceiptNumber(nextVal)
            if (!isManualReceipt) {
              setFormData(prev => ({ ...prev, receiptNumber: nextVal }))
            }
          }
        })
        .catch(() => console.error("No se pudo obtener el correlativo"))
        .finally(() => setIsLoadingReceipt(false))
    }
  }, [isOpen, editingPayment, isManualReceipt])

  useEffect(() => {
    if (!editingPayment) {
      if (isManualReceipt) {
        setFormData(prev => ({ ...prev, receiptNumber: "" }))
      } else {
        setFormData(prev => ({ ...prev, receiptNumber: autoReceiptNumber }))
      }
    }
  }, [isManualReceipt, autoReceiptNumber, editingPayment])

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  const filteredPatients = (patients || []).filter((pt: any) =>
    `${pt.firstName} ${pt.lastName} ${pt.ci || ""}`.toLowerCase().includes(patientSearchQuery.toLowerCase())
  ).slice(0, 5)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setReceiptImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const isCard = formData.method === "CREDIT_CARD" || formData.method === "DEBIT_CARD"
  const isTransfer = formData.method === "TRANSFER"
  const needsReference = isCard || isTransfer
  const isPatientMissing = !formData.patientId
  const isAmountMissing = !formData.amount || Number(formData.amount) <= 0
  const isReferenceMissing = needsReference && !reference.trim()

  const handleSubmit = async () => {
    setShowErrors(true)
    if (isPatientMissing || isAmountMissing || isReferenceMissing) {
      return
    }

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
        
        {/* HEADER CON IDENTIDAD CLÍNICA */}
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

        {/* CONTENEDOR EN 2 COLUMNAS */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          
          {/* COLUMNA IZQUIERDA (5 COLUMNAS): PACIENTE Y MONTO */}
          <div className="md:col-span-5 space-y-4">
            
            {/* PACIENTE */}
            <div className={cn(
              "bg-muted/10 border rounded-xl p-3.5 relative transition-colors",
              showErrors && isPatientMissing ? "border-rose-500/80 bg-rose-500/5" : "border-border/60"
            )} ref={dropdownRef}>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#008bcd]" /> Paciente Titular <span className="text-rose-500">*</span>
                </Label>
                {showErrors && isPatientMissing && (
                  <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Requerido
                  </span>
                )}
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={patientSearchQuery}
                  onChange={(e) => {
                    setPatientSearchQuery(e.target.value)
                    setShowDropdown(true)
                    if (formData.patientId) setFormData({ ...formData, patientId: "" })
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Buscar paciente por nombre o CI..."
                  className={cn(
                    "pl-9 h-10 bg-background text-xs font-semibold focus-visible:ring-[#008bcd]",
                    showErrors && isPatientMissing ? "border-rose-500 focus-visible:ring-rose-500" : "border-border"
                  )}
                  disabled={!!editingPayment}
                />
              </div>

              {showDropdown && !editingPayment && patientSearchQuery.length > 0 && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-popover border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-border/40">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((pt: any) => (
                      <button
                        type="button" 
                        key={pt.id}
                        onClick={() => {
                          setFormData({ ...formData, patientId: pt.id })
                          setPatientSearchQuery(`${pt.firstName} ${pt.lastName} - CI: ${pt.ci || ""}`)
                          setShowDropdown(false)
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#008bcd]/10 text-xs font-bold flex items-center justify-between transition-colors"
                      >
                        <span className="text-foreground">{pt.firstName} {pt.lastName}</span>
                        <span className="text-[9px] text-muted-foreground font-mono bg-background px-1.5 py-0.5 rounded border border-border">
                          CI: {pt.ci || "S/N"}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-muted-foreground text-center">
                      No se encontraron registros.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MONTO */}
            <div className={cn(
              "bg-muted/10 border rounded-xl p-3.5 transition-colors",
              showErrors && isAmountMissing ? "border-rose-500/80 bg-rose-500/5" : "border-border/60"
            )}>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Monto a Cobrar (USD) <span className="text-rose-500">*</span>
                </Label>
                {showErrors && isAmountMissing && (
                  <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Ingrese un monto
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">$</span>
                <Input
                  type="number" 
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className={cn(
                    "pl-7 h-11 bg-background font-mono text-lg font-black text-foreground rounded-lg focus-visible:ring-[#008bcd]",
                    showErrors && isAmountMissing ? "border-rose-500 focus-visible:ring-rose-500" : "border-border"
                  )}
                />
              </div>
            </div>

            {/* MÉTODO DE PAGO */}
            <div className="bg-muted/10 border border-border/60 rounded-xl p-3.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
                <CreditCard className="w-3.5 h-3.5 text-[#008bcd]" /> Método de Cobro <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon
                  const isSelected = formData.method === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, method: m.id })}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-bold transition-all",
                        isSelected
                          ? "bg-[#008bcd]/15 border-[#008bcd] text-[#008bcd] shadow-xs"
                          : "bg-background border-border hover:bg-muted/40 text-foreground"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-[#008bcd]" : "text-muted-foreground")} />
                      <span className="truncate leading-none">{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA (7 COLUMNAS): METADATOS POS, VOUCHER, RECIBO Y ESTADO */}
          <div className="md:col-span-7 space-y-4">
            
            {/* CAMPOS ESPECÍFICOS SEGÚN EL MÉTODO */}
            {isCard ? (
              <div className={cn(
                "border rounded-xl p-4 space-y-3 transition-colors",
                showErrors && isReferenceMissing 
                  ? "bg-rose-500/5 border-rose-500/80" 
                  : "bg-muted/15 border-border/80"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#008bcd] uppercase tracking-wider flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Datos del POS / Datáfono
                  </span>
                  {showErrors && isReferenceMissing ? (
                    <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Ingrese autorización
                    </span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground">Requerido para arqueo</span>
                  )}
                </div>

                {formData.method === "CREDIT_CARD" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Modalidad</Label>
                      <select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value as any)}
                        className="w-full mt-1 h-9 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-bold outline-none"
                      >
                        <option value="CORRIENTE">Corriente (1 pago)</option>
                        <option value="DIFERIDO">Diferido a meses</option>
                      </select>
                    </div>

                    {cardType === "DIFERIDO" && (
                      <div>
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">Plazo en Meses</Label>
                        <select
                          value={installments}
                          onChange={(e) => setInstallments(e.target.value)}
                          className="w-full mt-1 h-9 px-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-bold outline-none"
                        >
                          <option value="3">3 Meses</option>
                          <option value="6">6 Meses</option>
                          <option value="9">9 Meses</option>
                          <option value="12">12 Meses</option>
                          <option value="18">18 Meses</option>
                          <option value="24">24 Meses</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">
                    N° de Autorización / Lote del Voucher <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej: AUT-049821 / LOTE 012"
                    className={cn(
                      "mt-1 h-9 bg-background font-mono text-xs font-bold uppercase",
                      showErrors && isReferenceMissing 
                        ? "border-rose-500 focus-visible:ring-rose-500" 
                        : "border-border focus-visible:ring-[#008bcd]"
                    )}
                    required
                  />
                  {showErrors && isReferenceMissing && (
                    <p className="text-[10px] text-rose-500 mt-1 font-medium">
                      El número de lote o código de autorización del voucher es obligatorio para tarjetas.
                    </p>
                  )}
                </div>
              </div>
            ) : isTransfer ? (
              <div className={cn(
                "border rounded-xl p-4 space-y-2 transition-colors",
                showErrors && isReferenceMissing 
                  ? "bg-rose-500/5 border-rose-500/80" 
                  : "bg-muted/15 border-border/80"
              )}>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                    N° de Comprobante / Transferencia <span className="text-rose-500">*</span>
                  </Label>
                  {showErrors && isReferenceMissing && (
                    <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Requerido
                    </span>
                  )}
                </div>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej: TRANSF-902148 Banco Pichincha"
                  className={cn(
                    "h-9 bg-background font-mono text-xs font-bold uppercase",
                    showErrors && isReferenceMissing 
                      ? "border-rose-500 focus-visible:ring-rose-500" 
                      : "border-border focus-visible:ring-[#008bcd]"
                  )}
                  required
                />
                {showErrors && isReferenceMissing && (
                  <p className="text-[10px] text-rose-500 mt-1 font-medium">
                    Debe ingresar el número de referencia o comprobante de la transferencia.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 border border-dashed border-border/80 rounded-xl bg-muted/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-foreground">Ingreso en Efectivo</p>
                  <p className="text-[10px] text-muted-foreground">Suma automáticamente al arqueo de gaveta física.</p>
                </div>
              </div>
            )}

            {/* ADJUNTAR FOTO DEL VOUCHER O COMPROBANTE */}
            {(isCard || isTransfer) && (
              <div className="border border-border/80 rounded-xl p-2.5 bg-muted/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate text-xs">
                    <p className="font-bold text-foreground truncate">Foto del Voucher / Recibo</p>
                    <p className="text-[9px] text-muted-foreground">
                      {receiptImage ? "Imagen adjunta correctamente" : "Opcional para auditoría"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {receiptImage ? (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setReceiptImage(null)}
                      className="h-7 px-2 text-rose-500 text-[10px]"
                    >
                      <X className="w-3 h-3 mr-1" /> Quitar
                    </Button>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold bg-background border border-border px-2.5 py-1 rounded-lg hover:bg-muted transition-colors">
                      <Upload className="w-3 h-3 text-[#008bcd]" /> Subir
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* RECIBO Y ESTADO EN LÍNEA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={cn(
                "border rounded-xl p-3 relative transition-colors",
                !isManualReceipt ? "bg-[#008bcd]/5 border-[#008bcd]/20" : "bg-muted/10 border-border/60"
              )}>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">N° Recibo</Label>
                  {!editingPayment && (
                    <div className="flex items-center gap-1.5 bg-background px-1.5 py-0.5 rounded border scale-90">
                      <Label htmlFor="manual-mode" className="text-[8px] font-bold text-muted-foreground cursor-pointer uppercase">Man</Label>
                      <Switch 
                        id="manual-mode" 
                        checked={!isManualReceipt} 
                        onCheckedChange={(c) => setIsManualReceipt(!c)} 
                        className="data-[state=checked]:bg-[#008bcd] scale-50 m-[-6px]"
                      />
                      <Label htmlFor="manual-mode" className="text-[8px] font-black text-[#008bcd] cursor-pointer uppercase">Aut</Label>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  {isLoadingReceipt && !isManualReceipt ? (
                    <div className="h-9 bg-background border border-[#008bcd]/30 rounded-lg flex items-center px-2.5 text-[#008bcd]/60 text-xs font-semibold">
                      <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Generando...
                    </div>
                  ) : (
                    <div className="relative">
                      {!isManualReceipt && !editingPayment && (
                        <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#008bcd]/60" />
                      )}
                      <Input
                        value={formData.receiptNumber}
                        onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                        placeholder={isManualReceipt ? "TALONARIO-001" : "REC-00000"}
                        readOnly={!isManualReceipt && !editingPayment}
                        className={cn(
                          "h-9 text-xs rounded-lg font-mono font-bold shadow-xs",
                          !isManualReceipt && !editingPayment 
                            ? "bg-[#008bcd]/10 border-[#008bcd]/30 text-[#008bcd] pl-8 cursor-not-allowed" 
                            : "bg-background border-border px-2.5"
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ESTADO */}
              <div className="bg-muted/10 border border-border/60 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1.5 text-muted-foreground">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <Label className="text-[9px] font-bold uppercase tracking-wider">Estado del Cobro</Label>
                </div>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentState })}
                  className="w-full h-9 px-2 rounded-lg border border-border bg-background text-foreground text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="COMPLETED">Completado / Caja</option>
                  <option value="PENDING">Pendiente / Chequeo</option>
                </select>
              </div>
            </div>

          </div>

        </div>

        {/* FOOTER */}
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