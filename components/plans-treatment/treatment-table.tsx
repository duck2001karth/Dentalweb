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
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel 
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function TreatmentTable({
  planItems = [],
  setIsSectionModalOpen,
  openCatalogModal,
  setIsDiagnosisModalOpen,
  setIsConfirmClearOpen,
  onDeleteSelectedItems,
  openEvolutionModal,
  onUpdateItemDiscount,
  onSelectPrintMode,
  onSelectRegion
}: any) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [tempItemDiscount, setTempItemDiscount] = useState<string>("0")

  // Control de selección de ítems
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedItemIds.length === planItems.length) {
      setSelectedItemIds([])
    } else {
      setSelectedItemIds(planItems.map((item: any) => item.id))
    }
  }

  // Lógica de borrado: si hay ítems marcados, borra los seleccionados. Si no hay ninguno, abre la alerta general.
  const handleTrashClick = () => {
    if (selectedItemIds.length > 0) {
      if (onDeleteSelectedItems) {
        onDeleteSelectedItems(selectedItemIds)
      } else if (setIsConfirmClearOpen) {
        setIsConfirmClearOpen(true)
      }
      setSelectedItemIds([])
    } else {
      if (setIsConfirmClearOpen) {
        setIsConfirmClearOpen(true)
      }
    }
  }

  const handleSaveItemDiscount = (itemId: string) => {
    const val = parseFloat(tempItemDiscount)
    if (!isNaN(val) && val >= 0 && val <= 100) {
      onUpdateItemDiscount(itemId, val)
    }
    setEditingItemId(null)
  }

  const triggerPrint = (mode: string) => {
    if (onSelectPrintMode) onSelectPrintMode(mode)
    setTimeout(() => { window.print() }, 150)
  }

  return (
    <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden font-sans antialiased">
      
      {/* BARRA DE HERRAMIENTAS */}
      <div className="p-4 border-b border-border/80 flex flex-wrap gap-2 items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsSectionModalOpen(true)} 
            className="text-[#008bcd] border-[#008bcd]/50 hover:bg-[#008bcd]/10 font-bold rounded-xl h-9 text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]"/> Sección
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => openCatalogModal()} 
            className="text-emerald-600 dark:text-emerald-400 border-emerald-600/50 hover:bg-emerald-500/10 font-bold rounded-xl h-9 text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]"/> Prestación
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="font-bold border-border/80 bg-background text-foreground hover:bg-muted rounded-xl h-9 text-xs cursor-pointer">
                Acciones <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 bg-card text-card-foreground border-border/80 shadow-xl rounded-xl text-xs font-semibold">
              <DropdownMenuItem onClick={() => setIsDiagnosisModalOpen(true)} className="font-bold cursor-pointer py-2">
                <Stethoscope className="w-4 h-4 mr-2 text-[#008bcd]" /> Ingresar Diagnóstico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          
          {/* OPCIONES DE IMPRESIÓN */}
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

          {/* BOTÓN DE ELIMINAR (FUNCIONAL PARA ÍTEMS MARCADOS O PRESUPUESTO COMPLETO) */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleTrashClick}
            title={selectedItemIds.length > 0 ? `Eliminar (${selectedItemIds.length}) seleccionados` : "Vaciar presupuesto"} 
            className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-xl cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {/* ARCADAS Y SEXTANTES */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-xs font-bold text-[#008bcd] hover:underline flex items-center gap-1.5 ml-2 focus:outline-none cursor-pointer">
                <Grid className="w-4 h-4" /> Arcadas y Sextantes <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border/80 shadow-xl rounded-xl text-xs font-semibold">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Arcadas Dentales</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onSelectRegion && onSelectRegion("Arcada Superior")} className="font-bold cursor-pointer">
                Arcada Superior
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelectRegion && onSelectRegion("Arcada Inferior")} className="font-bold cursor-pointer">
                Arcada Inferior
              </DropdownMenuItem>
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
              <th className="px-4 py-3 text-center">PIEZA</th>
              <th className="px-4 py-3 text-center">DESCUENTO</th>
              <th className="px-4 py-3 text-right">PRECIO</th>
              <th className="px-4 py-3 text-center">ESTADO PAGO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {planItems.length > 0 ? (
              planItems.map((item: any) => {
                const currentProg = item.progress || (item.isCompleted ? 100 : 0)
                const itemDiscount = item.discount || 0
                const basePrice = item.cost || item.price || 0
                const finalItemPrice = basePrice - (basePrice * (itemDiscount / 100))
                const isSelected = selectedItemIds.includes(item.id)

                return (
                  <tr key={item.id} className={`transition-colors ${isSelected ? "bg-[#008bcd]/5" : "hover:bg-muted/20"}`}>
                    
                    {/* CHECKBOX DE SELECCIÓN */}
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-border text-[#008bcd] focus:ring-[#008bcd] cursor-pointer"
                      />
                    </td>

                    {/* BOTÓN CÍRCULO CON MENÚ DESPLEGABLE DE EVOLUCIÓN POR PORCENTAJES */}
                    <td className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none cursor-pointer mx-auto">
                            {currentProg === 100 ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/50" />
                            ) : currentProg > 0 ? (
                              <div className="w-6 h-6 rounded-full border-2 border-emerald-500 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/30">
                                {currentProg}%
                              </div>
                            ) : (
                              /* Círculo 0% resaltado */
                              <div className="w-6 h-6 rounded-full border-2 border-slate-400 dark:border-slate-600 bg-muted/40 hover:border-[#008bcd] hover:bg-[#008bcd]/10 transition-colors"></div>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52 bg-card text-card-foreground border border-border shadow-xl rounded-xl text-xs font-semibold">
                          <DropdownMenuItem className="font-bold text-emerald-600 cursor-pointer" onClick={() => openEvolutionModal(item, 100)}>
                            Realizar (100%)
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-bold" onClick={() => openEvolutionModal(item, 75)}>
                            Evolucionar a 75%
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-bold" onClick={() => openEvolutionModal(item, 50)}>
                            Evolucionar a 50%
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer font-bold" onClick={() => openEvolutionModal(item, 25)}>
                            Evolucionar a 25%
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 font-bold border-t border-border/60 mt-1 cursor-pointer" onClick={() => openEvolutionModal(item, 0)}>
                            0% (Deshacer)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* NOMBRE DE PRESTACIÓN */}
                    <td className="px-4 py-3 font-bold text-foreground text-sm">
                      {item.procedureName || item.name}
                    </td>

                    {/* PIEZA DENTAL */}
                    <td className="px-4 py-3 text-center">
                      {item.tooth || item.toothNumber ? (
                        <span className="border border-border/80 rounded-lg px-2.5 py-1 text-xs font-bold text-[#008bcd] bg-muted/30">
                          {item.tooth || item.toothNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-medium text-xs">-</span>
                      )}
                    </td>

                    {/* DESCUENTO INDIVIDUAL EDITABLE */}
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

                    {/* PRECIO CALCULADO */}
                    <td className="px-4 py-3 text-right font-bold text-foreground text-sm">
                      ${finalItemPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* ESTADO DE PAGO */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-muted-foreground bg-muted/40 border border-border/60 px-2.5 py-1 rounded-lg">
                        Pendiente
                      </span>
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