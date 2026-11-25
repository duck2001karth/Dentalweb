"use client"

import React, { useEffect, useMemo } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, Clock3, UserRound, MapPin, AlignLeft, Stethoscope } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PatientSelector } from "./patient-selector"
import { useClinicSettings } from "@/config/clinic-settings"

interface AppointmentFormProps {
  formData: any
  setFormData: (data: any) => void
  patients: any[]
  doctorsList: any[]
  isLoadingPatients: boolean
  isLoadingDoctors: boolean
  doctorsError?: string
  onRetryDoctors?: () => void
  isAdminOrStaff: boolean
  currentUser: any
  validInitialStatuses: any[]
}

const fieldClass = "h-11 w-full rounded-xl border-border bg-background text-sm font-medium text-foreground shadow-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/25"
const labelClass = "flex items-center gap-1.5 text-xs font-medium text-foreground"

export function AppointmentForm({
  formData,
  setFormData,
  patients,
  doctorsList,
  isLoadingPatients,
  isLoadingDoctors,
  doctorsError,
  onRetryDoctors,
  isAdminOrStaff,
  currentUser,
  validInitialStatuses,
}: AppointmentFormProps) {
  const { settings, isLoading: isLoadingSettings } = useClinicSettings()

  const availableBoxes = useMemo(
    () => settings?.availableBoxes?.length ? settings.availableBoxes : ["Box 1"],
    [settings?.availableBoxes]
  )

  useEffect(() => {
    if (!formData.box && availableBoxes.length > 0) {
      setFormData((prev: any) => ({ ...prev, box: availableBoxes[0] }))
    }
  }, [availableBoxes, formData.box, setFormData])

  const activeDoctorColor = useMemo(() => {
    const selected = doctorsList?.find((d: any) => d.id === formData.doctorId)
    return selected?.calendarColor || currentUser?.calendarColor || "#008bcd"
  }, [formData.doctorId, doctorsList, currentUser?.calendarColor])

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedTime = e.target.value
    if (!selectedTime) {
      setFormData({ ...formData, startTime: "" })
      return
    }

    // Conserva el comportamiento original: duración inicial de 30 minutos.
    const [h, m] = selectedTime.split(":").map(Number)
    const d = new Date()
    d.setHours(h, m + 30, 0, 0)
    const endTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    setFormData({ ...formData, startTime: selectedTime, endTime })
  }

  return (
    <div className="grid grid-cols-1 gap-7 px-5 py-6 font-sans sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-7">
      {/* Identificación y contexto clínico */}
      <section className="min-w-0 space-y-5" aria-labelledby="appointment-clinical-heading">
        <div className="flex items-center gap-2.5 border-b border-border/70 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 id="appointment-clinical-heading" className="text-sm font-semibold tracking-tight text-foreground">Paciente y atención</h3>
            <p className="text-[11px] text-muted-foreground">Información para identificar la cita</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className={labelClass}>
            Paciente <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <PatientSelector
            patientId={formData.patientId}
            setPatientId={(id) => setFormData({ ...formData, patientId: id })}
            patients={patients}
            isLoading={isLoadingPatients}
            themeColor={activeDoctorColor}
          />
          <p className="text-[11px] text-muted-foreground">Busca por nombre, apellido o CI.</p>
        </div>

        <div className="space-y-2">
          <Label className={labelClass}>
            <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            Especialista asignado <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Select
            value={formData.doctorId || ""}
            onValueChange={(id) => setFormData({ ...formData, doctorId: id })}
            disabled={isAdminOrStaff && (isLoadingDoctors || !!doctorsError)}
          >
            <SelectTrigger className={fieldClass}>
              <SelectValue placeholder={isLoadingDoctors ? "Cargando especialistas..." : "Seleccionar especialista"} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground shadow-lg">
              {isAdminOrStaff ? (
                doctorsList.length > 0 ? (
                  doctorsList.map((doc: any) => (
                    <SelectItem key={doc.id} value={doc.id} className="text-sm">
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: doc.calendarColor || "#008bcd" }} />
                        <span>{doc.name}{doc.specialty ? ` (${doc.specialty})` : ""}</span>
                      </span>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="empty" disabled>No hay especialistas activos</SelectItem>
                )
              ) : (
                <SelectItem value={currentUser?.id || "doctor_default"}>
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: activeDoctorColor }} />
                    {currentUser?.name || "Dr. Asignado"} (Tú)
                  </span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {isAdminOrStaff && doctorsError && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-foreground"><p>{doctorsError}</p><Button type="button" variant="outline" size="sm" className="mt-2" onClick={onRetryDoctors}>Reintentar</Button></div>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label className={labelClass}>Estado inicial</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground shadow-lg">
                {validInitialStatuses.map((status) => {
                  const StatusIcon = status.icon
                  return (
                    <SelectItem key={status.value} value={status.value} className="text-sm">
                      <span className="flex items-center gap-2">
                        {StatusIcon ? <StatusIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> : null}
                        {status.label}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label className={labelClass}>Situación</Label>
            <Select value={formData.situation} onValueChange={(value) => setFormData({ ...formData, situation: value })}>
              <SelectTrigger className={fieldClass}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground shadow-lg">
                <SelectItem value="Primera Consulta">Primera consulta</SelectItem>
                <SelectItem value="Control Regular">Control regular</SelectItem>
                <SelectItem value="Emergencia">Emergencia</SelectItem>
                <SelectItem value="Tratamiento">Tratamiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Fecha, horario y ubicación */}
      <section className="min-w-0 space-y-5" aria-labelledby="appointment-schedule-heading">
        <div className="flex items-center gap-2.5 border-b border-border/70 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 id="appointment-schedule-heading" className="text-sm font-semibold tracking-tight text-foreground">Fecha y horario</h3>
            <p className="text-[11px] text-muted-foreground">Disponibilidad y ubicación de atención</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className={labelClass}>Fecha de la cita <span className="text-destructive" aria-hidden="true">*</span></Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className={cn(fieldClass, "justify-between px-3 text-left font-medium hover:bg-accent hover:text-accent-foreground", !formData.date && "text-muted-foreground")}>
                <span className="truncate">
                  {formData.date ? format(formData.date, "EEEE, d 'de' MMMM yyyy", { locale: es }) : "Seleccionar fecha"}
                </span>
                <CalendarDays className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="z-[120] w-auto rounded-xl border-border bg-popover p-2 text-popover-foreground shadow-xl">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(day) => day && setFormData({ ...formData, date: day })}
                disabled={(day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
                className="bg-transparent"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" /> Horario
            </p>
            <span className="text-[11px] text-muted-foreground">Duración inicial: 30 min</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="appointment-start-time" className={labelClass}>Inicio <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Input id="appointment-start-time" type="time" value={formData.startTime} onChange={handleStartTimeChange} className={fieldClass} required />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="appointment-end-time" className={labelClass}>Fin <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Input id="appointment-end-time" type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} min={formData.startTime} className={fieldClass} required />
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">Puedes ajustar manualmente la hora de finalización.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label className={labelClass}>
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              Sillón / Box <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Select value={formData.box || availableBoxes[0] || ""} onValueChange={(value) => setFormData({ ...formData, box: value })} disabled={isLoadingSettings}>
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder={isLoadingSettings ? "Cargando sillones..." : "Seleccionar box"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground shadow-lg">
                {availableBoxes.map((name: string) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="appointment-reason" className={labelClass}>
              <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              Detalle corto <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="appointment-reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ej. Evaluación inicial"
              className={fieldClass}
              required
            />
          </div>
        </div>
      </section>
    </div>
  )
}
