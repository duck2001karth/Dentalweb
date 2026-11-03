
import { NextResponse } from "next/server"
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { format, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { escapeHTML } from "@/lib/sanitize"

const safe = (value: unknown): string =>
  escapeHTML(String(value ?? ""))

const money = (value: number): string =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

function validImageUrl(value?: string | null): string | null {
  if (!value || typeof value !== "string") return null

  const url = value.trim()

  if (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.includes("\\")
  ) {
    return url
  }

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:") return null
    if (parsed.username || parsed.password) return null
    return parsed.toString()
  } catch {
    return null
  }
}

function paymentMethodLabel(method?: string | null): string {
  const labels: Record<string, string> = {
    CASH: "Efectivo",
    EFECTIVO: "Efectivo",
    CREDIT_CARD: "Tarjeta de Crédito",
    TARJETA_CREDITO: "Tarjeta de Crédito",
    TARJETA: "Tarjeta de Crédito",
    DEBIT_CARD: "Tarjeta de Débito",
    TARJETA_DEBITO: "Tarjeta de Débito",
    TRANSFER: "Transferencia Bancaria",
    TRANSFERENCIA: "Transferencia Bancaria",
    DEUNA: "Transferencia Bancaria",
    CHECK: "Cheque",
    CHEQUE: "Cheque",
  }

  const key = method?.trim().toUpperCase() || ""
  return labels[key] || method || "No especificado"
}

function validPercentage(value: unknown): number {
  const number = Number(value ?? 0)
  if (!Number.isFinite(number)) return 0
  return Math.min(100, Math.max(0, number))
}

type AppliedItem = {
  procedureName: string
  tooth: string
  appliedAmount: number
}

