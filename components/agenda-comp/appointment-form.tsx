"use client"

import React, { useEffect, useMemo } from "react"
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

  const activeDoctorColor = useMemo(() => {
    const selectedDocId = formData.doctorId
    if (selectedDocId) {
      const found = doctorsList?.find((d: any) => d.id === selectedDocId)
      if (found?.calendarColor) return found.calendarColor
    }
    return currentUser?.calendarColor || "#008bcd"
  }, [formData.doctorId, doctorsList, currentUser])

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedTime = e.target.value
    if (!selectedTime) {
      setFormData({ ...formData, startTime: "" })
      return
    }

    const [h, m] = selectedTime.split(':').map(Number)
    const d = new Date()
    d.setHours(h, m + 30, 0)
    const endTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    
    setFormData({ ...formData, startTime: selectedTime, endTime })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 py-5">
      <div className="space-y-5">
        <h3 
          style={{ color: activeDoctorColor }}
          className="text-[11px] font-black uppercase tracking-widest border-b border-border/80 pb-2 flex items-center gap-2 transition-colors"
        >
          <User className="w-3.5 h-3.5" /> 1. Detalles Clínicos
        </h3>
        
        <div className="space-y-2">
          <Label className="text-foreground font-bold text-xs flex items-center justify-between">
            <span>Paciente <span className="text-destructive font-black">*</span></span>
            {!formData.patientId && (
              <span className="text-[10px] text-muted-foreground font-normal">Requerido</span>
            )}
          </Label>
          <PatientSelector 
             patientId={formData.patientId} 
             setPatientId={(id) => setFormData({ ...formData, patientId: id })} 
             patients={patients} 
             isLoading={isLoadingPatients}
             themeColor={activeDoctorColor} 
           />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground font-bold text-xs flex items-center justify-between">
            <span>Especialista Asignado <span className="text-destructive font-black">*</span></span>
            {!formData.doctorId && (
              <span className="text-[10px] text-muted-foreground font-normal">Requerido</span>
            )}
          </Label>
          <Select 
            value={formData.doctorId || ""} 
            onValueChange={(id) => setFormData({ ...formData, doctorId: id })} 
            disabled={isLoadingDoctors}
          >
            <SelectTrigger className={cn(
              "bg-background border-border/80 h-11 font-semibold text-xs text-foreground rounded-xl transition-colors",
              !formData.doctorId && "border-amber-500/50"
            )}>
              <SelectValue placeholder={isLoadingDoctors ? "Cargando especialistas..." : "Seleccione el especialista"} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/80 shadow-xl">
              {isAdminOrStaff ? (
                doctorsList.length > 0 ? (
                  doctorsList.map(doc => {
                    const docColor = doc.calendarColor || "#008bcd"
                    return (
                      <SelectItem key={doc.id} value={doc.id} className="font-semibold text-xs cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs" 
                            style={{ backgroundColor: docColor }} 
                          />
                          <span>{doc.name} {doc.specialty ? `(${doc.specialty})` : ""}</span>
                        </div>
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="empty" disabled className="text-xs">No hay médicos registrados</SelectItem>
                )
              ) : (
                <SelectItem value={currentUser?.id || "doctor_default"} className="font-semibold text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                      style={{ backgroundColor: activeDoctorColor }} 
                    />
                    <span>{currentUser?.name || "Dr. Asignado"} (Tú)</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-2">
            <Label className="text-foreground font-bold text-xs">Estado Inicial</Label>
            <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
              <SelectTrigger className="bg-background border-border/80 h-11 font-semibold text-xs text-foreground rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/80 shadow-xl p-1">
                {validInitialStatuses.map((s) => {
                  const Icon = s.icon;
                  return (
                    <SelectItem key={s.value} value={s.value} className="rounded-lg my-0.5 cursor-pointer">
                      <div className="flex items-center gap-2 py-0.5">
                        <Icon className="w-4 h-4" style={{ color: activeDoctorColor }} />
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
              <SelectTrigger className="bg-background border-border/80 h-11 font-semibold text-xs text-foreground rounded-xl">
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
        <h3 
          style={{ color: activeDoctorColor }}
          className="text-[11px] font-black uppercase tracking-widest border-b border-border/80 pb-2 flex items-center gap-2 transition-colors"
        >
          <CalendarIcon className="w-3.5 h-3.5" /> 2. Horario y Ubicación
        </h3>
        <div className="space-y-2">
          <Label className="text-foreground font-bold text-xs">
            Fecha de la Cita <span className="text-destructive font-black">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full justify-start text-left font-bold bg-background border-border/80 hover:bg-muted/50 h-11 rounded-xl text-xs text-foreground shadow-xs cursor-pointer",
                  !formData.date && "text-muted-foreground border-destructive/50"
                )}
              >
                {formData.date ? format(formData.date, "EEEE, d 'de' MMMM yyyy", { locale: es }) : <span>Elegir fecha *</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[120] rounded-2xl shadow-xl border-border/80" align="start">
              <div 
                style={{ "--calendar-accent": activeDoctorColor } as React.CSSProperties}
                className="[&_.rdp-day_selected]:bg-[var(--calendar-accent)] [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:opacity-90"
              >
                <Calendar 
                  mode="single" 
                  selected={formData.date} 
                  onSelect={(d) => d && setFormData({ ...formData, date: d })} 
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} 
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-2 gap-3.5 bg-muted/20 p-4 rounded-xl border border-border/80 relative overflow-hidden">
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300" 
            style={{ backgroundColor: activeDoctorColor }} 
          />
          <div className="space-y-2">
            <Label className="text-foreground font-bold text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" style={{ color: activeDoctorColor }} /> 
              Hora Inicio <span className="text-destructive font-black">*</span>
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
              <Clock className="w-3.5 h-3.5 text-muted-foreground" /> 
              Hora Fin <span className="text-destructive font-black">*</span>
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
          <div className="space-y-2">
            <Label className="text-foreground font-bold text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" style={{ color: activeDoctorColor }} /> 
              Sillón / Box <span className="text-destructive font-black">*</span>
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
              <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" /> 
              Detalle Corto <span className="text-destructive font-black">*</span>
            </Label>
            <Input 
              value={formData.reason} 
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })} 
              placeholder="Ej: Evaluación inicial..." 
              className={cn(
                "bg-background border-border/80 h-11 text-foreground font-semibold rounded-xl text-xs shadow-xs",
                !formData.reason?.trim() && "focus-visible:ring-amber-500"
              )} 
              required 
            />
          </div>
        </div>
      </div>
    </div>
  )
}