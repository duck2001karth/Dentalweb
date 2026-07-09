"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ClipboardList, Search, Plus, 
  CircleDollarSign, Activity, ChevronRight, User, Loader2 
} from "lucide-react"

import { AppLayout } from "@/components/layouts/app-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const getPlanConfig = (status: string, total: number, paid: number) => {
  const debt = total - paid;
  const hasDebt = debt > 0 && status !== "DRAFT";

  return {
    badgeStatus: status === "COMPLETED" ? "Completado" : status === "ACTIVE" ? "En Ejecución" : "Diagnóstico",
    badgeColor: status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : status === "ACTIVE" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    financeText: hasDebt ? `Deuda: $${debt.toLocaleString()}` : status === "DRAFT" ? "Por Aprobar" : "Pagado",
    financeColor: hasDebt ? "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" : status === "DRAFT" ? "text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700" : "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
  }
}

export default function PlansTreatmentHubPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/treatments")
        if (res.ok) {
          const data = await res.json()
          setPlans(data)
        }
      } catch (error) {
        console.error("Error fetching plans:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const processedPlans = plans.map(plan => {
    const totalItems = plan.items?.length || 0
    const completedItems = plan.items?.filter((i: any) => i.isCompleted).length || 0
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    return {
      ...plan,
      progress
    }
  })

  const filteredPlans = processedPlans.filter(plan => 
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.patient?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.patient?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.patient?.ci.includes(searchTerm)
  )


  const globalPresupuesto = processedPlans.reduce((acc, plan) => acc + (plan.totalCost || 0), 0);
  const globalAbonado = processedPlans.reduce((acc, plan) => acc + (plan.totalPaid || 0), 0);
  const globalSaldo = globalPresupuesto - globalAbonado;

  return (
    <AppLayout>
      <div className="w-full px-4 md:px-6 py-6 lg:py-8 animate-in fade-in duration-500 flex flex-col min-h-[calc(100vh-70px)]">

        <div className="flex flex-col md:flex-row items-center justify-between bg-card px-6 py-6 md:py-8 rounded-2xl shadow-sm border border-border mb-8 gap-6 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#008bcd]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#008bcd] to-cyan-400 text-white rounded-2xl shadow-lg flex items-center justify-center shrink-0 rotate-3">
              <ClipboardList className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Planes de Tratamiento</h1>
              <p className="text-sm md:text-base text-muted-foreground font-medium mt-1">
                Ecosistema de control clínico y presupuestos de Carmo Dental.
              </p>
            </div>
          </div>
          
          <div className="flex w-full md:w-[400px] gap-3 relative z-10">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <Input 
                placeholder="Buscar paciente o plan..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 bg-background border-border h-11 rounded-xl shadow-sm focus-visible:ring-[#008bcd]"
              />
            </div>
            <Link href="/pacientes">
              <Button className="bg-[#008bcd] hover:bg-[#0070a8] text-white h-11 px-6 rounded-xl shadow-md font-bold shrink-0">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Plan
              </Button>
            </Link>
          </div>
        </div>

        {/* --- CUERPO: 2 COLUMNAS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
          
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border-l-4 border-l-[#008bcd] border-y border-r border-border shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-[#008bcd]" /> Flujo Financiero
              </h3>
              
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Presupuesto Total</p>
                <h2 className="text-4xl font-black text-foreground">${globalPresupuesto.toLocaleString()}</h2>
              </div>

              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-[#008bcd] rounded-full transition-all duration-1000" 
                  style={{ width: `${globalPresupuesto > 0 ? (globalAbonado / globalPresupuesto) * 100 : 0}%` }}
                ></div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-sm font-semibold text-muted-foreground">Abonado (Ingresos)</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">${globalAbonado.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-muted-foreground">Saldo por Cobrar</span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-500">${globalSaldo.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex items-start gap-4">
               <div className="p-2.5 bg-blue-500/10 text-[#008bcd] rounded-lg shrink-0">
                 <Activity className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-sm font-bold text-foreground">KPI de Aceptación</p>
                 <p className="text-xs text-muted-foreground font-medium mt-1">Los planes visuales aumentan la confianza del paciente en un 85%.</p>
               </div>
            </div>
          </div>
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <h3 className="text-lg font-black text-foreground mb-2">Planes Activos y Presupuestos</h3>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin text-[#008bcd] mb-4" />
                <p className="font-bold">Cargando planes de tratamiento...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-bold">No se encontraron planes de tratamiento.</p>
              </div>
            ) : (
              filteredPlans.map((plan) => {
                const config = getPlanConfig(plan.status, plan.totalCost, plan.totalPaid);

                return (
                  <div key={plan.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-[#008bcd]/30 transition-all flex flex-col sm:flex-row items-center gap-6 group">
                    
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md", config.badgeColor)}>
                          {config.badgeStatus}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground border border-border px-2 py-0.5 rounded-md">
                          ID: {plan.id.split("-")[0].toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-foreground leading-tight group-hover:text-[#008bcd] transition-colors">
                        {plan.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                          <User className="w-4 h-4 opacity-70" /> {plan.patient?.firstName} {plan.patient?.lastName}
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          CI: {plan.patient?.ci}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
                      
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Progreso</p>
                        <div 
                          className="w-14 h-14 rounded-full flex items-center justify-center relative shadow-inner"
                          style={{ background: `conic-gradient(#008bcd ${plan.progress}%, transparent 0)`, backgroundColor: "var(--muted)" }}
                        >
                          <div className="w-10 h-10 bg-card rounded-full flex items-center justify-center absolute">
                            <span className="text-xs font-black text-foreground">{plan.progress}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground text-right">Presupuesto</p>
                        <p className="text-lg font-black text-foreground text-right">${(plan.totalCost || 0).toLocaleString()}</p>
                        <div className={cn("px-2.5 py-1 text-xs font-bold rounded-lg border text-right mt-1 w-full", config.financeColor)}>
                          {config.financeText}
                        </div>
                      </div>

                      <Link href={`/paciente/${plan.patientId}?tab=planes`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 ml-2 rounded-xl border border-transparent hover:border-border hover:bg-muted text-muted-foreground hover:text-[#008bcd] transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </Link>

                    </div>
                  </div>
                );
              })
            )}

          </div>
        </div>

      </div>
    </AppLayout>
  )
}