"use client"

import React from "react"
import Link from "next/link"
import { CalendarDays, Stethoscope } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { appointmentStatuses } from "@/constants/status"
import { cn } from "@/lib/utils"

interface AppointmentDetailsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedCita: any
  doctorColor: string
}

export const AppointmentDetailsDialog: React.FC<AppointmentDetailsDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedCita,
  doctorColor,
}) => {
  if (!selectedCita) return null

  const st = appointmentStatuses[selectedCita.status] || appointmentStatuses.SCHEDULED

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border/80 text-foreground rounded-[24px] shadow-2xl p-0 overflow-hidden">
        <div 
          className="px-6 py-5 border-b border-border/80"
          style={{
            background: `linear-gradient(to right, ${doctorColor}18, transparent)`,
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2.5">
              <div 
                className="p-2 rounded-xl border"
                style={{
                  backgroundColor: `${doctorColor}18`,
                  borderColor: `${doctorColor}35`,
                  color: doctorColor,
                }}
              >
                <CalendarDays className="w-5 h-5" />
              </div>
              Detalle de Cita Médica
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3.5 bg-muted/20 border border-border/60 p-3.5 rounded-2xl">
            <div 
              className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-black text-lg shadow-md shrink-0"
              style={{
                backgroundColor: doctorColor,
                boxShadow: `0 8px 16px -4px ${doctorColor}40`,
              }}
            >
              {selectedCita.patient?.firstName?.charAt(0)}{selectedCita.patient?.lastName?.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-foreground text-sm truncate">
                {selectedCita.patient?.firstName} {selectedCita.patient?.lastName}
              </h4>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                CI: {selectedCita.patient?.ci || "Sin documento"}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 bg-muted/10 p-4 rounded-2xl border border-border/60 text-xs">
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase">Horario Asignado</p>
              <p className="font-bold text-foreground mt-0.5">{selectedCita.startTime} - {selectedCita.endTime}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase">Sillón / Box</p>
              <p className="font-bold text-foreground mt-0.5">{selectedCita.box || "Box 1"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase">Especialista</p>
              <p className="font-bold text-foreground mt-0.5">{selectedCita.doctor?.name || "Dr. Asignado"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase">Estado</p>
              <span className={cn("inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border", st.bg, st.color)}>
                {st.label}
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-border/40 mt-1">
              <p className="text-[10px] text-muted-foreground font-black uppercase">Motivo</p>
              <p className="font-semibold text-foreground mt-0.5">{selectedCita.reason || "Consulta General"}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/80 bg-muted/10 sm:justify-between gap-2">
          <Button 
            variant="ghost" 
            className="text-xs font-bold rounded-xl h-10 px-4 cursor-pointer" 
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          
          <Link href={`/paciente/${selectedCita.patientId}?tab=evoluciones`}>
            <Button 
              style={{
                backgroundColor: doctorColor,
                boxShadow: `0 8px 16px -4px ${doctorColor}40`,
              }}
              className="text-white rounded-xl font-bold text-xs h-10 px-5 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 mr-1.5" /> Ir a Ficha Clínica
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}