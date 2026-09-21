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
import { useToast } from "@/hooks/use-toast"

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase()
  switch (m) {
    case "CASH": case "EFECTIVO": return "Efectivo"
    case "CREDIT_CARD": case "TARJETA_CREDITO": return "Tarjeta de Crédito"
    case "DEBIT_CARD": case "TARJETA_DEBITO": return "Tarjeta de Débito"
    case "TRANSFER": case "TRANSFERENCIA": case "DEUNA": return "Transferencia Bancaria"
    case "CHECK": case "CHEQUE": return "Cheque"
    default: return method
  }
}

// Extrae con precisión el nombre del usuario sin arrastrar la fecha ISO
const extractDeletedBy = (item: any): string => {
  if (item.notes && typeof item.notes === "string") {
    const match = item.notes.match(/por\s+([^\]]+?)\s+el\s+\d{4}-\d{2}-\d{2}/i) || item.notes.match(/por\s+([^\]]+)\]/i)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return item.processedBy?.name || item.user?.name || "Administrador"
}

// Limpia el motivo y traduce el JSON técnico del snapshot original a texto legible
const parseAuditDetails = (rawNotes?: string) => {
  if (!rawNotes || typeof rawNotes !== "string") {
    return { reason: "Sin justificación registrada", originalDetail: "" }
  }

  // 1. Extraer el motivo principal ingresado por caja
  const cleanReason = rawNotes
    .replace(/^\[PAGO ELIMINADO\/ANULADO[^\]]*\]:\s*/, "")
    .split(" | Registro original:")[0]
    .split(" | Historial previo:")[0]
    .trim()

  // 2. Extraer y formatear el registro original
  let originalDetail = ""
  if (rawNotes.includes(" | Registro original:")) {
    const rawOriginal = rawNotes.split(" | Registro original:")[1]?.trim()
    if (rawOriginal) {
      if (rawOriginal.startsWith("[") && rawOriginal.endsWith("]")) {
        try {
          const parsed = JSON.parse(rawOriginal)
          if (Array.isArray(parsed)) {
            originalDetail = parsed
              .map((it: any) => {
                const proc = it.procedureName || "Procedimiento"
                const tooth = it.tooth && it.tooth !== "General" ? ` (Pieza: ${it.tooth})` : ""
                const amt = it.appliedAmount ? ` — $${Number(it.appliedAmount).toFixed(2)}` : ""
                return `${proc}${tooth}${amt}`
              })
              .join("; ")
          }
        } catch {
          originalDetail = rawOriginal
        }
      } else {
        originalDetail = rawOriginal.replace(/^\[.*?\]:\s*/, "")
      }
    }
  }

  return {
    reason: cleanReason || "Sin justificación",
    originalDetail,
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
  data = [], 
  patientFullName = "Paciente Registrado",
  patientDocId = "No registrado",
  patientAge = "--",
  issuedBy = "Administrador"
}: ExportDeletedPaymentsProps) {
  const { toast } = useToast()

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast({
        title: "Sin registros",
        description: "No existen pagos anulados para generar el archivo Excel.",
        variant: "info"
      })
      return
    }

    const headers = [
      "No. Pago", "Medio de Pago", "No. Documento Fiscal", 
      "Fecha Anulacion", "Anulado Por", "Motivo de Anulacion", 
      "Detalle Prestaciones Originales", "Monto Anulado"
    ]

    const rows = data.map((item) => {
      const paymentNum = item.paymentNumber || item.receiptNumber || item.number || `#REC-${item.id?.slice(-6)}`
      const methodStr = formatPaymentMethod(item.method || item.paymentMethod)
      const docStr = item.invoiceNumber || item.taxDocuments?.[0]?.secuencial || "-"
      const deletedDate = format(new Date(item.updatedAt || item.createdAt || new Date()), "dd/MM/yyyy HH:mm", { locale: es })
      const deletedBy = extractDeletedBy(item)
      const { reason, originalDetail } = parseAuditDetails(item.notes)
      const rawAmount = Math.abs(Number(item.amount || item.paidAmount || 0)).toFixed(2)

      return [
        `"${paymentNum}"`, `"${methodStr}"`, `"${docStr}"`, 
        `"${deletedDate}"`, `"${deletedBy}"`, 
        `"${reason.replace(/"/g, '""')}"`, 
        `"${originalDetail.replace(/"/g, '""')}"`, 
        `"${rawAmount}"`
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
    if (!data || data.length === 0) {
      toast({
        title: "Sin registros",
        description: "No existen pagos anulados para generar el reporte PDF.",
        variant: "info"
      })
      return
    }

    const printWindow = window.open("", "_blank", "width=1050,height=850")
    if (!printWindow) return

    const totalAnulado = data.reduce((acc, item) => acc + Math.abs(Number(item.amount || item.paidAmount || 0)), 0)

    const tableRows = data.map((item) => {
      const paymentNum = item.paymentNumber || item.receiptNumber || item.number || `#REC-${item.id?.slice(-6)}`
      const methodStr = formatPaymentMethod(item.method || item.paymentMethod)
      const deletedDate = format(new Date(item.updatedAt || item.createdAt || new Date()), "dd/MM/yyyy HH:mm", { locale: es })
      const deletedBy = extractDeletedBy(item)
      const { reason, originalDetail } = parseAuditDetails(item.notes)
      const rawAmount = Math.abs(Number(item.amount || item.paidAmount || 0)).toFixed(2)

      return `
        <tr>
          <td style="font-weight: 700; color: #008bcd; white-space: nowrap;">${paymentNum}</td>
          <td style="white-space: nowrap;">${methodStr}</td>
          <td style="white-space: nowrap;">${deletedDate}</td>
          <td style="white-space: nowrap;"><b>${deletedBy}</b></td>
          <td>
            <div style="font-weight: 600; color: #0f172a; margin-bottom: 2px;">${reason}</div>
            ${originalDetail ? `<div style="font-size: 9.5px; color: #64748b; line-height: 1.3;"><b>Origen:</b> ${originalDetail}</div>` : ""}
          </td>
          <td style="text-align: right; font-weight: 800; color: #e11d48; white-space: nowrap;">$${rawAmount}</td>
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
          @page { size: letter; margin: 15mm; }
          body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 25px; margin: 0; }
          .header-table { width: 100%; border-bottom: 2px solid #008bcd; padding-bottom: 12px; margin-bottom: 20px; }
          .title { color: #008bcd; font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 3px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 11.5px; }
          .info-col p { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10.5px; }
          th { background-color: #f1f5f9; color: #334155; font-weight: 800; text-transform: uppercase; padding: 9px 8px; border-bottom: 1px solid #cbd5e1; text-align: left; }
          td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .total-box { margin-top: 18px; text-align: right; font-size: 13px; font-weight: 800; }
          .footer { margin-top: 35px; font-size: 9.5px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
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
            <p><strong>Total Registros:</strong> ${data.length}</p>
            <p><strong>Control:</strong> Auditoría Financiera Interna</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th># Documento</th>
              <th>Medio Pago</th>
              <th>Fecha Anulación</th>
              <th>Anulado Por</th>
              <th>Motivo de Anulación / Detalle</th>
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
          Documento inalterable emitido para fines de control y auditoría contable interna. Sistema Carmo Dental.
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
          className="h-10 text-xs font-bold rounded-xl border-border bg-card text-foreground/80 hover:text-foreground hover:bg-muted/80 hover:border-border transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4 text-muted-foreground" />
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