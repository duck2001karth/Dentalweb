"use client"

import React from "react"
import { CheckSquare, Square } from "lucide-react"

interface PaymentItemsListProps {
  pendingItems: any[]
  selectedItemIds: string[]
  onToggleItem: (id: string) => void
  onToggleAll: () => void
}

export function PaymentItemsList({
  pendingItems,
  selectedItemIds,
  onToggleItem,
  onToggleAll
}: PaymentItemsListProps) {
  const isAllSelected = selectedItemIds.length === pendingItems.length && pendingItems.length > 0

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-border/60 text-xs">
        <button 
          onClick={onToggleAll}
          className="flex items-center gap-2 font-bold text-[#008bcd] hover:underline cursor-pointer"
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4 text-[#008bcd]" />
          ) : (
            <Square className="w-4 h-4 text-muted-foreground" />
          )}
          {isAllSelected ? "Deseleccionar todo" : "Seleccionar todos los ítems"}
        </button>
        <span className="font-semibold text-muted-foreground">
          {selectedItemIds.length} de {pendingItems.length} seleccionados
        </span>
      </div>
      {pendingItems.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground font-semibold text-xs border border-dashed border-border/80 rounded-xl bg-muted/10">
          Este paciente no tiene deudas ni prestaciones pendientes de pago en sus planes activos.
        </div>
      ) : (
        <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
          {pendingItems.map((item: any) => {
            const isSelected = selectedItemIds.includes(item.id)

            return (
              <div
                key={item.id}
                onClick={() => onToggleItem(item.id)}
                className={`p-3.5 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  isSelected 
                    ? "border-[#008bcd] bg-[#008bcd]/5" 
                    : "border-border/80 bg-background hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#008bcd] shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-xs text-foreground">{item.name}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Plan: <span className="text-foreground">{item.planName}</span>
                      {item.toothNumber ? ` • Pieza: ${item.toothNumber}` : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-extrabold text-xs text-foreground">${item.itemDebt.toFixed(2)} USD</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">Saldo Pendiente</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}