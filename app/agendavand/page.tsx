"use client"

import { useState, useMemo, useEffect } from "react"
import { format, addDays, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react" 

import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

import { NewAppointmentModal } from "@/components/agenda-comp/new-appointment"
import { useGetAppointments } from "@/hooks/appointments" 
import { cn } from "@/lib/utils"

const HORARIOS = Array.from({ length: 21 }).map((_, i) => {
  const hora = Math.floor(i / 2) + 8
  const minutos = i % 2 === 0 ? "00" : "30"
  return `${hora.toString().padStart(2, "0")}:${minutos}`
})

export default function AgendaAvanzadaPage() {
  const [date, setDate] = useState<Date>(new Date())
  const { data: session } = useSession()
  const { appointments, isLoading } = useGetAppointments({ fecha: date })
  
  const [selectedCita, setSelectedCita] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [doctoresDeLaClinica, setDoctoresDeLaClinica] = useState<any[]>([])
  const [isLoadingDoctores, setIsLoadingDoctores] = useState(false)

  const diaAnterior = () => setDate(subDays(date, 1))
  const diaSiguiente = () => setDate(addDays(date, 1))
  const hoy = () => setDate(new Date())

  // --- REGLAS DE VISIBILIDAD POR ROL ---
  const currentUser = session?.user as any
  const isGlobalStaff = currentUser?.role === "ADMIN" || currentUser?.role === "RECEPTIONIST"

  // Cargar todos los doctores si es Admin o Recepcionista
  useEffect(() => {
    if (isGlobalStaff) {
      setIsLoadingDoctores(true)
      fetch("/api/admin/users") // Asumiendo que tienes este endpoint
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const soloDoctores = data.filter(u => u.role === "DOCTOR").map(d => ({
              id: d.id,
              name: d.name,
              especialidad: d.specialty || "Odontología"
            }))
            setDoctoresDeLaClinica(soloDoctores)
          }
        })
        .catch(err => console.error("Error cargando doctores:", err))
        .finally(() => setIsLoadingDoctores(false))
    }
  }, [isGlobalStaff])

  const DOCTORES = useMemo(() => {
    if (isGlobalStaff && doctoresDeLaClinica.length > 0) {
      return doctoresDeLaClinica;
    }
    return [
      { 
        id: currentUser?.id || "doctor_default", 
        name: currentUser?.name ? `${currentUser.name} (Tú)` : "Dr. (Tú)", 
        especialidad: currentUser?.specialty || "Odontología General" 
      }
    ]
  }, [isGlobalStaff, doctoresDeLaClinica, currentUser]);

  // --- LÓGICA DE EXPANSIÓN DE CUADROS (RowSpan) ---
  const gridMap = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    
    // Inicializar mapa vacío con los doctores visibles
    HORARIOS.forEach(h => {
       map[h] = {};
       DOCTORES.forEach(d => { map[h][d.id] = { type: 'empty' }; })
    });

    if (!appointments) return map;

    appointments.forEach(cita => {
       const docId = cita.doctorId || currentUser?.id || "doctor_default";
      
       if (!DOCTORES.some(d => d.id === docId)) return;

       const start = cita.startTime; 
       const end = cita.endTime;     

       if(!start || !end || !map[start]) return;

       const startMins = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
       const endMins = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
       
       const span = Math.max(1, Math.ceil((endMins - startMins) / 30));

       if (map[start] && map[start][docId]) {
           map[start][docId] = { type: 'start', rowSpan: span, cita };

           for (let i = 1; i < span; i++) {
               const skipMins = startMins + (i * 30);
               const skipH = Math.floor(skipMins / 60).toString().padStart(2, '0');
               const skipM = (skipMins % 60).toString().padStart(2, '0');
               const skipTime = `${skipH}:${skipM}`;
               if (map[skipTime] && map[skipTime][docId]) {
                   map[skipTime][docId] = { type: 'skip' };
               }
           }
       }
    });

    return map;
  }, [appointments, DOCTORES, currentUser]);

  const handleCitaClick = (cita: any) => {
    setSelectedCita(cita);
    setIsViewModalOpen(true);
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-[1600px] mx-auto p-4 md:p-6">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-card p-4 rounded-xl shadow-sm border border-border mb-4 gap-4 shrink-0 text-card-foreground">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground mr-4">
              {isGlobalStaff ? "Agenda Global" : "Mi Agenda"}
            </h1>
            
            <Button variant="outline" size="icon" className="bg-background text-foreground hover:bg-accent border-border rounded-xl" onClick={diaAnterior}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[240px] font-bold bg-background text-foreground hover:bg-accent border-border rounded-xl">
                  <CalendarIcon className="mr-2 h-4 w-4 text-[#008bcd] dark:text-blue-400" />
                  {format(date, "EEEE, d 'de' MMMM yyyy", { locale: es }).toUpperCase()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border-border">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" className="bg-background text-foreground hover:bg-accent border-border rounded-xl" onClick={diaSiguiente}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="ghost" onClick={hoy} className="text-[#008bcd] dark:text-blue-400 hover:text-blue-500 font-bold ml-2 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl">
              Ir a Hoy
            </Button>

            {(isLoading || isLoadingDoctores) && <Loader2 className="h-5 w-5 animate-spin text-[#008bcd] ml-4" />}
          </div>

          <div className="flex items-center gap-2">
            <NewAppointmentModal defaultDate={date} />
          </div>
        </div>
        
        {/* GRILLA DE AGENDA */}
        <div className="flex-1 overflow-hidden bg-card rounded-2xl shadow-sm border border-border flex flex-col text-card-foreground">
          <div className="overflow-auto flex-1 relative custom-scrollbar">
            <table className="w-full border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-20 shadow-sm border-b border-border">
                <tr>
                  <th className="border-b border-r border-border p-3 w-24 text-center text-sm font-semibold text-muted-foreground bg-muted/50 sticky left-0 z-30">
                    Hora
                  </th>
                  {DOCTORES.map(doc => (
                    <th key={doc.id} className="border-b border-r border-border p-3 text-center bg-card/80 backdrop-blur-sm min-w-[220px]">
                      <div className="font-bold text-[#008bcd] dark:text-blue-400 text-sm">👨‍⚕️ {doc.name}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">{doc.especialidad}</div>
                    </th>
                  ))}
                  {/* Celda de relleno si solo hay 1 doctor (para que no quede estirado feo) */}
                  {DOCTORES.length === 1 && (
                     <th className="border-b border-r border-border p-3 text-center bg-card/80 backdrop-blur-sm w-full">
                       <span className="text-muted-foreground/30 text-xs italic font-medium">Agenda Personal</span>
                     </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {HORARIOS.map((hora) => (
                  <tr key={hora} className="hover:bg-muted/30 transition-colors">
                    <td className="border-b border-r border-border p-2 text-center text-sm font-bold text-muted-foreground bg-muted/40 sticky left-0 z-10 shadow-[1px_0_0_0_var(--border)] h-16">
                      {hora}
                    </td>
                    {DOCTORES.map(doc => {
                      const cellData = gridMap[hora][doc.id];
                      if (cellData.type === 'skip') {
                        return null; 
                      }
                      if (cellData.type === 'start') {
                        const cita = cellData.cita;
                        return (
                          <td 
                            key={`${hora}-${doc.id}`} 
                            rowSpan={cellData.rowSpan}
                            className="border-b border-r border-border p-1.5 relative transition-colors group"
                          >
                            <div 
                              onClick={() => handleCitaClick(cita)}
                              className={cn(
                                "w-full h-full min-h-[56px] border-l-4 p-2.5 flex flex-col justify-start rounded-r-xl shadow-sm hover:shadow-md transition-all cursor-pointer",
                                cita.status === "COMPLETED" ? "bg-emerald-500/10 border-emerald-500" :
                                cita.status === "IN_PROGRESS" ? "bg-purple-500/10 border-purple-500" :
                                cita.status === "WAITING" ? "bg-amber-500/10 border-amber-500" :
                                "bg-[#008bcd]/10 border-[#008bcd]"
                              )}
                            >
                              <span className="text-sm font-bold text-foreground leading-tight">
                                {cita.patient?.firstName} {cita.patient?.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground font-semibold mt-1">
                                {cita.startTime} - {cita.endTime} | {cita.box || "Box 1"}
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 mt-1 truncate">
                                {cita.reason || "Consulta"}
                              </span>
                            </div>
                          </td>
                        )
                      }

                      // ESPACIO VACÍO DISPONIBLE
                      return (
                        <td 
                          key={`${hora}-${doc.id}`} 
                          className="border-b border-r border-border p-1 relative h-16 transition-colors group"
                        >
                          <NewAppointmentModal 
                            defaultDate={date}
                            defaultStartTime={hora}
                            defaultDoctorId={doc.id}
                            customTrigger={
                              <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 bg-[#008bcd]/5 hover:bg-[#008bcd]/10 transition-all cursor-pointer rounded-xl">
                                <Plus className="h-6 w-6 text-[#008bcd]" />
                              </div>
                            }
                          />
                        </td>
                      )
                    })}
                    {DOCTORES.length === 1 && (
                       <td className="border-b border-border bg-card/10"></td>
                    )}
                  </tr>
                ))}
              </tbody>
              
            </table>
          </div>
        </div>

      </div>

      {/* --- MODAL PARA VER LOS DETALLES DE UNA CITA EXISTENTE --- */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#008bcd] dark:text-blue-400 flex items-center gap-2 border-b border-border pb-3">
              <CalendarIcon className="w-5 h-5" />
              Detalles de la Cita
            </DialogTitle>
          </DialogHeader>
          
          {selectedCita && (
            <div className="space-y-4 pt-2">
               <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-blue-500/10 text-[#008bcd] dark:text-blue-400 border border-blue-500/20 rounded-full flex items-center justify-center font-bold text-xl shadow-sm">
                   {selectedCita.patient?.firstName?.charAt(0)}{selectedCita.patient?.lastName?.charAt(0)}
                 </div>
                 <div>
                   <h4 className="font-bold text-foreground text-lg leading-tight">{selectedCita.patient?.firstName} {selectedCita.patient?.lastName}</h4>
                   <p className="text-sm text-muted-foreground font-medium">CI: {selectedCita.patient?.ci}</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 bg-muted/40 p-5 rounded-2xl border border-border mt-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Horario</p>
                    <p className="text-sm font-bold text-foreground">{selectedCita.startTime} - {selectedCita.endTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Doctor</p>
                    <p className="text-sm font-bold text-foreground">{selectedCita.doctor?.name || "Dr. Asignado"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Box/Sala</p>
                    <p className="text-sm font-bold text-foreground">{selectedCita.box || "Sin asignar"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Estado</p>
                    <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 w-fit px-2.5 py-1 rounded-md mt-0.5 uppercase tracking-wider">{selectedCita.status}</p>
                  </div>
                  <div className="col-span-2 pt-3 border-t border-border mt-1">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Motivo / Tratamiento</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{selectedCita.reason || "Consulta General"}</p>
                  </div>
               </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between mt-6">
            <Button variant="outline" className="bg-background border-border text-foreground hover:bg-accent rounded-xl font-bold" onClick={() => setIsViewModalOpen(false)}>Cerrar</Button>
            <Button className="bg-[#008bcd] hover:bg-[#0070a8] text-white border-none rounded-xl font-bold px-6">Ir a Ficha Clínica</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}