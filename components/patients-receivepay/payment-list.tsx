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

  // ESTADO VACÍO
  if (pendingItems.length === 0) {
    return (
      <div className="p-10 text-center bg-muted/20 border border-border/80 rounded-2xl flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-sm border border-border/80 mb-3">
          <Receipt className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">Al día</p>
        <p className="text-xs text-muted-foreground mt-1">
          No hay prestaciones con saldo pendiente de pago.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 font-sans antialiased w-full">
      {/* BARRA DE HERRAMIENTAS SUPERIOR */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold text-foreground uppercase tracking-widest">
            Detalle de Cuenta
          </span>
          <span className="text-[10px] font-bold text-[#008bcd] dark:text-[#38bdf8] bg-[#008bcd]/10 dark:bg-[#008bcd]/20 px-2 py-0.5 rounded-md">
            {selectedItemIds.length} / {pendingItems.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleAll}
          className="text-[11px] font-bold text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <Checkbox checked={allSelected} className="pointer-events-none w-3.5 h-3.5 rounded" />
          <span>{allSelected ? "Deseleccionar todo" : "Seleccionar todo"}</span>
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL TABLA ADAPTATIVO */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="max-h-[360px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase font-bold text-[9px] tracking-widest sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="py-3 px-4 w-10 text-center">Sel.</th>
                <th className="py-3 px-3 min-w-[180px]">Procedimiento</th>
                <th className="py-3 px-3 text-right">Costo Neto</th>
                <th className="py-3 px-3 text-right">Abonado</th>
                <th className="py-3 px-4 text-right text-foreground/70">Saldo a Pagar</th>
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
                      isSelected 
                        ? "bg-[#008bcd]/10 dark:bg-[#008bcd]/20" 
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {/* CHECKBOX */}
                    <td className="py-4 px-4 align-middle text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleItem(item.id)}
                        className="w-4 h-4 rounded data-[state=checked]:bg-[#008bcd] data-[state=checked]:border-[#008bcd] mx-auto"
                      />
                    </td>

                    {/* PROCEDIMIENTO Y PIEZA */}
                    <td className="py-4 px-3 align-middle">
                      <p className="font-bold text-foreground text-[12px] leading-snug group-hover:text-[#008bcd] dark:group-hover:text-[#38bdf8] transition-colors">
                        {item.name || item.procedureName}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[9px] font-extrabold bg-muted text-muted-foreground border border-border/50 px-2 py-0.5 rounded uppercase tracking-wider">
                          {item.toothLabel || item.tooth || "General"}
                        </span>
                        {item.planName && (
                          <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[140px]">
                            {item.planName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* COSTO NETO (Muestra descuento si existe) */}
                    <td className="py-4 px-3 text-right align-middle">
                      {hasDiscount && (
                        <div className="flex flex-col items-end mb-0.5">
                          <span className="text-[9px] text-muted-foreground/70 line-through">
                            ${Number(item.cost ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            <Percent className="w-2.5 h-2.5" /> {item.discountPercent}% 
                            {item.convenioName ? ` (${item.convenioName})` : ""}
                          </span>
                        </div>
                      )}
                      <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                        ${Number(item.finalPrice ?? item.cost ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* ABONADO PREVIAMENTE */}
                    <td className="py-4 px-3 text-right align-middle">
                      <span className="font-mono text-[11px] font-medium text-muted-foreground/70">
                        ${Number(item.paidAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* SALDO A PAGAR (Destacado) */}
                    <td className="py-4 px-4 text-right align-middle">
                      <span className={`font-mono text-[13px] font-black ${
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