import { Circle, CheckCircle2 } from "lucide-react";
import { StatusConfig } from "./types";

export const taskStatuses: Record<string, StatusConfig> = {
  PENDING: {
    value: "PENDING",
    label: "Pendiente",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/20",
    icon: Circle,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Completada",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/20",
    icon: CheckCircle2,
  },
};