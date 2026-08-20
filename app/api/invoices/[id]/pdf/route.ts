import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Traductor de métodos de pago para Ecuador
const formatPaymentMethod = (method?: string | null) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase().trim()
  switch (m) {
    case "CASH": case "EFECTIVO": return "Efectivo"
    case "CREDIT_CARD": case "TARJETA_CREDITO": case "TARJETA": return "Tarjeta de Crédito"
    case "DEBIT_CARD": case "TARJETA_DEBITO": return "Tarjeta de Débito"
    case "TRANSFER": case "TRANSFERENCIA": case "DEUNA": return "Transferencia Bancaria"
    case "CHECK": case "CHEQUE": return "Cheque"
    default: return method
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        patient: true,
        treatmentPlan: {
          include: { items: true }
        },
        processedBy: true
      }
    })

    if (!payment) {
      return new NextResponse("Comprobante no encontrado o eliminado.", { status: 404 })
    }
    const receiptNum = payment.receiptNumber || `#REC-${payment.id.slice(-6).toUpperCase()}`
    
    const patientFullName = payment.patient 
      ? `${payment.patient.firstName || ''} ${payment.patient.lastName || ''}`.trim() 
      : "Paciente General"
      
    const patientDocId = payment.patient?.ci || "No registrado"
    const paymentMethod = formatPaymentMethod(payment.method)
    const formattedDate = format(new Date(payment.createdAt), "dd 'de' MMMM 'de' yyyy - HH:mm", { locale: es })
    const formattedAmount = Number(payment.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })
    const cashierName = payment.processedBy?.name || "Caja / Administración"
    let itemsHtml = ""
    const planItems = payment.treatmentPlan?.items || []

    if (planItems.length > 0) {
      itemsHtml = planItems.map((item: any) => {
        const itemName = item.name || item.procedureName || item.treatmentName || item.description || "Procedimiento Odontológico"
        const planName = payment.treatmentPlan?.name || "Plan General"
        const tooth = item.toothNumber || item.tooth || item.piece || (item.toothLabel ? item.toothLabel : "General")
        const itemCost = Number(item.cost || item.totalCost || item.price || item.paidAmount || 0).toFixed(2)

        return `
          <tr>
            <td>
              <div class="desc-title">${itemName}</div>
              <div class="desc-sub">Plan: ${planName}</div>
            </td>
            <td style="text-align: center; font-weight: 700; color: #64748b;">
              ${typeof tooth === "number" || (typeof tooth === "string" && !isNaN(Number(tooth))) ? `Pieza ${tooth}` : tooth}
            </td>
            <td style="text-align: right; font-weight: 800;">
              $${itemCost}
            </td>
          </tr>
        `
      }).join("")
    } else {
      itemsHtml = `
        <tr>
          <td>
            <div class="desc-title">Abono General a Tratamiento</div>
            <div class="desc-sub">Plan: ${payment.treatmentPlan?.name || 'Rehabilitación Oral'}</div>
          </td>
          <td style="text-align: center; font-weight: 700; color: #64748b;">General</td>
          <td style="text-align: right; font-weight: 800;">$${formattedAmount}</td>
        </tr>
      `
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Comprobante de Pago - ${receiptNum}</title>
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
            color: #0f172a;
          }
          body {
            background-color: #ffffff;
            padding: 30px;
            min-height: 100%;
            position: relative;
          }

          /* MARCA DE AGUA */
          .watermark-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            opacity: 0.035;
            z-index: 0;
            pointer-events: none;
            text-align: center;
          }
          .watermark-text {
            font-size: 75px;
            font-weight: 900;
            color: #008bcd;
            letter-spacing: 6px;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .content {
            position: relative;
            z-index: 1;
          }

          /* ENCABEZADO */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 25px;
            margin-bottom: 30px;
          }
          .logo-container {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo-img {
            height: 55px;
            width: auto;
          }
          .clinic-brand {
            font-size: 26px;
            font-weight: 900;
            color: #008bcd;
            letter-spacing: -0.5px;
            text-transform: uppercase;
            line-height: 1.1;
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
          .badge-paid {
            display: inline-block;
            background-color: #d1fae5;
            color: #059669;
            border: 1px solid #a7f3d0;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            margin-top: 8px;
          }

          /* DATOS DEL PACIENTE */
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

          /* TABLA DE DETALLES */
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

          /* TOTAL */
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
            box-shadow: 0 4px 10px -2px rgba(0, 139, 205, 0.3);
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

          /* PIE DE PÁGINA Y FIRMAS */
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
            width: 55%;
            font-size: 10px;
            color: #94a3b8;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>

        <div class="watermark-container">
          <div class="watermark-text">CARMO DENTAL</div>
        </div>

        <div class="content">
          <!-- ENCABEZADO -->
          <div class="header">
            <div class="logo-container">
              <img src="/logosn.png" alt="Logo" class="logo-img" onerror="this.style.display='none'">
              <div>
                <div class="clinic-brand">CARMO DENTAL</div>
                <div class="clinic-sub">Clínica de Especialidades Odontológicas</div>
                <div class="clinic-info">
                  RUC: 1719231696001<br/>
                  Quito, Ecuador<br/>
                  carmodental@gmail.com
                </div>
              </div>
            </div>
            <div class="receipt-box">
              <div class="receipt-title">Comprobante de Pago</div>
              <div class="receipt-number">${receiptNum}</div>
              <div class="badge-paid">PAGADO EN CAJA</div>
            </div>
          </div>

          <!-- DATOS DEL PACIENTE -->
          <div class="info-grid">
            <div class="info-col">
              <div class="info-item">
                <span class="info-label">Paciente</span>
                <span class="info-value">${patientFullName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Identificación (CI/RUC)</span>
                <span class="info-value" style="color: #475569;">${patientDocId}</span>
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
                  <th style="text-align: left;">Descripción de Prestación / Plan</th>
                  <th style="text-align: center;">Pieza Dental</th>
                  <th style="text-align: right;">Abono Registrado</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- TOTAL -->
          <div class="total-container">
            <div class="total-box">
              <span class="total-label">Total Abonado</span>
              <span class="total-amount">$${formattedAmount}</span>
            </div>
          </div>

          <!-- PIE Y FIRMAS -->
          <div class="footer-section">
            <div class="legal-text">
              Este documento es un comprobante de control interno emitido para certificar la recepción del pago detallado en caja.<br/><br/>
              <b>Atendido por:</b> ${cashierName}<br/>
              <b>¡Gracias por confiar su sonrisa en Carmo Dental!</b>
            </div>
            
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-text">Firma Autorizada - Caja</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          }
        </script>
      </body>
      </html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Error al generar PDF de pago:", error)
    return new NextResponse("Error interno al generar el PDF del comprobante.", { status: 500 })
  }
}