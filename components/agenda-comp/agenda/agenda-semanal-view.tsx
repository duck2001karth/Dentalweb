"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, Coffee } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppointmentCard } from "./appointment-card"

// Se conserva la jornada de la agenda original:
// marcas de 08:00 a 18:00 y último bloque 18:00–19:00.
const START_HOUR = 8
const END_HOUR = 19
const BREAK_START = 12
const BREAK_END = 13
// Franjas más compactas para laptop sin perder el horario completo.
const HOUR_HEIGHT = 68
const TIME_LABELS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) =>
  `${String(START_HOUR + i).padStart(2, "0")}:00`
)

type PositionedAppointment = {
  cita: any
  top: number
  height: number
  left: string
  width: string
}

interface AgendaSemanalViewProps {
  weekDays: Date[]
  hours: string[] // Se conserva la prop para no romper la página que utiliza el componente
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
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

export const AgendaSemanalView: React.FC<AgendaSemanalViewProps> = ({
  weekDays,
  appointments,
  doctorColorsMap,
  onSelectCita,
  defaultDoctorColor,
}) => {
  const [selectedDayKey, setSelectedDayKey] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const desktopScrollRef = useRef<HTMLDivElement>(null)
  const weekIdentity = weekDays.map((day) => format(day, "yyyy-MM-dd")).join("|")
  const firstDayKey = weekDays[0] ? format(weekDays[0], "yyyy-MM-dd") : ""

  useEffect(() => {
    if (!weekDays.length) return
    const keys = weekDays.map((day) => format(day, "yyyy-MM-dd"))
    setSelectedDayKey((previous) => {
      if (keys.includes(previous)) return previous
      const today = format(new Date(), "yyyy-MM-dd")
      return keys.includes(today) ? today : keys[0]
    })
  }, [weekIdentity])

  // Al cambiar de semana, mostrar otra vez la jornada desde las 08:00.
  useEffect(() => {
    if (desktopScrollRef.current) desktopScrollRef.current.scrollTop = 0
  }, [weekIdentity])

  const byDay = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    weekDays.forEach((day) => { grouped[format(day, "yyyy-MM-dd")] = [] })
    appointments.forEach((cita) => {
      if (cita.status === "CANCELLED" || cita.status === "CANCELED") return
      const key = dateKey(cita.date)
      if (Object.prototype.hasOwnProperty.call(grouped, key)) grouped[key].push(cita)
    })
    Object.values(grouped).forEach((items) =>
      items.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
    )
    return grouped
  }, [appointments, weekIdentity])

  // Posicionamiento calculado sin añadir propiedades a los objetos originales.
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
        const overlaps = items.filter((other, otherIndex) => {
          if (index === otherIndex) return false
          const otherStart = toMinutes(other.startTime)
          const otherEnd = other.endTime ? toMinutes(other.endTime) : otherStart + 30
          return Math.max(start, otherStart) < Math.min(end, otherEnd)
        })
        const group = [cita, ...overlaps].sort((a, b) => String(a.id).localeCompare(String(b.id)))
        const position = group.findIndex((item) => item.id === cita.id)
        return {
          cita,
          top,
          height,
          left: overlaps.length ? `${(position * 100) / group.length}%` : "4px",
          width: overlaps.length ? `${100 / group.length}%` : "calc(100% - 8px)",
        }
      })
    })
    return result
  }, [byDay])

  const activeDayKey = weekDays.some((day) => format(day, "yyyy-MM-dd") === selectedDayKey)
    ? selectedDayKey
    : firstDayKey
  const selectedAppointments = byDay[activeDayKey] || []
  const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT
  // Ancho mínimo solo para evitar columnas ilegibles en tabletas.
  const columnWidth = weekDays.length >= 6 ? 132 : 148
  const gridTemplateColumns = `60px repeat(${weekDays.length}, minmax(${columnWidth}px, 1fr))`

  const doctorColorFor = (cita: any) => {
    const id = cita.doctorId || cita.doctor?.id
    return doctorColorsMap[id] || cita.doctor?.calendarColor || defaultDoctorColor
  }

  return (
    <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* CELULAR: se muestran todas las franjas horarias, incluida la pausa. */}
      <div className="block p-3 sm:hidden">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${Math.max(weekDays.length, 1)}, minmax(0, 1fr))` }}
          role="group"
          aria-label="Seleccionar día de la semana"
        >
          {weekDays.map((day) => {
            const key = format(day, "yyyy-MM-dd")
            const selected = key === activeDayKey
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDayKey(key)}
                aria-pressed={selected}
                className={cn(
                  "flex min-w-0 flex-col items-center rounded-xl border px-1 py-2 text-xs transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="text-[10px] capitalize">{format(day, "EEE", { locale: es })}</span>
                <span className="mt-0.5 text-sm font-semibold">{format(day, "d")}</span>
                {(byDay[key]?.length || 0) > 0 && <span className="mt-1 h-1 w-1 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>
        <p className="my-3 text-xs text-muted-foreground" aria-live="polite">
          {selectedAppointments.length} cita(s) en el día seleccionado · 08:00–19:00
        </p>
        <div className="max-h-[65dvh] space-y-1 overflow-y-auto overscroll-contain pr-1">
          {TIME_LABELS.map((label, index) => {
            const hour = START_HOUR + index
            const items = selectedAppointments.filter((cita) => {
              const start = toMinutes(cita.startTime)
              return start >= hour * 60 && start < (hour + 1) * 60
            })
            const isBreak = hour >= BREAK_START && hour < BREAK_END
            return (
              <div key={label} className="grid grid-cols-[52px_minmax(0,1fr)] gap-2 border-b border-border/40 py-2 last:border-b-0">
                <span className="pt-2 text-xs font-medium tabular-nums text-muted-foreground">{label}</span>
                <div className="min-h-12 space-y-2">
                  {isBreak && (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      <Coffee className="h-4 w-4 text-amber-500" /> Break Time · 12:00–13:00
                    </div>
                  )}
                  {items.map((cita) => (
                    <div key={cita.id} className="h-28">
                      <AppointmentCard cita={cita} doctorColor={doctorColorFor(cita)} onClick={() => onSelectCita(cita)} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {selectedAppointments.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
              <CalendarDays className="h-4 w-4" /> Sin citas programadas en este día
            </div>
          )}
        </div>
      </div>

      {/* TABLETA/LAPTOP: cuadrícula original completa, con desplazamiento interior. */}
      <div
        ref={desktopScrollRef}
        className="hidden max-h-[72dvh] min-w-0 max-w-full overflow-auto overscroll-contain sm:block lg:max-h-[75dvh]"
        tabIndex={0}
        role="region"
        aria-label="Agenda semanal desplazable de 08:00 a 19:00"
      >
        <div className="w-full" style={{ minWidth: `${60 + weekDays.length * columnWidth}px` }}>
          <div
            className="sticky top-0 z-20 grid border-b border-border bg-card/95 backdrop-blur-sm"
            style={{ gridTemplateColumns }}
          >
            <div className="border-r border-border/50 px-2 py-3 text-center text-[11px] font-medium text-muted-foreground">HORA</div>
            {weekDays.map((day) => (
              <div
                key={format(day, "yyyy-MM-dd")}
                className={cn("border-r border-border/50 px-2 py-3 text-center last:border-r-0", isSameDay(day, new Date()) && "bg-primary/5")}
              >
                <span className="text-xs font-semibold capitalize text-foreground">{format(day, "EEE d", { locale: es })}</span>
              </div>
            ))}
          </div>
          <div className="relative grid" style={{ height: gridHeight, gridTemplateColumns }}>
            <div className="relative border-r border-border/50 bg-muted/10">
              {TIME_LABELS.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute right-2 text-[11px] font-medium tabular-nums text-muted-foreground"
                  style={{ top: Math.max(4, index * HOUR_HEIGHT - 8) }}
                >
                  {hour}
                </div>
              ))}
            </div>
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd")
              return (
                <div key={key} className="relative min-w-0 border-r border-border/50 last:border-r-0">
                  {TIME_LABELS.map((hour, index) => (
                    <div
                      key={hour}
                      className="pointer-events-none absolute inset-x-0 border-b border-border/30"
                      style={{ top: index * HOUR_HEIGHT }}
                    />
                  ))}
                  <div
                    className="pointer-events-none absolute inset-x-0 z-0 flex items-center justify-center border-y border-border/40 bg-muted/35"
                    style={{
                      top: (BREAK_START - START_HOUR) * HOUR_HEIGHT,
                      height: (BREAK_END - BREAK_START) * HOUR_HEIGHT,
                    }}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/90 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      <Coffee className="h-3.5 w-3.5 text-amber-500" /> Break Time
                    </span>
                  </div>
                  {(positioned[key] || []).map((item) => (
                    <div
                      key={item.cita.id}
                      className="absolute z-10"
                      style={{ top: item.top, height: item.height, left: item.left, width: item.width }}
                    >
                      <AppointmentCard cita={item.cita} doctorColor={doctorColorFor(item.cita)} onClick={() => onSelectCita(item.cita)} />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
