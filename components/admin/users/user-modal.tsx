"use client"

import React, { useState, useEffect } from "react"
import { UserPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function UserModal({ isOpen, onClose, editingUser, isSaving, onSave }: any) {
  const [formData, setFormData] = useState({
    name: "", email: "", role: "DOCTOR", specialty: "", isActive: true
  })

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || "",
        email: editingUser.email || "",
        role: editingUser.role || "DOCTOR",
        specialty: editingUser.specialty || "",
        isActive: editingUser.isActive ?? true
      })
    } else {
      setFormData({ name: "", email: "", role: "DOCTOR", specialty: "", isActive: true })
    }
  }, [editingUser, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border shadow-2xl rounded-[24px] p-0 overflow-hidden text-foreground">
        <DialogHeader className="px-8 py-6 border-b border-border bg-[#008bcd]/5">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            {editingUser ? "Actualizar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Define las credenciales de acceso y el nivel de permisos en la clínica.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nombre Completo *</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Dr. Juan Pérez" className="bg-background border-border h-11 rounded-xl text-sm" required />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Correo Electrónico *</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="correo@clinica.com" className="bg-background border-border h-11 rounded-xl text-sm" required />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Rol de Sistema *</Label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-[#008bcd]/30 transition-all">
                  <option value="DOCTOR">Doctor / Odontólogo</option>
                  <option value="RECEPTIONIST">Recepción / Caja</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Especialidad</Label>
                <Input value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} placeholder="Ej: Ortodoncia (Opcional)" className="bg-background border-border h-11 rounded-xl text-xs" />
              </div>
            </div>
          </div>

          <DialogFooter className="px-8 py-5 border-t border-border bg-muted/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} className="data-[state=checked]:bg-emerald-500" />
              <Label className="text-xs font-bold text-muted-foreground cursor-pointer">Acceso Activo</Label>
            </div>
            <div className="flex gap-2.5">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold h-11 px-5 border-border">Cancelar</Button>
              <Button type="submit" disabled={isSaving || !formData.name || !formData.email} className="bg-[#008bcd] hover:bg-[#007bb6] text-white rounded-xl text-xs font-bold h-11 px-7">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Guardar
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}