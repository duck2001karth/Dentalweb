"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Search, Loader2, Info, Layers } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { RegionSelector } from "./region-selector"
import { useClinicSettings } from "@/config/clinic-settings"

interface TreatmentCatalogModalProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  catalogSearch?: string
  setCatalogSearch?: (query: string) => void
  filteredCatalog?: any[]
  handleAddManualProcedure: (proc: any, toothOrRegionValue?: string, sectionId?: string | null) => void
  isAddingProcedure?: boolean
  initialLocation?: { type: "GENERAL" | "TOOTH" | "ARCADA" | "SEXTANTE"; value: string }
  targetSectionId?: string | null
  targetSectionName?: string | null
}

export function TreatmentCatalogModal({
  isOpen,
  setIsOpen,
  catalogSearch: externalSearch,
  setCatalogSearch: externalSetSearch,
  filteredCatalog: externalCatalog = [],
  handleAddManualProcedure,
  isAddingProcedure = false,
  initialLocation,
  targetSectionId = null,
  targetSectionName = null,
}: TreatmentCatalogModalProps) {
  const { toast } = useToast()
  const clinicCtx = useClinicSettings() as any
  const settings = clinicCtx?.settings || clinicCtx
  const rawCurrency = settings?.currencySymbol || settings?.currency || "USD "
  const currencySymbol = rawCurrency.endsWith(" ") ? rawCurrency : `${rawCurrency} `

  const [internalSearch, setInternalSearch] = useState("")
  const searchQuery = externalSearch !== undefined ? externalSearch : internalSearch
  const setSearchQuery = externalSetSearch || setInternalSearch

  const [fetchedCatalog, setFetchedCatalog] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{
    type: "GENERAL" | "TOOTH" | "ARCADA" | "SEXTANTE"
    value: string
  }>(initialLocation || { type: "GENERAL", value: "" })

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (initialLocation && initialLocation.value) {
        setSelectedLocation(initialLocation)
      } else {
        setSelectedLocation({ type: "GENERAL", value: "" })
      }
    }
  }, [isOpen, initialLocation])

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    setIsLoading(true)
    fetch("/api/admin/catalog")
      .then(async (res) => {
        if (!res.ok) {
          return fetch("/api/catalog").then((r) => (r.ok ? r.json() : []))
        }
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        const list = Array.isArray(data) ? data : data.procedures || data.items || data.data || []
        const activeOnly = list.filter((item: any) => item.isActive !== false)
        setFetchedCatalog(activeOnly)
      })
      .catch((err) => console.error("Error al cargar catálogo:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen])

  const baseList = externalCatalog.length > 0 ? externalCatalog : fetchedCatalog

  const visibleProcedures = useMemo(() => {
    if (!searchQuery.trim()) return baseList
    const term = searchQuery.toLowerCase().trim()
    return baseList.filter((proc: any) => {
      const name = (proc.name || "").toLowerCase()
      const code = (proc.code || "").toLowerCase()
      const category = (proc.category || "").toLowerCase()
      return name.includes(term) || code.includes(term) || category.includes(term)
    })
  }, [baseList, searchQuery])

  const handleSelectProcedure = (proc: any) => {
    const nameUpper = (proc.name || "").toUpperCase()
    const catUpper = (proc.category || "").toUpperCase()

    const isProductOrGeneral =
      catUpper.includes("PRODUCTO") ||
      catUpper.includes("FARMACIA") ||
      catUpper.includes("INSUMO") ||
      catUpper.includes("PREVENTIV") ||
      catUpper.includes("DIAGNOST") ||
      catUpper.includes("DIAGNÓST") ||
      catUpper.includes("CONSULT") ||
      catUpper.includes("ADMINIST") ||
      catUpper.includes("GENERAL") ||
      nameUpper.includes("CEPILLO") ||
      nameUpper.includes("PASTA") ||
      nameUpper.includes("ENJUAGUE") ||
      nameUpper.includes("SEDA") ||
      nameUpper.includes("HILO") ||
      nameUpper.includes("PROFILAXIS") ||
      nameUpper.includes("LIMPIEZA") ||
      nameUpper.includes("BLANQUEAMIENTO") ||
      nameUpper.includes("MODELO") ||
      nameUpper.includes("VALORACION") ||
      nameUpper.includes("VALORACIÓN")

    const isStrictlyToothProcedure =
      !isProductOrGeneral && (
        catUpper.includes("OPERATORIA") ||
        catUpper.includes("ENDODONCIA") ||
        catUpper.includes("CIRUGIA") ||
        catUpper.includes("CIRUGÍA") ||
        catUpper.includes("REHABILITACION") ||
        catUpper.includes("REHABILITACIÓN") ||
        catUpper.includes("IMPLANT") ||
        nameUpper.includes("RESINA") ||
        nameUpper.includes("EXTRACCION") ||
        nameUpper.includes("EXTRACCIÓN") ||
        nameUpper.includes("CORONA") ||
        nameUpper.includes("PERNO") ||
        nameUpper.includes("CALZA")
      )

    if (isStrictlyToothProcedure && selectedLocation.type === "GENERAL") {
      setSelectedLocation({ type: "TOOTH", value: "" })
      toast({
        title: "Pieza Dental Requerida",
        description: `"${proc.name}" es un procedimiento que se realiza en un diente específico. Seleccione el número (11 al 48).`,
        variant: "default",
      })
      return
    }

    if (selectedLocation.type !== "GENERAL" && !selectedLocation.value) {
      toast({
        title: "Selección incompleta",
        description: `Por favor selecciona la pieza dental o región correspondiente antes de agregar "${proc.name}".`,
        variant: "destructive",
      })
      return
    }

    const toothOrRegionValue = selectedLocation.type === "GENERAL" 
      ? "General" 
      : (selectedLocation.value || undefined)

    handleAddManualProcedure(proc, toothOrRegionValue, targetSectionId)
    setSelectedLocation({ type: "GENERAL", value: "" })
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[650px] h-[85vh] flex flex-col p-0 bg-card text-card-foreground border border-border/80 rounded-2xl overflow-hidden shadow-2xl font-sans">
        <DialogHeader className="p-5 border-b border-border bg-[#0b0f19] text-white dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Catálogo de Prestaciones</DialogTitle>
              <DialogDescription className="text-xs text-slate-300 mt-0.5">
                Define la ubicación anatómica y selecciona el procedimiento clínico a cotizar.
              </DialogDescription>
            </div>
            {targetSectionName && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#008bcd]/20 border border-[#008bcd]/40 text-[#008bcd] text-xs font-bold">
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="uppercase tracking-wide">{targetSectionName}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* SELECTOR Y BÚSQUEDA */}
        <div className="p-4 border-b border-border bg-muted/20 space-y-3">
          <RegionSelector
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
          />
          <div className="relative pt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar por nombre, código (ej: OPE-8141) o especialidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-[#008bcd]"
              autoFocus
            />
          </div>

          {/* BADGES INFORMATIVOS */}
          <div className="flex flex-wrap items-center gap-2">
            {targetSectionName && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#008bcd] bg-white dark:bg-card px-2.5 py-1 rounded-lg border border-[#008bcd]/30 shadow-2xs">
                <Layers className="w-3.5 h-3.5 stroke-[2.5] text-[#008bcd]" />
                <span>
                  Fase destino: <strong className="uppercase">{targetSectionName}</strong>
                </span>
              </div>
            )}
            {selectedLocation.value && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#008bcd] bg-[#008bcd]/10 px-2.5 py-1 rounded-lg border border-[#008bcd]/20">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Asignado a: <strong>{selectedLocation.value}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* LISTA DE PRESTACIONES */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-border/60">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs font-semibold">
              <Loader2 className="w-6 h-6 animate-spin text-[#008bcd]" />
              Cargando catálogo arancelario...
            </div>
          ) : visibleProcedures.length > 0 ? (
            visibleProcedures.map((proc: any) => (
              <button
                key={proc.id}
                type="button"
                onClick={() => handleSelectProcedure(proc)}
                disabled={isAddingProcedure}
                className="w-full text-left p-3.5 hover:bg-accent/60 flex justify-between items-center transition-colors rounded-xl group cursor-pointer disabled:opacity-50"
              >
                <div className="pr-4">
                  <p className="font-bold text-foreground text-sm group-hover:text-[#008bcd] transition-colors">
                    {proc.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {proc.code && (
                      <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                        {proc.code}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      {proc.category || "General"}
                    </span>
                    {selectedLocation.value && (
                      <span className="text-[10px] font-extrabold text-[#008bcd] bg-[#008bcd]/15 px-2 py-0.5 rounded-md">
                        {selectedLocation.value}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-emerald-600 dark:text-emerald-400 text-base font-mono">
                    {currencySymbol}
                    {Number(proc.basePrice ?? proc.price ?? proc.cost ?? 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="py-16 text-center text-muted-foreground font-medium text-xs">
              No se encontraron prestaciones activas para el término ingresado.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TreatmentCatalogModal