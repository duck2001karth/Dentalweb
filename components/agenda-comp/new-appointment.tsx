"use client"

import { useState, useEffect, useMemo } from "react"
import { CalendarIcon, Plus, Loader2, CheckCircle2, ShieldAlert } from "lucide-react"
import { useSession } from "next-auth/react"
import { format, addMinutes } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useGetPatients } from "@/hooks/patients"
import { useGetAppointments, useCreateAppointment } from "@/hooks/appointments"
import { appointmentStatuses } from "@/constants/status"
import { useClinicSettings } from "@/config/clinic-settings"
import { AppointmentForm } from "./appointment-form"
import { AppointmentCollisionAlert } from "./appointment-collision-alert"
import { DuplicatePatientDialog } from "./duplicate-patient-dialog"

interface NewAppointmentModalProps {
  customTrigger?: React.ReactNode
  defaultDate?: Date
  defaultStartTime?: string
  defaultDoctorId?: string
}

const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

const extractDateString = (cita: any): string => {
  if (!cita) return ""

  const candidate = cita.date || cita.fecha || cita.startTime || ""
  if (typeof candidate === "string") {
    const match = candidate.match(/^\d{4}-\d{2}-\d{2}/)
    if (match) return match[0]
  }

  if (candidate instanceof Date && !isNaN(candidate.getTime())) {
    return format(candidate, "yyyy-MM-dd")
  }

  return ""
}

const extractPatientId = (cita: any): string => {
  if (!cita) return ""
  return String(cita.patientId || cita.patient?.id || cita.pacienteId || "")
}

