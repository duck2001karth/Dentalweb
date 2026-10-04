"use client"

import React, { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Mail, Loader2, Camera } from "lucide-react"
import { Icons } from "@/components/icons"
import { updateUserSettings } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador General",
  DOCTOR: "Especialista Clínico",
  RECEPTIONIST: "Recepción y Caja",
}

interface ProfileSecurityTabProps {
  mode: "profile" | "security"
  accentColor: string
}

export function ProfileSecurityTab({ mode, accentColor }: ProfileSecurityTabProps) {
  const { data: session, update } = useSession()
  const { theme, resolvedTheme } = useTheme()
  const { toast } = useToast()
  const isDark = (resolvedTheme || theme) === "dark"

  const currentUser = session?.user as any
  const userRole = (currentUser?.role || "DOCTOR").toUpperCase()
  const isOAuthUser = !currentUser?.hasPassword && !currentUser?.password

  const [phone, setPhone] = useState(currentUser?.phoneNumber || currentUser?.phone || "")
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.image || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setAvatarUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSaveGeneral = async () => {
    setIsLoading(true)
    try {
      const payload: any = { phoneNumber: phone, image: avatarUrl }
      const result = await updateUserSettings(payload)

      if (result?.error) {
        toast({ title: "Error al actualizar", description: result.error, variant: "destructive" })
        return
      }

      await update({
        ...session,
        user: { ...session?.user, phoneNumber: phone, image: avatarUrl },
      })

      toast({ title: "Cambios guardados", description: "Tu información personal fue actualizada con éxito." })
    } catch {
      toast({ title: "Error", description: "No se pudieron aplicar los cambios.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Mínimo 6 caracteres.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const result = await updateUserSettings({ currentPassword, newPassword })
      if (result?.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
        return
      }

      toast({ title: "Contraseña actualizada", description: "Tus nuevas credenciales están listas." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      toast({ title: "Error", description: "Ocurrió un problema.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (mode === "profile") {
    return (
      <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
        <div className={`flex items-center gap-4 pb-4 border-b ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
          <div className="relative group shrink-0">
            <Avatar className="h-16 w-16 border shadow-xs border-slate-200 dark:border-[#1e293b]">
              <AvatarImage src={avatarUrl} className="object-cover" />
              <AvatarFallback className={`text-lg font-bold ${isDark ? "bg-[#111827] text-white" : "bg-slate-100 text-slate-800"}`}>
                {currentUser?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ backgroundColor: accentColor }}
              className="absolute bottom-0 right-0 p-1.5 text-white rounded-full shadow-md cursor-pointer hover:scale-105 transition-transform"
              title="Cambiar foto de perfil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>
          <div>
            <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {currentUser?.name || "Usuario del Sistema"}
            </h3>
            <p className={`text-xs font-mono mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {currentUser?.email}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span
                style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-md inline-block border border-current/20"
              >
                {ROLE_LABELS[userRole] || userRole}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Nombre Completo</Label>
            <Input
              value={currentUser?.name || ""}
              disabled
              className={`h-10 rounded-xl font-medium ${isDark ? "bg-[#070d18] border-[#1e293b] text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Correo Institucional</Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={currentUser?.email || ""}
                disabled
                className={`pl-9 h-10 rounded-xl text-xs font-mono ${isDark ? "bg-[#070d18] border-[#1e293b] text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"}`}
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Teléfono Móvil</Label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+593 9XXXXXXXX"
                className={`pl-9 h-10 rounded-xl text-xs ${isDark ? "bg-[#070d18] border-[#1e293b] text-white" : "bg-white border-slate-200 text-slate-900"}`}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            onClick={handleSaveGeneral}
            disabled={isLoading}
            style={{ backgroundColor: accentColor }}
            className="text-white font-bold h-9 rounded-xl px-5 cursor-pointer shadow-xs hover:opacity-90 transition-opacity border-0"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />} Guardar Información
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg animate-in fade-in duration-200">
      <div>
        <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Contraseña y Seguridad</h3>
        <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Actualiza tu método de acceso al sistema clínico</p>
      </div>

      {isOAuthUser ? (
        <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? "border-[#1e293b] bg-[#070d18]" : "border-slate-200 bg-slate-100/60"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border shadow-xs shrink-0 ${isDark ? "bg-[#111827] border-[#1e293b]" : "bg-white border-slate-200"}`}>
              <Icons.google className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Autenticación por Google Workspace</h4>
              <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Tu sesión está vinculada a tu cuenta de Google.</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSavePassword} className="space-y-3">
          <div className="space-y-1">
            <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Contraseña Actual</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className={isDark ? "bg-[#070d18] border-[#1e293b]" : "bg-white border-slate-200"}
            />
          </div>
          <div className="space-y-1">
            <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Nueva Contraseña</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className={isDark ? "bg-[#070d18] border-[#1e293b]" : "bg-white border-slate-200"}
            />
          </div>
          <div className="space-y-1">
            <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Confirmar Contraseña</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={isDark ? "bg-[#070d18] border-[#1e293b]" : "bg-white border-slate-200"}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: accentColor }}
            className="w-full text-white font-bold h-10 rounded-xl mt-2 cursor-pointer shadow-xs hover:opacity-90 transition-opacity border-0"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Actualizar Contraseña
          </Button>
        </form>
      )}
    </div>
  )
}