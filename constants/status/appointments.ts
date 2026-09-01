import { 
  CheckCircle2, Clock, 
  XCircle, AlertCircle, PlayCircle, UserX 
} from "lucide-react"

export interface AppointmentStatusConfig {
  label: string
  color: string
  bg: string
  badgeColor: string
  icon: any
}

export const appointmentStatuses: Record<string, AppointmentStatusConfig> = {
  SCHEDULED: {
    label: "Agendada",
    color: "text-[#008bcd]",
    bg: "bg-[#008bcd]/10",
    badgeColor: "text-[#008bcd] bg-[#008bcd]/10 border-[#008bcd]/20",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmada",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  WAITING: {
    label: "En Sala",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    badgeColor: "text-amber-700 bg-amber-50 border-amber-200 dark:border-amber-800",
    icon: AlertCircle,
  },
  IN_PROGRESS: {
    label: "En Atención",
    color: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    badgeColor: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:border-indigo-800",
    icon: PlayCircle,
  },
  COMPLETED: {
    label: "Atendida",
    color: "text-teal-700 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    badgeColor: "text-teal-700 bg-teal-50 border-teal-200 dark:border-teal-800",
    icon: CheckCircle2,
  },
  NO_SHOW: {
    label: "No Asistió",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    badgeColor: "text-rose-700 bg-rose-50 border-rose-200 dark:border-rose-800",
    icon: UserX,
  },
  CANCELLED: {
    label: "Cancelada",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    badgeColor: "text-slate-600 bg-slate-100 border-slate-200 dark:border-slate-700",
    icon: XCircle,
  },
}

export const getReasonLabel = (reason?: string): string => {
  if (!reason) return "Consulta General"
  switch (reason) {
    case "PATIENT_REQUEST":
      return "Solicitud del Paciente"
    case "DOCTOR_UNAVAILABILITY":
      return "Ausencia Médica"
    case "NO_SHOW":
      return "Reagendamiento por Inasistencia"
    case "CLINIC_SCHEDULE_CHANGE":
      return "Ajuste de Horario Clínica"
    default:
      return reason
  }
}