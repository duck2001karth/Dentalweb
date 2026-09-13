"use client"

import { useState, useEffect, useMemo } from "react"
import { CalendarIcon, Plus, Loader2, CheckCircle2 } from "lucide-react"
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
import { useCreateAppointment } from "@/hooks/appointments"
import { appointmentStatuses } from "@/constants/status"
import { useClinicSettings } from "@/config/clinic-settings"
import { AppointmentForm } from "./appointment-form"

interface NewAppointmentModalProps {
  customTrigger?: React.ReactNode
  defaultDate?: Date
  defaultStartTime?: string
  defaultDoctorId?: string
}

export function NewAppointmentModal({
  customTrigger,
  defaultDate,
  defaultStartTime,
  defaultDoctorId,
}: NewAppointmentModalProps) {
  const [open, setOpen] = useState(false)
  const [isTriggerHovered, setIsTriggerHovered] = useState(false)
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

  const activeDoctorColor = useMemo(() => {
    const selectedDocId = formData.doctorId
    if (selectedDocId) {
      const found = doctorsList.find((d: any) => d.id === selectedDocId)
      if (found?.calendarColor) return found.calendarColor
    }
    return defaultUserColor
  }, [formData.doctorId, doctorsList, defaultUserColor])

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

  // --- VALIDACIÓN EXHAUSTIVA DE DATOS OBLIGATORIOS ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.patientId?.trim()) {
      return toast({
        title: "Campo requerido",
        description: "Debes seleccionar un paciente de la lista.",
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

    // Comprobar que la hora fin sea estrictamente mayor que la de inicio
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
        date: formData.date.toISOString(),
      })

      toast({
        title: "¡Cita Agendada!",
        description: `Reservada exitosamente para las ${formData.startTime}.`,
      })

      setOpen(false)
      setFormData((prev) => ({ ...prev, patientId: "", reason: "" }))
    } catch (error: any) {
      toast({
        title: "Error al agendar",
        description: error.message || "Problema de conexión o cruce de horarios.",
        variant: "destructive",
      })
    }
  }

  return (
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
        {/* Cabecera con acento de color del doctor */}
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
              disabled={isSaving}
              style={{
                backgroundColor: activeDoctorColor,
                boxShadow: `0 8px 16px -4px ${activeDoctorColor}40`,
              }}
              className="text-white font-bold h-10 px-6 rounded-xl text-xs transition-all duration-200 cursor-pointer hover:opacity-90 active:scale-[0.99]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 stroke-[2.5]" /> Confirmar Cita
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}