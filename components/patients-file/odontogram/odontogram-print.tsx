import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PrintOdontogramOptions {
  records: any[]
  view: string
  dentition: string
  patientFullName?: string
  patientDocId?: string
  doctorName?: string
  doctorSpecialty?: string
  getStatusLabel: (val: string) => string
  settings?: any
}

const formatSurfacesForPrint = (surfaces: string[] | string, toothNumber: number): string => {
  const list = Array.isArray(surfaces) ? surfaces : [surfaces]
  const isTotal = list.length === 0 || list.includes("TODA_LA_PIEZA") || list.includes("all")

  if (isTotal) return "Toda la pieza"

  const quadrant = Math.floor(toothNumber / 10)

  const translate = (surface: string): string => {
    const low = surface?.toLowerCase()?.trim() || ""

    if (low === "center" || low === "middle") return "Oclusal / Incisal"
    if (low === "top") return "Vestibular"
    if (low === "bottom") {
      return toothNumber >= 31 && toothNumber <= 48 ? "Lingual" : "Palatino"
    }
    if (low === "left") {
      return quadrant === 1 || quadrant === 4 ? "Distal" : "Mesial"
    }
    if (low === "right") {
      return quadrant === 1 || quadrant === 4 ? "Mesial" : "Distal"
    }
    if (low === "mesial") return "Mesial"
    if (low === "distal") return "Distal"
    if (low === "vestibular") return "Vestibular"
    if (low === "lingual") return "Lingual"
    if (low === "palatino" || low === "palatina") return "Palatino"
    if (low === "oclusal") return "Oclusal"
    if (low === "incisal") return "Incisal"

    return surface
  }

  return list.map(translate).join(" • ")
}

export function printOdontogramSheet({
  records = [],
  view,
  dentition,
  patientFullName = "Paciente",
  patientDocId = "No registrado",
  doctorName,
  doctorSpecialty,
  getStatusLabel,
  settings,
}: PrintOdontogramOptions) {
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
  const activeDoctor = doctorName || doctorHolder

  const isMonochrome = settings?.defaultPrintMode === "bw"
  const filterStyle = isMonochrome ? "filter: grayscale(100%);" : ""
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 8) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)

  const viewFormatted = view.toLowerCase() === "diagnostic" || view.toLowerCase() === "diagnostico" 
    ? "Diagnóstico" 
    : view.toLowerCase() === "evolution" || view.toLowerCase() === "evolucion"
    ? "Evolución"
    : view

  const dentitionFormatted = dentition.toLowerCase() === "permanent" || dentition.toLowerCase() === "permanente"
    ? "Permanente"
    : dentition.toLowerCase() === "temporary" || dentition.toLowerCase() === "temporal"
    ? "Temporal"
    : dentition

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Odontograma (${viewFormatted}) - ${patientFullName}</title>
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
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }
        thead th {
          background-color: #f8fafc;
          color: #475569;
          font-size: 10px;
          font-weight: 700;
          padding: 10px 14px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        tbody td {
          padding: 11px 14px;
          font-size: 11px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
        }
        tbody tr:last-child td {
          border-bottom: none;
        }
        tbody tr:nth-child(even) {
          background-color: #fafbfc;
        }
        .tooth-col {
          font-weight: 800;
          color: #008bcd;
          font-family: monospace;
          font-size: 12px;
          width: 70px;
        }
        .surface-col {
          color: #334155;
          font-weight: 600;
          width: 180px;
        }
        .status-col {
          font-weight: 700;
          color: #0f172a;
        }
        .notes-col {
          color: #64748b;
          font-style: italic;
        }
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
              <div class="header-badge">Odontograma (${viewFormatted})</div>
              <div class="emission-date">Fecha: <b>${today}</b></div>
            </div>
          </div>

          <div class="patient-card">
            <div class="patient-col">
              <div class="card-label">Paciente</div>
              <div class="card-title">${patientFullName.toLowerCase()}</div>
              <div class="card-sub"><b>Documento:</b> ${patientDocId}</div>
            </div>
            <div class="patient-col">
              <div class="card-label">Especialista / Dentición</div>
              <div class="card-title">${activeDoctor.toLowerCase()}</div>
              <div class="card-sub">
                Dentición: <b>${dentitionFormatted}</b>
                ${doctorSpecialty ? ` &nbsp;•&nbsp; ${doctorSpecialty}` : ""}
              </div>
            </div>
          </div>

          <div class="section-bar">
            <div class="section-title">Registro de Hallazgos Odontológicos</div>
            <div class="section-counter">Total Hallazgos: ${records.length}</div>
          </div>

          ${
            records.length === 0
              ? `<div class="empty-state">No hay afecciones ni tratamientos registrados en este esquema.</div>`
              : `<table>
                  <thead>
                    <tr>
                      <th class="tooth-col">Pieza</th>
                      <th class="surface-col">Superficie(s)</th>
                      <th>Diagnóstico / Procedimiento</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${records
                      .map((r) => `
                        <tr>
                          <td class="tooth-col">#${r.toothNumber}</td>
                          <td class="surface-col">${formatSurfacesForPrint(r.surfaces, r.toothNumber)}</td>
                          <td class="status-col">${getStatusLabel(r.status)}</td>
                          <td class="notes-col">${r.notes ? `"${r.notes}"` : "--"}</td>
                        </tr>
                      `)
                      .join("")}
                  </tbody>
                </table>`
          }
        </div>

        <div class="footer">
          <div class="footer-brand">${clinicName} - ${clinicSlogan}</div>
          <div class="footer-meta">Dirección: ${clinicAddress} • Cel: ${clinicPhone}</div>
          <div class="footer-disclaimer">Documento clínico odontológico generado electrónicamente.</div>
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