function readAppliedItems(notes?: string | null): AppliedItem[] {
  if (!notes?.trim().startsWith("[")) return []

  try {
    const parsed: unknown = JSON.parse(notes)
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((entry): AppliedItem[] => {
      if (
        !entry ||
        typeof entry !== "object" ||
        Array.isArray(entry)
      ) {
        return []
      }

      const item = entry as Record<string, unknown>
      const appliedAmount = Number(item.appliedAmount)

      if (
        !Number.isFinite(appliedAmount) ||
        appliedAmount <= 0
      ) {
        return []
      }

      return [{
        procedureName: String(
          item.procedureName || "Prestación"
        ),
        tooth: String(item.tooth || "General"),
        appliedAmount,
      }]
    })
  } catch {
    return []
  }
}

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { params }) => {
    const paymentId = String(params.id || "")

    if (!paymentId) {
      return NextResponse.json(
        { error: "Falta el ID del pago" },
        { status: 400 }
      )
    }

    const [payment, settings] = await Promise.all([
      prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          patient: true,
          taxDocuments: true,
          treatmentPlan: {
            include: {
              items: true,
              agreement: true,
            },
          },
          processedBy: true,
        },
      }),
      prisma.clinicSettings.findFirst(),
    ])

    if (!payment) {
      return new NextResponse(
        "Comprobante no encontrado.",
        { status: 404 }
      )
    }

    const clinicName = safe(
      settings?.clinicName?.trim() || "Clínica Dental"
    )
    const clinicSlogan = safe(
      settings?.slogan?.trim() || "Clínica de Sonrisa"
    )
    const clinicRuc = safe(settings?.ruc?.trim() || "")
    const clinicAddress = safe(
      [
        settings?.address,
        settings?.city,
        settings?.country,
      ].filter(Boolean).join(", ")
    )
    const clinicEmail = safe(settings?.email?.trim() || "")
    const currency = safe(settings?.currency || "USD")

    const logoUrl = validImageUrl(settings?.logoUrl)
    const watermarkUrl = validImageUrl(
      settings?.watermarkUrl || settings?.logoUrl
    )

    const opacityValue = Number(settings?.watermarkOpacity ?? 4)
    const scaleValue = Number(settings?.watermarkScale ?? 100)

    const watermarkOpacity = Number.isFinite(opacityValue)
      ? Math.min(0.2, Math.max(0, opacityValue / 100))
      : 0.04

    const watermarkScale = Number.isFinite(scaleValue)
      ? Math.min(1.5, Math.max(0.3, scaleValue / 100))
      : 1

    const filterStyle =
      settings?.defaultPrintMode === "bw"
        ? "filter: grayscale(100%);"
        : ""

    const sriDoc = payment.taxDocuments?.[0]
    const invoiceNumber = sriDoc?.secuencial
    const isOfficialInvoice = Boolean(invoiceNumber)

    const documentNumber = safe(
      invoiceNumber ||
      payment.receiptNumber ||
      `REC-${payment.id.slice(-6).toUpperCase()}`
    )

    const documentTitle = isOfficialInvoice
      ? "Factura Electrónica"
      : "Comprobante de Pago"

    const plan = payment.treatmentPlan
    const planItems = plan?.items ?? []

    const commercialDiscount = validPercentage(
      plan?.commercialDiscount
    )
    const agreementDiscount = validPercentage(
      plan?.agreement?.discountValue
    )

    const globalDiscount =
      commercialDiscount > 0
        ? commercialDiscount
        : agreementDiscount

    const netPlanCost = planItems.reduce((sum, item) => {
      const cost = Number(item.cost ?? 0)
      const individual = validPercentage(item.discount)

      if (!Number.isFinite(cost) || cost < 0) return sum

      const discount =
        individual > 0 ? individual : globalDiscount

      return sum + cost * (1 - discount / 100)
    }, 0)

    const planPaid = Number(plan?.totalPaid ?? 0)

    const pendingBalance = Math.max(
      0,
      Math.round(
        (netPlanCost - (Number.isFinite(planPaid) ? planPaid : 0)) *
          100
      ) / 100
    )

    const isFullyPaid = Boolean(plan) &&
      pendingBalance <= 0.01

    const patientName = safe(
      payment.patient
        ? `${payment.patient.firstName || ""} ${payment.patient.lastName || ""}`.trim()
        : "Paciente General"
    )

    const patientDoc = safe(
      payment.patient?.ci || "No registrado"
    )

    const method = safe(
      paymentMethodLabel(payment.method)
    )

    const createdAt = new Date(payment.createdAt)

    const formattedDate = isValid(createdAt)
      ? format(
          createdAt,
          "dd 'de' MMMM 'de' yyyy - HH:mm",
          { locale: es }
        )
      : "Fecha no disponible"

    const paymentAmount = Number(payment.amount ?? 0)
    const validPaymentAmount = Number.isFinite(paymentAmount)
      ? paymentAmount
      : 0
    const cashierName = safe(
      payment.processedBy?.name || "Caja / Administración"
    )
    const planName = safe(
      plan?.name || "Tratamiento odontológico"
    )
    const appliedItems = readAppliedItems(payment.notes)
    const appliedTotal = appliedItems.reduce(
      (sum, item) => sum + item.appliedAmount,
      0
    )
    const hasValidBreakdown =
      appliedItems.length > 0 &&
      Math.abs(appliedTotal - validPaymentAmount) < 0.01

    const itemsHtml = hasValidBreakdown
      ? appliedItems.map(item => {
          const tooth = item.tooth
          const isToothNumber = /^\d+$/.test(tooth)

          return `
            <tr>
              <td>
                <div class="desc-title">${safe(item.procedureName)}</div>
                <div class="desc-sub">Plan: ${planName}</div>
              </td>
              <td class="region-cell">
                ${isToothNumber ? `Pieza ${safe(tooth)}` : safe(tooth)}
              </td>
              <td class="amount-cell">
                ${currency}&nbsp;${money(item.appliedAmount)}
              </td>
            </tr>`
        }).join("")
      : `
        <tr>
          <td>
            <div class="desc-title">
              Abono a Tratamiento Odontológico
            </div>
            <div class="desc-sub">Plan: ${planName}</div>
          </td>
          <td class="region-cell">General</td>
          <td class="amount-cell">
            ${currency}&nbsp;${money(validPaymentAmount)}
          </td>
        </tr>`

    const logoHtml = logoUrl
      ? `<img src="${safe(logoUrl)}" alt="Logo clínica" class="logo-img">`
      : ""

    const watermarkHtml = watermarkUrl
      ? `<div class="watermark-container">
           <img src="${safe(watermarkUrl)}" alt="">
         </div>`
      : ""

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safe(documentTitle)} - ${documentNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont,
        "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      background: #ffffff;
      color: #0f172a;
      padding: 30px;
      position: relative;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .watermark-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(${watermarkScale});
      width: 450px;
      height: 450px;
      opacity: ${watermarkOpacity};
      z-index: 0;
      pointer-events: none;
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
      max-width: 160px;
      object-fit: contain;
      ${filterStyle}
    }

    .clinic-brand {
      font-size: 26px;
      font-weight: 900;
      color: #008bcd;
      text-transform: uppercase;
      line-height: 1.1;
    }

    .clinic-sub {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 4px;
    }

    .clinic-info {
      font-size: 10px;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.5;
    }

    .receipt-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 15px 25px;
      text-align: right;
    }

    .receipt-title {
      font-size: 10px;
      font-weight: 800;
      color: #008bcd;
      text-transform: uppercase;
    }

    .receipt-number {
      font-size: ${isOfficialInvoice ? 16 : 20}px;
      font-weight: 900;
      margin-top: 4px;
    }

    .badge-paid {
      display: inline-block;
      padding: 3px 8px;
      border: 1px solid;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
      margin-top: 8px;
    }

    .info-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
    }

    .info-col {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .info-value {
      display: block;
      font-size: 14px;
      font-weight: 800;
      margin-top: 4px;
    }

    .table-container {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 30px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    thead {
      display: table-header-group;
    }

    thead th {
      background: #f8fafc;
      color: #475569;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    tbody td {
      padding: 16px;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
    }

    tbody tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    .desc-title {
      font-weight: 800;
    }

    .desc-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }

    .region-cell {
      text-align: center;
      font-weight: 700;
      color: #64748b;
    }

    .amount-cell {
      text-align: right;
      font-weight: 800;
      white-space: nowrap;
    }

    .total-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 50px;
      break-inside: avoid;
    }

    .total-box {
      background: #008bcd;
      padding: 20px 24px;
      border-radius: 16px;
      width: 320px;
      box-shadow: 0 4px 10px -2px rgba(0,139,205,.3);
    }

    .total-row,
    .pending-balance-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .total-label {
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
      text-transform: uppercase;
    }

    .total-amount {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      white-space: nowrap;
    }

    .pending-balance-row {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,.25);
      font-size: 11px;
      font-weight: 700;
      color: #ffffff;
    }

    .footer-section {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      break-inside: avoid;
      page-break-inside: avoid;
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
    }

    .legal-text {
      width: 55%;
      font-size: 10px;
      color: #64748b;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  ${watermarkHtml}

  <div class="content">
    <div class="header">
      <div class="logo-container">
        ${logoHtml}
        <div>
          <div class="clinic-brand">${clinicName}</div>
          <div class="clinic-sub">${clinicSlogan}</div>
          <div class="clinic-info">
            ${clinicRuc ? `RUC: ${clinicRuc}<br>` : ""}
            ${clinicAddress}<br>
            ${clinicEmail}
          </div>
        </div>
      </div>

      <div class="receipt-box">
        <div class="receipt-title">${safe(documentTitle)}</div>
        <div class="receipt-number">${documentNumber}</div>

        ${sriDoc?.accessKey ? `
          <div style="font-size:8px;color:#64748b;
            word-break:break-all;margin-top:4px">
            Aut: ${safe(sriDoc.accessKey)}
          </div>
        ` : ""}

        ${plan ? `
          <div class="badge-paid" style="${
            isFullyPaid
              ? "background:#d1fae5;color:#059669;border-color:#a7f3d0"
              : "background:#eff6ff;color:#008bcd;border-color:#bfdbfe"
          }">
            ${isFullyPaid
              ? "✓ PLAN TOTALMENTE SALDADO"
              : "PAGO APLICADO"}
          </div>
        ` : ""}
      </div>
    </div>

    <div class="info-grid">
      <div class="info-col">
        <div>
          <span class="info-label">Paciente</span>
          <span class="info-value">${patientName}</span>
        </div>
        <div>
          <span class="info-label">Identificación (CI/RUC)</span>
          <span class="info-value">${patientDoc}</span>
        </div>
      </div>

      <div class="info-col" style="text-align:right">
        <div>
          <span class="info-label">Fecha de Emisión</span>
          <span class="info-value">${safe(formattedDate)}</span>
        </div>
        <div>
          <span class="info-label">Método de Pago</span>
          <span class="info-value" style="color:#008bcd">
            ${method}
          </span>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Descripción de Prestación / Plan</th>
            <th style="text-align:center">Pieza Dental</th>
            <th style="text-align:right">Importe Pagado</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

    <div class="total-container">
      <div class="total-box">
        <div class="total-row">
          <span class="total-label">Total Pagado</span>
          <span class="total-amount">
            ${currency}&nbsp;${money(validPaymentAmount)}
          </span>
        </div>

        ${plan ? `
          <div class="pending-balance-row">
            <span>Saldo actual del plan:</span>
            <span style="white-space:nowrap">
              ${currency}&nbsp;${money(pendingBalance)}
            </span>
          </div>

          ${isFullyPaid ? `
            <div style="color:#d1fae5;font-size:10px;
              font-weight:700;margin-top:8px">
              ✓ Estado del plan: Totalmente saldado
            </div>
          ` : ""}
        ` : ""}
      </div>
    </div>

    <div class="footer-section">
      <div class="legal-text">
        Comprobante de recepción del importe indicado
        para las prestaciones o el tratamiento detallado.
        <br><br>
        <b>Atendido por:</b> ${cashierName}<br>
        <b>¡Gracias por confiar en ${clinicName}!</b>
      </div>

      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-text">
          Firma Autorizada - Caja
        </div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener("load", function () {
      window.setTimeout(function () {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": [
          "default-src 'none'",
          "base-uri 'none'",
          "form-action 'none'",
          "frame-ancestors 'self'",
          "img-src 'self' https:",
          "style-src 'unsafe-inline'",
          "script-src 'unsafe-inline'",
        ].join("; "),
      },
    })
  }
)
