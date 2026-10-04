"use client"

import React from "react"
import { SlidersHorizontal, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export interface AgendaFiltersState {
  status: string
  box: string
  query: string
}

interface AgendaFiltersModalProps {
  filters: AgendaFiltersState
  onFiltersChange: (filters: AgendaFiltersState) => void
  availableBoxes: string[]
  accentColor: string
}

export function AgendaFiltersModal({
  filters,
  onFiltersChange,
  availableBoxes,
  accentColor,
}: AgendaFiltersModalProps) {
  const activeCount = 
    (filters.status !== "ALL" ? 1 : 0) + 
    (filters.box !== "ALL" ? 1 : 0) + 
    (filters.query.trim().length > 0 ? 1 : 0)

  const handleReset = () => {
    onFiltersChange({ status: "ALL", box: "ALL", query: "" })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 rounded-xl gap-2 text-xs font-bold border-border/80 bg-card text-foreground hover:bg-muted cursor-pointer transition-all shadow-2xs relative"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: activeCount > 0 ? accentColor : undefined }} />
          <span>Filtros</span>
          {activeCount > 0 && (
            <span 
              className="w-4 h-4 rounded-full text-[10px] font-black text-white flex items-center justify-center -ml-1"
              style={{ backgroundColor: accentColor }}
            >
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-4 bg-card border-border/80 rounded-2xl shadow-2xl z-[120]">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <p className="text-xs font-black uppercase tracking-wider text-foreground">Filtrar Agenda</p>
          {activeCount > 0 && (
            <button
              onClick={handleReset}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        <div className="space-y-3.5 pt-3 text-xs">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-muted-foreground">Buscar Paciente</Label>
            <Input
              value={filters.query}
              onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
              placeholder="Nombre o motivo..."
              className="h-8 text-xs bg-background border-border/80 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-muted-foreground">Estado</Label>
            <Select 
              value={filters.status} 
              onValueChange={(val) => onFiltersChange({ ...filters, status: val })}
            >
              <SelectTrigger className="h-8 text-xs font-semibold bg-background border-border/80 rounded-lg">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/80 rounded-xl text-xs font-medium">
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="SCHEDULED">Agendada</SelectItem>
                <SelectItem value="WAITING">En Sala</SelectItem>
                <SelectItem value="IN_PROGRESS">En Atención</SelectItem>
                <SelectItem value="COMPLETED">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sillón / Box */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-muted-foreground">Sillón / Box</Label>
            <Select 
              value={filters.box} 
              onValueChange={(val) => onFiltersChange({ ...filters, box: val })}
            >
              <SelectTrigger className="h-8 text-xs font-semibold bg-background border-border/80 rounded-lg">
                <SelectValue placeholder="Todos los sillones" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/80 rounded-xl text-xs font-medium">
                <SelectItem value="ALL">Todos los sillones</SelectItem>
                {availableBoxes.map((box) => (
                  <SelectItem key={box} value={box}>{box}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}