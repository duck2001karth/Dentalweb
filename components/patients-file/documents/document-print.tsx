import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PrintClinicalDocOptions {
  document: any
  patientFullName: string
  patientAge?: string | number
  patientDocId?: string
  doctorSpecialty?: string
  doctorLicense?: string
  settings?: any
}

function sanitizeSig(sig?: string | null): string | null {
  if (!sig || typeof sig !== "string") return null
  const clean = sig.trim()
  if (clean.length < 50) return null
  if (clean.startsWith("data:image/") || clean.startsWith("http")) return clean
  return `data:image/png;base64,${clean}`
}

export function printClinicalDocSheet({
  document: doc,
  patientFullName,
  patientAge,
  patientDocId,
  doctorSpecialty = "Ortodoncia",
  doctorLicense = "",
  settings,
}: PrintClinicalDocOptions) {
  if (!doc) return

  const clinicName = settings?.clinicName?.trim() || "Carmo Dental"
  const clinicSlogan = settings?.slogan?.trim() || "Clínica de Especialidades Odontológicas"
  const clinicRuc = settings?.ruc?.trim() || "1719231696001"
  const rawAddress = settings?.address?.trim()
  const rawCity = settings?.city?.trim()
  const rawCountry = settings?.country?.trim()
  const clinicAddress = [rawAddress, rawCity, rawCountry].filter(Boolean).join(", ") || "Quito, Ecuador"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || ""
  const clinicEmail = settings?.email?.trim() || ""

  const isMonochrome = settings?.defaultPrintMode === "bw"
  const filterStyle = isMonochrome ? "filter: grayscale(100%);" : ""
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 7) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)
  const logoUrl = settings?.logoUrl || ""
  const watermarkUrl = settings?.watermarkUrl || settings?.logoUrl || ""

  const formattedDate = format(
    new Date(doc.createdAt || new Date()),
    "dd 'de' MMMM 'de' yyyy, HH:mm",
    { locale: es }
  )

  const rawDoctor = doc.specialistName || doc.author?.name || "Dr. Patricio C"
  const activeDoctorName = rawDoctor.startsWith("Dr") ? rawDoctor : `Dr. ${rawDoctor}`
  const activeSpecialty = doc.author?.specialty || doctorSpecialty
  const activeLicense =
    doc.author?.professionalCard ||
    doc.author?.licenseNumber ||
    doctorLicense ||
    "1824124AC-1234"

  const docIdShort = doc.id ? doc.id.substring(0, 8).toUpperCase() : "DOC-LEGAL"

  const patientSigUrl = sanitizeSig(doc.patientSignature)
  const doctorSigUrl = sanitizeSig(doc.doctorSignature || doc.author?.signatureBase64)

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${doc.title || "Consentimiento Informado"} - ${patientFullName}</title>
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
          width: 100%;
          background: #ffffff;
          color: #0f172a;
          line-height: 1.45;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .sheet {
          position: relative;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .watermark-bg {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(${watermarkScale});
          width: 340px;
          max-height: 340px;
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
          width: 100%;
        }

        /* ENCABEZADO */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          margin-bottom: 14px;
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
          text-transform: uppercase;
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
          letter-spacing: 0.3px;
          background: #f8fafc;
          color: #0f172a;
          text-transform: uppercase;
        }
        .emission-date {
          font-size: 8.5px;
          color: #64748b;
          margin-top: 4px;
        }
        .doc-ref {
          font-size: 8px;
          color: #94a3b8;
          font-family: monospace;
          margin-top: 2px;
        }

        /* CAJA DEL PACIENTE */
        .patient-card {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 16px;
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
          margin-top: 1px;
        }
        .card-sub {
          font-size: 10px;
          color: #334155;
          margin-top: 2px;
        }

        /* CONTENIDO DEL DOCUMENTO */
        .doc-title {
          font-size: 14px;
          font-weight: 900;
          color: #008bcd;
          border-left: 3.5px solid #008bcd;
          padding-left: 10px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: -0.2px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .doc-body {
          font-size: 10.5px;
          color: #1e293b;
          line-height: 1.55;
          white-space: pre-wrap;
          text-align: justify;
        }

        /* SECCIÓN DE FIRMAS */
        .signatures-section {
          margin-top: 32px;
          padding-top: 10px;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          text-align: center;
        }
        .sig-box {
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
          margin: 0 auto -8px auto;
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

        .footer-legal {
          text-align: center;
          margin-top: 20px;
          padding-top: 8px;
          border-top: 1px solid #008bcd;
          font-size: 7.5px;
          color: #94a3b8;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      </style>
    </head>
    <body>
      ${
        watermarkUrl
          ? `<div class="watermark-bg"><img src="${watermarkUrl}" alt="" /></div>`
          : ""
      }
      <div class="sheet">
        <div class="document-body">
          <!-- CABECERA -->
          <div class="header">
            <div class="header-left">
              ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" />` : ""}
              <div>
                <div class="clinic-brand">${clinicName}</div>
                ${clinicSlogan ? `<div class="clinic-slogan">${clinicSlogan}</div>` : ""}
                <div class="clinic-meta">
                  RUC: ${clinicRuc} &nbsp;•&nbsp; ${clinicAddress}
                  ${clinicPhone ? ` &nbsp;•&nbsp; Telf: ${clinicPhone}` : ""}
                </div>
              </div>
            </div>
            <div class="header-right">
              <div class="header-badge">Consentimiento Informado</div>
              <div class="emission-date">Fecha de Emisión: <b>${formattedDate}</b></div>
              <div class="doc-ref">REF: ${docIdShort}</div>
            </div>
          </div>

          <!-- DATOS DE FILIACIÓN -->
          <div class="patient-card">
            <div class="patient-col">
              <div class="card-label">Datos del Paciente</div>
              <div class="card-title">${patientFullName}</div>
              <div class="card-sub">
                <b>Doc. Identidad:</b> ${patientDocId || "No registrado"} &nbsp;•&nbsp;
                <b>Edad:</b> ${patientAge ? `${patientAge} Años` : "--"}
              </div>
            </div>
            <div class="patient-col">
              <div class="card-label">Profesional Tratante</div>
              <div class="card-title">${activeDoctorName}</div>
              <div class="card-sub">
                <b>Especialidad:</b> ${activeSpecialty}
                ${activeLicense ? ` &nbsp;•&nbsp; <b>Matrícula:</b> ${activeLicense}` : ""}
              </div>
            </div>
          </div>

          <!-- CONTENIDO DEL DOCUMENTO -->
          <div class="doc-title">${doc.title || "Consentimiento Legal"}</div>
          <div class="doc-body">${doc.content}</div>

          <!-- FIRMAS: IZQUIERDA PACIENTE / DERECHA DOCTOR -->
          <div class="signatures-section">
            <div class="signatures-grid">
              <!-- Firma Paciente -->
              <div class="sig-box">
                ${
                  patientSigUrl
                    ? `<img id="patient-sig" src="${patientSigUrl}" class="sig-img" alt="Firma Paciente" />`
                    : `<div class="sig-placeholder"></div>`
                }
                <div class="sig-line">
                  <div class="sig-title">${patientFullName}</div>
                  <div class="sig-role">Firma del Paciente / Tutor Legal (C.I.: ${patientDocId || "S/N"})</div>
                </div>
              </div>

              <!-- Firma Profesional -->
              <div class="sig-box">
                ${
                  doctorSigUrl
                    ? `<img id="doctor-sig" src="${doctorSigUrl}" class="sig-img" alt="Firma Doctor" />`
                    : `<div class="sig-placeholder"></div>`
                }
                <div class="sig-line">
                  <div class="sig-title">${activeDoctorName}</div>
                  <div class="sig-role">${activeLicense ? `Matrícula / Reg. MSP: ${activeLicense}` : "Firma y Sello del Especialista"}</div>
                </div>
              </div>
            </div>

            <div class="footer-legal">
              Documento emitido electrónicamente por el Sistema Clínico ${clinicName}. Registrado bajo estándares de auditoría médica legal. Válido sin tachaduras ni enmendaduras.
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

    const docImg = printDoc.getElementById("doctor-sig") as HTMLImageElement
    if (docImg && !docImg.complete) {
      docImg.onload = triggerPrint
      docImg.onerror = triggerPrint
    } else {
      setTimeout(triggerPrint, 400)
    }
  }
}