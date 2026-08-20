"use client"

import React, { useState, useRef, useEffect } from "react"
import { DollarSign, Loader2, User, Search, Check } from "lucide-react"

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

  const [formData, setFormData] = useState<PaymentFormData>({
    patientId: "",
    amount: "",
    method: "CASH",
    status: "COMPLETED",
    receiptNumber: "",
    notes: ""
  })

  useEffect(() => {
    if (editingPayment) {
      setFormData({
        patientId: editingPayment.patient.id,
        amount: editingPayment.amount,
        method: editingPayment.method,
        status: editingPayment.status,
        receiptNumber: editingPayment.receiptNumber || "",
        notes: editingPayment.notes || ""
      })
      setPatientSearchQuery(`${editingPayment.patient.firstName} ${editingPayment.patient.lastName} - ${editingPayment.patient.ci || ""}`)
    } else {
      setFormData({
        patientId: "",
        amount: "",
        method: "CASH",
        status: "COMPLETED",
        receiptNumber: "",
        notes: ""
      })
      setPatientSearchQuery("")
    }
  }, [editingPayment, isOpen])

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

  const handleSubmit = async () => {
    if (!formData.patientId || !formData.amount) return
    const success = await onSave(formData)
    if (success) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b border-border bg-muted/30">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            {editingPayment ? "Modificar Cobro" : "Registrar Cobro en Caja"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* BUSCADOR DE PACIENTES */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Paciente *
            </Label>
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
                placeholder="Buscar por nombre o CI..."
                className="pl-10 h-11 bg-background border-border rounded-xl text-xs font-semibold"
                disabled={!!editingPayment}
              />
            </div>

            {showDropdown && !editingPayment && patientSearchQuery.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-border/60">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((pt: any) => (
                    <button
                      type="button"
                      key={pt.id}
                      onClick={() => {
                        setFormData({ ...formData, patientId: pt.id })
                        setPatientSearchQuery(`${pt.firstName} ${pt.lastName} - ${pt.ci || ""}`)
                        setShowDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted text-xs font-bold text-foreground flex items-center justify-between"
                    >
                      <span>{pt.firstName} {pt.lastName}</span>
                      <span className="text-[10px] text-muted-foreground">CI: {pt.ci || "S/N"}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                    No se encontraron pacientes.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MONTO Y MÉTODO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Monto ($ USD) *
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="h-11 bg-background border-border font-mono text-base font-black text-emerald-600 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Método de Pago *
              </Label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as PaymentMethod })}
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-bold outline-none"
              >
                <option value="CASH">Efectivo</option>
                <option value="TRANSFER">Transferencia / QR</option>
                <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                <option value="DEBIT_CARD">Tarjeta de Débito</option>
                <option value="INSURANCE">Seguro Médico</option>
              </select>
            </div>
          </div>

          {/* RECIBO / ESTADO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                N° de Referencia / Recibo
              </Label>
              <Input
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                placeholder="Opcional (ej: REC-001)"
                className="h-11 bg-background border-border text-xs rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Estado del Cobro
              </Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentState })}
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-bold outline-none"
              >
                <option value="COMPLETED">Completado</option>
                <option value="PENDING">Pendiente</option>
                <option value="REFUNDED">Reembolsado</option>
                <option value="FAILED">Fallido</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold h-10 border-border">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !formData.patientId || !formData.amount}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-10 px-6"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-1.5" />}
            {editingPayment ? "Guardar Cambios" : "Registrar en Caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}