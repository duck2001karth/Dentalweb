"use client"

import React, { useState, useEffect } from "react"
import { Ban, Plus, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LaboratoryTab({ searchTerm }: { searchTerm: string }) {
  const [labs, setLabs] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/laboratories').then(res => res.json()).then(data => {
      if(Array.isArray(data)) setLabs(data)
    }).catch(() => {})
  }, [])

  const filteredLabs = labs.filter(lab => 
    lab.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await fetch('/api/laboratories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !currentStatus })
    });
    setLabs(labs.map(l => l.id === id ? { ...l, isActive: !currentStatus } : l));
  }

  return (
    <div className="flex flex-col gap-6 flex-1">
      
      {/* BOTONES SUPERIORES Y ALERTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="bg-[#008bcd]/10 border border-[#008bcd]/30 rounded-xl p-4 flex items-start gap-3 flex-1 w-full">
          <Info className="w-5 h-5 text-[#008bcd] shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-foreground/80 leading-relaxed">
            Es recomendado crear los Laboratorios (empresas) y luego añadir prestaciones.
          </p>
        </div>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 px-6 rounded-xl shadow-sm shrink-0">
          <Plus className="w-5 h-5 mr-2" /> Nuevo laboratorio
        </Button>
      </div>

      {/* TABLA PREMIUM */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/30 border-b border-border text-xs uppercase text-muted-foreground font-black">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Detalle</th>
                <th className="px-6 py-4">Por pagar</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLabs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground font-medium">No hay laboratorios registrados.</td></tr>
              ) : (
                filteredLabs.map((lab) => (
                  <tr key={lab.id} className={`hover:bg-accent/40 transition-colors ${!lab.isActive && "opacity-50 grayscale"}`}>
                    <td className="px-6 py-4 font-bold text-[#008bcd] hover:underline cursor-pointer text-base">
                      {lab.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{lab.details || "---"}</td>
                    <td className="px-6 py-4">
                      <span className={`font-black text-base ${lab.balance > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                        ${lab.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        onClick={() => handleToggleActive(lab.id, lab.isActive)}
                        variant={lab.isActive ? "destructive" : "outline"} 
                        className={`h-9 px-4 rounded-lg font-bold text-xs shadow-sm ${lab.isActive ? "bg-red-500 hover:bg-red-600" : ""}`}
                      >
                        {lab.isActive ? <><Ban className="w-3.5 h-3.5 mr-1.5" /> Deshabilitar</> : "Habilitar"}
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