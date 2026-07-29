"use client"

import React, { useState } from "react"
import { 
  Plus, ChevronDown, CheckCircle2, Printer, Trash2, 
  Stethoscope, Edit2, FileText, Layers, Activity, Grid, DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel 
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function TreatmentTable({
  planItems,
  setIsSectionModalOpen,
  openCatalogModal,
  setIsDiagnosisModalOpen,
  setIsConfirmClearOpen,
  openEvolutionModal,
  onUpdateItemDiscount,
  onSelectPrintMode,
  onSelectRegion,
  onOpenPaymentModal // Nueva prop para abrir registro de abonos
}: any) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [tempItemDiscount, setTempItemDiscount] = useState<string>("0")

  const handleSaveItemDiscount = (itemId: string) => {
    const val = parseFloat(tempItemDiscount);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      onUpdateItemDiscount(itemId, val);
    }
    setEditingItemId(null);
  }

  const triggerPrint = (mode: string) => {
    if (onSelectPrintMode) onSelectPrintMode(mode);
    setTimeout(() => { window.print(); }, 150);
  }

  const handleRegionClick = (regionName: string) => {
    if (onSelectRegion) onSelectRegion(regionName);
    openCatalogModal();
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      
      {/* BARRA DE HERRAMIENTAS PREMIUM */}
      <div className="p-4 border-b border-border flex flex-wrap gap-2 items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          
          {/* BOTÓN SECCIÓN */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsSectionModalOpen(true)} 
            className="text-[#00b0e9] border-[#00b0e9]/50 hover:bg-[#00b0e9]/10 font-bold rounded-xl h-9"
          >
            <Plus className="w-4 h-4 mr-1"/> Sección
          </Button>
          
          {/* BOTÓN PRESTACIÓN (HOVER CORREGIDO ADAPTADO A DARK/LIGHT) */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => openCatalogModal()} 
            className="text-emerald-600 dark:text-emerald-400 border-emerald-600/50 dark:border-emerald-500/50 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 font-bold transition-colors rounded-xl h-9"
          >
            <Plus className="w-4 h-4 mr-1"/> Prestación
          </Button>
          
          {/* MENÚ DE ACCIONES MÉDICAS */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="font-bold border-border bg-background text-foreground hover:bg-muted rounded-xl h-9">
                Acciones <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 bg-card text-card-foreground border-border shadow-xl">
              <DropdownMenuItem onClick={() => setIsDiagnosisModalOpen(true)} className="font-bold cursor-pointer">
                <Stethoscope className="w-4 h-4 mr-2 text-[#00b0e9]" /> Ingresar Diagnóstico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* HERRAMIENTAS A LA DERECHA */}
        <div className="flex items-center gap-2">
          
          {/* DESPLEGABLE DE IMPRESIÓN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Opciones de Impresión" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl">
                <Printer className="w-4.5 h-4.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-xl">
              <DropdownMenuItem onClick={() => triggerPrint("COMPLETO")} className="font-semibold cursor-pointer">
                <FileText className="w-4 h-4 mr-2 text-[#00b0e9]" /> Presupuesto completo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => triggerPrint("SOLO_TOTAL")} className="font-semibold cursor-pointer">
                <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> Presupuesto sólo total
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => triggerPrint("SIN_DETALLE")} className="font-semibold cursor-pointer">
                <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> Presupuesto sin detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => triggerPrint("LABORATORIO")} className="font-semibold cursor-pointer border-t border-border">
                <Activity className="w-4 h-4 mr-2 text-amber-500" /> Orden de laboratorio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* VACIAR PRESUPUESTO */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsConfirmClearOpen(true)} 
            title="Vaciar Presupuesto" 
            className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </Button>

          {/* DESPLEGABLE FUNCIONAL: ARCADAS Y SEXTANTES */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-sm font-bold text-[#00b0e9] hover:underline flex items-center gap-1.5 ml-2 focus:outline-none">
                <Grid className="w-4 h-4" /> Arcadas y Sextantes <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-xl">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Arcadas Dentales</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleRegionClick("Arcada Superior (18-28)")} className="font-bold cursor-pointer">
                Arcada Superior
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRegionClick("Arcada Inferior (48-38)")} className="font-bold cursor-pointer">
                Arcada Inferior
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Sextantes</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleRegionClick("Sextante 1 (18-14)")} className="text-xs cursor-pointer">Sextante 1 (Piezas 18 a 14)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRegionClick("Sextante 2 (13-23)")} className="text-xs cursor-pointer">Sextante 2 (Piezas 13 a 23)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRegionClick("Sextante 3 (24-28)")} className="text-xs cursor-pointer">Sextante 3 (Piezas 24 a 28)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRegionClick("Sextante 4 (38-34)")} className="text-xs cursor-pointer">Sextante 4 (Piezas 38 a 34)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRegionClick("Sextante 5 (33-43)")} className="text-xs cursor-pointer">Sextante 5 (Piezas 33 a 43)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRegionClick("Sextante 6 (44-48)")} className="text-xs cursor-pointer">Sextante 6 (Piezas 44 a 48)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      {/* TABLA DE DETALLE DE PRESTACIONES */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs uppercase text-muted-foreground font-bold border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 w-12 text-center"></th>
              <th className="px-4 py-3 font-bold text-foreground">PRESTACIÓN</th>
              <th className="px-4 py-3 text-center">PIEZA</th>
              <th className="px-4 py-3 text-center">DESCUENTO</th>
              <th className="px-4 py-3 text-right">PRECIO</th>
              <th className="px-4 py-3 text-center">PAGO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {planItems.length > 0 ? (
              planItems.map((item: any) => {
                const currentProg = item.progress || (item.isCompleted ? 100 : 0);
                const itemDiscount = item.discount || 0;
                const basePrice = item.cost || 0;
                const finalItemPrice = basePrice - (basePrice * (itemDiscount / 100));
                const currentPaid = item.paidAmount || 0;
                const isFullyPaid = item.isPaid || (finalItemPrice === 0) || (currentPaid >= finalItemPrice && finalItemPrice > 0);
                const hasPartialPayment = currentPaid > 0 && !isFullyPaid;

                return (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    
                    {/* BOTÓN/CÍRCULO DE EVOLUCIÓN */}
                    <td className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none">
                            {currentProg === 100 ? (
                              <CheckCircle2 className="w-7 h-7 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/50" />
                            ) : currentProg > 0 ? (
                              <div className="w-7 h-7 rounded-full border-2 border-emerald-500 text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/30">
                                {currentProg}%
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-700 hover:border-[#00b0e9] bg-transparent"></div>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52 bg-card text-card-foreground border-border shadow-xl">
                          <DropdownMenuItem className="font-bold text-emerald-600 cursor-pointer" onClick={() => openEvolutionModal(item, 100)}>Realizar (100%)</DropdownMenuItem>
                          <DropdownMenuItem className="font-semibold cursor-pointer" onClick={() => openEvolutionModal(item, 75)}>75%</DropdownMenuItem>
                          <DropdownMenuItem className="font-semibold cursor-pointer" onClick={() => openEvolutionModal(item, 50)}>50%</DropdownMenuItem>
                          <DropdownMenuItem className="font-semibold cursor-pointer" onClick={() => openEvolutionModal(item, 25)}>25%</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 font-bold border-t border-border mt-1 cursor-pointer" onClick={() => openEvolutionModal(item, 0)}>0% (Deshacer)</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* NOMBRE DE PRESTACIÓN */}
                    <td className="px-4 py-3 font-bold text-foreground text-sm">{item.procedureName}</td>
                    
                    {/* PIEZA O REGIÓN */}
                    <td className="px-4 py-3 text-center">
                      {item.tooth ? (
                        <span className="border border-border rounded px-2.5 py-1 text-xs font-bold text-[#00b0e9] bg-muted/40">
                          {item.tooth}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-medium text-xs">-</span>
                      )}
                    </td>

                    {/* COLUMNA DESCUENTO INDIVIDUAL */}
                    <td className="px-4 py-3 text-center font-medium">
                      <Popover open={editingItemId === item.id} onOpenChange={(open) => !open && setEditingItemId(null)}>
                        <PopoverTrigger asChild>
                          <button 
                            onClick={() => {
                              setEditingItemId(item.id);
                              setTempItemDiscount(itemDiscount.toString());
                            }}
                            className="text-xs font-bold text-[#00b0e9] hover:underline flex items-center justify-center gap-1 mx-auto"
                          >
                            {itemDiscount}% <Edit2 className="w-3 h-3 opacity-60" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-3 bg-card border-border shadow-xl" align="center">
                          <p className="text-xs font-bold text-muted-foreground mb-2">Descuento Ítem (%)</p>
                          <div className="flex gap-2">
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              value={tempItemDiscount} 
                              onChange={(e) => setTempItemDiscount(e.target.value)} 
                              className="h-8 text-xs font-bold bg-background border-border" 
                            />
                            <Button size="sm" onClick={() => handleSaveItemDiscount(item.id)} className="h-8 px-3 bg-[#00b0e9] text-white font-bold text-xs">
                              OK
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>

                    {/* PRECIO FINAL CALCULADO */}
                    <td className="px-4 py-3 text-right font-black text-foreground">
                      ${finalItemPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* ESTADO Y REGISTRO DE PAGO / ABONO */}
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => onOpenPaymentModal && onOpenPaymentModal(item)}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:scale-110 transition-transform mx-auto focus:outline-none"
                        title={isFullyPaid ? "Totalmente Pagado" : hasPartialPayment ? "Abono Parcial Registrado" : "Pendiente de Pago"}
                      >
                        {isFullyPaid ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" />
                        ) : hasPartialPayment ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm" />
                        )}
                      </button>
                    </td>

                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted-foreground font-medium">
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