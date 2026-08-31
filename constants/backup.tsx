import {
  CalendarClock, CheckCircle2, UserCheck, Stethoscope, CheckSquare,
  AlertCircle, XCircle, FileSignature, Activity, Archive, CreditCard,
  Banknote, Ban, Circle, PenTool, ShieldCheck, AlertTriangle,
  Send, RotateCcw, Building2, Wallet, Landmark, ShieldAlert,
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
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/15 border-blue-500/20",
    icon: CalendarClock,
  },
  CONFIRMED: {
    value: "CONFIRMED",
    label: "Confirmada",
    description: "El paciente ha confirmado su asistencia.",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/20",
    icon: CheckCircle2,
  },
  IN_WAITING_ROOM: {
    value: "IN_WAITING_ROOM",
    label: "En Sala de Espera",
    description: "El paciente ha llegado a la clínica.",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-500/15 border-purple-500/20",
    icon: UserCheck,
  },
  IN_PROGRESS: {
    value: "IN_PROGRESS",
    label: "En Consultorio",
    description: "El paciente está siendo atendido por el doctor.",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/20",
    icon: Stethoscope,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Atendido",
    description: "La consulta ha finalizado exitosamente.",
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-500/15 border-slate-500/20",
    icon: CheckSquare,
  },
  NO_SHOW: {
    value: "NO_SHOW",
    label: "No Asistió",
    description: "El paciente no se presentó a su cita.",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/20",
    icon: AlertCircle,
  },
  CANCELLED: {
    value: "CANCELLED",
    label: "Cancelada",
    description: "La cita fue cancelada por la clínica o el paciente.",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/15 border-red-500/20",
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
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-500/15 border-slate-500/20",
    icon: FileSignature,
  },
  ACCEPTED: {
    value: "ACCEPTED",
    label: "Aceptado",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/15 border-blue-500/20",
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    value: "IN_PROGRESS",
    label: "En Curso",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/20",
    icon: Activity,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Finalizado",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/20",
    icon: CheckSquare,
  },
  SUSPENDED: {
    value: "SUSPENDED",
    label: "Suspendido",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/15 border-red-500/20",
    icon: Archive,
  },
};

// ==========================================
// 3. ESTADOS ESPECÍFICOS DEL ODONTOGRAMA
// ==========================================
export const odontogramStatuses: Record<string, StatusConfig> = {
  CARIES: { value: "CARIES", label: "Caries", color: "text-red-500", bg: "bg-red-500/10", icon: () => <span>🔴</span> },
  FRACTURA: { value: "FRACTURA", label: "Fractura", color: "text-red-500", bg: "bg-red-500/10", icon: () => <span>⚡</span> },
  ENDO_INDICADA: { value: "ENDO_INDICADA", label: "Infección Pulpar", color: "text-red-500", bg: "bg-red-500/10", icon: () => <span>🔺</span> },
  REST_MALA: { value: "REST_MALA", label: "Restauración Defectuosa", color: "text-red-500", bg: "bg-red-500/10", icon: () => <span>⭕</span> },
  EXT_INDICADA: { value: "EXT_INDICADA", label: "Extracción Indicada", color: "text-red-500", bg: "bg-red-500/10", icon: () => <span>❌</span> },
  SELLANTE_MALO: { value: "SELLANTE_MALO", label: "Sellante Defectuoso", color: "text-red-500", bg: "bg-red-500/10", icon: () => <span className="font-bold">S</span> },
  REST_BUENA: { value: "REST_BUENA", label: "Restauración Buena", color: "text-blue-500", bg: "bg-blue-500/10", icon: () => <span>🔵</span> },
  CORONA_BUENA: { value: "CORONA_BUENA", label: "Corona Buena", color: "text-blue-500", bg: "bg-blue-500/10", icon: () => <span>🔘</span> },
  ENDO_REALIZADA: { value: "ENDO_REALIZADA", label: "Endodoncia Realizada", color: "text-blue-500", bg: "bg-blue-500/10", icon: () => <span>🔺</span> },
  EXT_REALIZADA: { value: "EXT_REALIZADA", label: "Ausente", color: "text-blue-500", bg: "bg-blue-500/10", icon: () => <span>❌</span> },
  SELLANTE_BUENO: { value: "SELLANTE_BUENO", label: "Sellante Bueno", color: "text-blue-500", bg: "bg-blue-500/10", icon: () => <span className="font-bold">S</span> },
};

