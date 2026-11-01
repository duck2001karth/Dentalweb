import { format } from "date-fns"
import { escapeHTML } from "@/lib/sanitize"
import { executePrintEngine } from "@/lib/print-engine"

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
  
  const clinicCurrency = escapeHTML(settings?.currency || "USD")
  const isOnlyTotal = printMode === "SOLO_TOTAL"
  const isNoDetail = printMode === "SIN_DETALLE"
  const isLabOrder = printMode === "LABORATORIO"
  
  const rawDoctorName = plan?.doctor?.name || "Profesional Asignado"
  const treatingDoctorFormatted = escapeHTML(rawDoctorName.toLowerCase().startsWith("dr") ? rawDoctorName : `Dr. ${rawDoctorName}`)
  const patientFullName = escapeHTML(patient ? `${patient.firstName} ${patient.lastName}` : "Paciente no registrado")
  const patientDoc = escapeHTML(patient?.ci || "--")
  const patientAgreement = escapeHTML(patient?.convenio || plan?.agreementName || "Particular")
  const docId = escapeHTML(plan?.id?.slice(-6)?.toUpperCase() || "PLAN")
  
  const safeCommentText = escapeHTML(commentText || "Validez del plan de tratamiento: 30 días calendario. Este presupuesto está sujeto a modificaciones tras evaluación clínica y radiográfica continua. Los valores expresados incluyen impuestos de ley aplicables.")
  const patientSignatureUrl = autoRecoveredSignature ? (getSignatureSrc ? getSignatureSrc(autoRecoveredSignature) : autoRecoveredSignature) : null

  // 1. Tarjeta Personalizada (Diseño 2 Columnas)
  const customPatientCard = `
    <style>
      .custom-card { display: grid; grid-template-columns: 1.2fr 1fr; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 20px; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; }
      .custom-col { padding: 10px 14px; }
      .custom-col:first-child { border-right: 1px solid #e2e8f0; }
      .c-label { font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
      .c-title { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px; text-transform: capitalize; }
      .c-sub { font-size: 10.5px; color: #475569; margin-top: 3px; }
    </style>
    <div class="custom-card">
      <div class="custom-col">
        <div class="c-label">Paciente</div>
        <div class="c-title">${patientFullName.toLowerCase()}</div>
        <div class="c-sub">
          <b>Doc.:</b> ${patientDoc} &nbsp; &nbsp; 
          <b>Edad:</b> ${patientAge ? `${escapeHTML(String(patientAge))} Años` : "--"}
        </div>
      </div>
      <div class="custom-col">
        <div class="c-label">Detalles del Plan</div>
        <div class="c-title" style="color: #008bcd;">${escapeHTML(plan?.name || "Presupuesto")}</div>
        <div class="c-sub"><b>Convenio / Cobertura:</b> ${patientAgreement}</div>
      </div>
    </div>
  `

  const rowsHtml = plan?.items && plan.items.length > 0
    ? plan.items.map((item: any) => {
        const itemDscto = Number(item.discount || 0)
        const cost = Number(item.cost || item.price || 0)
        const finalCost = cost - (cost * (itemDscto / 100))
        return `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px; font-weight: 700; color: #0f172a;">${escapeHTML(item.procedureName || item.name)}</td>
            <td style="padding: 10px; text-align: center; font-weight: 600; color: #475569;">${escapeHTML(item.tooth || item.region || "-")}</td>
            ${!isNoDetail && !isLabOrder ? `
              <td style="padding: 10px; text-align: center; color: #64748b;">${itemDscto > 0 ? `${itemDscto}%` : "-"}</td>
              <td style="padding: 10px; text-align: right; font-weight: 700; font-family: monospace; font-size: 11.5px;">${clinicCurrency}${finalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            ` : ""}
          </tr>
        `
      }).join("")
    : `<tr><td colspan="4" style="text-align: center; padding: 30px; font-style: italic; color: #94a3b8; font-size: 11px;">No hay prestaciones registradas en este documento.</td></tr>`

  const bodyHtml = `
    ${customPatientCard}
    
    <div style="font-size: 10px; font-weight: 900; color: #008bcd; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
      ${isLabOrder ? "Especificaciones de Laboratorio" : isOnlyTotal ? "Resumen General" : "Desglose de Tratamientos"}
    </div>
    
    ${!isOnlyTotal ? `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; text-align: left;">
        <thead>
          <tr style="background-color: #f8fafc; color: #008bcd; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border-top: 2px solid rgba(0, 139, 205, 0.2); border-bottom: 2px solid rgba(0, 139, 205, 0.2);">
            <th style="padding: 10px;">Prestación / Procedimiento</th>
            <th style="padding: 10px; text-align: center; width: 100px;">Región</th>
            ${!isNoDetail && !isLabOrder ? `
              <th style="padding: 10px; text-align: center; width: 80px;">Dscto</th>
              <th style="padding: 10px; text-align: right; width: 120px;">Importe</th>
            ` : ""}
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    ` : ""}

    ${!isLabOrder ? `
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px; page-break-inside: avoid; break-inside: avoid;">
        <div style="width: 320px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px;">
          ${!isOnlyTotal && !isNoDetail ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>Subtotal</span>
              <span style="font-family: monospace; color: #0f172a; font-size: 12px;">${clinicCurrency} ${Number(baseTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            ${discountPercent > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #059669; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                <span>Dscto Global (${discountPercent}%)</span>
                <span style="font-family: monospace; font-size: 12px;">- ${clinicCurrency}${Number(discountAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ""}
          ` : ""}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 2px solid rgba(0, 139, 205, 0.2);">
            <span style="font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Total</span>
            <span style="font-size: 18px; font-weight: 900; color: #008bcd; font-family: monospace;">${clinicCurrency}${Number(finalTotalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    ` : ""}

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 9.5px; color: #475569; font-style: italic; line-height: 1.5; margin-bottom: 24px;">
      <div style="font-size: 9px; font-weight: 800; color: #008bcd; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-style: normal;">Observaciones / Condiciones</div>
      ${safeCommentText}
    </div>
  `

  const patientSigHtml = patientSignatureUrl
    ? `<img src="${patientSignatureUrl}" style="max-height: 50px; max-width: 100%; object-fit: contain; mix-blend-mode: multiply;" alt="Firma Paciente" />`
    : `<span style="font-size: 9px; color: #94a3b8; font-style: italic;">Pendiente de firma digital</span>`

  const footerHtml = `
    <div style="margin-top: auto; padding-top: 20px; page-break-inside: avoid; break-inside: avoid;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center;">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="height: 60px; width: 220px; border-bottom: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
            ${patientSigHtml}
          </div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: capitalize;">${patientFullName.toLowerCase()}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">C.I.: ${patientDoc}</div>
          <div style="font-size: 8.5px; color: #94a3b8; font-weight: 600; margin-top: 2px;">Firma del Paciente / Tutor Legal</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="height: 60px; width: 220px; border-bottom: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;"></div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: capitalize;">${treatingDoctorFormatted.toLowerCase()}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${escapeHTML(plan?.doctor?.specialty || plan?.doctor?.specialization || "Odontología General")}</div>
          <div style="font-size: 8.5px; color: #94a3b8; font-weight: 600; margin-top: 2px;">Firma y Sello del Profesional</div>
        </div>
      </div>
    </div>
  `

  executePrintEngine({
    title: isLabOrder ? "Orden de Laboratorio" : "Presupuesto",
    documentTypeBadge: isLabOrder ? "ORDEN EXTERNA" : "PLAN DE TRATAMIENTO",
    patient: undefined,
    settings,
    bodyHtml,
    footerHtml,
    showSignature: false, // Inyectamos 2 firmas en footerHtml
  })
}