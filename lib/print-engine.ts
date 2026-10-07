import { format } from "date-fns"
import { es } from "date-fns/locale"
import { escapeHTML } from "@/lib/sanitize"

export interface PrintEngineOptions {
  title: string
  documentTypeBadge?: string
  patient?: {
    firstName?: string
    lastName?: string
    ci?: string
    idDoc?: string
    age?: number | string
    birthDate?: string | Date
    phone?: string
    mobile?: string
    medicalAlerts?: string
  }
  settings?: any
  bodyHtml: string
  footerHtml?: string
  doctorName?: string
  specialty?: string
  showSignature?: boolean
}

const calculateAge = (birthDate: string | Date | undefined) => {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age > 0 ? age : null
}

export function executePrintEngine({
  title,
  documentTypeBadge = "DOCUMENTO CLÍNICO",
  patient,
  settings,
  bodyHtml,
  footerHtml,
  showSignature = true,
}: PrintEngineOptions) {
  // 1. Datos Clínicos y Fiscales
  const clinicName = escapeHTML(settings?.clinicName?.trim() || "Carmo Dental")
  const clinicSlogan = escapeHTML(settings?.slogan?.trim() || "Clínica de Especialidades Odontológicas")
  const clinicHolder = escapeHTML(settings?.razonSocial?.trim() || "Dr. Especialista")
  const clinicRuc = escapeHTML(settings?.ruc?.trim() || "")

  const rawAddress = settings?.address?.trim()
  const rawCity = settings?.city?.trim()
  const rawCountry = settings?.country?.trim()
  const clinicAddress = escapeHTML(
    [rawAddress, rawCity, rawCountry].filter(Boolean).join(", ") || "Quito, Ecuador"
  )

  const clinicPhone = escapeHTML(settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "(+593) 99 999 9999")
  const clinicEmail = escapeHTML(settings?.email?.trim() || "contacto@clinicadental.com")

  const isMonochrome = settings?.defaultPrintMode === "bw"
  const filterStyle = isMonochrome ? "filter: grayscale(100%);" : ""
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 8) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)
  const logoUrl = settings?.logoUrl || "/logosn.png"
  const watermarkUrl = settings?.watermarkUrl || settings?.logoUrl || "/logosn.png"

  // 2. Datos del Paciente
  const patientFullName = escapeHTML(
    patient ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() : "Paciente Registrado"
  )
  const patientDoc = escapeHTML(patient?.ci || patient?.idDoc || "--")
  const resolvedAge = patient?.age || calculateAge(patient?.birthDate)
  const patientAge = escapeHTML(resolvedAge ? `${resolvedAge} años` : "--")
  const patientPhone = escapeHTML(patient?.phone || patient?.mobile || "--")
  const patientMedicalAlerts = escapeHTML(patient?.medicalAlerts || "")
  const formattedPrintDate = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })

  // 3. Pie de página institucional refinado (Tipografía estilizada y franja azul continua)
  const defaultInstitutionalFooter = `
    <div style="margin-top: auto; padding-top: 28px; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
      ${showSignature ? `
        <!-- Línea de firma centrada y estilizada -->
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 20px;">
          <div style="border-bottom: 1px solid #334155; width: 220px; margin-bottom: 7px;"></div>
          <p style="font-size: 9.5px; font-weight: 700; color: #334155; letter-spacing: 1.2px; text-transform: uppercase;">
            FIRMA DEL PROFESIONAL
          </p>
        </div>
      ` : ""}

      <!-- Barra azul continua institucional -->
      <div style="width: 100%; border-bottom: 3.5px solid #008bcd; margin-bottom: 14px; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>

      <!-- Bloque de Contacto y Dirección fino y limpio -->
      <div style="text-align: center;">
        <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #0f2942; margin-bottom: 3.5px;">
          DIRECCIÓN: ${clinicAddress}
        </p>
        <p style="font-size: 9.5px; font-weight: 400; color: #64748b; letter-spacing: 0.2px;">
          Cel.: ${clinicPhone} <span style="display: inline-block; margin: 0 6px; color: #94a3b8; font-weight: 300;">•</span> e-mail: ${clinicEmail}
        </p>
      </div>

      <div style="text-align: center; margin-top: 14px; font-size: 7.5px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 500;">
        Documento médico confidencial generado por ${clinicName}.
      </div>
    </div>
  `

  // 4. Plantilla Maestra A4
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHTML(title)} - ${patientFullName}</title>
      <style>
        @page { size: A4 portrait; margin: 0mm; }
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
          -webkit-font-smoothing: antialiased; 
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
        }
        html, body { width: 100%; height: 100%; background: #ffffff; color: #0f172a; }
        .sheet { position: relative; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 16mm 18mm 14mm 18mm; display: flex; flex-direction: column; overflow: hidden; }
        .watermark-bg { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(${watermarkScale}); width: 450px; max-height: 450px; opacity: ${watermarkOpacity}; z-index: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; mix-blend-mode: multiply; }
        .watermark-bg img { width: 100%; height: 100%; object-fit: contain; ${filterStyle} }
        .document-body { position: relative; z-index: 10; flex: 1; display: flex; flex-direction: column; }
        
        /* Membrete */
        .header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 12px; margin-bottom: 16px; border-bottom: 3px solid #008bcd; }
        .header-left { display: flex; align-items: center; gap: 14px; }
        .logo { max-height: 52px; max-width: 150px; object-fit: contain; ${filterStyle} }
        .clinic-brand { font-size: 20px; font-weight: 800; color: #008bcd; letter-spacing: -0.3px; line-height: 1.1; text-transform: uppercase; }
        .clinic-slogan { font-size: 9.5px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
        .clinic-meta { font-size: 9px; color: #64748b; margin-top: 2px; }
        .header-right { text-align: right; }
        .holder-name { font-size: 11px; font-weight: 800; color: #008bcd; text-transform: uppercase; letter-spacing: 0.5px; }
        .holder-ruc { font-size: 9px; font-weight: 600; color: #475569; margin-top: 2px; }
        .doc-meta { margin-top: 6px; display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 9px; color: #64748b; }
        .doc-badge { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; }
        
        /* Tarjeta del Paciente */
        .patient-box { 
          background: #f8fafc; 
          border: 1px solid #e2e8f0; 
          border-radius: 10px; 
          padding: 12px 18px; 
          margin-bottom: 20px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
        }
        .patient-left .label { font-size: 8.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .patient-left .name { font-size: 15px; font-weight: 800; color: #0f172a; text-transform: capitalize; margin-top: 1px; }
        .patient-left .doc { font-size: 10.5px; color: #64748b; font-weight: 600; margin-top: 2px; }
        .patient-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
        .patient-meta { display: flex; gap: 16px; font-size: 10.5px; color: #475569; }
        .patient-meta span { color: #94a3b8; font-weight: 500; }
        .patient-meta b { color: #1e293b; font-weight: 700; }
        .alert-pill { 
          display: inline-flex; 
          align-items: center; 
          gap: 4px; 
          padding: 3px 8px; 
          border-radius: 6px; 
          background-color: #fff1f2; 
          border: 1px solid #fecdd3; 
          color: #e11d48; 
          font-size: 9px; 
          font-weight: 700; 
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="watermark-bg"><img src="${watermarkUrl}" alt="" /></div>
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
                <span class="doc-badge">${escapeHTML(documentTypeBadge)}</span>
              </div>
            </div>
          </div>

          ${patient ? `
            <div class="patient-box">
              <div class="patient-left">
                <div class="label">Paciente</div>
                <div class="name">${patientFullName.toLowerCase()}</div>
                <div class="doc">C.I. / Doc.: <b style="color: #0f172a; font-family: monospace;">${patientDoc}</b></div>
              </div>
              <div class="patient-right">
                <div class="patient-meta">
                  <div><span>Edad:</span> <b>${patientAge}</b></div>
                  <div><span>Teléfono:</span> <b>${patientPhone}</b></div>
                </div>
                ${patientMedicalAlerts ? `
                  <div class="alert-pill">
                    <span>⚠️ Alerta:</span> <span>${patientMedicalAlerts}</span>
                  </div>
                ` : ""}
              </div>
            </div>
          ` : ""}

          <!-- Contenido inyectado -->
          ${bodyHtml}

          <!-- Pie de página institucional -->
          ${footerHtml || defaultInstitutionalFooter}
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
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1500)
    }, 400)
  }
}