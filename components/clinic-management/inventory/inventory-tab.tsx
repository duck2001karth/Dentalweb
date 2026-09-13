"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { 
  AlertTriangle, ArrowDownToLine, ArrowUpFromLine, 
  MoreVertical, Search, Package, Trash2, Edit, Plus, 
  History, ShieldCheck, Filter, Loader2, ChevronLeft, ChevronRight 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { ProductModal } from "./product-modal"
import { MovementModal } from "./movement-modal"
import { DeleteModal } from "./delete-modal"
import { InventoryExportMenu } from "./inventory-export"

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

const ITEMS_PER_PAGE = 10

export function InventoryTab() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "MOVEMENTS">("PRODUCTS")
  
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [clinicSettings, setClinicSettings] = useState<{
    clinicName?: string
    razonSocial?: string
    ruc?: string
    address?: string
    city?: string
    logoUrl?: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("ALL")
  
  const [productPage, setProductPage] = useState(1)
  const [movementPage, setMovementPage] = useState(1)

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [movementType, setMovementType] = useState<"INCOMING" | "OUTGOING">("INCOMING")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [resItems, resMovements, resSettings] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/inventory/movements"),
        fetch("/api/configuration").catch(() => null),
      ])

      if (resItems.ok) setItems(await resItems.json())
      if (resMovements.ok) setMovements(await resMovements.json())
      if (resSettings && resSettings.ok) {
        const data = await resSettings.json()
        setClinicSettings(Array.isArray(data) ? data[0] : data?.settings || data)
      }
    } catch {
      toast({ title: "Error", description: "No se pudo cargar el inventario.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setProductPage(1)
  }, [searchTerm, filterType])

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

  const totalProductPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredItems.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE)

  const totalMovementPages = Math.ceil(movements.length / ITEMS_PER_PAGE)
  const paginatedMovements = movements.slice((movementPage - 1) * ITEMS_PER_PAGE, movementPage * ITEMS_PER_PAGE)

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
      <div className="bg-card border border-border/50 rounded-[24px] p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden mb-8">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10 w-full lg:w-auto">
          <div className="w-14 h-14 bg-[#008bcd] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#008bcd]/20 shrink-0">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Inventario Clínico</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Control de insumos, stock y alertas.</p>
          </div>
        </div>
        <div className="relative w-full lg:w-[380px] z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 bg-background/50 border-border/80 rounded-xl text-sm focus-visible:ring-[#008bcd]/20 focus-visible:border-[#008bcd]" 
            placeholder="Buscar producto o código..." 
          />
        </div>
      </div>

      {/* 2. BARRA DE NAVEGACIÓN Y ACCIONES */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-6">
        <div className="flex items-center gap-6 border-b border-border/40 w-full lg:w-auto pb-0.5">
          <button 
            onClick={() => setActiveTab("PRODUCTS")} 
            className={cn("pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2", activeTab === "PRODUCTS" ? "border-[#008bcd] text-[#008bcd]" : "border-transparent text-muted-foreground")}
          >
            <Package className="w-4 h-4" /> Productos en Stock
          </button>
          <button 
            onClick={() => setActiveTab("MOVEMENTS")} 
            className={cn("pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2", activeTab === "MOVEMENTS" ? "border-[#008bcd] text-[#008bcd]" : "border-transparent text-muted-foreground")}
          >
            <History className="w-4 h-4" /> Historial de Movimientos
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {activeTab === "PRODUCTS" && (
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] h-10 border-border/60 rounded-xl font-bold focus:ring-[#008bcd]/20">
                <Filter className="w-4 h-4 mr-2" /> <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL" className="font-bold">Todos</SelectItem>
                <SelectItem value="LOW_STOCK" className="font-bold text-amber-500">Bajo Stock</SelectItem>
                <SelectItem value="OUT_OF_STOCK" className="font-bold text-rose-500">Agotados</SelectItem>
              </SelectContent>
            </Select>
          )}

          {activeTab === "PRODUCTS" ? (
            <>
              <Button onClick={() => openProductModal()} variant="outline" className="h-10 rounded-xl font-bold text-xs">
                <Plus className="w-4 h-4 mr-1.5" /> Nuevo Insumo
              </Button>
              <Button onClick={() => openMovementModal("INCOMING")} className="bg-[#00d084] hover:bg-[#00b573] text-white font-bold h-10 rounded-xl text-xs shadow-md shadow-[#00d084]/20">
                <ArrowDownToLine className="w-4 h-4 mr-1.5" /> Ingresar Stock
              </Button>
              <Button onClick={() => openMovementModal("OUTGOING")} className="bg-[#f00f48] hover:bg-[#d00c3e] text-white font-bold h-10 rounded-xl text-xs shadow-md shadow-[#f00f48]/20">
                <ArrowUpFromLine className="w-4 h-4 mr-1.5" /> Sacar Stock
              </Button>
            </>
          ) : null}

          <InventoryExportMenu 
            activeTab={activeTab} 
            items={filteredItems} 
            movements={movements} 
            clinicSettings={clinicSettings ? {
              name: clinicSettings.clinicName || "Carmo Dental",
              razonSocial: clinicSettings.razonSocial || clinicSettings.clinicName,
              ruc: clinicSettings.ruc || "",
              address: clinicSettings.address ? `${clinicSettings.address}${clinicSettings.city ? `, ${clinicSettings.city}` : ""}` : "",
            } : undefined}
          />
        </div>
      </div>

      {activeTab === "PRODUCTS" && lowStockItems.length > 0 && !isLoading && filterType !== "OUT_OF_STOCK" && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex items-center shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5 text-amber-600 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" /> <span>Hay <strong className="mx-0.5">{lowStockItems.length}</strong> insumos en límite de seguridad.</span>
          </div>
        </div>
      )}

      {/* 3. TABLAS DE DATOS */}
      <div className="bg-card border border-border/60 rounded-[20px] shadow-sm flex flex-col flex-1">
        {activeTab === "PRODUCTS" && (
          <>
            <div className="overflow-x-auto min-h-[400px] flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/30 border-b border-border/40 text-[10px] uppercase text-muted-foreground font-black tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4 text-center">Seguridad</th>
                    <th className="px-6 py-4 text-center">Actual</th>
                    <th className="px-6 py-4 text-right">Costo</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {isLoading ? (
                    <tr><td colSpan={5} className="text-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-3" /></td></tr>
                  ) : paginatedProducts.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-24"><Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" /><p className="font-bold text-sm">Sin resultados</p></td></tr>
                  ) : (
                    paginatedProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground text-[13px]">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Cod: {p.sku || "S/N"} | {p.marca || "S/M"}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> {p.minStock}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn("inline-flex items-center justify-center min-w-[2.5rem] px-2 h-7 rounded-md font-black text-sm border", p.stock === 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/30" : p.stock <= p.minStock ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-muted/40 text-foreground border-border/50")}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs font-bold text-muted-foreground">${Number(p.unitCost).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg border border-transparent hover:border-border"><MoreVertical className="w-4 h-4 text-muted-foreground" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-border/80 p-1.5">
                              <DropdownMenuItem onClick={() => openProductModal(p)} className="cursor-pointer text-xs font-bold py-2.5 rounded-lg"><Edit className="w-4 h-4 mr-2 text-[#008bcd]" /> Editar Insumo</DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border/60 my-1" />
                              <DropdownMenuItem 
                                onClick={() => { setSelectedItem(p); setIsDeleteModalOpen(true); }} 
                                className="cursor-pointer text-xs font-bold py-2.5 rounded-lg text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400 focus:bg-rose-500/10 dark:focus:bg-rose-500/15"
                              >
                                <Trash2 className="w-4 h-4 mr-2 text-rose-600 dark:text-rose-400" /> Eliminar / Archivar
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
            
            {/* PAGINACIÓN PRODUCTOS */}
            {!isLoading && totalProductPages > 1 && (
              <div className="border-t border-border/60 p-4 flex items-center justify-between bg-muted/10">
                <p className="text-xs text-muted-foreground font-medium">Mostrando {paginatedProducts.length} de {filteredItems.length} insumos</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" disabled={productPage === 1} onClick={() => setProductPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <span className="text-xs font-bold px-2">Pág. {productPage} de {totalProductPages}</span>
                  <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" disabled={productPage === totalProductPages} onClick={() => setProductPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* VISTA MOVIMIENTOS */}
        {activeTab === "MOVEMENTS" && (
          <>
            <div className="overflow-x-auto min-h-[400px] flex-1">
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
                <tbody className="divide-y border-border/40">
                  {isLoading ? (
                    <tr><td colSpan={5} className="text-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-3" /></td></tr>
                  ) : paginatedMovements.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-24 font-bold text-muted-foreground text-sm"><History className="w-8 h-8 opacity-30 mx-auto mb-3" />No hay movimientos.</td></tr>
                  ) : (
                    paginatedMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider border", m.type === "INCOMING" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20")}>
                            {m.type === "INCOMING" ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                            {m.type === "INCOMING" ? "Entrada" : "Salida"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[11px] font-bold text-foreground">{new Date(m.createdAt).toLocaleDateString('es-ES')}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{new Date(m.createdAt).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-[13px] text-foreground">{m.item?.name || "Desconocido"}</td>
                        <td className="px-6 py-4 text-center font-black text-sm text-foreground">{m.quantity}</td>
                        <td className="px-6 py-4 text-[11px] text-muted-foreground font-medium max-w-[200px] truncate" title={m.reason || ""}>{m.reason || "Sin detalle"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINACIÓN MOVIMIENTOS */}
            {!isLoading && totalMovementPages > 1 && (
              <div className="border-t border-border/60 p-4 flex items-center justify-between bg-muted/10">
                <p className="text-xs text-muted-foreground font-medium">Mostrando {paginatedMovements.length} de {movements.length} movimientos</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" disabled={movementPage === 1} onClick={() => setMovementPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <span className="text-xs font-bold px-2">Pág. {movementPage} de {totalMovementPages}</span>
                  <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg" disabled={movementPage === totalMovementPages} onClick={() => setMovementPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} item={selectedItem} onSuccess={fetchData} />
      <MovementModal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} type={movementType} items={items} preselectedItem={selectedItem} onSuccess={fetchData} />
      <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} item={selectedItem} onSuccess={fetchData} />
    </div>
  )
}