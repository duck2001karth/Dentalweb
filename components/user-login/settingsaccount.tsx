"use client"

import { useSession } from "next-auth/react" 
import dayjs from "dayjs"
import "dayjs/locale/es"

import { updateUserSettings } from "@/lib/actions" 

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useRef } from "react"

import {
  Camera, User, Phone, Mail, Pencil, Shield, 
  Loader2, X, Check, Stethoscope
} from "lucide-react"
import { cn } from "@/lib/utils"

dayjs.locale("es")

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  DOCTOR: "Especialista Clínico",
  RECEPTIONIST: "Recepcionista",
}

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: session, update } = useSession()

  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const currentUser = session?.user as any
  const hasUpdated = useRef(false)
  useEffect(() => {
      if (open && !hasUpdated.current) {
        update()
        hasUpdated.current = true 
      } else if (!open) {
        hasUpdated.current = false 
      }
    }, [open, update])

  useEffect(() => {
    if (currentUser) {
      setPhone(currentUser.phoneNumber || "")
    }
  }, [currentUser])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const result = await updateUserSettings({
        phoneNumber: phone,
      })
      if (result?.error) return console.error(result.error)
      await update({
        ...session,
        user: { ...session?.user, phoneNumber: phone }
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error al guardar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const userRole = currentUser?.role || "DOCTOR"
  const displayRole = ROLE_LABELS[userRole] || userRole
  const specialty = currentUser?.specialty
  const isActive = currentUser?.isActive ?? true

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden gap-0 bg-slate-50 dark:bg-slate-950 border-border shadow-2xl rounded-2xl">
        
        <DialogHeader className="sr-only">
          <DialogTitle>Ajustes de Perfil Profesional</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-32 bg-[#005c8a]">
          <div className="absolute top-4 right-14 flex gap-2">
            {isActive ? (
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-50 hover:bg-emerald-500/30 border-none px-3 py-1">
                <Check className="w-3 h-3 mr-1" /> Activa
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-500/20 text-red-100 border-none px-3 py-1">
                <X className="w-3 h-3 mr-1" /> Suspendida
              </Badge>
            )}
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none backdrop-blur-md px-3 py-1">
              <Shield className="w-3 h-3 mr-1" /> {displayRole}
            </Badge>
          </div>

          <div className="absolute -bottom-12 left-8 group">
            <Avatar className="h-24 w-24 border-4 border-slate-50 dark:border-slate-950 shadow-md">
              <AvatarImage src={currentUser?.image || ""} className="object-cover" />
              <AvatarFallback className="text-3xl bg-slate-200 dark:bg-slate-800 text-[#005c8a] font-black">
                {currentUser?.name?.charAt(0).toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 bg-[#008bcd] text-white rounded-full shadow-md hover:bg-blue-600 transition-all">
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CABECERA DE NOMBRE */}
        <div className="pt-16 pb-4 px-8 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {currentUser?.name || "Usuario"}
            </h2>
          </div>
          <Button 
            variant={isEditing ? "outline" : "secondary"} 
            className={cn("font-bold rounded-xl shadow-sm h-10 px-5", 
              isEditing 
                ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" 
                : "bg-slate-800 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"
            )}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <X className="h-4 w-4 mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
            {isEditing ? "Cancelar" : "Editar perfil"}
          </Button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="px-8 pb-8 space-y-8 overflow-y-auto max-h-[50vh] custom-scrollbar bg-slate-50 dark:bg-slate-950">
          
          {/* SECCIÓN 1: DATOS PROFESIONALES */}
          <section>
            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-3">
              <Stethoscope className="h-4 w-4 text-[#008bcd]" /> Datos Profesionales
            </h4>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:divide-x divide-slate-100 dark:divide-slate-800 shadow-sm">
              <div className="p-6 flex-1">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Especialidad Clínica
                </Label>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                    {specialty || <span className="italic text-slate-400 font-normal">No definida</span>}
                  </span>
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 font-medium text-[10px]">
                    (Bloqueada)
                  </Badge>
                </div>
              </div>
              <div className="p-6 flex-1">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Rol en el Sistema
                </Label>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                    {displayRole}
                  </span>
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 font-medium text-[10px]">
                    (Bloqueado)
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: CONTACTO Y CREDENCIALES */}
          <section>
            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-[#008bcd]" /> Contacto y Credenciales
            </h4>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:divide-x divide-slate-100 dark:divide-slate-800 shadow-sm">
              <div className="p-6 flex-1">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Teléfono de Contacto
                </Label>
                {isEditing ? (
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+593 9" className="h-10 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-visible:ring-[#008bcd]" />
                ) : (
                  <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                    {phone || <span className="italic text-slate-400 font-normal">No registrado</span>}
                  </span>
                )}
              </div>
              <div className="p-6 flex-1">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Correo de Acceso
                </Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-base font-medium text-slate-600 dark:text-slate-400 truncate">
                    {currentUser?.email}
                  </span>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex justify-center md:justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold text-slate-600 dark:text-slate-300">
            Cerrar panel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !isEditing} className="font-bold bg-[#006a9e] hover:bg-[#00527a] text-white px-6">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : <><Check className="mr-2 h-4 w-4" /> Confirmar Cambios</>}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}