"use client"

import React, { useState, useEffect, useMemo } from "react"
import { 
  AlertTriangle, Download, ArrowDownToLine, ArrowUpFromLine, 
  MoreVertical, Search, Filter, ChevronDown, Package, 
  MoveRight, Trash2, Edit, Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface InventoryItem {
  id: string
  name: string
  sku: string | null
  sanitaryRegistry: string | null
  brand: string | null
  concentration: string | null
  presentation: string | null
  batchNumber: string | null
  expirationDate: string | Date | null
  stock: number
  minStock: number
  totalBatches: number
}

export function InventoryTab() {
  const { toast } = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("ALL")

  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/inventory')
      if (!res.ok) throw new Error("Error al obtener el inventario")
      const data = await res.json()
      setItems(data.items || data)
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo cargar el inventario.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  //LÓGICA DE FILTRADO
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesSearch) return false
      if (filterType === "LOW_STOCK") return item.stock <= item.minStock
      if (filterType === "EXPIRED") {
        if (!item.expirationDate) return false
        return new Date(item.expirationDate) < new Date()
      }
      return true
    })
  }, [items, searchTerm, filterType])

  const lowStockCount = items.filter(p => p.stock <= (p.minStock || 5)).length
  const renderExpiration = (dateString?: string | Date | null) => {
    if (!dateString) return <span className="text-muted-foreground font-medium">No expira</span>
    
    const expDate = new Date(dateString)
    const isExpired = expDate < new Date()
    const formattedDate = expDate.toLocaleDateString('es-ES', { month: 'short', day: '2-digit', year: 'numeric' }).replace('.', '')

    return (
      <div className="flex flex-col items-start gap-1">
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border ${
          isExpired 
            ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" 
            : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
        }`}>
          {formattedDate}
        </span>
        {isExpired && <span className="text-[10px] text-red-500 font-bold ml-1">Vencido</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 flex-1 font-sans antialiased animate-in fade-in duration-300">
      
      {/* BARRA SUPERIOR: SELECTORES Y ACCIONES */}
      <div className="flex flex-col md:flex-row justify-between gap-4 w-full">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Select defaultValue="todas">
            <SelectTrigger className="w-full sm:w-[200px] h-12 bg-card border-border rounded-xl font-bold shadow-sm">
              <SelectValue placeholder="Bodega" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todas" className="font-bold">Todas las bodegas</SelectItem>
              <SelectItem value="principal" className="font-bold">Bodega Principal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-3 justify-start md:justify-end">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-6 rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <ArrowDownToLine className="w-4 h-4 mr-2 stroke-[2.5]" /> Ingresar stock
          </Button>
          <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-12 px-6 rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <ArrowUpFromLine className="w-4 h-4 mr-2 stroke-[2.5]" /> Sacar stock
          </Button>
        </div>
      </div>

      {/* BARRA SECUNDARIA: BÚSQUEDA Y FILTRO */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative w-full md:w-[450px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-muted/50 border-transparent focus:border-[#008bcd] font-medium transition-colors" 
            placeholder="Buscar por producto, marca o código interno..." 
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[170px] h-11 bg-background border-border rounded-xl font-semibold shadow-sm">
              <Filter className="w-4 h-4 mr-2 text-[#008bcd]" />
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL" className="font-medium">Todos</SelectItem>
              <SelectItem value="LOW_STOCK" className="font-bold text-amber-600">Bajo Stock</SelectItem>
              <SelectItem value="EXPIRED" className="font-bold text-red-600">Vencidos</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="h-11 rounded-xl text-[#008bcd] border-[#008bcd]/30 hover:bg-[#008bcd]/10 font-bold shadow-sm px-5">
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      {/* ALERTA DE STOCK MINIMO */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-xl p-4 flex items-center justify-between shadow-sm animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-500 font-bold text-sm">
            <div className="bg-amber-200 dark:bg-amber-500/20 p-2 rounded-full">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            </div>
            Atención: Hay {lowStockCount} {lowStockCount === 1 ? 'insumo' : 'insumos'} con el stock en el límite mínimo establecido.
          </div>
        </div>
      )}

      {/* TABLA DE INVENTARIO */}
      <div className="bg-card border border-border rounded-[24px] shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/40 border-b border-border text-[10px] uppercase text-muted-foreground font-black tracking-wider">
              <tr>
                <th className="px-6 py-4">Producto / Reg. Sanitario</th>
                <th className="px-6 py-4">Marca</th>
                <th className="px-6 py-4">Concentración / Presentación</th>
                <th className="px-6 py-4">N° Lote</th>
                <th className="px-6 py-4">Expiración</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-center">Cód. Interno</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-24">
                    <Loader2 className="w-10 h-10 animate-spin text-[#008bcd] mx-auto mb-4" />
                    <p className="font-bold text-muted-foreground">Cargando inventario de la clínica...</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20">
                    <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <p className="font-bold text-foreground text-lg">No se encontraron productos</p>
                    <p className="text-muted-foreground font-medium text-sm mt-1">Ajusta los filtros de búsqueda o registra un nuevo insumo.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                    
                    {/* PRODUCTO */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2.5">
                        <ChevronDown className="w-4 h-4 mt-0.5 text-muted-foreground cursor-pointer hover:text-[#008bcd] transition-colors" />
                        <div>
                          <p className="font-bold text-foreground text-[13px] uppercase tracking-tight">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-wider">
                            {p.sanitaryRegistry || "Sin Registro Sanitario"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* MARCA */}
                    <td className="px-6 py-4 text-muted-foreground font-bold text-[11px] uppercase tracking-wider">
                      {p.brand || "---"}
                    </td>

                    {/* CONCENTRACIÓN Y PRESENTACIÓN */}
                    <td className="px-6 py-4">
                      <p className="text-foreground font-semibold text-xs">{p.presentation || "Unidad"}</p>
                      <p className="text-muted-foreground font-medium text-[11px] mt-0.5">{p.concentration || "N/A"}</p>
                    </td>

                    {/* LOTE */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground text-xs">{p.batchNumber || "---"}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Lotes: {p.totalBatches || 1}</p>
                    </td>

                    {/* EXPIRACIÓN */}
                    <td className="px-6 py-4">
                      {renderExpiration(p.expirationDate)}
                    </td>

                    {/* STOCK */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-10 h-8 rounded-lg font-black text-[15px] ${
                        p.stock <= (p.minStock || 5) 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-500' 
                          : 'bg-muted/50 text-foreground'
                      }`}>
                        {p.stock}
                      </span>
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4 text-center font-mono text-xs font-bold text-muted-foreground">
                      {p.sku || "---"}
                    </td>

                    {/* ACCIONES */}
                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent rounded-lg cursor-pointer">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-xl border-border p-1.5">
                          
                          <DropdownMenuItem className="cursor-pointer font-bold text-xs py-2.5 rounded-xl focus:bg-muted">
                            <Edit className="w-4 h-4 mr-2.5 text-[#008bcd]" /> Editar producto
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem className="cursor-pointer font-bold text-xs py-2.5 rounded-xl focus:bg-muted">
                            <Package className="w-4 h-4 mr-2.5 text-emerald-600" /> Gestionar Lotes
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem className="cursor-pointer font-bold text-xs py-2.5 rounded-xl focus:bg-muted">
                            <MoveRight className="w-4 h-4 mr-2.5 text-amber-600" /> Mover unidades
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-border/60 my-1" />
                          
                          <DropdownMenuItem className="cursor-pointer font-bold text-xs py-2.5 rounded-xl text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-500/10">
                            <Trash2 className="w-4 h-4 mr-2.5" /> Eliminar del sistema
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
      </div>
    </div>
  )
}