"use client"

import React, { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { useSession } from "next-auth/react"
import { Check, Loader2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { updateUserSettings } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

const ACCENT_COLORS = [
  "#1e293b",
  "#ef4444",
  "#10b981",
  "#008bcd",
  "#a855f7",
]

export interface AppearanceTabProps {
  currentColor?: string
  onColorChange?: (color: string) => void
}

export function AppearanceTab({
  currentColor = "#008bcd",
  onColorChange,
}: AppearanceTabProps) {
  const { theme, setTheme } = useTheme()
  const { data: session, update } = useSession()
  const { toast } = useToast()

  const [accentColor, setAccentColor] = useState<string>(currentColor)
  const [customHex, setCustomHex] = useState<string>(currentColor)
  const [isSavingColor, setIsSavingColor] = useState(false)
  const [showAnimations, setShowAnimations] = useState(true)
  const [tableView, setTableView] = useState<"compact" | "comfortable">("comfortable")

  const colorInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (currentColor) {
      setAccentColor(currentColor)
      setCustomHex(currentColor)
    }
  }, [currentColor])

  const executeSaveColor = async (color: string) => {
    setIsSavingColor(true)
    try {
      const res = await updateUserSettings({ calendarColor: color })
      if (res?.error) {
        toast({ title: "Error", description: res.error, variant: "destructive" })
        return
      }

      await update({
        ...session,
        user: {
          ...session?.user,
          calendarColor: color,
        },
      })

      if (onColorChange) onColorChange(color)

      toast({
        title: "Color guardado automáticamente",
        description: `Se aplicó ${color} a tu tema y calendario clínico.`,
      })
    } catch {
      toast({ title: "Error", description: "No se pudo guardar el color.", variant: "destructive" })
    } finally {
      setIsSavingColor(false)
    }
  }

  const handleSelectColor = (color: string) => {
    setAccentColor(color)
    setCustomHex(color)
    if (onColorChange) onColorChange(color)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    executeSaveColor(color)
  }

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCustomHex(val)

    if (/^#[0-9A-F]{6}$/i.test(val)) {
      setAccentColor(val)
      if (onColorChange) onColorChange(val)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        executeSaveColor(val)
      }, 500)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200 font-sans text-slate-800">
      {/* 1. SECCIÓN TEMAS */}
      <div className="space-y-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Temas</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Elige el estilo visual o personaliza el tema de tu aplicación
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Modo Claro */}
          <div
            onClick={() => setTheme("light")}
            style={theme === "light" ? { borderColor: accentColor, backgroundColor: `${accentColor}0D` } : undefined}
            className={cn(
              "group cursor-pointer rounded-2xl border-2 transition-all p-3 flex flex-col justify-between bg-white",
              theme !== "light" && "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className="w-full h-24 rounded-xl bg-slate-50 border border-slate-200/80 p-2 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 grid grid-cols-3 gap-1.5 pt-1">
                <div className="col-span-1 rounded-md bg-white border border-slate-200/60" />
                <div className="col-span-2 flex flex-col gap-1">
                  <div className="h-4 rounded bg-slate-200/70" />
                  <div className="h-7 rounded bg-slate-200/40" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <div
                style={theme === "light" ? { borderColor: accentColor, backgroundColor: accentColor } : undefined}
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  theme !== "light" && "border-slate-300"
                )}
              >
                {theme === "light" && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
              </div>
              <span className="text-xs font-bold text-slate-900">Modo Claro</span>
            </div>
          </div>

          {/* Modo Oscuro */}
          <div
            onClick={() => setTheme("dark")}
            style={theme === "dark" ? { borderColor: accentColor, backgroundColor: `${accentColor}0D` } : undefined}
            className={cn(
              "group cursor-pointer rounded-2xl border-2 transition-all p-3 flex flex-col justify-between bg-white",
              theme !== "dark" && "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className="w-full h-24 rounded-xl bg-slate-900 border border-slate-800 p-2 flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 grid grid-cols-3 gap-1.5 pt-1">
                <div className="col-span-1 rounded-md bg-slate-800/80 border border-slate-700/50" />
                <div className="col-span-2 flex flex-col gap-1">
                  <div className="h-4 rounded bg-slate-800" />
                  <div className="h-7 rounded bg-slate-800/50" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <div
                style={theme === "dark" ? { borderColor: accentColor, backgroundColor: accentColor } : undefined}
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  theme !== "dark" && "border-slate-300"
                )}
              >
                {theme === "dark" && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
              </div>
              <span className="text-xs font-bold text-slate-900">Modo Oscuro</span>
            </div>
          </div>

          {/* Preferencias del Sistema */}
          <div
            onClick={() => setTheme("system")}
            style={theme === "system" ? { borderColor: accentColor, backgroundColor: `${accentColor}0D` } : undefined}
            className={cn(
              "group cursor-pointer rounded-2xl border-2 transition-all p-3 flex flex-col justify-between bg-white",
              theme !== "system" && "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className="w-full h-24 rounded-xl overflow-hidden border border-slate-200 flex">
              <div className="w-1/2 bg-slate-50 p-2 flex flex-col gap-1.5 border-r border-slate-200">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>
                <div className="h-10 rounded bg-slate-200/60 mt-1" />
              </div>
              <div className="w-1/2 bg-slate-900 p-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-10 rounded bg-slate-800 mt-1" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <div
                style={theme === "system" ? { borderColor: accentColor, backgroundColor: accentColor } : undefined}
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  theme !== "system" && "border-slate-300"
                )}
              >
                {theme === "system" && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
              </div>
              <span className="text-xs font-bold text-slate-900">Preferencias del Sistema</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 2. COLORES DE ÉNFASIS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Color de Énfasis del Doctor</h3>
            {isSavingColor && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: accentColor }} />}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Color identificador para tus turnos, agenda clínica y acentos del sistema
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleSelectColor(c)}
                style={{ backgroundColor: c }}
                className={cn(
                  "w-6 h-6 rounded-full transition-all cursor-pointer flex items-center justify-center shadow-xs",
                  accentColor.toLowerCase() === c.toLowerCase()
                    ? "ring-2 ring-offset-2 ring-slate-900 scale-110"
                    : "opacity-85 hover:opacity-100"
                )}
              >
                {accentColor.toLowerCase() === c.toLowerCase() && (
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Personalizado</span>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
              <input
                ref={colorInputRef}
                type="color"
                value={accentColor.startsWith("#") ? accentColor : "#008bcd"}
                onChange={(e) => handleSelectColor(e.target.value)}
                className="sr-only"
              />

              <Input
                type="text"
                value={customHex}
                onChange={handleCustomHexChange}
                placeholder="#000000"
                className="h-6 w-20 p-0 text-xs font-mono font-bold bg-transparent border-0 focus-visible:ring-0 text-slate-800"
              />

              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                title="Elegir con selector visual (Lápiz)"
              >
                <Pencil className="w-3 h-3" />
              </button>

              <div
                className="w-4 h-4 rounded-full border border-slate-300 shrink-0 cursor-pointer"
                style={{ backgroundColor: customHex }}
                onClick={() => colorInputRef.current?.click()}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* 3. ANIMACIONES */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Mostrar Animaciones</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Habilitar o deshabilitar animaciones y transiciones de la interfaz
          </p>
        </div>
        <Switch
          checked={showAnimations}
          onCheckedChange={setShowAnimations}
          style={showAnimations ? { backgroundColor: accentColor } : undefined}
        />
      </div>

      <div className="h-px bg-slate-100" />

      {/* 4. VISTA DE TABLAS */}
      <div className="space-y-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Vista de Tablas</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Personaliza cómo se estructuran y muestran los listados en la aplicación
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div
            onClick={() => setTableView("compact")}
            style={tableView === "compact" ? { borderColor: accentColor, backgroundColor: `${accentColor}0D` } : undefined}
            className={cn(
              "cursor-pointer rounded-2xl border-2 p-3 transition-all bg-white flex flex-col gap-2.5",
              tableView !== "compact" && "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className="w-full h-20 rounded-xl bg-slate-50 p-2.5 flex flex-col gap-1.5 border border-slate-200/60">
              <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                <span className="text-[9px] font-bold text-slate-400">Vista Compacta</span>
                <div className="flex gap-1">
                  <span className="w-8 h-2 rounded bg-slate-300/60" />
                  <span className="w-8 h-2 rounded bg-slate-300/60" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="w-full h-2 rounded bg-slate-200/80" />
                <span className="w-full h-2 rounded bg-slate-200/80" />
                <span className="w-full h-2 rounded bg-slate-200/80" />
              </div>
            </div>
            <span className="text-xs font-bold text-slate-900 px-1">Vista Compacta</span>
          </div>

          <div
            onClick={() => setTableView("comfortable")}
            style={tableView === "comfortable" ? { borderColor: accentColor, backgroundColor: `${accentColor}0D` } : undefined}
            className={cn(
              "cursor-pointer rounded-2xl border-2 p-3 transition-all bg-white flex flex-col gap-2.5",
              tableView !== "comfortable" && "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className="w-full h-20 rounded-xl bg-slate-50 p-2.5 flex flex-col justify-between border border-slate-200/60">
              <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                <span className="text-[9px] font-bold text-slate-400">Vista Cómoda</span>
                <div className="flex gap-1">
                  <span className="w-8 h-2.5 rounded bg-slate-300/60" />
                  <span className="w-8 h-2.5 rounded bg-slate-300/60" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="w-full h-3 rounded bg-slate-200/80" />
                <span className="w-full h-3 rounded bg-slate-200/80" />
              </div>
            </div>
            <span className="text-xs font-bold text-slate-900 px-1">Vista Cómoda</span>
          </div>
        </div>
      </div>
    </div>
  )
}