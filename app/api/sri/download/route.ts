import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = "force-dynamic"

// Los datos del paciente, del emisor y de la base de datos NO son HTML/XML confiable.
function xmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function htmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function safeFilename(value: unknown): string {
  return String(value ?? "sin-numero")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 80) || "sin-numero"
}

const privateHeaders = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
}

export const GET = createApiHandler(
  { roles: ["ADMIN", "RECEPTIONIST", "DOCTOR"] },
  async (_req, { searchParams, audit }) => {
    const docId = searchParams.get("id")?.trim()
    const type = searchParams.get("type") ?? "pdf" // Compatibilidad: "pdf" abre el RIDE imprimible.

    if (!docId || docId.length > 128) {
      return NextResponse.json({ error: "ID de documento inválido" }, { status: 400, headers: privateHeaders })
    }
    if (type !== "xml" && type !== "pdf") {
      return NextResponse.json({ error: "Formato no permitido; usa pdf o xml" }, { status: 400, headers: privateHeaders })
    }

    const [doc, settings] = await Promise.all([
      prisma.taxDocument.findUnique({ where: { id: docId }, select: {
        id: true, patientId: true, environment: true, accessKey: true, authorizationNum: true,
        docType: true, secuencial: true, idType: true, businessName: true, identification: true,
        total: true, authorizationDate: true, createdAt: true, status: true, email: true,
      } }),
      prisma.clinicSettings.findFirst(),
    ])
    if (!doc) throw new Error("NOT_FOUND")

    const clinicRuc = settings?.ruc || "" // No inventar RUC para documentos fiscales.
    const clinicName = settings?.clinicName || "Carmo Dental"
    const clinicRazonSocial = settings?.razonSocial || clinicName
    const clinicAddress = settings?.address
      ? `${settings.address}, ${settings.city || "Ecuador"}`
      : "Dirección no configurada"
    const obligado = settings?.obligadoContab ? "SI" : "NO"
    const docTotal = Number(doc.total)
    if (!Number.isFinite(docTotal) || docTotal < 0) {
      return NextResponse.json({ error: "Importe fiscal inválido" }, { status: 409, headers: privateHeaders })
    }

    // No fabricar una factura XML para una nota de crédito: su estructura SRI es distinta.
    // Tampoco fabricar claves de acceso, autorizaciones ni números de RUC.
    if (type === "xml") {
      if (doc.docType !== "FACTURA") {
        return NextResponse.json({ error: "Este endpoint no genera XML de notas de crédito; utiliza el XML fiscal original autorizado." }, { status: 409, headers: privateHeaders })
      }
      const accessKey = doc.accessKey?.trim()
      if (!/^\d{49}$/.test(accessKey || "") || !/^\d{13}$/.test(clinicRuc)) {
        return NextResponse.json({ error: "Faltan RUC o clave de acceso fiscal válida; no se generará un XML ficticio." }, { status: 409, headers: privateHeaders })
      }
      const seq = doc.secuencial.replace(/\D/g, "")
      if (!seq || seq.length > 9) {
        return NextResponse.json({ error: "Secuencial fiscal inválido" }, { status: 409, headers: privateHeaders })
      }
      const total = docTotal.toFixed(2)
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">
  <infoTributaria>
    <ambiente>${doc.environment === "PRODUCTION" ? "2" : "1"}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${xmlEscape(clinicRazonSocial.toUpperCase())}</razonSocial>
    <nombreComercial>${xmlEscape(clinicName.toUpperCase())}</nombreComercial>
    <ruc>${xmlEscape(clinicRuc)}</ruc>
    <claveAcceso>${xmlEscape(accessKey)}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>${xmlEscape(settings?.estabCode || "001")}</estab>
    <ptoEmi>${xmlEscape(settings?.ptoEmiCode || "001")}</ptoEmi>
    <secuencial>${seq.padStart(9, "0")}</secuencial>
    <dirMatriz>${xmlEscape(clinicAddress)}</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${format(doc.authorizationDate || doc.createdAt, "dd/MM/yyyy")}</fechaEmision>
    <dirEstablecimiento>${xmlEscape(clinicAddress)}</dirEstablecimiento>
    <obligadoContabilidad>${obligado}</obligadoContabilidad>
    <tipoIdentificacionComprador>${doc.idType === "RUC" ? "04" : "05"}</tipoIdentificacionComprador>
    <razonSocialComprador>${xmlEscape(doc.businessName)}</razonSocialComprador>
    <identificacionComprador>${xmlEscape(doc.identification)}</identificacionComprador>
    <totalSinImpuestos>${total}</totalSinImpuestos>
    <totalDescuento>0.00</totalDescuento>
    <totalConImpuestos><totalImpuesto><codigo>2</codigo><codigoPorcentaje>0</codigoPorcentaje><baseImponible>${total}</baseImponible><valor>0.00</valor></totalImpuesto></totalConImpuestos>
    <propina>0.00</propina>
    <importeTotal>${total}</importeTotal>
    <moneda>${xmlEscape(settings?.currency || "USD")}</moneda>
  </infoFactura>
  <detalles><detalle>
    <codigoPrincipal>SERV-ODONT</codigoPrincipal>
    <descripcion>Servicios Clínicos Odontológicos</descripcion>
    <cantidad>1.00</cantidad><precioUnitario>${total}</precioUnitario><descuento>0.00</descuento>
    <precioTotalSinImpuesto>${total}</precioTotalSinImpuesto>
    <impuestos><impuesto><codigo>2</codigo><codigoPorcentaje>0</codigoPorcentaje><tarifa>0.00</tarifa><baseImponible>${total}</baseImponible><valor>0.00</valor></impuesto></impuestos>
  </detalle></detalles>
</factura>`
      // IMPORTANTE: XML reconstruido informativo, NO firmado, enviado ni autorizado por SRI.
      await audit({ action: "DOWNLOAD_TAX_XML", entity: "TaxDocument", entityId: doc.id,
        patientId: doc.patientId, details: `Consulta de XML informativo de factura ${doc.secuencial}` })
      return new NextResponse(xmlContent, {
        status: 200,
        headers: {
          ...privateHeaders,
          "Content-Type": "application/xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="factura-informativa-${safeFilename(doc.secuencial)}.xml"`,
        },
      })
    }

    const formattedDate = format(doc.authorizationDate || doc.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: es })
    const formattedTotal = docTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const isVoided = doc.status === "VOIDED"
    const isCredit = doc.docType === "NOTA_CREDITO"
    const rideHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RIDE - ${htmlEscape(doc.secuencial)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 15px; margin: 0; position: relative; }
    .header-grid { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
    .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
    .box-left, .box-right { width: 48%; }
    .box-right { background: #f8fafc; }
    .title { font-size: 16px; font-weight: bold; color: #008bcd; margin-bottom: 4px; }
    .bold { font-weight: bold; }
    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .table th, .table td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
    .table th { background: #f1f5f9; }
    .total-box { margin-top: 20px; display: flex; justify-content: flex-end; }
    .total-table { width: 260px; border-collapse: collapse; }
    .total-table td { border: 1px solid #cbd5e1; padding: 6px 10px; }
    .auth-box { font-family: monospace; font-size: 10px; word-break: break-all; margin-top: 5px; }
    .voided-stamp { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); font-size: 65px; font-weight: 900; color: rgba(225,29,72,.25); border: 5px dashed rgba(225,29,72,.4); padding: 10px 40px; border-radius: 12px; pointer-events: none; }
    .notice { color: #9a3412; font-size: 10px; margin: 8px 0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${isVoided ? '<div class="voided-stamp">DOCUMENTO ANULADO</div>' : ""}
  <p class="notice">Representación informativa generada desde los datos del sistema. Confirma la autorización y los detalles con el comprobante electrónico original. Para imprimir, usa la opción Imprimir del navegador.</p>
  <div class="header-grid">
    <div class="box box-left">
      <div class="title">${htmlEscape(clinicName.toUpperCase())}</div>
      <p class="bold">${htmlEscape(clinicRazonSocial)}</p>
      <p><b>RUC:</b> ${htmlEscape(clinicRuc || "No configurado")}</p>
      <p><b>Dirección Matriz:</b> ${htmlEscape(clinicAddress)}</p>
      <p><b>Obligado a llevar Contabilidad:</b> ${obligado}</p>
    </div>
    <div class="box box-right">
      <p class="bold">R.U.C. ${htmlEscape(clinicRuc || "No configurado")}</p>
      <p class="bold">${isCredit ? "NOTA DE CRÉDITO ELECTRÓNICA" : "FACTURA ELECTRÓNICA"}</p>
      <p><b>Nº:</b> ${htmlEscape(doc.secuencial)}</p>
      <p><b>Nº Autorización:</b></p>
      <div class="auth-box">${htmlEscape(doc.authorizationNum || doc.accessKey || "PENDIENTE DE AUTORIZACIÓN SRI")}</div>
      <p><b>Ambiente:</b> ${doc.environment === "PRODUCTION" ? "PRODUCCIÓN" : "PRUEBAS"}</p>
      <p><b>Emisión:</b> NORMAL</p>
    </div>
  </div>
  <div class="box" style="margin-bottom: 15px;">
    <p><b>Razón Social / Nombres:</b> ${htmlEscape(doc.businessName)}</p>
    <p><b>Identificación (${htmlEscape(doc.idType)}):</b> ${htmlEscape(doc.identification)}</p>
    <p><b>Fecha Emisión:</b> ${htmlEscape(formattedDate)}</p>
    <p><b>Email:</b> ${htmlEscape(doc.email || "N/A")}</p>
  </div>
  <table class="table"><thead><tr><th>Código</th><th>Descripción</th><th>Cantidad</th><th>Precio Unitario</th><th>Precio Total</th></tr></thead>
    <tbody><tr><td>SERV-01</td><td>${isCredit ? "Ajuste / Nota de crédito (detalle pendiente de comprobación)" : "Atención Odontológica Especializada"}</td><td>1.00</td><td>$${formattedTotal}</td><td>$${formattedTotal}</td></tr></tbody>
  </table>
  <div class="total-box"><table class="total-table">
    <tr><td><b>SUBTOTAL 0% (Salud):</b></td><td>$${formattedTotal}</td></tr>
    <tr><td><b>SUBTOTAL 15%:</b></td><td>$0.00</td></tr>
    <tr><td><b>IVA 0%:</b></td><td>$0.00</td></tr>
    <tr><td><b>VALOR TOTAL:</b></td><td><b>$${formattedTotal} USD</b></td></tr>
  </table></div>
</body>
</html>`

    await audit({ action: "VIEW_TAX_RIDE", entity: "TaxDocument", entityId: doc.id,
      patientId: doc.patientId, details: `Consulta de RIDE informativo ${doc.docType} ${doc.secuencial}` })
    return new NextResponse(rideHtml, {
      status: 200,
      headers: {
        ...privateHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'",
      },
    })
  }
)
