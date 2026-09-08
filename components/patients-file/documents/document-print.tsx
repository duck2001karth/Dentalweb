import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PrintClinicalDocOptions {
  document: any
  patientFullName: string
  patientAge?: string | number
  patientDocId?: string
  doctorSpecialty?: string
  settings?: any
}

export function printClinicalDocSheet({
  document: doc,
  patientFullName,
  patientAge,
  patientDocId,
  doctorSpecialty = "Odontología General y Especialidades",
  settings,
}: PrintClinicalDocOptions) {
  if (!doc) return

  // 1. Configuración de la Clínica
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
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 8) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)
  const logoUrl = settings?.logoUrl || "/logosn.png"
  const watermarkUrl = settings?.watermarkUrl || settings?.logoUrl || "/logosn.png"

  // 2. Datos del Documento y Personal
  const formattedDate = format(
    new Date(doc.createdAt || new Date()),
    "dd 'de' MMMM 'de' yyyy, HH:mm",
    { locale: es }
  )

  const doctorName = doc.specialistName || doc.author?.name || "Dr(a). Profesional Tratante"
  const doctorSpecialtyFinal = doc.author?.specialty || doctorSpecialty
  const docIdShort = doc.id ? doc.id.substring(0, 10).toUpperCase() : "DOC-PEND"

  // 3. Generación del HTML
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${doc.title || "Documento Clínico"} - ${patientFullName}</title>
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
          align-items: flex-start;
          padding-bottom: 12px;
          margin-bottom: 16px;
          border-bottom: 3px solid #008bcd;
        }
        .header-left {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .logo {
          max-height: 64px;
          max-width: 160px;
          object-fit: contain;
          margin-top: 2px;
          ${filterStyle}
        }
        .clinic-brand {
          font-size: 22px;
          font-weight: 900;
          color: #008bcd;
          letter-spacing: -0.3px;
          line-height: 1.1;
          text-transform: uppercase;
        }
        .clinic-slogan {
          font-size: 10.5px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
          margin-bottom: 6px;
        }
        .clinic-meta {
          font-size: 9.5px;
          color: #64748b;
          line-height: 1.4;
        }
        
        .header-right {
          text-align: right;
          flex-shrink: 0;
        }
        .header-badge {
          display: inline-block;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 4px 14px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3px;
          background: #f8fafc;
          color: #334155;
          text-transform: uppercase;
        }
        .emission-date {
          font-size: 9.5px;
          color: #64748b;
          margin-top: 8px;
        }
        .doc-ref {
          font-size: 8.5px;
          color: #94a3b8;
          font-family: monospace;
          margin-top: 4px;
          letter-spacing: 0.5px;
        }

        /* CAJA DEL PACIENTE */
        .patient-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          margin-bottom: 24px;
          background: rgba(248, 250, 252, 0.8);
        }
        .patient-col {
          padding: 14px 18px;
        }
        .patient-col:first-child {
          border-right: 1px solid #e2e8f0;
        }
        .card-label {
          font-size: 9px;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 3px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .card-title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          text-transform: capitalize;
        }
        .card-sub {
          font-size: 11px;
          color: #475569;
          margin-top: 4px;
        }

        /* CONTENIDO DEL DOCUMENTO */
        .doc-content-area {
          flex: 1;
        }
        .doc-title {
          font-size: 16px;
          font-weight: 800;
          color: #008bcd;
          border-left: 4px solid #008bcd;
          padding-left: 12px;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: -0.2px;
        }
        .doc-body {
          font-size: 11.5px;
          color: #1e293b;
          line-height: 1.6;
          white-space: pre-wrap;
          padding-right: 16px;
          text-align: justify;
        }

        /* FIRMAS Y PIE */
        .signatures-section {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          page-break-inside: avoid;
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
        }
        .sig-line {
          height: 64px;
          width: 220px;
          border-bottom: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .sig-img {
          max-height: 56px;
          max-width: 100%;
          object-fit: contain;
          mix-blend-mode: multiply;
        }
        .sig-pending {
          font-size: 10px;
          color: #94a3b8;
          font-style: italic;
        }
        .sig-name {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
        }
        .sig-id {
          font-size: 9px;
          color: #64748b;
          margin-top: 2px;
        }
        .sig-role {
          font-size: 8.5px;
          color: #94a3b8;
          font-weight: 500;
          margin-top: 2px;
        }

        .footer-legal {
          text-align: center;
          margin-top: 24px;
          font-size: 8.5px;
          color: #94a3b8;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <!-- MARCA DE AGUA -->
        <div class="watermark-bg">
          <img src="${watermarkUrl}" alt="" />
        </div>

        <div class="document-body">
          <!-- CABECERA -->
          <div class="header">
            <div class="header-left">
              <img src="${logoUrl}" class="logo" alt="Logo" />
              <div>
                <div class="clinic-brand">${clinicName}</div>
                ${clinicSlogan ? `<div class="clinic-slogan">${clinicSlogan}</div>` : ""}
                <div class="clinic-meta">
                  <div>${clinicRuc ? `<b>RUC:</b> ${clinicRuc} &nbsp;•&nbsp; ` : ""}${clinicAddress}</div>
                  ${clinicPhone || clinicEmail ? `
                    <div style="margin-top: 2px;">
                      ${clinicPhone ? `<b>Telf:</b> ${clinicPhone}` : ""}
                      ${clinicPhone && clinicEmail ? ` &nbsp;•&nbsp; ` : ""}
                      ${clinicEmail ? `<b>Email:</b> ${clinicEmail}` : ""}
                    </div>
                  ` : ""}
                </div>
              </div>
            </div>
            <div class="header-right">
              <div class="header-badge">Documento Clínico Oficial</div>
              <div class="emission-date">Fecha de Emisión:<br><b style="color: #0f172a; font-size: 11px;">${formattedDate}</b></div>
              <div class="doc-ref">ID REF: ${docIdShort}</div>
            </div>
          </div>

          <!-- DATOS DE FILIACIÓN -->
          <div class="patient-card">
            <div class="patient-col">
              <div class="card-label">Datos del Paciente</div>
              <div class="card-title">${patientFullName.toLowerCase()}</div>
              <div class="card-sub">
                <b>Doc. Identidad:</b> ${patientDocId || "No registrado"} &nbsp;&nbsp;&nbsp; 
                <b>Edad:</b> ${patientAge ? `${patientAge} Años` : "--"}
              </div>
            </div>
            <div class="patient-col">
              <div class="card-label">Profesional Tratante</div>
              <div class="card-title">${doctorName.toLowerCase()}</div>
              <div class="card-sub"><b>Especialidad:</b> ${doctorSpecialtyFinal}</div>
            </div>
          </div>

          <!-- CONTENIDO DEL DOCUMENTO -->
          <div class="doc-content-area">
            <div class="doc-title">${doc.title || "Registro Clínico"}</div>
            <div class="doc-body">${doc.content}</div>
          </div>

          <!-- FIRMAS -->
          <div class="signatures-section">
            <div class="signatures-grid">
              
              <!-- Firma Paciente -->
              <div class="sig-box">
                <div class="sig-line">
                  ${doc.patientSignature 
                    ? `<img src="${doc.patientSignature}" class="sig-img" alt="Firma Paciente" />` 
                    : `<span class="sig-pending">Pendiente de firma digital</span>`
                  }
                </div>
                <div class="sig-name">${patientFullName.toLowerCase()}</div>
                <div class="sig-id">C.I.: ${patientDocId || "S/N"}</div>
                <div class="sig-role">Firma del Paciente / Tutor Legal</div>
              </div>

              <!-- Firma Profesional -->
              <div class="sig-box">
                <div class="sig-line">
                  ${doc.doctorSignature 
                    ? `<img src="${doc.doctorSignature}" class="sig-img" alt="Firma Doctor" />` 
                    : `<span class="sig-pending">Pendiente de firma digital</span>`
                  }
                </div>
                <div class="sig-name">${doctorName.toLowerCase()}</div>
                <div class="sig-id">${doctorSpecialtyFinal}</div>
                <div class="sig-role">Firma y Sello Odontológico</div>
              </div>

            </div>
            
            <div class="footer-legal">
              Documento emitido electrónicamente por el Sistema Clínico ${clinicName}. Registrado bajo estándares de auditoría médica. Válido sin tachaduras ni enmendaduras.
            </div>
          </div>

        </div>
      </div>
    </body>
    </html>
  `

  // Impresión aislada por IFRAME
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