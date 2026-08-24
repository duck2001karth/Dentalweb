"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Plus, Search, Edit2, Trash2, Loader2, Info, RefreshCw, Wand2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils" 
import { CatalogStats } from "@/components/admin/catalog/catalog-stats"
import { ProcedureModal } from "@/components/admin/catalog/procedure-modal"
import { ProcedureDeleteDialog } from "@/components/admin/catalog/procedure-delete-dialog"
import { BulkImportModal } from "@/components/admin/catalog/bulk-import-modal"

interface Procedure {
  id: string
  code: string | null
  name: string
  category: string
  basePrice: number
  isActive: boolean
}

export function CatalogoPrecios() {
  const { toast } = useToast()
  const [items, setItems] = useState<Procedure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("TODAS")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Procedure | null>(null)
  const [editingItem, setEditingItem] = useState<Procedure | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const categories = [
    "DIAGNÓSTICO", 
    "PREVENCIÓN",  
    "OPERATORIA", 
    "ORTOPEDIA", 
    "ORTODONCIA", 
    "ENDODONCIA", 
    "ESTÉTICA", 
    "IMPLANTOLOGIA", 
    "REHABILITACIÓN ORAL", 
    "ODONTOPEDIATRIA", 
    "CIRUGÍA ORAL"
  ]

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/catalog")
      if (res.ok) setItems(await res.json())
    } catch {
      toast({ title: "Error", description: "No se pudo cargar el catálogo.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchCatalog() }, [fetchCatalog])
  const dynamicCategories = useMemo(() => {
    const counts: Record<string, number> = { "TODAS": items.length }
    items.forEach(item => {
      const cat = item.category ? item.category.toUpperCase() : "OTROS"
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [items])

  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return items.filter((item) => {
      const itemCat = item.category ? item.category.toUpperCase() : "OTROS"
      const matchesCategory = selectedCategory === "TODAS" || itemCat === selectedCategory
      
      const matchesSearch = 
        item.name.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q))
        
      return matchesCategory && matchesSearch
    })
  }, [items, searchTerm, selectedCategory])

  const handleSave = async (formData: any) => {
    setIsSaving(true)
    try {
      const method = editingItem ? "PATCH" : "POST"
      const payload = editingItem ? { id: editingItem.id, ...formData } : formData
      const res = await fetch("/api/admin/catalog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error()
      toast({ title: editingItem ? "Prestación actualizada" : "Prestación creada", variant: "default" })
      setIsModalOpen(false)
      fetchCatalog()
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la prestación.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleBulkImport = async (parsedItems: any[]) => {
    try {
      for (const item of parsedItems) {
        await fetch("/api/admin/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item)
        })
      }
      toast({ title: "Importación Exitosa", description: `Se añadieron ${parsedItems.length} prestaciones.`, variant: "default" })
      fetchCatalog()
    } catch (error) {
      toast({ title: "Error en importación", variant: "destructive" })
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus })
      })
      if (!res.ok) throw new Error()
      fetchCatalog()
    } catch {
      toast({ title: "Error al cambiar estado", variant: "destructive" })
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/catalog?id=${itemToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Prestación eliminada", variant: "default" })
      fetchCatalog()
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" })
    } finally {
      setIsSaving(false)
      setItemToDelete(null)
    }
  }

  return (
    <div className="w-full space-y-6 font-sans antialiased animate-in fade-in duration-200">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-[#008bcd]/15 text-[#008bcd]">
              Tarifario Clínico
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mt-1">
            Catálogo de Prestaciones
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Define procedimientos, consultas y valores base para presupuestos y odontograma.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchCatalog}
            className="h-10 w-10 rounded-xl border-border bg-card hover:bg-muted shadow-none"
            title="Refrescar catálogo"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsBulkModalOpen(true)}
            className="h-10 px-4 rounded-xl border-[#008bcd]/30 bg-[#008bcd]/5 hover:bg-[#008bcd]/10 text-[#008bcd] font-bold text-xs gap-2 transition-all shadow-none"
          >
            <Wand2 className="w-4 h-4" /> Importación Inteligente
          </Button>

          <Button
            onClick={() => {
              setEditingItem(null)
              setIsModalOpen(true)
            }}
            className="h-10 px-5 rounded-xl bg-[#008bcd] hover:bg-[#007bb6] text-white font-bold text-xs gap-2 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Nueva Prestación
          </Button>
        </div>
      </div>

      <CatalogStats items={items} />

      {/* 5. FILTROS DINÁMICOS IMPLEMENTADOS */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-6">
        {Object.entries(dynamicCategories).map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border",
              selectedCategory === cat 
                ? "bg-[#008bcd] text-white border-[#008bcd] shadow-md shadow-[#008bcd]/20" 
                : "bg-card text-muted-foreground border-border hover:bg-muted/60"
            )}
          >
            {cat}
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-[10px] font-black",
              selectedCategory === cat ? "bg-white/20 text-white" : "bg-muted-foreground/10 text-muted-foreground"
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* TABLA DE PROCEDIMIENTOS */}
      <div className="bg-card border border-border rounded-[24px] shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, código o categoría..."
              className="pl-10 h-10 bg-background border-border rounded-xl text-xs font-medium focus-visible:ring-[#008bcd]/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            Mostrando {filteredItems.length} de {items.length} procedimientos
          </span>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/30 border-b border-border text-[11px] uppercase text-muted-foreground font-black">
              <tr>
                <th className="px-6 py-3.5">Código</th>
                <th className="px-6 py-3.5">Procedimiento / Prestación</th>
                <th className="px-6 py-3.5">Especialidad</th>
                <th className="px-6 py-3.5 text-right">Precio Base ($)</th>
                <th className="px-6 py-3.5 text-center">Estado</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-3 stroke-[2.5]" />
                    <p className="text-xs font-bold text-muted-foreground">Cargando aranceles clínicos...</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Info className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs font-bold text-foreground">No se encontraron procedimientos</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Prueba con otro término de búsqueda o especialidad.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-muted/30 transition-all ${
                      !item.isActive ? "opacity-60 bg-muted/10" : ""
                    }`}
                  >
                    <td className="px-6 py-3.5 font-mono text-[11px] font-bold text-muted-foreground">
                      {item.code || "---"}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-foreground text-xs">
                      {item.name}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-[#008bcd]/10 text-[#008bcd] border border-[#008bcd]/20">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                      ${Number(item.basePrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={() => toggleActive(item.id, item.isActive)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingItem(item)
                          setIsModalOpen(true)
                        }}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                        title="Editar prestación"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setItemToDelete(item)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        title="Eliminar prestación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProcedureModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        editingItem={editingItem}
        categories={categories}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <BulkImportModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        categories={categories}
        onImport={handleBulkImport}
      />

      <ProcedureDeleteDialog
        itemToDelete={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        isSaving={isSaving}
      />

    </div>
  )
}