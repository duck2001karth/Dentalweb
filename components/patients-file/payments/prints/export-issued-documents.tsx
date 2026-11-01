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

const formatSriStatus = (status?: string, isAuthorized?: boolean) => {
  if (isAuthorized) return "AUTORIZADO"
  if (!status) return "PENDIENTE"
  const s = status.toUpperCase()
  switch (s) {
    case "AUTHORIZED": case "AUTORIZADO": return "AUTORIZADO"
    case "VOIDED": case "CANCELLED": case "ANULADO": return "ANULADO"
    case "REJECTED": case "DEVUELTA": case "RECHAZADO": return "RECHAZADO"
    case "PENDING": case "PENDIENTE": case "EN PROCESO": return "PENDIENTE"
    default: return s
  }
}

interface ExportIssuedDocsProps {
  data: any[]
  patientFullName?: string
  patientDocId?: string
  patientAge?: string | number
  issuedBy?: string
}

export function ExportIssuedDocuments({ 
  data = [], 
  patientFullName = "Paciente Registrado",
  patientDocId = "No registrado",
  patientAge = "--",
  issuedBy = "Administrador"
}: ExportIssuedDocsProps) {
  const { toast } = useToast()
  const { settings } = useClinicSettings()

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast({ title: "Sin comprobantes", description: "No existen documentos emitidos.", variant: "info" })
      return
    }
    const headers = [ "No. Factura / Comprobante", "Tipo Documento", "Receptor", "RUC/CI Receptor", "Clave de Acceso SRI", "Fecha Emision", "Estado SRI", "Total Factura" ]
    const rows = data.map((item) => {
      const docNum = item.invoiceNumber || item.number || item.secuencial || "-"
      const docType = item.documentType || "FACTURA ELECTRÓNICA (01)"
      const receptorName = item.receptorName || (item.patient?.firstName ? `${item.patient?.firstName} ${item.patient?.lastName || ''}`.trim() : patientFullName)
      const receptorId = item.receptorId || item.patient?.ci || patientDocId
      const authKey = item.accessKey || item.authorizationNumber || "Sin clave registrada"
      const emissionDate = format(new Date(item.emissionDate || item.createdAt || new Date()), "dd/MM/yyyy HH:mm", { locale: es })
      const statusSri = formatSriStatus(item.status, item.isAuthorized)
      const totalAmount = Math.abs(Number(item.totalAmount || item.amount || item.total || 0)).toFixed(2)
      return [ `"${docNum}"`, `"${docType}"`, `"${receptorName}"`, `"${receptorId}"`, `"${authKey}"`, `"${emissionDate}"`, `"${statusSri}"`, `"${totalAmount}"` ].join(",")
    })
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Comprobantes_SRI_${patientFullName.replace(/\s+/g, '_')}_${format(new Date(), "ddMMyyyy")}.csv`)
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    if (!data || data.length === 0) {
      toast({ title: "Sin comprobantes", description: "No existen documentos emitidos.", variant: "info" })
      return
    }

    const totalFacturado = data.reduce((acc, item) => acc + Math.abs(Number(item.totalAmount || item.amount || item.total || 0)), 0)

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
          <div class="c-label">Paciente / Receptor</div>
          <div class="c-title">${escapeHTML(patientFullName)}</div>
          <div class="c-sub"><b>RUC / Cédula:</b> ${escapeHTML(patientDocId)} &nbsp; &nbsp; <b>Edad:</b> ${patientAge !== "--" ? `${escapeHTML(String(patientAge))} Años` : "--"}</div>
        </div>
        <div class="custom-col">
          <div class="c-label">Detalles de Reporte</div>
          <div class="c-title">Documentos Tributarios SRI</div>
          <div class="c-sub"><b>Generado por:</b> ${escapeHTML(issuedBy)} &nbsp; &nbsp; <b>Registros:</b> ${data.length}</div>
        </div>
      </div>
    `

    const tableRows = data.map((item) => {
      const docNum = item.invoiceNumber || item.number || item.secuencial || "-"
      const docType = item.documentType || "Factura Electrónica"
      const authKey = item.accessKey || item.authorizationNumber || "Sin clave"
      const emissionDate = format(new Date(item.emissionDate || item.createdAt || new Date()), "dd/MM/yyyy HH:mm", { locale: es })
      const statusSri = formatSriStatus(item.status, item.isAuthorized)
      const isAuthorized = statusSri === "AUTORIZADO"
      const isAnulado = statusSri === "ANULADO"
      const totalAmount = Math.abs(Number(item.totalAmount || item.amount || item.total || 0)).toFixed(2)
      const statusColor = isAuthorized ? "#059669" : isAnulado ? "#e11d48" : "#d97706"
      
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 8px;">
            <strong style="color: #008bcd;">${escapeHTML(docNum)}</strong><br/>
            <small style="color: #64748b; font-size: 9px;">${escapeHTML(docType)}</small>
          </td>
          <td style="padding: 10px 8px; font-size: 9.5px; color: #475569; font-family: monospace;">${escapeHTML(authKey)}</td>
          <td style="padding: 10px 8px; font-size: 10px;">${emissionDate}</td>
          <td style="padding: 10px 8px; font-size: 10px; font-weight: 800; color: ${statusColor};">${statusSri}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 800; font-size: 12px;">$${totalAmount}</td>
        </tr>
      `
    }).join("")

    const bodyHtml = `
      ${customPatientCard}
      <div style="font-size: 11px; font-weight: 900; color: #008bcd; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1.5px solid #008bcd; padding-bottom: 4px;">
        Desglose de Comprobantes Electrónicos
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 10.5px;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; font-size: 9px; font-weight: 800; color: #334155;">
            <th style="padding: 8px;">Tipo & Nº Factura</th>
            <th style="padding: 8px;">Autorización SRI / Clave</th>
            <th style="padding: 8px;">Fecha Emisión</th>
            <th style="padding: 8px;">Estado SRI</th>
            <th style="padding: 8px; text-align: right;">Total Factura</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="margin-top: 15px; text-align: right; font-size: 13px; font-weight: 800; color: #0f172a;">
        Monto Total Consolidado: <span style="color: #008bcd;">$${totalFacturado.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
      </div>
    `

    const footerHtml = `
      <div style="margin-top: 40px; border-top: 1px solid #008bcd; padding-top: 12px; text-align: center; font-size: 8px; color: #94a3b8; text-transform: uppercase;">
        Registro oficial sincronizado con los Servicios Tributarios del SRI. Documento de control interno.
      </div>
    `

    executePrintEngine({
      title: "Reporte de Facturación SRI",
      documentTypeBadge: "REPORTE TRIBUTARIO",
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
          Exportar Comprobantes
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-card border-border rounded-xl shadow-xl">
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