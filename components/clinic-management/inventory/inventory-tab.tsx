"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { 
  AlertTriangle, Download, ArrowDownToLine, ArrowUpFromLine, 
  MoreVertical, Search, Package, Trash2, Edit, Plus, 
  History, ShieldCheck, Filter, Loader2, User, Building2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// ==========================================
// 1. INTERFACES
// ==========================================

export interface InventoryItem {
  id: string
  name: string
  sku: string | null
  marca: string | null
  presentacion: string | null
  stock: number
  minStock: number
  unitCost: number
  isActive: boolean
}

export interface InventoryMovement {
  id: string
  itemId: string
  item?: InventoryItem
  quantity: number
  type: "INCOMING" | "OUTGOING"
  reason: string | null
  createdAt: string
}

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================

export function InventoryTab() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "MOVEMENTS">("PRODUCTS")
  
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("ALL")

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [movementType, setMovementType] = useState<"INCOMING" | "OUTGOING">("INCOMING")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [resItems, resMovements] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/movements')
      ])
      
      if (resItems.ok) setItems(await resItems.json())
      if (resMovements.ok) setMovements(await resMovements.json())
    } catch (error) {
      toast({ title: "Error de conexión", description: "No se pudo cargar el inventario.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca?.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesSearch) return false
      if (filterType === "LOW_STOCK") return item.stock > 0 && item.stock <= item.minStock
      if (filterType === "OUT_OF_STOCK") return item.stock === 0
      
      return true
    })
  }, [items, searchTerm, filterType])

  const lowStockItems = items.filter(p => p.stock <= p.minStock)

  const openProductModal = (item?: InventoryItem) => {
    setSelectedItem(item || null)
    setIsProductModalOpen(true)
  }

  const openMovementModal = (type: "INCOMING" | "OUTGOING", item?: InventoryItem) => {
    setMovementType(type)
    setSelectedItem(item || null)
    setIsMovementModalOpen(true)
  }

  return (
    <div className="flex flex-col flex-1 font-sans antialiased animate-in fade-in duration-300 pb-10">
      
      {/* 1. HEADER CARD PREMIUM */}
      <div className="bg-card border border-border/50 rounded-[24px] p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden mb-8">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-5 relative z-10 w-full lg:w-auto">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-[#ff8a00] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Package className="w-7 h-7 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Inventario Clínico</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Control de insumos, stock de seguridad y alertas.</p>
          </div>
        </div>

        <div className="relative w-full lg:w-[380px] z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 bg-background/50 border-border/80 rounded-xl text-sm font-medium focus-visible:ring-orange-500/20 focus-visible:border-orange-500 shadow-sm transition-all" 
            placeholder="Buscar producto o código..." 
          />
        </div>
      </div>

      {/* 2. BARRA DE NAVEGACIÓN Y ACCIONES */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-6">
        
        {/* TABS */}
        <div className="flex items-center gap-6 border-b border-border/40 w-full lg:w-auto pb-0.5">
          <button 
            onClick={() => setActiveTab("PRODUCTS")}
            className={cn("pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2", activeTab === "PRODUCTS" ? "border-[#008bcd] text-[#008bcd]" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            <Package className="w-4 h-4" /> Productos en Stock
          </button>
          <button 
            onClick={() => setActiveTab("MOVEMENTS")}
            className={cn("pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2", activeTab === "MOVEMENTS" ? "border-[#008bcd] text-[#008bcd]" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            <History className="w-4 h-4" /> Historial de Movimientos
          </button>
        </div>

        {/* FILTROS Y BOTONES */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {activeTab === "PRODUCTS" && (
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] h-10 bg-transparent border-border/60 rounded-xl font-bold shadow-none hover:bg-muted/50 transition-colors">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/80 shadow-xl">
                <SelectItem value="ALL" className="font-bold">Todos</SelectItem>
                <SelectItem value="LOW_STOCK" className="font-bold text-amber-500">Bajo Stock</SelectItem>
                <SelectItem value="OUT_OF_STOCK" className="font-bold text-rose-500">Agotados</SelectItem>
              </SelectContent>
            </Select>
          )}

          {activeTab === "PRODUCTS" ? (
            <>
              <Button onClick={() => openProductModal()} variant="outline" className="h-10 rounded-xl font-bold text-xs shadow-sm bg-card border-border/80 hover:bg-muted transition-all">
                <Plus className="w-4 h-4 mr-1.5" /> Nuevo Insumo
              </Button>
              <Button onClick={() => openMovementModal("INCOMING")} className="bg-[#00d084] hover:bg-[#00b573] text-white font-bold h-10 rounded-xl text-xs shadow-md shadow-[#00d084]/20 transition-all">
                <ArrowDownToLine className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Ingresar Stock
              </Button>
              <Button onClick={() => openMovementModal("OUTGOING")} className="bg-[#f00f48] hover:bg-[#d00c3e] text-white font-bold h-10 rounded-xl text-xs shadow-md shadow-[#f00f48]/20 transition-all">
                <ArrowUpFromLine className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Sacar Stock
              </Button>
            </>
          ) : (
            <Button variant="outline" className="h-10 rounded-xl font-bold text-xs shadow-sm bg-card border-border/80 hover:bg-muted transition-all">
              <Download className="w-4 h-4 mr-1.5" /> Exportar Reporte
            </Button>
          )}
        </div>
      </div>

      {/* ALERTA STOCK MINIMO */}
      {activeTab === "PRODUCTS" && lowStockItems.length > 0 && !isLoading && filterType !== "OUT_OF_STOCK" && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex items-center shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5 text-amber-600 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            <span>Atención: Hay <strong className="text-sm mx-0.5">{lowStockItems.length}</strong> insumos en el límite de seguridad.</span>
          </div>
        </div>
      )}

      {/* 3. TABLAS DE DATOS */}
      <div className="bg-card border border-border/60 rounded-[20px] shadow-sm overflow-hidden flex-1">
        
        {/* VISTA PRODUCTOS */}
        {activeTab === "PRODUCTS" && (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border/40 text-[10px] uppercase text-muted-foreground font-black tracking-wider">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4 text-center">Stock de Seguridad</th>
                  <th className="px-6 py-4 text-center">Stock Actual</th>
                  <th className="px-6 py-4 text-right">Precio Promedio</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-32">
                      <Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-3" />
                      <p className="font-bold text-muted-foreground text-xs">Cargando datos...</p>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-24">
                      <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="font-bold text-foreground text-sm">No hay productos que coincidan</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground text-[13px]">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Cod: {p.sku || "S/N"} | Marca: {p.marca || "S/M"}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> {p.minStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center min-w-[2.5rem] px-2 h-7 rounded-md font-black text-sm shadow-xs border",
                          p.stock === 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/30" : 
                          p.stock <= p.minStock ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : 
                          "bg-muted/40 text-foreground border-border/50"
                        )}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs font-bold text-muted-foreground">
                        ${Number(p.unitCost).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg border border-transparent hover:border-border transition-all">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-border/80 p-1.5">
                            <DropdownMenuItem onClick={() => openProductModal(p)} className="cursor-pointer text-xs font-bold py-2.5 rounded-lg">
                              <Edit className="w-4 h-4 mr-2 text-[#008bcd]" /> Editar Insumo
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/60 my-1" />
                            <DropdownMenuItem onClick={() => { setSelectedItem(p); setIsDeleteModalOpen(true); }} className="cursor-pointer text-xs font-bold py-2.5 rounded-lg text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10">
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar Producto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VISTA MOVIMIENTOS */}
        {activeTab === "MOVEMENTS" && (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border/40 text-[10px] uppercase text-muted-foreground font-black tracking-wider">
                <tr>
                  <th className="px-6 py-4">Operación</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4 text-center">Cant.</th>
                  <th className="px-6 py-4">Detalle / Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-32">
                      <Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-3" />
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-24 font-bold text-muted-foreground text-sm">
                       <History className="w-8 h-8 opacity-30 mx-auto mb-3" />
                       No hay movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider border",
                          m.type === "INCOMING" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        )}>
                          {m.type === "INCOMING" ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                          {m.type === "INCOMING" ? "Entrada" : "Salida"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[11px] font-bold text-foreground">{new Date(m.createdAt).toLocaleDateString('es-ES')}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{new Date(m.createdAt).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-[13px] text-foreground">
                        {m.item?.name || "Producto Desconocido"}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-sm text-foreground">
                        {m.quantity}
                      </td>
                      <td className="px-6 py-4 text-[11px] text-muted-foreground font-medium max-w-[200px] truncate" title={m.reason || ""}>
                        {m.reason || "Sin detalle."}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 4. MODALES INTEGRADOS */}
      {/* ========================================== */}

      <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} item={selectedItem} onSuccess={fetchData} />
      <MovementModal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} type={movementType} items={items} preselectedItem={selectedItem} onSuccess={fetchData} />
      <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} item={selectedItem} onSuccess={fetchData} />

    </div>
  )
}

// ----------------------------------------------------------------------
// MODALES (Mantenidos en el mismo archivo para facilitar tu copy/paste)
// ----------------------------------------------------------------------

function ProductModal({ isOpen, onClose, item, onSuccess }: { isOpen: boolean, onClose: () => void, item: InventoryItem | null, onSuccess: () => void }) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      sku: formData.get("sku"),
      marca: formData.get("marca"),
      presentacion: formData.get("presentacion"),
      minStock: parseInt(formData.get("minStock") as string) || 5,
      unitCost: parseFloat(formData.get("unitCost") as string) || 0,
      stock: item ? undefined : parseInt(formData.get("stock") as string) || 0,
    }

    try {
      const res = await fetch("/api/inventory", {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item ? { id: item.id, ...data } : data)
      })

      if (!res.ok) throw new Error()
      toast({ title: "Éxito", description: `Producto ${item ? "actualizado" : "creado"} correctamente.` })
      onSuccess()
      onClose()
    } catch {
      toast({ title: "Error", description: "No se pudo guardar el producto.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border/80 rounded-[24px] p-0 shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b border-border/60 bg-muted/20">
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center border border-[#008bcd]/20">
              <Package className="w-4 h-4 stroke-[2.5]" />
            </div>
            {item ? "Editar Producto" : "Registrar Nuevo Insumo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Producto *</Label>
              <Input name="name" defaultValue={item?.name} required className="h-10 rounded-lg bg-background text-sm" placeholder="Ej: Resina Z350" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Código Interno (SKU)</Label>
              <Input name="sku" defaultValue={item?.sku || ""} className="h-10 rounded-lg bg-background text-sm font-mono" placeholder="Ej: RES-3M-A2" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Marca</Label>
              <Input name="marca" defaultValue={item?.marca || ""} className="h-10 rounded-lg bg-background text-sm" placeholder="Ej: 3M ESPE" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Presentación</Label>
              <Input name="presentacion" defaultValue={item?.presentacion || ""} className="h-10 rounded-lg bg-background text-sm" placeholder="Ej: Caja x 100" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Precio Promedio ($)</Label>
              <Input name="unitCost" type="number" step="0.01" defaultValue={item?.unitCost || 0} className="h-10 rounded-lg bg-background font-mono font-bold" />
            </div>
            {!item && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-emerald-600">Stock Inicial *</Label>
                <Input name="stock" type="number" defaultValue={0} required className="h-10 rounded-lg bg-emerald-500/5 border-emerald-500/30 text-emerald-600 font-mono font-bold focus-visible:ring-emerald-500" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-amber-600 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" /> Stock de Seguridad *
              </Label>
              <Input name="minStock" type="number" defaultValue={item?.minStock || 5} required className="h-10 rounded-lg bg-amber-500/5 border-amber-500/30 text-amber-600 font-mono font-bold focus-visible:ring-amber-500" />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/10">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg h-9 px-5 text-xs font-bold border-border/80">Cancelar</Button>
            <Button type="submit" disabled={isSaving} className="rounded-lg h-9 px-6 text-xs font-bold bg-[#008bcd] hover:bg-[#007bb6] text-white shadow-sm">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Guardar Insumo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MovementModal({ isOpen, onClose, type, items, preselectedItem, onSuccess }: { isOpen: boolean, onClose: () => void, type: "INCOMING" | "OUTGOING", items: InventoryItem[], preselectedItem: InventoryItem | null, onSuccess: () => void }) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      itemId: formData.get("itemId"),
      quantity: parseInt(formData.get("quantity") as string),
      type: type,
      reason: formData.get("reason")
    }

    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error()
      toast({ title: "Movimiento Registrado", description: "El stock ha sido actualizado.", variant: "default" })
      onSuccess()
      onClose()
    } catch {
      toast({ title: "Error", description: "Verifica que el stock no sea negativo.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border/80 rounded-[24px] p-0 shadow-2xl">
        <DialogHeader className={cn("px-6 py-5 border-b border-border/60", type === "INCOMING" ? "bg-emerald-500/5" : "bg-rose-500/5")}>
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm", type === "INCOMING" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20")}>
              {type === "INCOMING" ? <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" /> : <ArrowUpFromLine className="w-4 h-4 stroke-[2.5]" />}
            </div>
            {type === "INCOMING" ? "Ingresar a Bodega" : "Retirar de Bodega"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground">Producto Afectado *</Label>
              <Select name="itemId" defaultValue={preselectedItem?.id} required>
                <SelectTrigger className="w-full h-10 rounded-lg text-sm font-semibold border-border/80 bg-background">
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {items.map(i => <SelectItem key={i.id} value={i.id}>{i.name} (Stock actual: {i.stock})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground">Cantidad a {type === "INCOMING" ? "ingresar" : "retirar"} *</Label>
              <Input name="quantity" type="number" min="1" required placeholder="0" className="h-11 rounded-lg bg-background font-mono text-lg font-black border-border/80" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                {type === "INCOMING" ? <><Building2 className="w-3 h-3"/> Proveedor / Ref</> : <><User className="w-3 h-3"/> Solicitante / Motivo</>}
              </Label>
              <Input name="reason" placeholder={type === "INCOMING" ? "Ej: DentalCorp - Factura F-001" : "Ej: Dr. Capa - Uso en Box 1"} className="h-10 rounded-lg bg-background text-sm border-border/80" required />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/10">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg h-9 px-5 text-xs font-bold border-border/80">Cancelar</Button>
            <Button type="submit" disabled={isSaving} className={cn("rounded-lg h-9 px-6 text-xs font-bold text-white transition-all active:scale-95", type === "INCOMING" ? "bg-[#00d084] hover:bg-[#00b573]" : "bg-[#f00f48] hover:bg-[#d00c3e]")}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Confirmar Movimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteModal({ isOpen, onClose, item, onSuccess }: { isOpen: boolean, onClose: () => void, item: InventoryItem | null, onSuccess: () => void }) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!item) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/inventory?id=${item.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Producto eliminado" })
      onSuccess()
      onClose()
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border/80 rounded-[24px] p-6 text-center shadow-2xl">
        <div className="w-14 h-14 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
          <Trash2 className="w-6 h-6 stroke-[2.5]" />
        </div>
        <DialogTitle className="text-lg font-black text-foreground mb-2">¿Eliminar Insumo?</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground font-medium mb-6 leading-relaxed">
          Vas a eliminar <strong className="text-foreground">{item?.name}</strong>. Esta acción no se puede deshacer.
        </DialogDescription>
        <div className="flex gap-3 justify-center w-full">
          <Button variant="outline" onClick={onClose} className="rounded-lg h-10 px-5 text-xs font-bold border-border/80 flex-1">Cancelar</Button>
          <Button onClick={handleDelete} disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-10 px-5 text-xs font-bold flex-1">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}