"use client"

import React, { useState, useMemo, useEffect } from "react"
import { format, addDays, subDays, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, Loader2, User, Clock, MapPin, CheckCircle2, 
  CalendarDays, Stethoscope, ArrowUpRight
} from "lucide-react"
import { useSession } from "next-auth/react" 
import Link from "next/link"

import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

import { NewAppointmentModal } from "@/components/agenda-comp/new-appointment"
import { useGetAppointments } from "@/hooks/appointments" 
import { appointmentStatuses } from "@/constants/status"
import { useClinicSettings } from "@/config/clinic-settings"
import { cn } from "@/lib/utils"

const HORARIOS = Array.from({ length: 22 }).map((_, i) => {
  const hora = Math.floor(i / 2) + 8
  const minutos = i % 2 === 0 ? "00" : "30"
  return `${hora.toString().padStart(2, "0")}:${minutos}`
})

export default function AgendaGlobalPage() {
  const [date, setDate] = useState<Date>(new Date())
  const { data: session } = useSession()
  const { settings } = useClinicSettings()
  const { appointments = [], isLoading } = useGetAppointments({ fecha: date })
  
  const [selectedCita, setSelectedCita] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  
  const [doctoresDeLaClinica, setDoctoresDeLaClinica] = useState<any[]>([])
  const [isLoadingDoctores, setIsLoadingDoctores] = useState(false)

  const diaAnterior = () => setDate(subDays(date, 1))
  const diaSiguiente = () => setDate(addDays(date, 1))
  const hoy = () => setDate(new Date())

  const currentUser = session?.user as any
  const isGlobalStaff = currentUser?.role === "ADMIN" || currentUser?.role === "RECEPTIONIST"

  useEffect(() => {
    if (isGlobalStaff) {
      setIsLoadingDoctores(true)
      fetch("/api/admin/users") 
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const soloDoctores = data.filter(u => u.role === "DOCTOR").map(d => ({
              id: d.id,
              name: d.name,
              especialidad: d.specialty || "Odontología General"
            }))
            setDoctoresDeLaClinica(soloDoctores)
          }
        })
        .catch(err => console.error("Error cargando especialistas:", err))
        .finally(() => setIsLoadingDoctores(false))
    }
  }, [isGlobalStaff])

  const DOCTORES = useMemo(() => {
    if (isGlobalStaff && doctoresDeLaClinica.length > 0) {
      return doctoresDeLaClinica
    }
    return [
      { 
        id: currentUser?.id || "doctor_default", 
        name: currentUser?.name ? `${currentUser.name} (Tú)` : "Dr. Asignado", 
        especialidad: currentUser?.specialty || "Odontología General" 
      }
    ]
  }, [isGlobalStaff, doctoresDeLaClinica, currentUser])

  // --- GRID MAP CON SNAPPING INTELIGENTE ---
  const gridMap = useMemo(() => {
    const map: Record<string, Record<string, any>> = {}
    
    HORARIOS.forEach(h => {
       map[h] = {}
       DOCTORES.forEach(d => { map[h][d.id] = { type: 'empty' } })
    })

    if (!appointments) return map

    appointments.forEach((cita: any) => {
       if (cita.status === "CANCELLED") return

       const docId = cita.doctorId || currentUser?.id || "doctor_default"
       if (!DOCTORES.some(d => d.id === docId)) return

       const start = cita.startTime
       const end = cita.endTime

       if(!start || !end) return

       const [startH, startM] = start.split(':').map(Number)
       const snappedStart = `${startH.toString().padStart(2, '0')}:${startM < 30 ? '00' : '30'}`

       if (!map[snappedStart]) return

       const startMins = startH * 60 + startM
       const [endH, endM] = end.split(':').map(Number)
       const endMins = endH * 60 + endM
       
       const span = Math.max(1, Math.ceil((endMins - startMins) / 30))

       if (map[snappedStart] && map[snappedStart][docId]) {
           map[snappedStart][docId] = { type: 'start', rowSpan: span, cita }

           const snappedStartMins = startH * 60 + (startM < 30 ? 0 : 30)
           for (let i = 1; i < span; i++) {
               const skipMins = snappedStartMins + (i * 30)
               const skipH = Math.floor(skipMins / 60).toString().padStart(2, '0')
               const skipM = (skipMins % 60).toString().padStart(2, '0')
               const skipTime = `${skipH}:${skipM}`
               
               if (map[skipTime] && map[skipTime][docId]) {
                   map[skipTime][docId] = { type: 'skip' }
               }
           }
       }
    })

    return map
  }, [appointments, DOCTORES, currentUser])

  return (
    <AppLayout>
      <div className="w-full h-[calc(100vh-5.5rem)] flex flex-col p-4 md:p-6 animate-in fade-in duration-300">
        
        {/* --- HEADER PRINCIPAL DE AGENDA GLOBAL --- */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between bg-card border border-border/70 rounded-2xl p-4 md:px-6 shadow-xs gap-4 mb-4 shrink-0">
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center font-bold border border-[#008bcd]/20 shadow-xs">
                <CalendarDays className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                  {isGlobalStaff ? "Agenda Global" : "Mi Agenda"}
                </h1>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {appointments.filter((c: any) => c.status !== "CANCELLED").length} citas activas programadas
                </p>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-border/80 mx-2 hidden sm:block" />

            {/* CONTROL DE FECHA */}
            <div className="flex items-center gap-1.5 bg-muted/20 border border-border/80 p-1 rounded-xl">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-foreground hover:bg-background rounded-lg" 
                onClick={diaAnterior}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-8 px-3 font-bold text-xs text-foreground hover:bg-background rounded-lg flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-[#008bcd]" />
                    {format(date, "EEEE, d 'de' MMMM yyyy", { locale: es }).toUpperCase()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-border/80 shadow-2xl z-[120]" align="center">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                </PopoverContent>
              </Popover>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-foreground hover:bg-background rounded-lg" 
                onClick={diaSiguiente}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button 
              variant="outline" 
              onClick={hoy} 
              className={cn(
                "h-8 px-3 text-xs font-bold rounded-xl border border-border/80 transition-all",
                isToday(date) ? "bg-[#008bcd]/10 text-[#008bcd] border-[#008bcd]/30 font-black" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              Hoy
            </Button>

            {(isLoading || isLoadingDoctores) && (
              <Loader2 className="h-4 w-4 animate-spin text-[#008bcd] ml-1" />
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <NewAppointmentModal defaultDate={date} />
          </div>
        </div>

        {/* --- CONTENEDOR DE LA CUADRÍCULA ESTILO GOOGLE CALENDAR --- */}
        <div className="flex-1 bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden flex flex-col relative">
          
          <div className="overflow-auto flex-1 custom-scrollbar relative">
            <table className="w-full border-collapse min-w-[760px] table-fixed">
              
              {/* ENCABEZADOS DE DOCTORES (STICKY TOP) */}
              <thead className="sticky top-0 bg-card/95 backdrop-blur-md z-30 shadow-xs border-b border-border/80">
                <tr>
                  <th className="w-20 p-3 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground border-r border-border/70 bg-muted/20 sticky left-0 z-40">
                    Hora
                  </th>
                  
                  {DOCTORES.map(doc => {
                    const citasDoctor = appointments.filter((c: any) => (c.doctorId === doc.id || (!c.doctorId && doc.id === currentUser?.id)) && c.status !== "CANCELLED").length

                    return (
                      <th key={doc.id} className="p-3.5 text-center border-r border-border/70 last:border-r-0">
                        <div className="flex items-center justify-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#008bcd] to-sky-400 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                            {doc.name.charAt(0)}
                          </div>
                          <div className="text-left overflow-hidden">
                            <p className="font-extrabold text-xs text-foreground truncate leading-tight">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium truncate">{doc.especialidad}</p>
                          </div>
                          <span className="ml-1 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold font-mono">
                            {citasDoctor}
                          </span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>

              {/* CUERPO DE HORARIOS */}
              <tbody className="relative">
                {HORARIOS.map((hora) => (
                  <tr key={hora} className="hover:bg-muted/10 transition-colors">
                    
                    {/* ETIQUETA HORARIA LATERAL */}
                    <td className="p-2 text-center text-xs font-mono font-bold text-muted-foreground/80 border-b border-r border-border/70 bg-muted/10 sticky left-0 z-20 h-16 select-none">
                      {hora}
                    </td>

                    {/* CELDAS POR ESPECIALISTA */}
                    {DOCTORES.map(doc => {
                      const cellData = gridMap[hora][doc.id]

                      if (cellData.type === 'skip') {
                        return null
                      }

                      if (cellData.type === 'start') {
                        const cita = cellData.cita
                        const statusConfig = appointmentStatuses[cita.status] || appointmentStatuses.SCHEDULED
                        const StatusIcon = statusConfig.icon

                        return (
                          <td 
                            key={`${hora}-${doc.id}`} 
                            rowSpan={cellData.rowSpan}
                            className="p-1 border-b border-r border-border/70 last:border-r-0 align-top relative"
                          >
                            <div 
                              onClick={() => {
                                setSelectedCita(cita)
                                setIsViewModalOpen(true)
                              }}
                              className={cn(
                                "w-full h-full min-h-[58px] rounded-xl p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md active:scale-[0.99] border-l-4",
                                statusConfig.bg,
                                statusConfig.color.replace("text-", "border-l-")
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="overflow-hidden">
                                  <p className="text-xs font-black text-foreground truncate leading-tight group-hover:text-[#008bcd] transition-colors">
                                    {cita.patient?.firstName} {cita.patient?.lastName}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold mt-0.5">
                                    <Clock className="w-3 h-3 text-[#008bcd]" />
                                    <span>{cita.startTime} - {cita.endTime}</span>
                                    <span>•</span>
                                    <span className="text-foreground font-bold">{cita.box || (settings?.availableBoxes?.[0] ?? "Box 1")}</span>
                                  </div>
                                </div>

                                <div className={cn("p-1 rounded-md text-[10px] shrink-0 font-bold", statusConfig.bg, statusConfig.color)}>
                                  <StatusIcon className="w-3.5 h-3.5" />
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/40">
                                <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-wider">
                                  {cita.reason || "Consulta General"}
                                </p>
                                <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </td>
                        )
                      }

                      // BLOQUE VACÍO (SLOT DISPONIBLE)
                      return (
                        <td 
                          key={`${hora}-${doc.id}`} 
                          className="p-1 border-b border-r border-border/70 last:border-r-0 h-16 relative group transition-colors hover:bg-[#008bcd]/5"
                        >
                          <NewAppointmentModal 
                            defaultDate={date}
                            defaultStartTime={hora}
                            defaultDoctorId={doc.id}
                            customTrigger={
                              <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-lg cursor-pointer bg-[#008bcd]/10 text-[#008bcd] border border-dashed border-[#008bcd]/40">
                                <Plus className="h-4 w-4 mr-1 stroke-[3]" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Agendar</span>
                              </div>
                            }
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* --- MODAL DETALLES DE CITA --- */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[440px] bg-card border-border/80 text-foreground rounded-[24px] shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-[#008bcd]/10 via-transparent to-transparent px-6 py-5 border-b border-border/80">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#008bcd]/15 text-[#008bcd] border border-[#008bcd]/30">
                  <CalendarDays className="w-5 h-5" />
                </div>
                Detalle de Cita Médica
              </DialogTitle>
            </DialogHeader>
          </div>
          
          {selectedCita && (
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3.5 bg-muted/20 border border-border/60 p-3.5 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-[#008bcd] text-white flex items-center justify-center font-black text-lg shadow-md shadow-[#008bcd]/20 shrink-0">
                  {selectedCita.patient?.firstName?.charAt(0)}{selectedCita.patient?.lastName?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-foreground text-sm truncate">
                    {selectedCita.patient?.firstName} {selectedCita.patient?.lastName}
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    CI: {selectedCita.patient?.ci || "Sin documento"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 bg-muted/10 p-4 rounded-2xl border border-border/60 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase">Horario Asignado</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedCita.startTime} - {selectedCita.endTime}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase">Sillón / Box</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedCita.box || "Box 1"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase">Especialista</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedCita.doctor?.name || "Dr. Asignado"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase">Estado</p>
                  {(() => {
                    const st = appointmentStatuses[selectedCita.status] || appointmentStatuses.SCHEDULED
                    return (
                      <span className={cn("inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border", st.bg, st.color)}>
                        {st.label}
                      </span>
                    )
                  })()}
                </div>
                <div className="col-span-2 pt-2 border-t border-border/40 mt-1">
                  <p className="text-[10px] text-muted-foreground font-black uppercase">Motivo</p>
                  <p className="font-semibold text-foreground mt-0.5">{selectedCita.reason || "Consulta General"}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t border-border/80 bg-muted/10 sm:justify-between gap-2">
            <Button 
              variant="ghost" 
              className="text-xs font-bold rounded-xl h-10 px-4" 
              onClick={() => setIsViewModalOpen(false)}
            >
              Cerrar
            </Button>
            
            {selectedCita && (
              <Link href={`/paciente/${selectedCita.patientId}?tab=evoluciones`}>
                <Button className="bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl font-bold text-xs h-10 px-5 shadow-md shadow-[#008bcd]/20 cursor-pointer">
                  <Stethoscope className="w-3.5 h-3.5 mr-1.5" /> Ir a Ficha Clínica
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}