import { format, differenceInYears } from "date-fns"
import { es } from "date-fns/locale"

interface PrintHistorialOptions {
  patient: any
  notes: any[]
  doctorName?: string
  doctorSpecialty?: string
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
  doctorSpecialty,
  settings,
}: PrintHistorialOptions) {
  if (!patient) return

  const clinicName = settings?.clinicName?.trim() || "Clinica Dental Sonrisa Saludable"
  const clinicSlogan = settings?.slogan?.trim() || "Clínica dental especializada en tu bienestar"
  const clinicRuc = settings?.ruc?.trim() || "100000000001"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "(+593) 99 999 9999"

  const rawAddress = settings?.address?.trim()
  const rawCity = settings?.city?.trim()
  const rawCountry = settings?.country?.trim()
  const clinicAddress = [rawAddress, rawCity, rawCountry].filter(Boolean).join(" • ") || "Avenida Principal, Ciudad, País"

  const doctorHolder = settings?.razonSocial?.trim() || "Dr. Especialista Asignado"
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const activeDoctorName = doctorName || doctorHolder
  const activeDoctorSpecialty = doctorSpecialty || "Odontología General"

  const patientFullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
  const patientDocId = patient.ci || "No registrado"
  const patientAge = calculateAge(patient.birthDate)

  const isMonochrome = settings?.defaultPrintMode === "bw"
  const filterStyle = isMonochrome ? "filter: grayscale(100%);" : ""
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 8) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)

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
                <div style="font-weight: 700; color: #008bcd; font-size: 10px; margin-bottom: 2px;">R.P. (Medicamentos)</div>
                <div style="color: #0f172a; padding-left: 4px;">${data.medications}</div>
              </div>
            ` : ""}
            ${data.indications ? `
              <div style="border-top: 1px solid #f1f5f9; padding-top: 4px; margin-top: 4px;">
                <div style="font-weight: 700; color: #008bcd; font-size: 10px; margin-bottom: 2px;">Indicaciones</div>
                <div style="color: #334155; padding-left: 4px;">${data.indications}</div>
              </div>
            ` : ""}
            ${data.observations ? `
              <div style="border-top: 1px dashed #f1f5f9; padding-top: 4px; margin-top: 4px;">
                <div style="font-weight: 700; color: #d97706; font-size: 10px; margin-bottom: 2px;">Observaciones</div>
                <div style="color: #475569; padding-left: 4px;">${data.observations}</div>
              </div>
            ` : ""}
          </div>
        `
      } catch {
        return `<div style="font-size: 11px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${note.content}</div>`
      }
    }
    return `<div style="font-size: 11px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${note.content}</div>`
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Historial Clínico - ${patientFullName}</title>
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
          justify-content: space-between;
          overflow: hidden;
        }

        .watermark-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(${watermarkScale});
          width: 380px;
          max-height: 380px;
          opacity: ${watermarkOpacity};
          z-index: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
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

        /* ENCABEZADO */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 12px;
          margin-bottom: 16px;
          border-bottom: 3px solid #008bcd;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .logo {
          max-height: 56px;
          max-width: 150px;
          object-fit: contain;
          ${filterStyle}
        }
        .clinic-brand {
          font-size: 22px;
          font-weight: 800;
          color: #008bcd;
          letter-spacing: -0.3px;
          line-height: 1.1;
        }
        .clinic-slogan {
          font-size: 11px;
          font-weight: 600;
          color: #008bcd;
          margin-top: 3px;
          margin-bottom: 3px;
        }
        .clinic-meta {
          font-size: 10px;
          color: #475569;
        }
        .header-right {
          text-align: right;
        }
        .header-badge {
          display: inline-block;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.3px;
          background: #f8fafc;
          color: #334155;
        }
        .emission-date {
          font-size: 10px;
          color: #64748b;
          margin-top: 6px;
        }

        /* CAJA DEL PACIENTE */
        .patient-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          margin-bottom: 20px;
          background: #ffffff;
        }
        .patient-col {
          padding: 12px 18px;
        }
        .patient-col:first-child {
          border-right: 1px solid #e2e8f0;
        }
        .card-label {
          font-size: 9.5px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 3px;
          letter-spacing: 0.2px;
        }
        .card-title {
          font-size: 14.5px;
          font-weight: 800;
          color: #0f172a;
          text-transform: capitalize;
        }
        .card-sub {
          font-size: 11px;
          color: #334155;
          margin-top: 4px;
        }
        .alert-badge {
          display: inline-block;
          color: #e11d48;
          font-weight: 700;
          font-size: 10px;
          margin-top: 6px;
          background: #ffe4e6;
          padding: 2px 8px;
          border-radius: 6px;
        }

        /* BARRA DE SECCIÓN */
        .section-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 6px;
          margin-bottom: 14px;
          border-bottom: 2px solid #0f172a;
        }
        .section-title {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.2px;
        }
        .section-counter {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
        }

        /* REGISTRO DE NOTAS */
        .empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-style: italic;
          color: #64748b;
          min-height: 140px;
        }
        .notes-list {
          flex: 1;
        }
        .note-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 12px;
          page-break-inside: avoid;
        }
        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        .note-title {
          font-size: 11.5px;
          font-weight: 800;
          color: #008bcd;
        }
        .note-author {
          font-size: 10px;
          color: #64748b;
          font-weight: 500;
          margin-left: 6px;
        }
        .note-date {
          font-size: 9.5px;
          color: #475569;
          font-family: monospace;
          background: #f1f5f9;
          padding: 2px 7px;
          border-radius: 6px;
        }
        .note-attachment {
          margin: 8px 0;
        }
        .note-attachment img {
          max-height: 120px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          padding: 2px;
        }

        /* FIRMAS */
        .signatures-row {
          margin-top: 10px;
          padding-top: 6px;
          border-top: 1px dashed #e2e8f0;
          display: flex;
          gap: 24px;
        }
        .sig-box {
          text-align: center;
        }
        .sig-box img {
          height: 32px;
          object-fit: contain;
          mix-blend-mode: multiply;
        }
        .sig-label {
          font-size: 8.5px;
          font-weight: 700;
          color: #475569;
          border-top: 1px solid #cbd5e1;
          padding-top: 2px;
          margin-top: 2px;
        }

        /* PIE DE PÁGINA */
        .footer {
          position: relative;
          z-index: 10;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          page-break-inside: avoid;
        }
        .footer-brand {
          font-size: 10px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 3px;
        }
        .footer-meta {
          font-size: 9.5px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .footer-disclaimer {
          font-size: 8.5px;
          font-style: italic;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        ${
          settings?.watermarkUrl
            ? `<div class="watermark-bg"><img src="${settings.watermarkUrl}" alt="" /></div>`
            : ""
        }

        <div class="document-body">
          <div class="header">
            <div class="header-left">
              ${settings?.logoUrl ? `<img src="${settings.logoUrl}" class="logo" alt="Logo" />` : ""}
              <div>
                <div class="clinic-brand">${clinicName}</div>
                <div class="clinic-slogan">${clinicSlogan}</div>
                <div class="clinic-meta">RUC: ${clinicRuc} | ${clinicAddress}</div>
              </div>
            </div>
            <div class="header-right">
              <div class="header-badge">Historial Clínico General</div>
              <div class="emission-date">Fecha de Emisión: <b>${today}</b></div>
            </div>
          </div>

          <div class="patient-card">
            <div class="patient-col">
              <div class="card-label">Datos del Paciente</div>
              <div class="card-title">${patientFullName.toLowerCase()}</div>
              <div class="card-sub">
                <b>C.I. / Doc:</b> ${patientDocId} &nbsp;•&nbsp; 
                <b>Edad:</b> ${patientAge !== "--" ? `${patientAge} Años` : "--"}
              </div>
              ${
                patient.medicalAlerts 
                  ? `<div class="alert-badge">⚠️ Alerta Médica: ${patient.medicalAlerts}</div>` 
                  : ""
              }
            </div>
            <div class="patient-col">
              <div class="card-label">Profesional Responsable</div>
              <div class="card-title">${activeDoctorName.toLowerCase()}</div>
              <div class="card-sub"><b>Especialidad:</b> ${activeDoctorSpecialty}</div>
            </div>
          </div>

          <div class="section-bar">
            <div class="section-title">Línea de Tiempo de Intervenciones Clínicas</div>
            <div class="section-counter">Total Registros: ${notes.length}</div>
          </div>

          ${
            notes.length === 0
              ? `<div class="empty-state">No hay registros clínicos para este paciente.</div>`
              : `<div class="notes-list">
                  ${notes
                    .map((note: any, index: number) => {
                      const isEvolution = note.type === "EVOLUTION"
                      const isPrescription = note.type === "PRESCRIPTION"
                      const codeId = `#${note.id?.slice(-4).toUpperCase() || (notes.length - index).toString().padStart(2, "0")}`
                      const noteDate = note.createdAt ? format(new Date(note.createdAt), "dd MMM yyyy - HH:mm", { locale: es }) : "-"
                      const typeLabel = isEvolution ? `Evolución Clínica ${codeId}` : isPrescription ? `Receta Médica ${codeId}` : `Documento / Rx ${codeId}`

                      return `
                        <div class="note-card">
                          <div class="note-header">
                            <div>
                              <span class="note-title">${typeLabel}</span>
                              <span class="note-author">• Dr(a). ${note.author?.name || activeDoctorName}</span>
                            </div>
                            <span class="note-date">${noteDate}</span>
                          </div>

                          <div>
                            ${formatNoteBody(note)}
                          </div>

                          ${note.fileUrl ? `
                            <div class="note-attachment">
                              <img src="${note.fileUrl}" alt="Adjunto" />
                            </div>
                          ` : ""}

                          ${(note.professionalSignature || note.patientSignature) ? `
                            <div class="signatures-row">
                              ${note.professionalSignature ? `
                                <div class="sig-box">
                                  <img src="${note.professionalSignature}" alt="Firma Profesional" />
                                  <div class="sig-label">Prof. ${note.author?.name || activeDoctorName}</div>
                                </div>
                              ` : ""}
                              ${note.patientSignature ? `
                                <div class="sig-box">
                                  <img src="${note.patientSignature}" alt="Firma Paciente" />
                                  <div class="sig-label">Paciente / Tutor</div>
                                </div>
                              ` : ""}
                            </div>
                          ` : ""}
                        </div>
                      `
                    })
                    .join("")}
                </div>`
          }
        </div>

        <div class="footer">
          <div class="footer-brand">${clinicName} - ${clinicSlogan}</div>
          <div class="footer-meta">Dirección: ${clinicAddress} • Cel: ${clinicPhone}</div>
          <div class="footer-disclaimer">Documento generado electrónicamente. Las firmas digitales gozan de plena validez legal y auditoría en el sistema.</div>
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

  const doc = iframe.contentWindow?.document
  if (doc) {
    doc.open()
    doc.write(htmlContent)
    doc.close()

    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1500)
    }, 400)
  }
}