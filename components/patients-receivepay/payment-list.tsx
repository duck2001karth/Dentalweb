"use client"

import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Receipt, Percent } from "lucide-react"

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
      <div className="p-8 text-center bg-muted/20 border border-border/80 rounded-2xl flex flex-col items-center justify-center">
        <div className="w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-sm border border-border/80 mb-2">
          <Receipt className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-[13px] font-medium text-foreground">Al día</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          No hay prestaciones pendientes.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 font-sans antialiased w-full">
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-widest">
            Detalle de Cuenta
          </span>
          <span className="text-[9px] font-medium text-[#008bcd] dark:text-[#38bdf8] bg-[#008bcd]/10 dark:bg-[#008bcd]/20 px-2 py-0.5 rounded-md">
            {selectedItemIds.length} / {pendingItems.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleAll}
          className="text-[10px] font-medium text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <Checkbox checked={allSelected} className="pointer-events-none w-3 h-3 rounded-[3px]" />
          <span>{allSelected ? "Deseleccionar todo" : "Seleccionar todo"}</span>
        </button>
      </div>

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase font-semibold text-[9px] tracking-widest sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center">Sel.</th>
                <th className="py-2.5 px-3">Procedimiento</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Neto</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Abonado</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap text-foreground/80">Pagar</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/50">
              {pendingItems.map((item: any) => {
                const isSelected = selectedItemIds.includes(item.id)
                const hasDiscount = item.discountPercent > 0

                return (
                  <tr
                    key={item.id}
                    onClick={() => onToggleItem(item.id)}
                    className={`group cursor-pointer transition-colors ${
                      isSelected ? "bg-[#008bcd]/10 dark:bg-[#008bcd]/20" : "hover:bg-muted/40"
                    }`}
                  >
                    <td className="py-2.5 px-3 align-middle text-center">
                      {/* 💥 SE ELIMINÓ onCheckedChange Y SE AGREGÓ pointer-events-none PARA SOLUCIONAR EL DOBLE CLIC */}
                      <Checkbox
                        checked={isSelected}
                        className="w-3.5 h-3.5 rounded-[3px] data-[state=checked]:bg-[#008bcd] data-[state=checked]:border-[#008bcd] mx-auto pointer-events-none"
                      />
                    </td>

                    <td className="py-2.5 px-3 align-middle">
                      <p className="font-semibold text-foreground text-[11px] leading-snug group-hover:text-[#008bcd] dark:group-hover:text-[#38bdf8] transition-colors line-clamp-2">
                        {item.name || item.procedureName}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] font-semibold bg-muted text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                          {item.toothLabel || item.tooth || "General"}
                        </span>
                        {item.planName && (
                          <span className="text-[9px] text-muted-foreground font-medium truncate max-w-[120px]">
                            {item.planName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right align-middle whitespace-nowrap">
                      {hasDiscount && (
                        <div className="flex flex-col items-end mb-0.5">
                          <span className="text-[8px] text-muted-foreground/60 line-through">
                            ${Number(item.cost ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded mt-0.5">
                            <Percent className="w-2 h-2" /> {item.discountPercent}%
                          </span>
                        </div>
                      )}
                      <span className="font-mono text-[10px] font-medium text-muted-foreground">
                        ${Number(item.finalPrice ?? item.cost ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right align-middle whitespace-nowrap">
                      <span className="font-mono text-[10px] font-medium text-muted-foreground/60">
                        ${Number(item.paidAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right align-middle whitespace-nowrap">
                      <span className={`font-mono text-[11px] font-bold ${
                        isSelected ? "text-[#008bcd] dark:text-[#38bdf8]" : "text-foreground"
                      }`}>
                        ${Number(item.itemDebt ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
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