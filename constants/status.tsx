import {
  CalendarClock,
  CheckCircle2,
  UserCheck,
  Stethoscope,
  CheckSquare,
  AlertCircle,
  XCircle,
  FileSignature,
  Activity,
  Archive,
  CreditCard,
  Banknote,
  Ban,
  Circle,
  PenTool,
  Trash2,
  type LucideIcon,
} from "lucide-react";

export type StatusConfig = {
  value: string;
  label: string;
  description?: string;
  color: string; 
  bg: string;
  icon: LucideIcon | React.ComponentType<any>;
};

// ==========================================
// 1. CICLO DE VIDA DE LA CITA MÉDICA
// ==========================================
export const appointmentStatuses: Record<string, StatusConfig> = {
  SCHEDULED: {
    value: "SCHEDULED",
    label: "Agendada",
    description: "Cita programada, a la espera de confirmación.",
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: CalendarClock,
  },
  CONFIRMED: {
    value: "CONFIRMED",
    label: "Confirmada",
    description: "El paciente ha confirmado su asistencia.",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    icon: CheckCircle2,
  },
  IN_WAITING_ROOM: {
    value: "IN_WAITING_ROOM",
    label: "En Sala de Espera",
    description: "El paciente ha llegado a la clínica.",
    color: "text-purple-600",
    bg: "bg-purple-100",
    icon: UserCheck,
  },
  IN_PROGRESS: {
    value: "IN_PROGRESS",
    label: "En Consultorio",
    description: "El paciente está siendo atendido por el doctor.",
    color: "text-amber-600",
    bg: "bg-amber-100",
    icon: Stethoscope,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Atendido",
    description: "La consulta ha finalizado exitosamente.",
    color: "text-slate-600",
    bg: "bg-slate-100",
    icon: CheckSquare,
  },
  NO_SHOW: {
    value: "NO_SHOW",
    label: "No Asistió",
    description: "El paciente no se presentó a su cita.",
    color: "text-orange-600",
    bg: "bg-orange-100",
    icon: AlertCircle,
  },
  CANCELLED: {
    value: "CANCELLED",
    label: "Cancelada",
    description: "La cita fue cancelada por la clínica o el paciente.",
    color: "text-red-600",
    bg: "bg-red-100",
    icon: XCircle,
  },
};

// ==========================================
// 2. CICLO DE VIDA DE TRATAMIENTOS / ODONTOGRAMA
// ==========================================
export const treatmentStatuses: Record<string, StatusConfig> = {
  DRAFT: {
    value: "DRAFT",
    label: "Presupuestado",
    color: "text-slate-600",
    bg: "bg-slate-100",
    icon: FileSignature,
  },
  ACCEPTED: {
    value: "ACCEPTED",
    label: "Aceptado por Paciente",
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    value: "IN_PROGRESS",
    label: "En Curso",
    color: "text-amber-600",
    bg: "bg-amber-100",
    icon: Activity,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Finalizado",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    icon: CheckSquare,
  },
  SUSPENDED: {
    value: "SUSPENDED",
    label: "Suspendido",
    color: "text-red-600",
    bg: "bg-red-100",
    icon: Archive,
  },
};
// ==========================================
// 3. ESTADOS ESPECÍFICOS DEL ODONTOGRAMA (INTERNACIONAL)
// ==========================================
export const odontogramStatuses: Record<string, StatusConfig> = {
  // LESIONES (ROJO)
  CARIES: { value: "CARIES", label: "Caries", color: "text-red-500", bg: "bg-red-100", icon: () => <span>🔴</span> },
  FRACTURA: { value: "FRACTURA", label: "Fractura", color: "text-red-500", bg: "bg-red-100", icon: () => <span>⚡</span> },
  ENDO_INDICADA: { value: "ENDO_INDICADA", label: "Infección Pulpar", color: "text-red-500", bg: "bg-red-100", icon: () => <span>🔺</span> },
  REST_MALA: { value: "REST_MALA", label: "Restauración Defectuosa", color: "text-red-500", bg: "bg-red-100", icon: () => <span>⭕</span> },
  EXT_INDICADA: { value: "EXT_INDICADA", label: "Extracción Indicada", color: "text-red-500", bg: "bg-red-100", icon: () => <span>❌</span> },
  SELLANTE_MALO: { value: "SELLANTE_MALO", label: "Sellante Defectuoso", color: "text-red-500", bg: "bg-red-100", icon: () => <span className="font-bold">S</span> },

  // PREEXISTENCIAS (AZUL)
  REST_BUENA: { value: "REST_BUENA", label: "Restauración Buena", color: "text-blue-600", bg: "bg-blue-100", icon: () => <span>🔵</span> },
  CORONA_BUENA: { value: "CORONA_BUENA", label: "Corona Buena", color: "text-blue-600", bg: "bg-blue-100", icon: () => <span>🔘</span> },
  ENDO_REALIZADA: { value: "ENDO_REALIZADA", label: "Endodoncia Realizada", color: "text-blue-600", bg: "bg-blue-100", icon: () => <span>🔺</span> },
  EXT_REALIZADA: { value: "EXT_REALIZADA", label: "Ausente", color: "text-blue-600", bg: "bg-blue-100", icon: () => <span>❌</span> },
  SELLANTE_BUENO: { value: "SELLANTE_BUENO", label: "Sellante Bueno", color: "text-blue-600", bg: "bg-blue-100", icon: () => <span className="font-bold">S</span> },
};
// ==========================================
// 4. ESTADOS DE PAGOS / FACTURACIÓN
// ==========================================
export const paymentStatuses: Record<string, StatusConfig> = {
  PENDING: {
    value: "PENDING",
    label: "Pendiente de Pago",
    color: "text-amber-600",
    bg: "bg-amber-100",
    icon: CreditCard,
  },
  PARTIAL: {
    value: "PARTIAL",
    label: "Abono Parcial",
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: Banknote,
  },
  PAID: {
    value: "PAID",
    label: "Pagado",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    icon: CheckCircle2,
  },
  VOIDED: {
    value: "VOIDED",
    label: "Anulado",
    color: "text-red-600",
    bg: "bg-red-100",
    icon: Ban,
  },
};
// ==========================================
// 5. ESTADOS DE TAREAS Y DOCUMENTOS
// ==========================================
export const taskStatuses: Record<string, StatusConfig> = {
  PENDING: {
    value: "PENDING",
    label: "Pendiente",
    color: "text-amber-600",
    bg: "bg-amber-100",
    icon: Circle,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Completada",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    icon: CheckCircle2,
  },
};

export const signatureStatuses: Record<string, StatusConfig> = {
  MISSING: {
    value: "MISSING",
    label: "Falta Firma",
    color: "text-red-600",
    bg: "bg-red-100",
    icon: AlertCircle, 
  },
  SIGNED: {
    value: "SIGNED",
    label: "Firmado",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    icon: CheckCircle2,
  },
};
// ==========================================
// 6. ESTADOS DE DOCUMENTOS CLÍNICOS
// ==========================================
export const documentStatuses: Record<string, StatusConfig> = {
  DRAFT: {
    value: "DRAFT",
    label: "Faltan Firmas",
    color: "text-amber-600",
    bg: "bg-amber-100",
    icon: FileSignature,
  },
  PARTIAL: {
    value: "PARTIAL",
    label: "Firma Parcial",
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: PenTool,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Completado",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    icon: CheckCircle2,
  },
  VOIDED: {
    value: "VOIDED",
    label: "Anulado",
    color: "text-red-600",
    bg: "bg-red-100",
    icon: Trash2,
  },
};