"use client"

import { ChevronDown, FileClock, FileText, Image as ImageIcon, Pill, Plus, Printer, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type HistoryToolbarProps = {
  canEditClinicalData: boolean
  isPatientLoading: boolean
  hasPatient: boolean
  searchTerm: string
  onSearchTermChange: (value: string) => void
  monthFilter: string
  onMonthFilterChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  onNewEvolution: () => void
  onNewPrescription: () => void
  onNewDocument: () => void
  onPrint: () => void
}

/**
 * Solo presentación. La consulta, los permisos y los manejadores clínicos
 * permanecen en history-tab.tsx.
 */
export function HistoryToolbar({
  canEditClinicalData,
  isPatientLoading,
  hasPatient,
  searchTerm,
  onSearchTermChange,
  monthFilter,
  onMonthFilterChange,
  typeFilter,
  onTypeFilterChange,
  onNewEvolution,
  onNewPrescription,
  onNewDocument,
  onPrint,
}: HistoryToolbarProps) {
  return (
    <section
      aria-label="Controles del historial clínico"
      className="relative z-20 mb-5 w-full min-w-0 rounded-2xl border border-border/80 bg-card p-3 shadow-sm sm:p-4 xl:mb-7 xl:p-5"
    >
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="min-w-0 xl:max-w-[410px] xl:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground sm:text-xl xl:text-2xl">
              <FileClock aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
              Historial Clínico
            </h2>
            {!canEditClinicalData && (
              <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                SÓLO LECTURA
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Línea de tiempo integral de procedimientos, recetas y documentos del paciente.
          </p>
        </div>

        {/* Móvil: buscador / dos filtros / acciones. Desde xl: una única fila compacta. */}
        <div className="grid w-full min-w-0 grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:w-auto xl:flex xl:shrink-0 xl:flex-nowrap xl:gap-2">
          <div className="relative col-span-2 min-w-0 sm:col-span-3 xl:col-auto xl:w-[200px]">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Buscar registro clínico"
              placeholder="Buscar registro..."
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              className="h-10 w-full min-w-0 rounded-xl border border-input bg-background pl-9 pr-3 text-xs font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20 sm:text-sm"
            />
          </div>

          <div className="min-w-0 xl:w-[135px]">
            <Select value={monthFilter} onValueChange={onMonthFilterChange}>
              <SelectTrigger aria-label="Filtrar por mes" className="h-10 w-full min-w-0 rounded-xl border-border bg-background px-2 text-xs font-medium sm:px-3">
                <SelectValue placeholder="Meses" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                <SelectItem value="todos">Todos los meses</SelectItem>
                <SelectItem value="actual">Mes actual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 xl:w-[135px]">
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger aria-label="Filtrar por tipo" className="h-10 w-full min-w-0 rounded-xl border-border bg-background px-2 text-xs font-medium sm:px-3">
                <SelectValue placeholder="Tipos" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="evoluciones">Evoluciones</SelectItem>
                <SelectItem value="recetas">Recetas Médicas</SelectItem>
                <SelectItem value="otros">Documentos / Rx</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-3 sm:justify-end xl:col-auto xl:shrink-0">
            {canEditClinicalData && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" className="h-10 min-w-0 flex-1 gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:flex-none sm:px-4">
                    <Plus aria-hidden="true" className="h-4 w-4 shrink-0" />
                    Nuevo Registro
                    <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 opacity-75" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="z-50 w-56 rounded-xl border-border bg-popover p-1.5 shadow-xl">
                  <button type="button" onClick={onNewEvolution} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-foreground hover:bg-accent">
                    <FileText aria-hidden="true" className="h-4 w-4 text-primary" /> Agregar Evolución
                  </button>
                  <button type="button" onClick={onNewPrescription} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-foreground hover:bg-accent">
                    <Pill aria-hidden="true" className="h-4 w-4 text-violet-500" /> Emitir Receta
                  </button>
                  <button type="button" onClick={onNewDocument} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-foreground hover:bg-accent">
                    <ImageIcon aria-hidden="true" className="h-4 w-4 text-teal-500" /> Subir Documento / Rx
                  </button>
                </PopoverContent>
              </Popover>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Imprimir historial general"
              title="Imprimir historial general"
              onClick={onPrint}
              disabled={isPatientLoading || !hasPatient}
              className="h-10 w-10 shrink-0 rounded-xl border-border bg-background text-foreground shadow-sm hover:bg-accent"
            >
              <Printer aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
