"use client"

import React, { useState, useEffect } from "react"
import { CreditCard, TrendingUp, AlertCircle, ArrowUpRight, Loader2 } from "lucide-react"
import { AppLayout } from "@/components/layouts/app-layout"
import BillingTab from "@/components/clinic-management/billing/billing-tab"
import { format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { useClinicSettings } from "@/config/clinic-settings"

export default function FacturacionPage() {
  const currentMonth = format(new Date(), "MMMM", { locale: es })
  const { settings } = useClinicSettings()
  const currencySymbol = (settings as any)?.currencySymbol || "$"

  const [monthlyIncome, setMonthlyIncome] = useState<number>(0)
  const [totalDebt, setTotalDebt] = useState<number>(0)
  const [debtorsCount, setDebtorsCount] = useState<number>(0)
  const [isLoadingKpis, setIsLoadingKpis] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    const fetchExecutiveKpis = async () => {
      setIsLoadingKpis(true)
      try {
        const debtsRes = await fetch("/api/payments/debts")
        let debtSum = 0
        let dCount = 0
        if (debtsRes.ok) {
          const debtsData = await debtsRes.json()
          const debtsList = debtsData.debts || []
          dCount = debtsList.length
          debtSum = debtsList.reduce((acc: number, curr: any) => acc + Number(curr.pendingBalance || 0), 0)
        }

        const payRes = await fetch("/api/payments")
        let incomeSum = 0
        if (payRes.ok) {
          const payData = await payRes.json()
          const payList = Array.isArray(payData) ? payData : (payData.payments || [])
          const monthStart = startOfMonth(new Date())

          incomeSum = payList.reduce((acc: number, p: any) => {
            const isCompleted = p.status === "COMPLETED"
            const isNotVoided = !(typeof p.notes === "string" && p.notes.includes("[PAGO ELIMINADO"))
            const pDate = p.createdAt ? new Date(p.createdAt) : null
            const isThisMonth = pDate && pDate >= monthStart

            if (isCompleted && isNotVoided && isThisMonth) {
              return acc + Number(p.amount || 0)
            }
            return acc
          }, 0)
        }

        if (isMounted) {
          setTotalDebt(debtSum)
          setDebtorsCount(dCount)
          setMonthlyIncome(incomeSum)
        }
      } catch (error) {
        console.error("Error cargando KPIs ejecutivos:", error)
      } finally {
        if (isMounted) setIsLoadingKpis(false)
      }
    }

    fetchExecutiveKpis()

    return () => { isMounted = false }
  }, [])

  const formatCurrencyParts = (amount: number) => {
    const formatted = amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const [integerPart, decimalPart] = formatted.split(".")
    return { integerPart, decimalPart }
  }

  const incomeParts = formatCurrencyParts(monthlyIncome)
  const debtParts = formatCurrencyParts(totalDebt)

  return (
    <AppLayout>
      <div className="w-full px-4 md:px-6 py-6 lg:py-8 animate-in fade-in duration-500 flex flex-col min-h-[calc(100vh-6rem)] font-sans">
        
        {/* BANNER EJECUTIVO PREMIUM */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8 bg-card p-6 md:p-8 rounded-[32px] border border-border shadow-xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#008bcd]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          {/* IZQUIERDA: TÍTULO E ÍCONO */}
          <div className="flex items-center gap-5 relative z-10 w-full lg:w-auto">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr from-[#008bcd] to-cyan-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#008bcd]/20 shrink-0 rotate-3 transition-transform hover:rotate-0">
              <CreditCard className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                Gestión de Facturación
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm md:text-sm font-medium max-w-md leading-relaxed">
                Panel central de control de ingresos, conciliación de terminales POS y auditoría de cartera.
              </p>
            </div>
          </div>
          
          {/* DERECHA: MACRO KPIs REALES */}
          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full lg:w-auto">
            
            {/* KPI 1: Ingresos del Mes */}
            <div className="bg-background/60 backdrop-blur-xl border border-border/80 p-4 rounded-2xl flex items-center gap-4 w-full sm:w-auto shadow-2xs min-w-[200px]">
              {isLoadingKpis ? (
                <div className="flex items-center justify-center w-full h-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#008bcd]" />
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Ingresos • <span className="text-[#008bcd]">{currentMonth}</span>
                    </p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <h3 className="text-2xl font-black text-foreground tracking-tight font-mono">
                        {currencySymbol}{incomeParts.integerPart}
                        <span className="text-muted-foreground text-lg">.{incomeParts.decimalPart}</span>
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-3 h-3" /> Cierre en tiempo real
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                  </div>
                </>
              )}
            </div>

            {/* KPI 2: Alerta de Cartera Vencida */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 w-full sm:w-auto shadow-2xs min-w-[200px]">
              {isLoadingKpis ? (
                <div className="flex items-center justify-center w-full h-12">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
                      Cartera Vencida
                    </p>
                    <h3 className="text-xl font-black text-amber-700 dark:text-amber-400 tracking-tight font-mono mt-1">
                      {currencySymbol}{debtParts.integerPart}.{debtParts.decimalPart}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1">
                      {debtorsCount} {debtorsCount === 1 ? 'paciente' : 'pacientes'} con deuda
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* CONTENIDO DE TABS */}
        <BillingTab />

      </div>
    </AppLayout>
  )
}