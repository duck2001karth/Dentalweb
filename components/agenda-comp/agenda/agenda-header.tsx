"use client"

import { ShortcutActionTarget } from "@/components/providers/keyboard-shortcuts-provider"
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
  viewMode,
  onViewModeChange,
  currentWeekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  isTodayWeek,
  canSwitchDoctor,
  selectedDoctorId,
  onDoctorChange,
  doctors,
  activeAppointmentsCount,
  defaultUserColor,
  filters,
  onFiltersChange,
  availableBoxes,
}) => {
  const endOfWeek = addDays(currentWeekStart, 4)
  const weekLabel = `${format(currentWeekStart, "d MMM", { locale: es })} – ${format(endOfWeek, "d MMM yyyy", { locale: es })}`

  const viewButtonClass =
    "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors sm:text-sm"

  return (
    <section
      aria-label="Controles de agenda"
      className="mb-3 w-full min-w-0 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4"
    >
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap">
          <div
            className="inline-flex w-fit max-w-full shrink-0 items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1"
            role="group"
            aria-label="Vista de agenda"
          >
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              aria-pressed={viewMode === "list"}
              className={cn(
                viewButtonClass,
                viewMode === "list"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("calendar")}
              aria-pressed={viewMode === "calendar"}
              className={cn(
                viewButtonClass,
                viewMode === "calendar"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Calendario
            </button>
          </div>

          <div className="flex min-w-0 w-full items-center gap-2 sm:w-auto">
            <div className="flex h-10 min-w-0 flex-1 items-center gap-1 rounded-xl border border-border bg-background px-1 sm:w-[240px] sm:flex-none">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg"
                onClick={onPrevWeek}
                aria-label="Semana anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span
                className="block min-w-0 flex-1 truncate px-1 text-center text-xs font-semibold capitalize text-foreground sm:text-sm"
                aria-live="polite"
                title={weekLabel}
              >
                {weekLabel}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg"
                onClick={onNextWeek}
                aria-label="Semana siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onToday}
              className="h-10 shrink-0 rounded-xl px-3 text-xs font-medium sm:text-sm"
              style={
                isTodayWeek
                  ? {
                      backgroundColor: `${defaultUserColor}14`,
                      borderColor: `${defaultUserColor}45`,
                    }
                  : undefined
              }
            >
              Hoy
            </Button>
          </div>
        </div>

        {/* Filtros y creación: sin espacios grandes en escritorio. */}
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap xl:justify-end">
          <div className="flex min-w-0 items-center gap-2">
            {canSwitchDoctor ? (
              <div className="min-w-0 flex-1 sm:w-[235px] sm:flex-none xl:w-[225px]">
                <Select value={selectedDoctorId} onValueChange={onDoctorChange}>
                  <SelectTrigger
                    aria-label="Filtrar por especialista"
                    className="h-10 w-full min-w-0 rounded-xl border-border bg-background text-xs font-medium sm:text-sm"
                  >
                    <Stethoscope className="mr-1 h-4 w-4 shrink-0 text-primary" />
                    <SelectValue placeholder="Especialista" />
                  </SelectTrigger>
                  <SelectContent className="z-[120] max-w-[calc(100vw-24px)] rounded-xl border-border bg-popover">
                    <SelectItem value="ALL">Todos los especialistas</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: doctor.calendarColor }}
                          />
                          {doctor.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 text-xs font-medium sm:flex-none">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: defaultUserColor }} />
                Mi calendario
              </div>
            )}

            <div className="shrink-0 [&_button]:h-10 [&_button]:rounded-xl">
              <AgendaFiltersModal
                filters={filters}
                onFiltersChange={onFiltersChange}
                availableBoxes={availableBoxes}
                accentColor={defaultUserColor}
              />
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
            <span className="min-w-0 text-xs text-muted-foreground sm:hidden" aria-live="polite">
              <strong className="font-semibold text-foreground">{activeAppointmentsCount}</strong> citas
            </span>
            <div className="shrink-0 [&_button]:h-10 [&_button]:rounded-xl [&_button]:px-4 [&_button]:text-sm">
              <ShortcutActionTarget action="appointment"><NewAppointmentModal defaultDate={currentWeekStart} /></ShortcutActionTarget>
            </div>
          </div>

          <span className="hidden shrink-0 whitespace-nowrap text-xs text-muted-foreground 2xl:inline" aria-live="polite">
            <strong className="font-semibold text-foreground">{activeAppointmentsCount}</strong> citas
          </span>
        </div>
      </div>

      <div className="mt-2 hidden text-right text-xs text-muted-foreground sm:block 2xl:hidden" aria-live="polite">
        <strong className="font-semibold text-foreground">{activeAppointmentsCount}</strong> citas en la selección
      </div>
    </section>
  )
}
