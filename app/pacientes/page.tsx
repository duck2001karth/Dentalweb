"use client"

import { ShortcutActionTarget } from "@/components/providers/keyboard-shortcuts-provider"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircle, AlertTriangle, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, FileText, LayoutGrid,
  List, Loader2, Mail, Phone, RefreshCw, Search,
  SlidersHorizontal, User, Users, X,
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
  hasMedicalAlerts?: boolean
}
type PatientsResponse = {
  patients: PatientRow[]
  total: number
  totalPatients: number
  canViewMedicalAlerts?: boolean
  pagination: { page: number; limit: number; totalPages: number; hasNextPage: boolean }
}
type ViewMode = "table" | "cards"
const PAGE_SIZES = [7, 14, 28] as const
const avatarColors = [
  "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
] as const

function PatientAvatar({ patient }: { patient: PatientRow }) {
  return <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold ${avatarColors[(patient.firstName || "").length % avatarColors.length]}`}>
    {(patient.firstName || "P").charAt(0)}{(patient.lastName || "").charAt(0)}
  </span>
}
function PatientLink({ id }: { id: string }) {
  return <Button asChild variant="outline" size="sm" className="h-10 w-full rounded-xl text-sm font-medium sm:w-auto">
    <Link href={`/paciente/${encodeURIComponent(id)}`}><FileText className="mr-2 h-4 w-4" aria-hidden="true" />Abrir ficha<ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /></Link>
  </Button>
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(7)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [refreshKey, setRefreshKey] = useState(0)
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPatients, setTotalPatients] = useState<number | null>(null)
  const [canViewMedicalAlerts, setCanViewMedicalAlerts] = useState(false)
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
        const query = new URLSearchParams({ page: String(currentPage), limit: String(pageSize) })
        if (debouncedSearch) query.set("search", debouncedSearch)
        const response = await fetch(`/api/patients?${query.toString()}`, {
          method: "GET", credentials: "same-origin", cache: "no-store", signal: controller.signal,
        })
        if (!response.ok) throw new Error(`No se pudo consultar el directorio (HTTP ${response.status}).`)
        const json: PatientsResponse = await response.json()
        if (!Array.isArray(json.patients) || typeof json.total !== "number" || typeof json.totalPatients !== "number" || !json.pagination) {
          throw new Error("La API de pacientes no devolvió los datos de paginación esperados.")
        }
        if (!active) return
        setPatients(json.patients)
        setTotal(json.total)
        setTotalPatients(json.totalPatients)
        setCanViewMedicalAlerts(json.canViewMedicalAlerts === true)
        const lastPage = Math.max(1, Math.ceil(json.total / pageSize))
        if (currentPage > lastPage) setCurrentPage(lastPage)
      } catch (err: unknown) {
        if (!active || controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Error al consultar los pacientes.")
        setPatients([])
        setTotal(0)
        setTotalPatients(null)
        setCanViewMedicalAlerts(false)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void loadPage()
    return () => { active = false; controller.abort() }
  }, [debouncedSearch, currentPage, pageSize, refreshKey])

  const refresh = useCallback(() => setRefreshKey(value => value + 1), [])
  const onCreated = useCallback(() => {
    setSearchTerm(""); setDebouncedSearch(""); setCurrentPage(1); refresh()
  }, [refresh])
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min((currentPage - 1) * pageSize + patients.length, total)
  const alertsOnPage = patients.filter(patient => patient.hasMedicalAlerts === true).length
  const searchPending = searchTerm.trim() !== debouncedSearch
  const busy = isLoading || searchPending
  const isCards = viewMode === "cards"
  function onSearchChange(value: string) { setSearchTerm(value); setCurrentPage(1) }
  function onPageSizeChange(value: number) { setPageSize(value); setCurrentPage(1) }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full min-w-0 max-w-[1500px] flex-col gap-5 px-3 py-4 font-sans sm:px-4 sm:py-6 lg:gap-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"><User className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">Directorio de pacientes</h1>
              <p className="mt-1 text-sm text-muted-foreground">Busca, gestiona y accede a las fichas clínicas.</p>
            </div>
          </div>
          <div className="w-full shrink-0 sm:w-auto"><ShortcutActionTarget action="patient"><NewPatientModal onSuccess={onCreated} /></ShortcutActionTarget></div>
        </div>
        <section aria-label="Resumen del directorio" className={`grid grid-cols-2 gap-3 ${canViewMedicalAlerts ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:col-span-1">
            <span className="rounded-xl bg-sky-500/10 p-2.5 text-sky-700 dark:text-sky-300"><Users className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0"><p className="text-xs text-muted-foreground">Total de pacientes</p><p className="text-2xl font-semibold tabular-nums text-foreground" aria-live="polite">{totalPatients ?? "—"}</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="rounded-xl bg-muted p-2.5 text-muted-foreground"><Search className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0"><p className="text-xs text-muted-foreground">{debouncedSearch ? "Coincidencias" : "En el directorio"}</p><p className="text-2xl font-semibold tabular-nums text-foreground">{busy ? "—" : total}</p></div>
          </div>
          {canViewMedicalAlerts && <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span className="rounded-xl bg-rose-500/10 p-2.5 text-rose-700 dark:text-rose-300"><AlertCircle className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0"><p className="text-xs text-muted-foreground">Alertas en esta página</p><p className="text-2xl font-semibold tabular-nums text-foreground">{busy ? "—" : alertsOnPage}</p></div>
          </div>}
        </section>
        <section aria-label="Listado de pacientes" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-[470px]">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="search" aria-label="Buscar pacientes por nombre, apellido o CI" placeholder="Buscar por CI, nombre o apellido..." value={searchTerm} maxLength={120} onChange={event => onSearchChange(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
                {searchTerm && <button type="button" aria-label="Limpiar búsqueda" onClick={() => onSearchChange("")} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>}
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Vista y página</span>
                <div className="hidden items-center rounded-xl border border-border bg-muted/30 p-1 lg:flex" role="group" aria-label="Tipo de vista">
                  <button type="button" onClick={() => setViewMode("table")} aria-label="Vista de tabla" aria-pressed={!isCards} title="Tabla" className={`flex h-8 w-9 items-center justify-center rounded-lg ${!isCards ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><List className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setViewMode("cards")} aria-label="Vista de tarjetas" aria-pressed={isCards} title="Tarjetas" className={`flex h-8 w-9 items-center justify-center rounded-lg ${isCards ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><LayoutGrid className="h-4 w-4" /></button>
                </div>
                <label className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">Mostrar
                  <select aria-label="Pacientes por página" value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))} className="h-10 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}</select>
                </label>
                <Button type="button" size="icon" variant="outline" title="Actualizar" aria-label="Actualizar pacientes" className="h-10 w-10 shrink-0" onClick={refresh} disabled={busy}><RefreshCw className="h-4 w-4" /></Button>
              </div>
            </div>
            <div aria-live="polite" className="text-xs text-muted-foreground">{busy ? <span className="inline-flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Consultando pacientes...</span> : `${total} resultado(s)${debouncedSearch ? " para la búsqueda" : ""}`}</div>
          </div>
          {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-b border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"><span>{error}</span><Button variant="outline" size="sm" onClick={refresh}>Reintentar</Button></div>}
          {busy ? <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />Cargando directorio...</div>
          : patients.length === 0 ? <div className="flex min-h-60 flex-col items-center justify-center gap-3 px-4 text-center"><User className="h-9 w-9 text-muted-foreground/50" aria-hidden="true" /><p className="text-sm font-medium text-foreground">{error ? "No se pudo cargar el directorio" : "No se encontraron pacientes"}</p><p className="text-xs text-muted-foreground">{error ? "Intenta actualizar el listado." : debouncedSearch ? "Prueba con otro nombre, apellido o CI." : "Aún no hay pacientes registrados."}</p>{debouncedSearch && !error && <Button type="button" variant="outline" size="sm" onClick={() => onSearchChange("")}>Limpiar búsqueda</Button>}</div>
          : <>
            <div className={`${isCards ? "grid" : "grid lg:hidden"} grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3`}>
              {patients.map(patient => <article key={patient.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/30">
                <div className="flex min-w-0 items-start gap-3"><PatientAvatar patient={patient} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{patient.firstName} {patient.lastName}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">CI: {patient.ci || "Sin identificación"}</p></div></div>
                <div className="mt-3 space-y-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                  <p className="flex min-w-0 items-center gap-2"><Phone className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{patient.phone || "Sin teléfono"}</span></p>
                  <p className="flex min-w-0 items-center gap-2"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{patient.email || "Sin correo"}</span></p>
                  {canViewMedicalAlerts && patient.hasMedicalAlerts && <p className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Alerta médica registrada</p>}
                </div><div className="mt-auto pt-4"><PatientLink id={patient.id} /></div>
              </article>)}
            </div>
            <div className={isCards ? "hidden" : "hidden lg:block"}>
              <table className="w-full text-left text-sm"><thead className="border-b border-border bg-muted/20 text-xs text-muted-foreground"><tr><th scope="col" className="px-5 py-3 font-medium">Paciente</th><th scope="col" className="px-5 py-3 font-medium">CI / Identificación</th><th scope="col" className="px-5 py-3 font-medium">Contacto</th><th scope="col" className="px-5 py-3 text-right font-medium">Acciones</th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {patients.map(patient => <tr key={patient.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-5 py-4"><div className="flex min-w-0 items-center gap-3"><PatientAvatar patient={patient} /><div className="min-w-0"><p className="font-medium text-foreground">{patient.firstName} {patient.lastName}</p>{canViewMedicalAlerts && patient.hasMedicalAlerts && <p className="mt-1 inline-flex items-center gap-1 text-xs text-rose-700 dark:text-rose-300"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Alerta médica</p>}</div></div></td>
                    <td className="px-5 py-4 text-foreground">{patient.ci || "Sin identificación"}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground"><p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{patient.phone || "Sin teléfono"}</p><p className="mt-1 flex items-center gap-2"><Mail className="h-3.5 w-3.5" aria-hidden="true" />{patient.email || "Sin correo"}</p></td>
                    <td className="px-5 py-4 text-right"><PatientLink id={patient.id} /></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </>}
          {!busy && !error && total > 0 && <div className="flex flex-col gap-3 border-t border-border bg-muted/10 px-3 py-4 text-xs text-muted-foreground sm:px-4 lg:flex-row lg:items-center lg:justify-between">
            <span>Mostrando {from}–{to} de {total} paciente(s)</span>
            <nav aria-label="Paginación del directorio" className="flex flex-wrap items-center gap-1.5">
              <span className="mr-2 whitespace-nowrap text-foreground">Página {currentPage} de {totalPages}</span>
              <Button size="icon" variant="outline" title="Primera página" aria-label="Primera página" className="h-9 w-9" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}><ChevronsLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" title="Anterior" aria-label="Página anterior" className="h-9 w-9" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" title="Siguiente" aria-label="Página siguiente" className="h-9 w-9" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" title="Última página" aria-label="Última página" className="h-9 w-9" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}><ChevronsRight className="h-4 w-4" /></Button>
            </nav>
          </div>}
        </section>
      </div>
    </AppLayout>
  )
}
