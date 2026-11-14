"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Search, Phone, Mail, FileText, AlertTriangle, ChevronRight,
  ChevronLeft, ChevronsLeft, ChevronsRight, User, Loader2,
  Users, AlertCircle, RefreshCw,
} from "lucide-react"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { NewPatientModal } from "@/components/patients/patient-form"

type PatientRow = {
  id: string
  firstName: string | null
  lastName: string | null
  ci?: string | null
  phone?: string | null
  email?: string | null
  medicalAlerts?: unknown
}

type PatientsResponse = {
  patients: PatientRow[]
  total: number
  totalPatients: number
  pagination: {
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
  }
}

const PAGE_SIZE = 7
const avatarColors = [
  "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
] as const

function hasAlert(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "string") return value.trim().length > 0
  if (value && typeof value === "object") return Object.keys(value).length > 0
  return Boolean(value)
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPatients, setTotalPatients] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function loadPage() {
      setIsLoading(true)
      setError(null)
      try {
        const query = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_SIZE),
        })
        if (debouncedSearch) query.set("search", debouncedSearch)
        const res = await fetch(`/api/patients?${query.toString()}`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`No se pudo consultar el directorio (HTTP ${res.status}).`)
        const json: PatientsResponse = await res.json()
        if (!Array.isArray(json.patients) || typeof json.total !== "number" ||
            typeof json.totalPatients !== "number" || !json.pagination) {
          throw new Error("La API de pacientes no devuelve los datos de paginación esperados.")
        }
        if (!active) return
        setPatients(json.patients)
        setTotal(json.total)
        setTotalPatients(json.totalPatients)
        const pages = Math.max(1, Math.ceil(json.total / PAGE_SIZE))
        if (currentPage > pages) setCurrentPage(pages)
      } catch (err: unknown) {
        if (!active || controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Error al consultar los pacientes.")
        setPatients([])
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadPage()
    return () => { active = false; controller.abort() }
  }, [debouncedSearch, currentPage, refreshKey])

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), [])
  const onCreated = useCallback(() => {
    setSearchTerm("")
    setDebouncedSearch("")
    setCurrentPage(1)
    refresh()
  }, [refresh])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const alertsOnPage = patients.filter((patient) => hasAlert(patient.medicalAlerts)).length
  const searchPending = searchTerm.trim() !== debouncedSearch
  const busy = isLoading || searchPending

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1400px] space-y-6 p-4 font-sans antialiased md:p-6 lg:p-8">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                <User size={21} aria-hidden="true" />
              </span>
              Directorio de pacientes
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Busca, gestiona y accede a las fichas clínicas de tus pacientes.</p>
          </div>
          <NewPatientModal onSuccess={onCreated} />
        </header>

        <section aria-label="Resumen del directorio" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="rounded-xl bg-sky-50 p-3 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"><Users size={23} aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total de pacientes</p>
              <p className="text-3xl font-bold tabular-nums text-foreground" aria-live="polite">{totalPatients === null ? "—" : totalPatients}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><Search size={23} aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{debouncedSearch ? "Coincidencias" : "Pacientes en el directorio"}</p>
              <p className="text-3xl font-bold tabular-nums text-foreground">{busy ? "—" : total}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="rounded-xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"><AlertCircle size={23} aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alertas visibles en esta página</p>
              <p className="text-3xl font-bold tabular-nums text-foreground">{busy ? "—" : alertsOnPage}</p>
            </div>
          </div>
        </section>

        <section aria-label="Listado de pacientes" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                aria-label="Buscar paciente por nombre, apellido o identificación"
                placeholder="Buscar por CI, nombre o apellido..."
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                value={searchTerm}
                maxLength={120}
                onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1) }}
              />
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
              {busy ? <span className="flex items-center gap-2"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Consultando...</span> :
                <span>{total} resultado(s) {debouncedSearch ? "para esta búsqueda" : "en total"}</span>}
              <Button aria-label="Actualizar directorio" title="Actualizar directorio" size="icon" variant="outline" onClick={refresh} disabled={busy}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
              <span>{error}</span><Button type="button" variant="outline" onClick={refresh}>Reintentar</Button>
            </div>
          )}

          <div className="min-h-[300px] overflow-x-auto">
            <table className="w-full min-w-[690px] text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th scope="col" className="px-5 py-4">Paciente</th><th scope="col" className="px-5 py-4">CI / Identificación</th><th scope="col" className="px-5 py-4">Contacto</th><th scope="col" className="px-5 py-4 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {busy ? (
                  <tr><td colSpan={4} className="px-5 py-16 text-center text-muted-foreground"><Loader2 aria-hidden="true" className="mx-auto mb-3 h-7 w-7 animate-spin" />Cargando pacientes...</td></tr>
                ) : patients.length ? patients.map((patient) => (
                  <tr key={patient.id} className="transition-colors hover:bg-muted/25">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${avatarColors[(patient.firstName || "").length % avatarColors.length]}`}>
                          {(patient.firstName || "").charAt(0)}{(patient.lastName || "").charAt(0)}
                        </span>
                        <div><p className="font-semibold text-foreground">{patient.firstName} {patient.lastName}</p>
                          {hasAlert(patient.medicalAlerts) && <span className="mt-1 inline-flex items-center gap-1 text-xs text-rose-700 dark:text-rose-300"><AlertTriangle aria-hidden="true" className="h-3 w-3" /> Alerta médica</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-foreground">{patient.ci || "Sin identificación"}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Phone aria-hidden="true" className="h-3.5 w-3.5" />{patient.phone || "Sin teléfono"}</span><span className="mt-1 flex items-center gap-2"><Mail aria-hidden="true" className="h-3.5 w-3.5" />{patient.email || "Sin correo"}</span></td>
                    <td className="px-5 py-4 text-right"><Button asChild variant="outline" className="rounded-xl text-xs"><Link href={`/paciente/${encodeURIComponent(patient.id)}`}><FileText aria-hidden="true" className="mr-1 h-4 w-4" /> Ficha clínica <ChevronRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link></Button></td>
                  </tr>
                )) : <tr><td colSpan={4} className="px-5 py-16 text-center text-muted-foreground">{debouncedSearch ? "No se encontraron pacientes con esa búsqueda." : "No hay pacientes registrados."}</td></tr>}
              </tbody>
            </table>
          </div>
          {!busy && total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-muted/15 px-5 py-4 text-xs text-muted-foreground sm:flex-row">
              <span>Mostrando {startIndex + 1}–{Math.min(startIndex + patients.length, total)} de {total} paciente(s)</span>
              <nav aria-label="Paginación de pacientes" className="flex items-center gap-2">
                <span className="mr-2 font-medium text-foreground">Página {currentPage} de {totalPages}</span>
                <Button aria-label="Primera página" size="icon" variant="outline" className="h-9 w-9" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button aria-label="Página anterior" size="icon" variant="outline" className="h-9 w-9" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button aria-label="Página siguiente" size="icon" variant="outline" className="h-9 w-9" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
                <Button aria-label="Última página" size="icon" variant="outline" className="h-9 w-9" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight className="h-4 w-4" /></Button>
              </nav>
            </div>
          )}
        </section>
      </main>
    </AppLayout>
  )
}
