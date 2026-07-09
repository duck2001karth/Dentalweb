"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarCheck, RefreshCcw, Phone, AlertCircle, Clock, MapPin, User, ChevronRight, CheckCircle2, Tags } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" 
import { cn } from "@/lib/utils"

import { useGetAppointments } from "@/hooks/appointments"
import { NewAppointmentModal } from "@/components/agenda-comp/new-appointment"
import { PrintAgendaModal } from "@/components/agenda-comp/print" 

const getStatusConfig = (status: string) => {
  switch(status) {
    case "SCHEDULED": return { text: "Agendada", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" };
    case "WAITING": return { text: "En Sala", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" };
    case "IN_PROGRESS": return { text: "En Box", dot: "bg-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20" };
    case "COMPLETED": return { text: "Atendido", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" };
    case "CANCELLED": return { text: "Anulada", dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" };
    default: return { text: status, dot: "bg-slate-500", badge: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300" };
  }
}

export function DashboardAgenda() {
  const { data: session } = useSession()
  const currentUser = session?.user as any
  const isAdminOrStaff = currentUser?.role === "ADMIN" || currentUser?.role === "RECEPTIONIST"

  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedDoctor, setSelectedDoctor] = useState("all")
  const [doctorsList, setDoctorsList] = useState<any[]>([])

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


  const { appointments = [], isLoading, error: isError } = useGetAppointments({ 
    fecha: date,
    doctorId: selectedDoctor === "all" ? undefined : selectedDoctor 
  })

  // Filtramos las citas "activas" 
  const citasActivas = appointments.filter((cita: any) => cita.status !== "CANCELLED")
  const anulacionesCount = appointments.filter((cita: any) => cita.status === "CANCELLED").length

  return (
    <div className="flex-1 w-full animate-in fade-in duration-500">
      
      {/* --- CABECERA DE LA AGENDA --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-[#008bcd]" />
            Agenda Diaria
          </h3>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Planificación para el <span className="text-[#008bcd]">{date ? format(date, "EEEE, d 'de' MMMM yyyy", { locale: es }) : "día seleccionado"}</span>
          </p>
          
          {/* SÚPER PODERES: SELECTOR DE DOCTOR PARA ADMIN/RECEPCIÓN */}
          {isAdminOrStaff && (
            <div className="mt-4 flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border w-max">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Filtro Médico:</span>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger className="w-[240px] h-8 text-xs font-bold bg-background">
                  <SelectValue placeholder="Todos los especialistas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">👥 Todos los especialistas</SelectItem>
                  {doctorsList.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id} className="font-medium">
                      👨‍⚕️ {doc.name} {doc.specialty ? `(${doc.specialty})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto mt-4 md:mt-0">
          <Link href="/reprogramacion" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full bg-background border-border text-foreground hover:bg-accent font-semibold shadow-sm">
              <RefreshCcw className="h-4 w-4 mr-2 text-muted-foreground" /> Reprogramar
            </Button>
          </Link>
          
          <Link href="/agendavand" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-[#008bcd] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold shadow-sm">
              <CalendarCheck className="h-4 w-4 mr-2" /> Avanzada
            </Button>
          </Link>

          <div className="hidden sm:block w-px h-8 bg-border mx-1"></div>

          <PrintAgendaModal date={date} citas={citasActivas} />
          <NewAppointmentModal />
        </div>
      </div>

      {/* --- CUERPO PRINCIPAL --- */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        
        {/* --- COLUMNA IZQUIERDA: CALENDARIO Y ALERTAS --- */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="bg-muted/30 px-5 py-3 border-b border-border">
              <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">Navegador</h4>
            </div>
            <div className="p-4 flex flex-col items-center justify-center">
              <div className="w-full flex justify-center [&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-day_selected]:bg-[#008bcd] [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:bg-[#0070a8]">
                <Calendar mode="single" selected={date} onSelect={setDate} className="bg-transparent" />
              </div>
              
              {anulacionesCount > 0 && (
                <div className="w-full pt-5 mt-3 border-t border-border flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2.5 shadow-sm">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Atención</p>
                      <p className="text-[10px] text-amber-600/80 dark:text-amber-500/80 mt-0.5 leading-tight">
                        Tienes {anulacionesCount} anulación{anulacionesCount === 1 ? '' : 'es'} pendiente{anulacionesCount === 1 ? '' : 's'} de revisión hoy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- COLUMNA DERECHA: LISTADO DE CITAS ACTIVAS --- */}
        <div className="xl:col-span-3">
          
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-[104px] rounded-2xl bg-muted/50" />
              ))}
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center p-12 text-destructive border border-destructive/20 rounded-2xl bg-destructive/5 shadow-sm">
              <AlertCircle className="h-10 w-10 mb-3 opacity-80" />
              <p className="font-bold text-lg">No se pudo cargar la agenda</p>
              <p className="text-sm opacity-80 mt-1">Verifica tu conexión a la base de datos o recarga la página.</p>
            </div>
          )}

          {!isLoading && !isError && citasActivas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed border-border rounded-2xl bg-card shadow-sm">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <CalendarCheck className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-lg font-bold text-foreground">Sin citas asignadas</p>
              <p className="text-sm mt-1 max-w-xs text-center">
                {selectedDoctor !== "all" 
                  ? "Este especialista no tiene citas programadas para hoy." 
                  : `No hay citas activas programadas para el ${date ? format(date, "d 'de' MMMM", { locale: es }) : "este día"}.`}
              </p>
            </div>
          )}

          {!isLoading && citasActivas.length > 0 && (
            <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 pb-6 custom-scrollbar">
              {citasActivas.map((cita: any) => {
                const statusInfo = getStatusConfig(cita.status);

                return (
                  <div key={cita.id} className="group flex flex-col md:flex-row items-stretch md:items-center bg-card rounded-2xl border border-border hover:border-[#008bcd]/40 hover:shadow-md transition-all overflow-hidden relative">
                    
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-colors", statusInfo.dot)}></div>

                    <div className="flex md:flex-col items-center justify-between md:justify-center px-6 py-4 md:py-6 bg-muted/20 md:w-32 md:border-r border-b md:border-b-0 border-border shrink-0 ml-1.5">
                      <div className="flex items-center gap-2 md:hidden text-muted-foreground font-semibold text-xs uppercase tracking-wider mb-0.5">
                        <Clock className="w-3.5 h-3.5" /> Horario
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-black text-foreground tracking-tight">{cita.startTime}</div>
                        <div className="text-[10px] font-bold text-muted-foreground mt-0.5 bg-background px-2 py-0.5 rounded-full border border-border inline-block">HASTA {cita.endTime}</div>
                      </div>
                    </div>

                    <div className="flex-1 p-5 md:px-6 flex flex-col justify-center gap-3">
                      
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-[#008bcd] flex items-center justify-center font-bold border border-blue-500/20 shrink-0 mt-0.5">
                            {cita.patient?.firstName?.charAt(0) || "P"}
                          </div>
                          <div>
                            <Link href={`/paciente/${cita.patientId}`} className="text-base font-bold text-foreground hover:text-[#008bcd] transition-colors line-clamp-1">
                              {cita.patient?.firstName} {cita.patient?.lastName}
                            </Link>
                            <p className="text-xs font-semibold text-muted-foreground mt-1">
                              Motivo: <span className="text-foreground">{cita.reason || "Consulta General"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="hidden md:flex flex-col items-end gap-1">
                          <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5", statusInfo.badge)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dot)}></span>
                            {statusInfo.text}
                          </span>
                          {/* El nombre del doctor ya se mostraba aquí, ahora es más útil para el Admin */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-1">
                            <User className="w-3.5 h-3.5" /> {cita.doctor?.name || "Dr. Asignado"}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3.5 h-3.5 opacity-70" /> {cita.patient?.phone || "Sin contacto"}</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5 opacity-70 text-[#008bcd]" /> Box: <span className="font-bold text-foreground">{cita.box || "N/A"}</span></span>
                        
                        {cita.situation && (
                          <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                            <Tags className="w-3.5 h-3.5" /> {cita.situation}
                          </span>
                        )}
                      </div>

                    </div>

                    <div className="p-4 md:p-6 md:pl-0 flex flex-row md:flex-col justify-end gap-2 md:w-40 shrink-0 border-t md:border-t-0 border-border bg-muted/10 md:bg-transparent">
                      {cita.payment === 'DEBT' ? (
                        <Button variant="destructive" className="w-full rounded-xl h-10 font-bold shadow-sm hover:shadow-md transition-all">
                          <AlertCircle className="w-4 h-4 mr-1.5" /> Deudas
                        </Button>
                      ) : (
                        <Link href={`/paciente/${cita.patientId}?tab=evoluciones`} className="w-full">
                          <Button className="w-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl h-10 font-bold shadow-sm hover:shadow-md transition-all">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Atender
                          </Button>
                        </Link>
                      )}
                      <Link href={`/paciente/${cita.patientId}`} className="w-full">
                        <Button variant="ghost" className="w-full h-8 text-xs font-semibold text-muted-foreground hover:text-[#008bcd] hidden md:flex">
                          Ver ficha <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
          
        </div>
      </div>
    </div>
  )
}