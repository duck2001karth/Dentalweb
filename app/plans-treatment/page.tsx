"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity, ChevronRight, CircleDollarSign, ClipboardList,
  Loader2, Plus, Search, User,
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
      ? "bg-[#008bcd]/10 text-[#008bcd] dark:text-sky-300 border-[#008bcd]/20"
      : "bg-muted text-muted-foreground border-border",
    financeText: hasDebt
      ? `Saldo: $${debt.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      : status === "DRAFT"
      ? "Por Aprobar"
      : "$ Pagado",
    financeColor: hasDebt
      ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
      : status === "DRAFT"
      ? "text-muted-foreground bg-muted border-border"
      : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  }
}

const money = (amount: number) => `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`

export default function PlansTreatmentHubPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const fetchPlans = async () => {
      try {
        setLoadError(false)
        const res = await fetch("/api/treatments", { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!controller.signal.aborted) setPlans(Array.isArray(data) ? data : [])
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Error cargando los tratamientos:", error)
        setLoadError(true)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void fetchPlans()
    return () => controller.abort()
  }, [])

  const processedPlans = useMemo(() => {
    return plans.map((plan) => {
      const totalItems = plan.items?.length || 0
      const completedItems = plan.items?.filter((i: any) => i.isCompleted || i.progress === 100).length || 0
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
      return { ...plan, progress }
    })
  }, [plans])

  const filteredPlans = useMemo(() => {
    return processedPlans.filter((plan) => {
      const term = searchTerm.trim().toLowerCase()
      const matchesSearch =
        plan.name?.toLowerCase().includes(term) ||
        plan.patient?.firstName?.toLowerCase().includes(term) ||
        plan.patient?.lastName?.toLowerCase().includes(term) ||
        plan.patient?.ci?.toLowerCase().includes(term)
      const matchesStatus = selectedStatus === "ALL" || plan.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [processedPlans, searchTerm, selectedStatus])

  const globalPresupuesto = processedPlans.reduce((acc, plan) => acc + (plan.totalCost || 0), 0)
  const globalAbonado = processedPlans.reduce((acc, plan) => acc + (plan.totalPaid || 0), 0)
  const globalSaldo = Math.max(0, globalPresupuesto - globalAbonado)
  const paidPercent = globalPresupuesto > 0 ? Math.max(0, Math.min(100, (globalAbonado / globalPresupuesto) * 100)) : 0
  const statusOptions = [
    { id: "ALL", label: "Todos" },
    { id: "ACTIVE", label: "En ejecución" },
    { id: "DRAFT", label: "Borradores" },
    { id: "COMPLETED", label: "Finalizados" },
  ]

  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[calc(100dvh-70px)] w-full min-w-0 max-w-[1720px] flex-col gap-4 px-3 py-4 font-sans sm:gap-5 sm:px-5 sm:py-6 lg:gap-6 lg:px-7 lg:py-8 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
        <header className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-500/15 bg-sky-500/10 text-sky-600 dark:text-sky-300 sm:h-12 sm:w-12">
              <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Planes de tratamiento</h1>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Consulta el avance clínico y los presupuestos de tus pacientes.
              </p>
            </div>
          </div>
          <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row xl:max-w-[510px]">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                aria-label="Buscar pacientes o planes de tratamiento"
                placeholder="Buscar paciente o plan..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 w-full rounded-xl border-border bg-background pl-10 text-sm"
              />
            </div>
            <Button asChild className="h-10 shrink-0 rounded-xl px-4 text-sm font-medium sm:w-auto">
              <Link href="/pacientes"><Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Nuevo plan</Link>
            </Button>
          </div>
        </header>

        <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,2fr)] lg:gap-5 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,2.25fr)]">
          <aside className="min-w-0 space-y-3" aria-label="Resumen de tratamientos">
            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <CircleDollarSign className="h-4 w-4 text-primary" aria-hidden="true" />
                Resumen financiero
              </div>
              <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
                <div className="col-span-2 min-w-0 lg:col-span-1">
                  <p className="text-xs text-muted-foreground">Presupuesto total</p>
                  <p className="mt-1 break-words text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">{money(globalPresupuesto)}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Porcentaje abonado" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(paidPercent)}>
                    <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${paidPercent}%` }} />
                  </div>
                </div>
                <div className="min-w-0 rounded-xl bg-muted/40 p-3 lg:bg-transparent lg:p-0">
                  <p className="text-xs text-muted-foreground">Abonado (ingresos)</p>
                  <p className="mt-1 break-words text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-base">{money(globalAbonado)}</p>
                </div>
                <div className="min-w-0 rounded-xl bg-muted/40 p-3 lg:bg-transparent lg:p-0">
                  <p className="text-xs text-muted-foreground">Saldo por cobrar</p>
                  <p className="mt-1 break-words text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400 sm:text-base">{money(globalSaldo)}</p>
                </div>
              </div>
            </section>
            <section className="hidden rounded-2xl border border-border bg-card p-4 sm:flex sm:items-start sm:gap-3">
              <span className="rounded-lg bg-primary/10 p-2 text-primary"><Activity className="h-4 w-4" aria-hidden="true" /></span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Seguimiento de planes</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Consulta el avance de los procedimientos y el estado de cada presupuesto.</p>
              </div>
            </section>
          </aside>

          <section className="min-w-0 space-y-3" aria-label="Listado de planes de tratamiento">
            <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-card p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex min-w-0 gap-1 overflow-x-auto overscroll-x-contain pb-1 sm:pb-0" role="group" aria-label="Filtrar por estado de tratamiento">
                {statusOptions.map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setSelectedStatus(tab.id)}
                    aria-pressed={selectedStatus === tab.id}
                    className={cn(
                      "h-9 shrink-0 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedStatus === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >{tab.label}</button>
                ))}
              </div>
              <span className="shrink-0 px-2 pb-1 text-xs text-muted-foreground sm:pb-0" aria-live="polite">{filteredPlans.length} {filteredPlans.length === 1 ? "tratamiento" : "tratamientos"}</span>
            </div>

            {isLoading ? (
              <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-border bg-card px-4 text-muted-foreground" role="status">
                <Loader2 className="mb-3 h-7 w-7 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm">Cargando planes de tratamiento...</p>
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-destructive/20 bg-card p-6 text-center text-sm text-muted-foreground" role="alert">
                No se pudieron consultar los planes. Actualiza la página para reintentar.
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
                <ClipboardList className="mb-3 h-9 w-9 text-muted-foreground/40" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">No se encontraron tratamientos</p>
                <p className="mt-1 text-xs text-muted-foreground">Prueba otro nombre, documento o estado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlans.map((plan) => {
                  const config = getPlanConfig(plan.status, plan.totalCost, plan.totalPaid)
                  const destination = `/paciente/${plan.patientId}?tab=planes&planId=${plan.id}`
                  return (
                    <article key={plan.id} className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 sm:p-5">
                      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-5">
                        <div className="min-w-0 flex-1 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn("rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", config.badgeColor)}>{config.badgeStatus}</span>
                            <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground">ID: #{String(plan.id).slice(-6).toUpperCase()}</span>
                          </div>
                          <h2 className="break-words text-sm font-semibold leading-snug text-foreground sm:text-base">{plan.name || "Plan de tratamiento"}</h2>
                          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                            <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                              <User className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                              <span className="break-words">{plan.patient?.firstName} {plan.patient?.lastName}</span>
                            </span>
                            <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">CI: {plan.patient?.ci || "Sin registrar"}</span>
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3 sm:flex-nowrap xl:w-auto xl:shrink-0 xl:justify-end xl:gap-4 xl:border-l xl:border-t-0 xl:py-1 xl:pl-5 xl:pt-0">
                          <div className="flex shrink-0 items-center gap-2 xl:flex-col xl:gap-1">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Progreso</span>
                            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${plan.progress}%, var(--muted) 0)` }} role="progressbar" aria-label="Progreso del tratamiento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={plan.progress}>
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-[10px] font-semibold tabular-nums text-foreground">{plan.progress}%</span>
                            </div>
                          </div>
                          <div className="min-w-[116px] flex-1 text-right xl:flex-none">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Presupuesto</p>
                            <p className="mt-1 break-words text-sm font-semibold tabular-nums text-foreground sm:text-base">{money(plan.totalCost || 0)}</p>
                            <span className={cn("mt-1 inline-block max-w-full break-words rounded-md border px-2 py-1 text-[11px] font-medium", config.financeColor)}>{config.financeText}</span>
                          </div>
                          <Button asChild variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl" aria-label={`Abrir plan de tratamiento: ${plan.name || "Plan"}`}>
                            <Link href={destination}><ChevronRight className="h-5 w-5" aria-hidden="true" /></Link>
                          </Button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
