"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { updateUserSettings } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import {
  User,
  Phone,
  Mail,
  Shield,
  Loader2,
  Check,
  Stethoscope,
  KeyRound,
  Palette,
  Camera,
  ShieldAlert,
} from "lucide-react"
import { Icons } from "@/components/icons"

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador General",
  DOCTOR: "Especialista Clínico",
  RECEPTIONIST: "Recepción y Caja",
}

const PRESET_COLORS = [
  "#008bcd",
  "#059669",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#0891b2",
  "#4f46e5",
]

const maskEmail = (email?: string | null) => {
  if (!email || !email.includes("@")) return "Sin correo asignado"

  const [username, domain] = email.split("@")

  if (username.length <= 4) {
    return `${username[0]}•••@${domain}`
  }

  const visibleStart = username.slice(0, 2)
  const visibleEnd = username.slice(-2)
  const maskedLength = Math.max(username.length - 4, 4)
  const mask = "•".repeat(maskedLength)

  return `${visibleStart}${mask}${visibleEnd}@${domain}`
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

  // Si no tiene contraseña local, proviene de Google OAuth
  const isOAuthUser = !currentUser?.hasPassword && !currentUser?.password

  const [isLoading, setIsLoading] = useState(false)

  // Campos generales
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [calendarColor, setCalendarColor] = useState("#008bcd")

  // Campos de contraseña
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentUser) {
      setPhone(currentUser.phoneNumber || currentUser.phone || "")
      setAvatarUrl(currentUser.image || "")
      setCalendarColor(currentUser.calendarColor || "#008bcd")
    }
  }, [currentUser, open])

  useEffect(() => {
    if (!open) {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }, [open])

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setter(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveGeneralAndClinical = async () => {
    setIsLoading(true)
    try {
      const payload: any = {
        phoneNumber: phone,
        image: avatarUrl,
      }

      if (isDoctor) {
        payload.calendarColor = calendarColor
      }

      const result = await updateUserSettings(payload)

      if (result?.error) {
        toast({
          title: "Error al actualizar",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      await update({
        ...session,
        user: {
          ...session?.user,
          phoneNumber: phone,
          image: avatarUrl,
          ...(isDoctor && { calendarColor }),
        },
      })

      toast({
        title: "Cambios guardados",
        description: "Tu perfil ha sido actualizado con éxito.",
      })
    } catch (error) {
      toast({
        title: "Error de servidor",
        description: "No se pudieron aplicar los cambios.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error de validación",
        description: "Las nuevas contraseñas no coinciden.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await updateUserSettings({
        currentPassword,
        newPassword,
      })

      if (result?.error) {
        toast({
          title: "No se pudo actualizar",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Contraseña actualizada",
        description: "Usa tus nuevas credenciales en el siguiente inicio de sesión.",
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un problema al cambiar la contraseña.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const displayRole = ROLE_LABELS[userRole] || userRole
  const specialty = currentUser?.specialty || currentUser?.especialidad || "Sin especialidad asignada"
  const licenseNumber = currentUser?.licenseNumber || "REG-MSP-08492"
  const maskedEmail = maskEmail(currentUser?.email)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden gap-0 bg-background border-border shadow-2xl rounded-3xl font-sans antialiased text-foreground">
        <DialogHeader className="sr-only">
          <DialogTitle>Ajustes de Perfil</DialogTitle>
          <DialogDescription>Configuración personal y de credenciales.</DialogDescription>
        </DialogHeader>

        {/* CABECERA CON BANNER Y BADGE DE ROL */}
        <div className="relative w-full h-32 bg-[#0074a8] dark:bg-[#00537a]">
          <div className="absolute top-3.5 right-12">
            <Badge className="bg-slate-900/90 text-white dark:bg-slate-100 dark:text-slate-900 border border-white/20 shadow-md px-3 py-1 text-[11px] font-bold tracking-wide">
              <Shield className="w-3.5 h-3.5 mr-1.5 text-[#008bcd]" /> {displayRole}
            </Badge>
          </div>

          <div className="absolute -bottom-10 left-8">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={avatarUrl} className="object-cover" />
                <AvatarFallback className="text-3xl bg-muted text-foreground font-black">
                  {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-[#008bcd] hover:bg-[#0074a8] text-white rounded-full shadow-md cursor-pointer transition-all"
                title="Cambiar foto de perfil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, setAvatarUrl)}
              />
            </div>
          </div>
        </div>

        {/* TITULAR DEL USUARIO CON CORREO ENMASCARADO */}
        <div className="pt-12 pb-3 px-8 bg-background flex justify-between items-center border-b border-border/60">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {currentUser?.name || "Usuario del Sistema"}
            </h2>
            <p className="text-xs text-muted-foreground font-mono font-medium tracking-tight mt-0.5">
              {maskedEmail}
            </p>
          </div>
        </div>

        {/* TABS */}
        <Tabs defaultValue="general" className="w-full">
          <div className="px-8 pt-4 bg-background">
            <TabsList className="grid grid-flow-col auto-cols-fr bg-muted p-1 rounded-xl">
              <TabsTrigger
                value="general"
                className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <User className="w-3.5 h-3.5 mr-1.5 text-[#008bcd]" /> General
              </TabsTrigger>

              {isDoctor && (
                <TabsTrigger
                  value="clinico"
                  className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                >
                  <Stethoscope className="w-3.5 h-3.5 mr-1.5 text-[#008bcd]" /> Perfil Clínico
                </TabsTrigger>
              )}

              <TabsTrigger
                value="seguridad"
                className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5 text-[#008bcd]" /> Seguridad
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-8 max-h-[46vh] overflow-y-auto custom-scrollbar bg-background">
            {/* --- TAB 1: GENERAL --- */}
            <TabsContent value="general" className="space-y-4 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Nombre Completo</Label>
                  <Input
                    value={currentUser?.name || ""}
                    disabled
                    className="h-10 rounded-xl bg-muted/40 border-border text-xs text-muted-foreground font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Teléfono Móvil (WhatsApp)</Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+591 7XXXXXXX"
                      className="pl-9 h-10 rounded-xl bg-background border-border text-xs font-medium focus-visible:ring-[#008bcd]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Correo de Acceso</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={maskedEmail}
                      disabled
                      className="pl-9 h-10 rounded-xl bg-muted/40 border-border text-xs text-muted-foreground font-mono tracking-tight font-medium select-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Rol Asignado</Label>
                  <div className="flex items-center h-10 px-3 rounded-xl border border-border bg-muted/40 text-xs font-bold text-foreground">
                    {displayRole}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  type="button"
                  onClick={handleSaveGeneralAndClinical}
                  disabled={isLoading}
                  className="bg-[#008bcd] hover:bg-[#0074a8] text-white text-xs font-bold h-9 px-5 rounded-xl cursor-pointer shadow-xs"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Guardar Contacto
                </Button>
              </div>
            </TabsContent>

            {/* --- TAB 2: PERFIL CLÍNICO (SOLO DOCTORES) --- */}
            {isDoctor && (
              <TabsContent value="clinico" className="space-y-5 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Especialidad Clínica
                    </Label>
                    <p className="text-sm font-bold text-foreground">{specialty}</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Registro Profesional / Colegiatura
                    </Label>
                    <p className="text-sm font-bold text-foreground">{licenseNumber}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#008bcd]" /> Color Identificador en la Agenda
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Distinguirá tus citas y turnos en la visualización general del calendario.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCalendarColor(color)}
                        style={{ backgroundColor: color }}
                        className={cn(
                          "w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center shadow-xs",
                          calendarColor === color
                            ? "ring-2 ring-offset-2 ring-foreground scale-110"
                            : "opacity-80 hover:opacity-100"
                        )}
                      >
                        {calendarColor === color && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button
                    type="button"
                    onClick={handleSaveGeneralAndClinical}
                    disabled={isLoading}
                    className="bg-[#008bcd] hover:bg-[#0074a8] text-white text-xs font-bold h-9 px-5 rounded-xl cursor-pointer shadow-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Guardar Perfil Clínico
                  </Button>
                </div>
              </TabsContent>
            )}

            {/* --- TAB 3: SEGURIDAD --- */}
            <TabsContent value="seguridad" className="space-y-4 m-0">
              {isOAuthUser ? (
                <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-background border border-border shrink-0">
                      <Icons.google className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Autenticación por Google Workspace
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Tu sesión está vinculada a tu cuenta corporativa de Google.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background/80 border border-border/60 text-xs text-muted-foreground leading-relaxed">
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      Esta cuenta no utiliza contraseña local. Las credenciales, el doble factor (2FA) y la seguridad de acceso se gestionan directamente a través de tu consola de Google.
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSavePassword} className="space-y-3.5 max-w-sm">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Contraseña Actual
                    </Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="h-10 rounded-xl bg-background border-border text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Nueva Contraseña
                    </Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="h-10 rounded-xl bg-background border-border text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Confirmar Nueva Contraseña
                    </Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-10 rounded-xl bg-background border-border text-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#008bcd] hover:bg-[#0074a8] text-white text-xs font-bold h-9 px-5 rounded-xl cursor-pointer shadow-xs mt-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Actualizar Contraseña
                  </Button>
                </form>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* FOOTER */}
        <div className="px-8 py-3.5 border-t border-border bg-muted/20 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="font-bold text-xs text-muted-foreground hover:text-foreground h-9 rounded-xl cursor-pointer"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}