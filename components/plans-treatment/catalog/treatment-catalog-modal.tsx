"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Search, Loader2, Info, Layers, PlusCircle, Activity } from "lucide-react"
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
      if (initialLocation && initialLocation.value) setSelectedLocation(initialLocation)
      else setSelectedLocation({ type: "GENERAL", value: "" })
    }
  }, [isOpen, initialLocation])

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    setIsLoading(true)
    fetch("/api/admin/catalog")
      .then(async (res) => {
        if (!res.ok) return fetch("/api/catalog").then((r) => (r.ok ? r.json() : []))
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        const list = Array.isArray(data) ? data : data.procedures || data.items || data.data || []
        const activeOnly = list.filter((item: any) => item.isActive !== false)
        setFetchedCatalog(activeOnly)
      })
      .catch((err) => console.error("Error al cargar catálogo:", err))
      .finally(() => { if (isMounted) setIsLoading(false) })
    return () => { isMounted = false }
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
      catUpper.includes("PRODUCTO") || catUpper.includes("FARMACIA") || catUpper.includes("INSUMO") ||
      catUpper.includes("PREVENTIV") || catUpper.includes("DIAGNOST") || catUpper.includes("CONSULT") ||
      catUpper.includes("GENERAL") || nameUpper.includes("CEPILLO") || nameUpper.includes("PASTA") ||
      nameUpper.includes("PROFILAXIS") || nameUpper.includes("LIMPIEZA") || nameUpper.includes("VALORACION")

    const isStrictlyToothProcedure =
      !isProductOrGeneral && (
        catUpper.includes("OPERATORIA") || catUpper.includes("ENDODONCIA") || catUpper.includes("CIRUGIA") ||
        catUpper.includes("REHABILITACION") || catUpper.includes("IMPLANT") || nameUpper.includes("RESINA") ||
        nameUpper.includes("EXTRACCION") || nameUpper.includes("CORONA") || nameUpper.includes("CALZA")
      )

    if (isStrictlyToothProcedure && selectedLocation.type === "GENERAL") {
      setSelectedLocation({ type: "TOOTH", value: "" })
      toast({
        title: "Pieza Dental Requerida",
        description: `"${proc.name}" requiere que selecciones un diente.`,
        variant: "default",
      })
      return
    }

    if (selectedLocation.type !== "GENERAL" && !selectedLocation.value) {
      toast({
        title: "Selección incompleta",
        description: `Selecciona la pieza o región antes de agregar "${proc.name}".`,
        variant: "destructive",
      })
      return
    }

    const toothOrRegionValue = selectedLocation.type === "GENERAL" ? "General" : (selectedLocation.value || undefined)
    handleAddManualProcedure(proc, toothOrRegionValue, targetSectionId)
    setSelectedLocation({ type: "GENERAL", value: "" })
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[700px] h-[88vh] flex flex-col p-0 bg-card text-foreground border border-border shadow-2xl rounded-[24px] overflow-hidden font-sans">
        
        {/* HEADER COMPACTO */}
        <DialogHeader className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#008bcd]/10 flex items-center justify-center border border-[#008bcd]/20 shrink-0">
                <Activity className="w-4 h-4 text-[#008bcd]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight text-foreground">Catálogo de Prestaciones</DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                  Ubique y seleccione el procedimiento a cotizar.
                </DialogDescription>
              </div>
            </div>
            {targetSectionName && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#008bcd]/10 border border-[#008bcd]/20 text-[#008bcd] text-[10px] font-black">
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="uppercase tracking-wider">{targetSectionName}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* ÁREA DE CONTROLES COMPACTA */}
        <div className="px-5 py-4 border-b border-border space-y-3 bg-background shadow-xs z-10 shrink-0">
          <RegionSelector selectedLocation={selectedLocation} onSelectLocation={setSelectedLocation} />
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar por nombre, código o especialidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-muted/30 border-border text-xs rounded-xl focus-visible:border-[#008bcd] focus-visible:ring-2 focus-visible:ring-[#008bcd]/20 transition-all font-semibold"
              autoFocus
            />
          </div>

          {selectedLocation.value && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#008bcd] bg-blue-50/50 dark:bg-blue-950/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Destino: <strong className="font-black">{selectedLocation.value}</strong></span>
            </div>
          )}
        </div>

        {/* LISTA DE PRESTACIONES REDISEÑADA */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/10 space-y-2 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground text-xs font-bold">
              <Loader2 className="w-8 h-8 animate-spin text-[#008bcd]" />
              Cargando aranceles...
            </div>
          ) : visibleProcedures.length > 0 ? (
            visibleProcedures.map((proc: any) => (
              <div
                key={proc.id}
                onClick={() => !isAddingProcedure && handleSelectProcedure(proc)}
                className="group p-3 bg-card border border-border/80 rounded-xl flex justify-between items-center transition-all duration-200 cursor-pointer hover:border-[#008bcd]/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="pr-4">
                  <p className="font-bold text-foreground text-sm group-hover:text-[#008bcd] transition-colors leading-tight">
                    {proc.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {proc.code && (
                      <span className="text-[10px] font-bold font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                        {proc.code}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      {proc.category || "General"}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <p className="font-bold text-foreground text-sm font-mono bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
                    {currencySymbol}
                    {Number(proc.basePrice ?? proc.price ?? proc.cost ?? 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <button 
                    disabled={isAddingProcedure}
                    className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-[#008bcd] group-hover:text-white transition-all shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-muted-foreground font-medium text-xs bg-card border border-dashed border-border rounded-2xl">
              No se encontraron prestaciones para "{searchQuery}".
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}