"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  RefreshCw, Clock, User, MessageSquare, Loader2, Search, CheckCircle2 
} from "lucide-react"

import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogDescription 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useRescheduleAppointment } from "@/hooks/appointments"

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
  const { toast } = useToast()
  const { rescheduleAppointment: reschedule, isLoading: isPending } = useRescheduleAppointment()
  const [targetAppointment, setTargetAppointment] = useState<any>(null)
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [duration, setDuration] = useState("30")
  const [reason, setReason] = useState("PATIENT_REQUEST")
  const [sendWhatsapp, setSendWhatsapp] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [appointmentsList, setAppointmentsList] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

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
      if (selectedAppointment.startTime) {
        setNewTime(selectedAppointment.startTime)
      }
    } else {
      setTargetAppointment(null)
    }
  }, [selectedAppointment, isOpen])

  useEffect(() => {
    if (isOpen && !selectedAppointment) {
      const fetchActiveAppointments = async () => {
        setIsSearching(true)
        try {
          const res = await fetch("/api/citas?statuses=SCHEDULED")
          if (res.ok) {
            const data = await res.json()
            setAppointmentsList(data.citas || data || [])
          }
        } catch (e) {
          console.error("Error al cargar citas activas:", e)
        } finally {
          setIsSearching(false)
        }
      }
      fetchActiveAppointments()
    }
  }, [isOpen, selectedAppointment])

  const filteredAppointments = appointmentsList.filter((app: any) => {
    const patientName = `${app.patient?.firstName || ''} ${app.patient?.lastName || ''}`.toLowerCase()
    const ci = app.patient?.ci || ""
    return patientName.includes(searchTerm.toLowerCase()) || ci.includes(searchTerm)
  })

  const handleClose = () => {
    setNewDate("")
    setNewTime("")
    setDuration("30")
    setSearchTerm("")
    setTargetAppointment(null)
    onClose()
  }

  const handleSubmit = () => {
    if (!targetAppointment?.id) {
      toast({ 
        title: "Seleccione una cita", 
        description: "Debe elegir una cita activa para reprogramar.", 
        variant: "destructive" 
      })
      return
    }

    if (!newDate || !newTime) {
      toast({ 
        title: "Campos requeridos", 
        description: "Por favor seleccione la nueva fecha y hora de inicio.", 
        variant: "destructive" 
      })
      return
    }

    const computedEndTime = calculateEndTime(newTime, duration)

    reschedule({
      appointmentId: targetAppointment.id,
      newDate,
      newTime,
      endTime: computedEndTime,
      reason,
      sendWhatsapp,
    }, {
      onSuccess: () => {
        toast({
          title: "Cita Reprogramada",
          description: `Nueva cita asignada de ${newTime} a ${computedEndTime} hs el ${format(new Date(newDate), "dd 'de' MMMM", { locale: es })}.`,
          variant: "success"
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
      <DialogContent className="sm:max-w-[720px] bg-card border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
        
        {/* CABECERA */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-slate-50 dark:bg-muted/30">
          <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2.5">
            <div className="p-2 bg-[#008bcd]/10 text-[#008bcd] rounded-xl shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            Reprogramación Rápida
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Seleccione la fecha, hora de inicio y duración estimada del turno.
          </DialogDescription>
        </DialogHeader>

        {/* CONTENIDO HORIZONTAL (GRID DE 2 COLUMNAS) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUMNA IZQUIERDA: BÚSQUEDA Y CITA ACTUAL */}
          <div className="space-y-4">
            {!selectedAppointment && (
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                  1. Buscar Cita del Paciente
                </Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o C.I..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background border-border h-10 rounded-xl text-xs font-semibold focus-visible:ring-[#008bcd]"
                  />
                </div>

                {searchTerm.trim() !== "" && (
                  <div className="max-h-[160px] overflow-y-auto border border-border rounded-xl divide-y divide-border/60 bg-background/80 shadow-md custom-scrollbar mt-1">
                    {isSearching ? (
                      <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#008bcd]" /> Buscando...
                      </div>
                    ) : filteredAppointments.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        No hay coincidencias de citas programadas.
                      </div>
                    ) : (
                      filteredAppointments.map((app: any) => (
                        <div
                          key={app.id}
                          onClick={() => {
                            setTargetAppointment(app)
                            if (app.startTime) setNewTime(app.startTime)
                            setSearchTerm("")
                          }}
                          className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            targetAppointment?.id === app.id 
                              ? "bg-[#008bcd]/15 border-l-4 border-l-[#008bcd]" 
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div>
                            <p className="font-extrabold text-foreground">
                              {app.patient?.firstName} {app.patient?.lastName}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {format(new Date(app.date || Date.now()), "dd/MM/yyyy")} — {app.startTime || "10:00"} hs
                            </p>
                          </div>
                          {targetAppointment?.id === app.id && (
                            <CheckCircle2 className="w-4 h-4 text-[#008bcd] shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TARJETA RESUMEN DE CITA SELECCIONADA */}
            {targetAppointment ? (
              <div className="bg-[#008bcd]/10 p-3.5 rounded-xl border border-[#008bcd]/30 space-y-1.5 animate-in fade-in duration-200">
                <p className="text-xs font-extrabold text-[#008bcd] flex items-center gap-1.5">
                  <User className="w-4 h-4 shrink-0" /> Paciente: {targetAppointment.patient?.firstName || targetAppointment.patientName} {targetAppointment.patient?.lastName || ''}
                </p>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 pt-1 border-t border-[#008bcd]/20">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Cita Actual: <b className="text-foreground">{format(new Date(targetAppointment.date || Date.now()), "dd 'de' MMMM", { locale: es })} ({targetAppointment.startTime || "10:00"} - {targetAppointment.endTime || "10:30"})</b>
                </p>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground bg-muted/20">
                Escriba el nombre o C.I del paciente para seleccionar su cita activa.
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: NUEVO HORARIO Y DURACIÓN */}
          <div className="space-y-4 md:border-l md:border-border/60 md:pl-6">
            <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider block">
              2. Asignar Nuevo Horario
            </Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground">Fecha *</span>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="bg-background border-border h-10 rounded-xl text-xs font-semibold focus-visible:ring-[#008bcd]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground">Hora Inicio *</span>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-background border-border h-10 rounded-xl text-xs font-semibold focus-visible:ring-[#008bcd]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground">Duración *</span>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-background border-border h-10 text-xs font-semibold rounded-xl focus:ring-[#008bcd]">
                    <SelectValue placeholder="Duración" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-xl text-xs">
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

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                Motivo de la Reprogramación
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="bg-background border-border h-10 text-xs font-semibold rounded-xl focus:ring-[#008bcd]">
                  <SelectValue placeholder="Seleccione el motivo" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-xl text-xs">
                  <SelectItem value="PATIENT_REQUEST">Solicitud / Petición del Paciente</SelectItem>
                  <SelectItem value="DOCTOR_UNAVAILABILITY">Ausencia / Emergencia Médica</SelectItem>
                  <SelectItem value="NO_SHOW">Reagendamiento por Inasistencia</SelectItem>
                  <SelectItem value="CLINIC_SCHEDULE_CHANGE">Ajuste de Turnos en Clínica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="whatsapp-reschedule"
                checked={sendWhatsapp}
                onCheckedChange={(v) => setSendWhatsapp(!!v)}
              />
              <label 
                htmlFor="whatsapp-reschedule" 
                className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 
                Notificar fecha por WhatsApp
              </label>
            </div>
          </div>

        </div>

        {/* PIE DE PÁGINA */}
        <DialogFooter className="px-6 py-3.5 border-t border-border bg-slate-50/50 dark:bg-muted/20 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="font-bold rounded-xl border-border text-xs h-9 px-4"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !targetAppointment}
            className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold px-5 shadow-md rounded-xl text-xs h-9 transition-all"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
            Guardar Reprogramación
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}