"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
  const { data: session, update } = useSession()
  const { toast } = useToast()
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
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-200 font-sans text-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Perfil Clínico</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Especialidad y acreditación profesional estampada en recetas y citas
          </p>
        </div>
        <span
          style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
          className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Facultativo Habilitado
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Especialidad Clínica */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Especialidad Clínica
          </Label>
          <Input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Ej. Ortodoncia, Odontopediatría, Cirugía..."
            className="h-10 rounded-xl border-slate-200 text-xs focus-visible:ring-1"
          />
        </div>

        {/* Matrícula Profesional Vinculada */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Matrícula Profesional Vinculada
          </Label>
          <div className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-800">
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

      <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex items-start gap-2.5">
        <span className="text-base">📋</span>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          La rúbrica, huella y registro profesional se gestionan unificadamente desde la pestaña{" "}
          <strong className="text-slate-700">Firma y Sello</strong> para garantizar validez jurídica en tus recetas y evoluciones clínicas.
        </p>
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          style={{ backgroundColor: accentColor }}
          className="text-white font-bold h-9 rounded-xl px-5 cursor-pointer shadow-xs hover:opacity-90 transition-opacity"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />} Guardar Perfil Clínico
        </Button>
      </div>
    </div>
  )
}