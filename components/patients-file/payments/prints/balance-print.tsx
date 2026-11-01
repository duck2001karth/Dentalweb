"use client"
import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { escapeHTML } from "@/lib/sanitize"
import { executePrintEngine } from "@/lib/print-engine"

interface BalancePrintProps {
  patientFullName: string
  patientDocId: string
  patientAge?: string | number
  totalIncome: number
  totalRefunds: number
  netBalance: number
  pendingDebt: number
  transactions: any[]
  issuedBy?: string
  settings?: any
}

export const triggerBalancePrint = (data: BalancePrintProps) => {
  const {
    patientFullName,
    patientDocId,
    patientAge = "--",
    totalIncome,
    totalRefunds,
    netBalance,
    pendingDebt,
    transactions,
    issuedBy = "Caja / Recaudación",
    settings,
  } = data

  const currencySymbol = "$"
  
  // 1. Tarjeta Personalizada (Diseño 2 Columnas)
  const customPatientCard = `
    <style>
      .custom-card { display: grid; grid-template-columns: 1.2fr 1fr; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 20px; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; }
      .custom-col { padding: 10px 14px; }
      .custom-col:first-child { border-right: 1px solid #e2e8f0; }
      .c-label { font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
      .c-title { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px; }
      .c-sub { font-size: 10.5px; color: #475569; margin-top: 3px; }
      .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
      .kpi-box { border-radius: 8px; padding: 12px 14px; border: 1px solid #e2e8f0; }
      .kpi-label { font-size: 8.5px; font-weight: 800; text-transform: uppercase; line-height: 1.4; color: #475569; }
      .kpi-value { font-size: 16px; font-weight: 900; margin-top: 4px; letter-spacing: -0.5px; }
    </style>
    <div class="custom-card">
      <div class="custom-col">
        <div class="c-label">Datos del Paciente</div>
        <div class="c-title">${escapeHTML(patientFullName)}</div>
        <div class="c-sub">
          <b>Doc. Identidad:</b> ${escapeHTML(patientDocId)} &nbsp; &nbsp; 
          <b>Edad:</b> ${patientAge !== "--" ? `${escapeHTML(String(patientAge))} Años` : "--"}
        </div>
      </div>
      <div class="custom-col">
        <div class="c-label">Detalles de Emisión</div>
        <div class="c-title">${escapeHTML(issuedBy)}</div>
        <div class="c-sub"><b>Tipo:</b> Consolidado de Pagos y Liquidación</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-box" style="border-color: #cbd5e1; background: #f8fafc;">
        <div class="kpi-label">Total Cobrado (+)</div>
        <div class="kpi-value" style="color: #0f172a;">${currencySymbol}${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-box" style="border-color: #fed7aa; background: #fff7ed;">
        <div class="kpi-label" style="color: #c2410c;">Notas de Crédito (-)</div>
        <div class="kpi-value" style="color: #c2410c;">${currencySymbol}${totalRefunds.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-box" style="border-color: #bae6fd; background: #f0f9ff;">
        <div class="kpi-label" style="color: #0284c7;">Balance Neto</div>
        <div class="kpi-value" style="color: #0284c7;">${currencySymbol}${netBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="kpi-box" style="border-color: #bbf7d0; background: #f0fdf4;">
        <div class="kpi-label" style="color: #16a34a;">Estado Contable</div>
        <div class="kpi-value" style="color: #16a34a;">${pendingDebt > 0 ? `${currencySymbol}${pendingDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Al Día"}</div>
      </div>
    </div>
  `

  const rowsHtml = transactions.length === 0
    ? `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px; font-style: italic; font-size: 11px;">Sin registros financieros.</td></tr>`
    : transactions.map((tx: any) => {
        const isIncome = tx.type === "INCOME"
        const txDate = new Date(tx.date)
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 8px; font-size: 10px; color: #64748b;">${format(txDate, "dd/MM/yyyy")}<br/>${format(txDate, "HH:mm")}</td>
            <td style="padding: 10px 8px; font-size: 10.5px; font-weight: 700; color: #0f172a;">${escapeHTML(tx.number)}</td>
            <td style="padding: 10px 8px; font-size: 10.5px; font-weight: 600; color: #334155;">${escapeHTML(tx.description)}</td>
            <td style="padding: 10px 8px; font-size: 10px; color: #64748b;">${escapeHTML(tx.method)}</td>
            <td style="padding: 10px 8px; text-align: center;">
              <span style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: ${isIncome ? '#059669' : '#e11d48'}; background: ${isIncome ? '#d1fae5' : '#ffe4e6'}; padding: 2px 6px; border-radius: 4px;">
                ${isIncome ? 'INGRESO' : 'AJUSTE / NC'}
              </span>
            </td>
            <td style="padding: 10px 8px; text-align: right; font-weight: 800; font-size: 11.5px; color: ${isIncome ? '#0f172a' : '#e11d48'};">
              ${isIncome ? '+' : '-'}${currencySymbol}${Math.abs(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </td>
          </tr>
        `
      }).join("")

  const bodyHtml = `
    ${customPatientCard}
    <div style="font-size: 11px; font-weight: 900; color: #008bcd; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1.5px solid #008bcd; padding-bottom: 4px;">
      Detalle de Movimientos de Caja y Pagos
    </div>
    <table style="width: 100%; border-collapse: collapse; text-align: left;">
      <thead>
        <tr style="border-bottom: 1px solid #cbd5e1; font-size: 9.5px; font-weight: 800; color: #1e293b; text-transform: uppercase;">
          <th style="padding: 8px;">Fecha</th>
          <th style="padding: 8px;"># Comprobante</th>
          <th style="padding: 8px;">Concepto / Procedimiento</th>
          <th style="padding: 8px;">Medio</th>
          <th style="padding: 8px; text-align: center;">Tipo</th>
          <th style="padding: 8px; text-align: right;">Monto</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `

  // Footer con 2 firmas
  const footerHtml = `
    <div style="margin-top: 40px; padding-top: 20px; page-break-inside: avoid; break-inside: avoid;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-bottom: 20px;">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
          <div style="width: 70%; border-top: 1.5px solid #0f172a; padding-top: 5px;">
            <div style="font-size: 10px; font-weight: 800; color: #0f172a;">${escapeHTML(patientFullName)}</div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">Firma del Paciente / Titular</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
          <div style="width: 70%; border-top: 1.5px solid #0f172a; padding-top: 5px;">
            <div style="font-size: 10px; font-weight: 800; color: #0f172a;">${escapeHTML(issuedBy)}</div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">Firma / Sello de Caja y Recaudación</div>
          </div>
        </div>
      </div>
      <div style="width: 100%; border-bottom: 2px solid #008bcd; margin-bottom: 10px;"></div>
      <div style="text-align: center; font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
        Documento emitido electrónicamente como comprobante de balance y conciliación. Válido para control interno.
      </div>
    </div>
  `

  executePrintEngine({
    title: "Estado de Cuenta",
    documentTypeBadge: "BALANCE FINANCIERO",
    patient: undefined, // Apagamos la tarjeta por defecto
    settings,
    bodyHtml,
    footerHtml,
    showSignature: false,
  })
}

// Este componente solo expone la función trigger
export function BalancePrint(_props: BalancePrintProps) {
  return null
}