import { format, differenceInYears } from "date-fns"
import { es } from "date-fns/locale"
import { executePrintEngine } from "@/lib/print-engine"
import { escapeHTML } from "@/lib/sanitize"

interface PrintHistorialOptions {
  patient: any
  notes: any[]
  doctorName?: string
  doctorSpecialty?: string
  doctorLicense?: string
  settings?: any
}

const calculateAge = (birthDate: string | Date | undefined | null) => {
  if (!birthDate) return "--"
  try {
    return differenceInYears(new Date(), new Date(birthDate))
  } catch {
    return "--"
  }
}

export function printHistorialSheet({
  patient,
  notes = [],
  doctorName,
  doctorSpecialty = "Odontología General",
  doctorLicense = "",
  settings,
}: PrintHistorialOptions) {
  if (!patient) return

  const patientFullName = escapeHTML(`${patient.firstName || ""} ${patient.lastName || ""}`.trim())
  const patientDocId = escapeHTML(patient.ci || "No registrado")
  const patientAge = calculateAge(patient.birthDate)
  const activeDoctorName = escapeHTML(doctorName ? (doctorName.startsWith("Dr") ? doctorName : `Dr. ${doctorName}`) : "Especialista")

  // 1. Tarjeta personalizada idéntica a la Imagen 1
  const customPatientCard = `
    <style>
      .custom-patient-card { display: grid; grid-template-columns: 1.2fr 1fr; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 16px; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; }
      .custom-patient-col { padding: 10px 14px; }
      .custom-patient-col:first-child { border-right: 1px solid #e2e8f0; }
      .c-label { font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
      .c-title { font-size: 13.5px; font-weight: 800; color: #0f172a; margin-top: 2px; }
      .c-sub { font-size: 10.5px; color: #334155; margin-top: 3px; }
      .c-alert { display: inline-block; color: #e11d48; font-weight: 700; font-size: 9.5px; margin-top: 5px; background: #ffe4e6; padding: 2px 7px; border-radius: 6px; }
    </style>
    <div class="custom-patient-card">
      <div class="custom-patient-col">
        <div class="c-label">Datos del Paciente</div>
        <div class="c-title">${patientFullName}</div>
        <div class="c-sub">
          <b>Identificación:</b> ${patientDocId} &nbsp; &nbsp; 
          <b>Edad:</b> ${patientAge !== "--" ? `${patientAge} Años` : "--"}
        </div>
        ${patient.medicalAlerts ? `<div class="c-alert">Alerta Médica: ${escapeHTML(patient.medicalAlerts)}</div>` : ""}
      </div>
      <div class="custom-patient-col">
        <div class="c-label">Profesional Responsable</div>
        <div class="c-title">${activeDoctorName}</div>
        <div class="c-sub"><b>Especialidad:</b> ${escapeHTML(doctorSpecialty)}</div>
        ${doctorLicense ? `<div class="c-sub"><b>Matrícula / Reg. MSP:</b> ${escapeHTML(doctorLicense)}</div>` : ""}
      </div>
    </div>
  `

  const formatNoteBody = (note: any) => {
    if (note.type === "PRESCRIPTION") {
      try {
        const data = typeof note.content === "string" && note.content.startsWith("{")
            ? JSON.parse(note.content)
            : { medications: note.content }
        return `
          <div style="margin-top: 6px; font-size: 11px;">
            ${data.medications ? `
              <div style="margin-bottom: 6px;">
                <div style="font-weight: 800; color: #008bcd; font-size: 10px; margin-bottom: 2px;">R.P. (Medicamentos)</div>
                <div style="color: #0f172a; padding-left: 4px; white-space: pre-wrap;">${escapeHTML(data.medications)}</div>
              </div>
            ` : ""}
            ${data.indications ? `
              <div style="border-top: 1px solid #f1f5f9; padding-top: 4px; margin-top: 4px;">
                <div style="font-weight: 800; color: #008bcd; font-size: 10px; margin-bottom: 2px;">Indicaciones</div>
                <div style="color: #334155; padding-left: 4px; white-space: pre-wrap;">${escapeHTML(data.indications)}</div>
              </div>
            ` : ""}
            ${data.observations ? `
              <div style="border-top: 1px dashed #f1f5f9; padding-top: 4px; margin-top: 4px;">
                <div style="font-weight: 800; color: #d97706; font-size: 10px; margin-bottom: 2px;">Observaciones</div>
                <div style="color: #475569; padding-left: 4px;">${escapeHTML(data.observations)}</div>
              </div>
            ` : ""}
          </div>
        `
      } catch {
        return `<div style="font-size: 11px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${escapeHTML(note.content)}</div>`
      }
    }
    return `<div style="font-size: 11px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${escapeHTML(note.content)}</div>`
  }

  const rowsHtml = notes.length === 0
    ? `<div style="text-align:center; padding: 40px; color:#64748b; font-size:11px; font-style:italic;">No hay registros clínicos para este paciente.</div>`
    : notes.map((note: any, index: number) => {
        const isEvolution = note.type === "EVOLUTION"
        const isPrescription = note.type === "PRESCRIPTION"
        const codeId = `#${note.id?.slice(-4).toUpperCase() || (notes.length - index).toString().padStart(2, "0")}`
        
        const rawDate = note.date || note.createdAt
        const noteDate = rawDate ? format(new Date(rawDate), "dd MMM yyyy - HH:mm", { locale: es }) : "-"
        
        const typeLabel = isEvolution ? `Evolución Clínica ${codeId}` : isPrescription ? `Receta Médica ${codeId}` : `Documento / Rx ${codeId}`
        const noteDocName = note.author?.name ? `Dr. ${note.author.name.replace(/^Dr\.\s*/i, "")}` : activeDoctorName
        
        return `
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; background: #ffffff; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">
              <div>
                <span style="font-size: 11px; font-weight: 800; color: #008bcd;">${typeLabel}</span>
                <span style="font-size: 10px; color: #334155; font-weight: 600; margin-left: 6px;">| ${escapeHTML(noteDocName)}</span>
              </div>
              <span style="font-size: 9px; color: #475569; font-family: monospace; background: #f1f5f9; padding: 2px 7px; border-radius: 5px;">${noteDate}</span>
            </div>
            <div>
              ${formatNoteBody(note)}
            </div>
            ${note.fileUrl ? `
              <div style="margin: 8px 0; max-width: 220px;">
                <img src="${note.fileUrl}" alt="Adjunto" style="max-height: 110px; border-radius: 6px; border: 1px solid #e2e8f0; object-fit: contain; display: block;" />
              </div>
            ` : ""}
          </div>
        `
      }).join("")

  const bodyHtml = `
    ${customPatientCard}
    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 5px; margin-bottom: 12px; border-bottom: 1.5px solid #008bcd; page-break-inside: avoid;">
      <div style="font-size: 11px; font-weight: 800; color: #008bcd; text-transform: uppercase; letter-spacing: 0.3px;">
        Línea de Tiempo de Intervenciones Clínicas
      </div>
      <div style="font-size: 9.5px; font-weight: 700; color: #64748b;">
        ${notes.length} Registro(s)
      </div>
    </div>
    <div style="display: flex; flex-direction: column;">
      ${rowsHtml}
    </div>
  `

  executePrintEngine({
    title: "Historial Clínico Integral",
    documentTypeBadge: "EXPEDIENTE HISTÓRICO",
    patient: undefined, 
    settings,
    bodyHtml,
    doctorName,
    specialty: doctorSpecialty,
    showSignature: false 
  })
}