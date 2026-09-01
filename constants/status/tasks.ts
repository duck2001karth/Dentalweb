import { CheckCircle2, Clock } from "lucide-react"

export const taskStatuses = {
  PENDING: {
    label: "Pendiente",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    badgeColor: "text-amber-700 bg-amber-50 border-amber-200 dark:border-amber-800",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completada",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
}