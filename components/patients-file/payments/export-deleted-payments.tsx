"use client"

import React from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase()
  switch (m) {
    case "CASH": case "EFECTIVO": return "Efectivo"
    case "CREDIT_CARD": case "TARJETA_CREDITO": return "Tarjeta de Crédito"
    case "DEBIT_CARD": case "TARJETA_DEBITO": return "Tarjeta de Débito"
    case "TRANSFER": case "TRANSFERENCIA": case "NEQUI": return "Transferencia Bancaria"
    case "CHECK": case "CHEQUE": return "Cheque"
    default: return method
  }
}

interface ExportDeletedPaymentsProps {
  data: any[]
  patientFullName?: string
  patientDocId?: string
  patientAge?: string | number
  issuedBy?: string
}

export function ExportDeletedPayments({ 
  data, 
  patientFullName = "Paciente Registrado",
  patientDocId = "No registrado",
  patientAge = "--",
  issuedBy = "Administrador"
}: ExportDeletedPaymentsProps) {
  
  const handleExportCSV = () => {
    if (!data || data.length === 0) return

    const headers = [
      "No. Pago", "Medio de Pago", "No. Documento (Factura)", 
      "Fecha Ingreso", "Fecha Anulacion", "Anulado Por", 
      "Motivo/Comentario", "Monto Anulado"
    ]

    const rows = data.map((item) => {
      const paymentNum = item.paymentNumber || item.receiptNumber || item.number || `#REC-${item.id?.slice(-6)}`
      const methodStr = formatPaymentMethod(item.method || item.paymentMethod)
      const docStr = item.invoiceNumber || item.receiptNumberFiscal || "-"
      const createdDate = format(new Date(item.createdAt || new Date()), "dd/MM/yyyy", { locale: es })
      const deletedDate = format(new Date(item.updatedAt || new Date()), "dd/MM/yyyy HH:mm", { locale: es })
      
      let deletedBy = item.processedBy?.name || item.user?.name || "Administrador"
      if (item.notes && typeof item.notes === "string") {
        const match = item.notes.match(/por ([^\]]+)\]/)
        if (match) deletedBy = match[1]
      }

      let reasonText = "Sin justificación"
      if (item.notes) {
        reasonText = item.notes.replace(/^\[PAGO ELIMINADO\/ANULADO[^\]]*\]:\s*/, "").split(" | Historial previo:")[0].trim()
      }

      const rawAmount = Math.abs(Number(item.amount || item.paidAmount || 0)).toFixed(2)

      return [
        `"${paymentNum}"`, `"${methodStr}"`, `"${docStr}"`, 
        `"${createdDate}"`, `"${deletedDate}"`, `"${deletedBy}"`, 
        `"${reasonText.replace(/"/g, '""')}"`, `"${rawAmount}"`
      ].join(",")
    })

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Auditoria_Anulados_${patientFullName.replace(/\s+/g, '_')}_${format(new Date(), "ddMMyyyy")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (!data || data.length === 0) return

    const printWindow = window.open("", "_blank", "width=1000,height=800")
    if (!printWindow) return

    const totalAnulado = data.reduce((acc, item) => acc + Math.abs(Number(item.amount || item.paidAmount || 0)), 0)

    const tableRows = data.map((item) => {
      const paymentNum = item.paymentNumber || item.receiptNumber || item.number || `#REC-${item.id?.slice(-6)}`
      const methodStr = formatPaymentMethod(item.method || item.paymentMethod)
      const deletedDate = format(new Date(item.updatedAt || new Date()), "dd/MM/yyyy HH:mm", { locale: es })
      
      let deletedBy = item.processedBy?.name || item.user?.name || "Admin"
      if (item.notes && typeof item.notes === "string") {
        const match = item.notes.match(/por ([^\]]+)\]/)
        if (match) deletedBy = match[1]
      }

      let reasonText = "Sin justificación"
      if (item.notes) {
        reasonText = item.notes.replace(/^\[PAGO ELIMINADO\/ANULADO[^\]]*\]:\s*/, "").split(" | Historial previo:")[0].trim()
      }

      const rawAmount = Math.abs(Number(item.amount || item.paidAmount || 0)).toFixed(2)

      return `
        <tr>
          <td style="font-weight: 700; color: #008bcd;">${paymentNum}</td>
          <td>${methodStr}</td>
          <td>${deletedDate}</td>
          <td><b>${deletedBy}</b></td>
          <td style="color: #475569;">${reasonText}</td>
          <td style="text-align: right; font-weight: 800; color: #e11d48;">$${rawAmount}</td>
        </tr>
      `
    }).join("")

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Auditoría de Pagos Anulados - ${patientFullName}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 40px; margin: 0; }
          .header-table { width: 100%; border-bottom: 2px solid #008bcd; padding-bottom: 15px; margin-bottom: 25px; }
          .title { color: #008bcd; font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 18px; margin-bottom: 25px; display: flex; justify-content: space-between; font-size: 12px; }
          .info-col p { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th { background-color: #f1f5f9; color: #334155; font-weight: 800; text-transform: uppercase; padding: 10px 8px; border-bottom: 1px solid #cbd5e1; text-align: left; }
          td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .total-box { margin-top: 20px; text-align: right; font-size: 13px; font-weight: 800; }
          .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="title">Carmo Dental</div>
              <div class="subtitle">Reporte de Auditoría: Pagos y Comprobantes Anulados</div>
            </td>
            <td style="text-align: right; font-size: 11px; color: #64748b;">
              Fecha de Emisión: <b>${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</b>
            </td>
          </tr>
        </table>
        
        <div class="info-box">
          <div class="info-col">
            <p><strong>Paciente:</strong> ${patientFullName}</p>
            <p><strong>Identificación (CI/DNI):</strong> ${patientDocId}</p>
            <p><strong>Edad:</strong> ${patientAge !== "--" ? `${patientAge} Años` : "--"}</p>
          </div>
          <div class="info-col" style="text-align: right;">
            <p><strong>Generado por:</strong> ${issuedBy}</p>
            <p><strong>Total Anulaciones:</strong> ${data.length} registros</p>
            <p><strong>Estado:</strong> Solo Control Interno</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th># Documento</th>
              <th>Medio Pago</th>
              <th>Fecha Anulación</th>
              <th>Anulado Por</th>
              <th>Motivo de Anulación / Comentario</th>
              <th style="text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="total-box">
          Total Monto Anulado: <span style="color: #e11d48;">$${totalAnulado.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>

        <div class="footer">
          Documento inalterable generado para auditoría contable. Registrado en el sistema de Carmo Dental.
        </div>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 300)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 text-xs font-bold rounded-xl border-[#008bcd]/30 bg-[#008bcd]/5 hover:bg-[#008bcd]/15 text-[#008bcd] transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Exportar Backup
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48 bg-card border-border rounded-xl shadow-xl">
        <DropdownMenuItem 
          onClick={handleExportCSV} 
          className="cursor-pointer py-2.5 font-semibold text-xs text-foreground focus:bg-[#008bcd]/10 focus:text-[#008bcd]"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
          Exportar a Excel (.csv)
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleExportPDF} 
          className="cursor-pointer py-2.5 font-semibold text-xs text-foreground focus:bg-[#008bcd]/10 focus:text-[#008bcd]"
        >
          <FileText className="w-4 h-4 mr-2 text-rose-600" />
          Reporte PDF / Imprimir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}