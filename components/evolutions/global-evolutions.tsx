"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Activity, AlertCircle, ArrowDown, ArrowRight, ArrowUp, CalendarDays,
  CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock3, FileText, Loader2, Phone, Search, UserRound, X,
} from "lucide-react"
import { format, isToday, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"

import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useGetPatients } from "@/hooks/patients"
import { cn } from "@/lib/utils"

type EvolutionFilter = "ALL" | "TODAY" | "UNSIGNED"
type Patient = {
  id: string
  firstName?: string | null
  lastName?: string | null
  ci?: string | null
  phone?: string | null
}
type Evolution = {
  id: string
  patientId: string
  createdAt: string
  content?: string | null
  isSigned?: boolean | null
  professionalSignature?: string | null
  patient?: Patient | null
  author?: { name?: string | null } | null
}

const PAGE_SIZE = 8
const accent = "#008bcd"

function validDate(value?: string | null): Date | null {
  if (!value) return null
  const result = parseISO(value)
  return isValid(result) ? result : null
}

function isEvolutionSigned(evolution: Evolution): boolean {
  return Boolean(evolution.isSigned || evolution.professionalSignature)
}

function PatientSearchModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setQuery("")
      setDebouncedQuery("")
      return
    }
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [open, query])

  // Se conserva el hook existente y su contrato de búsqueda.
  const { patients, isLoading } = useGetPatients({ search: debouncedQuery })
  const hasQuery = query.trim().length > 0
  const isUpdating = query.trim() !== debouncedQuery
  const results: Patient[] = hasQuery && !isUpdating
    ? (Array.isArray(patients) ? patients.slice(0, 6) : [])
    : []

  const goToPatient = (id: string) => {
    onClose()
    router.push(`/paciente/${encodeURIComponent(id)}?tab=evoluciones`)
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose() }}>
      <DialogContent
        className="w-[calc(100vw-24px)] max-w-[780px] overflow-hidden rounded-[28px] border border-border/70 bg-background p-0 shadow-2xl sm:rounded-[32px] [&>button]:hidden"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <DialogHeader className="relative border-b border-border/60 px-5 pb-5 pt-6 text-left sm:px-8 sm:pt-8">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Cerrar búsqueda"
            onClick={onClose}
            className="absolute right-4 top-4 h-9 w-9 rounded-full text-muted-foreground hover:bg-muted sm:right-6 sm:top-6"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/15 bg-sky-500/10 text-[#008bcd]">
            <Search className="h-5 w-5" />
          </div>
          <DialogTitle className="pr-12 text-xl font-semibold tracking-[-0.035em] text-foreground sm:text-2xl">
            Buscar paciente
          </DialogTitle>
          <DialogDescription className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Encuentra una ficha clínica por nombre, apellido o cédula y abre directamente su historial de evoluciones.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#008bcd]" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre, apellido o cédula"
              autoComplete="off"
              aria-label="Buscar pacientes"
              className="h-13 min-h-[52px] rounded-2xl border-border/80 bg-muted/40 pl-12 pr-11 text-[15px] shadow-none transition-colors focus-visible:border-[#008bcd] focus-visible:ring-2 focus-visible:ring-[#008bcd]/15"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Limpiar búsqueda"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mt-5 min-h-[240px] max-h-[52vh] overflow-y-auto pr-1" aria-live="polite">
            {!hasQuery ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/15 px-5 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground/70">
                  <UserRound className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Escribe para buscar</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Los resultados aparecerán aquí cuando introduzcas un nombre o una cédula.</p>
                </div>
              </div>
            ) : isLoading || isUpdating ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-[#008bcd]" />
                <p className="text-sm">Buscando pacientes…</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl bg-muted/20 px-4 text-center">
                <Search className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-semibold">No se encontraron pacientes</p>
                <p className="max-w-sm text-xs text-muted-foreground">Revisa el nombre o número de cédula e inténtalo de nuevo.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Resultados · {results.length}{results.length === 6 ? " primeros" : ""}
                </p>
                {results.map((patient) => {
                  const fullName = [patient.firstName, patient.lastName].filter(Boolean).join(" ") || "Paciente sin nombre"
                  const initials = `${patient.firstName?.charAt(0) || ""}${patient.lastName?.charAt(0) || ""}`.toUpperCase() || "P"
                  return (
                    <div key={patient.id} className="group flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 p-3.5 transition-all hover:border-sky-500/35 hover:bg-muted/25 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-4">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-500/15 bg-sky-500/10 text-sm font-semibold text-[#008bcd]">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold tracking-[-0.015em] text-foreground" title={fullName}>{fullName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {patient.ci && <span>CI: {patient.ci}</span>}
                            {patient.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{patient.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => goToPatient(patient.id)}
                        className="h-9 shrink-0 rounded-xl bg-[#008bcd] px-4 text-xs font-semibold text-white hover:bg-[#0074aa]"
                      >
                        Abrir ficha <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function GlobalEvolutions() {
  const { toast } = useToast()
  const [evolutions, setEvolutions] = useState<Evolution[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<EvolutionFilter>("ALL")
  const [sortDesc, setSortDesc] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch("/api/clinical-notes/global", { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const result: unknown = await response.json()
        if (!Array.isArray(result)) throw new Error("Formato de respuesta inesperado")
        setEvolutions(result as Evolution[])
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Error al cargar evoluciones:", error)
        toast({ title: "Error al cargar", description: "No se pudieron cargar las evoluciones clínicas.", variant: "destructive" })
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [toast])

  const todayCount = useMemo(() => evolutions.filter((e) => {
    const date = validDate(e.createdAt)
    return date !== null && isToday(date)
  }).length, [evolutions])
  const unsignedCount = useMemo(() => evolutions.filter((e) => !isEvolutionSigned(e)).length, [evolutions])

  const filtered = useMemo(() => {
    const matching = evolutions.filter((e) => {
      if (filter === "UNSIGNED") return !isEvolutionSigned(e)
      if (filter === "TODAY") {
        const date = validDate(e.createdAt)
        return date !== null && isToday(date)
      }
      return true
    })
    return matching.sort((a, b) => {
      const dateA = validDate(a.createdAt)?.getTime() ?? 0
      const dateB = validDate(b.createdAt)?.getTime() ?? 0
      return sortDesc ? dateB - dateA : dateA - dateB
    })
  }, [evolutions, filter, sortDesc])

  useEffect(() => setPage(1), [filter, sortDesc])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

  const tabs: { key: EvolutionFilter; label: string; count: number }[] = [
    { key: "ALL", label: "Todos", count: evolutions.length },
    { key: "TODAY", label: "Hoy", count: todayCount },
    { key: "UNSIGNED", label: "Sin firmar", count: unsignedCount },
  ]

  return (
    <AppLayout>
      <PatientSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-[1600px] flex-col gap-7 px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-500/15 bg-sky-500/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#008bcd]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#008bcd]" /> Seguimiento clínico
            </div>
            <h1 className="flex items-center gap-3 text-[clamp(1.7rem,3vw,2.35rem)] font-semibold tracking-[-0.045em] text-foreground">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/15 bg-sky-500/10 text-[#008bcd]">
                <Activity className="h-5 w-5" />
              </span>
              Auditoría de evoluciones
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Consulta los registros clínicos disponibles, revisa el estado de las firmas y accede al historial de cada paciente.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="h-11 rounded-2xl bg-[#008bcd] px-5 text-sm font-semibold text-white shadow-sm shadow-sky-500/10 transition-all hover:bg-[#0074aa] hover:shadow-md"
          >
            <Search className="mr-2 h-4 w-4" /> Buscar paciente
            <ArrowRight className="ml-3 h-4 w-4 opacity-75" />
          </Button>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Resumen de evoluciones">
          {[
            { label: "Registros disponibles", value: evolutions.length, icon: FileText, color: "text-[#008bcd]", surface: "bg-sky-500/10" },
            { label: "Registrados hoy", value: todayCount, icon: CalendarDays, color: "text-indigo-500", surface: "bg-indigo-500/10" },
            { label: "Pendientes de firma", value: unsignedCount, icon: AlertCircle, color: "text-amber-500", surface: "bg-amber-500/10" },
          ].map(({ label, value, icon: Icon, color, surface }) => (
            <div key={label} className="flex items-center justify-between rounded-[22px] border border-border/65 bg-card p-5 shadow-sm shadow-black/[0.025]">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-3xl font-semibold tracking-[-0.06em] text-foreground">{loading ? "—" : value}</p>
              </div>
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", surface, color)}><Icon className="h-5 w-5" /></span>
            </div>
          ))}
        </section>

        <section className="flex min-h-[500px] flex-1 flex-col overflow-hidden rounded-[26px] border border-border/70 bg-card shadow-sm shadow-black/[0.025]" aria-label="Tabla de evoluciones">
          <div className="flex flex-col justify-between gap-4 border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">Registros clínicos</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Filtra por fecha o estado de firma.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-muted/35 p-1" role="group" aria-label="Filtro de evoluciones">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={filter === tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-all",
                      filter === tab.key ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", filter === tab.key ? "bg-sky-500/10 text-[#008bcd]" : "bg-muted/70")}>{loading ? "—" : tab.count}</span>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSortDesc((value) => !value)}
                className="h-10 justify-center rounded-xl border-border/70 text-xs font-medium"
              >
                {sortDesc ? <ArrowDown className="mr-2 h-3.5 w-3.5" /> : <ArrowUp className="mr-2 h-3.5 w-3.5" />}
                {sortDesc ? "Más recientes" : "Más antiguas"}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border/55 bg-muted/20">
                <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <th scope="col" className="px-6 py-4">Fecha</th>
                  <th scope="col" className="px-5 py-4">Paciente</th>
                  <th scope="col" className="px-5 py-4">Resumen clínico</th>
                  <th scope="col" className="px-5 py-4">Profesional</th>
                  <th scope="col" className="px-5 py-4">Firma</th>
                  <th scope="col" className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-24 text-center">
                    <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#008bcd]" />
                    <p className="text-sm text-muted-foreground">Cargando evoluciones clínicas…</p>
                  </td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-24 text-center">
                    <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/35" />
                    <p className="text-sm font-semibold">No hay evoluciones para este filtro</p>
                    <p className="mt-1 text-xs text-muted-foreground">Prueba seleccionando otra categoría.</p>
                  </td></tr>
                ) : visible.map((evo) => {
                  const date = validDate(evo.createdAt)
                  const signed = isEvolutionSigned(evo)
                  const fullName = [evo.patient?.firstName, evo.patient?.lastName].filter(Boolean).join(" ") || "Paciente sin nombre"
                  return (
                    <tr key={evo.id} className="transition-colors hover:bg-muted/25">
                      <td className="whitespace-nowrap px-6 py-4 align-middle">
                        <p className="text-xs font-semibold text-foreground">{date ? format(date, "dd MMM yyyy", { locale: es }) : "Sin fecha"}</p>
                        {date && <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Clock3 className="h-3 w-3" />{format(date, "HH:mm")}</p>}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <p className="max-w-[190px] truncate text-xs font-semibold text-foreground" title={fullName}>{fullName}</p>
                        {evo.patient?.ci && <p className="mt-1 text-[11px] text-muted-foreground">CI: {evo.patient.ci}</p>}
                      </td>
                      <td className="max-w-[280px] px-5 py-4 align-middle">
                        <p className="max-w-[260px] truncate text-xs leading-relaxed text-muted-foreground" title={evo.content || ""}>{evo.content || "Sin resumen disponible"}</p>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <p className="max-w-[155px] truncate text-xs font-medium text-foreground" title={evo.author?.name || ""}>{evo.author?.name || "No asignado"}</p>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          signed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}
                        >
                          {signed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                          {signed ? "Firmada" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right align-middle">
                        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl border-border/65 text-xs font-semibold hover:text-[#008bcd]">
                          <Link href={`/paciente/${encodeURIComponent(evo.patientId)}?tab=evoluciones`}>
                            Ver ficha <ArrowRight className="ml-2 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <footer className="flex flex-col justify-between gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <p className="text-xs text-muted-foreground">
                Mostrando <span className="font-semibold text-foreground">{start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)}</span> de {filtered.length} registros
              </p>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="mr-2 whitespace-nowrap text-xs text-muted-foreground">Página {safePage} de {totalPages}</span>
                <div className="flex gap-1">
                  {[
                    { label: "Primera página", Icon: ChevronsLeft, next: 1, disabled: safePage === 1 },
                    { label: "Página anterior", Icon: ChevronLeft, next: Math.max(1, safePage - 1), disabled: safePage === 1 },
                    { label: "Página siguiente", Icon: ChevronRight, next: Math.min(totalPages, safePage + 1), disabled: safePage === totalPages },
                    { label: "Última página", Icon: ChevronsRight, next: totalPages, disabled: safePage === totalPages },
                  ].map(({ label, Icon, next, disabled }) => (
                    <Button key={label} type="button" size="icon" variant="outline" aria-label={label} title={label}
                      onClick={() => setPage(next)} disabled={disabled} className="h-8 w-8 rounded-lg border-border/70">
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </footer>
          )}
        </section>
        <p className="px-1 text-[11px] text-muted-foreground/80">La información mostrada corresponde a los registros disponibles en el sistema.</p>
      </main>
    </AppLayout>
  )
}

export default GlobalEvolutions
