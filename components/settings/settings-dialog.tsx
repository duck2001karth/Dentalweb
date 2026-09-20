"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
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
  Globe,
  Clock,
  Command,
  CreditCard,
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

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador General",
  DOCTOR: "Especialista Clínico",
  RECEPTIONIST: "Recepción y Caja",
}

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: session, update } = useSession()
  const { toast } = useToast()

  const currentUser = session?.user as any
  const userRole = (currentUser?.role || "DOCTOR").toUpperCase()
  const isDoctor = userRole === "DOCTOR"
  const isOAuthUser = !currentUser?.hasPassword && !currentUser?.password

  const [activeSubTab, setActiveSubTab] = useState("appearance")
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

  useEffect(() => {
    if (!open) {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setActiveSubTab("appearance")
    }
  }, [open])

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
      <DialogContent className="sm:max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden gap-0 bg-white border border-slate-200/80 shadow-2xl rounded-3xl flex font-sans antialiased text-slate-900 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Ajustes</DialogTitle>
          <DialogDescription>Ajustes globales del sistema</DialogDescription>
        </DialogHeader>
        <SettingsSidebar
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
          isDoctor={isDoctor}
          currentColor={liveAccentColor}
        />
        <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-6 z-30 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
            title="Cerrar ajustes"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex-1 overflow-y-auto p-8 sm:p-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
            
            {/* SUB-PESTAÑA: APARIENCIA */}
            {activeSubTab === "appearance" && (
              <AppearanceTab
                currentColor={liveAccentColor}
                onColorChange={(newCol) => setLiveAccentColor(newCol)}
              />
            )}

            {/* SUB-PESTAÑA: INFORMACIÓN PERSONAL */}
            {activeSubTab === "profile" && (
              <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="relative group shrink-0">
                    <Avatar className="h-16 w-16 border border-slate-200 shadow-xs">
                      <AvatarImage src={avatarUrl} className="object-cover" />
                      <AvatarFallback className="text-lg font-bold bg-slate-100 text-slate-700">
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
                    <h3 className="text-base font-bold text-slate-900">
                      {currentUser?.name || "Usuario del Sistema"}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser?.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        style={{ backgroundColor: `${liveAccentColor}1A`, color: liveAccentColor }}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md inline-block"
                      >
                        {ROLE_LABELS[userRole] || userRole}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Nombre Completo</Label>
                    <Input
                      value={currentUser?.name || ""}
                      disabled
                      className="h-10 rounded-xl bg-slate-50 border-slate-200 font-medium text-slate-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Correo Institucional</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={currentUser?.email || ""}
                        disabled
                        className="pl-9 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-mono text-slate-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold text-slate-700">Teléfono Móvil (WhatsApp)</Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+593 9XXXXXXXX / +591 7XXXXXXX"
                        className="pl-9 h-10 rounded-xl border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleSaveGeneral}
                    disabled={isLoading}
                    style={{ backgroundColor: liveAccentColor }}
                    className="text-white font-bold h-9 rounded-xl px-5 cursor-pointer shadow-xs hover:opacity-90 transition-opacity"
                  >
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />} Guardar Información
                  </Button>
                </div>
              </div>
            )}

            {/* SUB-PESTAÑA: PERFIL CLÍNICO (DESGLOSADO EN COMPONENTE LIMPIO) */}
            {activeSubTab === "clinical" && isDoctor && (
              <ClinicalProfileTab
                accentColor={liveAccentColor}
                professionalCard={professionalCard}
                onGoToSignature={() => setActiveSubTab("signature")}
              />
            )}

            {/* SUB-PESTAÑA: FIRMA Y SELLO */}
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

            {/* SUB-PESTAÑA: CONTRASEÑA Y SEGURIDAD */}
            {activeSubTab === "security" && (
              <div className="space-y-6 max-w-lg animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Contraseña y Seguridad</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Actualiza tu método de acceso al sistema clínico
                  </p>
                </div>

                {isOAuthUser ? (
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0">
                        <Icons.google className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Autenticación por Google Workspace
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tu sesión está vinculada a tu cuenta institucional de Google.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSavePassword} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Contraseña Actual</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="h-10 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Nueva Contraseña</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="h-10 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Confirmar Contraseña</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-10 rounded-xl border-slate-200"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      style={{ backgroundColor: liveAccentColor }}
                      className="w-full text-white font-bold h-10 rounded-xl mt-2 cursor-pointer shadow-xs hover:opacity-90 transition-opacity"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Actualizar Contraseña
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* OTRAS SUB-PESTAÑAS */}
            {activeSubTab === "language" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className="text-base font-bold text-slate-900">Idioma y Región</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  El idioma predeterminado del sistema es Español (América Latina). Los formatos de moneda y zonas horarias se adaptan automáticamente a la sede clínica.
                </p>
              </div>
            )}

            {activeSubTab === "datetime" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className="text-base font-bold text-slate-900">Fecha y Hora</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Formato de 24 horas habilitado para la agenda quirúrgica y citas odontológicas.
                </p>
              </div>
            )}

            {activeSubTab === "shortcuts" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Command className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className="text-base font-bold text-slate-900">Atajos de Teclado</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700">Ctrl + K</kbd> para abrir el buscador global de pacientes.
                </p>
              </div>
            )}

            {activeSubTab === "plans" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className="text-base font-bold text-slate-900">Planes y Mejoras</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Plan Activo: Carmo Dental Pro Edition. Facturación electrónica y módulos clínicos habilitados.
                </p>
              </div>
            )}

            {activeSubTab === "privacy" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className="text-base font-bold text-slate-900">Privacidad</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Los registros clínicos, notas de evolución y firmas biométricas cuentan con cifrado y registro de auditoría estricto.
                </p>
              </div>
            )}

            {activeSubTab === "notifications" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <BellRing className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className="text-base font-bold text-slate-900">Notificaciones</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gestión de recordatorios automáticos por WhatsApp y avisos de llegada de pacientes a sala de espera.
                </p>
              </div>
            )}

            {activeSubTab === "accessibility" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className="text-base font-bold text-slate-900">Accesibilidad</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
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