import { format } from "date-fns"
import { es } from "date-fns/locale"
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
  settings?: any
}

export function printEvolutionsSheet({
  patient,
  evolutions = [],
  doctorName = "Especialista Tratante",
  specialty = "Odontología General",
  settings,
}: PrintEvolutionsOptions) {
  
  const evolutionsHtml = evolutions.length > 0
    ? evolutions.map((evo) => {
        const evoDate = evo.date ? format(new Date(evo.date), "dd/MM/yyyy") : "--"
        const evoTime = escapeHTML(evo.time || "")
        const evoDoctor = escapeHTML(evo.doctor || doctorName)
        const evoProc = escapeHTML(evo.procedure || "Atención Odontológica")
        const evoTooth = evo.tooth ? `Pieza ${escapeHTML(evo.tooth)}` : "General"
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
    patient,
    settings,
    bodyHtml,
    doctorName,
    specialty
  })
}