
"use client"

import { format, isValid } from "date-fns"
import { executePrintEngine, type PrintEngineOptions } from "@/lib/print-engine"
import { escapeHTML } from "@/lib/sanitize"

export interface ArqueoPayment {
  id?: string
  createdAt: string | Date
  receiptNumber?: string | null
  method: string
  amount: number | string
  status?: string
  reference?: string | null
  patient?: {
    firstName?: string | null
    lastName?: string | null
    ci?: string | null
  } | null
}

interface PrintArqueoOptions {
  payments: ArqueoPayment[]
  dateFilter: string
  cashierName?: string
  settings?: PrintEngineOptions["settings"]
}

const safe = (value: unknown) => escapeHTML(String(value ?? ""))
const amount = (value: number | string) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function printArqueoReport({
  payments = [],
  dateFilter,
  cashierName = "Cajero de Turno",
  settings,
}: PrintArqueoOptions): void {
  const currencySymbol = safe(
    settings?.currency === "USD" ? "$" : settings?.currency || "$"
  )

  const sum = (method: string) =>
    payments.filter(p => p.method === method)
      .reduce((total, p) => total + amount(p.amount), 0)

  const totalEfectivo = sum("CASH")
  const totalTransferencias = sum("TRANSFER")
  const totalCredito = sum("CREDIT_CARD")
  const totalDebito = sum("DEBIT_CARD")
  const totalGeneral = totalEfectivo + totalTransferencias + totalCredito + totalDebito

  const getFiltroLabel = () => {
    switch (dateFilter) {
      case "TODAY": return "Solo Hoy"
      case "YESTERDAY": return "Ayer"
      case "THIS_WEEK": return "Esta Semana"
      case "THIS_MONTH": return "Este Mes"
      default: return "Historial Completo"
    }
  }

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "CASH": return "Efectivo"
      case "TRANSFER": return "Transferencia"
      case "CREDIT_CARD": return "T. Crédito"
      case "DEBIT_CARD": return "T. Débito"
      default: return method
    }
  }

  const kpiHtml = `
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:24px">
      ${[
        ["Total Recaudado", totalGeneral, `${payments.length} transacción(es)`, "2px solid #0f172a"],
        ["Efectivo Físico", totalEfectivo, "Gaveta monetaria", "1px solid #cbd5e1"],
        ["Transferencias", totalTransferencias, "Bancos / QR", "1px solid #cbd5e1"],
        ["T. Débito", totalDebito, "Vouchers POS", "1px solid #cbd5e1"],
        ["T. Crédito", totalCredito, "Corriente / Diferido", "1px solid #cbd5e1"],
      ].map(([label, value, detail, border], i) => `
        <div style="border:${border};border-radius:8px;padding:10px;background:${i === 0 ? "#f8fafc" : "#fff"}">
          <p style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase">${safe(label)}</p>
          <p style="font-size:${i === 0 ? 18 : 16}px;font-weight:900;color:#0f172a">${currencySymbol}${Number(value).toFixed(2)}</p>
          <p style="font-size:8px;color:#64748b">${safe(detail)}</p>
        </div>
      `).join("")}
    </div>
  `

  const tableRows = payments.length === 0
    ? `<tr><td colspan="6" style="padding:32px;text-align:center;color:#94a3b8;font-size:12px;font-style:italic">No existen cobros registrados en este período.</td></tr>`
    : payments.map(p => {
        const date = new Date(p.createdAt)
        const dateStr = isValid(date)
          ? format(date, dateFilter === "TODAY" || dateFilter === "YESTERDAY" ? "HH:mm" : "dd/MM HH:mm")
          : "--"
        const receiptStr = p.receiptNumber || `REC-${String(p.id ?? "").slice(-5).toUpperCase()}`
        const patientStr = `${p.patient?.firstName || ""} ${p.patient?.lastName || ""}`.trim()
        return `
          <tr style="border-bottom:1px solid #e2e8f0;page-break-inside:avoid;break-inside:avoid">
            <td style="padding:8px;font-size:10px;color:#475569;font-family:monospace">${safe(dateStr)}</td>
            <td style="padding:8px;font-size:10px;font-weight:700;color:#0f172a;font-family:monospace">${safe(receiptStr)}</td>
            <td style="padding:8px;font-size:11px">
              <div style="font-weight:700;color:#0f172a">${safe(patientStr)}</div>
              <div style="font-size:9px;color:#64748b;font-family:monospace">CI: ${safe(p.patient?.ci || "S/N")}</div>
            </td>
            <td style="padding:8px;font-size:10px;font-weight:700;color:#334155">${safe(getMethodBadge(p.method))}</td>
            <td style="padding:8px;font-size:10px;color:#64748b;font-family:monospace">${p.reference ? safe(p.reference) : "<i>N/A</i>"}</td>
            <td style="padding:8px;text-align:right;font-size:11px;font-weight:900;color:#0f172a;font-family:monospace">${currencySymbol}${amount(p.amount).toFixed(2)}</td>
          </tr>
        `
      }).join("")

  const bodyHtml = `
    <div style="margin-bottom:20px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
      <span style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase">Período Auditado:</span>
      <span style="font-size:13px;font-weight:900;color:#008bcd;margin-left:8px">${safe(getFiltroLabel())}</span>
    </div>
    ${kpiHtml}
    <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #cbd5e1;padding-bottom:6px;margin-bottom:12px">
      <h3 style="font-size:11px;font-weight:900;color:#0f172a;text-transform:uppercase;letter-spacing:.5px">Registro Detallado de Transacciones</h3>
      <span style="font-size:9px;color:#64748b">Valores en moneda local</span>
    </div>
    <table style="width:100%;border-collapse:collapse;text-align:left">
      <thead>
        <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1;font-size:9px;font-weight:900;color:#334155;text-transform:uppercase">
          <th style="padding:8px;width:60px">Fecha/Hora</th>
          <th style="padding:8px;width:90px">Nº Recibo</th>
          <th style="padding:8px">Paciente Titular</th>
          <th style="padding:8px;width:90px">Método</th>
          <th style="padding:8px">Referencia / POS</th>
          <th style="padding:8px;text-align:right;width:80px">Monto</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
      ${payments.length > 0 ? `
        <tfoot>
          <tr style="border-top:2px solid #0f172a;background:#f8fafc">
            <td colspan="5" style="padding:10px 8px;text-align:right;font-size:11px;font-weight:900;color:#334155;text-transform:uppercase">Total Liquidado:</td>
            <td style="padding:10px 8px;text-align:right;font-size:14px;font-weight:900;color:#0f172a;font-family:monospace">${currencySymbol}${totalGeneral.toFixed(2)}</td>
          </tr>
        </tfoot>
      ` : ""}
    </table>
  `

  const footerHtml = `
    <div style="margin-top:40px;padding-top:20px;page-break-inside:avoid;break-inside:avoid">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:60px;text-align:center;margin-bottom:15px">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end">
          <div style="width:80%;border-top:1.5px solid #0f172a;padding-top:5px">
            <div style="font-size:11px;font-weight:800;color:#0f172a">${safe(cashierName)}</div>
            <div style="font-size:8.5px;color:#64748b;margin-top:1px;text-transform:uppercase">Entregué Conforme (Cajero/a)</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end">
          <div style="width:80%;border-top:1.5px solid #0f172a;padding-top:5px">
            <div style="font-size:11px;font-weight:800;color:#0f172a">Administración / Auditoría</div>
            <div style="font-size:8.5px;color:#64748b;margin-top:1px;text-transform:uppercase">Recibí Conforme (Caja Central)</div>
          </div>
        </div>
      </div>
    </div>
  `

  executePrintEngine({
    title: "Arqueo de Turno / Caja",
    documentTypeBadge: "CONTROL FINANCIERO",
    patient: undefined,
    settings,
    bodyHtml,
    footerHtml,
    showSignature: false,
  })
}
