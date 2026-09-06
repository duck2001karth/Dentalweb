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
  clinic?: any // 👈 Recibimos los ajustes de la clínica
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
  // 1. Extraer y formatear datos dinámicos de la clínica
  const clinicName = clinic?.clinicName || "[NOMBRE DE CLÍNICA]"
  const clinicSlogan = clinic?.slogan || ""
  const clinicRuc = clinic?.ruc || "[RUC NO CONFIGURADO]"
  const logoUrl = clinic?.logoUrl || ""
  const currency = clinic?.currency || "USD"
  
  const watermarkUrl = clinic?.watermarkUrl || clinic?.logoUrl || ""
  const watermarkOpacity = clinic?.watermarkOpacity ? Number(clinic.watermarkOpacity) / 100 : 0.05

  const addressParts = [clinic?.address, clinic?.city, clinic?.country].filter(Boolean)
  const clinicAddress = addressParts.length > 0 ? addressParts.join(" • ") : ""
  
  const contactParts = [clinic?.phone, clinic?.email].filter(Boolean)
  const clinicContact = contactParts.length > 0 ? contactParts.join(" | ") : ""

  const formattedDate = format(emissionDate, "dd 'de' MMMM 'de' yyyy - HH:mm", { locale: es })
  const formattedAmount = Number(totalPaid || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })

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
          font-family: -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
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
          width: 400px;
          opacity: ${watermarkOpacity};
          z-index: -1;
          pointer-events: none;
        }

        /* ENCABEZADO PREMIUM */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid rgba(0, 139, 205, 0.2);
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logo {
          max-height: 60px;
          max-width: 180px;
          object-fit: contain;
        }
        .clinic-brand {
          font-size: 24px;
          font-weight: 900;
          color: #008bcd;
          text-transform: uppercase;
          letter-spacing: -0.5px;
          line-height: 1;
        }
        .clinic-sub {
          font-size: 9px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 4px;
        }
        .header-right {
          text-align: right;
        }
        .receipt-title {
          font-size: 11px;
          font-weight: 900;
          color: #008bcd;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .receipt-number {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          margin-top: 2px;
        }
        .clinic-info {
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* DATOS DEL PACIENTE COMPACTOS */
        .info-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 30px;
        }
        .info-col {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .info-label {
          font-size: 9px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .info-value {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .info-sub {
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          margin-top: 2px;
        }

        /* TABLA DE DETALLES */
        .table-container {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 10px;
          font-weight: 900;
          color: #008bcd;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        thead th {
          background-color: rgba(241, 245, 249, 0.5);
          color: #008bcd;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 12px 10px;
          letter-spacing: 1px;
          border-top: 2px solid rgba(0, 139, 205, 0.2);
          border-bottom: 2px solid rgba(0, 139, 205, 0.2);
        }
        tbody td {
          padding: 14px 10px;
          font-size: 11px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .desc-title { font-weight: 800; color: #1e293b; font-size: 12px; }
        .desc-sub { font-size: 10px; color: #64748b; margin-top: 4px; }
        .tooth-badge { 
          background: #f1f5f9; 
          color: #475569; 
          padding: 3px 8px; 
          border-radius: 4px; 
          font-size: 9px; 
          font-weight: 800; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
        }

        /* TOTAL RESALTADO */
        .total-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 50px;
          page-break-inside: avoid;
        }
        .total-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 16px 24px;
          border-radius: 16px;
          width: 300px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-label {
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .total-amount {
          font-size: 20px;
          font-weight: 900;
          color: #008bcd;
          font-family: monospace;
        }

        /* FIRMAS Y PIE */
        .footer-section {
          margin-top: 40px;
          page-break-inside: avoid;
        }
        .signatures {
          display: flex;
          justify-content: space-around;
          margin-bottom: 40px;
        }
        .signature-box {
          width: 220px;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #94a3b8;
          margin-bottom: 8px;
          height: 40px;
        }
        .signature-title {
          font-size: 10px;
          font-weight: 800;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .signature-sub {
          font-size: 9px;
          font-weight: 600;
          color: #64748b;
          margin-top: 4px;
        }
        .legal-text {
          text-align: center;
          font-size: 9px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>

      <!-- MARCA DE AGUA -->
      ${watermarkUrl ? `<img src="${watermarkUrl}" class="watermark" alt="" />` : ''}

      <!-- ENCABEZADO -->
      <div class="header">
        <div class="header-left">
          ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" />` : ''}
          <div>
            <div class="clinic-brand">${clinicName}</div>
            ${clinicSlogan ? `<div class="clinic-sub">${clinicSlogan}</div>` : ''}
          </div>
        </div>
        <div class="header-right">
          <div class="receipt-title">Comprobante de Ingreso</div>
          <div class="receipt-number">${receiptNumber}</div>
          <div class="clinic-info">
            RUC: ${clinicRuc}<br/>
            ${clinicAddress}<br/>
            ${clinicContact}
          </div>
        </div>
      </div>

      <!-- DATOS DEL PACIENTE -->
      <div class="info-grid">
        <div class="info-col">
          <span class="info-label">Recibimos de:</span>
          <span class="info-value">${patientName}</span>
          <span class="info-sub">Doc. Identidad: ${patientDocumentId || "Consumidor Final"}</span>
        </div>
        <div class="info-col" style="text-align: right;">
          <div style="margin-bottom: 8px;">
            <span class="info-label" style="display: block; margin-bottom: 4px;">Fecha de Pago</span>
            <span class="info-value" style="font-size: 11px;">${formattedDate}</span>
          </div>
          <div>
            <span class="info-label" style="display: block; margin-bottom: 4px;">Forma de Pago</span>
            <span class="info-value" style="color: #008bcd; font-size: 11px;">${paymentMethod}</span>
          </div>
        </div>
      </div>

      <!-- TABLA DE DETALLES -->
      <div class="table-container">
        <div class="section-title">Detalle de Prestaciones Abonadas</div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Descripción / Procedimiento</th>
              <th style="text-align: center; width: 120px;">Pieza / Región</th>
              <th style="text-align: right; width: 140px;">Monto Aplicado</th>
            </tr>
          </thead>
          <tbody>
            ${
              items.length > 0
                ? items.map(item => `
                  <tr>
                    <td>
                      <div class="desc-title">${item.name || item.procedureName || 'Tratamiento Odontológico'}</div>
                      <div class="desc-sub">Plan asociado: ${item.planName || 'Plan General'}</div>
                    </td>
                    <td style="text-align: center;">
                      <span class="tooth-badge">${item.toothLabel || (item.tooth ? 'Pieza ' + item.tooth : 'General')}</span>
                    </td>
                    <td style="text-align: right; font-weight: 800; font-family: monospace; font-size: 13px;">
                      ${currency} ${Number(item.itemDebt || item.appliedAmount || item.finalPrice || totalPaid).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                `).join('')
                : `
                  <tr>
                    <td>
                      <div class="desc-title">Abono General a Cuenta</div>
                      <div class="desc-sub">Aplicación directa a saldo de tratamientos</div>
                    </td>
                    <td style="text-align: center;">
                      <span class="tooth-badge">General</span>
                    </td>
                    <td style="text-align: right; font-weight: 800; font-family: monospace; font-size: 13px;">
                      ${currency} ${formattedAmount}
                    </td>
                  </tr>
                `
            }
          </tbody>
        </table>
      </div>

      <!-- TOTAL -->
      <div class="total-container">
        <div class="total-box">
          <span class="total-label">Total Recibido</span>
          <span class="total-amount">${currency} ${formattedAmount}</span>
        </div>
      </div>

      <!-- PIE Y FIRMAS -->
      <div class="footer-section">
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-title">Firma Conforme</div>
            <div class="signature-sub">${patientName}</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-title">Firma Autorizada</div>
            <div class="signature-sub">${clinicName} - Caja</div>
          </div>
        </div>
        
        <div class="legal-text">
          Documento interno sin validez tributaria. Generado electrónicamente por ${clinicName}.<br/>
          La atención oportuna y el cumplimiento de pagos aseguran el éxito de su tratamiento.
        </div>
      </div>

    </body>
    </html>
  `
}