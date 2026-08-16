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
  ShieldCheck,
  AlertTriangle,
  Send,
  RotateCcw,
  Building2,
  Wallet,
  Landmark,
  ShieldAlert,
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
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-950/50",
    icon: CalendarClock,
  },
  CONFIRMED: {
    value: "CONFIRMED",
    label: "Confirmada",
    description: "El paciente ha confirmado su asistencia.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-950/50",
    icon: CheckCircle2,
  },
  IN_WAITING_ROOM: {
    value: "IN_WAITING_ROOM",
    label: "En Sala de Espera",
    description: "El paciente ha llegado a la clínica.",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-950/50",
    icon: UserCheck,
  },
  IN_PROGRESS: {
    value: "IN_PROGRESS",
    label: "En Consultorio",
    description: "El paciente está siendo atendido por el doctor.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-950/50",
    icon: Stethoscope,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Atendido",
    description: "La consulta ha finalizado exitosamente.",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    icon: CheckSquare,
  },
  NO_SHOW: {
    value: "NO_SHOW",
    label: "No Asistió",
    description: "El paciente no se presentó a su cita.",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-950/50",
    icon: AlertCircle,
  },
  CANCELLED: {
    value: "CANCELLED",
    label: "Cancelada",
    description: "La cita fue cancelada por la clínica o el paciente.",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-950/50",
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
    bg: "bg-slate-500/10 dark:bg-slate-500/20 border-slate-500/20",
    icon: FileSignature,
  },
  ACCEPTED: {
    value: "ACCEPTED",
    label: "Aceptado por Paciente",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/25",
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    value: "IN_PROGRESS",
    label: "En Curso",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/25",
    icon: Activity,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Finalizado",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/25",
    icon: CheckSquare,
  },
  SUSPENDED: {
    value: "SUSPENDED",
    label: "Suspendido",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/10 dark:bg-red-500/20 border-red-500/25",
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
// 4. ESTADOS DE PAGOS / COBROS CLÍNICOS
// ==========================================
export const paymentStatuses: Record<string, StatusConfig> = {
  PENDING: {
    value: "PENDING",
    label: "Pendiente",
    description: "Pago pendiente de cobro o registro.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    icon: CreditCard,
  },
  PARTIAL: {
    value: "PARTIAL",
    label: "Abono Parcial",
    description: "Cobro parcial aplicado al tratamiento.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    icon: Banknote,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Completado",
    description: "Pago recibido y procesado en caja.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: CheckCircle2,
  },
  PAID: {
    value: "PAID",
    label: "Pagado",
    description: "Tratamiento o prestación saldada.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: CheckCircle2,
  },
  REFUNDED: {
    value: "REFUNDED",
    label: "Reembolsado / Nota de Crédito",
    description: "Valor devuelto al paciente o saldo reabierto.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/15",
    icon: RotateCcw,
  },
  FAILED: {
    value: "FAILED",
    label: "Fallido",
    description: "Transacción rechazada por el medio de pago.",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    icon: XCircle,
  },
  VOIDED: {
    value: "VOIDED",
    label: "Eliminado / Anulado",
    description: "Pago anulado o dado de baja de caja.",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
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
    description: "Comprobante generado, en espera de envío o autorización.",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/15",
    icon: AlertTriangle,
  },
  RECEIVED: {
    value: "RECEIVED",
    label: "Recibido por SRI",
    description: "Comprobante receptado en los servidores del SRI.",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/15",
    icon: Send,
  },
  AUTHORIZED: {
    value: "AUTHORIZED",
    label: "Autorizado",
    description: "Comprobante tributario válido y autorizado por el SRI.",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/15",
    icon: ShieldCheck,
  },
  REJECTED: {
    value: "REJECTED",
    label: "Devuelta / No Autorizada",
    description: "El SRI rechazó el comprobante por inconsistencias.",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-500/15",
    icon: ShieldAlert,
  },
  VOIDED: {
    value: "VOIDED",
    label: "Anulado",
    description: "Documento fiscal dado de baja en el sistema.",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/15",
    icon: XCircle,
  },
};

// ==========================================
// 6. MEDIOS DE PAGO (SISTEMA FINANCIERO)
// ==========================================
export const paymentMethods: Record<string, StatusConfig> = {
  CASH: {
    value: "CASH",
    label: "Efectivo",
    description: "Pago directo en ventanilla/recepción.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: Wallet,
  },
  CREDIT_CARD: {
    value: "CREDIT_CARD",
    label: "Tarjeta de Crédito",
    description: "Cobro por Datafast / Medianet / POS.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    icon: CreditCard,
  },
  DEBIT_CARD: {
    value: "DEBIT_CARD",
    label: "Tarjeta de Débito",
    description: "Cobro directo por tarjeta de débito.",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    icon: CreditCard,
  },
  TRANSFER: {
    value: "TRANSFER",
    label: "Transferencia / Depósito",
    description: "Transferencia bancaria directa o interbancaria.",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    icon: Landmark,
  },
  INSURANCE: {
    value: "INSURANCE",
    label: "Seguro / Convenio",
    description: "Cobertura médica o aseguradora privada.",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    icon: Building2,
  },
  OTHER: {
    value: "OTHER",
    label: "Otro Medio",
    description: "Cheques u otros acuerdos de pago.",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10",
    icon: Circle,
  },
};

// ==========================================
// 7. ESTADOS DE TAREAS Y DOCUMENTOS
// ==========================================
export const taskStatuses: Record<string, StatusConfig> = {
  PENDING: {
    value: "PENDING",
    label: "Pendiente",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-950/50",
    icon: Circle,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Completada",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-950/50",
    icon: CheckCircle2,
  },
};

export const signatureStatuses: Record<string, StatusConfig> = {
  MISSING: {
    value: "MISSING",
    label: "Falta Firma",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-950/50",
    icon: AlertCircle, 
  },
  SIGNED: {
    value: "SIGNED",
    label: "Firmado",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-950/50",
    icon: CheckCircle2,
  },
};

// ==========================================
// 8. ESTADOS DE DOCUMENTOS CLÍNICOS
// ==========================================
export const documentStatuses: Record<string, StatusConfig> = {
  COMPLETED: {
    value: "COMPLETED",
    label: "Completado",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/25",
    icon: CheckCircle2,
  },
  PARTIAL: {
    value: "PARTIAL",
    label: "Firma Parcial",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/25",
    icon: PenTool,
  },
  DRAFT: {
    value: "DRAFT",
    label: "Faltan Firmas",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/25",
    icon: FileSignature,
  },
  VOIDED: {
    value: "VOIDED",
    label: "Anulado",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/10 dark:bg-red-500/20 border-red-500/25",
    icon: Ban,
  },
}