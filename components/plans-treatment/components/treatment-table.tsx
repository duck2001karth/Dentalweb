"use client"

import React, { useState } from "react"
import { 
  Plus, ChevronDown, CheckCircle2, Printer, Trash2, 
  Stethoscope, Edit2, FileText, Activity, Grid
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuLabel 
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useClinicSettings } from "@/config/clinic-settings"

interface TreatmentItem {
  id: string
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
}

interface TreatmentTableProps {
  planItems?: TreatmentItem[] | any[]
  planDiscountPercent?: number // <--- AGREGAR ESTA LÍNEA
  setIsSectionModalOpen?: (open: boolean) => void
  openCatalogModal?: (region?: string) => void
  setIsDiagnosisModalOpen?: (open: boolean) => void
  setIsConfirmClearOpen?: () => void
  onDeleteSelectedItems?: (ids: string[]) => void
  openEvolutionModal?: (item: any, progress: number) => void
  onUpdateItemDiscount?: (itemId: string, discount: number) => Promise<void> | void
  onUpdateItemRegion?: (itemId: string, region: string) => Promise<void> | void
  onSelectPrintMode?: (mode: string) => void
}

export function TreatmentTable({
  planItems = [],
  setIsSectionModalOpen,
  openCatalogModal,
  setIsDiagnosisModalOpen,
  setIsConfirmClearOpen,
  onDeleteSelectedItems,
  openEvolutionModal,
  onUpdateItemDiscount,
  onUpdateItemRegion,
  onSelectPrintMode
}: TreatmentTableProps) {
  const { settings } = useClinicSettings()
  const currencySymbol = (settings as any)?.currencySymbol || (settings as any)?.currency || "$"

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [tempItemDiscount, setTempItemDiscount] = useState<string>("0")

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedItemIds.length === planItems.length) {
      setSelectedItemIds([])
    } else {
      setSelectedItemIds(planItems.map((item) => item.id))
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
      selectedItemIds.forEach(id => {
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

 const triggerPrint = (mode: string) => {
    if (onSelectPrintMode) {
      onSelectPrintMode(mode)
    }
    document.body.classList.add("printing-treatment-plan")

    setTimeout(() => {
      window.print()
      setTimeout(() => {
        document.body.classList.remove("printing-treatment-plan")
      }, 500)
    }, 150)
  }

  return (
    <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden font-sans antialiased">
      
      {/* BARRA DE HERRAMIENTAS */}
      <div className="p-4 border-b border-border/80 flex flex-wrap gap-2 items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          
          {setIsSectionModalOpen && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsSectionModalOpen(true)} 
              className="text-[#008bcd] border-[#008bcd]/50 hover:bg-[#008bcd]/10 font-bold rounded-xl h-9 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1 stroke-[2.5]"/> Sección
            </Button>
          )}
          
          {openCatalogModal && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openCatalogModal()} 
              className="text-emerald-600 dark:text-emerald-400 border-emerald-600/50 hover:bg-emerald-500/10 font-bold rounded-xl h-9 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1 stroke-[2.5]"/> Prestación
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="font-bold border-border/80 bg-background text-foreground hover:bg-muted rounded-xl h-9 text-xs cursor-pointer">
                Acciones <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 bg-card text-card-foreground border-border/80 shadow-xl rounded-xl text-xs font-semibold">
              <DropdownMenuItem 
                onClick={() => setIsDiagnosisModalOpen && setIsDiagnosisModalOpen(true)} 
                className="font-bold cursor-pointer py-2"
              >
                <Stethoscope className="w-4 h-4 mr-2 text-[#008bcd]" /> Ingresar Diagnóstico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Opciones de Impresión" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl cursor-pointer">
                <Printer className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border/80 shadow-xl rounded-xl text-xs font-semibold">
              <DropdownMenuItem onClick={() => triggerPrint("COMPLETO")} className="cursor-pointer py-2">
                <FileText className="w-4 h-4 mr-2 text-[#008bcd]" /> Presupuesto completo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => triggerPrint("SOLO_TOTAL")} className="cursor-pointer py-2">
                <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> Presupuesto sólo total
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => triggerPrint("SIN_DETALLE")} className="cursor-pointer py-2">
                <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> Presupuesto sin detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => triggerPrint("LABORATORIO")} className="cursor-pointer py-2 border-t border-border/60">
                <Activity className="w-4 h-4 mr-2 text-amber-500" /> Orden de laboratorio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleTrashClick}
            title={selectedItemIds.length > 0 ? `Eliminar (${selectedItemIds.length}) seleccionados` : "Vaciar presupuesto"} 
            className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-xl cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-xs font-bold text-[#008bcd] hover:underline flex items-center gap-1.5 ml-2 focus:outline-none cursor-pointer">
                <Grid className="w-4 h-4" /> Arcadas y Sextantes <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border/80 shadow-xl rounded-xl text-xs font-semibold">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Arcadas Dentales</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleAssignRegion("Arcada Superior")} className="font-bold cursor-pointer">
                Arcada Superior
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAssignRegion("Arcada Inferior")} className="font-bold cursor-pointer">
                Arcada Inferior
              </DropdownMenuItem>
              
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground border-t border-border/60 mt-1 pt-2">Sextantes</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleAssignRegion("Sextante 1 (18-14)")} className="cursor-pointer">Sextante 1 (18 a 14)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAssignRegion("Sextante 2 (13-23)")} className="cursor-pointer">Sextante 2 (13 a 23)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAssignRegion("Sextante 3 (24-28)")} className="cursor-pointer">Sextante 3 (24 a 28)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAssignRegion("Sextante 4 (38-34)")} className="cursor-pointer">Sextante 4 (38 a 34)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAssignRegion("Sextante 5 (33-43)")} className="cursor-pointer">Sextante 5 (33 a 43)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAssignRegion("Sextante 6 (44-48)")} className="cursor-pointer">Sextante 6 (44 a 48)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      {/* TABLA DE PRESTACIONES */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs uppercase text-muted-foreground font-bold border-b border-border/80 bg-muted/30">
            <tr>
              <th className="px-4 py-3 w-10 text-center">
                <input 
                  type="checkbox" 
                  checked={selectedItemIds.length === planItems.length && planItems.length > 0}
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
          <tbody className="divide-y divide-border/60">
            {planItems.length > 0 ? (
              planItems.map((item) => {
                const currentProg = item.progress || (item.isCompleted ? 100 : 0)
                const itemDiscount = item.discount || 0
                const basePrice = Number(item.cost ?? item.price ?? 0)
                const finalItemPrice = basePrice - (basePrice * (itemDiscount / 100))
                const paidAmount = Number(item.paidAmount || 0)
                const isSelected = selectedItemIds.includes(item.id)

                const isPaidFull = item.isPaid || paidAmount >= (finalItemPrice - 0.01)
                const isPaidPartial = paidAmount > 0 && !isPaidFull

                return (
                  <tr key={item.id} className={`transition-colors ${isSelected ? "bg-[#008bcd]/5" : "hover:bg-muted/20"}`}>
                    
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-border text-[#008bcd] focus:ring-[#008bcd] cursor-pointer"
                      />
                    </td>

                    {/* INDICADOR VISUAL DEL PORCENTAJE */}
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
                        <DropdownMenuContent align="start" className="w-52 bg-card text-card-foreground border border-border shadow-xl rounded-xl text-xs font-semibold">
                          <DropdownMenuItem className="font-bold text-emerald-600 cursor-pointer" onClick={() => openEvolutionModal && openEvolutionModal(item, 100)}>
                            Realizar (100%)
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-bold" onClick={() => openEvolutionModal && openEvolutionModal(item, 75)}>
                            Evolucionar a 75%
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-bold" onClick={() => openEvolutionModal && openEvolutionModal(item, 50)}>
                            Evolucionar a 50%
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-bold" onClick={() => openEvolutionModal && openEvolutionModal(item, 25)}>
                            Evolucionar a 25%
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 font-bold border-t border-border/60 mt-1 cursor-pointer" onClick={() => openEvolutionModal && openEvolutionModal(item, 0)}>
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
                      <Popover open={editingItemId === item.id} onOpenChange={(open) => !open && setEditingItemId(null)}>
                        <PopoverTrigger asChild>
                          <button 
                            onClick={() => {
                              setEditingItemId(item.id)
                              setTempItemDiscount(itemDiscount.toString())
                            }}
                            className="text-xs font-bold text-[#008bcd] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          >
                            {itemDiscount}% <Edit2 className="w-3 h-3 stroke-[2] opacity-60" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-3 bg-card border-border/80 shadow-xl rounded-xl" align="center">
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
                            <Button size="sm" onClick={() => handleSaveItemDiscount(item.id)} className="h-8 px-3 bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold text-xs rounded-lg cursor-pointer">
                              OK
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-foreground text-sm font-mono">
                      {currencySymbol}{finalItemPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isPaidFull ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Pagado
                        </span>
                      ) : isPaidPartial ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                          Abonado ({currencySymbol}{paidAmount.toFixed(2)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                          Pendiente
                        </span>
                      )}
                    </td>

                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-10 text-muted-foreground font-semibold text-xs">
                  No hay prestaciones agregadas. Usa el odontograma o el botón "+ Prestación".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TreatmentTable