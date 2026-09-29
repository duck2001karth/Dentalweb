"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  List, 
  Stethoscope, 
  SlidersHorizontal 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NewAppointmentModal } from "@/components/agenda-comp/new-appointment"
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
}) => {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between bg-card border border-border/70 rounded-2xl p-4 md:px-6 shadow-xs gap-4 mb-4 shrink-0 transition-colors">
      
      {/* Switcher Vista y Fechas */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border/40">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              viewMode === "list" 
                ? "bg-card text-foreground shadow-2xs" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("calendar")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              viewMode === "calendar" 
                ? "bg-card text-foreground shadow-2xs" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendario</span>
          </button>
        </div>

        <div className="h-6 w-[1px] bg-border/80 mx-1 hidden sm:block" />

        {/* Navegación por Semanas */}
        <div className="flex items-center gap-1.5 bg-muted/20 border border-border/80 p-1 rounded-xl">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-foreground hover:bg-background rounded-lg cursor-pointer" 
            onClick={onPrevWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            onClick={onToday}
            className="h-8 px-3 font-bold text-xs text-foreground hover:bg-background rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <CalendarIcon className="h-3.5 w-3.5" style={{ color: defaultUserColor }} />
            <span>
              {format(currentWeekStart, "d 'de' MMMM", { locale: es }).toUpperCase()} - {format(new Date(currentWeekStart.getTime() + 4 * 86400000), "d 'de' MMMM yyyy", { locale: es }).toUpperCase()}
            </span>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-foreground hover:bg-background rounded-lg cursor-pointer" 
            onClick={onNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          variant="outline" 
          onClick={onToday} 
          style={{
            backgroundColor: isTodayWeek ? `${defaultUserColor}15` : undefined,
            color: isTodayWeek ? defaultUserColor : undefined,
            borderColor: isTodayWeek ? `${defaultUserColor}40` : undefined,
          }}
          className={cn(
            "h-8 px-3 text-xs font-bold rounded-xl border border-border/80 transition-all cursor-pointer",
            !isTodayWeek && "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          Hoy
        </Button>

        <span className="hidden xl:inline-block text-xs font-medium text-muted-foreground ml-2">
          <strong className="text-foreground font-bold">{activeAppointmentsCount}</strong> citas programadas
        </span>
      </div>

      {/* Selector de Médico y Botón de Agendar */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {canSwitchDoctor ? (
          <div className="w-56">
            <Select value={selectedDoctorId} onValueChange={onDoctorChange}>
              <SelectTrigger className="h-9 rounded-xl bg-background border-border/80 text-xs font-bold text-foreground">
                <div className="flex items-center gap-2 truncate">
                  <Stethoscope className="w-3.5 h-3.5 text-primary shrink-0" />
                  <SelectValue placeholder="Seleccionar Doctor" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/80 rounded-xl z-[120]">
                <SelectItem value="ALL" className="text-xs font-semibold cursor-pointer">
                  👨‍⚕️ Todos los especialistas
                </SelectItem>
                {doctors.map(doc => (
                  <SelectItem key={doc.id} value={doc.id} className="text-xs font-semibold cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: doc.calendarColor }} 
                      />
                      <span>{doc.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/80 border border-border/60 text-xs font-semibold text-foreground">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: defaultUserColor }} 
            />
            <span>Mi Calendario</span>
          </div>
        )}

        <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 text-xs font-semibold">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>

        <NewAppointmentModal defaultDate={currentWeekStart} />
      </div>

    </div>
  )
}