import { format } from "date-fns"

export type PrintMode = "COMPLETO" | "SOLO_TOTAL" | "SIN_DETALLE" | "LABORATORIO"

interface PrintTreatmentOptions {
  plan: any
  patient: any
  patientAge?: number | string
  baseTotal: number
  discountPercent: number
  discountAmount: number
  finalTotalCost: number
  commentText?: string
  autoRecoveredSignature?: string
  getSignatureSrc?: (signature: string) => string
  printMode?: PrintMode
  settings?: any
}

const escapeHTML = (str?: string | number | null) => {
  if (str === null || str === undefined) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function printTreatmentPlanSheet({
  plan,
  patient,
  patientAge,
  baseTotal,
  discountPercent,
  discountAmount,
  finalTotalCost,
  commentText,
  autoRecoveredSignature,
  getSignatureSrc,
  printMode = "COMPLETO",
  settings,
}: PrintTreatmentOptions) {
  
  const clinicName = escapeHTML(settings?.clinicName?.trim() || "Clinica")
  const clinicSlogan = escapeHTML(settings?.slogan?.trim() || "C...")
  const clinicHolder = escapeHTML(settings?.razonSocial?.trim() || "Dr. Especialista")
  const clinicRuc = escapeHTML(settings?.ruc?.trim() || "")
  const clinicCurrency = escapeHTML(settings?.currency || "USD")
  
  const rawAddress = settings?.address?.trim()
  const rawCity = settings?.city?.trim()
  const rawCountry = settings?.country?.trim()
  const clinicAddress = escapeHTML([rawAddress, rawCity, rawCountry].filter(Boolean).join(", ") || "Quito, Ecuador")

  const isMonochrome = settings?.defaultPrintMode === "bw"
  const filterStyle = isMonochrome ? "filter: grayscale(100%);" : ""
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 6) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)
  const logoUrl = settings?.logoUrl || "/logosn.png"
  const watermarkUrl = settings?.watermarkUrl || settings?.logoUrl || "/logosn.png"

  const isOnlyTotal = printMode === "SOLO_TOTAL"
  const isNoDetail = printMode === "SIN_DETALLE"
  const isLabOrder = printMode === "LABORATORIO"

  const formattedDate = format(new Date(), "dd/MM/yyyy")
  const rawDoctorName = plan?.doctor?.name || "Profesional Asignado"
  const treatingDoctorFormatted = escapeHTML(
    rawDoctorName.toLowerCase().startsWith("dr") ? rawDoctorName : `Dr. ${rawDoctorName}`
  )

  const patientFullName = escapeHTML(patient ? `${patient.firstName} ${patient.lastName}` : "Paciente no registrado")
  const patientDoc = escapeHTML(patient?.ci || "--")
  const patientAgreement = escapeHTML(patient?.convenio || plan?.agreementName || "Particular")
  const safeCommentText = escapeHTML(commentText || "Validez del plan de tratamiento: 30 días calendario. Este presupuesto está sujeto a modificaciones tras evaluación clínica y radiográfica continua. Los valores expresados incluyen impuestos de ley aplicables.")
  
  const docId = escapeHTML(plan?.id?.slice(-6)?.toUpperCase() || "PLAN")
  const patientSignatureUrl = autoRecoveredSignature
    ? (getSignatureSrc ? getSignatureSrc(autoRecoveredSignature) : autoRecoveredSignature)
    : null

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Presupuesto - ${patientFullName}</title>
      <style>
        @page { size: A4 portrait; margin: 0mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        html, body { width: 100%; height: 100%; background: #ffffff; color: #0f172a; }
        .sheet { position: relative; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 16mm 18mm 14mm 18mm; display: flex; flex-direction: column; overflow: hidden; }
        .watermark-bg { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(${watermarkScale}); width: 450px; max-height: 450px; opacity: ${watermarkOpacity}; z-index: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; mix-blend-mode: multiply; }
        .watermark-bg img { width: 100%; height: 100%; object-fit: contain; ${filterStyle} }
        .document-body { position: relative; z-index: 10; flex: 1; display: flex; flex-direction: column; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 12px; margin-bottom: 16px; border-bottom: 2px solid #008bcd; }
        .header-left { display: flex; align-items: center; gap: 14px; }
        .logo { max-height: 52px; max-width: 150px; object-fit: contain; ${filterStyle} }
        .clinic-brand { font-size: 20px; font-weight: 900; color: #008bcd; letter-spacing: -0.3px; line-height: 1.1; text-transform: uppercase; }
        .clinic-slogan { font-size: 10px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
        .clinic-meta { font-size: 9px; color: #64748b; margin-top: 2px; }
        .header-right { text-align: right; }
        .holder-name { font-size: 11px; font-weight: 900; color: #008bcd; text-transform: uppercase; letter-spacing: 0.5px; }
        .holder-ruc { font-size: 9px; font-weight: 700; color: #334155; margin-top: 2px; }
        .doc-meta { margin-top: 6px; display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 9px; color: #64748b; }
        .doc-badge { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; }
        .patient-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .patient-info .label { font-size: 8.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .patient-info .name { font-size: 14.5px; font-weight: 800; color: #0f172a; text-transform: capitalize; margin-top: 2px; }
        .patient-details { display: flex; gap: 20px; font-size: 10.5px; color: #475569; }
        .patient-details span { color: #94a3b8; font-weight: 500; }
        .patient-details b { color: #334155; font-weight: 700; }
        .alert-badge { margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; color: #e11d48; font-size: 9px; font-weight: 700; }
        .section-title { font-size: 10px; font-weight: 900; color: #008bcd; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background-color: #f8fafc; color: #008bcd; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px; border-top: 2px solid rgba(0, 139, 205, 0.2); border-bottom: 2px solid rgba(0, 139, 205, 0.2); }
        td { padding: 10px; font-size: 11px; color: #1e293b; border-bottom: 1px solid #f1f5f9; }
        .td-name { font-weight: 700; color: #0f172a; }
        .td-region { text-align: center; font-weight: 600; color: #475569; }
        .td-disc { text-align: center; color: #64748b; }
        .td-price { text-align: right; font-weight: 700; font-family: monospace; font-size: 11.5px; }
        .empty-row { text-align: center; padding: 30px; font-style: italic; color: #94a3b8; font-size: 11px; }
        .totals-wrapper { display: flex; justify-content: flex-end; margin-bottom: 30px; page-break-inside: avoid; }
        .totals-box { width: 320px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; }
        .total-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .total-row.discount { color: #059669; }
        .total-val { font-family: monospace; color: #0f172a; font-size: 12px; }
        .total-val.discount { color: #059669; }
        .final-total { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 2px solid rgba(0, 139, 205, 0.2); }
        .final-total .label { font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
        .final-total .val { font-size: 18px; font-weight: 900; color: #008bcd; font-family: monospace; }
        .footer-section { margin-top: auto; padding-top: 20px; border-top: 1px solid #e2e8f0; page-break-inside: avoid; }
        .observations { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 9.5px; color: #475569; font-style: italic; line-height: 1.5; margin-bottom: 24px; }
        .obs-title { font-size: 9px; font-weight: 800; color: #008bcd; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-style: normal; }
        .signatures-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; }
        .sig-box { display: flex; flex-direction: column; align-items: center; }
        .sig-line { height: 60px; width: 220px; border-bottom: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
        .sig-img { max-height: 50px; max-width: 100%; object-fit: contain; mix-blend-mode: multiply; }
        .sig-pending { font-size: 9px; color: #94a3b8; font-style: italic; }
        .sig-name { font-size: 11px; font-weight: 800; color: #0f172a; text-transform: capitalize; }
        .sig-id { font-size: 9px; color: #64748b; margin-top: 2px; }
        .sig-role { font-size: 8.5px; color: #94a3b8; font-weight: 600; margin-top: 2px; }
        .legal-footer { text-align: center; margin-top: 24px; font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="watermark-bg"><img src="${watermarkUrl}" alt="" /></div>
        <div class="document-body">
          <div class="header">
            <div class="header-left">
              <img src="${logoUrl}" class="logo" alt="Logo" onerror="this.style.display='none'" />
              <div>
                <div class="clinic-brand">${clinicName}</div>
                <div class="clinic-slogan">${isLabOrder ? "Orden de Trabajo de Laboratorio" : clinicSlogan}</div>
                <div class="clinic-meta">${clinicAddress}</div>
              </div>
            </div>
            <div class="header-right">
              <div class="holder-name">${clinicHolder}</div>
              ${clinicRuc ? `<div class="holder-ruc">RUC: ${clinicRuc}</div>` : ""}
              <div class="doc-meta">
                <span>Emisión: <b style="color: #0f172a;">${formattedDate}</b></span>
                <span class="doc-badge">#${docId}</span>
              </div>
            </div>
          </div>
          <div class="patient-card">
            <div class="patient-info">
              <div class="label">Paciente</div>
              <div class="name">${patientFullName.toLowerCase()}</div>
            </div>
            <div>
              <div class="patient-details">
                <div><span>Doc.:</span> <b>${patientDoc}</b></div>
                <div><span>Edad:</span> <b>${patientAge ? `${escapeHTML(patientAge)} años` : "--"}</b></div>
                <div><span>Convenio:</span> <b>${patientAgreement}</b></div>
              </div>
              ${patient?.medicalAlerts ? `<div class="alert-badge">⚠️ Alerta Médica: ${escapeHTML(patient.medicalAlerts)}</div>` : ""}
            </div>
          </div>
          <div class="section-title">
            ${isLabOrder ? "Especificaciones de Laboratorio" : isOnlyTotal ? "Resumen General" : "Desglose de Tratamientos"}
          </div>
          ${!isOnlyTotal ? `
            <table>
              <thead>
                <tr>
                  <th>Prestación / Procedimiento</th>
                  <th style="text-align: center; width: 100px;">Región</th>
                  ${!isNoDetail && !isLabOrder ? `
                    <th style="text-align: center; width: 80px;">Dscto</th>
                    <th style="text-align: right; width: 120px;">Importe</th>
                  ` : ""}
                </tr>
              </thead>
              <tbody>
                ${plan?.items && plan.items.length > 0
                   ? plan.items.map((item: any) => {
                      const itemDscto = Number(item.discount || 0)
                      const cost = Number(item.cost || item.price || 0)
                      const finalCost = cost - (cost * (itemDscto / 100))
                      return `
                        <tr>
                          <td class="td-name">${escapeHTML(item.procedureName || item.name)}</td>
                          <td class="td-region">${escapeHTML(item.tooth || item.region || "-")}</td>
                          ${!isNoDetail && !isLabOrder ? `
                            <td class="td-disc">${itemDscto > 0 ? `${itemDscto}%` : "-"}</td>
                            <td class="td-price">${clinicCurrency}${finalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          ` : ""}
                        </tr>
                      `
                    }).join("")
                  : `<tr><td colspan="4" class="empty-row">No hay prestaciones registradas en este documento.</td></tr>`
                }
              </tbody>
            </table>
          ` : ""}
          ${!isLabOrder ? `
            <div class="totals-wrapper">
              <div class="totals-box">
                ${!isOnlyTotal && !isNoDetail ? `
                  <div class="total-row">
                    <span>Subtotal</span>
                    <span class="total-val">${clinicCurrency} ${Number(baseTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  ${discountPercent > 0 ? `
                    <div class="total-row discount">
                      <span>Dscto Global (${discountPercent}%)</span>
                      <span class="total-val discount">- ${clinicCurrency}${Number(discountAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ` : ""}
                ` : ""}
                <div class="final-total">
                  <span class="label">Total</span>
                  <span class="val">${clinicCurrency}${Number(finalTotalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          ` : ""}
        </div>
        <div class="footer-section">
          <div class="observations">
            <div class="obs-title">Observaciones / Condiciones</div>
            ${safeCommentText}
          </div>
          <div class="signatures-grid">
            <div class="sig-box">
              <div class="sig-line">
                ${patientSignatureUrl
                   ? `<img src="${patientSignatureUrl}" class="sig-img" alt="Firma Paciente" />`
                   : `<span class="sig-pending">Pendiente de firma digital</span>`
                }
              </div>
              <div class="sig-name">${patientFullName.toLowerCase()}</div>
              <div class="sig-id">C.I.: ${patientDoc}</div>
              <div class="sig-role">Firma del Paciente / Tutor Legal</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-name">${treatingDoctorFormatted.toLowerCase()}</div>
              <div class="sig-id">${escapeHTML(plan?.doctor?.specialty || plan?.doctor?.specialization || "Odontología General")}</div>
              <div class="sig-role">Firma y Sello del Profesional</div>
            </div>
          </div>
          <div class="legal-footer">
            Documento generado por ${clinicName} válido para trámite interno y personal.
          </div>
        </div>
      </div>
    </body>
    </html>`

  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "none"
  document.body.appendChild(iframe)

  const printDoc = iframe.contentWindow?.document
  if (printDoc) {
    printDoc.open()
    printDoc.write(htmlContent)
    printDoc.close()

    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1500)
    }, 400)
  }
}