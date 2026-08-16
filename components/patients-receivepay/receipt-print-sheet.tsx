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
  logoUrl?: string 
}

export function generateReceiptHTML({
  receiptNumber,
  patientName,
  patientDocumentId = "1719231696001",
  totalPaid,
  paymentMethod,
  items = [],
  emissionDate = new Date(),
  logoUrl = "/logosn.png" 
}: ReceiptPrintSheetProps) {
  const formattedDate = format(emissionDate, "dd 'de' MMMM 'de' yyyy", { locale: es })
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
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
        }
        body {
          background-color: #ffffff;
          padding: 25px;
          position: relative;
          min-height: 100%;
        }

        /* 📍 MARCA DE AGUA CENTRADA */
        .watermark-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.05;
          z-index: 0;
          pointer-events: none;
          text-align: center;
          width: 380px;
        }
        .watermark-container img {
          width: 280px;
          height: auto;
          filter: grayscale(100%);
        }
        .watermark-text {
          font-size: 36px;
          font-weight: 900;
          color: #008bcd;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 10px;
        }

        /* CONTENIDO PRINCIPAL */
        .content {
          position: relative;
          z-index: 1;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .clinic-title {
          font-size: 22px;
          font-weight: 900;
          color: #008bcd;
          letter-spacing: -0.5px;
        }
        .clinic-subtitle {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 2px;
        }
        .badge {
          display: inline-block;
          background-color: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .receipt-code {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
          margin-top: 6px;
          text-align: right;
        }

        .meta-grid {
          display: flex;
          justify-content: space-between;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 25px;
          font-size: 11px;
        }
        .meta-label {
          font-size: 9px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 3px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          font-size: 12px;
        }
        thead th {
          background-color: #f8fafc;
          border-bottom: 2px solid #cbd5e1;
          color: #475569;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 10px 12px;
          letter-spacing: 0.5px;
        }
        tbody td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .plan-tag {
          display: inline-block;
          font-size: 10px;
          color: #64748b;
          margin-top: 2px;
        }

        .total-box {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .total-card {
          width: 260px;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 12px 16px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-amount {
          font-size: 18px;
          font-weight: 900;
          color: #059669;
        }

        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
          border-top: 1px dashed #e2e8f0;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>


      <div class="watermark-container">
        <div class="watermark-text">CARMO DENTAL</div>
      </div>

      <div class="content">
        <!-- HEADER DE LA CLÍNICA -->
        <div class="header">
          <div>
            <div class="clinic-title">CARMO DENTAL</div>
            <div class="clinic-subtitle">Clínica de Especialidades Odontológicas</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">RUC: 1719231696001 • Quito, Ecuador</div>
          </div>
          <div>
            <div class="badge">Comprobante Oficial</div>
            <div class="receipt-code">${receiptNumber}</div>
          </div>
        </div>

        <!-- DATOS DEL PACIENTE Y FECHA -->
        <div class="meta-grid">
          <div>
            <div class="meta-label">Paciente</div>
            <div style="font-size: 13px; font-weight: 800;">${patientName}</div>
            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">CI / RUC: ${patientDocumentId}</div>
          </div>
          <div style="text-align: right;">
            <div class="meta-label">Fecha de Emisión</div>
            <div style="font-weight: 700;">${formattedDate}</div>
            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Método: <b>${paymentMethod}</b></div>
          </div>
        </div>

        <!-- TABLA DE PRESTACIONES Y PLANES ABONADOS -->
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Descripción de Prestación y Plan</th>
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
                      <div style="font-weight: 700; color: #0f172a;">${item.name || item.procedureName || 'Tratamiento Dental'}</div>
                      <div class="plan-tag">Plan: <b>${item.planName || 'Plan General'}</b></div>
                    </td>
                    <td style="text-align: center; font-weight: 700; color: #008bcd;">
                      ${item.toothLabel || (item.tooth ? 'Pieza ' + item.tooth : 'General')}
                    </td>
                    <td style="text-align: right; font-weight: 800; color: #0f172a;">
                      $${Number(item.itemDebt || item.appliedAmount || item.finalPrice || totalPaid).toFixed(2)}
                    </td>
                  </tr>
                `).join('')
                : `
                  <tr>
                    <td>
                      <div style="font-weight: 700; color: #0f172a;">Abono a Plan de Tratamiento</div>
                      <div class="plan-tag">Plan: <b>Rehabilitación Oral</b></div>
                    </td>
                    <td style="text-align: center; color: #94a3b8;">General</td>
                    <td style="text-align: right; font-weight: 800;">$${formattedAmount}</td>
                  </tr>
                `
            }
          </tbody>
        </table>

        <!-- TOTAL PAGADO -->
        <div class="total-box">
          <div class="total-card">
            <div class="total-row">
              <span style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Total Pagado:</span>
              <span class="total-amount">$${formattedAmount} USD</span>
            </div>
          </div>
        </div>

        <!-- PIE DE PÁGINA (SIN FIRMAS) -->
        <div class="footer">
          Documento de control y soporte de pago clínico emitido por CARMO DENTAL.<br/>
          Contacto: carmodental@gmail.com • Quito - Ecuador
        </div>
      </div>
    </body>
    </html>
  `
}