"use client"

import React, { useState, useEffect } from "react"
import { AlertTriangle, Download, ArrowDownToLine, ArrowUpFromLine, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function InventoryTab({ searchTerm }: { searchTerm: string }) {
  const [items, setItems] = useState<any[]>([])
  
  useEffect(() => {
    fetch('/api/inventory').then(res => res.json()).then(data => {
      if(Array.isArray(data)) setItems(data)
    }).catch(() => {})
  }, [])

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockCount = items.filter(p => p.stock <= p.minStock).length

  return (
    <div className="flex flex-col gap-6 flex-1">
      {/* BOTONES DE ACCIÓN */}
      <div className="flex flex-wrap gap-3 justify-end w-full">
        <Button variant="outline" className="border-border hover:bg-accent text-foreground font-bold h-11 rounded-xl">
          <Download className="w-4 h-4 mr-2 text-primary" /> Exportar
        </Button>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-6 rounded-xl">
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Ingresar
        </Button>
        <Button className="bg-red-500 hover:bg-red-600 text-white font-bold h-11 px-6 rounded-xl">
          <ArrowUpFromLine className="w-4 h-4 mr-2" /> Sacar
        </Button>
      </div>

      {/* ALERTA DE STOCK */}
      {lowStockCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 font-bold">
            <AlertTriangle className="w-5 h-5" />
            Hay {lowStockCount} productos con el stock mínimo o menos de lo establecido.
          </div>
        </div>
      )}

      {/* TABLA PREMIUM */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/30 border-b border-border text-xs uppercase text-muted-foreground font-black">
              <tr>
                <th className="px-6 py-4">Producto / Reg. Sanitario</th>
                <th className="px-6 py-4">Marca</th>
                <th className="px-6 py-4">Presentación</th>
                <th className="px-6 py-4">Expiración</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-center">Cód. Interno</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground font-medium">No hay insumos registrados.</td></tr>
              ) : (
                filteredItems.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground text-sm uppercase">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{p.registroSanitario || "---"}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-semibold">{p.marca || "---"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{p.presentacion || "---"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                        p.fechaExpiracion && new Date(p.fechaExpiracion) < new Date() ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                      }`}>
                        {p.fechaExpiracion ? p.fechaExpiracion.split('T')[0] : "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-lg text-foreground">{p.stock}</td>
                    <td className="px-6 py-4 text-center font-mono text-xs text-muted-foreground">{p.sku || "---"}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="hover:bg-accent rounded-xl">
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                      </Button>
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