"use client"

import React, { useState, useMemo } from "react"
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, Wallet, 
  Printer, PieChart, CreditCard, Banknote, 
  ArrowRightLeft, AlertCircle, CheckCircle2, TrendingUp,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useGetPatient } from "@/hooks/patients"
import { BalancePrint } from "@/components/patients-file/payments/balance-print"

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase()
  switch (m) {
    case "CASH":
    case "EFECTIVO":
      return "Efectivo"
    case "CREDIT_CARD":
    case "TARJETA_CREDITO":
      return "Tarjeta de Crédito"
    case "DEBIT_CARD":
    case "TARJETA_DEBITO":
      return "Tarjeta de Débito"
    case "TRANSFER":
    case "TRANSFERENCIA":
    case "NEQUI":
      return "Transferencia Bancaria"
    case "CHECK":
    case "CHEQUE":
      return "Cheque"
    default:
      return method
  }
}
const calculateAge = (birthDateString?: string | Date | null) => {
  if (!birthDateString) return "--"
  const today = new Date()
  const birthDate = new Date(birthDateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

interface PaymentBreakdown {
  method: string
  amount: number
  percentage: number
}

interface FinancialBalanceViewProps {
  patientId?: string
  patientData?: any
  totalBudget?: number
  totalIncome: number
  totalRefunds: number
  netBalance: number
  payments?: any[]
  refunds?: any[]
  patientName?: string
  patientDocId?: string
  patientAge?: string | number
}

export function FinancialBalanceView({
  patientId = "",
  patientData,
  totalBudget = 0,
  totalIncome = 0,
  totalRefunds = 0,
  netBalance = 0,
  payments = [],
  refunds = [],
  patientName,
  patientDocId,
  patientAge,
}: FinancialBalanceViewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const { patient: fetchedPatient } = useGetPatient(patientId)
  const currentPatient = patientData?.patient || patientData || fetchedPatient || {}

  const resolvedPatientFullName = 
    patientName || 
    (currentPatient?.firstName ? `${currentPatient.firstName} ${currentPatient.lastName || ""}`.trim() : "Paciente Registrado")

  const resolvedDocId = 
    patientDocId || 
    currentPatient?.ci || 
    currentPatient?.identification || 
    currentPatient?.dni || 
    "No registrado"

  const resolvedAge = 
    patientAge || 
    calculateAge(currentPatient?.birthDate)
  const effectiveBudget = totalBudget > 0 ? totalBudget : totalIncome
  const pendingDebt = Math.max(0, effectiveBudget - netBalance)
  const paymentProgress = effectiveBudget > 0 ? Math.min(100, Math.round((netBalance / effectiveBudget) * 100)) : 100
  const methodTotals = payments.reduce((acc: any, p: any) => {
    const method = (p.method || p.paymentMethod || "CASH").toUpperCase()
    const amt = Number(p.amount || p.paidAmount || 0)
    acc[method] = (acc[method] || 0) + amt
    return acc
  }, {})

  const breakdownList: PaymentBreakdown[] = Object.entries(methodTotals).map(([method, amount]: any) => ({
    method,
    amount,
    percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0
  }))

  const getMethodLabel = (m: string) => {
    switch (m) {
      case "CASH":
      case "EFECTIVO":
        return { label: "Efectivo", icon: Banknote, color: "text-emerald-600 bg-emerald-500/10" }
      case "TRANSFER":
      case "TRANSFERENCIA":
      case "NEQUI":
        return { label: "Transferencia", icon: ArrowRightLeft, color: "text-blue-600 bg-blue-500/10" }
      case "CREDIT_CARD":
      case "DEBIT_CARD":
      case "TARJETA_CREDITO":
      case "TARJETA_DEBITO":
        return { label: "Tarjeta", icon: CreditCard, color: "text-purple-600 bg-purple-500/10" }
      default:
        return { label: m, icon: DollarSign, color: "text-slate-600 bg-slate-500/10" }
    }
  }
  const unifiedTransactions = useMemo(() => {
    return [
      ...payments.map(p => ({
        id: p.id,
        type: "INCOME",
        date: p.createdAt ? new Date(p.createdAt) : new Date(),
        number: p.paymentNumber || p.receiptNumber || p.number || `#REC-${p.id?.slice(-6) || "PAGO"}`,
        description: p.treatmentPlan?.name || p.concept || p.treatmentName || "Abono / Pago de Tratamiento",
        method: formatPaymentMethod(p.method || p.paymentMethod),
        amount: Number(p.amount || p.paidAmount || 0)
      })),
      ...refunds.map(r => ({
        id: r.id,
        type: "REFUND",
        date: r.createdAt ? new Date(r.createdAt) : new Date(),
        number: r.refundNumber || r.number || `#NC-${r.id?.slice(-6) || "DEV"}`,
        description: r.reason || r.concept || "Nota de Crédito / Reembolso",
        method: formatPaymentMethod(r.method),
        amount: -Math.abs(Number(r.amount || 0))
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [payments, refunds])
  const totalItems = unifiedTransactions.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return unifiedTransactions.slice(startIndex, startIndex + pageSize)
  }, [unifiedTransactions, currentPage, pageSize])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val))
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6 font-sans antialiased animate-in fade-in duration-200">
      <BalancePrint
        patientFullName={resolvedPatientFullName}
        patientDocId={resolvedDocId}
        patientAge={resolvedAge}
        totalIncome={totalIncome}
        totalRefunds={totalRefunds}
        netBalance={netBalance}
        pendingDebt={pendingDebt}
        transactions={unifiedTransactions}
        issuedBy="Caja / Recaudación"
      />

      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs w-full">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#008bcd]" /> Estado de Cuenta y Balance Financiero
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consolidado de ingresos brutos, devoluciones/ajustes y saldo neto percibido del paciente.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="h-10 text-xs font-bold rounded-xl border-border bg-background hover:bg-muted text-foreground w-full sm:w-auto cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 mr-1.5" /> Imprimir Estado
        </Button>
      </div>
      {/* TARJETAS DE TOTALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">       
        {/* TOTAL COBRADO */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Total Cobrado</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground">Suma de todos los cobros registrados</p>
        </div>

        {/* NOTAS DE CRÉDITO */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-2">
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

        {/* SALDO PENDIENTE */}
        <div className={cn(
          "p-5 rounded-2xl bg-card border shadow-xs space-y-2",
          pendingDebt > 0 ? "border-rose-500/30 bg-rose-500/5" : "border-emerald-500/30 bg-emerald-500/5"
        )}>
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xs font-bold uppercase tracking-wider",
              pendingDebt > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            )}>
              {pendingDebt > 0 ? "Saldo Pendiente" : "Estado Financiero"}
            </span>
            <div className={cn(
              "p-2 rounded-xl",
              pendingDebt > 0 ? "bg-rose-500/15 text-rose-600" : "bg-emerald-500/15 text-emerald-600"
            )}>
              {pendingDebt > 0 ? <AlertCircle className="w-4 h-4 stroke-[2.5]" /> : <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
            </div>
          </div>
          <p className={cn(
            "text-2xl font-black",
            pendingDebt > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
          )}>
            {pendingDebt > 0 ? `$${pendingDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Al Día"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {pendingDebt > 0 ? "Saldo por liquidar del tratamiento" : "Tratamiento 100% saldado"}
          </p>
        </div>

      </div>
      {/* COBERTURA Y MÉTODOS DE PAGO */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <div className="md:col-span-6 p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-[#008bcd]" /> Cobertura del Presupuesto
              </span>
              <span className="text-sm font-black text-[#008bcd]">{paymentProgress}%</span>
            </div>
            <Progress value={paymentProgress} className="h-2.5 rounded-full bg-muted" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/70 text-xs">
            <div>
              <p className="text-muted-foreground text-[11px]">Presupuesto Estimado</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                ${effectiveBudget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[11px]">Pagado Real</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ${netBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="md:col-span-6 p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider mb-1">
            <PieChart className="w-4 h-4 text-[#008bcd]" /> Métodos de Pago Utilizados
          </span>

          {breakdownList.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4">No hay pagos registrados para desglosar.</p>
          ) : (
            <div className="space-y-2.5">
              {breakdownList.map((item, idx) => {
                const conf = getMethodLabel(item.method)
                const Icon = conf.icon
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-lg", conf.color)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-foreground">{conf.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-[11px] font-medium">{item.percentage}%</span>
                      <span className="font-bold text-foreground min-w-[70px] text-right">
                        ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {/* TABLA CONSOLIDADA CON PAGINACIÓN */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-4 bg-muted/20 border-b border-border flex items-center justify-between">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Movimientos y Registro de Caja del Paciente
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            {totalItems} transacciones
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4"># Comprobante</th>
                <th className="py-3.5 px-4">Concepto / Detalle</th>
                <th className="py-3.5 px-4">Medio</th>
                <th className="py-3.5 px-4 text-center">Tipo</th>
                <th className="py-3.5 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    Sin movimientos financieros registrados.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx, idx) => {
                  const isIncome = tx.type === "INCOME"
                  return (
                    <tr key={tx.id || idx} className="hover:bg-muted/15 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-muted-foreground whitespace-nowrap">
                        {format(tx.date, "dd MMM yyyy • HH:mm", { locale: es })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#008bcd]">
                        {tx.number}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-medium">
                        {tx.method}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          isIncome 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        )}>
                          {isIncome ? "Ingreso" : "Ajuste / NC"}
                        </span>
                      </td>
                      <td className={cn(
                        "py-3.5 px-4 font-bold text-right text-sm whitespace-nowrap",
                        isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      )}>
                        {isIncome ? "+" : "-"}${Math.abs(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-muted/15 border-t border-border text-xs">
            <div className="flex items-center gap-3 text-muted-foreground font-medium">
              <span>
                Mostrando <b className="text-foreground">{(currentPage - 1) * pageSize + 1}</b> a <b className="text-foreground">{Math.min(currentPage * pageSize, totalItems)}</b> de <b className="text-foreground">{totalItems}</b> movimientos
              </span>

              <div className="hidden sm:flex items-center gap-2 border-l border-border pl-3">
                <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Filas:</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-8 w-18 rounded-lg bg-background text-xs font-bold border-border">
                    <SelectValue placeholder="5" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="5" className="text-xs font-semibold">5</SelectItem>
                    <SelectItem value="10" className="text-xs font-semibold">10</SelectItem>
                    <SelectItem value="20" className="text-xs font-semibold">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border bg-background"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                title="Primera página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border bg-background"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="px-3 py-1 bg-background border border-border rounded-lg font-bold text-foreground text-xs">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border bg-background"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border bg-background"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}