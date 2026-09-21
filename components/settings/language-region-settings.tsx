"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Globe, Check, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface LanguageOption {
  code: string
  name: string
  region: string
  countryCode: string
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "es-EC", name: "Español", region: "Ecuador / Latinoamérica", countryCode: "EC" },
  { code: "es-ES", name: "Español", region: "España / Europa", countryCode: "ES" },
  { code: "en-US", name: "English", region: "United States", countryCode: "US" },
  { code: "pt-BR", name: "Português", region: "Brasil", countryCode: "BR" },
  { code: "fr-FR", name: "Français", region: "France / Europe", countryCode: "FR" },
  { code: "it-IT", name: "Italiano", region: "Italia", countryCode: "IT" },
]

interface LanguageRegionSettingsProps {
  accentColor?: string
}

export function LanguageRegionSettings({
  accentColor = "#008bcd",
}: LanguageRegionSettingsProps) {
  const { theme, resolvedTheme } = useTheme()
  const isDark = (resolvedTheme || theme) === "dark"
  const { toast } = useToast()

  const [selectedLanguage, setSelectedLanguage] = useState<string>("es-EC")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem("app_language")
    if (savedLang) setSelectedLanguage(savedLang)
  }, [])

  const handleSavePreferences = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem("app_language", selectedLanguage)
      try {
        await fetch("/api/users/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: selectedLanguage }),
        })
      } catch {}
      toast({
        title: "Idioma actualizado",
        description: "La preferencia de idioma se ha guardado correctamente.",
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar el idioma.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`space-y-6 font-sans max-w-2xl animate-in fade-in duration-200 ${
      isDark ? "text-slate-100" : "text-slate-900"
    }`}>
      {/* CABECERA */}
      <div className={`border-b pb-4 ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
        <h3 className={`text-xl font-bold flex items-center gap-2.5 ${
          isDark ? "text-white" : "text-slate-900"
        }`}>
          <Globe className="w-5 h-5" style={{ color: accentColor }} />
          Idioma de la Plataforma
        </h3>
        <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Selecciona el idioma principal para la interfaz y los módulos del expediente clínico.
        </p>
      </div>

      {/* SELECTOR DE IDIOMAS */}
      <div className="space-y-3">
        <Label className={`text-xs font-bold uppercase tracking-wider ${
          isDark ? "text-slate-300" : "text-slate-700"
        }`}>
          Idiomas Disponibles
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLanguage(lang.code)}
                style={
                  isSelected
                    ? {
                        borderColor: accentColor,
                        backgroundColor: `${accentColor}15`,
                      }
                    : undefined
                }
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer group",
                  isSelected
                    ? "shadow-xs border-current"
                    : isDark
                    ? "border-[#1e293b] bg-[#070d18] hover:bg-[#0d1526]"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    style={isSelected ? { backgroundColor: accentColor } : undefined}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors",
                      isSelected
                        ? "text-white shadow-xs"
                        : isDark
                        ? "bg-[#111827] text-slate-300 group-hover:text-white"
                        : "bg-slate-100 text-slate-700 group-hover:text-slate-900"
                    )}
                  >
                    {lang.countryCode}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-bold leading-tight",
                        isSelected
                          ? isDark ? "text-white" : "text-slate-900"
                          : isDark ? "text-slate-200" : "text-slate-800"
                      )}
                    >
                      {lang.name}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {lang.region}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div
                    style={{ backgroundColor: accentColor }}
                    className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs"
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* BOTÓN GUARDAR */}
      <div className={`pt-4 border-t flex justify-end ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
        <Button
          type="button"
          onClick={handleSavePreferences}
          disabled={isSaving}
          style={{ backgroundColor: accentColor }}
          className="text-white rounded-xl text-xs font-bold h-10 px-6 shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 hover:opacity-90 border-0"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar Preferencias
        </Button>
      </div>
    </div>
  )
}