"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useSession } from "next-auth/react"
import { Check, Edit3 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { updateUserSettings } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AppearanceTabProps {
  currentColor?: string
  onColorChange?: (newCol: string) => void
}

const PRESET_COLORS = [
  { name: "Pizarra", hex: "#64748b" },
  { name: "Rojo Carmín", hex: "#ef4444" },
  { name: "Verde Esmeralda", hex: "#10b981" },
  { name: "Azul Médico", hex: "#008bcd" },
  { name: "Púrpura", hex: "#8b5cf6" },
]

export function AppearanceTab({
  currentColor = "#008bcd",
  onColorChange,
}: AppearanceTabProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { data: session, update } = useSession()
  const { toast } = useToast()

  const [mounted, setMounted] = useState(false)
  const [selectedColor, setSelectedColor] = useState(currentColor)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [tableDensity, setTableDensity] = useState<"compact" | "comfortable">("comfortable")

  useEffect(() => {
    setMounted(true)
    if (currentColor) setSelectedColor(currentColor)
    const savedAnim = localStorage.getItem("app_animations") !== "false"
    const savedDensity =
      (localStorage.getItem("app_table_density") as "compact" | "comfortable") || "comfortable"
    setAnimationsEnabled(savedAnim)
    setTableDensity(savedDensity)
  }, [currentColor])

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    const root = document.documentElement
    if (newTheme === "light") {
      root.classList.remove("dark")
      root.classList.add("light")
      root.style.colorScheme = "light"
    } else if (newTheme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
      root.style.colorScheme = "dark"
    } else {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (isSystemDark) {
        root.classList.add("dark")
        root.classList.remove("light")
      } else {
        root.classList.remove("dark")
        root.classList.add("light")
      }
    }
  }

  const handleColorSelect = async (hex: string) => {
    setSelectedColor(hex)
    if (onColorChange) onColorChange(hex)
    document.documentElement.style.setProperty("--primary", hex)
    document.documentElement.style.setProperty("--ring", hex)
    document.documentElement.style.setProperty("--doctor-accent", hex)
    localStorage.setItem("app_accent_color", hex)
    try {
      await updateUserSettings({ calendarColor: hex } as any)
      await update({
        ...session,
        user: {
          ...session?.user,
          calendarColor: hex,
        },
      })
      toast({
        title: "Color actualizado",
        description: "El color de énfasis se ha guardado correctamente.",
      })
    } catch {
      toast({
        title: "Error al guardar color",
        variant: "destructive",
      })
    }
  }

  const handleToggleAnimations = (enabled: boolean) => {
    setAnimationsEnabled(enabled)
    localStorage.setItem("app_animations", String(enabled))
    if (!enabled) {
      document.documentElement.classList.add("disable-animations")
    } else {
      document.documentElement.classList.remove("disable-animations")
    }
    toast({
      title: enabled ? "Animaciones activadas" : "Animaciones desactivadas",
      description: enabled
        ? "Transiciones y efectos visuales habilitados."
        : "Interfaz optimizada sin efectos de transición.",
    })
  }

  const handleTableDensityChange = (density: "compact" | "comfortable") => {
    setTableDensity(density)
    localStorage.setItem("app_table_density", density)
    document.documentElement.setAttribute("data-table-density", density)
    toast({
      title: density === "compact" ? "Vista Compacta aplicada" : "Vista Cómoda aplicada",
      description: density === "compact"
        ? "Las tablas ahora muestran más filas con espaciado optimizado."
        : "Las tablas ahora muestran un espaciado más amplio y cómodo.",
    })
  }

  return (
    <div className={`space-y-8 max-w-3xl font-sans animate-in fade-in duration-200 ${
      isDark ? "text-slate-100" : "text-slate-900"
    }`}>
      
      {/* 1. SECCIÓN TEMAS */}
      <div className="space-y-3">
        <div>
          <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Temas
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Elige el estilo visual o personaliza el tema de tu aplicación
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {/* Tarjeta Modo Claro */}
          <div
            onClick={() => handleThemeChange("light")}
            style={theme === "light" ? { borderColor: selectedColor } : undefined}
            className={cn(
              "p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between group",
              isDark ? "bg-[#070d18]" : "bg-white",
              theme === "light"
                ? "shadow-sm border-current"
                : isDark
                ? "border-[#1e293b] hover:border-slate-700"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className={`rounded-xl border p-2.5 space-y-2 shadow-2xs ${
              isDark ? "border-[#1e293b] bg-[#030712]" : "border-slate-200 bg-slate-50"
            }`}>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-12">
                <div className="bg-slate-200 rounded-md" />
                <div className="col-span-2 space-y-1">
                  <div className="h-4 bg-slate-200 rounded-md" />
                  <div className="h-4 bg-slate-200 rounded-md" />
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 mt-3 text-xs font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
              <div
                style={theme === "light" ? { backgroundColor: selectedColor, borderColor: selectedColor } : undefined}
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center text-white",
                  theme === "light" ? "border-transparent" : "border-slate-400"
                )}
              >
                {theme === "light" && <Check size={10} strokeWidth={3} />}
              </div>
              <span>Modo Claro</span>
            </div>
          </div>

          {/* Tarjeta Modo Oscuro */}
          <div
            onClick={() => handleThemeChange("dark")}
            style={theme === "dark" ? { borderColor: selectedColor } : undefined}
            className={cn(
              "p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between group",
              isDark ? "bg-[#070d18]" : "bg-white",
              theme === "dark"
                ? "shadow-sm border-current"
                : isDark
                ? "border-[#1e293b] hover:border-slate-700"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className="rounded-xl border border-[#1e293b] bg-[#030712] p-2.5 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-12">
                <div className="bg-[#070d18] border border-[#1e293b] rounded-md" />
                <div className="col-span-2 space-y-1">
                  <div className="h-4 bg-[#070d18] border border-[#1e293b] rounded-md" />
                  <div className="h-4 bg-[#070d18] border border-[#1e293b] rounded-md" />
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 mt-3 text-xs font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
              <div
                style={theme === "dark" ? { backgroundColor: selectedColor, borderColor: selectedColor } : undefined}
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center text-white",
                  theme === "dark" ? "border-transparent" : "border-slate-400"
                )}
              >
                {theme === "dark" && <Check size={10} strokeWidth={3} />}
              </div>
              <span>Modo Oscuro</span>
            </div>
          </div>

          {/* Tarjeta Preferencias del Sistema */}
          <div
            onClick={() => handleThemeChange("system")}
            style={theme === "system" ? { borderColor: selectedColor } : undefined}
            className={cn(
              "p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between group",
              isDark ? "bg-[#070d18]" : "bg-white",
              theme === "system"
                ? "shadow-sm border-current"
                : isDark
                ? "border-[#1e293b] hover:border-slate-700"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className={`rounded-xl border p-2.5 space-y-2 flex flex-col justify-between shadow-2xs bg-gradient-to-r from-slate-100 to-[#030712] ${
              isDark ? "border-[#1e293b]" : "border-slate-200"
            }`}>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-1.5 h-12">
                <div className="bg-white rounded-md border border-slate-200" />
                <div className="bg-[#070d18] rounded-md border border-[#1e293b]" />
              </div>
            </div>
            <div className={`flex items-center gap-2 mt-3 text-xs font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
              <div
                style={theme === "system" ? { backgroundColor: selectedColor, borderColor: selectedColor } : undefined}
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center text-white",
                  theme === "system" ? "border-transparent" : "border-slate-400"
                )}
              >
                {theme === "system" && <Check size={10} strokeWidth={3} />}
              </div>
              <span>Preferencias del Sistema</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`border-t ${isDark ? "border-[#1e293b]" : "border-slate-200"}`} />

      {/* 2. COLOR DE ÉNFASIS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Color de Énfasis del Doctor
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Color identificador para tus turnos, agenda clínica y acentos del sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => {
                const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase()
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleColorSelect(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={cn(
                      "w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center text-white shadow-2xs",
                      isSelected
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105 opacity-90"
                    )}
                    title={c.name}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
            <div className={`flex items-center gap-2 pl-2 border-l ${
              isDark ? "border-[#1e293b]" : "border-slate-200"
            }`}>
              <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Personalizado
              </span>
              <div className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1 text-xs font-mono font-bold relative ${
                isDark
                  ? "bg-[#030712] border-[#1e293b] text-white"
                  : "bg-slate-100 border-slate-200 text-slate-900"
              }`}>
                <span>{selectedColor.toLowerCase()}</span>
                <label className="cursor-pointer flex items-center justify-center p-0.5 hover:opacity-80">
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
                <div
                  style={{ backgroundColor: selectedColor }}
                  className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs shrink-0 ml-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`border-t ${isDark ? "border-[#1e293b]" : "border-slate-200"}`} />

      {/* 3. ANIMACIONES */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Mostrar Animaciones
          </h3>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Habilitar o deshabilitar animaciones y transiciones de la interfaz
          </p>
        </div>
        <Switch
          checked={animationsEnabled}
          onCheckedChange={handleToggleAnimations}
          style={animationsEnabled ? { backgroundColor: selectedColor } : undefined}
        />
      </div>

      <div className={`border-t ${isDark ? "border-[#1e293b]" : "border-slate-200"}`} />

      {/* 4. DENSIDAD DE TABLAS */}
      <div className="space-y-3">
        <div>
          <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Vista de Tablas
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Personaliza cómo se estructuran y muestran los listados en la aplicación
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div
            onClick={() => handleTableDensityChange("compact")}
            style={tableDensity === "compact" ? { borderColor: selectedColor } : undefined}
            className={cn(
              "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-36",
              isDark ? "bg-[#070d18]" : "bg-white",
              tableDensity === "compact"
                ? `shadow-sm border-current ${isDark ? "bg-[#030712]" : "bg-slate-50"}`
                : isDark
                ? "border-[#1e293b] hover:border-slate-700"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className="space-y-2 opacity-80">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>Vista Compacta</span>
                <div className="flex gap-1">
                  <div className="w-5 h-2 bg-slate-400/40 rounded-full" />
                  <div className="w-5 h-2 bg-slate-400/40 rounded-full" />
                </div>
              </div>
              <div className={`h-px w-full ${isDark ? "bg-[#1e293b]" : "bg-slate-200"}`} />
              <div className={`h-2 rounded-sm w-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
              <div className={`h-2 rounded-sm w-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
              <div className={`h-2 rounded-sm w-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
            </div>
            <p className={`text-xs font-bold mt-2 ${
              tableDensity === "compact"
                ? (isDark ? "text-white" : "text-slate-900")
                : "text-slate-500"
            }`}>
              Vista Compacta
            </p>
          </div>

          <div
            onClick={() => handleTableDensityChange("comfortable")}
            style={tableDensity === "comfortable" ? { borderColor: selectedColor } : undefined}
            className={cn(
              "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-36",
              isDark ? "bg-[#070d18]" : "bg-white",
              tableDensity === "comfortable"
                ? `shadow-sm border-current ${isDark ? "bg-[#030712]" : "bg-slate-50"}`
                : isDark
                ? "border-[#1e293b] hover:border-slate-700"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className="space-y-3 opacity-80">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>Vista Cómoda</span>
                <div className="flex gap-1">
                  <div className="w-5 h-2.5 bg-slate-400/40 rounded-full" />
                  <div className="w-5 h-2.5 bg-slate-400/40 rounded-full" />
                </div>
              </div>
              <div className={`h-px w-full ${isDark ? "bg-[#1e293b]" : "bg-slate-200"}`} />
              <div className={`h-3 rounded-md w-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
              <div className={`h-3 rounded-md w-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />
            </div>
            <p className={`text-xs font-bold mt-2 ${
              tableDensity === "comfortable"
                ? (isDark ? "text-white" : "text-slate-900")
                : "text-slate-500"
            }`}>
              Vista Cómoda
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}