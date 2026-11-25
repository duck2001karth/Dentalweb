"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
  const { createAppointmentAsync, isLoading: isSaving } = useCreateAppointment()

  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)
  const [doctorsError, setDoctorsError] = useState("")
  const [doctorsRetry, setDoctorsRetry] = useState(0)
  const submitting = useRef(false)

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


    }
  }, [
    open,
    defaultDate,
    defaultDoctorId,
    defaultStartTime,
    currentUser?.id,
    isAdminOrStaff,
    settings?.availableBoxes,
    toast,
  ])

  useEffect(() => {
    if (!open || !isAdminOrStaff) return
    const controller = new AbortController()
    setDoctorsList([])
    setDoctorsError("")
    setIsLoadingDoctors(true)
    fetch("/api/doctors", { cache: "no-store", signal: controller.signal })
      .then(async res => {
        if (!res.ok) throw new Error(res.status === 401 ? "Inicia sesión nuevamente." : res.status === 403 ? "No tienes permisos para consultar especialistas." : "No se pudo consultar la lista de especialistas.")
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error("Respuesta de especialistas inválida.")
        if (!controller.signal.aborted) setDoctorsList(data)
      })
      .catch(error => { if (!controller.signal.aborted) setDoctorsError(error.message || "Error de conexión.") })
      .finally(() => { if (!controller.signal.aborted) setIsLoadingDoctors(false) })
    return () => controller.abort()
  }, [open, isAdminOrStaff, currentUser?.id, doctorsRetry])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting.current || isSaving) return
    if (isAdminOrStaff && (isLoadingDoctors || doctorsError || !doctorsList.some(d => d.id === formData.doctorId))) {
      toast({ title: "Selecciona un especialista activo", variant: "destructive" })
      return
    }

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

    submitting.current = true
    try {
      await createAppointmentAsync({
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
    } finally { submitting.current = false }
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
      <Dialog open={open} onOpenChange={value => { if (!submitting.current && !isSaving) setOpen(value) }}>
        <DialogTrigger asChild>
          {customTrigger ? (
            customTrigger
          ) : (
            <Button
              variant="outline"
              onMouseEnter={() => setIsTriggerHovered(true)}
              onMouseLeave={() => setIsTriggerHovered(false)}
              style={{
                color: isTriggerHovered ? defaultUserColor : undefined,
                borderColor: isTriggerHovered ? `${defaultUserColor}60` : undefined,
              }}
              className="h-10 gap-2 rounded-xl border-border bg-card px-4 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-accent"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Dar cita
            </Button>
          )}
        </DialogTrigger>

        {/* Se mantiene AppointmentForm y la lógica original de validación y guardado. */}
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col gap-0 overflow-y-auto rounded-2xl border border-border bg-card p-0 shadow-xl sm:max-w-[820px]">
          <div className="border-b border-border/70 bg-card px-5 py-5 sm:px-7 sm:py-6">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold tracking-tight text-foreground sm:text-[22px]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                  <CalendarIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                Agendar nueva cita
              </DialogTitle>
              <DialogDescription className="pl-[52px] text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Completa los datos de la atención. Los campos con <span className="font-semibold text-destructive">*</span> son obligatorios.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="min-w-0">
            <div className="min-w-0 py-2 sm:py-3">
              <AppointmentForm
                formData={formData}
                setFormData={setFormData}
                patients={patients}
                doctorsList={doctorsList}
                isLoadingPatients={isLoadingPatients}
                isLoadingDoctors={isLoadingDoctors}
                doctorsError={doctorsError}
                onRetryDoctors={() => setDoctorsRetry(n => n + 1)}
                isAdminOrStaff={isAdminOrStaff}
                currentUser={currentUser}
                validInitialStatuses={validInitialStatuses.filter(status => status.value === "SCHEDULED")}
              />

              {collision && (
                <div className="px-5 pb-4 sm:px-7">
                  <AppointmentCollisionAlert conflict={collision} />
                </div>
              )}
              {duplicateAppointmentInDay && (
                <div className="px-5 pb-4 sm:px-7">
                  <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      <strong>{patientDisplayName}</strong> ya tiene una cita reservada a las{" "}
                      <strong>{duplicateAppointmentInDay.startTime}</strong> en esta misma fecha.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border/70 bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="hidden text-xs text-muted-foreground sm:block">
                Revisa los datos antes de confirmar.
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={isSaving}
                  className="h-10 rounded-xl px-4 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || hasAnyConflict || !isFormValid || (isAdminOrStaff && (isLoadingDoctors || !!doctorsError || !doctorsList.some(d => d.id === formData.doctorId)))}
                  className="h-10 min-w-[164px] rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white shadow-none transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 dark:disabled:bg-muted dark:disabled:text-muted-foreground"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Guardando...
                    </>
                  ) : duplicateAppointmentInDay ? (
                    <>
                      <ShieldAlert className="mr-2 h-4 w-4" aria-hidden="true" />
                      Paciente ya agendado
                    </>
                  ) : collision ? (
                    <>
                      <ShieldAlert className="mr-2 h-4 w-4" aria-hidden="true" />
                      Horario no disponible
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                      Confirmar cita
                    </>
                  )}
                </Button>
              </div>
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