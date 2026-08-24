"use client"

import React, { useState, useRef, useEffect } from "react"
import { DollarSign, Loader2, Search, Check, FileText, CreditCard, User, AlertCircle, Lock } from "lucide-react"

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
  onSave: (data: PaymentFormData) => Promise<boolean>
}

export function PaymentModal({ isOpen, onClose, editingPayment, patients = [], isSaving, onSave }: PaymentModalProps) {
  const [patientSearchQuery, setPatientSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false)
  const [isManualReceipt, setIsManualReceipt] = useState(false)
  const [autoReceiptNumber, setAutoReceiptNumber] = useState("")

  const [formData, setFormData] = useState<PaymentFormData>({
    patientId: "", amount: "", method: "CASH", status: "COMPLETED", receiptNumber: "", notes: ""
  })


  useEffect(() => {
    if (editingPayment) {
      setFormData({
        patientId: editingPayment.patient.id, amount: editingPayment.amount, method: editingPayment.method,
        status: editingPayment.status, receiptNumber: editingPayment.receiptNumber || "", notes: editingPayment.notes || ""
      })
      setPatientSearchQuery(`${editingPayment.patient.firstName} ${editingPayment.patient.lastName} - CI: ${editingPayment.patient.ci || ""}`)
      setIsManualReceipt(true)
    } else {
      setFormData({ patientId: "", amount: "", method: "CASH", status: "COMPLETED", receiptNumber: "", notes: "" })
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
          if (data.nextReceiptNumber) {
            setAutoReceiptNumber(data.nextReceiptNumber)
            if (!isManualReceipt) {
              setFormData(prev => ({ ...prev, receiptNumber: data.nextReceiptNumber }))
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  const filteredPatients = (patients || []).filter((pt: any) =>
    `${pt.firstName} ${pt.lastName} ${pt.ci || ""}`.toLowerCase().includes(patientSearchQuery.toLowerCase())
  ).slice(0, 5)

  const handleSubmit = async () => {
    if (!formData.patientId || !formData.amount) return
    const success = await onSave(formData)
    if (success) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] bg-card border border-border/80 rounded-[24px] p-0 overflow-hidden shadow-2xl">
        
        {/* HEADER PREMIUM COMPACTO */}
        <DialogHeader className="px-6 py-5 border-b border-border/60 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-3 tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            {editingPayment ? "Modificar Cobro" : "Registrar Nuevo Cobro"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          
          {/* SECCIÓN 1: PACIENTE */}
          <div className="bg-muted/10 border border-border/60 rounded-xl p-4 relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 mb-2.5 text-muted-foreground">
              <User className="w-4 h-4" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">Identificación del Paciente <span className="text-rose-500">*</span></Label>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={patientSearchQuery}
                onChange={(e) => {
                  setPatientSearchQuery(e.target.value)
                  setShowDropdown(true)
                  if (formData.patientId) setFormData({ ...formData, patientId: "" })
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar por nombre, apellido o documento..."
                className="pl-10 h-11 bg-background border-border/80 rounded-lg text-sm font-semibold focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50 shadow-sm transition-all"
                disabled={!!editingPayment}
              />
            </div>

            {showDropdown && !editingPayment && patientSearchQuery.length > 0 && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-card border border-border/80 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto divide-y divide-border/40 overflow-hidden">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((pt: any) => (
                    <button
                      type="button" key={pt.id}
                      onClick={() => {
                        setFormData({ ...formData, patientId: pt.id })
                        setPatientSearchQuery(`${pt.firstName} ${pt.lastName} - CI: ${pt.ci || ""}`)
                        setShowDropdown(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-500/5 text-sm font-bold text-foreground flex items-center justify-between transition-colors group"
                    >
                      <span className="group-hover:text-emerald-600 transition-colors">{pt.firstName} {pt.lastName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono font-medium bg-background px-2 py-1 rounded border border-border/60 shadow-xs">CI: {pt.ci || "S/N"}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-5 text-sm text-muted-foreground text-center flex flex-col items-center gap-2">
                    <AlertCircle className="w-5 h-5 opacity-50" />
                    No se encontraron pacientes.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN 2: DATOS FINANCIEROS (MONTO Y MÉTODO) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/10 border border-border/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2.5 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <Label className="text-[10px] font-black uppercase tracking-wider">Monto a Cobrar (USD) <span className="text-rose-500">*</span></Label>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-black text-emerald-600/50">$</span>
                <Input
                  type="number" step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="pl-8 h-11 bg-background border-emerald-500/30 font-mono text-lg font-black text-emerald-600 dark:text-emerald-400 rounded-lg focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 shadow-inner"
                />
              </div>
            </div>

            <div className="bg-muted/10 border border-border/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2.5 text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                <Label className="text-[10px] font-bold uppercase tracking-wider">Método de Pago <span className="text-rose-500">*</span></Label>
              </div>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as PaymentMethod })}
                className="w-full h-11 px-3.5 rounded-lg border border-border/80 bg-background text-foreground text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all shadow-sm cursor-pointer"
              >
                <option value="CASH">Efectivo Físico</option>
                <option value="TRANSFER">Transferencia / QR</option>
                <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                <option value="DEBIT_CARD">Tarjeta de Débito</option>
                <option value="INSURANCE">Seguro Médico / Convenio</option>
              </select>
            </div>
          </div>

          {/* SECCIÓN 3: RECIBO INTELIGENTE Y ESTADO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cn(
              "border rounded-xl p-4 relative overflow-hidden transition-colors duration-300",
              !isManualReceipt ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/10 border-border/60"
            )}>
              <div className="flex items-center justify-between mb-2.5">
                <div className={cn("flex items-center gap-2", !isManualReceipt ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>
                  <FileText className="w-4 h-4" />
                  <Label className="text-[10px] font-black uppercase tracking-wider">N° de Recibo</Label>
                </div>
                {!editingPayment && (
                  <div className="flex items-center gap-2 bg-background/50 px-2 py-1 rounded border border-border/50">
                    <Label htmlFor="manual-mode" className="text-[9px] font-bold text-muted-foreground cursor-pointer uppercase">Manual</Label>
                    <Switch 
                      id="manual-mode" 
                      checked={!isManualReceipt} 
                      onCheckedChange={(c) => setIsManualReceipt(!c)} 
                      className="data-[state=checked]:bg-emerald-500 scale-[0.6] my-[-4px] mx-[-4px]"
                    />
                    <Label htmlFor="manual-mode" className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 cursor-pointer uppercase">Auto</Label>
                  </div>
                )}
              </div>
              
              <div className="relative">
                {isLoadingReceipt && !isManualReceipt ? (
                  <div className="h-11 bg-background border border-emerald-500/30 rounded-lg flex items-center px-3.5 text-emerald-600/50 text-sm font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Calculando...
                  </div>
                ) : (
                  <div className="relative">
                    {!isManualReceipt && !editingPayment && (
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/50" />
                    )}
                    <Input
                      value={formData.receiptNumber}
                      onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                      placeholder={isManualReceipt ? "Ej: TALONARIO-001" : "REC-00000"}
                      readOnly={!isManualReceipt && !editingPayment}
                      className={cn(
                        "h-11 text-sm rounded-lg font-mono font-bold shadow-sm transition-all duration-300",
                        !isManualReceipt && !editingPayment 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 pl-9 focus-visible:ring-0 cursor-not-allowed" 
                          : "bg-background border-border/80 text-foreground focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50 px-3.5"
                      )}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ESTADO */}
            <div className="bg-muted/10 border border-border/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2.5 text-muted-foreground">
                <Check className="w-4 h-4" />
                <Label className="text-[10px] font-bold uppercase tracking-wider">Estado del Cobro</Label>
              </div>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentState })}
                className="w-full h-11 px-3.5 rounded-lg border border-border/80 bg-background text-foreground text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all shadow-sm cursor-pointer"
              >
                <option value="COMPLETED">Completado e Ingresado a Caja</option>
                <option value="PENDING">Pago Pendiente / Por Verificar</option>
              </select>
            </div>
          </div>
        </div>

        {/* FOOTER COMPACTO */}
        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/30 flex gap-3 sm:justify-between items-center">
          <p className="text-[10px] text-muted-foreground hidden sm:block font-medium">
            Verifique los datos antes de procesar el pago a caja.
          </p>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="rounded-lg text-xs font-bold h-10 px-5 border-border/80 bg-background hover:bg-muted shadow-sm w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !formData.patientId || !formData.amount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold h-10 px-6 shadow-md shadow-emerald-600/20 transition-all active:scale-95 w-full sm:w-auto"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-1.5 stroke-[2.5]" />}
              {editingPayment ? "Guardar Cambios" : "Procesar Cobro"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}