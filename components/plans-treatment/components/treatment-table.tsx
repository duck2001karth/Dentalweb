"use client"

import React, { useState, useEffect } from "react"
import { CheckCircle2, Edit2, Layers, Plus, X, GripVertical } from "lucide-react"
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

// --- DND-KIT IMPORTS ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// --- INTERFACES ---
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

// --- 1. COMPONENTE PARA LA FILA ARRASTRABLE ---
function SortableItemRow({ 
  item, 
  isSelected, 
  toggleSelectItem, 
  openEvolutionModal, 
  editingItemId, 
  setEditingItemId, 
  tempItemDiscount, 
  setTempItemDiscount, 
  handleSaveItemDiscount, 
  globalDiscount, 
  currencySymbol 
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : "auto",
    position: isDragging ? ("relative" as const) : ("static" as const),
    boxShadow: isDragging ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)" : "none",
  }

  const currentProg = item.progress || (item.isCompleted ? 100 : 0)
  const itemDiscount = Number(item.discount || 0)
  const effectiveDiscount = itemDiscount > 0 ? itemDiscount : globalDiscount
  const basePrice = Number(item.cost ?? item.price ?? 0)
  const finalItemPrice = basePrice - basePrice * (effectiveDiscount / 100)
  const paidAmount = Number(item.paidAmount || 0)
  const isPaidFull = item.isPaid || (paidAmount >= finalItemPrice - 0.01 && finalItemPrice > 0)
  const isPaidPartial = paidAmount > 0 && !isPaidFull

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`transition-colors group bg-card ${isSelected ? "bg-[#008bcd]/5" : "hover:bg-muted/40"}`}
    >
      <td className="px-4 py-3 text-center w-12">
        <div className="flex items-center gap-2">
          {/* GRIP PARA ARRASTRAR */}
          <button 
            {...attributes} 
            {...listeners} 
            className="cursor-grab text-muted-foreground/40 hover:text-foreground touch-none transition-colors"
            title="Arrastrar para mover o reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelectItem(item.id)}
            className="w-4 h-4 rounded border-border text-[#008bcd] focus:ring-[#008bcd] cursor-pointer"
          />
        </div>
      </td>
      <td className="px-4 py-3 text-center w-12">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none cursor-pointer mx-auto">
              {currentProg === 100 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/50" />
              ) : currentProg > 0 ? (
                <div className="w-7 h-7 rounded-full bg-[#008bcd]/10 border border-[#008bcd]/30 text-[10px] font-black text-[#008bcd] flex items-center justify-center shadow-2xs">
                  {currentProg}%
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-muted/20 hover:border-[#008bcd] hover:bg-[#008bcd]/10 transition-colors"></div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-card text-foreground border border-border shadow-xl rounded-xl text-xs font-semibold">
            <DropdownMenuItem className="font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer" onClick={() => openEvolutionModal && openEvolutionModal(item, 100)}>Realizar (100%)</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-bold" onClick={() => openEvolutionModal && openEvolutionModal(item, 75)}>Evolucionar a 75%</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-bold" onClick={() => openEvolutionModal && openEvolutionModal(item, 50)}>Evolucionar a 50%</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer font-bold" onClick={() => openEvolutionModal && openEvolutionModal(item, 25)}>Evolucionar a 25%</DropdownMenuItem>
            <DropdownMenuItem className="text-rose-500 font-bold border-t border-border/60 mt-1 cursor-pointer" onClick={() => openEvolutionModal && openEvolutionModal(item, 0)}>0% (Deshacer)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
      <td className="px-4 py-3 font-bold text-foreground text-sm truncate max-w-[220px]">
        {item.procedureName || item.name}
      </td>
      <td className="px-4 py-3 text-center">
        {item.tooth || item.toothNumber || item.region ? (
          <span className="inline-flex items-center gap-1 font-extrabold text-xs text-[#008bcd] bg-[#008bcd]/10 border border-[#008bcd]/20 px-2.5 py-1 rounded-lg">
            {item.tooth || item.toothNumber || item.region}
          </span>
        ) : (
          <span className="text-muted-foreground font-semibold text-xs opacity-50">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center font-medium">
        <Popover open={editingItemId === item.id} onOpenChange={(open) => !open && setEditingItemId(null)}>
          <PopoverTrigger asChild>
            <button onClick={() => { setEditingItemId(item.id); setTempItemDiscount(itemDiscount.toString()) }} className="text-xs font-bold text-[#008bcd] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer">
              {itemDiscount > 0 ? `${itemDiscount}%` : globalDiscount > 0 ? `${globalDiscount}% (Conv)` : "0%"} <Edit2 className="w-3 h-3 stroke-[2] opacity-60 ml-0.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3 bg-card border-border shadow-xl rounded-xl" align="center">
            <p className="text-xs font-bold text-muted-foreground mb-2">Descuento ítem (%)</p>
            <div className="flex gap-2">
              <Input type="number" min="0" max="100" value={tempItemDiscount} onChange={(e) => setTempItemDiscount(e.target.value)} className="h-8 text-xs font-bold bg-background border-border rounded-lg" />
              <Button size="sm" onClick={() => handleSaveItemDiscount(item.id)} className="h-8 px-3 bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold text-xs rounded-lg cursor-pointer">OK</Button>
            </div>
          </PopoverContent>
        </Popover>
      </td>
      <td className="px-4 py-3 text-right font-mono">
        {effectiveDiscount > 0 ? (
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground line-through">{currencySymbol} {basePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            <span className="font-bold text-foreground text-sm">{currencySymbol} {finalItemPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
        ) : (
          <span className="font-bold text-foreground text-sm">{currencySymbol} {basePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        {isPaidFull ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">Pagado</span>
        ) : isPaidPartial ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">Abonado</span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">Pendiente</span>
        )}
      </td>
    </tr>
  )
}

// --- 2. ZONAS PARA SOLTAR (DROPPABLE) ---
function DroppableSectionHeader({ sec, children }: any) {
  const { isOver, setNodeRef } = useDroppable({
    id: `header-${sec.id}`,
    data: { isSection: true, sectionId: sec.id }
  })
  return (
    <tr ref={setNodeRef} className={`border-y border-border/80 transition-colors ${isOver ? 'bg-[#008bcd]/20 ring-2 ring-inset ring-[#008bcd]' : 'bg-muted/40'}`}>
      {children}
    </tr>
  )
}

function DroppableEmptyState({ sectionId, children }: any) {
  const { isOver, setNodeRef } = useDroppable({
    id: `empty-${sectionId}`,
    data: { isSection: true, sectionId: sectionId }
  })
  return (
    <tr ref={setNodeRef} className={`border-b border-border/40 transition-colors ${isOver ? 'bg-[#008bcd]/10' : ''}`}>
      {children}
    </tr>
  )
}

// --- 3. COMPONENTE PRINCIPAL ---
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
}: any) {
  const { toast } = useToast()
  const { settings } = useClinicSettings()
  const currencySymbol = (settings as any)?.currencySymbol || "$"
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [tempItemDiscount, setTempItemDiscount] = useState<string>("0")
  const [isMoving, setIsMoving] = useState(false)
  const [itemsList, setItemsList] = useState<any[]>(planItems)

  useEffect(() => {
    setItemsList(planItems)
  }, [planItems])

  // Configuración de sensores para DND
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), 
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // LOGICA AVANZADA: Mover a base de datos al soltar el drag & drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeItem = itemsList.find((item) => item.id === active.id)
    if (!activeItem) return

    // 1. Si se soltó sobre una CABECERA de fase o espacio vacío
    if (over.data?.current?.isSection) {
      const targetSectionId = over.data.current.sectionId
      if (activeItem.sectionId !== targetSectionId) {
        await moveSingleItemToSection(activeItem.id, targetSectionId)
      }
      return
    }

    // 2. Si se soltó sobre OTRA PRESTACIÓN
    const overItem = itemsList.find((item) => item.id === over.id)
    if (overItem) {
      if (activeItem.sectionId !== overItem.sectionId) {
        // Mover de fase (se guarda en BD)
        await moveSingleItemToSection(activeItem.id, overItem.sectionId)
      } else {
        // Solo reordenar visualmente en la misma fase
        setItemsList((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id)
          const newIndex = items.findIndex((item) => item.id === over.id)
          return arrayMove(items, oldIndex, newIndex)
        })
      }
    }
  }

  const moveSingleItemToSection = async (itemId: string, targetSectionId: string | null) => {
    const previousItems = [...itemsList]
    setItemsList((prev) => prev.map((item) => (item.id === itemId ? { ...item, sectionId: targetSectionId } : item)))
    try {
      setIsMoving(true)
      const effectivePlanId = planId || (planItems[0] as any)?.treatmentPlanId
      const res = await fetch(`/api/treatments/${effectivePlanId}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: [itemId], sectionId: targetSectionId }),
      })
      if (!res.ok) throw new Error()
      if (onPlanUpdate) await onPlanUpdate()
    } catch {
      setItemsList(previousItems)
      toast({ title: "Error al mover", variant: "destructive" })
    } finally {
      setIsMoving(false)
    }
  }

  const handleBatchMoveSection = async (targetSectionId: string | null, sectionName: string) => {
    if (selectedItemIds.length === 0) {
      toast({ title: "Selecciona prestaciones", description: "Marca al menos una casilla." })
      return
    }
    const effectivePlanId = planId || (planItems[0] as any)?.treatmentPlanId
    const movingIds = [...selectedItemIds]
    const previousItems = [...itemsList]
    setItemsList((prev) => prev.map((item) => (movingIds.includes(item.id) ? { ...item, sectionId: targetSectionId } : item)))
    setSelectedItemIds([])
    try {
      setIsMoving(true)
      const res = await fetch(`/api/treatments/${effectivePlanId}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: movingIds, sectionId: targetSectionId }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Prestaciones reasignadas", variant: "success" })
      if (onPlanUpdate) await onPlanUpdate()
    } catch {
      setItemsList(previousItems)
      toast({ title: "Error al mover", variant: "destructive" })
    } finally {
      setIsMoving(false)
    }
  }

  const toggleSelectItem = (id: string) => setSelectedItemIds((prev) => prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id])
  const toggleSelectAll = () => {
    if (selectedItemIds.length === itemsList.length && itemsList.length > 0) setSelectedItemIds([])
    else setSelectedItemIds(itemsList.map((item) => item.id))
  }

  const unassignedItems = itemsList.filter((item) => !item.sectionId)

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden font-sans antialiased">
      <TreatmentActions
        onOpenSectionModal={setIsSectionModalOpen ? () => setIsSectionModalOpen(true) : undefined}
        onOpenCatalogModal={openCatalogModal ? () => openCatalogModal() : undefined}
        onOpenDiagnosis={setIsDiagnosisModalOpen ? () => setIsDiagnosisModalOpen(true) : undefined}
        selectedCount={selectedItemIds.length}
        sections={sections}
        isMoving={isMoving}
        onMoveToSection={handleBatchMoveSection}
        onTrashClick={() => selectedItemIds.length > 0 ? onDeleteSelectedItems(selectedItemIds) : setIsConfirmClearOpen()}
        onTriggerPrint={onSelectPrintMode}
      />

      <div className="overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] uppercase text-muted-foreground font-bold border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 w-16 text-center">
                  <input type="checkbox" checked={selectedItemIds.length === itemsList.length && itemsList.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-border text-[#008bcd]" />
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
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground font-semibold text-xs">No hay prestaciones ni fases agregadas.</td></tr>
              ) : (
                <SortableContext items={itemsList.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  
                  {/* Ítems Sin Fase */}
                  {unassignedItems.map(item => (
                     <SortableItemRow key={item.id} item={item} isSelected={selectedItemIds.includes(item.id)} toggleSelectItem={toggleSelectItem} openEvolutionModal={openEvolutionModal} editingItemId={editingItemId} setEditingItemId={setEditingItemId} tempItemDiscount={tempItemDiscount} setTempItemDiscount={setTempItemDiscount} handleSaveItemDiscount={(id: string) => { if(onUpdateItemDiscount) onUpdateItemDiscount(id, parseFloat(tempItemDiscount)); setEditingItemId(null) }} globalDiscount={planDiscountPercent} currencySymbol={currencySymbol} />
                  ))}

                  {/* Fases y sus Prestaciones */}
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
                        {/* Cabecera Droppable */}
                        <DroppableSectionHeader sec={sec}>
                          <td colSpan={7} className="py-2.5 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-md bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center">
                                  <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                                </div>
                                <span className="font-extrabold text-xs text-[#008bcd] uppercase">{sec.name}</span>
                                <span className="text-[11px] font-medium text-muted-foreground">
                                  ({secItems.length} {secItems.length === 1 ? "prestación" : "prestaciones"})
                                </span>
                                {openCatalogModal && (
                                  <button type="button" onClick={() => openCatalogModal(undefined, sec.id)} className="ml-2 text-[10px] font-bold text-[#008bcd] hover:text-[#0070a8] flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border border-border hover:border-[#008bcd] shadow-2xs transition-colors">
                                    <Plus className="w-3 h-3 stroke-[2.5]" /> Añadir
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-muted-foreground">
                                  Subtotal: <strong className="text-foreground font-bold text-xs">{currencySymbol} {secTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                                </span>
                                {onRequestDeleteSection && (
                                  <button type="button" onClick={() => onRequestDeleteSection({ id: sec.id, name: sec.name })} title="Eliminar fase" className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-1 rounded-md transition-colors">
                                    <X className="w-4 h-4 stroke-[2]" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </DroppableSectionHeader>

                        {/* Ítems o Espacio vacío Droppable */}
                        {secItems.length > 0 ? (
                          secItems.map((item: any) => (
                            <SortableItemRow key={item.id} item={item} isSelected={selectedItemIds.includes(item.id)} toggleSelectItem={toggleSelectItem} openEvolutionModal={openEvolutionModal} editingItemId={editingItemId} setEditingItemId={setEditingItemId} tempItemDiscount={tempItemDiscount} setTempItemDiscount={setTempItemDiscount} handleSaveItemDiscount={(id: string) => { if(onUpdateItemDiscount) onUpdateItemDiscount(id, parseFloat(tempItemDiscount)); setEditingItemId(null) }} globalDiscount={planDiscountPercent} currencySymbol={currencySymbol} />
                          ))
                        ) : (
                          <DroppableEmptyState sectionId={sec.id}>
                            <td colSpan={7} className="py-4 text-center text-xs text-muted-foreground/70 italic bg-background/50">
                              Arrastra una prestación y suéltala aquí para moverla a esta fase.
                            </td>
                          </DroppableEmptyState>
                        )}
                      </React.Fragment>
                    )
                  })}
                </SortableContext>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  )
}