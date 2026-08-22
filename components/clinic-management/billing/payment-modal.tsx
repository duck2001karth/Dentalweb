"use client"

import React, { useState, useRef, useEffect } from "react"
import { DollarSign, Loader2, Search, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import type { PaymentFormData, PaymentState, PaymentMethod, PaymentRecord } from "@/types/billing"

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
    } else {
      setFormData({ patientId: "", amount: "", method: "CASH", status: "COMPLETED", receiptNumber: "", notes: "" })
      setPatientSearchQuery("")
    }
  }, [editingPayment, isOpen])

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
      <DialogContent className="sm:max-w-[700px] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-8 py-6 border-b border-border bg-emerald-500/5">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            {editingPayment ? "Modificar Cobro de Caja" : "Registrar Nuevo Cobro"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* PACIENTE */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Paciente *</Label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                value={patientSearchQuery}
                onChange={(e) => {
                  setPatientSearchQuery(e.target.value)
                  setShowDropdown(true)
                  if (formData.patientId) setFormData({ ...formData, patientId: "" })
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar por nombre, apellido o CI..."
                className="pl-11 h-12 bg-background border-border rounded-xl text-sm font-semibold focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
                disabled={!!editingPayment}
              />
            </div>

            {showDropdown && !editingPayment && patientSearchQuery.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-border/60">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((pt: any) => (
                    <button
                      type="button" key={pt.id}
                      onClick={() => {
                        setFormData({ ...formData, patientId: pt.id })
                        setPatientSearchQuery(`${pt.firstName} ${pt.lastName} - CI: ${pt.ci || ""}`)
                        setShowDropdown(false)
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-muted text-sm font-bold text-foreground flex items-center justify-between transition-colors"
                    >
                      <span>{pt.firstName} {pt.lastName}</span>
                      <span className="text-[11px] text-muted-foreground font-medium bg-background px-2 py-1 rounded-md border border-border">CI: {pt.ci || "S/N"}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-4 text-sm text-muted-foreground text-center">No se encontraron pacientes.</div>
                )}
              </div>
            )}
          </div>

          {/* GRID HORIZONTAL: MONTO Y MÉTODO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Monto a Cobrar ($ USD) *</Label>
              <Input
                type="number" step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="h-12 bg-background border-border font-mono text-lg font-black text-emerald-500 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Método de Pago *</Label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as PaymentMethod })}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
              >
                <option value="CASH">Efectivo Físico</option>
                <option value="TRANSFER">Transferencia / QR</option>
                <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                <option value="DEBIT_CARD">Tarjeta de Débito</option>
                <option value="INSURANCE">Seguro Médico</option>
              </select>
            </div>
          </div>

          {/* GRID HORIZONTAL: RECIBO Y ESTADO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">N° Referencia / Recibo Interno</Label>
              <Input
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                placeholder="Opcional (Ej: REC-001)"
                className="h-12 bg-background border-border text-sm rounded-xl font-mono focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Estado del Cobro</Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentState })}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
              >
                <option value="COMPLETED">Completado</option>
                <option value="PENDING">Pendiente</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 py-5 border-t border-border bg-muted/10 flex gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold h-11 px-6 border-border hover:bg-accent">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !formData.patientId || !formData.amount}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-11 px-8 transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            {editingPayment ? "Guardar Cambios" : "Confirmar e Ingresar a Caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}