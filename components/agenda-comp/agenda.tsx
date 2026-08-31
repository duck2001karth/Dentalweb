"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  CalendarCheck, RefreshCcw, Phone, AlertCircle, Clock, 
  MapPin, User, CheckCircle2, Tags, HelpCircle 
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
  const { settings } = useClinicSettings()

  const [date, setDate] = useState<Date | undefined>(new Date())
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
            setDoctorsList(data.filter(u => u.role === "DOCTOR"))
          }
        })
        .catch(err => console.error("Error cargando doctores:", err))
    }
  }, [isAdminOrStaff])

  const { appointments = [], isLoading, error: isError, refetch } = useGetAppointments({ 
    fecha: date,
    doctorId: selectedDoctor === "all" ? undefined : selectedDoctor 
  })

  const citasActivas = appointments.filter((cita: any) => cita.status !== "CANCELLED")
  const anulacionesCount = appointments.filter((cita: any) => cita.status === "CANCELLED").length

  return (
    <div className="flex-1 w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 border-b border-border/80 pb-4">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-[#008bcd]" />
            Agenda Diaria
          </h3>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Planificación para el <span className="text-[#008bcd] font-bold">{date ? format(date, "EEEE, d 'de' MMMM yyyy", { locale: es }) : "día seleccionado"}</span>
          </p>
          {isAdminOrStaff && (
            <div className="mt-3 flex items-center gap-3 bg-card p-1.5 px-3 rounded-xl border border-border/80 shadow-xs w-max">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Filtro Médico:</span>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger className="w-[230px] h-8 text-xs font-bold bg-background border-border/80 rounded-lg">
                  <SelectValue placeholder="Todos los especialistas" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/80 shadow-xl">
                  <SelectItem value="all" className="font-bold text-xs">👥 Todos los especialistas</SelectItem>
                  {doctorsList.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id} className="font-medium text-xs">
                      👨‍⚕️ {doc.name} {doc.specialty ? `(${doc.specialty})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* BARRA DE ACCIONES */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedAppointment(null) 
              setIsRescheduleOpen(true)
            }}
            className="flex-1 md:flex-none bg-transparent border border-border/80 text-foreground hover:text-[#008bcd] hover:bg-[#008bcd]/10 hover:border-[#008bcd]/30 font-bold text-sm h-11 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-none group"
          >
            <RefreshCcw className="h-5 w-5 mr-2 text-muted-foreground group-hover:text-[#008bcd] transition-colors" /> 
            <span>Reprogramar</span>
          </Button>
          
          <Link href="/agenda-global" className="flex-1 md:flex-none">
            <Button 
              variant="ghost" 
              className="w-full bg-transparent border border-border/80 text-foreground hover:text-[#008bcd] hover:bg-[#008bcd]/10 hover:border-[#008bcd]/30 font-bold text-sm h-11 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-none group"
            >
              <CalendarCheck className="h-5 w-5 mr-2 text-muted-foreground group-hover:text-[#008bcd] transition-colors" /> 
              <span>Agenda Global</span>
            </Button>
          </Link>

          <div className="hidden sm:block w-[1px] h-6 bg-border/80 mx-1" />

          {/* COMPONENTE DE IMPRESIÓN */}
          <PrintAgendaModal 
            date={date || new Date()} 
            appointments={citasActivas}
            citas={citasActivas}
            doctors={doctorsList}
          />
          
          <NewAppointmentModal />
        </div>
      </div>

      {/* --- CONTENIDO DE LA AGENDA --- */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
            <div className="bg-muted/30 px-5 py-3 border-b border-border/80">
              <h4 className="font-extrabold text-xs text-muted-foreground uppercase tracking-wider">Navegador</h4>
            </div>
            <div className="p-3 flex flex-col items-center justify-center">
              <div className="w-full flex justify-center [&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-day_selected]:bg-[#008bcd] [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:bg-[#0070a8] [&_.rdp-day]:rounded-xl">
                <Calendar mode="single" selected={date} onSelect={setDate} className="bg-transparent" />
              </div>
              
              {anulacionesCount > 0 && (
                <div className="w-full pt-4 mt-2 border-t border-border/80 flex flex-col gap-3 animate-in fade-in">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 shadow-xs">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Atención</p>
                      <p className="text-[10px] text-amber-600/90 dark:text-amber-400/80 mt-0.5 leading-tight font-medium">
                        Tienes {anulacionesCount} anulación{anulacionesCount === 1 ? '' : 'es'} pendiente{anulacionesCount === 1 ? '' : 's'} de revisión hoy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LISTADO DE CITAS */}
        <div className="xl:col-span-3">
          
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
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border/80 rounded-2xl bg-card/50 shadow-xs">
              <div className="w-16 h-16 bg-muted/60 rounded-2xl flex items-center justify-center mb-3 border border-border/60">
                <CalendarCheck className="h-8 w-8 text-[#008bcd]" />
              </div>
              <p className="text-base font-bold text-foreground">Sin citas asignadas</p>
              <p className="text-xs mt-1 max-w-xs text-center font-medium opacity-80">
                {selectedDoctor !== "all" 
                  ? "Este especialista no tiene citas programadas para hoy." 
                  : `No hay citas activas programadas para ${date ? format(date, "d 'de' MMMM", { locale: es }) : "este día"}.`}
              </p>
            </div>
          )}

          {!isLoading && citasActivas.length > 0 && (
            <div className="space-y-3.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 pb-6 custom-scrollbar">
              {citasActivas.map((cita: any) => {
                const statusInfo = appointmentStatuses[cita.status] || {
                  label: cita.status,
                  color: "text-slate-600 dark:text-slate-400",
                  bg: "bg-slate-100 dark:bg-slate-800",
                  icon: HelpCircle
                };
                const StatusIcon = statusInfo.icon;

                return (
                  <div 
                    key={cita.id} 
                    className="group flex flex-col md:flex-row items-stretch md:items-center bg-card rounded-2xl border border-border/80 hover:border-[#008bcd]/60 hover:shadow-lg hover:shadow-[#008bcd]/5 transition-all duration-200 overflow-hidden relative"
                  >
                    
                    {/* BARRA LATERAL DE ESTADO */}
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", statusInfo.bg.split(" ")[0])} />

                    {/* HORARIO */}
                    <div className="flex md:flex-col items-center justify-between md:justify-center px-5 py-3.5 md:py-5 bg-muted/20 md:w-32 md:border-r border-b md:border-b-0 border-border/80 shrink-0 ml-1.5">
                      <div className="flex items-center gap-2 md:hidden text-muted-foreground font-bold text-[10px] uppercase tracking-wider mb-0.5">
                        <Clock className="w-3.5 h-3.5 text-[#008bcd]" /> Horario
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-black text-foreground tracking-tight">{cita.startTime}</div>
                        <div className="text-[10px] font-bold text-muted-foreground mt-0.5 bg-background px-2 py-0.5 rounded-md border border-border/80 inline-block uppercase tracking-wider">
                          HASTA {cita.endTime}
                        </div>
                      </div>
                    </div>

                    {/* DETALLES */}
                    <div className="flex-1 p-4 md:px-6 flex flex-col justify-center gap-2.5">
                      
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3.5 items-start">
                          <div className="w-10 h-10 rounded-xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center font-bold border border-[#008bcd]/20 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                            {cita.patient?.firstName?.charAt(0) || "P"}
                          </div>
                          <div>
                            <Link 
                              href={`/paciente/${cita.patientId}`} 
                              className="text-sm font-bold text-foreground group-hover:text-[#008bcd] transition-colors line-clamp-1"
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
                            <User className="w-3.5 h-3.5 text-[#008bcd]" /> {cita.doctor?.name || "Dr. Asignado"}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground/80" /> {cita.patient?.phone || "Sin contacto"}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#008bcd]" /> Sillón / Box:{" "}
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
                    <div className="p-3 md:p-5 md:pl-0 flex flex-row md:flex-col justify-end gap-2 md:w-36 shrink-0 border-t md:border-t-0 border-border/80 bg-muted/10 md:bg-transparent">
                      {cita.payment === 'DEBT' ? (
                        <Button variant="destructive" className="w-full rounded-xl h-9 text-xs font-bold shadow-xs transition-all">
                          <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Deudas
                        </Button>
                      ) : (
                        <Link href={`/paciente/${cita.patientId}?tab=evoluciones`} className="w-full">
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 text-xs font-bold shadow-xs transition-all cursor-pointer">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Atender
                          </Button>
                        </Link>
                      )}

                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setSelectedAppointment(cita)
                          setIsRescheduleOpen(true)
                        }}
                        className="w-full h-8 text-xs font-bold text-muted-foreground hover:text-[#008bcd] hover:bg-accent/60 rounded-xl transition-all cursor-pointer"
                      >
                        <RefreshCcw className="w-3 h-3 mr-1 text-[#008bcd]" /> Reprogramar
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

// Exportaciones compatibles
export { DashboardAgenda as Agenda }
export default DashboardAgenda