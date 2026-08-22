"use client"

import React, { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { AdminHeroBanner } from "@/components/admin/admin-hero-banner"
import { ClinicalKPIs } from "@/components/admin/dashboard/clinical-kpis"
import { IncomeEvolutionChart } from "@/components/admin/dashboard/evolution-chart"
import { InfrastructureHealth } from "@/components/admin/dashboard/infrastructure"
import { RecentAuditLogs } from "@/components/admin/dashboard/audit-logs"

export default function AdminPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/admin/dashboard")
        if (res.ok) setData(await res.json())
      } catch (error) {
        console.error("Error al cargar dashboard admin:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-[#008bcd]">
        <Loader2 className="w-10 h-10 animate-spin mb-3 stroke-[2.5]" />
        <p className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
          Cargando suite ejecutiva...
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 font-sans antialiased animate-in fade-in duration-200">
      
      {/* 1. HERO BANNER EJECUTIVO INTELIGENTE */}
      <AdminHeroBanner
        userName={session?.user?.name || "Administrador"}
        todayIncome={data.stats.todayIncome}
        todayAppointments={data.stats.todayAppointments}
        activeAgreements={data.stats.activeAgreements}
      />

      {/* 2. BLOQUE DE KPIS CLÍNICOS AVANZADOS */}
      <ClinicalKPIs
      income={data.stats.income}
      incomeGrowth={data.stats.incomeGrowth}
      patients={data.stats.patients}
      patientsGrowth={data.stats.patientsGrowth}
      acceptanceRate={data.stats.acceptanceRate}
      totalAccountsReceivable={data.stats.totalAccountsReceivable}
      averageTicket={data.stats.averageTicket}
      payingPatientsCount={data.stats.payingPatientsCount}
    />

      {/* 3. GRÁFICA COMPARATIVA + INFRAESTRUCTURA Y AUDITORÍA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICA DE DOBLE CURVA (2 COLUMNAS) */}
        <div className="lg:col-span-2">
          <IncomeEvolutionChart chartPeriods={data.chartPeriods} />
        </div>

        {/* COLUMNA DERECHA: INFRAESTRUCTURA + AUDITORÍA */}
        <div className="space-y-6">
          <InfrastructureHealth />
          <RecentAuditLogs logs={data.recentActivity} />
        </div>

      </div>

    </div>
  )
}