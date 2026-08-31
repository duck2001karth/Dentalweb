"use client"

import React, { useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  CalendarIcon, Clock, User, 
  MapPin, AlignLeft
} from "lucide-react"

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
  isAdminOrStaff: boolean
  currentUser: any
  validInitialStatuses: any[]
}

export function AppointmentForm({
  formData,
  setFormData,
  patients,
  doctorsList,
  isLoadingPatients,
  isLoadingDoctors,
  isAdminOrStaff,
  currentUser,
  validInitialStatuses
}: AppointmentFormProps) {
  const { settings, isLoading: isLoadingSettings } = useClinicSettings()

  const availableBoxes = settings?.availableBoxes && settings.availableBoxes.length > 0 
  ? settings.availableBoxes 
  : ["Box 1"]
  useEffect(() => {
  if (!formData.box && availableBoxes.length > 0) {
    setFormData((prev: any) => ({ ...prev, box: availableBoxes[0] }))
  }
}, [availableBoxes, formData.box, setFormData])

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedTime = e.target.value
    const [h, m] = selectedTime.split(':').map(Number)
    const d = new Date()
    d.setHours(h, m + 30, 0)
    const endTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    
    setFormData({ ...formData, startTime: selectedTime, endTime })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 py-5">
      {/* SECCIÓN 1: DETALLES CLÍNICOS */}
      <div className="space-y-5">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-[#008bcd] border-b border-border/80 pb-2 flex items-center gap-2">
          <User className="w-3.5 h-3.5" /> 1. Detalles Clínicos
        </h3>
        
        <div className="space-y-2">
          <Label className="text-foreground font-bold text-xs">Paciente *</Label>
          <PatientSelector 
            patientId={formData.patientId} 
            setPatientId={(id) => setFormData({ ...formData, patientId: id })} 
            patients={patients} 
            isLoading={isLoadingPatients} 
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground font-bold text-xs">Especialista Asignado *</Label>
          <Select 
            value={formData.doctorId || ""} 
            onValueChange={(id) => setFormData({ ...formData, doctorId: id })} 
            disabled={isLoadingDoctors}
          >
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
          <div className="space-y-2">
            <Label className="text-foreground font-bold text-xs">Estado Inicial</Label>
            <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
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
                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border", s.badgeClass || s.bg)}>
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
            <Label className="text-foreground font-bold text-xs">Situación</Label>
            <Select value={formData.situation} onValueChange={(val) => setFormData({ ...formData, situation: val })}>
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
      <div className="space-y-5">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-[#008bcd] border-b border-border/80 pb-2 flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5" /> 2. Horario y Ubicación
        </h3>

        <div className="space-y-2">
          <Label className="text-foreground font-bold text-xs">Fecha de la Cita *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-bold bg-background border-border/80 hover:bg-muted/50 h-11 rounded-xl text-xs text-foreground shadow-xs", !formData.date && "text-muted-foreground")}>
                {formData.date ? format(formData.date, "EEEE, d 'de' MMMM yyyy", { locale: es }) : <span>Elegir fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[120] rounded-2xl shadow-xl border-border/80" align="start">
              <Calendar 
                mode="single" 
                selected={formData.date} 
                onSelect={(d) => setFormData({ ...formData, date: d })} 
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-3.5 bg-muted/20 p-4 rounded-xl border border-border/80 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#008bcd]" />
          <div className="space-y-2">
            <Label className="text-foreground font-bold text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#008bcd]" /> Hora Inicio
            </Label>
            <Input 
              type="time" 
              value={formData.startTime} 
              onChange={handleStartTimeChange} 
              className="bg-background border-border/80 h-10 text-foreground font-bold rounded-lg text-xs shadow-xs" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground font-bold text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Hora Fin
            </Label>
            <Input 
              type="time" 
              value={formData.endTime} 
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} 
              min={formData.startTime} 
              className="bg-background border-border/80 h-10 text-foreground font-bold rounded-lg text-xs shadow-xs" 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* SELECTOR CONECTADO CON LOS BOXES */}
                <div className="space-y-2">
          <Label className="text-foreground font-bold text-xs flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#008bcd]" /> Sillón / Box
          </Label>
          <Select 
            value={formData.box || (availableBoxes.length > 0 ? availableBoxes[0] : "")} 
            onValueChange={(val) => setFormData({ ...formData, box: val })}
            disabled={isLoadingSettings}
          >
            <SelectTrigger className="bg-background border-border/80 h-11 font-semibold text-xs text-foreground rounded-xl">
              <SelectValue placeholder={isLoadingSettings ? "Cargando sillones..." : "Seleccionar Box..."} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/80 shadow-xl">
              {availableBoxes.map((boxName: string, index: number) => (
                <SelectItem key={index} value={boxName} className="text-xs font-semibold cursor-pointer">
                  {boxName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

          <div className="space-y-2">
            <Label className="text-foreground font-bold text-xs flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" /> Detalle Corto
            </Label>
            <Input 
              value={formData.reason} 
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })} 
              placeholder="Ej: Evaluación inicial..." 
              className="bg-background border-border/80 h-11 text-foreground font-semibold rounded-xl text-xs shadow-xs" 
              required 
            />
          </div>
        </div>
      </div>
    </div>
  )
}