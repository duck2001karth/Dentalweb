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
  doctorLicense?: string
  doctorSignature?: string | null
  patientSignature?: string | null
  settings?: any
}

function sanitizeSignature(sig?: string | null): string | null {
  if (!sig || typeof sig !== "string") return null
  const clean = sig.trim()
  if (clean.length < 50) return null

  if (clean.startsWith("data:image/") || clean.startsWith("http")) {
    return clean
  }
  return `data:image/png;base64,${clean}`
}

export function printEvolutionsSheet({
  evolutionNotes = [],
  patientFullName,
  patientAge,
  patientDocId,
  doctorName,
  doctorSpecialty,
  doctorLicense,
  doctorSignature,
  patientSignature,
  settings,
}: PrintEvolutionsOptions) {
  const clinicName = settings?.clinicName?.trim() || "Carmo Dental"
  const clinicSlogan = settings?.slogan?.trim() || "Clínica de Sonrisa"
  const clinicRuc = settings?.ruc?.trim() || "1700000083134"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "969834557"
  const rawAddress = settings?.address?.trim()
  const rawCity = settings?.city?.trim()
  const rawCountry = settings?.country?.trim()
  const clinicAddress = [rawAddress, rawCity, rawCountry].filter(Boolean).join(" • ") || "Solanda, Av Jose Argudo • Quito • Ecuador"

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const rawDoc = doctorName || "Patricio C"
  const activeDoctorName = rawDoc.startsWith("Dr") ? rawDoc : `Dr. ${rawDoc}`
  const activeDoctorSpecialty = doctorSpecialty || "Ortodoncia"
  const activeDoctorLicense = doctorLicense || ""

  const isMonochrome = settings?.defaultPrintMode === "bw"
  const filterStyle = isMonochrome ? "filter: grayscale(100%);" : ""
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 7) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)

  const resolvedDoctorSig =
    sanitizeSignature(doctorSignature) ||
    sanitizeSignature(evolutionNotes.find((n) => n.professionalSignature)?.professionalSignature) ||
    sanitizeSignature(evolutionNotes.find((n) => n.author?.signatureBase64)?.author?.signatureBase64) ||
    null

  const resolvedPatientSig =
    sanitizeSignature(patientSignature) ||
    sanitizeSignature(evolutionNotes.find((n) => n.patientSignature)?.patientSignature) ||
    null

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Historial de Evoluciones Clínicas - ${patientFullName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 14mm 16mm 14mm 16mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        html, body {
          background: #ffffff;
          color: #0f172a;
          line-height: 1.4;
          width: 100%;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-container {
          padding: 4px 6px;
          margin: 0 auto;
          width: 100%;
          position: relative;
        }

        /* Marca de agua repetible de fondo */
        .watermark-bg {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(${watermarkScale});
          width: 330px;
          max-height: 330px;
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

        /* ENCABEZADO */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          margin-bottom: 12px;
          border-bottom: 2.5px solid #008bcd;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo {
          max-height: 48px;
          max-width: 130px;
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
          font-size: 9.5px;
          font-weight: 800;
          color: #1e293b;
          text-transform: uppercase;
          margin-top: 1px;
        }
        .clinic-meta {
          font-size: 8.5px;
          color: #64748b;
          margin-top: 2px;
        }
        .header-right {
          text-align: right;
        }
        .header-badge {
          display: inline-block;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          background: #f8fafc;
          color: #0f172a;
        }
        .emission-date {
          font-size: 8.5px;
          color: #64748b;
          margin-top: 4px;
        }

        /* FICHA DEL PACIENTE */
        .patient-card {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 14px;
          background: #f8fafc;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .patient-col {
          padding: 8px 12px;
        }
        .patient-col:first-child {
          border-right: 1px solid #e2e8f0;
        }
        .card-label {
          font-size: 8px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .card-title {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 2px;
        }
        .card-sub {
          font-size: 10px;
          color: #334155;
          margin-top: 2px;
        }

        /* BARRA SECCIÓN */
        .section-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 4px;
          margin-bottom: 10px;
          border-bottom: 1.5px solid #008bcd;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 10px;
          font-weight: 800;
          color: #008bcd;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .section-counter {
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
        }

        /* TARJETAS DE ENTRADAS CLÍNICAS (ANTISOLAPAMIENTO Y MULTIPÁGINA) */
        .note-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 10px;
          background: #ffffff;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 5px;
          margin-bottom: 6px;
        }
        .note-code {
          font-size: 10.5px;
          font-weight: 800;
          color: #008bcd;
        }
        .note-author {
          font-size: 10px;
          font-weight: 700;
          color: #0f172a;
          margin-left: 6px;
        }
        .note-date {
          font-size: 9px;
          color: #64748b;
          font-family: monospace;
        }
        .note-badge {
          font-size: 8px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 5px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
        }
        .note-content {
          font-size: 10.5px;
          color: #1e293b;
          line-height: 1.45;
          white-space: pre-wrap;
        }
        .note-image-box {
          margin: 6px 0 2px 0;
          max-width: 180px;
        }
        .note-image {
          max-height: 80px;
          max-width: 100%;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          object-fit: contain;
          display: block;
        }

        /* BLOQUE DE FIRMAS: MANTENIDO ÍNTEGRO SIN CORTES */
        .signatures-container {
          margin-top: 30px;
          padding-top: 10px;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .sig-box {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          min-height: 75px;
        }
        .sig-img {
          height: 52px;
          max-width: 170px;
          object-fit: contain;
          display: block;
          margin: 0 auto -8px auto; /* Baja la firma directamente sobre la línea */
        }
        .sig-placeholder {
          height: 52px;
        }
        .sig-line {
          width: 100%;
          border-top: 1.5px solid #0f172a;
          padding-top: 5px;
        }
        .sig-title {
          font-size: 10px;
          font-weight: 800;
          color: #0f172a;
        }
        .sig-role {
          font-size: 8.5px;
          color: #64748b;
          margin-top: 1px;
        }

        /* PIE DE PÁGINA */
        .footer {
          margin-top: 24px;
          padding-top: 8px;
          border-top: 1px solid #008bcd;
          text-align: center;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .footer-brand {
          font-size: 9px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
        }
        .footer-meta {
          font-size: 8px;
          color: #475569;
          margin-top: 1px;
        }
        .footer-disclaimer {
          font-size: 7.5px;
          font-style: italic;
          color: #94a3b8;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      ${
        settings?.watermarkUrl
          ? `<div class="watermark-bg"><img src="${settings.watermarkUrl}" alt="" /></div>`
          : ""
      }
      <div class="print-container">
        <div class="document-wrapper">
          <!-- HEADER -->
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
              <div class="header-badge">Historial de Evoluciones Clínicas</div>
              <div class="emission-date">Fecha de Emisión: <b>${today}</b></div>
            </div>
          </div>

          <!-- FICHA PACIENTE Y ESPECIALISTA -->
          <div class="patient-card">
            <div class="patient-col">
              <div class="card-label">Datos del Paciente</div>
              <div class="card-title">${patientFullName}</div>
              <div class="card-sub"><b>Identificación:</b> ${patientDocId || "No registrado"} &nbsp; • &nbsp; <b>Edad:</b> ${patientAge ? `${patientAge} Años` : "--"}</div>
            </div>
            <div class="patient-col">
              <div class="card-label">Especialista a Cargo</div>
              <div class="card-title">${activeDoctorName}</div>
              <div class="card-sub"><b>Especialidad:</b> ${activeDoctorSpecialty} ${
                activeDoctorLicense ? `&nbsp; • &nbsp; <b>Matrícula:</b> ${activeDoctorLicense}` : ""
              }</div>
            </div>
          </div>

          <!-- BARRA REGISTROS -->
          <div class="section-bar">
            <div class="section-title">Registro Cronológico de Actos Clínicos</div>
            <div class="section-counter">${evolutionNotes.length} Registro(s)</div>
          </div>

          <!-- LISTADO DE ENTRADAS CLÍNICAS -->
          <div class="notes-list">
          ${
            evolutionNotes.length === 0
              ? `<div style="text-align:center; padding: 40px; color:#64748b; font-size:11px; font-style:italic;">No existen evoluciones clínicas registradas para este paciente.</div>`
              : evolutionNotes
                  .map((note) => {
                    const statusConfig = treatmentStatuses[note.status] || treatmentStatuses.IN_PROGRESS
                    const rawDate = note.date || note.createdAt
                    const noteDate = rawDate
                      ? format(new Date(rawDate), "dd/MM/yyyy", { locale: es })
                      : "--"
                    const noteDocName = note.author?.name
                      ? `Dr. ${note.author.name.replace(/^Dr\.\s*/i, "")}`
                      : activeDoctorName

                    return `
                      <div class="note-card">
                        <div class="note-header">
                          <div>
                            <span class="note-code">Evolución #${note.id?.slice(-4).toUpperCase() || "EVOL"}</span>
                            <span class="note-author">• ${noteDocName}</span>
                            <span class="note-date">(${noteDate})</span>
                          </div>
                          <span class="note-badge">${statusConfig.label}</span>
                        </div>
                        <div class="note-content">${note.content}</div>${
                          note.fileUrl
                            ? `<div class="note-image-box"><img src="${note.fileUrl}" class="note-image" alt="Evidencia Clínica" /></div>`
                            : ""
                        }
                      </div>
                    `
                  })
                  .join("")
          }
          </div>

          <!-- FIRMAS ÚNICAS AL CIERRE -->
          <div class="signatures-container">
            <div class="signatures-grid">
              <div class="sig-box">
                ${
                  resolvedPatientSig
                    ? `<img id="patient-sig" src="${resolvedPatientSig}" class="sig-img" alt="Firma Paciente" />`
                    : `<div class="sig-placeholder"></div>`
                }
                <div class="sig-line">
                  <div class="sig-title">${patientFullName}</div>
                  <div class="sig-role">Firma de Conformidad (Paciente / Tutor)</div>
                </div>
              </div>

              <div class="sig-box">
                ${
                  resolvedDoctorSig
                    ? `<img id="doctor-sig" src="${resolvedDoctorSig}" class="sig-img" alt="Firma Profesional" />`
                    : `<div class="sig-placeholder"></div>`
                }
                <div class="sig-line">
                  <div class="sig-title">${activeDoctorName}</div>
                  <div class="sig-role">${activeDoctorLicense ? `Matrícula / Reg. MSP: ${activeDoctorLicense}` : "Firma del Profesional Asignado"}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="footer">
            <div class="footer-brand">${clinicName} - ${clinicSlogan}</div>
            <div class="footer-meta">Dirección: ${clinicAddress} • Cel.: ${clinicPhone}</div>
            <div class="footer-disclaimer">Documento clínico generado electrónicamente. Las firmas gozan de plena validez legal y auditoría interna.</div>
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

  const doc = iframe.contentWindow?.document
  if (doc) {
    doc.open()
    doc.write(htmlContent)
    doc.close()

    const triggerPrint = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 1500)
      }, 300)
    }

    const docImg = doc.getElementById("doctor-sig") as HTMLImageElement
    if (docImg && !docImg.complete) {
      docImg.onload = triggerPrint
      docImg.onerror = triggerPrint
    } else {
      setTimeout(triggerPrint, 400)
    }
  }
}