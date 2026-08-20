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
}

export function generateReceiptHTML({
  receiptNumber,
  patientName,
  patientDocumentId = "1719231696001",
  totalPaid,
  paymentMethod,
  items = [],
  emissionDate = new Date()
}: ReceiptPrintSheetProps) {
  const formattedDate = format(emissionDate, "dd 'de' MMMM 'de' yyyy - HH:mm", { locale: es })
  const formattedAmount = Number(totalPaid || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Recibo Oficial - ${receiptNumber}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #0f172a;
        }
        body {
          background-color: #ffffff;
          padding: 20px;
          min-height: 100%;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 25px;
          margin-bottom: 30px;
        }
        .clinic-brand {
          font-size: 28px;
          font-weight: 900;
          color: #008bcd;
          letter-spacing: -0.5px;
          text-transform: uppercase;
        }
        .clinic-sub {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 4px;
        }
        .clinic-info {
          font-size: 10px;
          color: #64748b;
          margin-top: 6px;
          line-height: 1.5;
        }
        .receipt-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 15px 25px;
          border-radius: 12px;
          text-align: right;
        }
        .receipt-title {
          font-size: 10px;
          font-weight: 800;
          color: #008bcd;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .receipt-number {
          font-size: 20px;
          font-weight: 900;
          color: #0f172a;
          margin-top: 4px;
        }

        .info-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          background-color: #f8fafc;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          padding: 20px;
        }
        .info-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .info-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          font-size: 14px;
          font-weight: 800;
        }
        .table-container {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        thead th {
          background-color: #f8fafc;
          color: #475569;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 16px;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
        }
        tbody td {
          padding: 16px;
          font-size: 13px;
          border-bottom: 1px solid #f1f5f9;
        }
        tbody tr:last-child td {
          border-bottom: none;
        }
        .desc-title { font-weight: 800; color: #0f172a; }
        .desc-sub { font-size: 11px; color: #64748b; margin-top: 4px; }

        .total-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 50px;
        }
        .total-box {
          background-color: #008bcd;
          color: white;
          padding: 20px 30px;
          border-radius: 16px;
          width: 320px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 6px -1px rgba(0, 139, 205, 0.2);
        }
        .total-label {
          font-size: 12px;
          font-weight: 800;
          color: rgba(255,255,255,0.8);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .total-amount {
          font-size: 24px;
          font-weight: 900;
          color: white;
        }

        .footer-section {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .signature-box {
          width: 250px;
          text-align: center;
        }
        .signature-line {
          border-top: 2px solid #cbd5e1;
          margin-bottom: 10px;
        }
        .signature-text {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .legal-text {
          width: 50%;
          font-size: 10px;
          color: #94a3b8;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>

      <!-- ENCABEZADO -->
      <div class="header">
        <div>
          <div class="clinic-brand">CARMO DENTAL</div>
          <div class="clinic-sub">Especialidades Odontológicas</div>
          <div class="clinic-info">
            RUC: 1719231696001<br/>
            Quito, Ecuador<br/>
            carmodental@gmail.com
          </div>
        </div>
        <div class="receipt-box">
          <div class="receipt-title">Comprobante de Pago</div>
          <div class="receipt-number">${receiptNumber}</div>
        </div>
      </div>

      <!-- DATOS DEL PACIENTE -->
      <div class="info-grid">
        <div class="info-col">
          <div class="info-item">
            <span class="info-label">Paciente</span>
            <span class="info-value">${patientName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Identificación (CI/RUC)</span>
            <span class="info-value" style="color: #475569;">${patientDocumentId}</span>
          </div>
        </div>
        <div class="info-col" style="text-align: right;">
          <div class="info-item">
            <span class="info-label">Fecha de Emisión</span>
            <span class="info-value">${formattedDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Método de Pago</span>
            <span class="info-value" style="color: #008bcd;">${paymentMethod}</span>
          </div>
        </div>
      </div>

      <!-- TABLA DE DETALLES -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Descripción del Tratamiento / Plan</th>
              <th style="text-align: center;">Pieza Dental</th>
              <th style="text-align: right;">Abono Registrado</th>
            </tr>
          </thead>
          <tbody>
            ${
              items.length > 0
                ? items.map(item => `
                  <tr>
                    <td>
                      <div class="desc-title">${item.name || item.procedureName || 'Tratamiento Odontológico'}</div>
                      <div class="desc-sub">Plan: ${item.planName || 'Plan General'}</div>
                    </td>
                    <td style="text-align: center; font-weight: 700; color: #64748b;">
                      ${item.toothLabel || (item.tooth ? 'Pieza ' + item.tooth : 'General')}
                    </td>
                    <td style="text-align: right; font-weight: 800;">
                      $${Number(item.itemDebt || item.appliedAmount || item.finalPrice || totalPaid).toFixed(2)}
                    </td>
                  </tr>
                `).join('')
                : `
                  <tr>
                    <td>
                      <div class="desc-title">Abono General a Tratamiento</div>
                      <div class="desc-sub">Plan: Rehabilitación Odontológica</div>
                    </td>
                    <td style="text-align: center; font-weight: 700; color: #64748b;">General</td>
                    <td style="text-align: right; font-weight: 800;">$${formattedAmount}</td>
                  </tr>
                `
            }
          </tbody>
        </table>
      </div>

      <!-- TOTAL -->
      <div class="total-container">
        <div class="total-box">
          <span class="total-label">Total Pagado</span>
          <span class="total-amount">$${formattedAmount}</span>
        </div>
      </div>

      <!-- PIE Y FIRMAS -->
      <div class="footer-section">
        <div class="legal-text">
          Este documento es un comprobante de control interno para certificar la recepción del pago detallado. La atención oportuna y los controles son vitales para el éxito de su tratamiento.<br/><br/>
          <b>¡Gracias por confiar su sonrisa en Carmo Dental!</b>
        </div>
        
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-text">Firma Autorizada - Caja</div>
        </div>
      </div>

    </body>
    </html>
  `
}