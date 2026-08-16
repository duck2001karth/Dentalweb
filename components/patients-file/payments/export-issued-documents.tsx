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

const formatSriStatus = (status?: string, isAuthorized?: boolean) => {
  if (isAuthorized) return "AUTORIZADO"
  if (!status) return "PENDIENTE"
  
  const s = status.toUpperCase()
  switch (s) {
    case "AUTHORIZED": case "AUTORIZADO": return "AUTORIZADO"
    case "VOIDED": case "CANCELLED": case "CANCELED": case "ANULADO": return "ANULADO"
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
  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast({
        title: "Sin comprobantes",
        description: "No existen documentos tributarios emitidos para generar el archivo Excel.",
        variant: "info"
      })
      return
    }

    const headers = [
      "No. Factura / Comprobante", "Tipo Documento", "Receptor", 
      "RUC/CI Receptor", "Clave de Acceso SRI", "Fecha Emision", 
      "Estado SRI", "Total Factura"
    ]

    const rows = data.map((item) => {
      const docNum = item.invoiceNumber || item.number || item.secuencial || "-"
      const docType = item.documentType || "FACTURA ELECTRÓNICA (01)"
      const receptorName = item.receptorName || (item.patient?.firstName ? `${item.patient?.firstName} ${item.patient?.lastName || ''}`.trim() : patientFullName)
      const receptorId = item.receptorId || item.patient?.ci || patientDocId
      const authKey = item.accessKey || item.authorizationNumber || "Sin clave registrada"
      const emissionDate = format(new Date(item.emissionDate || item.createdAt || new Date()), "dd/MM/yyyy HH:mm", { locale: es })
      const statusSri = formatSriStatus(item.status, item.isAuthorized)
      const totalAmount = Math.abs(Number(item.totalAmount || item.amount || item.total || 0)).toFixed(2)

      return [
        `"${docNum}"`, `"${docType}"`, `"${receptorName}"`, 
        `"${receptorId}"`, `"${authKey}"`, `"${emissionDate}"`, 
        `"${statusSri}"`, `"${totalAmount}"`
      ].join(",")
    })

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Comprobantes_SRI_${patientFullName.replace(/\s+/g, '_')}_${format(new Date(), "ddMMyyyy")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const handleExportPDF = () => {
    if (!data || data.length === 0) {
      toast({
        title: "Sin comprobantes",
        description: "No existen documentos tributarios emitidos para generar el reporte PDF.",
        variant: "info"
      })
      return
    }

    const printWindow = window.open("", "_blank", "width=1000,height=800")
    if (!printWindow) return

    const totalFacturado = data.reduce((acc, item) => acc + Math.abs(Number(item.totalAmount || item.amount || item.total || 0)), 0)

    const tableRows = data.map((item) => {
      const docNum = item.invoiceNumber || item.number || item.secuencial || "-"
      const docType = item.documentType || "Factura Electrónica"
      const authKey = item.accessKey || item.authorizationNumber || "Sin clave registrada"
      const emissionDate = format(new Date(item.emissionDate || item.createdAt || new Date()), "dd/MM/yyyy HH:mm", { locale: es })
      
      const statusSri = formatSriStatus(item.status, item.isAuthorized)
      const isAuthorized = statusSri === "AUTORIZADO"
      const isAnulado = statusSri === "ANULADO"
      const totalAmount = Math.abs(Number(item.totalAmount || item.amount || item.total || 0)).toFixed(2)

      const statusColor = isAuthorized ? "#059669" : isAnulado ? "#e11d48" : "#d97706"

      return `
        <tr>
          <td><strong style="color: #008bcd;">${docNum}</strong><br><small style="color: #64748b;">${docType}</small></td>
          <td style="font-size: 10px; color: #475569; font-family: monospace;">${authKey}</td>
          <td>${emissionDate}</td>
          <td><span style="font-weight: bold; color: ${statusColor};">${statusSri}</span></td>
          <td style="text-align: right; font-weight: 800; font-size: 12px;">$${totalAmount}</td>
        </tr>
      `
    }).join("")

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Comprobantes Electrónicos SRI - ${patientFullName}</title>
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
              <div class="subtitle">Reporte de Facturación Electrónica y Documentos Tributarios (SRI)</div>
            </td>
            <td style="text-align: right; font-size: 11px; color: #64748b;">
              Fecha de Emisión: <b>${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</b>
            </td>
          </tr>
        </table>
        
        <div class="info-box">
          <div class="info-col">
            <p><strong>Paciente / Receptor:</strong> ${patientFullName}</p>
            <p><strong>RUC / Cédula:</strong> ${patientDocId}</p>
            <p><strong>Edad:</strong> ${patientAge !== "--" ? `${patientAge} Años` : "--"}</p>
          </div>
          <div class="info-col" style="text-align: right;">
            <p><strong>Generado por:</strong> ${issuedBy}</p>
            <p><strong>Total Documentos:</strong> ${data.length} emitidos</p>
            <p><strong>Ambiente:</strong> Producción SRI</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tipo & N° Factura</th>
              <th>Autorización SRI / Clave</th>
              <th>Fecha Emisión</th>
              <th>Estado SRI</th>
              <th style="text-align: right;">Total Factura</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="total-box">
          Monto Total Consolidado: <span style="color: #008bcd;">$${totalFacturado.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>

        <div class="footer">
          Registro oficial sincronizado con los Servicios Tributarios del SRI. Carmo Dental.
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
          Exportar Comprobantes
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-52 bg-card border-border rounded-xl shadow-xl">
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