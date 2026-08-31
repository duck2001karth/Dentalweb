import {
  CalendarClock, CheckCircle2, UserCheck, Stethoscope, 
  CheckSquare, AlertCircle, XCircle
} from "lucide-react";
import { StatusConfig } from "./types";

export const appointmentStatuses: Record<string, StatusConfig> = {
  SCHEDULED: {
    value: "SCHEDULED", label: "Agendada", description: "Cita programada.",
    color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500/15 border-blue-500/20", icon: CalendarClock,
  },
  CONFIRMED: {
    value: "CONFIRMED", label: "Confirmada", description: "Paciente confirmó.",
    color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20", icon: CheckCircle2,
  },
  IN_WAITING_ROOM: {
    value: "IN_WAITING_ROOM", label: "En Sala", description: "Llegó a clínica.",
    color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-500/15 border-purple-500/20", icon: UserCheck,
  },
  IN_PROGRESS: {
    value: "IN_PROGRESS", label: "En Box", description: "Siendo atendido.",
    color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/15 border-amber-500/20", icon: Stethoscope,
  },
  COMPLETED: {
    value: "COMPLETED", label: "Atendido", description: "Consulta finalizada.",
    color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-500/15 border-slate-500/20", icon: CheckSquare,
  },
  NO_SHOW: {
    value: "NO_SHOW", label: "No Asistió", description: "No se presentó.",
    color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-500/15 border-orange-500/20", icon: AlertCircle,
  },
  CANCELLED: {
    value: "CANCELLED", label: "Cancelada", description: "Cita anulada.",
    color: "text-red-700 dark:text-red-400", bg: "bg-red-500/15 border-red-500/20", icon: XCircle,
  },
};