"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Edit2, Trash2, Loader2, ListTree, CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"

interface Procedure {
  id: string
  code: string | null
  name: string
  category: string
  basePrice: number
  isActive: boolean
}

export default function CatalogoPage() {
  const { toast } = useToast()
  
  const [items, setItems] = useState<Procedure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<Procedure | null>(null)
  
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    basePrice: "",
    isActive: true
  })

  const fetchCatalog = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/catalog")
      if (!res.ok) throw new Error("Error fetching")
      const data = await res.json()
      setItems(data)
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el catálogo.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCatalog()
  }, [])

  const openModal = (item?: Procedure) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        code: item.code || "",
        name: item.name,
        category: item.category,
        basePrice: item.basePrice.toString(),
        isActive: item.isActive
      })
    } else {
      setEditingItem(null)
      setFormData({ code: "", name: "", category: "", basePrice: "", isActive: true })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.basePrice) {
      toast({ title: "Campos incompletos", description: "Nombre, categoría y precio son obligatorios.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const method = editingItem ? "PATCH" : "POST"
      const payload = editingItem ? { id: editingItem.id, ...formData } : formData

      const res = await fetch("/api/admin/catalog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Error saving")
      
      toast({ 
        title: editingItem ? "Procedimiento actualizado" : "Procedimiento creado", 
        variant: "success" 
      })
      
      setIsModalOpen(false)
      fetchCatalog()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el procedimiento.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // 4. CAMBIAR ESTADO RÁPIDO (PATCH)
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus })
      })
      if (!res.ok) throw new Error()
      fetchCatalog()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" })
    }
  }

  // 5. ELIMINAR (DELETE)
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este procedimiento? Esta acción no se puede deshacer.")) return

    try {
      const res = await fetch(`/api/admin/catalog?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Procedimiento eliminado", variant: "success" })
      fetchCatalog()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" })
    }
  }

  // Filtrado en el cliente
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ListTree className="w-8 h-8 text-[#008bcd]" /> Catálogo de Precios
          </h2>
          <p className="text-muted-foreground mt-1 font-medium">Gestiona las prestaciones y valores para los planes de tratamiento.</p>
        </div>
        <Button onClick={() => openModal()} className="bg-[#008bcd] hover:bg-blue-600 text-white font-bold h-11 px-6 rounded-xl shadow-sm">
          <Plus className="w-5 h-5 mr-2" /> Nuevo Procedimiento
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">

        <div className="p-5 border-b border-border bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Buscar por nombre, código o categoría..." 
              className="pl-10 h-11 bg-background border-border rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Procedimiento</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Precio Base</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#008bcd] mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">Cargando catálogo...</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <p className="text-muted-foreground font-medium">No se encontraron procedimientos.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {item.code || "---"}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600">
                      ${item.basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Switch 
                        checked={item.isActive} 
                        onCheckedChange={() => toggleActive(item.id, item.isActive)}
                        className="data-[state=checked]:bg-[#008bcd]"
                      />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openModal(item)} className="text-[#008bcd] hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 py-5 border-b border-border bg-slate-50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-black text-foreground">
              {editingItem ? "Editar Procedimiento" : "Nuevo Procedimiento"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Código (Opcional)</Label>
                <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Ej: OP-01" className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Categoría *</Label>
                <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ej: Operatoria" className="bg-muted/30" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Nombre del Procedimiento *</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Resina Simple 1 Cara" className="bg-muted/30" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Precio Base (USD / Moneda Local) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                <Input type="number" step="0.01" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} placeholder="0.00" className="pl-8 bg-muted/30 font-mono text-lg font-bold text-emerald-600" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/10 mt-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Procedimiento Activo</Label>
                <p className="text-xs text-muted-foreground">Visible para los doctores en el odontograma.</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={checked => setFormData({...formData, isActive: checked})} className="data-[state=checked]:bg-[#008bcd]" />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-[#008bcd] hover:bg-blue-600 text-white font-bold px-8">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingItem ? "Actualizar" : "Guardar Procedimiento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}