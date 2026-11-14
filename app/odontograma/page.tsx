"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Activity, ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft,
  ChevronsRight, Loader2, Phone, RefreshCw, Search, Users, X,
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
}

type PatientPageResponse = {
  patients: PatientSummary[]
  total: number
  totalPatients: number
  pagination: {
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
  }
}

const PAGE_SIZE = 9

export default function OdontogramaHubPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [patients, setPatients] = useState<PatientSummary[]>([])
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

    async function loadPatients() {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        })
        if (debouncedSearch) params.set("search", debouncedSearch)

        const response = await fetch(`/api/patients?${params.toString()}`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`No se pudo consultar el directorio (HTTP ${response.status}).`)
        }

        const result: PatientPageResponse = await response.json()
        if (
          !Array.isArray(result.patients) ||
          typeof result.total !== "number" ||
          typeof result.totalPatients !== "number" ||
          !result.pagination
        ) {
          throw new Error("La API de pacientes requiere paginación y conteos reales.")
        }
        if (controller.signal.aborted) return

        const finalPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE))
        setPatients(result.patients)
        setTotal(result.total)
        setTotalPatients(result.totalPatients)
        if (page > finalPage) setPage(finalPage)
      } catch (cause: unknown) {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : "No se pudo cargar el directorio.")
        setPatients([])
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadPatients()
    return () => controller.abort()
  }, [page, debouncedSearch, refreshKey])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(page * PAGE_SIZE, total)

  function updateSearch(value: string) {
    setSearchTerm(value)
    setPage(1)
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-[1480px] space-y-6 px-4 py-6 font-sans md:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-500/15 bg-sky-500/10 text-sky-700 dark:text-sky-300">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
                Odontogramas
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Encuentra un paciente y accede a su registro odontológico.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 rounded-xl"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            Actualizar
          </Button>
        </header>

        <section aria-label="Resumen del directorio odontológico" className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-sm">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Users className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pacientes activos registrados</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              {totalPatients === null ? "—" : totalPatients.toLocaleString("es-BO")}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm" aria-label="Buscar odontogramas">
          <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[450px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                aria-label="Buscar paciente por nombre, apellido o CI"
                autoComplete="off"
                placeholder="Buscar por nombre, apellido o CI..."
                value={searchTerm}
                onChange={(event) => updateSearch(event.target.value)}
                className="h-10 rounded-xl border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30"
              />
              {searchTerm && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => updateSearch("")}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {isLoading ? "Consultando pacientes..." : `${total.toLocaleString("es-BO")} resultado${total === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="p-4 sm:p-5">
            {isLoading ? (
              <div role="status" className="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
                Cargando pacientes...
              </div>
            ) : error ? (
              <div role="alert" className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
                <p className="font-medium text-destructive">No se pudo cargar el directorio</p>
                <p className="max-w-lg text-sm text-muted-foreground">{error}</p>
                <Button type="button" variant="outline" onClick={() => setRefreshKey((value) => value + 1)}>Reintentar</Button>
              </div>
            ) : patients.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
                <Search className="h-9 w-9 text-muted-foreground/40" aria-hidden="true" />
                <p className="font-medium text-foreground">No se encontraron pacientes</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  {debouncedSearch ? "Prueba otro nombre, apellido o número de identificación." : "Aún no hay pacientes activos registrados."}
                </p>
                {searchTerm && (
                  <Button type="button" variant="outline" onClick={() => updateSearch("")}>Limpiar búsqueda</Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {patients.map((patient) => {
                  const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "Paciente sin nombre"
                  const initials = `${patient.firstName?.[0] || ""}${patient.lastName?.[0] || ""}`.toUpperCase() || "P"
                  return (
                    <article
                      key={patient.id}
                      className="flex min-w-0 flex-col rounded-2xl border border-border/80 bg-background p-4 transition-colors hover:border-primary/35 hover:bg-muted/20"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-sm font-semibold text-primary">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-sm font-semibold text-foreground" title={fullName}>{fullName}</h2>
                          <p className="mt-1 truncate text-xs text-muted-foreground">CI: {patient.ci || "Sin identificación"}</p>
                        </div>
                      </div>
                      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{patient.phone || "Sin contacto registrado"}</span>
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                        <span className="text-xs text-muted-foreground">Ficha odontológica</span>
                        <Button asChild size="sm" variant="outline" className="h-9 gap-1.5 rounded-lg border-primary/25 text-primary hover:bg-primary/10 hover:text-primary">
                          <Link href={`/paciente/${patient.id}?tab=odontograma`} aria-label={`Abrir odontograma de ${fullName}`}>
                            Abrir <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </Button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          {!isLoading && !error && total > 0 && (
            <nav className="flex flex-col gap-3 border-t border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Paginación de pacientes">
              <p className="text-xs text-muted-foreground">
                Mostrando <span className="font-medium text-foreground">{firstItem}–{lastItem}</span> de <span className="font-medium text-foreground">{total}</span> pacientes
              </p>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-xs font-medium text-foreground">Página {page} de {totalPages}</span>
                <Button type="button" variant="outline" size="icon" aria-label="Primera página" title="Primera página" className="h-9 w-9 rounded-lg" disabled={page === 1} onClick={() => setPage(1)}><ChevronsLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" aria-label="Página anterior" title="Página anterior" className="h-9 w-9 rounded-lg" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" aria-label="Página siguiente" title="Página siguiente" className="h-9 w-9 rounded-lg" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" aria-label="Última página" title="Última página" className="h-9 w-9 rounded-lg" disabled={page >= totalPages} onClick={() => setPage(totalPages)}><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </nav>
          )}
        </section>
      </main>
    </AppLayout>
  )
}
