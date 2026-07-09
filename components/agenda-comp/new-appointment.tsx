"use client"

import { useState, useEffect, useRef } from "react"
import { format, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { 
  CalendarIcon, Clock, User, Plus, Stethoscope, 
  MapPin, AlignLeft, Loader2, Activity, Tags, CheckCircle2,
  Search
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

// =========================================================================
// 1. SUBCOMPONENTE: BUSCADOR INMUNE A BLOQUEOS (PATIENT SELECTOR)
// =========================================================================
interface PatientSelectorProps {
  patientId: string
  setPatientId: (id: string) => void
  patients: any[]
  isLoading: boolean
}

function PatientSelector({ patientId, setPatientId, patients, isLoading }: PatientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedPatient = patients?.find((p: any) => p.id === patientId)
  const filteredPatients = patients?.filter((p: any) => {
    const term = searchTerm.toLowerCase()
    return (
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.ci.includes(term)
    )
  }) || []

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-[#008bcd]/10 border border-[#008bcd]/30 rounded-xl h-11 shadow-sm animate-in fade-in duration-200">
        <div className="flex items-center gap-2 overflow-hidden">
          <CheckCircle2 className="w-4 h-4 text-[#008bcd] shrink-0" />
          <span className="font-bold text-[#008bcd] truncate">
            {selectedPatient.firstName} {selectedPatient.lastName}
          </span>
          <span className="text-[#008bcd]/70 font-semibold text-xs shrink-0 ml-1">
            (CI: {selectedPatient.ci})
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-[#008bcd] hover:bg-[#008bcd]/20 hover:text-[#008bcd] font-bold rounded-lg"
          onClick={() => {
            setPatientId("")
            setSearchTerm("")
          }}
        >
          Cambiar
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={isLoading ? "Cargando pacientes..." : "Escribe el nombre, apellido o CI..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          disabled={isLoading}
          className="pl-9 bg-background border-border h-11 focus-visible:ring-[#008bcd] text-foreground placeholder:text-muted-foreground font-medium shadow-sm transition-all"
        />
      </div>

      {isOpen && searchTerm.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1.5 bg-popover border border-border shadow-2xl rounded-xl z-[120] max-h-56 overflow-y-auto custom-scrollbar py-1 divide-y divide-border/40 animate-in fade-in slide-in-from-top-1 duration-150">
          {filteredPatients.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground font-medium">
              No se encontraron coincidencias para "{searchTerm}"
            </div>
          ) : (
            filteredPatients.map((patient: any) => (
              <div
                key={patient.id}
                className="flex flex-col px-4 py-2.5 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                onClick={() => {
                  setPatientId(patient.id)
                  setIsOpen(false)
                  setSearchTerm("")
                }}
              >
                <span className="font-bold text-sm text-foreground">
                  {patient.firstName} {patient.lastName}
                </span>
                <span className="text-muted-foreground font-semibold text-xs mt-0.5">
                  Cédula: {patient.ci}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// =========================================================================
// 2. UTILIDADES DE TIEMPO
// =========================================================================
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

// =========================================================================
// 3. COMPONENTE MAESTRO: DIÁLOGO DE AGENDAMIENTO
// =========================================================================
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

  const [status, setStatus] = useState<string>("SCHEDULED")
  const [situation, setSituation] = useState<string>("Primera Consulta")
  const [startTime, setStartTime] = useState(defaultStartTime || "09:00")
  const [endTime, setEndTime] = useState(addThirtyMins(defaultStartTime || "09:00"))
  
  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)

  const { patients, isLoading: isLoadingPatients } = useGetPatients()
  const { createAppointment, isLoading: isSaving } = useCreateAppointment()

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

  // Cargar personal médico si es Admin o Recepcionista
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
          <Button size="sm" className="bg-[#008bcd] hover:bg-[#0070a8] text-white shadow-sm font-semibold rounded-xl h-9">
            <Plus className="h-4 w-4 mr-1.5" /> Dar cita
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[850px] p-0 bg-background border-border overflow-hidden rounded-2xl shadow-2xl">
        
        {/* ENCABEZADO */}
        <div className="bg-gradient-to-r from-blue-500/10 via-transparent to-transparent px-6 py-5 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-3">
              <div className="p-2.5 bg-[#008bcd] text-white shadow-md rounded-xl shrink-0">
                <CalendarIcon className="w-6 h-6" />
              </div>
              Agendar Nueva Cita
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1 ml-14 font-medium">
              Registre los datos del paciente y situación clínica para la reserva.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* COLUMNA 1: INFORMACIÓN DEL PACIENTE */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#008bcd] border-b border-border pb-2">
                1. Información del Paciente
              </h3>
              
              <div className="space-y-2.5">
                <Label className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <User className="w-4 h-4 text-muted-foreground" /> Paciente
                </Label>
                <PatientSelector 
                  patientId={patientId} 
                  setPatientId={setPatientId} 
                  patients={patients} 
                  isLoading={isLoadingPatients} 
                />
              </div>

              <div className="space-y-2.5">
                <Label className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <Stethoscope className="w-4 h-4 text-muted-foreground" /> Especialista Asignado
                </Label>
                <Select value={doctorId} onValueChange={setDoctorId} disabled={isLoadingDoctors}>
                  <SelectTrigger className="bg-muted/30 border-border h-11 focus:ring-[#008bcd] font-medium text-sm text-foreground">
                    <SelectValue placeholder={isLoadingDoctors ? "Cargando especialistas..." : "Seleccione el especialista"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isAdminOrStaff ? (
                      doctorsList.length > 0 ? (
                        doctorsList.map(doc => (
                          <SelectItem key={doc.id} value={doc.id} className="font-medium text-sm">
                            👨‍⚕️ {doc.name} {doc.specialty ? `(${doc.specialty})` : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="empty" disabled>No hay médicos registrados</SelectItem>
                      )
                    ) : (
                      <SelectItem value={currentUser?.id || "doctor_default"} className="font-medium text-sm">
                        👨‍⚕️ {currentUser?.name || "Dr. Asignado"} (Tú)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Activity className="w-4 h-4 text-muted-foreground" /> Estado Inicial
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-muted/30 border-border h-11 focus:ring-[#008bcd] font-medium text-sm text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHEDULED"><span className="text-blue-600 dark:text-blue-400 font-bold text-sm">Agendada</span></SelectItem>
                      <SelectItem value="WAITING"><span className="text-amber-600 dark:text-amber-400 font-bold text-sm">En Espera</span></SelectItem>
                      <SelectItem value="IN_PROGRESS"><span className="text-purple-600 dark:text-purple-400 font-bold text-sm">En Box</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Tags className="w-4 h-4 text-muted-foreground" /> Situación
                  </Label>
                  <Select value={situation} onValueChange={setSituation}>
                    <SelectTrigger className="bg-muted/30 border-border h-11 focus:ring-[#008bcd] font-medium text-sm text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primera Consulta" className="text-sm font-medium">Primera Consulta</SelectItem>
                      <SelectItem value="Control Regular" className="text-sm font-medium">Control Regular</SelectItem>
                      <SelectItem value="Emergencia" className="text-sm font-medium">Emergencia</SelectItem>
                      <SelectItem value="Tratamiento" className="text-sm font-medium">Tratamiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* COLUMNA 2: PROGRAMACIÓN DE TIEMPO */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#008bcd] border-b border-border pb-2">
                2. Horario y Ubicación
              </h3>

              <div className="space-y-2.5">
                <Label className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" /> Fecha de la Cita
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-bold bg-muted/30 border-border hover:bg-muted h-11 rounded-xl text-sm text-foreground", !date && "text-muted-foreground")}>
                      {date ? format(date, "EEEE, d 'de' MMMM yyyy", { locale: es }) : <span>Elegir fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[120]" align="start">
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={setDate} 
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Clock className="w-4 h-4 text-[#008bcd]" /> Hora Inicio
                  </Label>
                  <Input 
                    type="time" 
                    value={startTime} 
                    onChange={handleStartTimeChange} 
                    min={date && isToday(date) ? format(new Date(), "HH:mm") : undefined} 
                    className="bg-background border-border h-11 text-foreground font-bold shadow-sm rounded-xl text-sm" 
                    required 
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Clock className="w-4 h-4 text-muted-foreground" /> Hora Fin
                  </Label>
                  <Input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    min={startTime} 
                    className="bg-background border-border h-11 text-foreground font-bold shadow-sm rounded-xl text-sm" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <MapPin className="w-4 h-4 text-muted-foreground" /> Box Dental
                  </Label>
                  <Select value={box} onValueChange={setBox}>
                    <SelectTrigger className="bg-muted/30 border-border h-11 font-medium text-sm text-foreground">
                      <SelectValue placeholder="Seleccionar Box..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Box 1" className="text-sm font-medium">Box 1 (General)</SelectItem>
                      <SelectItem value="Box 2" className="text-sm font-medium">Box 2 (Ortodoncia)</SelectItem>
                      <SelectItem value="Box 3" className="text-sm font-medium">Box 3 (Cirugía)</SelectItem>
                      <SelectItem value="Pabellon" className="text-sm font-medium">Pabellón Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <AlignLeft className="w-4 h-4 text-muted-foreground" /> Detalle Corto
                  </Label>
                  <Input 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="Ej: Limpieza..." 
                    className="bg-muted/30 border-border h-11 text-foreground font-medium rounded-xl text-sm" 
                    required 
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ACCIONES DEL FORMULARIO */}
          <div className="mt-8 pt-5 border-t border-border flex justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              className="hover:bg-muted text-muted-foreground font-bold rounded-xl h-10 px-5 text-sm" 
              onClick={() => setOpen(false)}
            >
              Cancelar Operación
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving} 
              className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold h-10 px-6 shadow-md rounded-xl text-sm transition-all"
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