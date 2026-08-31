import {
  FileSignature, CheckCircle2, Activity, CheckSquare, Archive, PenTool, Ban, AlertCircle
} from "lucide-react";
import { StatusConfig } from "./types";

export const treatmentStatuses: Record<string, StatusConfig> = {
  DRAFT: { value: "DRAFT", label: "Presupuestado", color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-500/15 border-slate-500/20", icon: FileSignature },
  ACCEPTED: { value: "ACCEPTED", label: "Aceptado", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500/15 border-blue-500/20", icon: CheckCircle2 },
  IN_PROGRESS: { value: "IN_PROGRESS", label: "En Curso", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/15 border-amber-500/20", icon: Activity },
  COMPLETED: { value: "COMPLETED", label: "Finalizado", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20", icon: CheckSquare },
  SUSPENDED: { value: "SUSPENDED", label: "Suspendido", color: "text-red-700 dark:text-red-400", bg: "bg-red-500/15 border-red-500/20", icon: Archive },
};

export const documentStatuses: Record<string, StatusConfig> = {
  COMPLETED: { value: "COMPLETED", label: "Completado", color: "text-emerald-700", bg: "bg-emerald-500/15 border-emerald-500/20", icon: CheckCircle2 },
  PARTIAL: { value: "PARTIAL", label: "Firma Parcial", color: "text-blue-700", bg: "bg-blue-500/15 border-blue-500/20", icon: PenTool },
  DRAFT: { value: "DRAFT", label: "Faltan Firmas", color: "text-amber-700", bg: "bg-amber-500/15 border-amber-500/20", icon: FileSignature },
  VOIDED: { value: "VOIDED", label: "Anulado", color: "text-red-700", bg: "bg-red-500/15 border-red-500/20", icon: Ban },
};

export const signatureStatuses: Record<string, StatusConfig> = {
  MISSING: { value: "MISSING", label: "Falta Firma", color: "text-red-700 dark:text-red-400", bg: "bg-red-500/15 border-red-500/20", icon: AlertCircle },
  SIGNED: { value: "SIGNED", label: "Firmado", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20", icon: CheckCircle2 },
};

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