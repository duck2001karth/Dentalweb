"use client"

import React, { useState, useEffect } from "react"
import { CheckCircle2, Edit2, Layers, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useClinicSettings } from "@/config/clinic-settings"
import { useToast } from "@/hooks/use-toast"
import { TreatmentActions } from "./treatment-actions"

interface TreatmentSection {
  id: string
  name: string
  order?: number
}

interface TreatmentItem {
  id: string
  treatmentPlanId?: string
  procedureName?: string
  name?: string
  tooth?: string
  toothNumber?: string
  region?: string
  cost?: number
  price?: number
  discount?: number
  paidAmount?: number
  isPaid?: boolean
  progress?: number
  isCompleted?: boolean
  sectionId?: string | null
}

interface TreatmentTableProps {
  planId?: string
  planItems?: TreatmentItem[] | any[]
  sections?: TreatmentSection[] | any[]
  planDiscountPercent?: number
  setIsSectionModalOpen?: (open: boolean) => void
  openCatalogModal?: (region?: string, sectionId?: string) => void
  setIsDiagnosisModalOpen?: (open: boolean) => void
  setIsConfirmClearOpen?: () => void
  onDeleteSelectedItems?: (ids: string[]) => void
  onRequestDeleteSection?: (section: { id: string; name: string }) => void
  openEvolutionModal?: (item: any, progress: number) => void
  onUpdateItemDiscount?: (itemId: string, discount: number) => Promise<void> | void
  onUpdateItemRegion?: (itemId: string, region: string) => Promise<void> | void
  onSelectPrintMode?: (mode: "COMPLETO" | "SOLO_TOTAL" | "SIN_DETALLE" | "LABORATORIO") => void
  onPlanUpdate?: () => void
}

