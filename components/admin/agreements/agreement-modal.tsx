"use client"

import React, { useState, useEffect } from "react"
import { Handshake, Loader2, Percent, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import type { Agreement, AgreementFormData, DiscountType } from "@/types/agreements"

interface AgreementModalProps {
  isOpen: boolean
  onClose: () => void
  editingAgreement?: Agreement | null
  isSaving?: boolean
  onSave: (data: AgreementFormData) => Promise<boolean>
}

export function AgreementModal({
  isOpen,
  onClose,
  editingAgreement,
  isSaving = false,
  onSave
}: AgreementModalProps) {
  const [formData, setFormData] = useState<AgreementFormData>({
    name: "",
    institutionName: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    contactPhone: "",
    contactPerson: "",
    notes: ""
  })
  useEffect(() => {
    if (editingAgreement) {
      setFormData({
        name: editingAgreement.name || "",
        institutionName: editingAgreement.institutionName || "",
        discountType: editingAgreement.discountType || "PERCENTAGE",
        discountValue: Number(editingAgreement.discountValue || 0).toString(),
        contactPhone: editingAgreement.contactPhone || "",
        contactPerson: editingAgreement.contactPerson || "",
        notes: editingAgreement.notes || ""
      })
    } else {
      setFormData({
        name: "",
        institutionName: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        contactPhone: "",
        contactPerson: "",
        notes: ""
      })
    }
  }, [editingAgreement, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.institutionName.trim() || !formData.discountValue) return
    const success = await onSave(formData)
    if (success) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-8 py-6 border-b border-border bg-[#008bcd]/5">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center">
              <Handshake className="w-5 h-5 stroke-[2.2]" />
            </div>
            {editingAgreement ? "Editar Convenio Institucional" : "Nuevo Convenio Institucional"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {editingAgreement
              ? "Modifica las condiciones arancelarias y datos de contacto de este convenio."
              : "Registra tarifas corporativas con descuento para aplicar en los presupuestos de pacientes."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Nombre del Convenio *
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Plan Corporativo IESS"
                  className="h-11 rounded-xl bg-background border-border text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Empresa / Aseguradora *
                </Label>
                <Input
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  placeholder="Ej: Banco Central / SaludSA"
                  className="h-11 rounded-xl bg-background border-border text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Tipo de Descuento
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={formData.discountType === "PERCENTAGE" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, discountType: "PERCENTAGE" })}
                    className={`h-11 rounded-xl text-xs font-bold gap-2 ${
                      formData.discountType === "PERCENTAGE"
                        ? "bg-[#008bcd] hover:bg-[#008bcd]/90 text-white"
                        : "border-border"
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" /> Porcentaje
                  </Button>
                  <Button
                    type="button"
                    variant={formData.discountType === "FIXED_AMOUNT" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, discountType: "FIXED_AMOUNT" })}
                    className={`h-11 rounded-xl text-xs font-bold gap-2 ${
                      formData.discountType === "FIXED_AMOUNT"
                        ? "bg-[#008bcd] hover:bg-[#008bcd]/90 text-white"
                        : "border-border"
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Monto Fijo
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Valor del Descuento ({formData.discountType === "PERCENTAGE" ? "%" : "$"}) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  placeholder={formData.discountType === "PERCENTAGE" ? "20.00" : "30.00"}
                  className="h-11 rounded-xl bg-background border-border font-mono font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Contacto / Responsable RRHH
                </Label>
                <Input
                  value={formData.contactPerson || ""}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Ej: Lcdo. Carlos Méndez"
                  className="h-11 rounded-xl bg-background border-border text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Teléfono de Contacto
                </Label>
                <Input
                  value={formData.contactPhone || ""}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="Ej: +593 99 123 4567"
                  className="h-11 rounded-xl bg-background border-border text-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-8 py-5 border-t border-border bg-muted/10 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-bold h-11 px-6 border-border"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !formData.name || !formData.discountValue}
              className="bg-[#008bcd] hover:bg-[#007bb6] text-white rounded-xl text-xs font-bold h-11 px-8 transition-all"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingAgreement ? "Guardar Cambios" : "Crear Convenio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}