"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft,
  ChevronsRight, FileText, Loader2, Phone, RefreshCw, Search,
  ShieldCheck, UserRound, Users, X,
} from "lucide-react"
import { AppLayout } from "@/components/layouts/app-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type PatientSummary = {
  id: string
  firstName: string | null
  lastName: string | null
  ci?: string | null
  phone?: string | null
  birthDate?: string | Date | null
  eps?: string | null
  grupoSanguineo?: string | null
  medicalAlerts?: unknown
}

type PatientPageResponse = {
  patients: PatientSummary[]
  total: number
  totalPatients: number
  pagination: { page: number; limit: number; totalPages: number; hasNextPage: boolean }
}

const PAGE_SIZE = 12

function hasMedicalAlert(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (value !== null && typeof value === "object") return Object.keys(value).length > 0
  return Boolean(value)
}

function calculateAge(value?: string | Date | null): string {
  if (!value) return "—"
  const datePart = typeof value === "string" ? value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] : null
  const birth = datePart
    ? new Date(`${datePart}T12:00:00`)
    : new Date(value)
  if (Number.isNaN(birth.getTime())) return "—"
  const today = new Date()
  let years = today.getFullYear() - birth.getFullYear()
  const month = today.getMonth() - birth.getMonth()
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) years--
  return years >= 0 && years < 130 ? String(years) : "—"
}

export default function HistoriaClinicaHubPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [total, setTotal] = useState(0)
  const [totalPatients, setTotalPatients] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
        if (debouncedSearch) params.set("search", debouncedSearch)
        const response = await fetch(`/api/patients?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`No se pudo consultar el archivo clínico (HTTP ${response.status}).`)
        const data = (await response.json()) as PatientPageResponse
        if (!Array.isArray(data.patients) || typeof data.total !== "number" ||
            typeof data.totalPatients !== "number" || !data.pagination) {
          throw new Error("La API de pacientes no devuelve el total y la paginación requeridos.")
        }
        if (controller.signal.aborted) return
        const lastPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
        setPatients(data.patients)
        setTotal(data.total)
        setTotalPatients(data.totalPatients)
        if (page > lastPage) setPage(lastPage)
      } catch (cause: unknown) {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : "No se pudo cargar el directorio.")
        setPatients([])
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [page, debouncedSearch, refreshKey])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const last = Math.min(page * PAGE_SIZE, total)

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1480px] space-y-6 px-4 py-6 font-sans md:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-500/15 bg-sky-500/10 text-sky-700 dark:text-sky-300">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">Archivo clínico</h1>
              <p className="mt-1 text-sm text-muted-foreground">Consulta y accede a los expedientes de los pacientes registrados.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-10 gap-2 rounded-xl" onClick={() => setRefreshKey(value => value + 1)} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" /> Actualizar
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Resumen del archivo clínico">
          <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><Users className="h-5 w-5" aria-hidden="true" /></div>
            <div><p className="text-xs text-muted-foreground">Expedientes activos</p><p className="text-2xl font-semibold tabular-nums text-foreground">{totalPatients === null ? "—" : totalPatients}</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></div>
            <div><p className="text-xs text-muted-foreground">{debouncedSearch ? "Coincidencias encontradas" : "Expedientes disponibles"}</p><p className="text-2xl font-semibold tabular-nums text-foreground">{total}</p></div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm" aria-label="Directorio de expedientes">
          <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input aria-label="Buscar paciente por nombre, apellido o CI" type="search" autoComplete="off" placeholder="Buscar por nombre, apellido o CI..." value={search} onChange={event => handleSearch(event.target.value)} className="h-11 rounded-xl bg-background pl-10 pr-9 text-sm" />
              {search && <button type="button" onClick={() => handleSearch("")} aria-label="Limpiar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
            </div>
            <p aria-live="polite" className="text-xs text-muted-foreground">{isLoading ? "Buscando expedientes..." : `${total} expediente${total === 1 ? "" : "s"} ${debouncedSearch ? "encontrados" : "disponibles"}`}</p>
          </div>

          {error ? (
            <div role="alert" className="flex min-h-60 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
              <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">No se pudo cargar el archivo clínico</p>
              <p className="max-w-md text-xs text-muted-foreground">{error}</p>
              <Button type="button" variant="outline" onClick={() => setRefreshKey(value => value + 1)}>Reintentar</Button>
            </div>
          ) : isLoading ? (
            <div role="status" className="flex min-h-60 flex-col items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="text-sm">Cargando expedientes...</span></div>
          ) : patients.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center gap-3 px-4 text-center">
              <UserRound className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">No se encontraron expedientes</p>
              <p className="text-xs text-muted-foreground">{debouncedSearch ? "Intenta con otro nombre, apellido o CI." : "Todavía no hay pacientes activos registrados."}</p>
              {search && <Button variant="outline" type="button" onClick={() => handleSearch("")}>Limpiar búsqueda</Button>}
            </div>
          ) : (
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {patients.map(patient => {
                const medicalAlert = hasMedicalAlert(patient.medicalAlerts)
                const name = `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "Paciente sin nombre"
                const initials = `${patient.firstName?.charAt(0) || "P"}${patient.lastName?.charAt(0) || ""}`.toUpperCase()
                return (
                  <article key={patient.id} className="flex min-w-0 flex-col rounded-2xl border border-border/80 bg-background p-4 transition-colors hover:border-primary/30">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold ${medicalAlert ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300" : "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"}`} aria-hidden="true">{initials}</div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-semibold text-foreground" title={name}>{name}</h2>
                        <p className="mt-1 truncate text-xs text-muted-foreground">CI: {patient.ci || "No registrado"}</p>
                      </div>
                      {patient.birthDate && <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-[11px] text-muted-foreground">{calculateAge(patient.birthDate)} años</span>}
                    </div>
                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      <p className="flex min-w-0 items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{patient.phone || "Sin teléfono registrado"}</span></p>
                      <p className="truncate">Cobertura: {patient.eps || "Particular / sin seguro registrado"}</p>
                      {patient.grupoSanguineo && <p>Grupo sanguíneo: <span className="font-medium text-foreground">{patient.grupoSanguineo}</span></p>}
                    </div>
                    <div className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${medicalAlert ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-muted/60 text-muted-foreground"}`}>
                      {medicalAlert ? <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />}
                      <span>{medicalAlert ? "Alerta médica registrada: revisar la ficha" : "Sin alertas médicas registradas"}</span>
                    </div>
                    <Link href={`/paciente/${encodeURIComponent(patient.id)}?tab=historial`} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                      Abrir ficha clínica <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </article>
                )
              })}
            </div>
          )}

          {!error && !isLoading && total > 0 && (
            <footer className="flex flex-col items-center justify-between gap-3 border-t border-border/70 px-4 py-3 sm:flex-row">
              <p className="text-xs text-muted-foreground">Mostrando {first}–{last} de {total} expedientes</p>
              <nav aria-label="Paginación de expedientes" className="flex items-center gap-2">
                <span className="mr-1 text-xs text-muted-foreground">Página {page} de {pages}</span>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(1)} disabled={page === 1} aria-label="Primera página"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(value => Math.min(pages, value + 1))} disabled={page >= pages} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(pages)} disabled={page >= pages} aria-label="Última página"><ChevronsRight className="h-4 w-4" /></Button>
              </nav>
            </footer>
          )}
        </section>
      </main>
    </AppLayout>
  )
}