export function TreatmentTable({
  planId,
  planItems = [],
  sections = [],
  planDiscountPercent = 0,
  setIsSectionModalOpen,
  openCatalogModal,
  setIsDiagnosisModalOpen,
  setIsConfirmClearOpen,
  onDeleteSelectedItems,
  onRequestDeleteSection,
  openEvolutionModal,
  onUpdateItemDiscount,
  onUpdateItemRegion,
  onSelectPrintMode,
  onPlanUpdate,
}: TreatmentTableProps) {
  const { toast } = useToast()
  const { settings } = useClinicSettings()
  const currencySymbol = (settings as any)?.currencySymbol || (settings as any)?.currency || "$"

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [tempItemDiscount, setTempItemDiscount] = useState<string>("0")
  const [isMoving, setIsMoving] = useState(false)
  const [itemsList, setItemsList] = useState<any[]>(planItems)

  useEffect(() => {
    setItemsList(planItems)
  }, [planItems])

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedItemIds.length === itemsList.length && itemsList.length > 0) {
      setSelectedItemIds([])
    } else {
      setSelectedItemIds(itemsList.map((item) => item.id))
    }
  }

  const handleTrashClick = () => {
    if (selectedItemIds.length > 0) {
      if (onDeleteSelectedItems) onDeleteSelectedItems(selectedItemIds)
      setSelectedItemIds([])
    } else {
      if (setIsConfirmClearOpen) setIsConfirmClearOpen()
    }
  }

  const handleAssignRegion = (regionName: string) => {
    if (selectedItemIds.length > 0 && onUpdateItemRegion) {
      selectedItemIds.forEach((id) => {
        onUpdateItemRegion(id, regionName)
      })
      setSelectedItemIds([])
    } else if (openCatalogModal) {
      openCatalogModal(regionName)
    }
  }

  const handleSaveItemDiscount = (itemId: string) => {
    const val = parseFloat(tempItemDiscount)
    if (!isNaN(val) && val >= 0 && val <= 100) {
      if (onUpdateItemDiscount) onUpdateItemDiscount(itemId, val)
    }
    setEditingItemId(null)
  }

  const triggerPrint = (mode: "COMPLETO" | "SOLO_TOTAL" | "SIN_DETALLE" | "LABORATORIO") => {
    if (onSelectPrintMode) {
      onSelectPrintMode(mode)
    }
  }

  const handleBatchMoveSection = async (targetSectionId: string | null, sectionName: string) => {
    if (selectedItemIds.length === 0) {
      toast({
        title: "Selecciona prestaciones",
        description: "Marca al menos una casilla para moverla de fase.",
      })
      return
    }

    const effectivePlanId = planId || (planItems[0] as any)?.treatmentPlanId
    const movingIds = [...selectedItemIds]
    const previousItems = [...itemsList]

    setItemsList((prev) =>
      prev.map((item) =>
        movingIds.includes(item.id)
          ? { ...item, sectionId: targetSectionId }
          : item
      )
    )
    setSelectedItemIds([])

    try {
      setIsMoving(true)
      const res = await fetch(`/api/treatments/${effectivePlanId}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: movingIds,
          sectionId: targetSectionId,
        }),
      })

      if (!res.ok) throw new Error()

      toast({
        title: "Prestaciones reasignadas",
        description: targetSectionId
          ? `Se movieron ${movingIds.length} prestación(es) a "${sectionName}".`
          : `Se movieron ${movingIds.length} prestación(es) a Sin Fase.`,
        variant: "success",
      })

      if (onPlanUpdate) {
        await onPlanUpdate()
      }
    } catch {
      setItemsList(previousItems)
      toast({
        title: "Error",
        description: "No se pudieron mover las prestaciones.",
        variant: "destructive",
      })
    } finally {
      setIsMoving(false)
    }
  }

  const unassignedItems = itemsList.filter((item) => !item.sectionId)

  const renderItemRow = (item: any) => {
    const currentProg = item.progress || (item.isCompleted ? 100 : 0)
    const itemDiscount = Number(item.discount || 0)
    const globalDiscount = Number(planDiscountPercent || 0)
    const effectiveDiscount = itemDiscount > 0 ? itemDiscount : globalDiscount

    const basePrice = Number(item.cost ?? item.price ?? 0)
    const finalItemPrice = basePrice - basePrice * (effectiveDiscount / 100)
    const paidAmount = Number(item.paidAmount || 0)
    const isSelected = selectedItemIds.includes(item.id)

    const isPaidFull = item.isPaid || (paidAmount >= finalItemPrice - 0.01 && finalItemPrice > 0)
    const isPaidPartial = paidAmount > 0 && !isPaidFull

    return (
      <tr
        key={item.id}
        className={`transition-colors ${isSelected ? "bg-[#008bcd]/5" : "hover:bg-muted/30"}`}
      >
        <td className="px-4 py-3 text-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelectItem(item.id)}
            className="w-4 h-4 rounded border-border text-[#008bcd] focus:ring-[#008bcd] cursor-pointer"
          />
        </td>

        <td className="px-4 py-3 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none cursor-pointer mx-auto">
                {currentProg === 100 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/50" />
                ) : currentProg > 0 ? (
                  <div className="w-7 h-7 rounded-full bg-[#008bcd]/10 border border-[#008bcd]/30 text-[10px] font-black text-[#008bcd] dark:text-blue-400 flex items-center justify-center shadow-2xs">
                    {currentProg}%
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-muted/20 hover:border-[#008bcd] hover:bg-[#008bcd]/10 transition-colors"></div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-52 bg-card text-card-foreground border border-border shadow-xl rounded-xl text-xs font-semibold"
            >
              <DropdownMenuItem
                className="font-bold text-emerald-600 cursor-pointer"
                onClick={() => openEvolutionModal && openEvolutionModal(item, 100)}
              >
                Realizar (100%)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer font-bold"
                onClick={() => openEvolutionModal && openEvolutionModal(item, 75)}
              >
                Evolucionar a 75%
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer font-bold"
                onClick={() => openEvolutionModal && openEvolutionModal(item, 50)}
              >
                Evolucionar a 50%
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer font-bold"
                onClick={() => openEvolutionModal && openEvolutionModal(item, 25)}
              >
                Evolucionar a 25%
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500 font-bold border-t border-border/60 mt-1 cursor-pointer"
                onClick={() => openEvolutionModal && openEvolutionModal(item, 0)}
              >
                0% (Deshacer)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>

        <td className="px-4 py-3 font-bold text-foreground text-sm">
          {item.procedureName || item.name}
        </td>

        <td className="px-4 py-3 text-center">
          {item.tooth || item.toothNumber || item.region ? (
            <span className="inline-flex items-center gap-1 font-extrabold text-xs text-[#008bcd] dark:text-blue-400 bg-[#008bcd]/10 dark:bg-blue-500/15 border border-[#008bcd]/20 px-2.5 py-1 rounded-lg">
              {item.tooth || item.toothNumber || item.region}
            </span>
          ) : (
            <span className="text-muted-foreground font-semibold text-xs opacity-50">-</span>
          )}
        </td>

        <td className="px-4 py-3 text-center font-medium">
          <Popover
            open={editingItemId === item.id}
            onOpenChange={(open) => !open && setEditingItemId(null)}
          >
            <PopoverTrigger asChild>
              <button
                onClick={() => {
                  setEditingItemId(item.id)
                  setTempItemDiscount(itemDiscount.toString())
                }}
                className="text-xs font-bold text-[#008bcd] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                {itemDiscount > 0
                  ? `${itemDiscount}%`
                  : globalDiscount > 0
                  ? `${globalDiscount}% (Conv)`
                  : "0%"}{" "}
                <Edit2 className="w-3 h-3 stroke-[2] opacity-60 ml-0.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-48 p-3 bg-card border-border/80 shadow-xl rounded-xl"
              align="center"
            >
              <p className="text-xs font-bold text-muted-foreground mb-2">Descuento Ítem (%)</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={tempItemDiscount}
                  onChange={(e) => setTempItemDiscount(e.target.value)}
                  className="h-8 text-xs font-bold bg-background border-border/80 rounded-lg"
                />
                <Button
                  size="sm"
                  onClick={() => handleSaveItemDiscount(item.id)}
                  className="h-8 px-3 bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  OK
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </td>

        <td className="px-4 py-3 text-right font-mono">
          {effectiveDiscount > 0 ? (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground line-through">
                {currencySymbol}{" "}
                {basePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="font-bold text-foreground text-sm">
                {currencySymbol}{" "}
                {finalItemPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ) : (
            <span className="font-bold text-foreground text-sm">
              {currencySymbol}{" "}
              {basePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          )}
        </td>

        <td className="py-3 px-4 text-center">
          {isPaidFull ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Pagado
            </span>
          ) : isPaidPartial ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
              Abonado ({currencySymbol} {paidAmount.toFixed(2)})
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
              Pendiente
            </span>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden font-sans antialiased">
      {/* BARRA DE ACCIONES COMPLETA DELEGADA AL COMPONENTE */}
      <TreatmentActions
        onOpenSectionModal={setIsSectionModalOpen ? () => setIsSectionModalOpen(true) : undefined}
        onOpenCatalogModal={openCatalogModal ? () => openCatalogModal() : undefined}
        onOpenDiagnosis={setIsDiagnosisModalOpen ? () => setIsDiagnosisModalOpen(true) : undefined}
        selectedCount={selectedItemIds.length}
        sections={sections}
        isMoving={isMoving}
        onMoveToSection={handleBatchMoveSection}
        onTriggerPrint={triggerPrint}
        onTrashClick={handleTrashClick}
        onAssignRegion={handleAssignRegion}
      />

      {/* TABLA DE PRESTACIONES Y FASES */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-[11px] uppercase text-muted-foreground font-bold border-b border-border/80 bg-muted/25">
            <tr>
              <th className="px-4 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedItemIds.length === itemsList.length && itemsList.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border text-[#008bcd] focus:ring-[#008bcd] cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 w-12 text-center"></th>
              <th className="px-4 py-3 font-bold text-foreground">PRESTACIÓN</th>
              <th className="px-4 py-3 text-center">PIEZA / REGIÓN</th>
              <th className="px-4 py-3 text-center">DESCUENTO</th>
              <th className="px-4 py-3 text-right">PRECIO</th>
              <th className="px-4 py-3 text-center">ESTADO PAGO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {itemsList.length === 0 && sections.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-10 text-muted-foreground font-semibold text-xs"
                >
                  No hay prestaciones ni fases agregadas. Usa el botón "+ Sección" o "+ Prestación".
                </td>
              </tr>
            ) : (
              <>
                {unassignedItems.map(renderItemRow)}
                {sections.map((sec: any) => {
                  const secItems = itemsList.filter((item: any) => item.sectionId === sec.id)
                  const secTotal = secItems.reduce((acc: number, cur: any) => {
                    const price = Number(cur.cost ?? cur.price ?? 0)
                    const itmDisc = Number(cur.discount || 0)
                    const effDisc = itmDisc > 0 ? itmDisc : Number(planDiscountPercent || 0)
                    return acc + Math.max(0, price - price * (effDisc / 100))
                  }, 0)

                  return (
                    <React.Fragment key={sec.id}>
                      <tr className="bg-muted/30 border-y border-border/60">
                        <td colSpan={7} className="py-2.5 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-md bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center">
                                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                              </div>
                              <span className="font-extrabold text-xs text-[#008bcd] tracking-wide uppercase">
                                {sec.name}
                              </span>
                              <span className="text-[11px] font-medium text-muted-foreground">
                                ({secItems.length}{" "}
                                {secItems.length === 1 ? "prestación" : "prestaciones"})
                              </span>
                              {openCatalogModal && (
                                <button
                                  type="button"
                                  onClick={() => openCatalogModal(undefined, sec.id)}
                                  className="ml-2 text-[10px] font-bold text-[#008bcd] hover:text-[#0070a8] flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border border-border hover:border-[#008bcd] cursor-pointer shadow-2xs transition-colors"
                                >
                                  <Plus className="w-3 h-3 stroke-[2.5]" /> Añadir
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-muted-foreground">
                                Subtotal:{" "}
                                <strong className="text-foreground font-bold text-xs">
                                  {currencySymbol}{" "}
                                  {secTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </strong>
                              </span>
                              {onRequestDeleteSection && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRequestDeleteSection({ id: sec.id, name: sec.name })
                                  }
                                  title="Eliminar esta fase"
                                  className="text-muted-foreground hover:text-red-600 hover:bg-red-500/10 p-1 rounded-md transition-colors cursor-pointer"
                                >
                                  <X className="w-4 h-4 stroke-[2]" />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                      {secItems.length > 0 ? (
                        secItems.map(renderItemRow)
                      ) : (
                        <tr className="border-b border-border/40">
                          <td
                            colSpan={7}
                            className="py-3 text-center text-xs text-muted-foreground italic bg-background/50"
                          >
                            Sin prestaciones asignadas a esta fase.
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TreatmentTable