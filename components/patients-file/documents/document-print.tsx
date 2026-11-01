import { format } from "date-fns"
import { es } from "date-fns/locale"
import { escapeHTML } from "@/lib/sanitize"
import { executePrintEngine } from "@/lib/print-engine"

interface PrintClinicalDocOptions {
  document: any
  patientFullName: string
  patientAge?: string | number
  patientDocId?: string
  doctorSpecialty?: string
  doctorLicense?: string
  settings?: any
}

// Función para asegurar que la firma sea una imagen base64 válida
function sanitizeSig(sig?: string | null): string | null {
  if (!sig || typeof sig !== "string") return null
  const clean = sig.trim()
  if (clean.length < 50) return null
  if (clean.startsWith("data:image/") || clean.startsWith("http")) return clean
  return `data:image/png;base64,${clean}`
}

export function printClinicalDocSheet({
  document: doc,
  patientFullName,
  patientAge,
  patientDocId,
  doctorSpecialty = "Odontología General",
  doctorLicense = "",
  settings,
}: PrintClinicalDocOptions) {
  if (!doc) return

  const formattedDate = format(
    new Date(doc.createdAt || new Date()),
    "dd 'de' MMMM 'de' yyyy, HH:mm",
    { locale: es }
  )

  const rawDoctor = doc.specialistName || doc.author?.name || "Dr. Especialista"
  const activeDoctorName = escapeHTML(rawDoctor.startsWith("Dr") ? rawDoctor : `Dr. ${rawDoctor}`)
  const activeSpecialty = escapeHTML(doc.author?.specialty || doctorSpecialty)
  const activeLicense = escapeHTML(
    doc.author?.professionalCard || 
    doc.author?.licenseNumber || 
    doctorLicense || 
    "S/N"
  )

  const docIdShort = doc.id ? doc.id.substring(0, 8).toUpperCase() : "DOC-LEGAL"

  const patientSigUrl = sanitizeSig(doc.patientSignature)
  const doctorSigUrl = sanitizeSig(doc.doctorSignature || doc.author?.signatureBase64)
  const clinicName = escapeHTML(settings?.clinicName?.trim() || "Carmo Dental")

  const customPatientCard = `
    <style>
      .custom-patient-card { display: grid; grid-template-columns: 1.2fr 1fr; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 16px; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; }
      .custom-patient-col { padding: 10px 14px; }
      .custom-patient-col:first-child { border-right: 1px solid #e2e8f0; }
      .c-label { font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
      .c-title { font-size: 13.5px; font-weight: 800; color: #0f172a; margin-top: 2px; }
      .c-sub { font-size: 10.5px; color: #334155; margin-top: 3px; }
    </style>
    <div class="custom-patient-card">
      <div class="custom-patient-col">
        <div class="c-label">Datos del Paciente</div>
        <div class="c-title">${escapeHTML(patientFullName)}</div>
        <div class="c-sub">
          <b>Doc. Identidad:</b> ${escapeHTML(patientDocId || "No registrado")} &nbsp; &nbsp; 
          <b>Edad:</b> ${patientAge ? `${escapeHTML(String(patientAge))} Años` : "--"}
        </div>
      </div>
      <div class="custom-patient-col">
        <div class="c-label">Profesional Tratante</div>
        <div class="c-title">${activeDoctorName}</div>
        <div class="c-sub">
          <b>Especialidad:</b> ${activeSpecialty} &nbsp; &nbsp;
          <b>Matrícula:</b> ${activeLicense}
        </div>
      </div>
    </div>
  `

  const bodyHtml = `
    ${customPatientCard}
    <div style="margin-top: 15px; margin-bottom: 25px;">
      <div style="font-size: 14px; font-weight: 900; color: #008bcd; border-left: 3.5px solid #008bcd; padding-left: 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: -0.2px; page-break-inside: avoid; break-inside: avoid;">
        ${escapeHTML(doc.title || "Consentimiento Informado")}
      </div>
      <div style="font-size: 10.5px; color: #1e293b; line-height: 1.55; white-space: pre-wrap; text-align: justify;">
        ${doc.content}
      </div>
    </div>
  `

  const patientSigHtml = patientSigUrl
    ? `<img src="${patientSigUrl}" style="height: 52px; max-width: 170px; object-fit: contain; margin-bottom: -5px;" alt="Firma Paciente" />`
    : `<div style="height: 52px;"></div>`

  const docSigHtml = doctorSigUrl
    ? `<img src="${doctorSigUrl}" style="height: 52px; max-width: 170px; object-fit: contain; margin-bottom: -5px;" alt="Firma Doctor" />`
    : `<div style="height: 52px;"></div>`

  const footerHtml = `
    <div style="margin-top: 32px; padding-top: 10px; page-break-inside: avoid; break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-bottom: 20px;">
        
        <!-- Firma Paciente -->
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-height: 75px;">
          ${patientSigHtml}
          <div style="width: 100%; border-top: 1.5px solid #0f172a; padding-top: 5px;">
            <div style="font-size: 10px; font-weight: 800; color: #0f172a;">${escapeHTML(patientFullName)}</div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">Firma del Paciente / Tutor Legal (C.I.: ${escapeHTML(patientDocId || "S/N")})</div>
          </div>
        </div>

        <!-- Firma Profesional -->
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-height: 75px;">
          ${docSigHtml}
          <div style="width: 100%; border-top: 1.5px solid #0f172a; padding-top: 5px;">
            <div style="font-size: 10px; font-weight: 800; color: #0f172a;">${activeDoctorName}</div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">Matrícula / Reg. MSP: ${activeLicense}</div>
          </div>
        </div>

      </div>

      <div style="text-align: center; margin-top: 20px; padding-top: 8px; border-top: 1px solid #008bcd; font-size: 7.5px; color: #94a3b8; page-break-inside: avoid; break-inside: avoid;">
        Documento emitido electrónicamente por el Sistema Clínico ${clinicName} (REF: ${docIdShort} - ${formattedDate}). Registrado bajo estándares de auditoría legal. Válido sin tachaduras ni enmendaduras.
      </div>
    </div>
  `

  executePrintEngine({
    title: "Documento Clínico",
    documentTypeBadge: "CONSENTIMIENTO LEGAL",
    patient: undefined, 
    settings,
    bodyHtml,
    footerHtml, 
    showSignature: false, 
  })
}