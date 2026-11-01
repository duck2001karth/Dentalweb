"use client"
import React from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { executePrintEngine } from "@/lib/print-engine"
import { escapeHTML } from "@/lib/sanitize"
import { useClinicSettings } from "@/config/clinic-settings"

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase()
  switch (m) {
    case "CASH": case "EFECTIVO": return "Efectivo"
    case "CREDIT_CARD": case "TARJETA_CREDITO": return "Tarjeta de Crédito"
    case "DEBIT_CARD": case "TARJETA_DEBITO": return "Tarjeta de Débito"
    case "TRANSFER": case "TRANSFERENCIA": case "DEUNA": return "Transferencia"
    case "CHECK": case "CHEQUE": return "Cheque"
    default: return method
  }
}

const extractDeletedBy = (item: any): string => {
  if (item.notes && typeof item.notes === "string") {
    const match = item.notes.match(/por\s+([^\]]+?)\s+el\s+\d{4}-\d{2}-\d{2}/i) || item.notes.match(/por\s+([^\]]+)\]/i)
    if (match && match[1]) return match[1].trim()
  }
  return item.processedBy?.name || item.user?.name || "Administrador"
}

const parseAuditDetails = (rawNotes?: string) => {
  if (!rawNotes || typeof rawNotes !== "string") {
    return { reason: "Sin justificación registrada", originalDetail: "" }
  }
  const cleanReason = rawNotes.replace(/^\[PAGO ELIMINADO\/ANULADO[^\]]*\]:\s*/, "").split(" | Registro original:")[0].split(" | Historial previo:")[0].trim()
  let originalDetail = ""
  if (rawNotes.includes(" | Registro original:")) {
    const rawOriginal = rawNotes.split(" | Registro original:")[1]?.trim()
    if (rawOriginal) {
      if (rawOriginal.startsWith("[") && rawOriginal.endsWith("]")) {
        try {
          const parsed = JSON.parse(rawOriginal)
          if (Array.isArray(parsed)) {
            originalDetail = parsed.map((it: any) => {
              const proc = it.procedureName || "Procedimiento"
              const tooth = it.tooth && it.tooth !== "General" ? ` (Pieza: ${it.tooth})` : ""
              const amt = it.appliedAmount ? ` — $${Number(it.appliedAmount).toFixed(2)}` : ""
              return `${proc}${tooth}${amt}`
            }).join("; ")
          }
        } catch {
          originalDetail = rawOriginal
        }
      } else {
        originalDetail = rawOriginal.replace(/^\[.*?\]:\s*/, "")
      }
    }
  }
  return { reason: cleanReason || "Sin justificación", originalDetail }
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
  const { settings } = useClinicSettings()

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast({ title: "Sin registros", description: "No existen pagos anulados.", variant: "info" })
      return
    }
    const headers = [ "No. Pago", "Medio de Pago", "No. Documento Fiscal", "Fecha Anulacion", "Anulado Por", "Motivo de Anulacion", "Detalle Original", "Monto Anulado" ]
    const rows = data.map((item) => {
      const paymentNum = item.paymentNumber || item.receiptNumber || item.number || `#REC-${item.id?.slice(-6)}`
      const methodStr = formatPaymentMethod(item.method || item.paymentMethod)
      const docStr = item.invoiceNumber || item.taxDocuments?.[0]?.secuencial || "-"
      const deletedDate = format(new Date(item.updatedAt || item.createdAt || new Date()), "dd/MM/yyyy HH:mm", { locale: es })
      const deletedBy = extractDeletedBy(item)
      const { reason, originalDetail } = parseAuditDetails(item.notes)
      const rawAmount = Math.abs(Number(item.amount || item.paidAmount || 0)).toFixed(2)
      return [ `"${paymentNum}"`, `"${methodStr}"`, `"${docStr}"`, `"${deletedDate}"`, `"${deletedBy}"`, `"${reason.replace(/"/g, '""')}"`, `"${originalDetail.replace(/"/g, '""')}"`, `"${rawAmount}"` ].join(",")
    })
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Auditoria_Anulados_${patientFullName.replace(/\s+/g, '_')}_${format(new Date(), "ddMMyyyy")}.csv`)
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (!data || data.length === 0) {
      toast({ title: "Sin registros", description: "No existen pagos anulados.", variant: "info" })
      return
    }

    const totalAnulado = data.reduce((acc, item) => acc + Math.abs(Number(item.amount || item.paidAmount || 0)), 0)

    const customPatientCard = `
      <style>
        .custom-card { display: grid; grid-template-columns: 1.2fr 1fr; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 20px; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; }
        .custom-col { padding: 10px 14px; }
        .custom-col:first-child { border-right: 1px solid #e2e8f0; }
        .c-label { font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
        .c-title { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px; }
        .c-sub { font-size: 10.5px; color: #475569; margin-top: 3px; }
      </style>
      <div class="custom-card">
        <div class="custom-col">
          <div class="c-label">Datos del Paciente</div>
          <div class="c-title">${escapeHTML(patientFullName)}</div>
          <div class="c-sub"><b>Identificación:</b> ${escapeHTML(patientDocId)} &nbsp; &nbsp; <b>Edad:</b> ${patientAge !== "--" ? `${escapeHTML(String(patientAge))} Años` : "--"}</div>
        </div>
        <div class="custom-col">
          <div class="c-label">Control de Auditoría</div>
          <div class="c-title">Caja / Finanzas</div>
          <div class="c-sub"><b>Generado por:</b> ${escapeHTML(issuedBy)} &nbsp; &nbsp; <b>Registros:</b> ${data.length}</div>
        </div>
      </div>
    `

    const tableRows = data.map((item) => {
      const paymentNum = item.paymentNumber || item.receiptNumber || item.number || `#REC-${item.id?.slice(-6)}`
      const methodStr = formatPaymentMethod(item.method || item.paymentMethod)
      const deletedDate = format(new Date(item.updatedAt || item.createdAt || new Date()), "dd/MM/yyyy HH:mm", { locale: es })
      const deletedBy = extractDeletedBy(item)
      const { reason, originalDetail } = parseAuditDetails(item.notes)
      const rawAmount = Math.abs(Number(item.amount || item.paidAmount || 0)).toFixed(2)
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 8px; font-weight: 800; color: #008bcd;">${escapeHTML(paymentNum)}</td>
          <td style="padding: 10px 8px; font-size: 10px; color: #475569;">${escapeHTML(methodStr)}</td>
          <td style="padding: 10px 8px; font-size: 10px; font-family: monospace;">${deletedDate}</td>
          <td style="padding: 10px 8px; font-weight: 700; color: #0f172a;">${escapeHTML(deletedBy)}</td>
          <td style="padding: 10px 8px;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${escapeHTML(reason)}</div>
            ${originalDetail ? `<div style="font-size: 9px; color: #64748b;"><b>Origen:</b> ${escapeHTML(originalDetail)}</div>` : ""}
          </td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 800; color: #e11d48;">$${rawAmount}</td>
        </tr>
      `
    }).join("")

    const bodyHtml = `
      ${customPatientCard}
      <div style="font-size: 11px; font-weight: 900; color: #008bcd; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1.5px solid #008bcd; padding-bottom: 4px;">
        Detalle de Pagos Anulados
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10.5px;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; font-size: 9px; font-weight: 800; color: #334155;">
            <th style="padding: 8px;"># Documento</th>
            <th style="padding: 8px;">Medio Pago</th>
            <th style="padding: 8px;">Fecha Anulación</th>
            <th style="padding: 8px;">Anulado Por</th>
            <th style="padding: 8px;">Motivo / Detalle</th>
            <th style="padding: 8px; text-align: right;">Monto</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="margin-top: 15px; text-align: right; font-size: 13px; font-weight: 800; color: #0f172a;">
        Total Monto Anulado: <span style="color: #e11d48;">$${totalAnulado.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
      </div>
    `

    const footerHtml = `
      <div style="margin-top: 40px; border-top: 1px solid #008bcd; padding-top: 12px; text-align: center; font-size: 8px; color: #94a3b8; text-transform: uppercase;">
        Documento inalterable emitido para fines de control y auditoría contable interna. Sistema Carmo Dental.
      </div>
    `

    executePrintEngine({
      title: "Auditoría de Pagos Anulados",
      documentTypeBadge: "CONTROL INTERNO",
      patient: undefined,
      settings,
      bodyHtml,
      footerHtml,
      showSignature: false,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 text-xs font-bold rounded-xl border-border bg-card text-foreground/80 hover:text-foreground hover:bg-muted/80 hover:border-border transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
          <Download className="w-4 h-4 text-muted-foreground" />
          Exportar Backup
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border-border rounded-xl shadow-xl">
        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer py-2.5 font-semibold text-xs text-foreground focus:bg-[#008bcd]/10 focus:text-[#008bcd]">
          <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" /> Exportar a Excel (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer py-2.5 font-semibold text-xs text-foreground focus:bg-[#008bcd]/10 focus:text-[#008bcd]">
          <FileText className="w-4 h-4 mr-2 text-rose-600" /> Reporte PDF / Imprimir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}