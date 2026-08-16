"use client"

import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"

interface PaymentItemsListProps {
  pendingItems: any[]
  selectedItemIds: string[]
  onToggleItem: (id: string) => void
  onToggleAll: () => void
}

export function PaymentItemsList({
  pendingItems = [],
  selectedItemIds = [],
  onToggleItem,
  onToggleAll,
}: PaymentItemsListProps) {
  const allSelected = pendingItems.length > 0 && selectedItemIds.length === pendingItems.length

  if (pendingItems.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 border border-border/80 rounded-2xl flex flex-col items-center justify-center">
        <AlertCircle className="w-6 h-6 text-muted-foreground/40 mb-1" />
        No hay prestaciones con saldo pendiente para este paciente.
      </div>
    )
  }

  return (
    <div className="space-y-2.5 font-sans antialiased w-full">
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold text-foreground/80 uppercase tracking-wider">
            Prestaciones Pendientes
          </span>
          <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/80">
            {selectedItemIds.length} de {pendingItems.length} seleccionadas
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleAll}
          className="text-xs font-bold text-[#008bcd] hover:text-[#0070a8] hover:underline cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <Checkbox checked={allSelected} className="pointer-events-none w-3.5 h-3.5 rounded" />
          <span>{allSelected ? "Deseleccionar todo" : "Seleccionar todo"}</span>
        </button>
      </div>
      <div className="rounded-2xl border border-border/80 bg-card/60 overflow-hidden shadow-xs">
        <div className="max-h-[320px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            
            <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase font-bold text-[10px] tracking-wider sticky top-0 backdrop-blur-xs">
              <tr>
                <th className="py-3 px-3 w-8"></th>
                <th className="py-3 px-3 min-w-[200px]">Prestación</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Precio</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Abonado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/50">
              {pendingItems.map((item: any) => {
                const isSelected = selectedItemIds.includes(item.id)
                const isRealizada = item.status === "COMPLETED" || item.isDone || false

                return (
                  <tr
                    key={item.id}
                    onClick={() => onToggleItem(item.id)}
                    className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                      isSelected ? "bg-[#008bcd]/10" : ""
                    }`}
                  >
                    {/* CHECKBOX */}
                    <td className="py-3.5 px-3 align-middle">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleItem(item.id)}
                        className="w-4 h-4 rounded-md data-[state=checked]:bg-[#008bcd] data-[state=checked]:border-[#008bcd]"
                      />
                    </td>

                    {/* NOMBRE Y BADGE DE PIEZA */}
                    <td className="py-3.5 px-3 align-middle">
                      <p className="font-bold text-[#008bcd] dark:text-[#38bdf8] text-xs leading-snug">
                        {item.name || item.procedureName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-extrabold bg-[#008bcd]/15 text-[#008bcd] dark:text-[#38bdf8] px-2 py-0.5 rounded-md border border-[#008bcd]/20">
                          {item.toothLabel || item.tooth || "General"}
                        </span>
                        {item.planName && (
                          <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[160px]">
                            • {item.planName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PRECIO */}
                    <td className="py-3.5 px-3 text-right align-middle text-muted-foreground font-semibold whitespace-nowrap">
                      ${Number(item.finalPrice ?? item.cost ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>

                    {/* ABONADO */}
                    <td className="py-3.5 px-3 text-right align-middle text-muted-foreground font-semibold whitespace-nowrap">
                      ${Number(item.paidAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}