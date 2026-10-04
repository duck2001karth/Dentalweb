import { format } from "date-fns"
import { es } from "date-fns/locale"
import { escapeHTML } from "@/lib/sanitize"

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
  const clinicName = escapeHTML(settings?.clinicName?.trim() || "Carmo Dental")
  const clinicSlogan = escapeHTML(settings?.slogan?.trim() || "Clínica de Especialidades Odontológicas")
  const clinicHolder = escapeHTML(settings?.razonSocial?.trim() || "Dr. Especialista")
  const clinicRuc = escapeHTML(settings?.ruc?.trim() || "")
  
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

  const patientFullName = escapeHTML(patient ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() : "Paciente No Registrado")
  const patientDoc = escapeHTML(patient?.ci || patient?.idDoc || "--")
  const patientAge = escapeHTML(patient?.age ? `${patient.age} años` : "--")
  const patientPhone = escapeHTML(patient?.phone || patient?.mobile || "--")
  const patientMedicalAlerts = escapeHTML(patient?.medicalAlerts || "")
  const formattedPrintDate = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })

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
          <div class="evo-card">
            <div class="evo-header">
              <div class="evo-meta">
                <span class="evo-badge-date">${evoDate} ${evoTime ? `- ${evoTime}` : ""}</span>
                <span class="evo-tooth">${evoTooth}</span>
                <span class="evo-proc">${evoProc}</span>
              </div>
              <div class="evo-doc">
                Atendido por: <b>${evoDoctor}</b>
              </div>
            </div>
            <div class="evo-body">
              ${evoNotes}
            </div>
            ${evoNext ? `
              <div class="evo-footer">
                <span>Próxima Cita / Indicación: <b>${evoNext}</b></span>
              </div>
            ` : ""}
          </div>
        `
      }).join("")
    : `<div class="empty-state">No se registran notas de evolución clínica en este expediente.</div>`

  const safeTreatingDoctor = escapeHTML(doctorName.toLowerCase().startsWith("dr") ? doctorName : `Dr. ${doctorName}`)
  const safeSpecialty = escapeHTML(specialty)

  // 4. HTML y Estructura CSS completa e idéntica a tu diseño original
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Evoluciones Clínicas - ${patientFullName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        html, body {
          width: 100%;
          height: 100%;
          background: #ffffff;
          color: #0f172a;
        }
        .sheet {
          position: relative;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 16mm 18mm 14mm 18mm;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .watermark-bg {
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
          mix-blend-mode: multiply;
        }
        .watermark-bg img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          ${filterStyle}
        }
        .document-body {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        /* CABECERA */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 12px;
          margin-bottom: 16px;
          border-bottom: 2px solid #008bcd;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .logo {
          max-height: 52px;
          max-width: 150px;
          object-fit: contain;
          ${filterStyle}
        }
        .clinic-brand {
          font-size: 20px;
          font-weight: 900;
          color: #008bcd;
          letter-spacing: -0.3px;
          line-height: 1.1;
          text-transform: uppercase;
        }
        .clinic-slogan {
          font-size: 10px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 3px;
        }
        .clinic-meta {
          font-size: 9px;
          color: #64748b;
          margin-top: 2px;
        }
        .header-right {
          text-align: right;
        }
        .holder-name {
          font-size: 11px;
          font-weight: 900;
          color: #008bcd;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .holder-ruc {
          font-size: 9px;
          font-weight: 700;
          color: #334155;
          margin-top: 2px;
        }
        .doc-meta {
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          font-size: 9px;
          color: #64748b;
        }
        .doc-badge {
          font-family: monospace;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-weight: 600;
        }
        /* PACIENTE */
        .patient-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .patient-info .label {
          font-size: 8.5px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .patient-info .name {
          font-size: 14.5px;
          font-weight: 800;
          color: #0f172a;
          text-transform: capitalize;
          margin-top: 2px;
        }
        .patient-details {
          display: flex;
          gap: 20px;
          font-size: 10.5px;
          color: #475569;
        }
        .patient-details span {
          color: #94a3b8;
          font-weight: 500;
        }
        .patient-details b {
          color: #334155;
          font-weight: 700;
        }
        .alert-badge {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          color: #e11d48;
          font-size: 9px;
          font-weight: 700;
        }
        .section-title {
          font-size: 11px;
          font-weight: 900;
          color: #008bcd;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        /* TARJETAS DE EVOLUCIÓN */
        .evolutions-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .evo-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
          page-break-inside: avoid;
        }
        .evo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          border-bottom: 1px dashed #f1f5f9;
          padding-bottom: 6px;
        }
        .evo-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .evo-badge-date {
          background: #f1f5f9;
          color: #334155;
          font-weight: 800;
          font-size: 9.5px;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .evo-tooth {
          color: #008bcd;
          font-weight: 700;
          font-size: 10px;
        }
        .evo-proc {
          font-weight: 800;
          font-size: 10.5px;
          color: #0f172a;
        }
        .evo-doc {
          font-size: 9.5px;
          color: #64748b;
        }
        .evo-body {
          font-size: 11px;
          color: #334155;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        .evo-footer {
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px dashed #f1f5f9;
          font-size: 9.5px;
          color: #64748b;
        }
        .empty-state {
          text-align: center;
          padding: 30px;
          color: #94a3b8;
          font-style: italic;
          font-size: 11px;
        }
        /* FIRMA Y PIE */
        .footer-section {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          page-break-inside: avoid;
        }
        .signatures-grid {
          display: flex;
          justify-content: flex-end;
          margin-top: 15px;
        }
        .sig-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 220px;
          text-align: center;
        }
        .sig-line {
          height: 50px;
          width: 100%;
          border-bottom: 1px solid #cbd5e1;
          margin-bottom: 8px;
        }
        .sig-name {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          text-transform: capitalize;
        }
        .sig-role {
          font-size: 8.5px;
          color: #64748b;
          font-weight: 600;
          margin-top: 2px;
        }
        .legal-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 8px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="watermark-bg">
          <img src="${watermarkUrl}" alt="" />
        </div>
        <div class="document-body">
          <div class="header">
            <div class="header-left">
              <img src="${logoUrl}" class="logo" alt="Logo" onerror="this.style.display='none'" />
              <div>
                <div class="clinic-brand">${clinicName}</div>
                <div class="clinic-slogan">${clinicSlogan}</div>
                <div class="clinic-meta">${clinicAddress}</div>
              </div>
            </div>
            <div class="header-right">
              <div class="holder-name">${clinicHolder}</div>
              ${clinicRuc ? `<div class="holder-ruc">RUC: ${clinicRuc}</div>` : ""}
              <div class="doc-meta">
                <span>Fecha: <b style="color: #0f172a;">${formattedPrintDate}</b></span>
                <span class="doc-badge">HISTORIA CLÍNICA</span>
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
                <div><span>Edad:</span> <b>${patientAge}</b></div>
                <div><span>Teléfono:</span> <b>${patientPhone}</b></div>
              </div>
              ${patientMedicalAlerts ? `
                <div class="alert-badge">⚠️ Alerta Médica: ${patientMedicalAlerts}</div>
              ` : ""}
            </div>
          </div>

          <div class="section-title">Evolución y Notas de Tratamiento</div>

          <div class="evolutions-container">
            ${evolutionsHtml}
          </div>

          <div class="footer-section">
            <div class="signatures-grid">
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="sig-name">${safeTreatingDoctor.toLowerCase()}</div>
                <div class="sig-role">${safeSpecialty}</div>
              </div>
            </div>
            <div class="legal-footer">
              Registro médico confidencial generado por ${clinicName} para el expediente del paciente.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

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