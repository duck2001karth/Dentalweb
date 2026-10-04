"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { X, Command, ShieldCheck, BellRing, Eye } from "lucide-react"

import { SettingsSidebar } from "@/components/settings/settings-sidebar"
import { SettingsHomeTab } from "@/components/settings/tabs/settings-home-tab"
import { AppearanceTab } from "@/components/settings/tabs/appearance-tab"
import { ProfileSecurityTab } from "@/components/settings/tabs/profile-security-tab"
import { ClinicalProfileTab } from "@/components/settings/tabs/clinical-profile-tab"
import { DoctorSignatureTab } from "@/components/settings/tabs/doctor-signature-tab"
import { LanguageRegionSettings } from "@/components/settings/language-region-settings"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: string
}

export function SettingsDialog({
  open,
  onOpenChange,
  defaultTab = "home", 
}: SettingsDialogProps) {
  const { data: session, update } = useSession()
  const { theme, resolvedTheme } = useTheme()
  const isDark = (resolvedTheme || theme) === "dark"

  const currentUser = session?.user as any
  const userRole = (currentUser?.role || "DOCTOR").toUpperCase()
  const isDoctor = userRole === "DOCTOR"

  const [activeSubTab, setActiveSubTab] = useState(defaultTab)
  const [liveAccentColor, setLiveAccentColor] = useState<string>(
    currentUser?.calendarColor || "#008bcd"
  )
  const [professionalCard, setProfessionalCard] = useState("")

  useEffect(() => {
    if (open) {
      setActiveSubTab(defaultTab)
    }
  }, [open, defaultTab])

  useEffect(() => {
    if (currentUser?.calendarColor) {
      setLiveAccentColor(currentUser.calendarColor)
    }
    if (open && isDoctor) {
      fetch("/api/users/signature")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.professionalCard) {
            setProfessionalCard(data.professionalCard)
          }
        })
        .catch(() => {})
    }
  }, [currentUser, open, isDoctor])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden gap-0 border shadow-2xl rounded-[24px] flex font-sans antialiased [&>button:last-child]:hidden transition-colors ${
          isDark
            ? "bg-[#070d18] border-[#1e293b] text-white"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
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
            
            {/* 1. VISTA DE INICIO / BIENVENIDA */}
            {activeSubTab === "home" && (
              <SettingsHomeTab
                doctorName={currentUser?.name}
                accentColor={liveAccentColor}
                isDoctor={isDoctor}
                onNavigateTab={(tab) => setActiveSubTab(tab)}
                hasSignature={Boolean(currentUser?.signatureBase64)}
                hasLicense={Boolean(professionalCard)}
              />
            )}

            {/* 2. GENERAL */}
            {activeSubTab === "appearance" && (
              <AppearanceTab
                currentColor={liveAccentColor}
                onColorChange={(newCol: string) => setLiveAccentColor(newCol)}
              />
            )}

            {activeSubTab === "language" && (
              <div className="animate-in fade-in duration-200">
                <LanguageRegionSettings accentColor={liveAccentColor} />
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
                  <kbd className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${isDark ? "bg-[#111827] border-[#1e293b] text-slate-200" : "bg-slate-200 border-slate-300 text-slate-800"}`}>
                    Ctrl + K
                  </kbd>{" "}
                  para abrir el buscador global de pacientes.
                </p>
              </div>
            )}

            {/* 3. CUENTA (MODULARIZADO) */}
            {activeSubTab === "profile" && (
              <ProfileSecurityTab mode="profile" accentColor={liveAccentColor} />
            )}

            {activeSubTab === "security" && (
              <ProfileSecurityTab mode="security" accentColor={liveAccentColor} />
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

            {/* 4. SECCIONES INFORMATIVAS */}
            {activeSubTab === "privacy" && (
              <div className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" style={{ color: liveAccentColor }} />
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Privacidad</h3>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Los registros clínicos y firmas digitales cuentan con encriptación y trazabilidad estricta.
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
                  Gestión de recordatorios automáticos por WhatsApp y avisos de llegada de pacientes.
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
                  Soporte para alto contraste y navegación accesible para consultorios odontológicos.
                </p>
              </div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}