// ==========================================
// 4. ESTADOS DE PAGOS / COBROS CLÍNICOS
// ==========================================
export const paymentStatuses: Record<string, StatusConfig> = {
  PENDING: {
    value: "PENDING",
    label: "Pendiente",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/20",
    icon: CreditCard,
  },
  PARTIAL: {
    value: "PARTIAL",
    label: "Abono Parcial",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/15 border-blue-500/20",
    icon: Banknote,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Completado",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/20",
    icon: CheckCircle2,
  },
  REFUNDED: {
    value: "REFUNDED",
    label: "Reembolsado",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-500/15 border-purple-500/20",
    icon: RotateCcw,
  },
  FAILED: {
    value: "FAILED",
    label: "Fallido",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/15 border-red-500/20",
    icon: XCircle,
  },
  VOIDED: {
    value: "VOIDED",
    label: "Anulado",
    color: "text-slate-700 dark:text-slate-400",
    bg: "bg-slate-500/15 border-slate-500/20",
    icon: Ban,
  },
};

// ==========================================
// 5. ESTADOS DE FACTURACIÓN ELECTRÓNICA (SRI)
// ==========================================
export const taxDocumentStatuses: Record<string, StatusConfig> = {
  PENDING: {
    value: "PENDING",
    label: "Pendiente",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/20",
    icon: AlertTriangle,
  },
  RECEIVED: {
    value: "RECEIVED",
    label: "Recibido por SRI",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/15 border-blue-500/20",
    icon: Send,
  },
  AUTHORIZED: {
    value: "AUTHORIZED",
    label: "Autorizado",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/20",
    icon: ShieldCheck,
  },
  REJECTED: {
    value: "REJECTED",
    label: "No Autorizada",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/20",
    icon: ShieldAlert,
  },
  VOIDED: {
    value: "VOIDED",
    label: "Anulado",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/15 border-red-500/20",
    icon: XCircle,
  },
};

// ==========================================
// 6. MEDIOS DE PAGO (SISTEMA FINANCIERO)
// ==========================================
export const paymentMethods: Record<string, StatusConfig> = {
  CASH: { value: "CASH", label: "Efectivo", color: "text-emerald-700", bg: "bg-emerald-500/15", icon: Wallet },
  CREDIT_CARD: { value: "CREDIT_CARD", label: "T. Crédito", color: "text-blue-700", bg: "bg-blue-500/15", icon: CreditCard },
  DEBIT_CARD: { value: "DEBIT_CARD", label: "T. Débito", color: "text-cyan-700", bg: "bg-cyan-500/15", icon: CreditCard },
  TRANSFER: { value: "TRANSFER", label: "Transferencia", color: "text-indigo-700", bg: "bg-indigo-500/15", icon: Landmark },
  INSURANCE: { value: "INSURANCE", label: "Seguro/Convenio", color: "text-purple-700", bg: "bg-purple-500/15", icon: Building2 },
  OTHER: { value: "OTHER", label: "Otro", color: "text-slate-700", bg: "bg-slate-500/15", icon: Circle },
};

export const documentStatuses: Record<string, StatusConfig> = {
  COMPLETED: { value: "COMPLETED", label: "Completado", color: "text-emerald-700", bg: "bg-emerald-500/15 border-emerald-500/20", icon: CheckCircle2 },
  PARTIAL: { value: "PARTIAL", label: "Firma Parcial", color: "text-blue-700", bg: "bg-blue-500/15 border-blue-500/20", icon: PenTool },
  DRAFT: { value: "DRAFT", label: "Faltan Firmas", color: "text-amber-700", bg: "bg-amber-500/15 border-amber-500/20", icon: FileSignature },
  VOIDED: { value: "VOIDED", label: "Anulado", color: "text-red-700", bg: "bg-red-500/15 border-red-500/20", icon: Ban },
};