import React from "react"
import {
  Archive,
  Bookmark,
  Calendar,
  Check,
  Circle,
  Clock1,
  FastForward,
  Hourglass,
  Inbox,
  LucideProps,
  Pause,
  PlayCircle,
  XCircle,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react"

import { SomedayIcon } from "@/components/someday-icon"

// Definimos el tipo de configuración
export type StatusConfig = {
  value: string
  label: string
  description?: string
  slug: string
  color?: string
  icon?: LucideIcon | React.ComponentType<LucideProps>
  order: number
}

export const goalsStatuses: Array<StatusConfig> = [
  {
    value: "NOT_STARTED",
    label: "No iniciado",
    description: "Aquí podrás encontrar todo lo que capturaste",
    slug: "not-started",
    color: "#7C83FD",
    icon: Circle,
    order: 1,
  },
  {
    value: "IN_PROGRESS",
    label: "En curso",
    slug: "in-progress",
    color: "#FFB703",
    icon: PlayCircle,
    order: 2,
  },
  {
    value: "COMPLETED",
    label: "Completado",
    slug: "completed",
    color: "#009F5D",
    icon: Check,
    order: 3,
  },
  {
    value: "ON_HOLD",
    label: "En pausa",
    slug: "on-hold",
    color: "#FF6B69",
    icon: Pause,
    order: 4,
  },
  {
    value: "CANCELLED",
    label: "Cancelado",
    slug: "cancelled",
    color: "#FF0000",
    icon: XCircle,
    order: 5,
  },
  {
    value: "FAILED",
    label: "Fallido",
    slug: "failed",
    color: "#FF0000",
    icon: XCircleIcon,
    order: 6,
  },
]

export const statuses: Array<StatusConfig> = [
  {
    value: "INBOX",
    label: "Entrada",
    description: "Aquí podrás encontrar todo lo que has capturado. Cada tarea es un paso hacia tus metas. ¡Organízate y aprovecha al máximo tu día!",
    slug: "inbox",
    color: "#007BFF",
    icon: Inbox,
    order: 1,
  },
  {
    value: "NEXT_ACTION",
    label: "Próxima acción",
    description: "Aquí podrás encontrar todas las tareas que te llevarán al siguiente nivel. Cada acción cuenta, ¡así que elige la siguiente y avanza con confianza!",
    slug: "next-action",
    color: "#28A745",
    icon: FastForward,
    order: 2,
  },
  {
    value: "WAITING_FOR",
    label: "En espera",
    description: "Aquí podrás encontrar todo lo que estás esperando. Mantén un ojo en estas tareas y prepárate para actuar cuando llegue el momento adecuado",
    slug: "waiting-for",
    color: "#FFC107",
    icon: Hourglass,
    order: 3,
  },
  {
    value: "SOMEDAY_MAYBE",
    label: "Algún dia / Tal vez",
    description: "Este es tu espacio para las ideas y tareas que aún no han llegado el momento. ¡Revisita y visualiza tu futuro!",
    slug: "someday-maybe",
    color: "#FD7E14",
    icon: SomedayIcon,
    order: 4,
  },
  {
    value: "CALENDAR",
    label: "Calendario",
    description: "Aquí podrás encontrar todo lo que está programado. Organiza tu tiempo y asegúrate de que cada día esté lleno de oportunidades. ¡Planifica y haz que cada momento cuente!",
    slug: "calendar",
    color: "#DC3545",
    icon: Calendar,
    order: 5,
  },
  {
    value: "REFERENCE",
    label: "Referencia",
    description: "Aquí puedes encontrar todo tu material de referencia. Organiza tus recursos y accede fácilmente a la información que necesitas para avanzar en tus proyectos. ¡Todo lo que necesitas, al alcance de tu mano!",
    slug: "reference",
    color: "#6F42C1",
    icon: Bookmark,
    order: 6,
  },
  {
    value: "REVIEW",
    label: "Revisar",
    description: "Aquí podrás examinar y evaluar todo el material que has trabajado. Tómate un momento para asegurarte de que todo esté en orden y listo para avanzar. ¡La revisión es clave para el éxito!",
    icon: Clock1,
    slug: "review",
    order: 7,
  },
  {
    value: "ARCHIVE",
    label: "Archivado",
    description: "Aquí puedes encontrar todo lo que has decidido archivar. Mantén tus documentos y materiales organizados para que puedas acceder a ellos fácilmente cuando los necesites. ¡Todo en su lugar!",
    icon: Archive,
    slug: "archive",
    order: 8,
  },
]