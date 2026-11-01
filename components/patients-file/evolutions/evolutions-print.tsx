import { format, differenceInYears } from "date-fns"
import { escapeHTML } from "@/lib/sanitize"
import { executePrintEngine } from "@/lib/print-engine"

interface EvolutionItem {
  id?: string
  date?: string
  time?: string
  doctor?: string
  procedure?: string
  notes?: string
  observations?: string
  tooth?: string | number
  status?: string
  nextAppointment?: string
}

interface PrintEvolutionsOptions {
  patient: any
  evolutions: EvolutionItem[]
  doctorName?: string
  specialty?: string
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

export function printEvolutionsSheet({
  patient,
  evolutions = [],
  doctorName = "Especialista Tratante",
  specialty = "Odontología General",
  doctorLicense = "",
  settings,
}: PrintEvolutionsOptions) {
  if (!patient) return

  const patientFullName = escapeHTML(`${patient.firstName || ""} ${patient.lastName || ""}`.trim())
  const patientDocId = escapeHTML(patient.ci || "No registrado")
  const patientAge = calculateAge(patient.birthDate)
  const activeDoctorName = escapeHTML(doctorName.startsWith("Dr") ? doctorName : `Dr. ${doctorName}`)

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
        <div class="c-sub"><b>Especialidad:</b> ${escapeHTML(specialty)}</div>
        ${doctorLicense ? `<div class="c-sub"><b>Matrícula / Reg. MSP:</b> ${escapeHTML(doctorLicense)}</div>` : ""}
      </div>
    </div>
  `

  const evolutionsHtml = evolutions.length > 0
    ? evolutions.map((evo) => {
        const evoDate = evo.date ? format(new Date(evo.date), "dd/MM/yyyy") : "--"
        const evoTime = escapeHTML(evo.time || "")
        const evoDoctor = escapeHTML(evo.doctor || doctorName)
        const evoProc = escapeHTML(evo.procedure || "Atención Odontológica")
        const evoTooth = evo.tooth ? `Pieza ${escapeHTML(evo.tooth.toString())}` : "General"
        const evoNotes = escapeHTML(evo.notes || evo.observations || "Sin notas registradas.")
        const evoNext = evo.nextAppointment ? escapeHTML(evo.nextAppointment) : null

        return `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; page-break-inside: avoid; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #f1f5f9; color: #334155; font-weight: 800; font-size: 9.5px; padding: 2px 6px; border-radius: 4px;">${evoDate} ${evoTime ? `- ${evoTime}` : ""}</span>
                <span style="color: #008bcd; font-weight: 700; font-size: 10px;">${evoTooth}</span>
                <span style="font-weight: 800; font-size: 10.5px; color: #0f172a;">${evoProc}</span>
              </div>
              <div style="font-size: 9.5px; color: #64748b;">
                Atendido por: <b>${evoDoctor}</b>
              </div>
            </div>
            <div style="font-size: 11px; color: #334155; line-height: 1.5; white-space: pre-wrap;">
              ${evoNotes}
            </div>
            ${evoNext ? `
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #f1f5f9; font-size: 9.5px; color: #64748b;">
                Próxima Cita / Indicación: <b>${evoNext}</b>
              </div>
            ` : ""}
          </div>
        `
      }).join("")
    : `<div style="text-align: center; padding: 30px; color: #94a3b8; font-style: italic; font-size: 11px;">No se registran notas de evolución clínica en este expediente.</div>`

  const bodyHtml = `
    ${customPatientCard}
    <div style="font-size: 11px; font-weight: 900; color: #008bcd; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
      Evolución y Notas de Tratamiento
    </div>
    <div style="display: flex; flex-direction: column;">
      ${evolutionsHtml}
    </div>
  `

  executePrintEngine({
    title: "Evoluciones Clínicas",
    documentTypeBadge: "HISTORIA CLÍNICA",
    patient: undefined, 
    settings,
    bodyHtml,
    doctorName,
    specialty,
    showSignature: false 
  })
}