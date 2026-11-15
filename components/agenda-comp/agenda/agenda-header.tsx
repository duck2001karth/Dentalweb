"use client"

import React from "react"
import { addDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CalendarDays, List, Stethoscope } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NewAppointmentModal } from "@/components/agenda-comp/new-appointment"
import { AgendaFiltersModal, type AgendaFiltersState } from "./agenda-filters-modal"
import { cn } from "@/lib/utils"

interface AgendaHeaderProps {
  viewMode: "calendar" | "list"
  onViewModeChange: (mode: "calendar" | "list") => void
  currentWeekStart: Date
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
  isTodayWeek: boolean
  canSwitchDoctor: boolean
  selectedDoctorId: string
  onDoctorChange: (doctorId: string) => void
  doctors: Array<{ id: string; name: string; calendarColor: string }>
  activeAppointmentsCount: number
  defaultUserColor: string
  filters: AgendaFiltersState
  onFiltersChange: (filters: AgendaFiltersState) => void
  availableBoxes: string[]
}

export const AgendaHeader: React.FC<AgendaHeaderProps> = ({
  viewMode, onViewModeChange, currentWeekStart, onPrevWeek, onNextWeek,
  onToday, isTodayWeek, canSwitchDoctor, selectedDoctorId, onDoctorChange,
  doctors, activeAppointmentsCount, defaultUserColor, filters,
  onFiltersChange, availableBoxes,
}) => {
  const endOfWeek = addDays(currentWeekStart, 4)
  const weekLabel = `${format(currentWeekStart, "d MMM", { locale: es })} – ${format(endOfWeek, "d MMM yyyy", { locale: es })}`
  const navButtonClass = "h-10 w-10 shrink-0 rounded-lg text-foreground hover:bg-accent"

  return (
    <section aria-label="Controles de agenda" className="mb-4 min-w-0 space-y-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4 lg:p-5">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-border/60 bg-muted/50 p-1" role="group" aria-label="Vista de agenda">
          <button type="button" onClick={() => onViewModeChange("list")}
            aria-pressed={viewMode === "list"}
            className={cn("inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors", viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          ><List className="h-4 w-4" /> Lista</button>
          <button type="button" onClick={() => onViewModeChange("calendar")}
            aria-pressed={viewMode === "calendar"}
            className={cn("inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors", viewMode === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          ><CalendarDays className="h-4 w-4" /> Calendario</button>
        </div>
        <span className="text-xs text-muted-foreground lg:text-right" aria-live="polite">
          <strong className="font-semibold text-foreground">{activeAppointmentsCount}</strong> citas en la selección
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-border bg-background p-1 sm:flex-none">
          <Button type="button" variant="ghost" size="icon" className={navButtonClass} onClick={onPrevWeek} aria-label="Semana anterior"><ChevronLeft className="h-4 w-4" /></Button>
          <div className="min-w-0 flex-1 px-1 text-center sm:min-w-[190px]" aria-live="polite">
            <span className="block truncate text-xs font-semibold capitalize text-foreground sm:text-sm">{weekLabel}</span>
          </div>
          <Button type="button" variant="ghost" size="icon" className={navButtonClass} onClick={onNextWeek} aria-label="Semana siguiente"><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Button type="button" variant="outline" onClick={onToday} className="h-10 shrink-0 rounded-xl px-3 text-xs font-medium sm:text-sm"
          style={isTodayWeek ? { backgroundColor: `${defaultUserColor}14`, borderColor: `${defaultUserColor}45` } : undefined}>
          Hoy
        </Button>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] lg:flex lg:justify-end">
        {canSwitchDoctor ? (
          <div className="min-w-0 lg:w-64">
            <Select value={selectedDoctorId} onValueChange={onDoctorChange}>
              <SelectTrigger aria-label="Filtrar por especialista" className="h-10 w-full min-w-0 rounded-xl border-border bg-background text-xs font-medium sm:text-sm">
                <Stethoscope className="mr-2 h-4 w-4 shrink-0 text-primary" />
                <SelectValue placeholder="Especialista" />
              </SelectTrigger>
              <SelectContent className="z-[120] max-w-[calc(100vw-24px)] rounded-xl border-border bg-popover">
                <SelectItem value="ALL">Todos los especialistas</SelectItem>
                {doctors.map(doc => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <span className="inline-flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: doc.calendarColor }} />{doc.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex h-10 min-w-0 items-center gap-2 truncate rounded-xl border border-border bg-muted/30 px-3 text-xs font-medium">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: defaultUserColor }} />Mi calendario
          </div>
        )}
        <AgendaFiltersModal filters={filters} onFiltersChange={onFiltersChange} availableBoxes={availableBoxes} accentColor={defaultUserColor} />
        <div className="col-span-2 flex justify-end sm:col-span-1 [&_button]:h-10 [&_button]:rounded-xl [&_button]:px-4 [&_button]:text-sm">
          <NewAppointmentModal defaultDate={currentWeekStart} />
        </div>
      </div>
    </section>
  )
}
