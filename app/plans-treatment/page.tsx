"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  ClipboardList, Search, Plus, 
  CircleDollarSign, Activity, ChevronRight, User, Loader2, Clock, Filter 
} from "lucide-react"

import { AppLayout } from "@/components/layouts/app-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const getPlanConfig = (status: string, total: number, paid: number) => {
  const debt = total - paid
  const hasDebt = debt > 0 && status !== "DRAFT"

  return {
    badgeStatus: status === "COMPLETED" ? "Completado" : status === "ACTIVE" ? "En Ejecución" : "Borrador",
    badgeColor: status === "COMPLETED" 
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
      : status === "ACTIVE" 
      ? "bg-[#008bcd]/10 text-[#008bcd] border-[#008bcd]/20" 
      : "bg-muted text-muted-foreground border-border",
    financeText: hasDebt 
      ? `Saldo: $${debt.toLocaleString("en-US", { minimumFractionDigits: 2 })}` 
      : status === "DRAFT" 
      ? "Por Aprobar" 
      : "$ Pagado",
    financeColor: hasDebt 
      ? "text-amber-600 bg-amber-500/10 border-amber-500/20" 
      : status === "DRAFT" 
      ? "text-muted-foreground bg-muted border-border" 
      : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  }
}

export default function PlansTreatmentHubPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL") 

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/treatments")
        if (res.ok) {
          const data = await res.json()
          setPlans(data || [])
        }
      } catch (error) {
        console.error("Error cargando los tratamientos:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const processedPlans = useMemo(() => {
    return plans.map(plan => {
      const totalItems = plan.items?.length || 0
      const completedItems = plan.items?.filter((i: any) => i.isCompleted || i.progress === 100).length || 0
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

      return {
        ...plan,
        progress
      }
    })
  }, [plans])

  const filteredPlans = useMemo(() => {
    return processedPlans.filter(plan => {
      const matchesSearch = 
        plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.patient?.ci?.includes(searchTerm)

      const matchesStatus = 
        selectedStatus === "ALL" ? true : plan.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [processedPlans, searchTerm, selectedStatus])

  const globalPresupuesto = processedPlans.reduce((acc, plan) => acc + (plan.totalCost || 0), 0)
  const globalAbonado = processedPlans.reduce((acc, plan) => acc + (plan.totalPaid || 0), 0)
  const globalSaldo = Math.max(0, globalPresupuesto - globalAbonado)

  return (
    <AppLayout>
      <div className="w-full px-4 md:px-6 py-6 lg:py-8 animate-in fade-in duration-500 flex flex-col min-h-[calc(100vh-70px)]">
        <div className="flex flex-col md:flex-row items-center justify-between bg-card px-6 py-6 md:py-8 rounded-2xl shadow-xs border border-border mb-8 gap-6 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#008bcd]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#008bcd] to-cyan-400 text-white rounded-2xl shadow-md flex items-center justify-center shrink-0 rotate-3">
              <ClipboardList className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Planes de Tratamiento</h1>
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
                className="w-full pl-10 bg-background border-border h-11 rounded-xl shadow-xs focus-visible:ring-[#008bcd]"
              />
            </div>
            <Link href="/pacientes">
              <Button className="bg-[#008bcd] hover:bg-[#0070a8] text-white h-11 px-6 rounded-xl shadow-md font-bold shrink-0">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Plan
              </Button>
            </Link>
          </div>
        </div>

        {/* ESTRUCTURA PRINCIPAL DE 2 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
          
          {/* COLUMNA IZQUIERDA: RESUMEN FINANCIERO */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="bg-card rounded-2xl p-6 border-l-4 border-l-[#008bcd] border-y border-r border-border shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-[#008bcd]" /> Flujo Financiero Global
              </h3>
              
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Presupuesto Total</p>
                <h2 className="text-3xl font-black text-foreground">
                  ${globalPresupuesto.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </h2>
              </div>

              <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-[#008bcd] rounded-full transition-all duration-1000" 
                  style={{ width: `${globalPresupuesto > 0 ? (globalAbonado / globalPresupuesto) * 100 : 0}%` }}
                ></div>
              </div>

              <div className="space-y-4 text-xs font-medium">
                <div className="flex justify-between items-center pb-3 border-b border-border/60">
                  <span className="text-muted-foreground">Abonado (Ingresos)</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ${globalAbonado.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Saldo por Cobrar</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-500">
                    ${globalSaldo.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-xs flex items-start gap-3.5">
              <div className="p-2.5 bg-[#008bcd]/10 text-[#008bcd] rounded-xl shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">KPI de Aceptación</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Los planes explicados visualmente aumentan la tasa de conversión en consulta.
                </p>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: LISTADO Y FILTROS */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            
            {/* BARRA DE BOTONES DE FILTRADO POR ESTADO */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-2 rounded-xl border border-border">
              <div className="flex items-center gap-1">
                {[
                  { id: "ALL", label: "Todos" },
                  { id: "ACTIVE", label: "En Ejecución" },
                  { id: "DRAFT", label: "Borradores" },
                  { id: "COMPLETED", label: "Finalizados" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedStatus(tab.id)}
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-lg transition-all",
                      selectedStatus === tab.id
                        ? "bg-[#008bcd] text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="text-xs font-bold text-muted-foreground pr-2">
                {filteredPlans.length} {filteredPlans.length === 1 ? "Tratamiento" : "Tratamientos"}
              </span>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mb-3" />
                <p className="font-bold text-xs">Cargando planes de tratamiento...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20 text-[#008bcd]" />
                <p className="font-bold text-sm text-foreground">No se encontraron tratamientos.</p>
                <p className="text-xs mt-1">Intente cambiar el filtro de búsqueda o el estado seleccionado.</p>
              </div>
            ) : (
              filteredPlans.map((plan) => {
                const config = getPlanConfig(plan.status, plan.totalCost, plan.totalPaid)

                return (
                  <div 
                    key={plan.id} 
                    className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-[#008bcd]/40 transition-all flex flex-col sm:flex-row items-center gap-6 group"
                  >
                    
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border", config.badgeColor)}>
                          {config.badgeStatus}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground border border-border px-2 py-0.5 rounded-md">
                          ID: #{plan.id.slice(-6).toUpperCase()}
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-foreground leading-tight group-hover:text-[#008bcd] transition-colors">
                        {plan.name}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <User className="w-3.5 h-3.5 text-[#008bcd]" /> {plan.patient?.firstName} {plan.patient?.lastName}
                        </div>
                        <div className="font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md text-[11px]">
                          C.I.: {plan.patient?.ci || "Sin registrar"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6 justify-between sm:justify-end">
                      
                      {/* PROGRESO */}
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Progreso</p>
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center relative shadow-xs"
                          style={{ background: `conic-gradient(#008bcd ${plan.progress}%, transparent 0)`, backgroundColor: "var(--muted)" }}
                        >
                          <div className="w-9 h-9 bg-card rounded-full flex items-center justify-center absolute">
                            <span className="text-[10px] font-black text-foreground">{plan.progress}%</span>
                          </div>
                        </div>
                      </div>

                      {/* PRESUPUESTO */}
                      <div className="flex flex-col gap-1 min-w-[120px] text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Presupuesto</p>
                        <p className="text-base font-extrabold text-foreground">
                          ${(plan.totalCost || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        <div className={cn("px-2 py-0.5 text-[11px] font-bold rounded-md border text-right mt-0.5 w-full", config.financeColor)}>
                          {config.financeText}
                        </div>
                      </div>

                      {/* ABRIR PLAN */}
                      <Link href={`/paciente/${plan.patientId}?tab=planes&planId=${plan.id}`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border hover:bg-[#008bcd] hover:text-white transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </Link>

                    </div>
                  </div>
                )
              })
            )}

          </div>
        </div>

      </div>
    </AppLayout>
  )
}