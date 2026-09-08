import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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

    const [payment, settings] = await Promise.all([
      prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          patient: true,
          taxDocuments: true,
          treatmentPlan: {
            include: { 
              items: true,
              agreement: true 
            }
          },
          processedBy: true
        }
      }),
      prisma.clinicSettings.findFirst()
    ])

    if (!payment) {
      return new NextResponse("Comprobante no encontrado o eliminado.", { status: 404 })
    }

    const clinicName = settings?.clinicName?.trim() || "Clinica dental"
    const clinicSlogan = settings?.slogan?.trim() || "Clinica sonrisa"
    const clinicRuc = settings?.ruc?.trim() || "1000000000001"
    const clinicAddress = [settings?.address, settings?.city, settings?.country].filter(Boolean).join(", ") || "Ciudad, País"
    const clinicEmail = settings?.email?.trim() || "dental@example.com"
    const clinicCurrency = `${settings?.currency || "USD"} `

    const logoUrl = settings?.logoUrl 
    const watermarkUrl = settings?.watermarkUrl || settings?.logoUrl 
    const watermarkOpacity = ((settings?.watermarkOpacity ?? 4) / 100)
    const watermarkScale = ((settings?.watermarkScale || 100) / 100)
    const isMonochrome = settings?.defaultPrintMode === "bw"
    const filterStyle = isMonochrome ? "filter: grayscale(100%);" : ""

    const sriDoc = payment.taxDocuments?.[0]
    const invoiceSecuencial = sriDoc?.secuencial
    const isOfficialInvoice = Boolean(invoiceSecuencial)
    const displayDocNumber = invoiceSecuencial || payment.receiptNumber || `#REC-${payment.id.slice(-6).toUpperCase()}`
    const docTitle = isOfficialInvoice ? "Factura Electrónica" : "Comprobante de Pago"

    const planItems = payment.treatmentPlan?.items || []
    const agreementDiscountPct = Number(payment.treatmentPlan?.agreement?.discountValue || 0)

    const realNetPlanCost = planItems.reduce((acc, item) => {
      const itemCost = Number(item.cost || 0)
      const itemDiscount = Number(item.discount || 0)
      const effectiveDiscount = itemDiscount > 0 ? itemDiscount : agreementDiscountPct
      return acc + (itemCost - (itemCost * (effectiveDiscount / 100)))
    }, 0)

    const planTotalPaid = Number(payment.treatmentPlan?.totalPaid || 0)
    const planPendingBalance = Math.max(0, realNetPlanCost - planTotalPaid)
    const isFullyPaidPlan = planPendingBalance <= 0.01
    let appliedItems: Array<{ procedureName: string; tooth: string; appliedAmount: number }> = []

    try {
      if (payment.notes && payment.notes.startsWith("[")) {
        appliedItems = JSON.parse(payment.notes)
      }
    } catch {
      appliedItems = []
    }

    const patientFullName = payment.patient 
      ? `${payment.patient.firstName || ''} ${payment.patient.lastName || ''}`.trim() 
      : "Paciente General"
      
    const patientDocId = payment.patient?.ci || "No registrado"
    const paymentMethod = formatPaymentMethod(payment.method)
    const formattedDate = format(new Date(payment.createdAt), "dd 'de' MMMM 'de' yyyy - HH:mm", { locale: es })
    const formattedAmount = Number(payment.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })
    const cashierName = payment.processedBy?.name || "Caja / Administración"

    let itemsHtml = ""

    if (appliedItems.length > 0) {
      itemsHtml = appliedItems
        .filter((item) => Number(item.appliedAmount) > 0)
        .map((item) => {
          const tooth = item.tooth || "General"
          const amount = Number(item.appliedAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })

          return `
            <tr>
              <td>
                <div class="desc-title">${item.procedureName}</div>
                <div class="desc-sub">Plan: ${payment.treatmentPlan?.name || "Rehabilitación Oral"}</div>
              </td>
              <td style="text-align: center; font-weight: 700; color: #64748b;">
                ${typeof tooth === "number" || (!isNaN(Number(tooth)) && tooth !== "") ? `Pieza ${tooth}` : tooth}
              </td>
              <td style="text-align: right; font-weight: 800;">
                ${clinicCurrency}${amount}
              </td>
            </tr>
          `
        })
        .join("")
    } else {
      itemsHtml = `
        <tr>
          <td>
            <div class="desc-title">Abono a Tratamiento Odontológico</div>
            <div class="desc-sub">Plan: ${payment.treatmentPlan?.name || "Rehabilitación Oral"}</div>
          </td>
          <td style="text-align: center; font-weight: 700; color: #64748b;">General</td>
          <td style="text-align: right; font-weight: 800;">${clinicCurrency}${formattedAmount}</td>
        </tr>
      `
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${docTitle} - ${displayDocNumber}</title>
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
          .watermark-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(${watermarkScale});
            width: 450px;
            max-height: 450px;
            opacity: ${watermarkOpacity};
            z-index: 0;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .watermark-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            ${filterStyle}
          }
          .content {
            position: relative;
            z-index: 1;
          }
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
            max-width: 160px;
            object-fit: contain;
            ${filterStyle}
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
            font-size: ${isOfficialInvoice ? '16px' : '20px'};
            font-weight: 900;
            color: #0f172a;
            margin-top: 4px;
          }
          .badge-paid {
            display: inline-block;
            border: 1px solid;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            margin-top: 8px;
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
            padding: 20px 24px;
            border-radius: 16px;
            width: 320px;
            box-shadow: 0 4px 10px -2px rgba(0, 139, 205, 0.3);
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            font-size: 12px;
            font-weight: 800;
            color: rgba(255,255,255,0.85);
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .total-amount {
            font-size: 24px;
            font-weight: 900;
            color: white;
          }
          .pending-balance-row {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.25);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.9);
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
            width: 55%;
            font-size: 10px;
            color: #94a3b8;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>

        <div class="watermark-container">
          <img src="${watermarkUrl}" alt="Watermark" />
        </div>

        <div class="content">
          <div class="header">
            <div class="logo-container">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo-img" onerror="this.style.display='none'">` : ''}
              <div>
                <div class="clinic-brand">${clinicName}</div>
                <div class="clinic-sub">${clinicSlogan}</div>
                <div class="clinic-info">
                  ${clinicRuc ? `RUC: ${clinicRuc}<br/>` : ''}
                  ${clinicAddress}<br/>
                  ${clinicEmail}
                </div>
              </div>
            </div>
            <div class="receipt-box">
              <div class="receipt-title">${docTitle}</div>
              <div class="receipt-number">${displayDocNumber}</div>
              ${sriDoc?.accessKey ? `
                <div style="font-size: 8px; color: #64748b; font-family: monospace; margin-top: 4px; max-width: 200px; word-break: break-all;">
                  Aut: ${sriDoc.accessKey}
                </div>
              ` : ''}
              <div class="badge-paid" style="${isFullyPaidPlan ? 'background-color: #d1fae5; color: #059669; border-color: #a7f3d0;' : 'background-color: #eff6ff; color: #008bcd; border-color: #bfdbfe;'}">
                ${isFullyPaidPlan ? "✓ PLAN TOTALMENTE SALDADO" : "PAGO APLICADO"}
              </div>
            </div>
          </div>

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

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Descripción de Prestación / Plan</th>
                  <th style="text-align: center;">Pieza Dental</th>
                  <th style="text-align: right;">Importe Pagado</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="total-container">
            <div class="total-box">
              <div class="total-row">
                <span class="total-label">Total Pagado</span>
                <span class="total-amount">${clinicCurrency}${formattedAmount}</span>
              </div>
              ${
                !isFullyPaidPlan
                  ? `
                    <div class="pending-balance-row">
                      <span>Saldo Pendiente del Plan:</span>
                      <span>${clinicCurrency}${planPendingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  `
                  : `
                    <div class="pending-balance-row" style="color: #d1fae5;">
                      <span>Convenio Aplicado:</span>
                      <span>✓ Saldo Pendiente: ${clinicCurrency}0.00</span>
                    </div>
                  `
              }
            </div>
          </div>

          <div class="footer-section">
            <div class="legal-text">
              Este documento certifica la recepción conforme del valor detallado en caja para las prestaciones especificadas.<br/><br/>
              <b>Atendido por:</b> ${cashierName}<br/>
              <b>¡Gracias por confiar en ${clinicName}!</b>
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
    console.error("Error al generar PDF de comprobante:", error)
    return new NextResponse("Error interno al generar el PDF del comprobante.", { status: 500 })
  }
}