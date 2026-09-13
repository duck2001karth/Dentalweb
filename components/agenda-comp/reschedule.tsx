"use client"

import React, { useState, useEffect, useMemo } from "react"
import { format, subDays, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { 
  RefreshCw, Clock, User, Loader2, Search, CheckCircle2, 
  CreditCard, AlignLeft, CalendarIcon, MapPin 
} from "lucide-react"
import { useSession } from "next-auth/react"

import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogDescription 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRescheduleAppointment } from "@/hooks/appointments"
import { cn } from "@/lib/utils"

import { useClinicSettings } from "@/config/clinic-settings"

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  selectedAppointment?: any
  onSuccessCallback?: () => void
}

export function RescheduleModal({ 
  isOpen, 
  onClose, 
  selectedAppointment, 
  onSuccessCallback 
}: RescheduleModalProps) {
  const { data: session } = useSession()
  const currentUser = session?.user as any
  const defaultUserColor = currentUser?.calendarColor || "#008bcd"

  const { toast } = useToast()
  const { rescheduleAppointment: reschedule, isLoading: isPending } = useRescheduleAppointment()
  const { settings } = useClinicSettings()

  const [targetAppointment, setTargetAppointment] = useState<any>(null)
  
  const [newDateObj, setNewDateObj] = useState<Date | undefined>(undefined)
  const [newTime, setNewTime] = useState("")
  const [duration, setDuration] = useState("30")
  const [selectedBox, setSelectedBox] = useState("")
  
  const [reasonCategory, setReasonCategory] = useState("PATIENT_REQUEST")
  const [customReasonNote, setCustomReasonNote] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [appointmentsList, setAppointmentsList] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const availableBoxes = settings?.availableBoxes && settings.availableBoxes.length > 0 
    ? settings.availableBoxes 
    : ["Box 1 (Principal)", "Box 2 (Ortodoncia)", "Box 3 (Cirugía)"]
  const activeColor = useMemo(() => {
    if (targetAppointment?.doctor?.calendarColor) {
      return targetAppointment.doctor.calendarColor
    }
    return defaultUserColor
  }, [targetAppointment, defaultUserColor])

  const calculateEndTime = (startTime: string, durationMinutes: string) => {
    if (!startTime) return ""
    const [hours, minutes] = startTime.split(":").map(Number)
    const date = new Date()
    date.setHours(hours, minutes + Number(durationMinutes), 0)
    
    const endHours = String(date.getHours()).padStart(2, "0")
    const endMinutes = String(date.getMinutes()).padStart(2, "0")
    return `${endHours}:${endMinutes}`
  }

  useEffect(() => {
    if (selectedAppointment) {
      setTargetAppointment(selectedAppointment)
      if (selectedAppointment.startTime) setNewTime(selectedAppointment.startTime)
      if (selectedAppointment.date) setNewDateObj(new Date(selectedAppointment.date))
      setSelectedBox(selectedAppointment.box || availableBoxes[0] || "Box 1")
    } else {
      setTargetAppointment(null)
      setSelectedBox(availableBoxes[0] || "Box 1")
    }
  }, [selectedAppointment, isOpen, availableBoxes])

  useEffect(() => {
    if (isOpen && !selectedAppointment) {
      const fetchActiveAppointments = async () => {
        setIsSearching(true)
        try {
          const res = await fetch("/api/citas?statuses=SCHEDULED,WAITING,NO_SHOW")
          if (res.ok) {
            const data = await res.json()
            setAppointmentsList(data.citas || data || [])
          }
        } catch (e) {
          console.error("Error al cargar citas:", e)
        } finally {
          setIsSearching(false)
        }
      }
      fetchActiveAppointments()
    }
  }, [isOpen, selectedAppointment])

  const fifteenDaysAgo = startOfDay(subDays(new Date(), 15))
  
  const filteredAppointments = appointmentsList
    .filter((app: any) => {
      const appDate = new Date(app.date || Date.now())
      const isWithinWindow = appDate >= fifteenDaysAgo
      
      const patientName = `${app.patient?.firstName || ''} ${app.patient?.lastName || ''}`.toLowerCase()
      const ci = app.patient?.ci || app.patient?.documentNumber || ""
      
      return isWithinWindow && (patientName.includes(searchTerm.toLowerCase()) || ci.includes(searchTerm))
    })
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleClose = () => {
    setNewDateObj(undefined)
    setNewTime("")
    setDuration("30")
    setSelectedBox("")
    setSearchTerm("")
    setReasonCategory("PATIENT_REQUEST")
    setCustomReasonNote("")
    setTargetAppointment(null)
    onClose()
  }

  const handleSubmit = () => {
    if (!targetAppointment?.id) {
      toast({ 
        title: "Seleccione una cita", 
        description: "Debe elegir una cita para reprogramar.", 
        variant: "destructive" 
      })
      return
    }

    if (!newDateObj || !newTime?.trim()) {
      toast({ 
        title: "Campos obligatorios incompletos", 
        description: "Por favor seleccione la nueva fecha y la hora de inicio.", 
        variant: "destructive" 
      })
      return
    }

    if (reasonCategory === "CUSTOM" && !customReasonNote.trim()) {
      toast({ 
        title: "Detalle requerido", 
        description: "Escriba la observación técnica de la reprogramación.", 
        variant: "destructive" 
      })
      return
    }

    const computedEndTime = calculateEndTime(newTime, duration)
    const formattedDate = format(newDateObj, "yyyy-MM-dd")
    
    const finalReason = reasonCategory === "CUSTOM" 
      ? customReasonNote.trim() 
      : customReasonNote.trim() 
        ? `${reasonCategory} — ${customReasonNote.trim()}`
        : reasonCategory

    reschedule({
      appointmentId: targetAppointment.id,
      newDate: formattedDate,
      newTime,
      endTime: computedEndTime,
      box: selectedBox || targetAppointment.box || availableBoxes[0],
      reason: finalReason,
      sendWhatsapp: false,
    }, {
      onSuccess: () => {
        toast({
          title: "Cita Reprogramada",
          description: `Nueva cita asignada de ${newTime} a ${computedEndTime} hs.`,
        })
        if (onSuccessCallback) onSuccessCallback()
        handleClose()
      },
      onError: (err: any) => {
        toast({
          title: "Error al reprogramar",
          description: err?.message || "No se pudo actualizar el horario de la cita.",
          variant: "destructive"
        })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[760px] bg-card border border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden">
        
        {/* ENCABEZADO CON COLOR DINÁMICO */}
        <DialogHeader 
          className="px-6 py-4 border-b border-border/80 transition-all duration-300"
          style={{
            background: `linear-gradient(to right, ${activeColor}18, transparent)`,
          }}
        >
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2.5">
            <div 
              className="p-2 border rounded-xl shrink-0 transition-colors"
              style={{
                backgroundColor: `${activeColor}18`,
                borderColor: `${activeColor}35`,
                color: activeColor,
              }}
            >
              <RefreshCw className="w-5 h-5" />
            </div>
            Reprogramación de Cita
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-semibold mt-1">
            Seleccione el paciente por C.I. o Nombre y configure el nuevo horario y sillón de atención.
          </DialogDescription>
        </DialogHeader>

        {/* CONTENIDO GRID */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUMNA IZQUIERDA: BÚSQUEDA HASTA 15 DÍAS ATRÁS */}
          <div className="space-y-4">
            {!selectedAppointment && (
              <div className="space-y-2">
                <Label 
                  style={{ color: activeColor }}
                  className="text-[11px] font-black uppercase tracking-widest block transition-colors"
                >
                  1. Buscar Cita del Paciente <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por C.I. o Nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background border-border/80 h-10 rounded-xl text-xs font-semibold shadow-xs"
                  />
                </div>

                {searchTerm.trim() !== "" && (
                  <div className="max-h-[170px] overflow-y-auto border border-border/80 rounded-xl divide-y divide-border/60 bg-background shadow-xl custom-scrollbar mt-1">
                    {isSearching ? (
                      <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: activeColor }} /> Buscando citas recientes...
                      </div>
                    ) : filteredAppointments.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground font-medium">
                        No hay citas (últimos 15 días o futuras) para este paciente.
                      </div>
                    ) : (
                      filteredAppointments.map((app: any) => {
                        const patientCI = app.patient?.ci || app.patient?.documentNumber || "Sin C.I."
                        const isSelected = targetAppointment?.id === app.id

                        return (
                          <div
                            key={app.id}
                            onClick={() => {
                              setTargetAppointment(app)
                              if (app.startTime) setNewTime(app.startTime)
                              if (app.date) setNewDateObj(new Date(app.date))
                              if (app.box) setSelectedBox(app.box)
                              setSearchTerm("")
                            }}
                            style={{
                              backgroundColor: isSelected ? `${activeColor}15` : undefined,
                              borderLeftColor: isSelected ? activeColor : undefined,
                            }}
                            className={cn(
                              "p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors",
                              isSelected ? "border-l-4 font-bold" : "hover:bg-accent/60"
                            )}
                          >
                            <div className="space-y-0.5">
                              <p className="font-bold text-foreground">
                                {app.patient?.firstName} {app.patient?.lastName}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                                <span className="font-bold" style={{ color: activeColor }}>C.I.: {patientCI}</span>
                                <span>•</span>
                                <span>{format(new Date(app.date || Date.now()), "dd/MM/yyyy")} ({app.startTime || "10:00"} hs)</span>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: activeColor }} />
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TARJETA PACIENTE CONFIRMADO */}
            {targetAppointment ? (
              <div 
                className="p-4 rounded-2xl border space-y-2 animate-in fade-in duration-200"
                style={{
                  backgroundColor: `${activeColor}12`,
                  borderColor: `${activeColor}30`,
                }}
              >
                <div 
                  className="flex items-center justify-between border-b pb-2"
                  style={{ borderBottomColor: `${activeColor}25` }}
                >
                  <span 
                    className="text-[10px] font-black uppercase tracking-wider"
                    style={{ color: activeColor }}
                  >
                    Paciente Confirmado
                  </span>
                  <span 
                    className="px-2 py-0.5 rounded-md font-black text-[10px] flex items-center gap-1 border"
                    style={{
                      backgroundColor: `${activeColor}18`,
                      color: activeColor,
                      borderColor: `${activeColor}30`,
                    }}
                  >
                    <CreditCard className="w-3 h-3" />
                    C.I.: {targetAppointment.patient?.ci || targetAppointment.patient?.documentNumber || "N/A"}
                  </span>
                </div>

                <p className="text-sm font-extrabold text-foreground flex items-center gap-2 pt-0.5">
                  <User className="w-4 h-4 shrink-0" style={{ color: activeColor }} />
                  {targetAppointment.patient?.firstName || targetAppointment.patientName} {targetAppointment.patient?.lastName || ''}
                </p>

                <p 
                  className="text-xs text-muted-foreground font-medium flex items-center gap-2 pt-1 border-t"
                  style={{ borderTopColor: `${activeColor}20` }}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 
                  Cita previa: <b className="text-foreground">{format(new Date(targetAppointment.date || Date.now()), "dd 'de' MMMM yyyy", { locale: es })} ({targetAppointment.startTime || "10:00"} hs)</b>
                </p>
              </div>
            ) : (
              <div className="border border-dashed border-border/80 rounded-2xl p-5 text-center text-xs text-muted-foreground bg-muted/20 font-medium">
                Seleccione la cita previa (incluye hasta 15 días atrás) para habilitar la reprogramación.
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: CAMPOS DE REPROGRAMACIÓN */}
          <div className="space-y-4 md:border-l md:border-border/80 md:pl-6">
            <Label 
              style={{ color: activeColor }}
              className="text-[11px] font-black uppercase tracking-widest block transition-colors"
            >
              2. Nuevo Horario, Box y Detalle
            </Label>
            
            {/* NUEVA FECHA (OBLIGATORIA) */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" style={{ color: activeColor }} /> 
                Nueva Fecha <span className="text-destructive font-black">*</span>
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-full justify-start text-left font-semibold bg-background border-border/80 hover:bg-muted/50 h-10 rounded-xl text-xs text-foreground shadow-xs cursor-pointer",
                      !newDateObj && "text-muted-foreground"
                    )}
                  >
                    {newDateObj ? format(newDateObj, "EEEE, d 'de' MMMM yyyy", { locale: es }) : <span>Seleccionar nueva fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[120] rounded-2xl shadow-xl border-border/80" align="start">
                  <div 
                    style={{ "--calendar-accent": activeColor } as React.CSSProperties}
                    className="[&_.rdp-day_selected]:bg-[var(--calendar-accent)] [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:opacity-90"
                  >
                    <Calendar 
                      mode="single" 
                      selected={newDateObj} 
                      onSelect={setNewDateObj} 
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* HORA Y DURACIÓN (OBLIGATORIOS) */}
            <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded-xl border border-border/80">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">
                  Hora Inicio <span className="text-destructive font-black">*</span>
                </span>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-background border-border/80 h-9 rounded-lg text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">
                  Duración <span className="text-destructive font-black">*</span>
                </span>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-background border-border/80 h-9 text-xs font-bold rounded-lg">
                    <SelectValue placeholder="Duración" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/80 rounded-xl text-xs font-semibold">
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1.5 horas</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SILLÓN / BOX ASIGNADO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color: activeColor }} /> Sillón / Box Asignado
              </Label>
              <Select value={selectedBox} onValueChange={setSelectedBox}>
                <SelectTrigger className="bg-background border-border/80 h-10 text-xs font-semibold rounded-xl">
                  <SelectValue placeholder="Seleccione el Box..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/80 rounded-xl text-xs font-semibold">
                  {availableBoxes.map((boxName, index) => (
                    <SelectItem key={index} value={boxName} className="cursor-pointer">
                      {boxName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CATEGORÍA DEL MOTIVO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Categoría del Motivo <span className="text-destructive font-black">*</span>
              </Label>
              <Select value={reasonCategory} onValueChange={setReasonCategory}>
                <SelectTrigger className="bg-background border-border/80 h-10 text-xs font-semibold rounded-xl">
                  <SelectValue placeholder="Seleccione el motivo" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/80 rounded-xl text-xs font-semibold">
                  <SelectItem value="PATIENT_REQUEST">Solicitud / Petición del Paciente</SelectItem>
                  <SelectItem value="DOCTOR_UNAVAILABILITY">Ausencia / Emergencia Médica</SelectItem>
                  <SelectItem value="NO_SHOW">Reagendamiento por Inasistencia</SelectItem>
                  <SelectItem value="CLINIC_SCHEDULE_CHANGE">Ajuste de Turnos en Clínica</SelectItem>
                  <SelectItem value="CUSTOM">✏️ Otro motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DETALLE TÉCNICO SI ES PERSONALIZADO */}
            {reasonCategory === "CUSTOM" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label 
                  style={{ color: activeColor }}
                  className="text-xs font-bold flex items-center gap-1.5"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  Observación o Término Técnico <span className="text-destructive font-black">*</span>
                </Label>
                <Input
                  value={customReasonNote}
                  onChange={(e) => setCustomReasonNote(e.target.value)}
                  placeholder="Ej: Ajuste por tiempo de fraguado / Extensión..."
                  className="bg-background border-border/80 h-10 text-xs font-semibold rounded-xl shadow-xs"
                  required
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <DialogFooter className="px-6 py-4 border-t border-border/80 bg-muted/20 flex flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
            className="font-bold rounded-xl text-muted-foreground hover:bg-muted text-xs h-10 px-5 transition-colors cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !targetAppointment}
            style={{
              backgroundColor: activeColor,
              boxShadow: `0 8px 16px -4px ${activeColor}40`,
            }}
            className="text-white font-bold px-6 rounded-xl text-xs h-10 transition-all cursor-pointer active:scale-95 hover:opacity-90"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Guardar Reprogramación
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}