"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Stethoscope, Sparkles, Check } from "lucide-react"
import { useSession } from "next-auth/react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useCreateTreatmentPlan } from "@/hooks/treatments"

interface CreatePlanModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  onSuccessCallback?: (planId: string) => void
}

const SUGGESTED_TREATMENTS = [
  "Limpieza y Profilaxis",
  "Ortodoncia",
  "Endodoncia",
  "Rehabilitación Oral",
  "Diseño de Sonrisa",
  "Extracción / Cirugía",
]

export function CreatePlanModal({ isOpen, onClose, patientId, onSuccessCallback }: CreatePlanModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [newPlanName, setNewPlanName] = useState("")
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")

  const { createTreatmentPlan, isLoading: isCreating } = useCreateTreatmentPlan()
  useEffect(() => {
    if (session?.user?.id) {
      setSelectedDoctorId(session.user.id)
    }
  }, [session])

  const handleClose = () => {
    setNewPlanName("")
    onClose()
  }

  const handleCreatePlan = () => {
    if (!newPlanName.trim()) {
      toast({ 
        title: "Campo requerido", 
        description: "Por favor ingrese un nombre para el plan de tratamiento.", 
        variant: "destructive" 
      })
      return
    }

    createTreatmentPlan({
      patientId,
      name: newPlanName.trim(),
      doctorId: selectedDoctorId || session?.user?.id, 
      status: "DRAFT", 
      totalCost: 0,
      totalPaid: 0,
    }, {
      onSuccess: (data: any) => {
        toast({ 
          title: "Plan registrado", 
          description: "El plan de tratamiento ha sido creado exitosamente.", 
          variant: "success" 
        })
        handleClose()
      
        const createdId = data?.id || data?.plan?.id
        if (onSuccessCallback && createdId) {
          onSuccessCallback(createdId)
        }
      },
      onError: (err: any) => {
        toast({ 
          title: "Error al crear plan", 
          description: err?.message || "No se pudo registrar el plan de tratamiento.", 
          variant: "destructive" 
        })
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isCreating) {
      e.preventDefault()
      handleCreatePlan()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border shadow-2xl rounded-2xl p-0 overflow-hidden font-sans antialiased">
        <DialogHeader className="px-6 py-5 border-b border-border bg-slate-50 dark:bg-muted/30">
          <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
            <div className="p-2 bg-[#008bcd]/10 text-[#008bcd] rounded-xl shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            Nuevo Plan de Tratamiento
          </DialogTitle>
          <DialogDescription className="font-medium text-xs text-muted-foreground mt-1">
            Defina la denominación clínica y asigne al profesional responsable de la atención.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* NOMBRE DEL TRATAMIENTO */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              Nombre del Tratamiento *
            </Label>
            <Input 
              placeholder="Ej: Rehabilitación Oral Completa..." 
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background border-border h-11 font-semibold focus-visible:ring-[#008bcd] shadow-xs rounded-xl text-sm"
              autoFocus
            />
            <div className="pt-1.5 space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#008bcd]" /> Plantillas de nombre sugeridas:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TREATMENTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setNewPlanName(item)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      newPlanName === item 
                        ? "bg-[#008bcd]/10 text-[#008bcd] border-[#008bcd]/40 font-bold" 
                        : "bg-muted/40 hover:bg-muted text-foreground border-border/60"
                    }`}
                  >
                    {newPlanName === item && <Check className="w-3 h-3 text-[#008bcd]" />}
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PROFESIONAL A CARGO (SÓLO EL DOCTOR DE LA SESIÓN ACTUAL) */}
          <div className="space-y-2 pt-1 border-t border-border/60">
            <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              Profesional a cargo
            </Label>
            <Select 
              value={selectedDoctorId || session?.user?.id || ""} 
              onValueChange={setSelectedDoctorId}
              disabled
            >
              <SelectTrigger className="bg-background border-border h-11 font-semibold focus:ring-[#008bcd] shadow-xs rounded-xl text-sm opacity-100 cursor-not-allowed">
                <SelectValue placeholder="Doctor Asignado" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-2xl bg-card">
                {session?.user?.id && (
                  <SelectItem value={session.user.id} className="font-semibold text-xs py-2.5">
                    👨‍⚕️ {session.user.name || "Tu Usuario"} <span className="text-muted-foreground font-normal">(Doctor Asignado)</span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-slate-50/50 dark:bg-muted/20 flex flex-row items-center justify-end gap-2">
          <Button 
            type="button"
            variant="outline" 
            onClick={handleClose} 
            disabled={isCreating}
            className="font-bold rounded-xl border-border text-xs h-10 px-4 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            onClick={handleCreatePlan} 
            disabled={isCreating} 
            className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold px-6 shadow-md rounded-xl text-xs h-10 transition-all cursor-pointer"
          >
            {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} 
            Crear Plan de Tratamiento
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}