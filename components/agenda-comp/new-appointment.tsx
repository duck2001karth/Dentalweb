"use client"

import { useState, useEffect } from "react"
import { format, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { 
  CalendarIcon, Clock, User, Plus, Stethoscope, 
  MapPin, AlignLeft, Loader2, Activity, Tags, CheckCircle2
} from "lucide-react"
import { useSession } from "next-auth/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useGetPatients } from "@/hooks/patients"
import { useCreateAppointment } from "@/hooks/appointments"
import { PatientSelector } from "./patient-selector" 
import { appointmentStatuses } from "@/constants/status"

interface NewAppointmentModalProps {
  customTrigger?: React.ReactNode
  defaultDate?: Date
  defaultStartTime?: string
  defaultDoctorId?: string
}

const addThirtyMins = (time: string) => {
  if (!time) return "09:30"
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m + 30, 0)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function NewAppointmentModal({ customTrigger, defaultDate, defaultStartTime, defaultDoctorId }: NewAppointmentModalProps) {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const currentUser = session?.user as any
  const isAdminOrStaff = currentUser?.role === "ADMIN" || currentUser?.role === "RECEPTIONIST"
  
  const [date, setDate] = useState<Date | undefined>(defaultDate || new Date())
  const [patientId, setPatientId] = useState<string>("")
  const [doctorId, setDoctorId] = useState<string>(defaultDoctorId || "")
  const [box, setBox] = useState<string>("Box 1")
  const [reason, setReason] = useState<string>("")

  const [status, setStatus] = useState<string>(appointmentStatuses.SCHEDULED.value)
  const [situation, setSituation] = useState<string>("Primera Consulta")
  const [startTime, setStartTime] = useState(defaultStartTime || "09:00")
  const [endTime, setEndTime] = useState(addThirtyMins(defaultStartTime || "09:00"))
  
  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)

  const { patients, isLoading: isLoadingPatients } = useGetPatients()
  const { createAppointment, isLoading: isSaving } = useCreateAppointment()

  // FILTRAR ESTADOS INICIALES CON ESTILOS SUAVES Y ELEGANTES
  const validInitialStatuses = [
    { ...appointmentStatuses.SCHEDULED, badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
    { ...appointmentStatuses.IN_WAITING_ROOM, badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    { ...appointmentStatuses.IN_PROGRESS, badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" }
  ]

  useEffect(() => {
    if (open) {
      if (defaultDate) setDate(defaultDate)
      
      if (defaultDoctorId) {
        setDoctorId(defaultDoctorId)
      } else if (currentUser?.id && !isAdminOrStaff) {
        setDoctorId(currentUser.id) 
      } else if (isAdminOrStaff) {
        setDoctorId("")
      }

      if ((!defaultDate || isToday(defaultDate)) && !defaultStartTime) {
        const nowTime = format(new Date(), "HH:mm")
        setStartTime(nowTime)
        setEndTime(addThirtyMins(nowTime))
      }
    }
  }, [open, defaultDate, defaultDoctorId, currentUser, isAdminOrStaff])

  useEffect(() => {
    if (open && isAdminOrStaff && doctorsList.length === 0) {
      setIsLoadingDoctors(true)
      fetch("/api/admin/users")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setDoctorsList(data.filter(u => u.role === "DOCTOR"))
          }
        })
        .catch(err => console.error("Error cargando doctores:", err))
        .finally(() => setIsLoadingDoctors(false))
    }
  }, [open, isAdminOrStaff, doctorsList.length])

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedTime = e.target.value
    if (date && isToday(date)) {
      const currentTime = format(new Date(), "HH:mm")
      if (selectedTime < currentTime) {
        toast({
          title: "Hora no válida",
          description: "No puedes agendar citas en un horario pasado.",
          variant: "destructive",
        })
        setStartTime(currentTime)
        setEndTime(addThirtyMins(currentTime))
        return
      }
    }
    setStartTime(selectedTime)
    setEndTime(addThirtyMins(selectedTime))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!patientId) return toast({ title: "Faltan datos", description: "Por favor, selecciona un paciente.", variant: "destructive" })
    if (!doctorId) return toast({ title: "Faltan datos", description: "Por favor, selecciona al especialista asignado.", variant: "destructive" })

    const newAppointment = {
      patientId,
      doctorId, 
      date: date ? date.toISOString() : new Date().toISOString(),
      startTime,
      endTime,
      box,
      reason,
      status, 
      situation 
    }

    try {
      await createAppointment(newAppointment)
      toast({
        title: "¡Cita Agendada!",
        description: `Reservada exitosamente para las ${startTime}.`,
        variant: "success",
      })
      setOpen(false) 
      setPatientId("")
      setReason("")
    } catch (error: any) {
      toast({ title: "Error al agendar", description: error.message || "Hubo un problema de conexión.", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? customTrigger : (
          <Button 
            variant="ghost" 
            className="flex-1 md:flex-none bg-transparent border border-border/80 text-foreground hover:text-[#008bcd] hover:bg-[#008bcd]/10 hover:border-[#008bcd]/30 font-bold text-sm h-11 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-none group"
          >
            <Plus className="h-5 w-5 mr-1.5 text-muted-foreground group-hover:text-[#008bcd] transition-colors stroke-[2.5]" />
            <span>Dar cita</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[850px] p-0 bg-card border-border/80 overflow-hidden rounded-2xl shadow-2xl">
        
        {/* CABECERA DEL MODAL */}
        <div className="bg-gradient-to-r from-[#008bcd]/10 via-transparent to-transparent px-6 py-5 border-b border-border/80">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-3">
              <div className="p-2.5 bg-[#008bcd]/15 border border-[#008bcd]/30 text-[#008bcd] shadow-xs rounded-xl shrink-0">
                <CalendarIcon className="w-6 h-6" />
              </div>
              Agendar Nueva Cita
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-semibold mt-1 ml-14">
              Registre los datos del paciente y la situación clínica para la reserva.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* SECCIÓN 1: DATOS DEL PACIENTE */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#008bcd] border-b border-border/80 pb-2">
                1. Información del Paciente
              </h3>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground font-bold text-xs">
                  <User className="w-4 h-4 text-muted-foreground" /> Paciente
                </Label>
                <PatientSelector 
                  patientId={patientId} 
                  setPatientId={setPatientId} 
                  patients={patients} 
                  isLoading={isLoadingPatients} 
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground font-bold text-xs">
                  <Stethoscope className="w-4 h-4 text-muted-foreground" /> Especialista Asignado
                </Label>
                <Select value={doctorId} onValueChange={setDoctorId} disabled={isLoadingDoctors}>
                  <SelectTrigger className="bg-background border-border/80 h-11 focus:ring-[#008bcd] font-semibold text-xs text-foreground rounded-xl">
                    <SelectValue placeholder={isLoadingDoctors ? "Cargando especialistas..." : "Seleccione el especialista"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/80 shadow-xl">
                    {isAdminOrStaff ? (
                      doctorsList.length > 0 ? (
                        doctorsList.map(doc => (
                          <SelectItem key={doc.id} value={doc.id} className="font-semibold text-xs">
                            👨‍⚕️ {doc.name} {doc.specialty ? `(${doc.specialty})` : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="empty" disabled className="text-xs">No hay médicos registrados</SelectItem>
                      )
                    ) : (
                      <SelectItem value={currentUser?.id || "doctor_default"} className="font-semibold text-xs">
                        👨‍⚕️ {currentUser?.name || "Dr. Asignado"} (Tú)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* ESTADO INICIAL REFORMADO CON COLORES SUAVES */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground font-bold text-xs">
                    <Activity className="w-4 h-4 text-muted-foreground" /> Estado Inicial
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-background border-border/80 h-11 focus:ring-[#008bcd] font-semibold text-xs text-foreground rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/80 shadow-xl p-1">
                      {validInitialStatuses.map((s) => {
                        const Icon = s.icon;
                        return (
                          <SelectItem key={s.value} value={s.value} className="rounded-lg my-0.5 cursor-pointer">
                            <div className="flex items-center gap-2 py-0.5">
                              <Icon className="w-4 h-4 text-[#008bcd]" />
                              <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider border", s.badgeClass)}>
                                {s.label}
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground font-bold text-xs">
                    <Tags className="w-4 h-4 text-muted-foreground" /> Situación
                  </Label>
                  <Select value={situation} onValueChange={setSituation}>
                    <SelectTrigger className="bg-background border-border/80 h-11 focus:ring-[#008bcd] font-semibold text-xs text-foreground rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/80 shadow-xl">
                      <SelectItem value="Primera Consulta" className="text-xs font-semibold">Primera Consulta</SelectItem>
                      <SelectItem value="Control Regular" className="text-xs font-semibold">Control Regular</SelectItem>
                      <SelectItem value="Emergencia" className="text-xs font-semibold">Emergencia</SelectItem>
                      <SelectItem value="Tratamiento" className="text-xs font-semibold">Tratamiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: HORARIO Y UBICACIÓN */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#008bcd] border-b border-border/80 pb-2">
                2. Horario y Ubicación
              </h3>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-foreground font-bold text-xs">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" /> Fecha de la Cita
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-bold bg-background border-border/80 hover:bg-muted/50 h-11 rounded-xl text-xs text-foreground shadow-xs", !date && "text-muted-foreground")}>
                      {date ? format(date, "EEEE, d 'de' MMMM yyyy", { locale: es }) : <span>Elegir fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[120] rounded-2xl shadow-xl border-border/80" align="start">
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={setDate} 
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3.5 bg-muted/20 p-3.5 rounded-xl border border-border/80">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground font-bold text-xs">
                    <Clock className="w-4 h-4 text-[#008bcd]" /> Hora Inicio
                  </Label>
                  <Input 
                    type="time" 
                    value={startTime} 
                    onChange={handleStartTimeChange} 
                    min={date && isToday(date) ? format(new Date(), "HH:mm") : undefined} 
                    className="bg-background border-border/80 h-10 text-foreground font-bold rounded-lg text-xs shadow-xs" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground font-bold text-xs">
                    <Clock className="w-4 h-4 text-muted-foreground" /> Hora Fin
                  </Label>
                  <Input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    min={startTime} 
                    className="bg-background border-border/80 h-10 text-foreground font-bold rounded-lg text-xs shadow-xs" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground font-bold text-xs">
                    <MapPin className="w-4 h-4 text-muted-foreground" /> Box Dental
                  </Label>
                  <Select value={box} onValueChange={setBox}>
                    <SelectTrigger className="bg-background border-border/80 h-11 font-semibold text-xs text-foreground rounded-xl">
                      <SelectValue placeholder="Seleccionar Box..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/80 shadow-xl">
                      <SelectItem value="Box 1" className="text-xs font-semibold">Box 1 (General)</SelectItem>
                      <SelectItem value="Box 2" className="text-xs font-semibold">Box 2 (Ortodoncia)</SelectItem>
                      <SelectItem value="Box 3" className="text-xs font-semibold">Box 3 (Cirugía)</SelectItem>
                      <SelectItem value="Pabellon" className="text-xs font-semibold">Pabellón Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground font-bold text-xs">
                    <AlignLeft className="w-4 h-4 text-muted-foreground" /> Detalle Corto
                  </Label>
                  <Input 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="Ej: Limpieza..." 
                    className="bg-background border-border/80 h-11 text-foreground font-semibold rounded-xl text-xs shadow-xs" 
                    required 
                  />
                </div>
              </div>

            </div>
          </div>

          {/* BOTONES DE ACCIÓN DEL MODAL */}
          <div className="pt-4 border-t border-border/80 flex justify-end items-center gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              className="hover:bg-muted text-muted-foreground font-bold rounded-xl h-10 px-5 text-xs transition-colors" 
              onClick={() => setOpen(false)}
            >
              Cancelar Operación
            </Button>

            <Button 
              type="submit" 
              disabled={isSaving} 
              className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold h-10 px-6 shadow-md shadow-[#008bcd]/20 rounded-xl text-xs transition-all duration-200 cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando en sistema...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2"/> Confirmar Cita</>
              )}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}