export function NewAppointmentModal({
  customTrigger,
  defaultDate,
  defaultStartTime,
  defaultDoctorId,
}: NewAppointmentModalProps) {
  const [open, setOpen] = useState(false)
  const [isTriggerHovered, setIsTriggerHovered] = useState(false)
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [existingPatientAppointment, setExistingPatientAppointment] = useState<any>(null)

  const { data: session } = useSession()
  const { toast } = useToast()
  const { settings } = useClinicSettings()

  const currentUser = session?.user as any
  const isAdminOrStaff = currentUser?.role === "ADMIN" || currentUser?.role === "RECEPTIONIST"
  const defaultUserColor = currentUser?.calendarColor || "#008bcd"

  const { patients, isLoading: isLoadingPatients } = useGetPatients()
  const { createAppointment, isLoading: isSaving } = useCreateAppointment()

  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)

  const defaultBox = settings?.availableBoxes?.[0] || "Box 1"

  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: defaultDoctorId || "",
    box: defaultBox,
    reason: "",
    status: "SCHEDULED",
    situation: "Primera Consulta",
    date: defaultDate || new Date(),
    startTime: defaultStartTime || "09:00",
    endTime: "09:30",
  })

  const targetDateStr = useMemo(() => {
    const d = formData.date || defaultDate || new Date()
    return format(d, "yyyy-MM-dd")
  }, [formData.date, defaultDate])

  const { appointments: rawAppointments = [], refetch } = useGetAppointments({
    fecha: targetDateStr,
  })
  const existingAppointments: any[] = useMemo(() => {
    if (Array.isArray(rawAppointments)) return rawAppointments
    if (Array.isArray((rawAppointments as any)?.citas)) return (rawAppointments as any).citas
    return []
  }, [rawAppointments])

  const activeDoctorColor = useMemo(() => {
    const selectedDocId = formData.doctorId
    if (selectedDocId) {
      const found = doctorsList.find((d: any) => d.id === selectedDocId)
      if (found?.calendarColor) return found.calendarColor
    }
    return defaultUserColor
  }, [formData.doctorId, doctorsList, defaultUserColor])
  const duplicateAppointmentInDay = useMemo(() => {
    if (!formData.patientId || !formData.date) return null

    const selectedDay = format(formData.date, "yyyy-MM-dd")
    const targetPatId = String(formData.patientId).trim()

    return (
      existingAppointments.find((c: any) => {
        if (c.status === "CANCELLED" || c.status === "CANCELED") return false
        const cDateStr = extractDateString(c)
        const cPatId = extractPatientId(c).trim()
        return cDateStr === selectedDay && cPatId === targetPatId
      }) || null
    )
  }, [formData.patientId, formData.date, existingAppointments])

  const collision = useMemo(() => {
    if (!formData.date || !formData.startTime || !formData.endTime) return null

    const newStart = timeToMinutes(formData.startTime)
    const newEnd = timeToMinutes(formData.endTime)
    if (newEnd <= newStart) return null

    const selectedDay = format(formData.date, "yyyy-MM-dd")

    for (const cita of existingAppointments) {
      if (cita.status === "CANCELLED" || cita.status === "CANCELED") continue

      const citaDateStr = extractDateString(cita)
      if (citaDateStr !== selectedDay) continue

      const citaStart = timeToMinutes(cita.startTime)
      const citaEnd = timeToMinutes(cita.endTime)

      const hasOverlap = Math.max(newStart, citaStart) < Math.min(newEnd, citaEnd)
      if (!hasOverlap) continue

      const patientName =
        `${cita.patient?.firstName || ""} ${cita.patient?.lastName || ""}`.trim() ||
        "Paciente Agendado"

      if (
        formData.doctorId &&
        (cita.doctorId === formData.doctorId || cita.doctor?.id === formData.doctorId)
      ) {
        return {
          type: "DOCTOR" as const,
          patientName,
          startTime: cita.startTime,
          endTime: cita.endTime,
          box: cita.box,
        }
      }

      if (formData.box && cita.box === formData.box) {
        return {
          type: "BOX" as const,
          patientName,
          startTime: cita.startTime,
          endTime: cita.endTime,
          box: cita.box,
        }
      }
    }

    return null
  }, [formData.date, formData.startTime, formData.endTime, formData.doctorId, formData.box, existingAppointments])

  const validInitialStatuses = [
    {
      value: "SCHEDULED",
      ...appointmentStatuses.SCHEDULED,
      badgeClass:
        appointmentStatuses.SCHEDULED?.badgeColor ||
        "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    {
      value: "WAITING",
      ...(appointmentStatuses.WAITING || appointmentStatuses.SCHEDULED),
      badgeClass:
        appointmentStatuses.WAITING?.badgeColor ||
        "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    {
      value: "IN_PROGRESS",
      ...appointmentStatuses.IN_PROGRESS,
      badgeClass:
        appointmentStatuses.IN_PROGRESS?.badgeColor ||
        "bg-purple-500/10 text-purple-600 border-purple-500/20",
    },
  ]

  useEffect(() => {
    if (open) {
      refetch?.()
      const now = new Date()
      const nowTime = format(now, "HH:mm")
      const autoEndTime = format(addMinutes(now, 30), "HH:mm")

      setFormData((prev) => ({
        ...prev,
        box: prev.box || settings?.availableBoxes?.[0] || "Box 1",
        date: defaultDate || new Date(),
        doctorId: defaultDoctorId || (isAdminOrStaff ? "" : currentUser?.id || ""),
        startTime: defaultStartTime || nowTime,
        endTime: defaultStartTime ? prev.endTime : autoEndTime,
      }))

      if (isAdminOrStaff && doctorsList.length === 0) {
        setIsLoadingDoctors(true)
        fetch("/api/admin/users")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setDoctorsList(
                data
                  .filter((u: any) => u.role === "DOCTOR")
                  .map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    specialty: d.specialty,
                    calendarColor: d.calendarColor || "#008bcd",
                  }))
              )
            }
          })
          .catch(() =>
            toast({
              title: "Error",
              description: "No se pudieron cargar los especialistas.",
              variant: "destructive",
            })
          )
          .finally(() => setIsLoadingDoctors(false))
      }
    }
  }, [
    open,
    defaultDate,
    defaultDoctorId,
    defaultStartTime,
    currentUser?.id,
    isAdminOrStaff,
    settings?.availableBoxes,
    doctorsList.length,
    toast,
  ])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.patientId?.trim()) {
      return toast({
        title: "Campo requerido",
        description: "Debes seleccionar un paciente de la lista.",
        variant: "destructive",
      })
    }
    if (duplicateAppointmentInDay) {
      setExistingPatientAppointment({
        startTime: duplicateAppointmentInDay.startTime,
        endTime: duplicateAppointmentInDay.endTime,
        box: duplicateAppointmentInDay.box,
        doctorName: duplicateAppointmentInDay.doctor?.name || "Especialista asignado",
        reason: duplicateAppointmentInDay.reason,
      })
      setDuplicateModalOpen(true)
      return
    }
    if (collision) {
      return toast({
        title: "Conflicto de Horario",
        description: `El horario colisiona con la cita de ${collision.patientName}. Selecciona otro rango u otro sillón.`,
        variant: "destructive",
      })
    }

    if (!formData.doctorId?.trim()) {
      return toast({
        title: "Campo requerido",
        description: "Debes asignar un especialista a la cita.",
        variant: "destructive",
      })
    }

    if (!formData.date) {
      return toast({
        title: "Campo requerido",
        description: "Por favor selecciona una fecha válida.",
        variant: "destructive",
      })
    }

    if (!formData.startTime?.trim() || !formData.endTime?.trim()) {
      return toast({
        title: "Horario incompleto",
        description: "Debes indicar tanto la hora de inicio como la de fin.",
        variant: "destructive",
      })
    }

    if (formData.endTime <= formData.startTime) {
      return toast({
        title: "Horario inválido",
        description: "La hora de finalización debe ser posterior a la de inicio.",
        variant: "destructive",
      })
    }

    if (!formData.box?.trim()) {
      return toast({
        title: "Sillón no seleccionado",
        description: "Asigna un Box/Sillón para la atención.",
        variant: "destructive",
      })
    }

    if (!formData.reason?.trim()) {
      return toast({
        title: "Motivo obligatorio",
        description: "Escribe una breve descripción o motivo de la consulta.",
        variant: "destructive",
      })
    }

    try {
      await createAppointment({
        ...formData,
        reason: formData.reason.trim(),
        date: format(formData.date, "yyyy-MM-dd"),
      })

      toast({
        title: "¡Cita Agendada!",
        description: `Reservada exitosamente para las ${formData.startTime}.`,
      })

      setOpen(false)
      setFormData((prev) => ({ ...prev, patientId: "", reason: "" }))
      refetch?.()
    } catch (error: any) {
      toast({
        title: "Error al agendar",
        description: error.message || "Problema de conexión o cruce de horarios.",
        variant: "destructive",
      })
    }
  }

  const selectedPatientObj = patients?.find(
    (p: any) => String(p.id) === String(formData.patientId)
  )
  const patientDisplayName = selectedPatientObj
    ? `${selectedPatientObj.firstName} ${selectedPatientObj.lastName}`
    : "Este paciente"

  const hasAnyConflict = Boolean(collision || duplicateAppointmentInDay)
  const isFormValid = useMemo(() => {
    return Boolean(
      formData.patientId?.trim() &&
      formData.doctorId?.trim() &&
      formData.date &&
      formData.startTime?.trim() &&
      formData.endTime?.trim() &&
      formData.startTime < formData.endTime && 
      formData.box?.trim() &&
      formData.reason?.trim()
    )
  }, [formData])

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {customTrigger ? (
            customTrigger
          ) : (
            <Button
              variant="ghost"
              onMouseEnter={() => setIsTriggerHovered(true)}
              onMouseLeave={() => setIsTriggerHovered(false)}
              style={{
                color: isTriggerHovered ? defaultUserColor : undefined,
                backgroundColor: isTriggerHovered ? `${defaultUserColor}15` : undefined,
                borderColor: isTriggerHovered ? `${defaultUserColor}40` : undefined,
              }}
              className="flex-1 md:flex-none bg-transparent border border-border/80 text-foreground font-bold text-sm h-11 px-4 rounded-xl transition-all duration-200 shadow-none group cursor-pointer"
            >
              <Plus
                className="h-5 w-5 mr-1.5 text-muted-foreground transition-colors stroke-[2.5]"
                style={{ color: isTriggerHovered ? defaultUserColor : undefined }}
              />
              <span>Dar cita</span>
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-[850px] p-0 bg-card border-border/80 overflow-hidden rounded-[24px] shadow-2xl">
          <div
            className="px-6 py-5 border-b border-border/80 transition-all duration-300"
            style={{
              background: `linear-gradient(to right, ${activeDoctorColor}18, transparent)`,
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-black text-foreground flex items-center gap-3 tracking-tight">
                <div
                  className="p-2.5 border shadow-xs rounded-xl shrink-0 transition-colors duration-300"
                  style={{
                    backgroundColor: `${activeDoctorColor}18`,
                    borderColor: `${activeDoctorColor}35`,
                    color: activeDoctorColor,
                  }}
                >
                  <CalendarIcon className="w-5 h-5 stroke-[2.5]" />
                </div>
                Agendar Nueva Cita
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs font-semibold mt-1 ml-14">
                Todos los campos marcados con (*) son obligatorios para reservar el horario.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <AppointmentForm
                formData={formData}
                setFormData={setFormData}
                patients={patients}
                doctorsList={doctorsList}
                isLoadingPatients={isLoadingPatients}
                isLoadingDoctors={isLoadingDoctors}
                isAdminOrStaff={isAdminOrStaff}
                currentUser={currentUser}
                validInitialStatuses={validInitialStatuses}
              />

              {collision && (
                <div className="px-6 pb-4">
                  <AppointmentCollisionAlert conflict={collision} />
                </div>
              )}
              {duplicateAppointmentInDay && (
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>{patientDisplayName}</strong> ya tiene una cita reservada a las{" "}
                      <strong>{duplicateAppointmentInDay.startTime}</strong> en esta misma fecha.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border/80 bg-muted/10 flex justify-end items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="hover:bg-muted text-muted-foreground font-bold rounded-xl h-10 px-5 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSaving || hasAnyConflict || !isFormValid}
                style={{
                  backgroundColor: hasAnyConflict || !isFormValid 
                    ? `${activeDoctorColor}15` 
                    : activeDoctorColor,
                  borderColor: hasAnyConflict || !isFormValid 
                    ? `${activeDoctorColor}40` 
                    : "transparent",
                  color: hasAnyConflict || !isFormValid 
                    ? activeDoctorColor 
                    : "#ffffff",
                  boxShadow: (!hasAnyConflict && isFormValid)
                    ? `0 8px 16px -4px ${activeDoctorColor}40` 
                    : "none",
                }}
                className={cn(
                  "font-bold h-10 px-6 rounded-xl text-xs transition-all duration-200 border",
                  (hasAnyConflict || !isFormValid)
                    ? "cursor-not-allowed opacity-100! shadow-none"
                    : "cursor-pointer hover:opacity-90 active:scale-[0.99]"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" /> Guardando...
                  </>
                ) : duplicateAppointmentInDay ? (
                  <>
                    <ShieldAlert
                      className="w-4 h-4 mr-2 shrink-0 stroke-[2.2]"
                      style={{ color: activeDoctorColor }}
                    />
                    Paciente Ya Agendado
                  </>
                ) : collision ? (
                  <>
                    <ShieldAlert
                      className="w-4 h-4 mr-2 shrink-0 stroke-[2.2]"
                      style={{ color: activeDoctorColor }}
                    />
                    Horario No Disponible
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 stroke-[2.5] text-white" /> Confirmar Cita
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DuplicatePatientDialog
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        patientName={patientDisplayName}
        existingAppointment={existingPatientAppointment}
      />
    </>
  )
}