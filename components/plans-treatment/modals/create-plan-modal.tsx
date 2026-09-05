"use client"

import React, { useState, useEffect } from "react"
import { Loader2, Stethoscope, Sparkles, Check, UserCheck } from "lucide-react"
import { useSession } from "next-auth/react"

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useCreateTreatmentPlan } from "@/hooks/treatments"
import { useClinicSettings } from "@/config/clinic-settings"

interface CreatePlanModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  onSuccessCallback?: (planId: string) => void
  availableDoctors?: Array<{ id: string; name: string; specialty?: string }>
}

const DEFAULT_SUGGESTIONS = [
  "Limpieza y Profilaxis",
  "Ortodoncia",
  "Endodoncia",
  "Rehabilitación Oral",
  "Diseño de Sonrisa",
  "Extracción / Cirugía",
]

export function CreatePlanModal({ 
  isOpen, 
  onClose, 
  patientId, 
  onSuccessCallback,
  availableDoctors = []
}: CreatePlanModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const { settings } = useClinicSettings()
  
  const [newPlanName, setNewPlanName] = useState("")
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")

  const { createTreatmentPlan, isLoading: isCreating } = useCreateTreatmentPlan()

  // Determinar rol
  const userRole = String((session?.user as any)?.role || "").toUpperCase().trim()
  const canAssignOtherDoctors = userRole === "ADMIN" || userRole === "ADMINISTRADOR" || userRole === "RECEPCIONISTA" || userRole === "RECEPTIONIST"

  useEffect(() => {
    if (session?.user?.id && !selectedDoctorId) {
      setSelectedDoctorId(session.user.id)
    }
  }, [session, selectedDoctorId])

  const handleClose = () => {
    setNewPlanName("")
    onClose()
  }

  const handleCreatePlan = () => {
    if (!newPlanName.trim()) {
      toast({ 
        title: "Campo requerido", 
        description: "Por favor ingrese una descripción o nombre para el plan.", 
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
          description: err?.message || "No se pudo registrar el plan clínico.", 
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
      <DialogContent className="sm:max-w-[500px] w-[95vw] bg-card border-border shadow-2xl rounded-[24px] p-0 overflow-hidden font-sans antialiased">
        <DialogHeader className="px-6 py-5 border-b border-border bg-slate-50 dark:bg-muted/30">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2.5">
            <div className="p-2 bg-[#008bcd]/10 text-[#008bcd] rounded-xl shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            Nuevo Plan de Tratamiento
          </DialogTitle>
          <DialogDescription className="font-medium text-xs text-muted-foreground mt-1">
            {(settings as any)?.clinicName || (settings as any)?.name ? `Sede: ${(settings as any)?.clinicName || (settings as any)?.name} — ` : ""}
            Defina la denominación clínica y asigne al profesional responsable.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* DENOMINACIÓN */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
              Nombre del Tratamiento / Plan Clínico *
            </Label>
            <Input 
              placeholder="Ej: Rehabilitación Oral Completa..." 
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background border-border h-11 font-semibold focus-visible:ring-[#008bcd] shadow-xs rounded-xl text-sm"
              autoFocus
            />
            
            {/* PLANTILLAS SUGERIDAS */}
            <div className="pt-1.5 space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#008bcd]" /> Sugerencias frecuentes:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_SUGGESTIONS.map((item) => {
                  const isSelected = newPlanName === item
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setNewPlanName(item)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                        isSelected 
                          ? "bg-[#008bcd]/10 text-[#008bcd] border-[#008bcd]/40 font-bold" 
                          : "bg-muted/40 hover:bg-muted text-foreground border-border/60"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-[#008bcd]" />}
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* PROFESIONAL RESPONSABLE */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#008bcd]" /> Profesional Tratante a Cargo
            </Label>
            
            <Select 
              value={selectedDoctorId || session?.user?.id || ""} 
              onValueChange={setSelectedDoctorId}
              disabled={!canAssignOtherDoctors && availableDoctors.length === 0}
            >
              <SelectTrigger className="bg-background border-border h-11 font-semibold focus:ring-[#008bcd] shadow-xs rounded-xl text-xs">
                <SelectValue placeholder="Seleccionar Doctor Tratante" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-2xl bg-card">
                {/* Doctor en sesión */}
                {session?.user?.id && (
                  <SelectItem value={session.user.id} className="font-semibold text-xs py-2">
                    👨‍⚕️ {session.user.name || "Usuario Actual"} <span className="text-muted-foreground font-normal">(En Sesión)</span>
                  </SelectItem>
                )}

                {/* Otros odontólogos de la clínica */}
                {availableDoctors
                  .filter((doc) => doc.id !== session?.user?.id)
                  .map((doc) => (
                    <SelectItem key={doc.id} value={doc.id} className="font-semibold text-xs py-2">
                      👨‍⚕️ Dr(a). {doc.name} {doc.specialty ? `— (${doc.specialty})` : ""}
                    </SelectItem>
                  ))}
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
            className="font-bold rounded-xl border-border text-xs h-10 px-4"
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            onClick={handleCreatePlan} 
            disabled={isCreating} 
            className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold px-6 shadow-xs rounded-xl text-xs h-10 transition-all flex items-center gap-2"
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear Plan de Tratamiento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePlanModal