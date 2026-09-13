"use client"

import React, { useState, useEffect } from "react"
import { 
  UserPlus, Edit2, Loader2, Mail, Shield, 
  Stethoscope, Lock, User, BriefcaseMedical 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export function UserModal({ isOpen, onClose, editingUser, isSaving, onSave }: any) {
  const [formData, setFormData] = useState({
    name: "", 
    email: "", 
    password: "", 
    role: "DOCTOR", 
    specialty: "", 
    isActive: true
  })

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || "",
        email: editingUser.email || "",
        password: "", // Se deja en blanco por seguridad; solo se envía si el admin quiere cambiarla
        role: editingUser.role || "DOCTOR",
        specialty: editingUser.specialty || "",
        isActive: editingUser.isActive ?? true
      })
    } else {
      setFormData({ name: "", email: "", password: "", role: "DOCTOR", specialty: "", isActive: true })
    }
  }, [editingUser, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = { ...formData }
    // Si estamos editando y no se escribió contraseña, la eliminamos para no sobrescribirla
    if (editingUser && !payload.password) {
      delete (payload as any).password
    }
    
    onSave(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border/80 shadow-2xl rounded-[28px] p-0 overflow-hidden text-foreground">
        
        {/* CABECERA */}
        <DialogHeader className="px-7 py-6 border-b border-border/60 bg-muted/20">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center border border-[#008bcd]/20 shadow-xs shrink-0">
              {editingUser ? <Edit2 className="w-5 h-5 stroke-[2.5]" /> : <UserPlus className="w-5 h-5 stroke-[2.5]" />}
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <span>{editingUser ? "Editar Usuario" : "Nuevo Usuario Clínico"}</span>
              <DialogDescription className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {editingUser ? "Modificación de permisos y datos" : "Creación de credenciales de acceso"}
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-7 space-y-6">
            
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/50 pb-2">
                <User className="w-3.5 h-3.5" /> Información Personal
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-foreground/80 tracking-wider">Nombre Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      required 
                      placeholder="Ej. Dr. Patricio Capa" 
                      className="pl-9 h-11 rounded-xl text-sm border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-foreground/80 tracking-wider">Correo Electrónico *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="email"
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      required 
                      disabled={!!editingUser} 
                      placeholder="correo@clinica.com" 
                      className="pl-9 h-11 rounded-xl text-sm border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd] disabled:opacity-60 disabled:cursor-not-allowed" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: SEGURIDAD Y PERMISOS */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/50 pb-2">
                <Shield className="w-3.5 h-3.5" /> Seguridad y Permisos
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-foreground/80 tracking-wider">Rol en el Sistema *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({...formData, role: value, specialty: value !== "DOCTOR" ? "" : formData.specialty})}
                    required
                  >
                    <SelectTrigger className="h-11 rounded-xl font-semibold text-sm border-border/80 bg-background focus:ring-2 focus:ring-[#008bcd]/20 focus:border-[#008bcd]">
                      <SelectValue placeholder="Seleccionar rol..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-border/80">
                      <SelectItem value="ADMIN" className="font-bold text-purple-600 dark:text-purple-400 focus:bg-purple-500/10 focus:text-purple-600">
                        <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Administrador</div>
                      </SelectItem>
                      <SelectItem value="DOCTOR" className="font-bold text-[#008bcd] focus:bg-[#008bcd]/10 focus:text-[#008bcd]">
                        <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Doctor / Especialista</div>
                      </SelectItem>
                      <SelectItem value="RECEPTIONIST" className="font-bold text-amber-600 dark:text-amber-400 focus:bg-amber-500/10 focus:text-amber-600">
                        <div className="flex items-center gap-2"><User className="w-4 h-4" /> Recepción / Staff</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-foreground/80 tracking-wider flex justify-between">
                    <span>Contraseña {editingUser ? "" : "*"}</span>
                    {editingUser && <span className="text-muted-foreground font-normal text-[9px]">(Opcional)</span>}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      required={!editingUser} 
                      placeholder={editingUser ? "Dejar en blanco para mantener" : "Mínimo 8 caracteres"} 
                      className="pl-9 h-11 rounded-xl text-sm border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
                    />
                  </div>
                </div>

                {/* Especialidad (Visible solo si es Doctor) */}
                {formData.role === "DOCTOR" && (
                  <div className="sm:col-span-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <Label className="text-[11px] font-bold uppercase text-foreground/80 tracking-wider">Especialidad (Opcional)</Label>
                    <div className="relative">
                      <BriefcaseMedical className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        value={formData.specialty}
                        onChange={e => setFormData({...formData, specialty: e.target.value})} 
                        placeholder="Ej. Odontopediatría, Ortodoncia..." 
                        className="pl-9 h-11 rounded-xl text-sm border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          <DialogFooter className="px-7 py-5 border-t border-border/60 bg-muted/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 bg-background border border-border/80 px-3 py-2 rounded-xl shadow-sm">
              <Switch 
                checked={formData.isActive} 
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} 
                className="data-[state=checked]:bg-emerald-500" 
              />
              <Label className="text-[11px] font-bold text-foreground cursor-pointer uppercase tracking-wider">Acceso Activo</Label>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="rounded-xl h-11 px-6 text-xs font-bold border-border/80 hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving || !formData.name || !formData.email || (!editingUser && !formData.password)} 
                className={cn(
                  "rounded-xl h-11 px-8 text-xs font-bold text-white shadow-md transition-all active:scale-95",
                  editingUser 
                    ? "bg-[#008bcd] hover:bg-[#007bb6] shadow-[#008bcd]/20" 
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                )}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} 
                {editingUser ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}