import { format } from "date-fns"
import { es } from "date-fns/locale"
import { treatmentStatuses } from "@/constants/status"

interface PrintEvolutionsOptions {
  evolutionNotes: any[]
  patientFullName: string
  patientAge: string | number
  patientDocId: string
  doctorName?: string
  doctorSpecialty?: string
  settings?: any
}

export function printEvolutionsSheet({
  evolutionNotes = [],
  patientFullName,
  patientAge,
  patientDocId,
  doctorName,
  doctorSpecialty,
  settings,
}: PrintEvolutionsOptions) {
  const clinicName = settings?.clinicName?.trim() || "Carmo Dental"
  const clinicSlogan = settings?.slogan?.trim() || "Clínica de Especialidades Odontológicas"
  const clinicRuc = settings?.ruc?.trim() || "1719231696001"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "(+593) 99 999 9999"

  const rawAddress = settings?.address?.trim()
  const rawCity = settings?.city?.trim()
  const rawCountry = settings?.country?.trim()
  const clinicAddress = [rawAddress, rawCity, rawCountry].filter(Boolean).join(" • ") || "José Argudo S24-72 y Av. Solanda • Quito, Ecuador"

  const doctorHolder = settings?.razonSocial?.trim() || "Dr. Especialista Asignado"
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const activeDoctorName = doctorName || doctorHolder
  const activeDoctorSpecialty = doctorSpecialty || "Odontología General"

  const isMonochrome = settings?.defaultPrintMode === "bw"
  const filterStyle = isMonochrome ? "filter: grayscale(100%);" : ""
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 8) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)

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

        /* ESTADO VACÍO */
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

        /* REGISTRO DE EVOLUCIONES */
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
        .note-code {
          font-size: 12px;
          font-weight: 800;
          color: #008bcd;
        }
        .note-date {
          font-size: 10px;
          color: #64748b;
          font-family: monospace;
        }
        .note-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 14px;
          border: 1px solid #cbd5e1;
        }
        .note-content {
          font-size: 12px;
          color: #1e293b;
          line-height: 1.55;
          white-space: pre-wrap;
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
              <div class="card-sub"><b>C.I. / Doc:</b> ${patientDocId || "No registrado"} &nbsp;•&nbsp; <b>Edad:</b> ${patientAge ? `${patientAge} Años` : "--"}</div>
            </div>
            <div class="patient-col">
              <div class="card-label">Profesional Responsable</div>
              <div class="card-title">${activeDoctorName.toLowerCase()}</div>
              <div class="card-sub"><b>Especialidad:</b> ${activeDoctorSpecialty}</div>
            </div>
          </div>

          <div class="section-bar">
            <div class="section-title">Línea de Tiempo de Intervenciones Clínicas</div>
            <div class="section-counter">Total Registros: ${evolutionNotes.length}</div>
          </div>

          ${
            evolutionNotes.length === 0
              ? `<div class="empty-state">No hay registros clínicos para este paciente.</div>`
              : `<div class="notes-list">
                  ${evolutionNotes
                    .map((note) => {
                      const statusConfig = treatmentStatuses[note.status] || treatmentStatuses.IN_PROGRESS
                      const noteDate = note.createdAt ? format(new Date(note.createdAt), "dd/MM/yyyy HH:mm", { locale: es }) : "--"
                      return `
                        <div class="note-card">
                          <div class="note-header">
                            <div>
                              <span class="note-code">Evolución #${note.id?.slice(-4).toUpperCase() || "EVOL"}</span>
                              <span class="note-date"> - ${noteDate}</span>
                            </div>
                            <span class="note-badge">${statusConfig.label}</span>
                          </div>
                          <div class="note-content">${note.content}</div>
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