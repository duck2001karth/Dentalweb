"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
}

export const triggerBalancePrint = (data: {
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
}) => {
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

  const clinicName = settings?.clinicName?.trim() || "CARMO DENTAL"
  const clinicSlogan = settings?.slogan?.trim() || "CLÍNICA DE SONRISA"
  const clinicRuc = settings?.ruc?.trim() || "1700000083134"
  const rawAddress = [settings?.address, settings?.city, settings?.country].filter(Boolean).join(", ")
  const clinicAddress = rawAddress || "Solanda, Av Jose Argudo, Quito, Ecuador"
  const clinicPhone = settings?.phone || settings?.whatsappNumber || "969834557"
  const clinicEmail = settings?.email || "patriciocapa61@gmail.com"
  
  const currencySymbol = "$"

  const logoUrl = settings?.logoUrl || "/logosn.png"
  const watermarkUrl = settings?.watermarkUrl || logoUrl
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 6) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)
  const isMonochrome = settings?.defaultPrintMode === "bw"
  
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })

  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "none"
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Estado de Cuenta - ${patientFullName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm; 
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            background: #ffffff;
            color: #1e293b;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .watermark-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(${watermarkScale});
            width: 420px;
            height: 420px;
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
            ${isMonochrome ? "filter: grayscale(100%);" : ""}
          }
          .content-wrapper {
            position: relative;
            z-index: 1;
            padding: 5mm 8mm;
          }
          
          /* HEADER */
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #008bcd;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .brand-box {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .logo-img {
            width: 60px;
            height: 60px;
            object-fit: contain;
            ${isMonochrome ? "filter: grayscale(100%);" : ""}
          }
          .clinic-title {
            font-size: 24px;
            font-weight: 800; /* Suavizado */
            color: #008bcd;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            line-height: 1.1;
          }
          .clinic-slogan {
            font-size: 10.5px;
            font-weight: 700; /* Suavizado */
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 3px;
          }
          .clinic-ruc {
            font-size: 10px;
            color: #475569;
            margin-top: 6px;
          }
          .right-badge-box {
            text-align: right;
          }
          .badge-outline {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 16px;
            display: inline-block;
          }
          .badge-text {
            font-size: 11px;
            font-weight: 800; /* Suavizado */
            color: #0f172a;
            text-transform: uppercase;
            line-height: 1.3;
          }
          .header-date {
            font-size: 10px;
            color: #475569;
            margin-top: 10px;
          }
          .header-date b {
            color: #1e293b;
          }

          /* TARJETA PACIENTE */
          .patient-card {
            display: flex;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 18px 20px;
            margin-bottom: 24px;
          }
          .patient-left {
            flex: 1.3;
          }
          .patient-right {
            flex: 1;
            border-left: 1px solid #e2e8f0;
            padding-left: 20px;
          }
          .label-text {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
          }
          .name-text {
            font-size: 16px;
            font-weight: 800; /* Suavizado */
            color: #1e293b;
            margin-top: 6px;
          }
          .meta-row {
            display: flex;
            margin-top: 12px;
            font-size: 11.5px;
            color: #475569;
          }
          .meta-col {
            width: 50%;
          }
          .meta-col-label {
            font-weight: 700;
            color: #475569;
            margin-bottom: 4px;
          }

          /* TARJETAS KPI */
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 30px;
          }
          .kpi-box {
            border-radius: 8px;
            padding: 14px 16px;
          }
          .kpi-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            line-height: 1.4;
          }
          .kpi-value {
            font-size: 18px;
            font-weight: 800; /* Suavizado */
            margin-top: 8px;
            letter-spacing: -0.5px;
          }

          /* TABLA */
          .table-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #008bcd;
            text-transform: uppercase;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
            /* La línea azul ahora está aquí, NO en la tabla, para evitar que se repita */
            border-bottom: 1.5px solid #008bcd; 
            padding-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
          }
          thead tr {
            border-bottom: 1px solid #cbd5e1;
          }
          th {
            padding: 8px 8px 12px 8px;
            text-align: left;
            font-weight: 700; /* Suavizado (antes 800) */
            color: #1e293b;
            text-transform: uppercase;
            font-size: 9.5px;
          }
          tbody tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          td {
            padding: 10px 8px;
            border-bottom: 1px solid #f1f5f9;
            color: #475569;
            vertical-align: top;
          }
          .td-date {
            color: #64748b;
            line-height: 1.4;
          }
          .td-num {
            font-weight: 700; /* Suavizado (antes 800) */
            color: #1e293b;
          }
          .td-desc {
            color: #334155;
            font-weight: 500;
          }
          .td-type-in {
            color: #059669;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 8.5px;
          }
          .td-type-out {
            color: #d97706;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 8.5px;
          }
          .td-amount {
            text-align: right;
            font-weight: 800; /* Suavizado (antes 900) */
            font-size: 11.5px;
            color: #1e293b;
          }

          /* FIRMAS Y FOOTER */
          .footer-section {
            padding-top: 80px; 
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .signatures-block {
            display: flex;
            justify-content: space-between;
            padding: 0 50px;
          }
          .sig-col {
            width: 220px;
            border-top: 1px solid #1e293b; /* Línea de firma más fina */
            text-align: center;
            padding-top: 6px;
          }
          .sig-name {
            font-size: 10px;
            font-weight: 800;
            color: #1e293b;
            text-transform: uppercase;
          }
          .sig-role {
            font-size: 9px;
            color: #64748b;
            margin-top: 4px;
          }
          .footer-info {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #008bcd; /* Línea azul sutil de 1px */
            text-align: center;
            font-size: 9.5px;
            color: #475569;
            line-height: 1.6;
          }
          .footer-info b {
            color: #1e293b;
          }
          .footer-italic {
            font-style: italic;
            font-size: 9px;
            color: #64748b;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="watermark-container">
          <img src="${watermarkUrl}" alt="" />
        </div>

        <div class="content-wrapper">
          
          <div class="header-container">
            <div class="brand-box">
              <img src="${logoUrl}" class="logo-img" alt="" onerror="this.style.display='none'" />
              <div>
                <div class="clinic-title">${clinicName}</div>
                <div class="clinic-slogan">${clinicSlogan}</div>
                <div class="clinic-ruc">RUC: ${clinicRuc} | ${clinicAddress}</div>
              </div>
            </div>
            <div class="right-badge-box">
              <div class="badge-outline">
                <div class="badge-text">ESTADO DE CUENTA<br/>FINANCIERO</div>
              </div>
              <div class="header-date">Fecha de Emisión: <b>${today}</b></div>
            </div>
          </div>

          <div class="patient-card">
            <div class="patient-left">
              <div class="label-text">DATOS DEL PACIENTE</div>
              <div class="name-text">${patientFullName}</div>
              <div class="meta-row">
                <div class="meta-col">
                  <div class="meta-col-label">Doc. Identidad:</div>
                  <div style="color: #475569;">${patientDocId}</div>
                </div>
                <div class="meta-col">
                  <div class="meta-col-label">Edad: <span style="font-weight: 400;">${patientAge}</span></div>
                  <div style="color: #475569;">Años</div>
                </div>
              </div>
            </div>
            <div class="patient-right">
              <div class="label-text">DETALLES DE EMISIÓN</div>
              <div class="name-text">${issuedBy}</div>
              <div style="font-size: 11.5px; color: #475569; margin-top: 12px;">
                <span style="font-weight: 700;">Tipo:</span> Consolidado de Pagos y<br/>Liquidación
              </div>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-box" style="border: 1px solid #e2e8f0;">
              <div class="kpi-label" style="color: #475569;">TOTAL COBRADO (+)</div>
              <div class="kpi-value" style="color: #1e293b;">
                ${currencySymbol}${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div class="kpi-box" style="border: 1px solid #fed7aa;">
              <div class="kpi-label" style="color: #c2410c;">NOTAS DE CRÉDITO<br/>(-)</div>
              <div class="kpi-value" style="color: #c2410c;">
                ${currencySymbol}${totalRefunds.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div class="kpi-box" style="border: 1px solid #bae6fd;">
              <div class="kpi-label" style="color: #0284c7;">BALANCE NETO<br/>PERCIBIDO</div>
              <div class="kpi-value" style="color: #0284c7;">
                ${currencySymbol}${netBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div class="kpi-box" style="border: 1px solid #bbf7d0;">
              <div class="kpi-label" style="color: #16a34a;">ESTADO CONTABLE</div>
              <div class="kpi-value" style="color: #16a34a;">
                ${pendingDebt > 0 ? `${currencySymbol}${pendingDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Al Día"}
              </div>
            </div>
          </div>

          <!-- TÍTULO CON LÍNEA AZUL INTEGRADA -->
          <div class="table-title">DETALLE DE MOVIMIENTOS DE CAJA Y PAGOS</div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 14%;">FECHA</th>
                <th style="width: 16%;">#<br/>COMPROBANTE</th>
                <th style="width: 28%;">CONCEPTO /<br/>PROCEDIMIENTO</th>
                <th style="width: 18%;">MEDIO</th>
                <th style="width: 10%; text-align: center;">TIPO</th>
                <th style="width: 14%; text-align: right;">MONTO</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">
                    Sin registros financieros.
                  </td>
                </tr>
              ` : transactions.map((tx: any) => {
                const isIncome = tx.type === "INCOME"
                const txDate = new Date(tx.date)
                const dateStr = format(txDate, "dd/MM/yyyy")
                const timeStr = format(txDate, "HH:mm")

                return `
                  <tr>
                    <td class="td-date">${dateStr}<br/>${timeStr}</td>
                    <td class="td-num">${tx.number}</td>
                    <td class="td-desc">${tx.description}</td>
                    <td class="td-date">${tx.method}</td>
                    <td style="text-align: center;">
                      <span class="${isIncome ? 'td-type-in' : 'td-type-out'}">
                        ${isIncome ? 'INGRESO' : 'AJUSTE / NC'}
                      </span>
                    </td>
                    <td class="td-amount">
                      ${isIncome ? '+' : '-'}${currencySymbol}${Math.abs(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                `
              }).join("")}
            </tbody>
          </table>

          <div class="footer-section">
            <div class="signatures-block">
              <div class="sig-col">
                <div class="sig-name">${patientFullName}</div>
                <div class="sig-role">Firma del Paciente / Titular</div>
              </div>
              <div class="sig-col">
                <div class="sig-name">${issuedBy}</div>
                <div class="sig-role">Firma / Sello de Caja y Recaudación</div>
              </div>
            </div>

            <div class="footer-info">
              <b>${clinicName} - ${clinicSlogan}</b><br/>
              Dirección: ${clinicAddress} • Cel.: ${clinicPhone} • Quito - Ecuador
              <div class="footer-italic">
                Documento emitido electrónicamente como comprobante de balance y conciliación.
              </div>
            </div>
          </div>

        </div>
      </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1500)
  }, 300)
}

export function BalancePrint(_props: BalancePrintProps) {
  return null
}