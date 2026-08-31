import {
  CreditCard, Banknote, CheckCircle2, RotateCcw, XCircle, Ban, 
  AlertTriangle, Send, ShieldCheck, ShieldAlert, Wallet, Landmark, Circle, Building2
} from "lucide-react";
import { StatusConfig } from "./types";

export const paymentStatuses: Record<string, StatusConfig> = {
  PENDING: { value: "PENDING", label: "Pendiente", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/15 border-amber-500/20", icon: CreditCard },
  PARTIAL: { value: "PARTIAL", label: "Abono Parcial", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500/15 border-blue-500/20", icon: Banknote },
  COMPLETED: { value: "COMPLETED", label: "Completado", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20", icon: CheckCircle2 },
  PAID: { value: "PAID", label: "Pagado", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20", icon: CheckCircle2 },
  REFUNDED: { value: "REFUNDED", label: "Reembolsado", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-500/15 border-purple-500/20", icon: RotateCcw },
  FAILED: { value: "FAILED", label: "Fallido", color: "text-red-700 dark:text-red-400", bg: "bg-red-500/15 border-red-500/20", icon: XCircle },
  VOIDED: { value: "VOIDED", label: "Anulado", color: "text-slate-700 dark:text-slate-400", bg: "bg-slate-500/15 border-slate-500/20", icon: Ban },
};

export const taxDocumentStatuses: Record<string, StatusConfig> = {
  PENDING: { value: "PENDING", label: "Pendiente", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/15 border-amber-500/20", icon: AlertTriangle },
  RECEIVED: { value: "RECEIVED", label: "Recibido por SRI", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500/15 border-blue-500/20", icon: Send },
  AUTHORIZED: { value: "AUTHORIZED", label: "Autorizado", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20", icon: ShieldCheck },
  REJECTED: { value: "REJECTED", label: "No Autorizada", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-500/15 border-orange-500/20", icon: ShieldAlert },
  VOIDED: { value: "VOIDED", label: "Anulado", color: "text-red-700 dark:text-red-400", bg: "bg-red-500/15 border-red-500/20", icon: XCircle },
};

export const paymentMethods: Record<string, StatusConfig> = {
  CASH: { value: "CASH", label: "Efectivo", color: "text-emerald-700", bg: "bg-emerald-500/15", icon: Wallet },
  CREDIT_CARD: { value: "CREDIT_CARD", label: "T. Crédito", color: "text-blue-700", bg: "bg-blue-500/15", icon: CreditCard },
  DEBIT_CARD: { value: "DEBIT_CARD", label: "T. Débito", color: "text-cyan-700", bg: "bg-cyan-500/15", icon: CreditCard },
  TRANSFER: { value: "TRANSFER", label: "Transferencia", color: "text-indigo-700", bg: "bg-indigo-500/15", icon: Landmark },
  INSURANCE: { value: "INSURANCE", label: "Seguro/Convenio", color: "text-purple-700", bg: "bg-purple-500/15", icon: Building2 },
  OTHER: { value: "OTHER", label: "Otro", color: "text-slate-700", bg: "bg-slate-500/15", icon: Circle },
};