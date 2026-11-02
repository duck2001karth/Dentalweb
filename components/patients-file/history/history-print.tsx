import { format, differenceInYears, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { executePrintEngine } from "@/lib/print-engine"
import type { PrintEngineOptions } from "@/lib/print-engine"
import { escapeHTML, sanitizeMediaUrl } from "@/lib/sanitize"

type PrintPatient = {
  firstName?: string | null
  lastName?: string | null
  ci?: string | null
  birthDate?: string | Date | null
  medicalAlerts?: string | null
}

type PrintNote = {
  id?: string | null
  type?: string | null
  content?: string | null
  date?: string | Date | null
  createdAt?: string | Date | null
  fileUrl?: string | null
  author?: { name?: string | null } | null
}

export interface PrintHistorialOptions {
  patient: PrintPatient | null | undefined
  notes?: PrintNote[] | null
  doctorName?: string | null
  doctorSpecialty?: string | null
  doctorLicense?: string | null
  doctorSignature?: string | null
  settings?: PrintEngineOptions["settings"]
}

const text = (value: unknown): string =>
  escapeHTML(typeof value === "string" ? value : "")

function calculateAge(birthDate: string | Date | null | undefined): string {
  if (!birthDate) return "--"
  const birth = new Date(birthDate)
  if (!isValid(birth) || birth > new Date()) return "--"
  const age = differenceInYears(new Date(), birth)
  return age >= 0 && age <= 125 ? String(age) : "--"
}

function formatNoteDate(value: string | Date | null | undefined): string {
  if (!value) return "-"
  const date = new Date(value)
  return isValid(date) ? format(date, "dd MMM yyyy - HH:mm", { locale: es }) : "-"
}

function parsePrescription(content: string | null | undefined): {
  medications: string
  indications: string
  observations: string
} {
  const raw = content ?? ""
  try {
    const decoded: unknown = JSON.parse(raw)
    if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) {
      const data = decoded as Record<string, unknown>
      const get = (key: string) => typeof data[key] === "string" ? data[key] as string : ""
      return { medications: get("medications"), indications: get("indications"), observations: get("observations") }
    }
  } catch { /* La nota puede ser texto plano */ }
  return { medications: raw, indications: "", observations: "" }
}

function formatNoteBody(note: PrintNote): string {
  if (note.type !== "PRESCRIPTION") {
    return `<div style="font-size:11px;color:#1e293b;line-height:1.5;white-space:pre-wrap">${text(note.content)}</div>`
  }
  const data = parsePrescription(note.content)
  const section = (label: string, value: string, color: string) => value ? `
    <div style="margin-bottom:6px">
      <div style="font-weight:800;color:${color};font-size:10px;margin-bottom:2px">${label}</div>
      <div style="color:#334155;padding-left:4px;white-space:pre-wrap">${text(value)}</div>
    </div>` : ""
  return `<div style="margin-top:6px;font-size:11px">
    ${section("R.P. (Medicamentos)", data.medications, "#008bcd")}
    ${section("Indicaciones", data.indications, "#008bcd")}
    ${section("Observaciones", data.observations, "#d97706")}
  </div>`
}

/**
 * Imprime el historial sin concatenar datos no confiables en atributos HTML.
 * La firma solo se carga desde rutas locales o HTTPS; NO inserta data: URLs.
 * La autorización de acceso al historial y a la firma corresponde al servidor.
 */
