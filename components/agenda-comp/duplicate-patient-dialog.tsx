"use client"

import React from "react"
import { AlertCircle, Calendar, Clock, Stethoscope, User, MapPin } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DuplicatePatientDialogProps {
  isOpen: boolean
  onClose: () => void
  patientName: string
  existingAppointment: {
    startTime: string
    endTime: string
    doctorName?: string
    box?: string
    reason?: string
  } | null
}

export const DuplicatePatientDialog: React.FC<DuplicatePatientDialogProps> = ({
  isOpen,
  onClose,
  patientName,
  existingAppointment,
}) => {
  if (!existingAppointment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] bg-card border-border/80 text-foreground rounded-3xl p-0 overflow-hidden shadow-2xl z-[150]">
        
        {/* Cabecera de Alerta */}
        <div className="px-6 py-5 border-b border-border/80 bg-destructive/10 text-destructive flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-destructive/20 border border-destructive/30 shrink-0">
            <AlertCircle className="w-5 h-5 text-destructive stroke-[2.5]" />
          </div>
          <div>
            <DialogTitle className="text-base font-black tracking-tight text-foreground">
              Cita Duplicada Detectada
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              El paciente ya cuenta con una reserva para esta fecha.
            </DialogDescription>
          </div>
        </div>

        {/* Ficha Informativa de la Cita Existente */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/60">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-foreground text-sm truncate">{patientName}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Ya tiene turno programado para hoy</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-muted/15 border border-border/60">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Horario Asignado
              </span>
              <p className="font-bold text-foreground">
                {existingAppointment.startTime} - {existingAppointment.endTime}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Sillón / Box
              </span>
              <p className="font-bold text-foreground">
                {existingAppointment.box || "Box 1"}
              </p>
            </div>

            <div className="col-span-2 pt-2 border-t border-border/40 space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                <Stethoscope className="w-3 h-3" /> Especialista
              </span>
              <p className="font-bold text-foreground">
                {existingAppointment.doctorName || "Especialista Asignado"}
              </p>
            </div>

            {existingAppointment.reason && (
              <div className="col-span-2 pt-2 border-t border-border/40 space-y-0.5">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Motivo</span>
                <p className="text-muted-foreground font-medium truncate">{existingAppointment.reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border/80 bg-muted/10">
          <Button
            type="button"
            onClick={onClose}
            className="w-full bg-secondary hover:bg-muted text-foreground font-bold h-10 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Entendido, Modificar Datos
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}