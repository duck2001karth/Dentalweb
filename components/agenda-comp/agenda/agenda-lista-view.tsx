"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, MapPin, User, Stethoscope, ArrowUpRight } from "lucide-react"

import { appointmentStatuses } from "@/constants/status"
import { cn } from "@/lib/utils"

interface AgendaListaViewProps {
  appointments: any[]
  doctorColorsMap: Record<string, string>
  onSelectCita: (cita: any) => void
  defaultDoctorColor: string
}

export function AgendaListaView({
  appointments,
  doctorColorsMap,
  onSelectCita,
  defaultDoctorColor,
}: AgendaListaViewProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex-1 bg-card border border-border/70 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm font-bold text-foreground">Sin citas encontradas</p>
        <p className="text-xs text-muted-foreground mt-1">No hay citas que coincidan con la semana o filtros seleccionados.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-auto flex-1 custom-scrollbar p-4 space-y-3">
        {appointments.map((cita) => {
          const docId = cita.doctorId || cita.doctor?.id
          const docColor = doctorColorsMap[docId] || cita.doctor?.calendarColor || defaultDoctorColor
          const statusConfig = appointmentStatuses[cita.status] || appointmentStatuses.SCHEDULED
          const StatusIcon = statusConfig.icon

          const citaDate = cita.date ? new Date(cita.date) : new Date()

          return (
            <div
              key={cita.id}
              onClick={() => onSelectCita(cita)}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/15 hover:bg-muted/30 border border-border/60 hover:border-border rounded-xl gap-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: docColor }}
                >
                  {cita.patient?.firstName?.charAt(0) || "P"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">
                    {cita.patient?.firstName} {cita.patient?.lastName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {cita.reason || "Consulta General"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <Clock className="w-3.5 h-3.5" style={{ color: docColor }} />
                  <span>{format(citaDate, "EEE dd", { locale: es }).toUpperCase()} • {cita.startTime} - {cita.endTime}</span>
                </div>

                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{cita.box || "Box 1"}</span>
                </div>

                <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1", statusConfig.bg, statusConfig.color)}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>

                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}