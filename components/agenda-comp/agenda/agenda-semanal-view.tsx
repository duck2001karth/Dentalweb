"use client"

import React, { useEffect, useMemo, useState } from "react"
import { format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppointmentCard } from "./appointment-card"

const HOUR_HEIGHT = 88
const START_HOUR = 8
const END_HOUR = 19

type PositionedAppointment = {
  cita: any
  top: number
  height: number
  left: string
  width: string
}

interface AgendaSemanalViewProps {
  weekDays: Date[]
  hours: string[]
  appointments: any[]
  doctorColorsMap: Record<string, string>
  onSelectCita: (cita: any) => void
  selectedDoctorId?: string
  defaultDoctorColor: string
}

const dateKey = (value: unknown): string => {
  if (typeof value === "string") return /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0] || ""
  if (value instanceof Date && !Number.isNaN(value.getTime())) return format(value, "yyyy-MM-dd")
  return ""
}

const toMinutes = (value: unknown): number => {
  if (typeof value !== "string" || !/^\d{1,2}:\d{2}/.test(value)) return START_HOUR * 60
  const [hours, minutes] = value.split(":").map(Number)
  return hours * 60 + minutes
}

export const AgendaSemanalView: React.FC<AgendaSemanalViewProps> = ({
  weekDays, hours, appointments, doctorColorsMap, onSelectCita, defaultDoctorColor,
}) => {
  const [selectedDayKey, setSelectedDayKey] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const firstDayKey = weekDays[0] ? format(weekDays[0], "yyyy-MM-dd") : ""
  const weekIdentity = weekDays.map(day => format(day, "yyyy-MM-dd")).join("|")

  useEffect(() => {
    if (!weekDays.length) return
    const keys = weekDays.map(day => format(day, "yyyy-MM-dd"))
    setSelectedDayKey(prev => keys.includes(prev) ? prev : (keys.includes(format(new Date(), "yyyy-MM-dd")) ? format(new Date(), "yyyy-MM-dd") : keys[0]))
  }, [weekIdentity]) 

  const byDay = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    weekDays.forEach(day => { grouped[format(day, "yyyy-MM-dd")] = [] })
    appointments.forEach(cita => {
      if (cita.status === "CANCELLED" || cita.status === "CANCELED") return
      const key = dateKey(cita.date)
      if (grouped[key]) grouped[key].push(cita)
    })
    Object.values(grouped).forEach(day => day.sort((a,b) => toMinutes(a.startTime) - toMinutes(b.startTime)))
    return grouped
  }, [appointments, weekIdentity])

  const positioned = useMemo(() => {
    const result: Record<string, PositionedAppointment[]> = {}
    Object.entries(byDay).forEach(([key, items]) => {
      result[key] = items.map((cita, index) => {
        const start = toMinutes(cita.startTime)
        const end = cita.endTime ? toMinutes(cita.endTime) : start + 30
        const clippedStart = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60, start))
        const clippedEnd = Math.max(clippedStart, Math.min(END_HOUR * 60, end))
        const top = ((clippedStart - START_HOUR * 60) / 60) * HOUR_HEIGHT
        const height = Math.max(24, ((clippedEnd - clippedStart) / 60) * HOUR_HEIGHT - 4)
        const overlapping = items.filter((other, otherIndex) => {
          if (index === otherIndex) return false
          const os = toMinutes(other.startTime)
          const oe = other.endTime ? toMinutes(other.endTime) : os + 30
          return Math.max(start, os) < Math.min(end, oe)
        })
        const group = [cita, ...overlapping].sort((a,b) => String(a.id).localeCompare(String(b.id)))
        const position = group.findIndex(item => item.id === cita.id)
        return { cita, top, height, left: overlapping.length ? `${position * 100 / group.length}%` : "4px", width: overlapping.length ? `${100 / group.length}%` : "calc(100% - 8px)" }
      })
    })
    return result
  }, [byDay])

  const activeDayKey = weekDays.some(d => format(d, "yyyy-MM-dd") === selectedDayKey) ? selectedDayKey : firstDayKey
  const selectedAppointments = byDay[activeDayKey] || []
  const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT
  const columnWidth = weekDays.length >= 6 ? 155 : 180
  const gridTemplateColumns = `64px repeat(${weekDays.length}, minmax(${columnWidth}px, 1fr))`

  const doctorColorFor = (cita: any) => {
    const id = cita.doctorId || cita.doctor?.id
    return doctorColorsMap[id] || cita.doctor?.calendarColor || defaultDoctorColor
  }

  return (
    <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="block p-3 sm:hidden">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(weekDays.length,1)}, minmax(0, 1fr))` }} role="group" aria-label="Seleccionar día de la semana">
          {weekDays.map(day => {
            const key = format(day, "yyyy-MM-dd")
            const selected = key === activeDayKey
            return (
              <button key={key} type="button" onClick={() => setSelectedDayKey(key)} aria-pressed={selected}
                className={cn("flex min-w-0 flex-col items-center rounded-xl border px-1 py-2 text-xs transition-colors", selected ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-muted")}
              ><span className="text-[10px] capitalize">{format(day,"EEE",{locale:es})}</span><span className="mt-0.5 text-sm font-semibold">{format(day,"d")}</span>{(byDay[key]?.length || 0) > 0 && <span className="mt-1 h-1 w-1 rounded-full bg-primary" />}</button>
            )
          })}
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground" aria-live="polite">{selectedAppointments.length} cita(s) · {weekDays.find(d => format(d,"yyyy-MM-dd") === activeDayKey) ? format(weekDays.find(d => format(d,"yyyy-MM-dd") === activeDayKey)!,"d 'de' MMMM",{locale:es}) : ""}</p>
          {selectedAppointments.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
              <CalendarDays className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Sin citas para este día</p>
              <p className="text-xs text-muted-foreground">Selecciona otro día para consultar la agenda.</p>
            </div>
          ) : selectedAppointments.map(cita => (
            <div key={cita.id} className="h-28"><AppointmentCard cita={cita} doctorColor={doctorColorFor(cita)} onClick={() => onSelectCita(cita)} /></div>
          ))}
        </div>
      </div>
      <div className="hidden min-w-0 max-w-full overflow-x-auto overscroll-x-contain sm:block" tabIndex={0} role="region" aria-label="Agenda semanal desplazable">
        <div className="w-full" style={{ minWidth: `${64 + weekDays.length * columnWidth}px` }}>
          <div className="sticky top-0 z-20 grid border-b border-border bg-card/95 backdrop-blur-sm" style={{ gridTemplateColumns }}>
            <div className="border-r border-border/50 p-3 text-center text-[11px] font-medium text-muted-foreground">HORA</div>
            {weekDays.map(day => <div key={format(day,"yyyy-MM-dd")} className={cn("border-r border-border/50 p-3 text-center last:border-r-0", isSameDay(day,new Date()) && "bg-primary/5")}><span className="text-xs font-semibold capitalize text-foreground">{format(day,"EEE d",{locale:es})}</span></div>)}
          </div>
          <div className="relative grid" style={{ height:gridHeight, gridTemplateColumns }}>
            <div className="relative border-r border-border/50 bg-muted/10">
              {hours.map((hour, index) => <div key={`${hour}-${index}`} className="absolute right-2 text-xs font-medium tabular-nums text-muted-foreground" style={{top: Math.max(4, index * HOUR_HEIGHT - 8)}}>{hour}</div>)}
            </div>
            {weekDays.map(day => {
              const key = format(day,"yyyy-MM-dd")
              return (
                <div key={key} className="relative min-w-0 border-r border-border/50 last:border-r-0">
                  {hours.map((hour,index) => <div key={`${hour}-${index}`} className="pointer-events-none absolute inset-x-0 border-b border-border/30" style={{top:index*HOUR_HEIGHT}} />)}
                  {(positioned[key] || []).map(item => <div key={item.cita.id} className="absolute z-10" style={{top:item.top,height:item.height,left:item.left,width:item.width}}><AppointmentCard cita={item.cita} doctorColor={doctorColorFor(item.cita)} onClick={() => onSelectCita(item.cita)} /></div>)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
