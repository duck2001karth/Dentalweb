"use client"

import React, { useState, useEffect, useCallback } from "react"
import { 
  Plus, Search, Edit2, Trash2, Loader2, ListTree, 
  UploadCloud, FileUp, FileSpreadsheet, Info, CheckCircle2, AlertTriangle, Download
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Procedure | null>(null)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [editingItem, setEditingItem] = useState<Procedure | null>(null)
  
  const [formData, setFormData] = useState({
    code: "", name: "", category: "OPERATORIA", basePrice: "", isActive: true
  })

  const categories = [
    "ORTOPEDIA", "ORTODONCIA", "ENDODONCIA", "ESTÉTICA", 
    "IMPLANTOLOGIA", "REHABILITACIÓN ORAL", "ODONTOPEDIATRIA", "CIRUGÍA ORAL", "OPERATORIA"
  ]

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/catalog")
      if (res.ok) setItems(await res.json())
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el catálogo.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchCatalog() }, [fetchCatalog])

  const generateCode = (category: string) => {
    const prefix = category.substring(0, 3).toUpperCase()
    const random = Math.floor(1000 + Math.random() * 9000)
    return `${prefix}-${random}`
  }

  const handleCategoryChange = (newCategory: string) => {
    setFormData(prev => ({
      ...prev,
      category: newCategory,
      code: prev.code && editingItem ? prev.code : generateCode(newCategory)
    }))
  }

  const openModal = (item?: Procedure) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        code: item.code || "", name: item.name, category: item.category, basePrice: item.basePrice.toString(), isActive: item.isActive
      })
    } else {
      setEditingItem(null)
      setFormData({ code: generateCode("OPERATORIA"), name: "", category: "OPERATORIA", basePrice: "", isActive: true })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.basePrice) {
      return toast({ title: "Campos incompletos", description: "Nombre, categoría y precio son obligatorios.", variant: "destructive" })
    }
    setIsSaving(true)
    try {
      const method = editingItem ? "PATCH" : "POST"
      const payload = editingItem ? { id: editingItem.id, ...formData } : formData
      const res = await fetch("/api/admin/catalog", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error()
      toast({ title: editingItem ? "Procedimiento actualizado" : "Procedimiento creado", variant: "success" })
      setIsModalOpen(false)
      fetchCatalog()
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el procedimiento.", variant: "destructive" })
    } finally { setIsSaving(false) }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: !currentStatus })
      })
      if (!res.ok) throw new Error()
      fetchCatalog()
    } catch (error) { toast({ title: "Error", variant: "destructive" }) }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/catalog?id=${itemToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Procedimiento eliminado", variant: "success" })
      fetchCatalog()
    } catch (error) { toast({ title: "Error al eliminar", variant: "destructive" }) } 
    finally {
      setIsSaving(false)
      setItemToDelete(null)
    }
  }

  const downloadTemplate = () => {
    const BOM = "\uFEFF"
    const csvContent = BOM + "Categoría,Nombre,Precio\nOPERATORIA,Resina Simple,45.00\nCIRUGÍA ORAL,Extracción Simple,50.00"
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "Plantilla_Catalogo_Precios.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER ADAPTABLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <ListTree className="w-8 h-8 text-primary" /> Catálogo de Precios
          </h2>
          <p className="text-muted-foreground mt-1 font-medium">Gestiona las prestaciones, valores y estado para el odontograma.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={() => setIsBulkModalOpen(true)} className="flex-1 md:flex-none border-border hover:bg-accent text-foreground">
            <FileSpreadsheet className="w-5 h-5 mr-2 text-emerald-500" /> Importar Excel
          </Button>
          <Button onClick={() => openModal()} className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <Plus className="w-5 h-5 mr-2" /> Nuevo Registro
          </Button>
        </div>
      </div>

      {/* CONTENEDOR DE TABLA ADAPTABLE */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-5 border-b border-border bg-muted/40 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input placeholder="Buscar procedimiento, código..." className="pl-12 h-11 bg-background border-border rounded-xl focus-visible:ring-primary" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {items.filter(i=>i.isActive).length} Activos
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/20 border-b border-border text-xs uppercase text-muted-foreground font-black">
              <tr>
                <th className="px-6 py-4">Código Interno</th>
                <th className="px-6 py-4">Procedimiento</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Precio ($)</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Opciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-24 text-center"><Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" /><p className="text-muted-foreground font-medium text-lg">Cargando base de datos...</p></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-24 text-center"><Info className="w-10 h-10 text-muted-foreground mx-auto mb-4"/><p className="text-muted-foreground font-medium text-lg">No hay resultados disponibles.</p></td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className={`hover:bg-accent/40 transition-all ${!item.isActive ? 'opacity-50 bg-muted/20' : ''}`}>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-muted-foreground bg-muted/10">{item.code || "---"}</td>
                    <td className="px-6 py-4 font-bold text-foreground text-base">{item.name}</td>
                    <td className="px-6 py-4"><span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">{item.category}</span></td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">${item.basePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-center"><Switch checked={item.isActive} onCheckedChange={() => toggleActive(item.id, item.isActive)} className="data-[state=checked]:bg-emerald-500" /></td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openModal(item)} className="text-muted-foreground hover:text-primary hover:bg-accent rounded-xl"><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setItemToDelete(item)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDICIÓN CORREGIDO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border shadow-2xl rounded-[24px] p-0 overflow-hidden">
          <DialogHeader className="px-8 py-6 border-b border-border bg-muted/40">
            <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-3">
              {editingItem ? "Actualizar Registro" : "Crear Nuevo Procedimiento"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Categoría Clínica *</Label>
                <select value={formData.category} onChange={e => handleCategoryChange(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground outline-none text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Código Generado</Label>
                <Input value={formData.code} readOnly className="bg-muted text-muted-foreground font-mono font-bold h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Nombre de la Prestación *</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Endodoncia Unirradicular" className="bg-background border-border h-12 rounded-xl text-base" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Arancel / Precio Base *</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-lg">$</span>
                <Input type="number" step="0.01" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} placeholder="0.00" className="pl-10 h-14 bg-background border-border font-mono text-xl font-black text-emerald-600 dark:text-emerald-400 rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter className="px-8 py-5 border-t border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch checked={formData.isActive} onCheckedChange={checked => setFormData({...formData, isActive: checked})} className="data-[state=checked]:bg-emerald-500" />
              <Label className="text-sm font-bold text-muted-foreground cursor-pointer">Procedimiento Activo</Label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-border hover:bg-accent text-foreground">Cancelar</Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground font-bold h-12">
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null} Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL IMPORTAR */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="sm:max-w-[750px] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl text-foreground">
          <div className="flex flex-col md:flex-row h-full">
            <div className="flex-1 p-8 bg-card flex flex-col justify-center">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">Importar Catálogo</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2">Sube tu archivo para actualizar los precios masivamente.</DialogDescription>
              </DialogHeader>
              <div className="relative border-2 border-dashed border-border bg-muted/30 hover:bg-accent/40 transition-colors rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <UploadCloud className="w-16 h-16 text-muted-foreground mb-3" />
                <p className="font-bold text-foreground">Arrastra tu archivo aquí o haz clic</p>
                <p className="text-xs text-muted-foreground mt-1">Formatos permitidos: .csv, .xlsx</p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsBulkModalOpen(false)} className="text-muted-foreground hover:text-foreground">Cancelar</Button>
                <Button className="bg-primary text-primary-foreground font-bold">Importar Datos</Button>
              </div>
            </div>
            <div className="w-full md:w-[280px] bg-muted/40 border-l border-border p-8 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="font-black text-foreground">Guía rápida</h3>
              </div>
              
              <div className="space-y-6 flex-1">
                <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-20px] before:w-0.5 before:bg-border">
                  <span className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background z-10">1</span>
                  <p className="text-sm font-bold text-foreground">Prepara el archivo</p>
                  <p className="text-xs text-muted-foreground mt-1">Debe tener exactamente 3 columnas en este orden.</p>
                </div>
                <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-20px] before:w-0.5 before:bg-border">
                  <span className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background z-10">2</span>
                  <p className="text-sm font-bold text-foreground">Encabezados (Fila 1)</p>
                  <p className="text-xs font-mono bg-background border border-border px-2 py-1 rounded mt-2 text-muted-foreground">Categoría | Nombre | Precio</p>
                </div>
                <div className="relative pl-6">
                  <span className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background z-10">3</span>
                  <p className="text-sm font-bold text-foreground">Sin formato</p>
                  <p className="text-xs text-muted-foreground mt-1">Solo números (Ej: <span className="font-bold text-foreground">45.00</span>), sin signos de dólar ($).</p>
                </div>
              </div>

              <Button onClick={downloadTemplate} variant="outline" className="w-full text-xs font-bold mt-6 bg-card border-border text-primary hover:bg-accent">
                <Download className="w-3 h-3 mr-2" /> Plantilla .CSV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ALERT DELETE */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="bg-card border-border rounded-[24px] shadow-2xl sm:max-w-[450px]">
          <AlertDialogHeader className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center"><AlertTriangle className="w-8 h-8" /></div>
            <AlertDialogTitle className="text-2xl font-black text-foreground">¿Eliminar Procedimiento?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">Esta acción borrará permanentemente el registro clínico.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="w-full flex sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="border-border hover:bg-accent text-foreground">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}