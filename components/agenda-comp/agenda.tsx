"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  CalendarCheck, RefreshCcw, Phone, AlertCircle, Clock, 
  MapPin, User, CheckCircle2, Tags, HelpCircle, ChevronLeft, ChevronRight, RotateCcw 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" 
import { cn } from "@/lib/utils"

import { useGetAppointments } from "@/hooks/appointments"
import { NewAppointmentModal } from "@/components/agenda-comp/new-appointment"
import { PrintAgendaModal } from "@/components/agenda-comp/print"
import { RescheduleModal } from "@/components/agenda-comp/reschedule" 
import { appointmentStatuses } from "@/constants/status" 
import { useClinicSettings } from "@/config/clinic-settings"

const getReasonLabel = (reason?: string) => {
  if (!reason) return "Consulta General"

  switch (reason) {
    case "PATIENT_REQUEST": 
      return "Solicitud del Paciente"
    case "DOCTOR_UNAVAILABILITY": 
      return "Ausencia / Emergencia Médica"
    case "NO_SHOW": 
      return "Reagendamiento por Inasistencia"
    case "CLINIC_SCHEDULE_CHANGE": 
      return "Ajuste de Horario en Clínica"
    default: 
      return reason 
  }
}

export function DashboardAgenda() {
  const { data: session } = useSession()
  const currentUser = session?.user as any
  const isAdminOrStaff = currentUser?.role === "ADMIN" || currentUser?.role === "RECEPTIONIST"
  const defaultUserColor = currentUser?.calendarColor || "#008bcd"
  const { settings } = useClinicSettings()

  const [date, setDate] = useState<Date | undefined>(new Date())
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date())
  useEffect(() => { if (date) setVisibleMonth(date) }, [date])
  const changeDay = (days: number) => setDate(current => {
    const next = new Date(current ?? new Date())
    next.setDate(next.getDate() + days)
    return next
  })
  const goToToday = () => setDate(new Date())
  const [selectedDoctor, setSelectedDoctor] = useState("all")
  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)

  useEffect(() => {
    if (isAdminOrStaff) {
      fetch("/api/admin/users")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setDoctorsList(
              data.filter(u => u.role === "DOCTOR").map(d => ({
                id: d.id,
                name: d.name,
                specialty: d.specialty,
                calendarColor: d.calendarColor || "#008bcd",
              }))
            )
          }
        })
        .catch(err => console.error("Error cargando doctores:", err))
    }
  }, [isAdminOrStaff])

  const doctorColorsMap = useMemo(() => {
    const map: Record<string, string> = {}
    doctorsList.forEach(doc => {
      map[doc.id] = doc.calendarColor || "#008bcd"
    })
    if (currentUser?.id) {
      map[currentUser.id] = defaultUserColor
    }
    return map
  }, [doctorsList, currentUser, defaultUserColor])

  const effectiveDoctorId = isAdminOrStaff 
    ? (selectedDoctor === "all" ? undefined : selectedDoctor)
    : currentUser?.id

  const { appointments = [], isLoading, error: isError, refetch } = useGetAppointments({ 
    fecha: date,
    doctorId: effectiveDoctorId 
  })

  const citasActivas = appointments.filter((cita: any) => cita.status !== "CANCELLED")
  const anulacionesCount = appointments.filter((cita: any) => cita.status === "CANCELLED").length
  const isToday = date ? new Date(date).toDateString() === new Date().toDateString() : false

  return (
    <div className="flex-1 w-full animate-in fade-in duration-500">
      {/* Encabezado clínico, sencillo y legible */}
      <div className="mb-5 flex flex-col gap-4 border-b border-border/70 pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Agenda diaria</h2>
              {!isLoading && !isError && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {citasActivas.length} {citasActivas.length === 1 ? "cita" : "citas"}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {date ? format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : "Selecciona una fecha"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => changeDay(-1)} aria-label="Día anterior" title="Día anterior" className="h-9 w-9 px-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} disabled={isToday} className="h-9 px-3 font-medium">Hoy</Button>
            <Button variant="outline" size="sm" onClick={() => changeDay(1)} aria-label="Día siguiente" title="Día siguiente" className="h-9 w-9 px-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
            <Button variant="ghost" size="sm" onClick={() => void refetch()} className="h-9 px-3 font-medium" title="Actualizar citas">
              <RotateCcw className="h-4 w-4" /> Actualizar
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {isAdminOrStaff ? (
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-muted-foreground">Especialista</span>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger aria-label="Filtrar por especialista" className="h-9 w-full min-w-0 rounded-xl bg-card text-xs font-medium sm:w-[235px]">
                  <SelectValue placeholder="Todos los especialistas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los especialistas</SelectItem>
                  {doctorsList.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: doc.calendarColor || "#008bcd" }} />
                        {doc.name} {doc.specialty ? `(${doc.specialty})` : ""}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : <span />}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 font-medium" onClick={() => { setSelectedAppointment(null); setIsRescheduleOpen(true) }}>
              <RefreshCcw className="h-4 w-4" /> Reprogramar
            </Button>
            <Button asChild variant="outline" size="sm" className="h-9 font-medium">
              <Link href="/agenda-global"><CalendarCheck className="h-4 w-4" /> Agenda global</Link>
            </Button>
            <PrintAgendaModal date={date || new Date()} appointments={citasActivas} citas={citasActivas} doctors={doctorsList} />
            <NewAppointmentModal />
          </div>
        </div>
      </div>

      {/* --- CONTENIDO DE LA AGENDA --- */}
      <div className="grid grid-cols-1 gap-5 items-start xl:grid-cols-[minmax(255px,305px)_minmax(0,1fr)]">
        <aside className="xl:col-span-1 min-w-0">
          <section className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-4" aria-label="Navegador de fechas">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-foreground">Calendario</h3>
              <button type="button" onClick={goToToday} className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Ir a hoy</button>
            </div>
            {/* El estilo de selección vive en ui/calendar.tsx; no sobrescribir .rdp-day */}
            <Calendar
              mode="single"
              selected={date}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              onSelect={(day) => { if (day) setDate(day) }}
              className="w-full rounded-xl bg-transparent p-0"
              classNames={{
                month_grid: "w-full border-collapse",
                weekdays: "flex w-full justify-between mb-1",
                week: "flex w-full justify-between mt-1",
                day_button: "mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary",
              }}
            />
            {anulacionesCount > 0 && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200" role="note">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{anulacionesCount} {anulacionesCount === 1 ? "cita anulada" : "citas anuladas"} en la fecha seleccionada.</span>
              </div>
            )}
          </section>
        </aside>

        {/* LISTADO DE CITAS */}
        <div className="min-w-0">
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-[110px] rounded-2xl bg-muted/40" />
              ))}
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center p-12 text-destructive border border-destructive/20 rounded-2xl bg-destructive/5 shadow-xs">
              <AlertCircle className="h-10 w-10 mb-3 opacity-80" />
              <p className="font-bold text-lg">No se pudo cargar la agenda</p>
              <p className="text-sm opacity-80 mt-1">Verifica tu conexión a la base de datos o recarga la página.</p>
            </div>
          )}

          {!isLoading && !isError && citasActivas.length === 0 && (
            <div className="flex min-h-[290px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card px-6 py-12 text-center text-muted-foreground">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 border"
                style={{
                  backgroundColor: `${defaultUserColor}15`,
                  borderColor: `${defaultUserColor}30`,
                  color: defaultUserColor,
                }}
              >
                <CalendarCheck className="h-8 w-8" />
              </div>
              <p className="text-base font-semibold text-foreground">Sin citas programadas</p>
              <p className="text-xs mt-1 max-w-xs text-center font-medium opacity-80">
                {selectedDoctor !== "all" 
                  ? "Este especialista no tiene citas programadas para la fecha seleccionada." 
                  : `No hay citas activas programadas para ${date ? format(date, "d 'de' MMMM", { locale: es }) : "este día"}.`}
              </p>
            </div>
          )}

          {!isLoading && citasActivas.length > 0 && (
            <div className="max-h-[calc(100vh-260px)] space-y-3 overflow-y-auto pb-3 pr-1">
              {citasActivas.map((cita: any) => {
                const statusInfo = appointmentStatuses[cita.status] || {
                  label: cita.status,
                  color: "text-slate-600 dark:text-slate-400",
                  bg: "bg-slate-100 dark:bg-slate-800",
                  icon: HelpCircle
                };
                const StatusIcon = statusInfo.icon;

                const docId = cita.doctorId || cita.doctor?.id;
                const appointmentDocColor = doctorColorsMap[docId] || cita.doctor?.calendarColor || defaultUserColor;

                return (
                  <div 
                    key={cita.id} 
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-colors hover:border-primary/30 md:flex-row md:items-stretch"
                  >
                    {/* BARRA LATERAL DE ESTADO */}
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", statusInfo.bg.split(" ")[0])} />

                    {/* HORARIO */}
                    <div className="ml-1.5 flex shrink-0 items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3 md:w-28 md:flex-col md:justify-center md:border-b-0 md:border-r">
                      <div className="flex items-center gap-2 md:hidden text-muted-foreground font-bold text-[10px] uppercase tracking-wider mb-0.5">
                        <Clock className="w-3.5 h-3.5" style={{ color: appointmentDocColor }} /> Horario
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold tracking-tight text-foreground">{cita.startTime}</div>
                        <div className="text-[10px] font-bold text-muted-foreground mt-0.5 bg-background px-2 py-0.5 rounded-md border border-border/80 inline-block uppercase tracking-wider">
                          HASTA {cita.endTime}
                        </div>
                      </div>
                    </div>

                    {/* DETALLES */}
                    <div className="flex flex-1 flex-col justify-center gap-2.5 p-4 md:px-5">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3.5 items-start">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold border shrink-0 mt-0.5 group-hover:scale-105 transition-transform"
                            style={{
                              backgroundColor: `${appointmentDocColor}18`,
                              borderColor: `${appointmentDocColor}35`,
                              color: appointmentDocColor,
                            }}
                          >
                            {cita.patient?.firstName?.charAt(0) || "P"}
                          </div>
                          <div>
                            <Link 
                              href={`/paciente/${cita.patientId}`} 
                              className="line-clamp-1 text-sm font-semibold text-foreground hover:text-primary hover:underline"
                            >
                              {cita.patient?.firstName} {cita.patient?.lastName}
                            </Link>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">
                              Motivo: <span className="text-foreground font-semibold">{getReasonLabel(cita.reason)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="hidden md:flex flex-col items-end gap-1">
                          <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5", statusInfo.bg, statusInfo.color)}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.label}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-0.5">
                            <User className="w-3.5 h-3.5" style={{ color: appointmentDocColor }} /> {cita.doctor?.name || "Dr. Asignado"}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground/80" /> {cita.patient?.phone || "Sin contacto"}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                          <MapPin className="w-3.5 h-3.5" style={{ color: appointmentDocColor }} /> Sillón / Box:{" "}
                          <span className="font-bold text-foreground">
                            {cita.box || (settings?.availableBoxes?.[0] ?? "Box 1")}
                          </span>
                        </span>
                        
                        {cita.situation && (
                          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 text-[11px]">
                            <Tags className="w-3.5 h-3.5" /> {cita.situation}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex shrink-0 flex-row justify-end gap-2 border-t border-border/60 bg-muted/10 p-3 md:w-36 md:flex-col md:border-t-0 md:bg-transparent md:p-4 md:pl-0">
                      {cita.payment === 'DEBT' ? (
                        currentUser?.role === "RECEPTIONIST" || currentUser?.role === "ADMIN" ? (
                          <Link href={`/paciente/${cita.patientId}?tab=pagos`} className="w-full">
                            <Button variant="destructive" className="w-full rounded-xl h-9 text-xs font-bold shadow-xs transition-all cursor-pointer">
                              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Cobrar Deuda
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="destructive" className="w-full rounded-xl h-9 text-xs font-bold shadow-xs transition-all cursor-not-allowed opacity-90">
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Con Deuda
                          </Button>
                        )
                      ) : currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN" ? (
                        <Link href={`/paciente/${cita.patientId}?tab=evoluciones`} className="w-full">
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 text-xs font-bold shadow-xs transition-all cursor-pointer">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Atender
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/paciente/${cita.patientId}`} className="w-full">
                          <Button variant="outline" className="w-full rounded-xl h-9 text-xs font-bold border-border/80 bg-card text-foreground hover:bg-muted hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] shadow-2xs transition-all cursor-pointer">
                            Ver Ficha
                          </Button>
                        </Link>
                      )}

                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setSelectedAppointment(cita)
                          setIsRescheduleOpen(true)
                        }}
                        className="w-full h-8 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-xl transition-all cursor-pointer"
                      >
                        <RefreshCcw className="w-3 h-3 mr-1" style={{ color: appointmentDocColor }} /> Reprogramar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        selectedAppointment={selectedAppointment}
        onSuccessCallback={() => refetch()}
      />
    </div>
  )
}

export { DashboardAgenda as Agenda }
export default DashboardAgenda