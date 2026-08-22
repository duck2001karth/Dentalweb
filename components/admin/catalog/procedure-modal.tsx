"use client"

import React, { useState, useEffect } from "react"
import { ListTree, Loader2, DollarSign, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

interface Procedure {
  id: string
  code: string | null
  name: string
  category: string
  basePrice: number
  isActive: boolean
}

interface ProcedureModalProps {
  isOpen: boolean
  onClose: () => void
  editingItem: Procedure | null
  categories: string[]
  isSaving: boolean
  onSave: (data: any) => Promise<void>
}

export function ProcedureModal({
  isOpen,
  onClose,
  editingItem,
  categories,
  isSaving,
  onSave
}: ProcedureModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "OPERATORIA",
    basePrice: "",
    isActive: true
  })

  const generateCode = (category: string) => {
    const prefix = category.substring(0, 3).toUpperCase()
    const random = Math.floor(1000 + Math.random() * 9000)
    return `${prefix}-${random}`
  }

  useEffect(() => {
    if (editingItem) {
      setFormData({
        code: editingItem.code || "",
        name: editingItem.name,
        category: editingItem.category,
        basePrice: editingItem.basePrice.toString(),
        isActive: editingItem.isActive
      })
    } else {
      setFormData({
        code: generateCode("OPERATORIA"),
        name: "",
        category: "OPERATORIA",
        basePrice: "",
        isActive: true
      })
    }
  }, [editingItem, isOpen])

  const handleCategoryChange = (newCat: string) => {
    setFormData((prev) => ({
      ...prev,
      category: newCat,
      code: prev.code && editingItem ? prev.code : generateCode(newCat)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.category || !formData.basePrice) return
    await onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] bg-card border-border shadow-2xl rounded-[24px] p-0 overflow-hidden text-foreground">
        <DialogHeader className="px-8 py-6 border-b border-border bg-[#008bcd]/5">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#008bcd]/10 text-[#008bcd] flex items-center justify-center">
              <ListTree className="w-5 h-5 stroke-[2.2]" />
            </div>
            {editingItem ? "Actualizar Prestación Clínica" : "Nueva Prestación / Consulta"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Configura el arancel base que se usará en los presupuestos y odontograma.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Especialidad / Categoría *
                </Label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-[#008bcd]/30 transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Código Interno
                </Label>
                <Input
                  value={formData.code}
                  readOnly
                  className="bg-muted text-muted-foreground font-mono font-bold h-11 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Nombre de la Prestación o Consulta *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Profilaxis y Destartraje Completo"
                className="bg-background border-border h-11 rounded-xl text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Precio Arancelario (USD) *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-base">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="0.00"
                  className="pl-9 h-12 bg-background border-border font-mono text-lg font-black text-emerald-600 dark:text-emerald-400 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-8 py-5 border-t border-border bg-muted/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                className="data-[state=checked]:bg-emerald-500"
              />
              <Label className="text-xs font-bold text-muted-foreground cursor-pointer">
                Habilitado en Odontograma
              </Label>
            </div>
            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl text-xs font-bold h-11 px-5 border-border"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !formData.name || !formData.basePrice}
                className="bg-[#008bcd] hover:bg-[#007bb6] text-white rounded-xl text-xs font-bold h-11 px-7 transition-all"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingItem ? "Guardar Cambios" : "Crear Prestación"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}