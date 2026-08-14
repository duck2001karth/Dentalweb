"use client"

import React from "react"
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"

interface FinancialBalanceViewProps {
  totalIncome: number
  totalRefunds: number
  netBalance: number
}

export function FinancialBalanceView({
  totalIncome = 0,
  totalRefunds = 0,
  netBalance = 0
}: FinancialBalanceViewProps) {
  return (
    <div className="space-y-6 font-sans antialiased">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#008bcd]" /> Estado de Cuenta y Balance Financiero
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Consolidado de ingresos brutos, devoluciones/ajustes y saldo neto percibido del paciente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* INGRESOS */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Total Cobrado</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground">Suma de todos los cobros regulares registrados</p>
        </div>

        {/* DEVOLUCIONES */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Notas de Crédito</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            ${totalRefunds.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground">Monto total reembolsado o ajustado</p>
        </div>

        {/* BALANCE NETO */}
        <div className="p-5 rounded-2xl bg-card border border-[#008bcd]/30 bg-[#008bcd]/5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#008bcd]">
            <span className="text-xs font-bold uppercase tracking-wider">Balance Neto</span>
            <div className="p-2 rounded-xl bg-[#008bcd]/15 text-[#008bcd]">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#008bcd]">
            ${netBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground">Ingreso real que ingresó a clínica</p>
        </div>
      </div>
    </div>
  )
}