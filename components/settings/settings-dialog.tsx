"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { updateUserSettings } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Phone,
  Mail,
  Loader2,
  Camera,
  Clock,
  Command,
  ShieldCheck,
  BellRing,
  Eye,
  X,
} from "lucide-react"
import { Icons } from "@/components/icons"
import { DoctorSignatureTab } from "./tabs/doctor-signature-tab"
import { SettingsSidebar } from "@/components/settings/settings-sidebar"
import { AppearanceTab } from "@/components/settings/tabs/appearance-tab"
import { ClinicalProfileTab } from "@/components/settings/tabs/clinical-profile-tab"
import { LanguageRegionSettings } from "@/components/settings/language-region-settings"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador General",
  DOCTOR: "Especialista Clínico",
  RECEPTIONIST: "Recepción y Caja",
}

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: string
}

export function SettingsDialog({
  open,
  onOpenChange,
  defaultTab = "profile",
}: SettingsDialogProps) {
  const { data: session, update } = useSession()
  const { theme, resolvedTheme } = useTheme()
  const { toast } = useToast()

  const isDark = (resolvedTheme || theme) === "dark"

  const currentUser = session?.user as any
  const userRole = (currentUser?.role || "DOCTOR").toUpperCase()
  const isDoctor = userRole === "DOCTOR"
  const isOAuthUser = !currentUser?.hasPassword && !currentUser?.password

  const [activeSubTab, setActiveSubTab] = useState(defaultTab)
  const [isLoading, setIsLoading] = useState(false)
  const [liveAccentColor, setLiveAccentColor] = useState<string>(
    currentUser?.calendarColor || "#008bcd"
  )
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [professionalCard, setProfessionalCard] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setActiveSubTab(defaultTab)
    }
  }, [open, defaultTab])

  useEffect(() => {
    if (currentUser) {
      setPhone(currentUser.phoneNumber || currentUser.phone || "")
      setAvatarUrl(currentUser.image || "")
      setProfessionalCard(currentUser.professionalCard || currentUser.licenseNumber || "")
      if (currentUser.calendarColor) {
        setLiveAccentColor(currentUser.calendarColor)
      }
    }
    if (open) {
      fetch("/api/users/signature")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.professionalCard) {
            setProfessionalCard(data.professionalCard)
          }
        })
        .catch(() => {})
    }
  }, [currentUser, open])

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setter(reader.result as string)
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
        user: {
          ...session?.user,
          phoneNumber: phone,
          image: avatarUrl,
        },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden gap-0 border shadow-2xl rounded-3xl flex font-sans antialiased [&>button:last-child]:hidden transition-colors ${
          isDark
            ? "bg-[#070d18] border-[#1e293b] text-white"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Ajustes</DialogTitle>
          <DialogDescription>Ajustes globales del sistema</DialogDescription>
        </DialogHeader>

        {/* BARRA LATERAL */}
        <SettingsSidebar
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
          isDoctor={isDoctor}
          currentColor={liveAccentColor}
        />

        {/* CONTENIDO PRINCIPAL DERECHO */}
        <div
          className={`flex-1 flex flex-col h-full relative overflow-hidden transition-colors ${
            isDark ? "bg-[#030712]" : "bg-slate-50/60"
          }`}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`absolute top-5 right-6 z-30 p-1.5 rounded-full transition-colors cursor-pointer ${
              isDark
                ? "text-slate-400 hover:text-white hover:bg-white/10"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            }`}
            title="Cerrar ajustes"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex-1 overflow-y-auto p-8 sm:p-10 custom-scrollbar">
            {activeSubTab === "appearance" && (
              <AppearanceTab
                currentColor={liveAccentColor}
                onColorChange={(newCol: string) => setLiveAccentColor(newCol)}
              />
            )}

            {activeSubTab === "profile" && (
              <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
                <div
                  className={`flex items-center gap-4 pb-4 border-b ${
                    isDark ? "border-[#1e293b]" : "border-slate-200"
                  }`}
                >
                  <div className="relative group shrink-0">
                    <Avatar className="h-16 w-16 border shadow-xs border-slate-200 dark:border-[#1e293b]">
                      <AvatarImage src={avatarUrl} className="object-cover" />
                      <AvatarFallback
                        className={`text-lg font-bold ${
                          isDark ? "bg-[#111827] text-white" : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ backgroundColor: liveAccentColor }}
                      className="absolute bottom-0 right-0 p-1 text-white rounded-full shadow cursor-pointer hover:scale-105 transition-transform"
                      title="Cambiar foto de perfil"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setAvatarUrl)}
                    />
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
                        style={{ backgroundColor: `${liveAccentColor}1A`, color: liveAccentColor }}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md inline-block border border-current/20"
                      >
                        {ROLE_LABELS[userRole] || userRole}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Nombre Completo
                    </Label>
                    <Input
                      value={currentUser?.name || ""}
                      disabled
                      className={`h-10 rounded-xl font-medium ${
                        isDark
                          ? "bg-[#070d18] border-[#1e293b] text-slate-400"
                          : "bg-slate-100 border-slate-200 text-slate-500"
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Correo Institucional
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={currentUser?.email || ""}
                        disabled
                        className={`pl-9 h-10 rounded-xl text-xs font-mono ${
                          isDark
                            ? "bg-[#070d18] border-[#1e293b] text-slate-400"
                            : "bg-slate-100 border-slate-200 text-slate-500"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      Teléfono Móvil
                    </Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+593 9XXXXXXXX"
                        className={`pl-9 h-10 rounded-xl text-xs ${
                          isDark
                            ? "bg-[#070d18] border-[#1e293b] text-white"
                            : "bg-white border-slate-200 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleSaveGeneral}
                    disabled={isLoading}
                    style={{ backgroundColor: liveAccentColor }}
                    className="text-white font-bold h-9 rounded-xl px-5 cursor-pointer shadow-xs hover:opacity-90 transition-opacity border-0"
                  >
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />} Guardar Información
                  </Button>
                </div>
              </div>
            )}

            {activeSubTab === "clinical" && isDoctor && (
              <ClinicalProfileTab
                accentColor={liveAccentColor}
                professionalCard={professionalCard}
                onGoToSignature={() => setActiveSubTab("signature")}
              />
            )}

            {activeSubTab === "signature" && isDoctor && (
              <div className="animate-in fade-in duration-200">
                <DoctorSignatureTab
                  initialLicense={professionalCard}
                  initialSignature={currentUser?.signatureBase64 || null}
                  accentColor={liveAccentColor}
                  onSignatureUpdated={(newSig, newLicense) => {
                    setProfessionalCard(newLicense)
                    update({
                      ...session,
                      user: {
                        ...session?.user,
                        signatureBase64: newSig,
                        professionalCard: newLicense,
                        licenseNumber: newLicense,
                      },
                    })
                  }}
                />
              </div>
            )}

            {activeSubTab === "security" && (
              <div className="space-y-6 max-w-lg animate-in fade-in duration-200">
                <div>
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Contraseña y Seguridad
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Actualiza tu método de acceso al sistema clínico
                  </p>
                </div>
                {isOAuthUser ? (
                  <div
                    className={`p-5 rounded-2xl border space-y-3 ${
                      isDark ? "border-[#1e293b] bg-[#070d18]" : "border-slate-200 bg-slate-100/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl border shadow-xs shrink-0 ${
                          isDark ? "bg-[#111827] border-[#1e293b]" : "bg-white border-slate-200"
                        }`}
                      >
                        <Icons.google className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                          Autenticación por Google Workspace
                        </h4>
                        <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Tu sesión está vinculada a tu cuenta institucional de Google.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSavePassword} className="space-y-3">
                    <div className="space-y-1">
                      <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        Contraseña Actual
                      </Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className={isDark ? "bg-[#070d18] border-[#1e293b]" : "bg-white border-slate-200"}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        Nueva Contraseña
                      </Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className={isDark ? "bg-[#070d18] border-[#1e293b]" : "bg-white border-slate-200"}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        Confirmar Contraseña
                      </Label>
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
                      style={{ backgroundColor: liveAccentColor }}
                      className="w-full text-white font-bold h-10 rounded-xl mt-2 cursor-pointer shadow-xs hover:opacity-90 transition-opacity border-0"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Actualizar Contraseña
                    </Button>
                  </form>
                )}
              </div>
            )}

            {activeSubTab === "language" && (
              <div className="animate-in fade-in duration-200">
                <LanguageRegionSettings accentColor={liveAccentColor} />
              </div>
            )}

            {activeSubTab === "datetime" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Fecha y Hora</h3>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Formato de 24 horas habilitado para la agenda quirúrgica y citas odontológicas.
                </p>
              </div>
            )}

            {activeSubTab === "shortcuts" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Command className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Atajos de Teclado</h3>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Presiona{" "}
                  <kbd
                    className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${
                      isDark
                        ? "bg-[#111827] border-[#1e293b] text-slate-200"
                        : "bg-slate-200 border-slate-300 text-slate-800"
                    }`}
                  >
                    Ctrl + K
                  </kbd>{" "}
                  para abrir el buscador global de pacientes.
                </p>
              </div>
            )}

            {activeSubTab === "privacy" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Privacidad</h3>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Los registros clínicos, notas de evolución y firmas biométricas cuentan con cifrado y registro de auditoría estricto.
                </p>
              </div>
            )}

            {activeSubTab === "notifications" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <BellRing className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Notificaciones</h3>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Gestión de recordatorios automáticos por WhatsApp y avisos de llegada de pacientes a sala de espera.
                </p>
              </div>
            )}

            {activeSubTab === "accessibility" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Accesibilidad</h3>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Soporte para alto contraste y navegación por teclado optimizada para entornos clínicos.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}