"use client"

import React from "react"
import { Trash2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface DeletedPaymentsTableProps {
  payments: any[]
}

export function DeletedPaymentsTable({ payments = [] }: DeletedPaymentsTableProps) {
  const formatDeletionNote = (notes: string) => {
    if (!notes) return "Sin justificación registrada."
    return notes
      .replace(/^\[PAGO ELIMINADO\/ANULADO[^\]]*\]:\s*/, "")
      .split(" | Historial previo:")[0]
  }

  const getDeletedBy = (notes: string) => {
    const match = notes?.match(/por ([^\]]+)\]/)
    return match ? match[1] : "Caja / Administración"
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="p-12 text-center text-sm font-medium text-muted-foreground bg-card border border-border/80 rounded-2xl">
        <Trash2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        No existen registros de pagos eliminados para este paciente.
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans antialiased">
      <div>
        <h3 className="text-lg font-bold text-red-600 dark:text-red-500 flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> Auditoría de Pagos Eliminados
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Registro inalterable de cobros anulados junto con el responsable y la justificación obligatoria ingresada por caja.
        </p>
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4"># Cobro</th>
                <th className="py-3.5 px-4">Fecha Anulación</th>
                <th className="py-3.5 px-4">Monto Anulado</th>
                <th className="py-3.5 px-4">Anulado Por</th>
                <th className="py-3.5 px-4">Justificación de la Eliminación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {payments.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    {item.paymentNumber}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-muted-foreground">
                    {format(new Date(item.createdAt), "dd MMM yyyy • HH:mm", { locale: es })}
                  </td>
                  <td className="py-3.5 px-4 font-black text-red-600 dark:text-red-400">
                    ${Math.abs(Number(item.amount || 0)).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-200">
                    {getDeletedBy(item.notes)}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-300">
                    <span className="bg-red-500/10 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-md font-semibold inline-block">
                      {formatDeletionNote(item.notes)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}