export function printHistorialSheet({
  patient,
  notes = [],
  doctorName,
  doctorSpecialty = "Odontología General",
  doctorLicense = "",
  doctorSignature,
  settings,
}: PrintHistorialOptions): void {
  if (!patient) return
  const records = notes ?? []
  const patientFullName = text(`${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim())
  const patientDocId = text(patient.ci || "No registrado")
  const age = calculateAge(patient.birthDate)
  const doctorDisplayName = doctorName
    ? (/^Dr\.?\s/i.test(doctorName) ? doctorName : `Dr. ${doctorName}`)
    : "Especialista"
  const activeDoctorName = text(doctorDisplayName)

  // Se valida antes de interpolar en src y se escapa para contexto de atributo.
  // Permitir solo rutas /... y HTTPS no implica que el recurso esté autorizado;
  // para firmas sensibles, es preferible una ruta autenticada del mismo origen.
  const signatureUrl = sanitizeMediaUrl(doctorSignature, "")
  const signatureHtml = signatureUrl ? `
    <div style="text-align:center;page-break-inside:avoid;margin-top:16px">
      <img src="${escapeHTML(signatureUrl)}" alt="Firma del profesional" style="max-height:75px;max-width:200px;object-fit:contain" />
      <div style="border-top:1px solid #64748b;max-width:220px;margin:5px auto 0"></div>
      <div style="font-size:10px;font-weight:700">${activeDoctorName}</div>
      ${doctorLicense ? `<div style="font-size:9px">Matrícula: ${text(doctorLicense)}</div>` : ""}
    </div>` : ""

  const customPatientCard = `
    <div style="display:grid;grid-template-columns:1.2fr 1fr;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:16px;background:#f8fafc;page-break-inside:avoid;break-inside:avoid">
      <div style="padding:10px 14px;border-right:1px solid #e2e8f0">
        <div style="font-size:8.5px;font-weight:800;color:#64748b;text-transform:uppercase">Datos del Paciente</div>
        <div style="font-size:13.5px;font-weight:800;color:#0f172a;margin-top:2px">${patientFullName}</div>
        <div style="font-size:10.5px;color:#334155;margin-top:3px"><b>Identificación:</b> ${patientDocId} &nbsp; <b>Edad:</b> ${age === "--" ? age : `${age} años`}</div>
        ${patient.medicalAlerts ? `<div style="color:#e11d48;font-weight:700;font-size:9.5px;margin-top:5px;background:#ffe4e6;padding:2px 7px;border-radius:6px">Alerta médica: ${text(patient.medicalAlerts)}</div>` : ""}
      </div>
      <div style="padding:10px 14px">
        <div style="font-size:8.5px;font-weight:800;color:#64748b;text-transform:uppercase">Profesional Responsable</div>
        <div style="font-size:13.5px;font-weight:800;color:#0f172a;margin-top:2px">${activeDoctorName}</div>
        <div style="font-size:10.5px;color:#334155;margin-top:3px"><b>Especialidad:</b> ${text(doctorSpecialty)}</div>
        ${doctorLicense ? `<div style="font-size:10.5px;color:#334155;margin-top:3px"><b>Matrícula / Reg. MSP:</b> ${text(doctorLicense)}</div>` : ""}
      </div>
    </div>`

  const rowsHtml = records.length === 0
    ? `<div style="text-align:center;padding:40px;color:#64748b;font-size:11px;font-style:italic">No hay registros clínicos para este paciente.</div>`
    : records.map((note, index) => {
      const suffix = typeof note.id === "string" ? note.id.slice(-4).toUpperCase() : ""
      const codeId = `#${text(suffix || String(records.length - index).padStart(2, "0"))}`
      const isEvolution = note.type === "EVOLUTION"
      const isPrescription = note.type === "PRESCRIPTION"
      const typeLabel = isEvolution ? `Evolución Clínica ${codeId}` : isPrescription ? `Receta Médica ${codeId}` : `Documento / Rx ${codeId}`
      const rawAuthor = note.author?.name
      const noteDocName = rawAuthor ? (/^Dr\.?\s/i.test(rawAuthor) ? rawAuthor : `Dr. ${rawAuthor}`) : doctorDisplayName
      const attachmentUrl = sanitizeMediaUrl(note.fileUrl, "")
      const attachmentHtml = attachmentUrl ? `
        <div style="margin:8px 0;max-width:220px">
          <img src="${escapeHTML(attachmentUrl)}" alt="Adjunto clínico" style="max-height:110px;border-radius:6px;border:1px solid #e2e8f0;object-fit:contain;display:block" />
        </div>` : ""
      return `
        <div style="border:1px solid #cbd5e1;border-radius:8px;padding:12px 14px;margin-bottom:14px;background:#fff;page-break-inside:avoid">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;padding-bottom:6px;margin-bottom:8px">
            <div>
              <span style="font-size:11px;font-weight:800;color:#008bcd">${typeLabel}</span>
              <span style="font-size:10px;color:#334155;font-weight:600;margin-left:6px">| ${text(noteDocName)}</span>
            </div>
            <span style="font-size:9px;color:#475569;font-family:monospace;background:#f1f5f9;padding:2px 7px;border-radius:5px">${formatNoteDate(note.date || note.createdAt)}</span>
          </div>
          ${formatNoteBody(note)}
          ${attachmentHtml}
        </div>`
    }).join("")

  const bodyHtml = `
    ${customPatientCard}
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:5px;margin-bottom:12px;border-bottom:1.5px solid #008bcd;page-break-inside:avoid">
      <div style="font-size:11px;font-weight:800;color:#008bcd;text-transform:uppercase">Línea de Tiempo de Intervenciones Clínicas</div>
      <div style="font-size:9.5px;font-weight:700;color:#64748b">${records.length} Registro(s)</div>
    </div>
    <div style="display:flex;flex-direction:column">${rowsHtml}</div>
    ${signatureHtml}`

  executePrintEngine({
    title: "Historial Clínico Integral",
    documentTypeBadge: "EXPEDIENTE HISTÓRICO",
    patient: undefined, 
    settings,
    bodyHtml,
    showSignature: !signatureUrl, 
  })
}
