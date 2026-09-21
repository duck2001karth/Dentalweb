"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { Stethoscope, ShieldCheck, Loader2, ArrowRight } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface ClinicalProfileTabProps {
  accentColor?: string
  professionalCard: string
  onGoToSignature: () => void
}

export function ClinicalProfileTab({
  accentColor = "#008bcd",
  professionalCard,
  onGoToSignature,
}: ClinicalProfileTabProps) {
  const { theme, resolvedTheme } = useTheme()
  const { data: session, update } = useSession()
  const { toast } = useToast()

  const isDark = (resolvedTheme || theme) === "dark"
  const currentUser = session?.user as any
  const [specialty, setSpecialty] = useState("Ortodoncia")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (currentUser?.specialty) {
      setSpecialty(currentUser.specialty)
    }
  }, [currentUser?.specialty])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/users/signature", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialty }),
      })
      if (!res.ok) throw new Error("Fallo al actualizar en el servidor")
      await update({
        ...session,
        user: {
          ...session?.user,
          specialty,
        },
      })
      toast({
        title: "Perfil clínico guardado",
        description: "Se actualizó tu especialidad médica de forma exitosa.",
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar la especialidad clínica.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`space-y-6 max-w-2xl animate-in fade-in duration-200 font-sans ${
      isDark ? "text-slate-100" : "text-slate-900"
    }`}>
      {/* CABECERA */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Perfil Clínico
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Especialidad y acreditación profesional estampada en recetas y citas
          </p>
        </div>
        <span
          style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
          className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-current/20"
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Facultativo Habilitado
        </span>
      </div>

      {/* CAMPOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Especialidad */}
        <div className="space-y-1.5">
          <Label className={`text-xs font-semibold flex items-center gap-1.5 ${
            isDark ? "text-slate-300" : "text-slate-700"
          }`}>
            <Stethoscope className="w-3.5 h-3.5 opacity-70" /> Especialidad Clínica
          </Label>
          <Input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Ej. Ortodoncia, Odontopediatría, Cirugía..."
            className={`h-10 rounded-xl text-xs transition-colors ${
              isDark
                ? "bg-[#070d18] border-[#1e293b] text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          />
        </div>

        {/* Matrícula */}
        <div className="space-y-1.5">
          <Label className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Matrícula Profesional Vinculada
          </Label>
          <div className={`h-10 px-3.5 rounded-xl border flex items-center justify-between transition-colors ${
            isDark
              ? "bg-[#070d18] border-[#1e293b]"
              : "bg-slate-100/70 border-slate-200"
          }`}>
            <span className={`text-xs font-mono font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
              {professionalCard || "Sin matrícula registrada"}
            </span>
            <button
              type="button"
              onClick={onGoToSignature}
              style={{ color: accentColor }}
              className="text-[11px] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Modificar en Firma <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* NOTA DE SUGERENCIA */}
      <div className={`p-3.5 rounded-2xl border border-dashed flex items-start gap-2.5 transition-colors ${
        isDark
          ? "border-[#1e293b] bg-[#070d18]/50 text-slate-400"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}>
        <p className="text-[11px] leading-relaxed">
          La rúbrica, huella y registro profesional se gestionan unificadamente desde la pestaña{" "}
          <strong className={isDark ? "text-slate-200" : "text-slate-800"}>Firma y Sello</strong> para garantizar validez jurídica en tus recetas y evoluciones clínicas.
        </p>
      </div>

      {/* BOTÓN GUARDAR */}
      <div className="pt-2 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          style={{ backgroundColor: accentColor }}
          className="text-white font-bold h-9 rounded-xl px-5 cursor-pointer shadow-xs hover:opacity-90 transition-opacity border-0"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />} Guardar Perfil Clínico
        </Button>
      </div>
    </div>
  )
}