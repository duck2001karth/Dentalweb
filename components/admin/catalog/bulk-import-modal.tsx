"use client"

import React, { useState } from "react"
import { 
  UploadCloud, 
  Wand2, 
  FileSpreadsheet, 
  Loader2, 
  Trash2,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  categories: string[]
  onImport: (items: any[]) => Promise<void>
}

export function BulkImportModal({ isOpen, onClose, categories, onImport }: BulkImportModalProps) {
  const [activeTab, setActiveTab] = useState<"FILE" | "PASTE">("PASTE")
  const [rawText, setRawText] = useState("")
  const [parsedItems, setParsedItems] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [defaultCategory, setDefaultCategory] = useState("OPERATORIA")

  // Función para interpretar el texto pegado desde un PDF
  const handleSmartPaste = () => {
    if (!rawText.trim()) return
    setIsProcessing(true)

    setTimeout(() => {
      const lines = rawText.split('\n')
      const results: any[] = []
      
      // Regex básica: Busca texto, opcionalmente un signo de $, y luego números al final
      const regex = /^(.*?)(?:[$\s:-]+)?(\d+(?:[.,]\d{1,2})?)$/i

      lines.forEach((line) => {
        const cleanLine = line.trim()
        if (!cleanLine) return

        const match = cleanLine.match(regex)
        if (match) {
          const name = match[1].trim().replace(/[-:]$/, '').trim()
          const priceStr = match[2].replace(',', '.') // Normalizar coma a punto
          
          if (name && !isNaN(parseFloat(priceStr))) {
            results.push({
              name: name,
              basePrice: parseFloat(priceStr),
              category: defaultCategory
            })
          }
        }
      })

      setParsedItems(results)
      setIsProcessing(false)
    }, 600) // Simular un pequeño retardo de procesamiento para sensación premium
  }

  const removeItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateItemPrice = (index: number, newPrice: string) => {
    const updated = [...parsedItems]
    updated[index].basePrice = parseFloat(newPrice) || 0
    setParsedItems(updated)
  }

  const handleUpdateItemCategory = (index: number, newCat: string) => {
    const updated = [...parsedItems]
    updated[index].category = newCat
    setParsedItems(updated)
  }

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) return
    setIsProcessing(true)
    await onImport(parsedItems)
    setIsProcessing(false)
    setParsedItems([])
    setRawText("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] bg-card border-border rounded-[24px] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 py-5 border-b border-border bg-muted/20">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-3">
            Importación de Aranceles
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Carga múltiples prestaciones a la vez usando un archivo Excel o pegando el texto de un PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          
          {/* PESTAÑAS (SWITCH PREMIUM) */}
          <div className="bg-muted/40 p-1 rounded-xl flex items-center w-full max-w-[400px] mx-auto border border-border/60">
            <button
              onClick={() => setActiveTab("PASTE")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "PASTE" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" /> Pegado Inteligente
            </button>
            <button
              onClick={() => setActiveTab("FILE")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "FILE" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Archivo Excel / CSV
            </button>
          </div>

          {/* CONTENIDO: PEGADO INTELIGENTE */}
          {activeTab === "PASTE" && parsedItems.length === 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">1. Pega el texto de tu PDF o documento aquí:</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Categoría por defecto:</span>
                  <select 
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                    className="text-xs bg-muted border border-border rounded-lg px-2 py-1 outline-none font-bold text-[#008bcd]"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={"Endodoncia Unirradicular $120.00\nExtracción Simple 45.00\nLimpieza Profunda 35"}
                className="w-full h-40 bg-background border border-border rounded-xl p-4 text-xs resize-none focus:ring-2 focus:ring-[#008bcd]/30 outline-none font-mono"
              />
              <Button 
                onClick={handleSmartPaste} 
                disabled={!rawText.trim() || isProcessing}
                className="w-full bg-[#008bcd] hover:bg-[#007bb6] text-white font-bold h-11 rounded-xl"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Extraer Procedimientos y Precios
              </Button>
            </div>
          )}

          {/* PREVISUALIZACIÓN DE RESULTADOS DEL PEGADO */}
          {activeTab === "PASTE" && parsedItems.length > 0 && (
            <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {parsedItems.length} Procedimientos Detectados
                </h4>
                <Button variant="ghost" size="sm" onClick={() => setParsedItems([])} className="text-xs text-muted-foreground h-8">
                  Volver a pegar
                </Button>
              </div>

              <div className="max-h-[300px] overflow-y-auto border border-border rounded-xl custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-4 py-2.5 font-bold text-muted-foreground">Procedimiento</th>
                      <th className="px-4 py-2.5 font-bold text-muted-foreground">Categoría</th>
                      <th className="px-4 py-2.5 font-bold text-muted-foreground w-24">Precio ($)</th>
                      <th className="px-4 py-2.5 font-bold text-muted-foreground w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="px-4 py-2 font-semibold text-foreground">{item.name}</td>
                        <td className="px-4 py-2">
                          <select 
                            value={item.category}
                            onChange={(e) => handleUpdateItemCategory(idx, e.target.value)}
                            className="bg-transparent text-[10px] font-bold uppercase text-[#008bcd] outline-none cursor-pointer"
                          >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <Input 
                            type="number" 
                            step="0.01" 
                            value={item.basePrice} 
                            onChange={(e) => handleUpdateItemPrice(idx, e.target.value)}
                            className="h-7 w-20 px-2 text-xs font-mono font-bold"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-rose-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CONTENIDO: ARCHIVO EXCEL (UI MOCK) */}
          {activeTab === "FILE" && (
            <div className="border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors rounded-2xl p-10 flex flex-col items-center justify-center text-center animate-in fade-in cursor-pointer">
              <UploadCloud className="w-12 h-12 text-[#008bcd] mb-3 opacity-80" />
              <p className="font-bold text-foreground text-sm">Arrastra tu archivo Excel o CSV aquí</p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
                El archivo debe contener las columnas: Categoría, Nombre y Precio.
              </p>
              <Button variant="outline" className="mt-4 rounded-xl text-xs font-bold border-border">
                Explorar Archivos
              </Button>
            </div>
          )}

        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/10 flex gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold border-border">
            Cancelar
          </Button>
          <Button 
            disabled={parsedItems.length === 0 || isProcessing}
            onClick={handleConfirmImport}
            className="bg-[#008bcd] hover:bg-[#007bb6] text-white rounded-xl text-xs font-bold"
          >
            {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
            Importar {parsedItems.length} Procedimientos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}