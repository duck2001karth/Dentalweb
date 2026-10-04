"use client"

import React, { useMemo } from "react"
import { format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { Coffee } from "lucide-react"

import { cn } from "@/lib/utils"
import { AppointmentCard } from "./appointment-card"

const HOUR_HEIGHT = 100
const START_HOUR = 8 
const END_HOUR = 19  

interface AgendaSemanalViewProps {
  weekDays: Date[]
  hours: string[]
  appointments: any[]
  doctorColorsMap: Record<string, string>
  onSelectCita: (cita: any) => void
  selectedDoctorId?: string
  defaultDoctorColor: string
}

// FIX: Evitar que una cita programada antes de la hora de inicio rompa el grid con un margen negativo
const getMinutesFromStart = (timeStr: string) => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(":").map(Number)
  const startMins = (h - START_HOUR) * 60 + (m || 0)
  return Math.max(0, startMins) // Si es negativo (ej. 07:00 AM), lo ancla arriba en top: 0
}

// FIX: Extrae la fecha "YYYY-MM-DD" sin instanciar new Date() para prevenir el desfase UTC
const extractDateString = (candidate: any): string => {
  if (!candidate) return ""
  if (typeof candidate === "string") {
    const match = candidate.match(/^\d{4}-\d{2}-\d{2}/)
    if (match) return match[0]
  }
  if (candidate instanceof Date && !isNaN(candidate.getTime())) {
    return format(candidate, "yyyy-MM-dd")
  }
  return ""
}

export const AgendaSemanalView: React.FC<AgendaSemanalViewProps> = ({
  weekDays,
  hours,
  appointments,
  doctorColorsMap,
  onSelectCita,
  defaultDoctorColor,
}) => {
  const totalHours = END_HOUR - START_HOUR
  const totalGridHeight = totalHours * HOUR_HEIGHT

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    
    weekDays.forEach((d) => {
      const dStr = format(d, "yyyy-MM-dd")
      map[dStr] = []
    })

    appointments.forEach((cita) => {
      // Usar la función segura contra desfases de zona horaria
      const dStr = extractDateString(cita.date)
      if (dStr && map[dStr]) {
        map[dStr].push(cita)
      }
    })

    Object.keys(map).forEach((dStr) => {
      const dayCitas = map[dStr]
      dayCitas.sort((a, b) => getMinutesFromStart(a.startTime) - getMinutesFromStart(b.startTime))

      dayCitas.forEach((cita, idx) => {
        const startMins = getMinutesFromStart(cita.startTime)
        const endMins = getMinutesFromStart(cita.endTime || cita.startTime) + (cita.endTime ? 0 : 30)
        const durationMins = Math.max(30, endMins - startMins)

        cita._top = (startMins / 60) * HOUR_HEIGHT
        cita._height = Math.max(45, (durationMins / 60) * HOUR_HEIGHT - 6) 
        
        const overlapping = dayCitas.filter((other, oIdx) => {
          if (oIdx === idx) return false
          const oStart = getMinutesFromStart(other.startTime)
          const oEnd = getMinutesFromStart(other.endTime || other.startTime) + (other.endTime ? 0 : 30)
          return Math.max(startMins, oStart) < Math.min(endMins, oEnd)
        })

        if (overlapping.length > 0) {
          const allGroup = [cita, ...overlapping].sort((a, b) => a.id.localeCompare(b.id))
          const myPos = allGroup.findIndex((c) => c.id === cita.id)
          cita._width = `${100 / allGroup.length}%`
          cita._left = `${(myPos * 100) / allGroup.length}%`
        } else {
          cita._width = "calc(100% - 12px)"
          cita._left = "6px"
        }
      })
    })

    return map
  }, [weekDays, appointments])

  return (
    <div className="flex-1 bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden flex flex-col relative transition-colors">
      <div className="overflow-auto flex-1 custom-scrollbar relative">
        <div className="min-w-[1000px] flex flex-col">
          
          <div 
            className="border-b border-border/60 bg-muted/20 sticky top-0 z-30 backdrop-blur-md"
            style={{
              display: "grid",
              gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(130px, 1fr))`,
            }}
          >
            <div className="p-3 text-center text-[11px] font-black text-muted-foreground uppercase border-r border-border/40">
              HORA
            </div>
            {weekDays.map((day) => {
              const isCurrentDay = isSameDay(day, new Date())
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "p-3 text-center border-r border-border/40 last:border-r-0 transition-colors",
                    isCurrentDay && "bg-primary/5"
                  )}
                >
                  <span className={cn(
                    "text-[11px] font-black uppercase tracking-wider block",
                    isCurrentDay ? "text-primary" : "text-muted-foreground"
                  )}>
                    {format(day, "EEE dd", { locale: es }).toUpperCase()}
                  </span>
                </div>
              )
            })}
          </div>

          <div 
            className="relative" 
            style={{ 
              height: `${totalGridHeight}px`,
              display: "grid",
              gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(130px, 1fr))`,
            }}
          >
            <div className="border-r border-border/40 bg-muted/5 relative select-none">
              {hours.map((hour, idx) => (
                <div 
                  key={hour} 
                  className={cn(
                    "absolute w-full pr-3 text-right text-xs font-mono font-bold text-foreground/80 transition-colors",
                    idx === 0 ? "top-2 translate-y-0" : "-translate-y-2.5"
                  )}
                  style={{ top: idx === 0 ? "6px" : `${idx * HOUR_HEIGHT}px` }}
                >
                  {hour}
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd")
              const dayAppointments = appointmentsByDay[dayStr] || []

              return (
                <div key={dayStr} className="relative border-r border-border/40 last:border-r-0 h-full">
                  {hours.map((_, idx) => (
                    <div 
                      key={idx} 
                      className="absolute w-full border-b border-border/30 pointer-events-none"
                      style={{ top: `${idx * HOUR_HEIGHT}px` }}
                    />
                  ))}

                  <div 
                    className="absolute w-full flex items-center justify-center bg-muted/25 repeating-linear-stripes border-y border-border/40 pointer-events-none z-0"
                    style={{
                      top: `${(12 - START_HOUR) * HOUR_HEIGHT}px`,
                      height: `${HOUR_HEIGHT}px`,
                    }}
                  >
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/90 border border-border/60 text-[11px] font-semibold text-muted-foreground shadow-2xs">
                      <Coffee className="w-3.5 h-3.5 text-amber-500" />
                      <span>Break Time</span>
                    </div>
                  </div>

                  {dayAppointments.map((cita) => {
                    const docId = cita.doctorId || cita.doctor?.id
                    const docColor = doctorColorsMap[docId] || cita.doctor?.calendarColor || defaultDoctorColor

                    return (
                      <div
                        key={cita.id}
                        className="absolute z-10 transition-all duration-150"
                        style={{
                          top: `${cita._top}px`,
                          height: `${cita._height}px`,
                          left: cita._left,
                          width: cita._width,
                        }}
                      >
                        <AppointmentCard 
                          cita={cita} 
                          doctorColor={docColor}
                          onClick={() => onSelectCita(cita)}
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}