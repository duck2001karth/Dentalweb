"use client"

import React from "react"
import type { PaymentState, PaymentMethod } from "@/types/billing"

interface StatusBadgeProps {
  status: PaymentState | string
}

export function PaymentStatusBadge({ status }: StatusBadgeProps) {
  const s = (status || "COMPLETED").toUpperCase()
  
  switch (s) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Completado
        </span>
      )
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Pendiente
        </span>
      )
    case "REFUNDED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
          Reembolsado
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          Fallido
        </span>
      )
  }
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod | string }) {
  const m = (method || "CASH").toUpperCase()
  const map: Record<string, string> = {
    CASH: "Efectivo",
    EFECTIVO: "Efectivo",
    TRANSFER: "Transferencia / QR",
    TRANSFERENCIA: "Transferencia / QR",
    DEUNA: "DeUna / Transferencia",
    CREDIT_CARD: "T. Crédito",
    TARJETA_CREDITO: "T. Crédito",
    DEBIT_CARD: "T. Débito",
    TARJETA_DEBITO: "T. Débito",
    INSURANCE: "Seguro Médico",
    OTHER: "Otro"
  }

  return (
    <span className="px-2.5 py-1 rounded-lg bg-muted/60 text-foreground font-bold text-xs border border-border">
      {map[m] || method}
    </span>
  )
}