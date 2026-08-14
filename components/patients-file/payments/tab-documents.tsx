"use client"

import React from "react"
import { Receipt, FileText, Download } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface DocumentsIssuedTabProps {
  payments: any[]
}

export function DocumentsIssuedTab({ payments = [] }: DocumentsIssuedTabProps) {
  const issuedDocs = payments.filter((p) => p.invoiceNumber && p.invoiceNumber !== "-")

  if (issuedDocs.length === 0) {
    return (
      <div className="p-12 text-center text-sm font-medium text-muted-foreground bg-card border border-border/80 rounded-2xl">
        <Receipt className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        No hay boletas ni facturas electrónicas emitidas formalmente para este paciente.
      </div>
    )
  }

  return (
    <div className="space-y-4 font-sans antialiased">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#008bcd]" /> Documentos Tributarios Emitidos
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Historial de comprobantes fiscales, boletas y facturas vinculadas a los pagos.
        </p>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4"># Documento</th>
              <th className="py-3 px-4"># Referencia Pago</th>
              <th className="py-3 px-4">Fecha Emisión</th>
              <th className="py-3 px-4">Monto</th>
              <th className="py-3 px-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {issuedDocs.map((doc) => (
              <tr key={doc.id} className="hover:bg-muted/20">
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                  {doc.invoiceNumber}
                </td>
                <td className="py-3.5 px-4 font-semibold text-foreground">
                  {doc.paymentNumber}
                </td>
                <td className="py-3.5 px-4 text-muted-foreground">
                  {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}
                </td>
                <td className="py-3.5 px-4 font-black text-foreground">
                  ${Number(doc.amount || 0).toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Emitido
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}