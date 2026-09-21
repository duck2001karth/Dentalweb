"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { 
  Sparkles, 
  Palette, 
  Sun, 
  Moon, 
  Check, 
  ArrowRight, 
  UserCheck 
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const PRESETS = [
  { name: "Azul Médico", hex: "#008bcd" },
  { name: "Verde Esmeralda", hex: "#10b981" },
  { name: "Púrpura", hex: "#8b5cf6" },
  { name: "Rojo Carmín", hex: "#ef4444" },
]

interface OnboardingGuideProps {
  doctorName?: string
  onFinishGuide?: () => void
}

export function OnboardingGuideModal({ 
  doctorName = "Doctor", 
  onFinishGuide 
}: OnboardingGuideProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const { theme, setTheme } = useTheme()
  const [selectedColor, setSelectedColor] = useState("#008bcd")

  useEffect(() => {
    // Si es la primera vez que entra, abrimos la miniguía
    const completed = localStorage.getItem("doctor_onboarding_completed")
    if (!completed) {
      setOpen(true)
    }
  }, [])

  const handleSelectColor = (hex: string) => {
    setSelectedColor(hex)
    document.documentElement.style.setProperty("--primary", hex)
    document.documentElement.style.setProperty("--doctor-accent", hex)
    localStorage.setItem("app_accent_color", hex)
  }

  const handleComplete = () => {
    localStorage.setItem("doctor_onboarding_completed", "true")
    setOpen(false)
    if (onFinishGuide) onFinishGuide()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-6 rounded-3xl bg-white dark:bg-[#070d18] border border-slate-200 dark:border-[#1e293b] shadow-2xl text-slate-800 dark:text-slate-100 font-sans">
        
        {/* PASO 1: BIENVENIDA Y TEMA */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                ¡Bienvenido a CarmoDental, {doctorName}!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Personalicemos tu espacio de trabajo antes de empezar. ¿Cómo prefieres visualizar tu plataforma clínica?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                  theme === "light"
                    ? "border-primary bg-primary/5 text-slate-900 dark:text-white font-bold"
                    : "border-slate-200 dark:border-[#1e293b] text-slate-500 hover:border-slate-300"
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-xs">Modo Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                  theme === "dark"
                    ? "border-primary bg-primary/5 text-slate-900 dark:text-white font-bold"
                    : "border-slate-200 dark:border-[#1e293b] text-slate-500 hover:border-slate-300"
                }`}
              >
                <Moon className="w-5 h-5 text-indigo-400" />
                <span className="text-xs">Modo Oscuro</span>
              </button>
            </div>

            <div className="pt-3 flex justify-end">
              <Button 
                onClick={() => setStep(2)}
                className="bg-primary text-white rounded-xl text-xs font-bold h-10 px-5 gap-1.5 cursor-pointer"
              >
                Siguiente <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* PASO 2: COLOR DE ÉNFASIS DEL DOCTOR */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Elige tu color identificador
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Este color destacará tus turnos en el calendario de la clínica y tus recetas médicas.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 py-3">
              {PRESETS.map((color) => {
                const isSelected = selectedColor === color.hex
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => handleSelectColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform cursor-pointer hover:scale-110 shadow-xs"
                  >
                    {isSelected && <Check className="w-5 h-5 stroke-[3]" />}
                  </button>
                )
              })}
            </div>

            <div className="pt-3 flex justify-between items-center">
              <Button 
                variant="ghost" 
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-500"
              >
                Atrás
              </Button>
              <Button 
                onClick={handleComplete}
                style={{ backgroundColor: selectedColor }}
                className="text-white rounded-xl text-xs font-bold h-10 px-6 gap-1.5 cursor-pointer border-0"
              >
                <UserCheck className="w-4 h-4" /> Completar y Empezar
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}