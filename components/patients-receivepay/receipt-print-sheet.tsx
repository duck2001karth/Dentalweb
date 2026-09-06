"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"

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
  const clinicName = clinic?.clinicName || "CARMO DENTAL"
  const clinicSlogan = clinic?.slogan || "Clínica de Especialidades Odontológicas"
  const clinicRuc = clinic?.ruc || "1719231696001"
  const logoUrl = clinic?.logoUrl || ""
  const currency = clinic?.currency || "$"
  
  const watermarkUrl = clinic?.watermarkUrl || clinic?.logoUrl || ""
  const watermarkOpacity = clinic?.watermarkOpacity ? Number(clinic.watermarkOpacity) / 100 : 0.05

  const addressParts = [clinic?.city, clinic?.country].filter(Boolean)
  const clinicLocation = addressParts.length > 0 ? addressParts.join(", ") : "Quito, Ecuador"
  const clinicEmail = clinic?.email || "carmodental@gmail.com"

  const formattedDate = format(emissionDate, "dd 'de' MMMM 'de' yyyy - HH:mm", { locale: es })
  const formattedAmount = Number(totalPaid || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })

  // LÓGICA DE DESGLOSE
  let showBreakdown = false
  let calcSubtotal = 0
  let calcDiscount = 0

  if (items && items.length > 0) {
    let hasDiscount = false
    let sumPaid = 0

    items.forEach(item => {
      const debt = Number(item.itemDebt || item.appliedAmount || item.finalPrice || totalPaid)
      const descPerc = Number(item.discountPercent || 0)
      sumPaid += debt

      if (descPerc > 0) {
        hasDiscount = true
        const original = debt / (1 - (descPerc / 100))
        calcSubtotal += original
        calcDiscount += (original - debt)
      } else {
        calcSubtotal += debt
      }
    })

    if (hasDiscount && Math.abs(sumPaid - totalPaid) < 0.1) {
      showBreakdown = true
    }
  }

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Comprobante de Pago - ${receiptNumber}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        body {
          background-color: #ffffff;
          color: #0f172a;
          position: relative;
          min-height: 100vh;
        }
        
        /* MARCA DE AGUA */
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          opacity: ${watermarkOpacity};
          z-index: -1;
          pointer-events: none;
        }

        /* ENCABEZADO */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 25px; 
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo {
          max-height: 80px; 
          max-width: 140px;
          object-fit: contain;
        }
        .clinic-info-group {
          display: flex;
          flex-direction: column;
        }
        .clinic-brand {
          font-size: 24px;
          font-weight: 900;
          color: #008bcd;
          text-transform: uppercase;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .clinic-slogan {
          font-size: 11px;
          font-weight: 700;
          color: #008bcd;
          letter-spacing: 0.5px;
          margin-top: 2px;
          margin-bottom: 6px;
        }
        .clinic-contact {
          font-size: 10px;
          color: #475569;
          line-height: 1.4;
        }

        /* CAJA DE ESTADO */
        .status-box {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 12px 24px;
          text-align: center;
          background: #ffffff;
        }
        .status-title {
          font-size: 9px;
          font-weight: 800;
          color: #008bcd;
          letter-spacing: 1px;
        }
        .status-number {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          margin: 4px 0 6px 0;
        }
        .status-badge {
          display: inline-block;
          border: 1px solid #10b981;
          color: #10b981;
          font-size: 9px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 12px;
          letter-spacing: 0.5px;
        }

        /* CAJA DEL PACIENTE */
        .patient-box {
          display: flex;
          justify-content: space-between;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 25px;
        }
        .info-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .info-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .info-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.3px;
        }
        .info-value {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }
        .method-value {
          font-size: 14px;
          font-weight: 800;
          color: #008bcd;
        }

        /* TABLA */
        .table-container {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          overflow: hidden; 
          margin-bottom: 25px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        thead th {
          background-color: #f8fafc;
          color: #475569;
          font-size: 10px;
          font-weight: 700;
          padding: 14px 16px;
          border-bottom: 1px solid #cbd5e1;
        }
        tbody td {
          padding: 16px;
          vertical-align: middle;
          border-bottom: 1px solid #e2e8f0;
        }
        tbody tr:last-child td {
          border-bottom: none;
        }
        .item-name {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
        }
        .item-plan {
          font-size: 10px;
          color: #64748b;
          margin-top: 4px;
        }
        .tooth-text {
          font-size: 11px;
          font-weight: 700;
          color: #334155;
        }
        .amount-text {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
        .discount-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          color: #059669;
          margin-top: 4px;
        }

        /* CAJA DEL TOTAL CON DESGLOSE */
        .total-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 50px;
        }
        .total-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          min-width: 280px;
        }
        .total-box-breakdown {
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
        }
        .breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .breakdown-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
        }
        .breakdown-value {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }
        .discount-row .breakdown-label, .discount-row .breakdown-value {
          color: #059669;
        }
        .total-final-row {
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          margin-top: 2px;
        }
        
        .total-label {
          font-size: 13px;
          font-weight: 800;
          color: #475569;
        }
        .total-value {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
        }

        /* PIE DE PÁGINA Y FIRMAS */
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 20px;
        }
        .footer-left {
          font-size: 9px;
          color: #64748b;
          line-height: 1.5;
        }
        .footer-left strong {
          color: #0f172a;
          font-weight: 700;
        }
        .footer-left .blue-thanks {
          color: #008bcd;
          font-weight: 800;
          font-size: 10px;
          margin-top: 6px;
        }
        .mt-3 { margin-top: 12px; }
        
        .footer-right {
          width: 220px;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #cbd5e1;
          margin-bottom: 8px;
        }
        .signature-label {
          font-size: 10px;
          font-weight: 700;
          color: #475569;
        }
      </style>
    </head>
    <body>

      ${watermarkUrl ? `<img src="${watermarkUrl}" class="watermark" alt="" />` : ''}

      <!-- ENCABEZADO -->
      <div class="header">
        <div class="header-left">
          ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" />` : ''}
          <div class="clinic-info-group">
            <div class="clinic-brand">${clinicName}</div>
            <div class="clinic-slogan">${clinicSlogan}</div>
            <div class="clinic-contact">
              RUC: ${clinicRuc}<br/>
              ${clinicLocation}<br/>
              ${clinicEmail}
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="status-box">
            <div class="status-title">Comprobante de Pago</div>
            <div class="status-number">${receiptNumber}</div>
            <div class="status-badge">Pagado en Caja</div>
          </div>
        </div>
      </div>

      <!-- CAJA DEL PACIENTE -->
      <div class="patient-box">
        <div class="info-col">
          <div class="info-group">
            <span class="info-label">Paciente</span>
            <span class="info-value">${patientName}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Identificación (CI/RUC)</span>
            <span class="info-value">${patientDocumentId || "Consumidor Final"}</span>
          </div>
        </div>
        <div class="info-col" style="text-align: right;">
          <div class="info-group">
            <span class="info-label">Fecha de Emisión</span>
            <span class="info-value" style="font-size: 12px;">${formattedDate}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Método de Pago</span>
            <span class="method-value">${paymentMethod}</span>
          </div>
        </div>
      </div>

      <!-- TABLA DE DETALLES -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Descripción de Prestación / Plan</th>
              <th style="text-align: center; width: 150px;">Pieza Dental</th>
              <th style="text-align: right; width: 160px;">Abono Registrado</th>
            </tr>
          </thead>
          <tbody>
            ${
              items.length > 0
                ? items.map(item => {
                    const hasDiscount = item.discountPercent > 0;
                    return `
                      <tr>
                        <td>
                          <div class="item-name">${item.name || item.procedureName || 'Tratamiento Odontológico'}</div>
                          <div class="item-plan">Plan: ${item.planName || 'General'}</div>
                          ${hasDiscount ? `<div class="discount-badge">Aplica ${item.discountPercent}% desc. (Convenio)</div>` : ''}
                        </td>
                        <td style="text-align: center;">
                          <span class="tooth-text">${item.toothLabel || (item.tooth ? 'Pieza ' + item.tooth : 'General')}</span>
                        </td>
                        <td style="text-align: right;">
                          <span class="amount-text">${currency}${Number(item.itemDebt || item.appliedAmount || item.finalPrice || totalPaid).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        </td>
                      </tr>
                    `
                  }).join('')
                : `
                  <tr>
                    <td>
                      <div class="item-name">Abono General a Cuenta</div>
                      <div class="item-plan">Aplicación directa a saldo de tratamientos pendientes</div>
                    </td>
                    <td style="text-align: center;">
                      <span class="tooth-text">General</span>
                    </td>
                    <td style="text-align: right;">
                      <span class="amount-text">${currency}${formattedAmount}</span>
                    </td>
                  </tr>
                `
            }
          </tbody>
        </table>
      </div>

      <!-- CAJA DEL TOTAL (Con o Sin Desglose) -->
      <div class="total-section">
        <div class="total-box ${showBreakdown ? 'total-box-breakdown' : ''}">
          ${showBreakdown ? `
            <div class="breakdown-row">
              <span class="breakdown-label">Subtotal de la cuota</span>
              <span class="breakdown-value">${currency}${calcSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="breakdown-row discount-row">
              <span class="breakdown-label">Descuento aplicado (Convenio)</span>
              <span class="breakdown-value">-${currency}${calcDiscount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="breakdown-row total-final-row">
              <span class="total-label">Total Abonado</span>
              <span class="total-value">${currency}${formattedAmount}</span>
            </div>
          ` : `
            <span class="total-label" style="flex-grow: 1;">Total Abonado</span>
            <span class="total-value">${currency}${formattedAmount}</span>
          `}
        </div>
      </div>

      <!-- PIE DE PÁGINA Y FIRMAS -->
      <div class="footer">
        <div class="footer-left">
          <p>Este documento es un comprobante de control interno emitido para<br/>certificar la recepción del pago detallado en caja.</p>
          <p class="mt-3"><strong>Atendido por:</strong> Patricio Capa</p>
          <p class="blue-thanks">¡Gracias por confiar su sonrisa en ${clinicName}!</p>
        </div>
        <div class="footer-right">
          <div class="signature-line"></div>
          <div class="signature-label">Firma Autorizada - Caja</div>
        </div>
      </div>

    </body>
    </html>
  `
}