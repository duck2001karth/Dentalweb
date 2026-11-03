"use client"

import { format } from "date-fns"
import { escapeHTML } from "@/lib/sanitize"
import { executePrintEngine } from "@/lib/print-engine"

interface ReceiptPrintSheetProps {
  receiptNumber: string
  patientName: string
  patientDocumentId?: string
  totalPaid: number
  paymentMethod: string
  items?: any[]
  emissionDate?: Date
  clinic?: any
}

export function generateReceiptHTML({
  receiptNumber,
  patientName,
  patientDocumentId,
  totalPaid,
  paymentMethod,
  items = [],
  emissionDate = new Date(),
  clinic
}: ReceiptPrintSheetProps) {
  
  const safeReceiptNumber = escapeHTML(receiptNumber)
  const safePaymentMethod = escapeHTML(paymentMethod)
  const currency = escapeHTML(clinic?.currency || "$")
  const safeClinicName = escapeHTML(clinic?.name || "nuestra clínica")
  
  const formattedAmount = Number(totalPaid || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })
  const receivedAmount = (item: any): number => {
    const value = Number(item.appliedAmount ?? item.payingAmount ?? 0)
    return Number.isFinite(value) && value >= 0 ? value : 0
  }

  // 1. Tarjeta Personalizada (Diseño 2 Columnas)
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
        <div class="c-label">Paciente / Titular</div>
        <div class="c-title">${escapeHTML(patientName)}</div>
        <div class="c-sub"><b>Identificación:</b> ${escapeHTML(patientDocumentId || "Consumidor Final")}</div>
      </div>
      <div class="custom-col">
        <div class="c-label">Detalles del Pago</div>
        <div class="c-title" style="color: #008bcd;">${safePaymentMethod}</div>
        <div class="c-sub"><b>Recibo Nº:</b> <span style="font-family: monospace; font-weight: 700;">${safeReceiptNumber}</span></div>
      </div>
    </div>
  `

  const rowsHtml = items.length > 0
    ? items.map(item => {
        const hasDiscount = item.discountPercent > 0;
        const safeItemName = escapeHTML(item.name || item.procedureName || 'Tratamiento Odontológico');
        const safePlanName = escapeHTML(item.planName || 'General');
        const safeToothLabel = escapeHTML(item.toothLabel || (item.tooth ? 'Pieza ' + item.tooth : 'General'));
        
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 8px;">
              <div style="font-size: 12px; font-weight: 800; color: #0f172a;">${safeItemName}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Plan: ${safePlanName}</div>
              ${hasDiscount ? `<div style="display: inline-block; font-size: 9px; font-weight: 700; color: #059669; margin-top: 4px;">Aplica ${escapeHTML(String(item.discountPercent))}% desc.</div>` : ''}
            </td>
            <td style="padding: 12px 8px; text-align: center;">
              <span style="font-size: 11px; font-weight: 700; color: #334155;">${safeToothLabel}</span>
            </td>
            <td style="padding: 12px 8px; text-align: right;">
              <span style="font-size: 13px; font-weight: 800; color: #0f172a; font-family: monospace;">${currency}${receivedAmount(item).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </td>
          </tr>
        `
      }).join('')
    : `
      <tr>
        <td style="padding: 12px 8px;">
          <div style="font-size: 12px; font-weight: 800; color: #0f172a;">Abono General a Cuenta</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Aplicación directa a saldo de tratamientos pendientes</div>
        </td>
        <td style="padding: 12px 8px; text-align: center;"><span style="font-size: 11px; font-weight: 700; color: #334155;">General</span></td>
        <td style="padding: 12px 8px; text-align: right;"><span style="font-size: 13px; font-weight: 800; color: #0f172a; font-family: monospace;">${currency}${formattedAmount}</span></td>
      </tr>
    `

  const bodyHtml = `
    ${customPatientCard}
    
    <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin-bottom: 25px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1;">
            <th style="padding: 12px 8px; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase;">Descripción de Prestación / Plan</th>
            <th style="padding: 12px 8px; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: center; width: 150px;">Pieza Dental</th>
            <th style="padding: 12px 8px; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: right; width: 160px;">Abono Registrado</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>

    <div style="display: flex; justify-content: flex-end; margin-bottom: 40px; page-break-inside: avoid; break-inside: avoid;">
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 24px; min-width: 280px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: 800; color: #475569;">Total Abonado</span>
          <span style="font-size: 22px; font-weight: 900; color: #0f172a; font-family: monospace;">${currency}${formattedAmount}</span>
        </div>
      </div>
    </div>
  `

  const footerHtml = `
    <div style="margin-top: 30px; padding-top: 15px; page-break-inside: avoid; break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="font-size: 9px; color: #64748b; line-height: 1.5;">
          <p>Este documento es un comprobante de control interno emitido para<br/>certificar la recepción del pago detallado en caja.</p>
          <p style="margin-top: 12px;"><strong style="color: #0f172a; font-weight: 700;">Atendido por:</strong> Usuario de Caja</p>
          <p style="color: #008bcd; font-weight: 800; font-size: 10px; margin-top: 6px;">¡Gracias por confiar su sonrisa en ${safeClinicName}!</p>
        </div>
        <div style="width: 220px; text-align: center;">
          <div style="border-top: 1px solid #cbd5e1; margin-bottom: 8px;"></div>
          <div style="font-size: 10px; font-weight: 700; color: #475569;">Firma Autorizada - Caja</div>
        </div>
      </div>
    </div>
  `

  executePrintEngine({
    title: "Comprobante de Pago",
    documentTypeBadge: "RECIBO DE CAJA",
    patient: undefined,
    settings: clinic,
    bodyHtml,
    footerHtml,
    showSignature: false,
  })
}