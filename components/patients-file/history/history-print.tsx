import { format, differenceInYears } from "date-fns"
import { es } from "date-fns/locale"

interface PrintHistorialOptions {
  patient: any
  notes: any[]
  doctorName?: string
  doctorSpecialty?: string
  doctorLicense?: string
  doctorSignature?: string | null
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
  doctorLicense,
  doctorSignature,
  settings,
}: PrintHistorialOptions) {
  if (!patient) return

  const clinicName = settings?.clinicName?.trim() || "No registrado"
  const clinicSlogan = settings?.slogan?.trim() || "No registrado"
  const clinicRuc = settings?.ruc?.trim() || "No registrado"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "No registrado"
  const rawAddress = settings?.address?.trim()
  const rawCity = settings?.city?.trim()
  const rawCountry = settings?.country?.trim()
  const clinicAddress = [rawAddress, rawCity, rawCountry].filter(Boolean).join(" • ") || "No registrado"
  const doctorHolder = settings?.razonSocial?.trim() || "No registrado"

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const rawDoc = doctorName || doctorHolder
  const activeDoctorName = rawDoc.startsWith("Dr") ? rawDoc : `Dr. ${rawDoc}`
  const activeDoctorSpecialty = doctorSpecialty 

  const patientFullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
  const patientDocId = patient.ci || "No registrado"
  const patientAge = calculateAge(patient.birthDate)

  const isMonochrome = settings?.defaultPrintMode === "bw"
  const filterStyle = isMonochrome ? "filter: grayscale(100%);" : ""
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 6) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)

  const formatNoteBody = (note: any) => {
    if (note.type === "PRESCRIPTION") {
      try {
        const data =
          typeof note.content === "string" && note.content.startsWith("{")
            ? JSON.parse(note.content)
            : { medications: note.content }

        return `
          <div style="margin-top: 6px; font-size: 11px;">
            ${
              data.medications
                ? `
              <div style="margin-bottom: 6px;">
                <div style="font-weight: 800; color: #008bcd; font-size: 10px; margin-bottom: 2px;">R.P. (Medicamentos)</div>
                <div style="color: #0f172a; padding-left: 4px;">${data.medications}</div>
              </div>
            `
                : ""
            }
            ${
              data.indications
                ? `
              <div style="border-top: 1px solid #f1f5f9; padding-top: 4px; margin-top: 4px;">
                <div style="font-weight: 800; color: #008bcd; font-size: 10px; margin-bottom: 2px;">Indicaciones</div>
                <div style="color: #334155; padding-left: 4px;">${data.indications}</div>
              </div>
            `
                : ""
            }
            ${
              data.observations
                ? `
              <div style="border-top: 1px dashed #f1f5f9; padding-top: 4px; margin-top: 4px;">
                <div style="font-weight: 800; color: #d97706; font-size: 10px; margin-bottom: 2px;">Observaciones</div>
                <div style="color: #475569; padding-left: 4px;">${data.observations}</div>
              </div>
            `
                : ""
            }
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
      <title>Historial Clínico Integral - ${patientFullName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 16mm 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        body {
          background: #ffffff;
          color: #0f172a;
          line-height: 1.4;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .watermark-bg {
          position: fixed;
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

        .document-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
        }

        /* HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 12px;
          margin-bottom: 15px;
          border-bottom: 2.5px solid #008bcd;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo {
          max-height: 52px;
          max-width: 140px;
          object-fit: contain;
          ${filterStyle}
        }
        .clinic-brand {
          font-size: 20px;
          font-weight: 900;
          color: #008bcd;
          letter-spacing: -0.3px;
          line-height: 1.1;
        }
        .clinic-slogan {
          font-size: 10px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .clinic-meta {
          font-size: 9px;
          color: #64748b;
          margin-top: 3px;
        }
        .header-right {
          text-align: right;
        }
        .header-badge {
          display: inline-block;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.3px;
          background: #f8fafc;
          color: #0f172a;
          text-transform: uppercase;
        }
        .emission-date {
          font-size: 9.5px;
          color: #64748b;
          margin-top: 6px;
        }

        /* TARJETA DE DATOS DEL PACIENTE */
        .patient-card {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          margin-bottom: 16px;
          background: #f8fafc;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .patient-col {
          padding: 10px 14px;
        }
        .patient-col:first-child {
          border-right: 1px solid #e2e8f0;
        }
        .card-label {
          font-size: 8.5px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .card-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 2px;
        }
        .card-sub {
          font-size: 10.5px;
          color: #334155;
          margin-top: 3px;
        }
        .alert-badge {
          display: inline-block;
          color: #e11d48;
          font-weight: 700;
          font-size: 9.5px;
          margin-top: 5px;
          background: #ffe4e6;
          padding: 2px 7px;
          border-radius: 6px;
        }

        /* SECCIÓN DIVISORIA */
        .section-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 5px;
          margin-bottom: 12px;
          border-bottom: 1.5px solid #008bcd;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          color: #008bcd;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .section-counter {
          font-size: 9.5px;
          font-weight: 700;
          color: #64748b;
        }

        /* TARJETA DE CADA REGISTRO */
        .note-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 14px;
          background: #ffffff;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
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
          font-size: 11px;
          font-weight: 800;
          color: #008bcd;
        }
        .note-author {
          font-size: 10px;
          color: #334155;
          font-weight: 600;
          margin-left: 6px;
        }
        .note-date {
          font-size: 9px;
          color: #475569;
          font-family: monospace;
          background: #f1f5f9;
          padding: 2px 7px;
          border-radius: 5px;
        }
        .note-attachment {
          margin: 8px 0;
          max-width: 220px;
        }
        .note-attachment img {
          max-height: 110px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          object-fit: contain;
          display: block;
        }

        /* FIRMAS AL PIE DE LA TARJETA */
        .signatures-row {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px dashed #e2e8f0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .sig-box {
          text-align: center;
          padding: 4px;
        }
        .sig-box img {
          height: 38px;
          max-width: 130px;
          object-fit: contain;
          display: block;
          margin: 0 auto -4px auto;
        }
        .sig-line {
          border-top: 1px solid #334155;
          padding-top: 3px;
          margin-top: 4px;
        }
        .sig-label {
          font-size: 8.5px;
          font-weight: 700;
          color: #0f172a;
        }
        .sig-role {
          font-size: 8px;
          color: #64748b;
        }

        /* PIE DE PÁGINA */
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #008bcd;
          text-align: center;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .footer-brand {
          font-size: 9.5px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
        }
        .footer-meta {
          font-size: 8.5px;
          color: #475569;
          margin-top: 2px;
        }
        .footer-disclaimer {
          font-size: 8px;
          font-style: italic;
          color: #94a3b8;
          margin-top: 3px;
        }
      </style>
    </head>
    <body>
      ${
        settings?.watermarkUrl
          ? `<div class="watermark-bg"><img src="${settings.watermarkUrl}" alt="" /></div>`
          : ""
      }
      <div class="document-wrapper">
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
            <div class="header-badge">Historial Clínico Integral</div>
            <div class="emission-date">Fecha de Emisión: <b>${today}</b></div>
          </div>
        </div>

        <div class="patient-card">
          <div class="patient-col">
            <div class="card-label">Datos del Paciente</div>
            <div class="card-title">${patientFullName}</div>
            <div class="card-sub">
              <b>Identificación:</b> ${patientDocId} &nbsp;•&nbsp; 
              <b>Edad:</b> ${patientAge !== "--" ? `${patientAge} Años` : "--"}
            </div>
            ${
              patient.medicalAlerts
                ? `<div class="alert-badge">Alerta Médica: ${patient.medicalAlerts}</div>`
                : ""
            }
          </div>
          <div class="patient-col">
            <div class="card-label">Profesional Responsable</div>
            <div class="card-title">${activeDoctorName}</div>
            <div class="card-sub"><b>Especialidad:</b> ${activeDoctorSpecialty}</div>
            ${
              doctorLicense
                ? `<div class="card-sub"><b>Matrícula / Reg. MSP:</b> ${doctorLicense}</div>`
                : ""
            }
          </div>
        </div>

        <div class="section-bar">
          <div class="section-title">Línea de Tiempo de Intervenciones Clínicas</div>
          <div class="section-counter">${notes.length} Registro(s)</div>
        </div>

        ${
          notes.length === 0
            ? `<div style="text-align:center; padding: 40px; color:#64748b; font-size:11px; font-style:italic;">No hay registros clínicos para este paciente.</div>`
            : `<div class="notes-list">
                ${notes
                  .map((note: any, index: number) => {
                    const isEvolution = note.type === "EVOLUTION"
                    const isPrescription = note.type === "PRESCRIPTION"
                    const codeId = `#${note.id?.slice(-4).toUpperCase() || (notes.length - index).toString().padStart(2, "0")}`
                    const rawDate = note.date || note.createdAt
                    const noteDate = rawDate ? format(new Date(rawDate), "dd MMM yyyy - HH:mm", { locale: es }) : "-"
                    const typeLabel = isEvolution
                      ? `Evolución Clínica ${codeId}`
                      : isPrescription
                      ? `Receta Médica ${codeId}`
                      : `Documento / Rx ${codeId}`

                    const noteDocName = note.author?.name ? `Dr. ${note.author.name.replace(/^Dr\.\s*/i, "")}` : activeDoctorName
                    const noteDocSig = note.professionalSignature || doctorSignature || null
                    const noteDocLicense = note.author?.professionalCard || doctorLicense || ""

                    return `
                      <div class="note-card">
                        <div class="note-header">
                          <div>
                            <span class="note-title">${typeLabel}</span>
                            <span class="note-author">• ${noteDocName}</span>
                          </div>
                          <span class="note-date">${noteDate}</span>
                        </div>

                        <div>
                          ${formatNoteBody(note)}
                        </div>

                        ${
                          note.fileUrl
                            ? `
                          <div class="note-attachment">
                            <img src="${note.fileUrl}" alt="Adjunto Clínico" />
                          </div>
                        `
                            : ""
                        }

                        ${
                          noteDocSig || note.patientSignature
                            ? `
                          <div class="signatures-row">
                            <div class="sig-box">
                              ${
                                noteDocSig
                                  ? `<img src="${noteDocSig}" alt="Firma Profesional" />`
                                  : `<div style="height: 34px;"></div>`
                              }
                              <div class="sig-line">
                                <div class="sig-label">${noteDocName}</div>
                                <div class="sig-role">${noteDocLicense ? `Matrícula: ${noteDocLicense}` : "Firma del Profesional"}</div>
                              </div>
                            </div>

                            <div class="sig-box">
                              ${
                                note.patientSignature
                                  ? `<img src="${note.patientSignature}" alt="Firma Paciente" />`
                                  : `<div style="height: 34px;"></div>`
                              }
                              <div class="sig-line">
                                <div class="sig-label">${patientFullName}</div>
                                <div class="sig-role">Firma de Conformidad (Paciente)</div>
                              </div>
                            </div>
                          </div>
                        `
                            : ""
                        }
                      </div>
                    `
                  })
                  .join("")}
              </div>`
        }

        <div class="footer">
          <div class="footer-brand">${clinicName} - ${clinicSlogan}</div>
          <div class="footer-meta">Dirección: ${clinicAddress} • Cel.: ${clinicPhone}</div>
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