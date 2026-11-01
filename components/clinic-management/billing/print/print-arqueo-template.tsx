"use client"

import React, { useEffect } from "react"
import { format } from "date-fns"
import { useClinicSettings } from "@/config/clinic-settings"
import { executePrintEngine } from "@/lib/print-engine"
import { escapeHTML } from "@/lib/sanitize"

interface PrintArqueoTemplateProps {
  payments: any[]
  dateFilter: string
  cashierName?: string
}

export function PrintArqueoTemplate({
  payments = [],
  dateFilter,
  cashierName = "Cajero de Turno"
}: PrintArqueoTemplateProps) {
  const { settings } = useClinicSettings()

  const currencySymbol = settings?.currency === "USD" ? "$" : (settings?.currency || "$")

  useEffect(() => {
    const totalEfectivo = payments.filter(p => p.method === "CASH").reduce((a, b) => a + Number(b.amount || 0), 0)
    const totalTransferencias = payments.filter(p => p.method === "TRANSFER").reduce((a, b) => a + Number(b.amount || 0), 0)
    const totalCredito = payments.filter(p => p.method === "CREDIT_CARD").reduce((a, b) => a + Number(b.amount || 0), 0)
    const totalDebito = payments.filter(p => p.method === "DEBIT_CARD").reduce((a, b) => a + Number(b.amount || 0), 0)
    const totalTarjetas = totalCredito + totalDebito
    const totalGeneral = totalEfectivo + totalTransferencias + totalTarjetas

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
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 24px;">
        <div style="border: 2px solid #0f172a; border-radius: 8px; padding: 10px; background: #f8fafc;">
          <p style="font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase;">Total Recaudado</p>
          <p style="font-size: 18px; font-weight: 900; color: #0f172a;">${currencySymbol}${totalGeneral.toFixed(2)}</p>
          <p style="font-size: 8px; color: #64748b;">${payments.length} transacción(es)</p>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #ffffff;">
          <p style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">Efectivo Físico</p>
          <p style="font-size: 16px; font-weight: 900; color: #1e293b;">${currencySymbol}${totalEfectivo.toFixed(2)}</p>
          <p style="font-size: 8px; color: #64748b;">Gaveta monetaria</p>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #ffffff;">
          <p style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">Transferencias</p>
          <p style="font-size: 16px; font-weight: 900; color: #1e293b;">${currencySymbol}${totalTransferencias.toFixed(2)}</p>
          <p style="font-size: 8px; color: #64748b;">Bancos / QR</p>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #ffffff;">
          <p style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">T. Débito</p>
          <p style="font-size: 16px; font-weight: 900; color: #1e293b;">${currencySymbol}${totalDebito.toFixed(2)}</p>
          <p style="font-size: 8px; color: #64748b;">Vouchers POS</p>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #ffffff;">
          <p style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">T. Crédito</p>
          <p style="font-size: 16px; font-weight: 900; color: #1e293b;">${currencySymbol}${totalCredito.toFixed(2)}</p>
          <p style="font-size: 8px; color: #64748b;">Corriente / Diferido</p>
        </div>
      </div>
    `

    const tableRows = payments.length === 0
      ? `<tr><td colspan="6" style="padding: 32px; text-align: center; color: #94a3b8; font-size: 12px; font-style: italic;">No existen cobros registrados en este período.</td></tr>`
      : payments.map(p => {
          const dateStr = (dateFilter === "TODAY" || dateFilter === "YESTERDAY") ? format(new Date(p.createdAt), "HH:mm") : format(new Date(p.createdAt), "dd/MM HH:mm")
          const receiptStr = p.receiptNumber || `REC-${String(p.id).slice(-5).toUpperCase()}`
          const patientStr = `${p.patient?.firstName || ''} ${p.patient?.lastName || ''}`.trim()
          return `
            <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; break-inside: avoid;">
              <td style="padding: 8px; font-size: 10px; color: #475569; font-family: monospace;">${dateStr}</td>
              <td style="padding: 8px; font-size: 10px; font-weight: 700; color: #0f172a; font-family: monospace;">${receiptStr}</td>
              <td style="padding: 8px; font-size: 11px;">
                <div style="font-weight: 700; color: #0f172a;">${escapeHTML(patientStr)}</div>
                <div style="font-size: 9px; color: #64748b; font-family: monospace;">CI: ${p.patient?.ci || "S/N"}</div>
              </td>
              <td style="padding: 8px; font-size: 10px; font-weight: 700; color: #334155;">${getMethodBadge(p.method)}</td>
              <td style="padding: 8px; font-size: 10px; color: #64748b; font-family: monospace;">${p.reference ? escapeHTML(p.reference) : '<i>N/A</i>'}</td>
              <td style="padding: 8px; text-align: right; font-size: 11px; font-weight: 900; color: #0f172a; font-family: monospace;">${currencySymbol}${Number(p.amount).toFixed(2)}</td>
            </tr>
          `
        }).join("")

    const bodyHtml = `
      <div style="margin-bottom: 20px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Período Auditado:</span>
        <span style="font-size: 13px; font-weight: 900; color: #008bcd; margin-left: 8px;">${getFiltroLabel()}</span>
      </div>
      
      ${kpiHtml}
      
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px;">
        <h3 style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Registro Detallado de Transacciones</h3>
        <span style="font-size: 9px; color: #64748b;">Valores en moneda local</span>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 9px; font-weight: 900; color: #334155; text-transform: uppercase;">
            <th style="padding: 8px; width: 60px;">Fecha/Hora</th>
            <th style="padding: 8px; width: 90px;">Nº Recibo</th>
            <th style="padding: 8px;">Paciente Titular</th>
            <th style="padding: 8px; width: 90px;">Método</th>
            <th style="padding: 8px;">Referencia / POS</th>
            <th style="padding: 8px; text-align: right; width: 80px;">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        ${payments.length > 0 ? `
          <tfoot>
            <tr style="border-top: 2px solid #0f172a; background: #f8fafc;">
              <td colspan="5" style="padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 900; color: #334155; text-transform: uppercase;">Total Liquidado:</td>
              <td style="padding: 10px 8px; text-align: right; font-size: 14px; font-weight: 900; color: #0f172a; font-family: monospace;">${currencySymbol}${totalGeneral.toFixed(2)}</td>
            </tr>
          </tfoot>
        ` : ""}
      </table>
    `

    const footerHtml = `
      <div style="margin-top: 40px; padding-top: 20px; page-break-inside: avoid; break-inside: avoid;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; text-align: center; margin-bottom: 15px;">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
            <div style="width: 80%; border-top: 1.5px solid #0f172a; padding-top: 5px;">
              <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${escapeHTML(cashierName)}</div>
              <div style="font-size: 8.5px; color: #64748b; margin-top: 1px; text-transform: uppercase;">Entregué Conforme (Cajero/a)</div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
            <div style="width: 80%; border-top: 1.5px solid #0f172a; padding-top: 5px;">
              <div style="font-size: 11px; font-weight: 800; color: #0f172a;">Administración / Auditoría</div>
              <div style="font-size: 8.5px; color: #64748b; margin-top: 1px; text-transform: uppercase;">Recibí Conforme (Caja Central)</div>
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
  }, [payments, dateFilter, cashierName, settings, currencySymbol])

  return null
}