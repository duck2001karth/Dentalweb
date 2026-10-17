import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withProtection, ProtectedRouteContext } from "@/lib/api-wrapper"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const GET = withProtection(["ADMIN", "RECEPTIONIST", "DOCTOR"], async (req: Request, ctx: ProtectedRouteContext) => {
  const { audit } = ctx
  const { searchParams } = new URL(req.url)
  const docId = searchParams.get("id")
  const type = searchParams.get("type") // "pdf" | "xml"

  if (!docId) {
    return NextResponse.json({ error: "ID de documento requerido" }, { status: 400 })
  }

  const [doc, settings] = await Promise.all([
    prisma.taxDocument.findUnique({
      where: { id: docId },
      include: { patient: true }
    }),
    prisma.clinicSettings.findFirst()
  ])

  if (!doc) {
    return NextResponse.json({ error: "Documento tributario no encontrado" }, { status: 404 })
  }

  const clinicRuc = settings?.ruc || "1719231696001"
  const clinicName = settings?.clinicName || "Carmo Dental"
  const clinicRazonSocial = settings?.razonSocial || clinicName
  const clinicAddress = settings?.address ? `${settings.address}, ${settings.city || "Ecuador"}` : "Quito, Ecuador"
  const obligado = settings?.obligadoContab ? "SI" : "NO"

  // 2. AUDITORÍA CLÍNICA Y TRIBUTARIA (INYECTADA)
  await audit({
    action: type === "xml" ? "DOWNLOAD_TAX_XML" : "VIEW_TAX_RIDE",
    entity: "TaxDocument",
    entityId: doc.id,
    patientId: doc.patientId,
    details: `Descarga/Consulta de comprobante fiscal ${doc.docType} #${doc.secuencial} en formato ${type === "xml" ? "XML" : "RIDE"}`
  })

  // 3. GENERACIÓN DE XML
  if (type === "xml") {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">
  <infoTributaria>
    <ambiente>${doc.environment === "PRODUCTION" ? "2" : "1"}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${clinicRazonSocial.toUpperCase()}</razonSocial>
    <nombreComercial>${clinicName.toUpperCase()}</nombreComercial>
    <ruc>${clinicRuc}</ruc>
    <claveAcceso>${doc.accessKey || doc.authorizationNum || "1508202601171923169600120010010000001231234567811"}</claveAcceso>
    <codDoc>${doc.docType === "NOTA_CREDITO" ? "04" : "01"}</codDoc>
    <estab>${settings?.estabCode || "001"}</estab>
    <ptoEmi>${settings?.ptoEmiCode || "001"}</ptoEmi>
    <secuencial>${doc.secuencial.replace(/[^0-9]/g, "").slice(-9).padStart(9, "0")}</secuencial>
    <dirMatriz>${clinicAddress}</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${format(doc.authorizationDate || doc.createdAt, "dd/MM/yyyy")}</fechaEmision>
    <dirEstablecimiento>${clinicAddress}</dirEstablecimiento>
    <obligadoContabilidad>${obligado}</obligadoContabilidad>
    <tipoIdentificacionComprador>${doc.idType === "RUC" ? "04" : "05"}</tipoIdentificacionComprador>
    <razonSocialComprador>${doc.businessName}</razonSocialComprador>
    <identificacionComprador>${doc.identification}</identificacionComprador>
    <totalSinImpuestos>${Number(doc.total).toFixed(2)}</totalSinImpuestos>
    <totalDescuento>0.00</totalDescuento>
    <totalConImpuestos>
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>0</codigoPorcentaje>
        <baseImponible>${Number(doc.total).toFixed(2)}</baseImponible>
        <valor>0.00</valor>
      </totalImpuesto>
    </totalConImpuestos>
    <propina>0.00</propina>
    <importeTotal>${Number(doc.total).toFixed(2)}</importeTotal>
    <moneda>${settings?.currency || "USD"}</moneda>
  </infoFactura>
  <detalles>
    <detalle>
      <codigoPrincipal>SERV-ODONT</codigoPrincipal>
      <descripcion>Servicios Clínicos Odontológicos</descripcion>
      <cantidad>1.00</cantidad>
      <precioUnitario>${Number(doc.total).toFixed(2)}</precioUnitario>
      <descuento>0.00</descuento>
      <precioTotalSinImpuesto>${Number(doc.total).toFixed(2)}</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>0</codigoPorcentaje>
          <tarifa>0.00</tarifa>
          <baseImponible>${Number(doc.total).toFixed(2)}</baseImponible>
          <valor>0.00</valor>
        </impuesto>
      </impuestos>
    </detalle>
  </detalles>
</factura>`

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="factura-${doc.secuencial}.xml"`
      }
    })
  }

  // 4. GENERACIÓN DE RIDE (HTML imprimible A4)
  const formattedDate = format(doc.authorizationDate || doc.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: es })
  const formattedTotal = Number(doc.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })
  const isVoided = doc.status === "VOIDED"

  const rideHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>RIDE - ${doc.secuencial}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 15px; margin: 0; position: relative; }
        .header-grid { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
        .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
        .box-left { width: 48%; }
        .box-right { width: 48%; background: #f8fafc; }
        .title { font-size: 16px; font-weight: bold; color: #008bcd; margin-bottom: 4px; }
        .bold { font-weight: bold; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 10px; }
        .table td { border: 1px solid #cbd5e1; padding: 8px; }
        .total-box { margin-top: 20px; display: flex; justify-content: flex-end; }
        .total-table { width: 260px; border-collapse: collapse; }
        .total-table td { border: 1px solid #cbd5e1; padding: 6px 10px; }
        .auth-box { font-family: monospace; font-size: 10px; word-break: break-all; margin-top: 5px; }
        .voided-stamp {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 65px;
          font-weight: 900;
          color: rgba(225, 29, 72, 0.25);
          border: 5px dashed rgba(225, 29, 72, 0.4);
          padding: 10px 40px;
          border-radius: 12px;
          pointer-events: none;
          text-transform: uppercase;
        }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body onload="window.print()">
      ${isVoided ? '<div class="voided-stamp">DOCUMENTO ANULADO</div>' : ''}
      <div class="header-grid">
        <div class="box box-left">
          <div class="title">${clinicName.toUpperCase()}</div>
          <p class="bold">${clinicRazonSocial}</p>
          <p><b>RUC:</b> ${clinicRuc}</p>
          <p><b>Dirección Matriz:</b> ${clinicAddress}</p>
          <p><b>Obligado a llevar Contabilidad:</b> ${obligado}</p>
        </div>
        <div class="box box-right">
          <p class="bold" style="font-size: 14px; color: #0f172a;">R.U.C. ${clinicRuc}</p>
          <p class="bold" style="font-size: 13px; color: #008bcd;">${doc.docType === "NOTA_CREDITO" ? "NOTA DE CRÉDITO ELECTRÓNICA" : "FACTURA ELECTRÓNICA"}</p>
          <p><b>Nº:</b> ${doc.secuencial}</p>
          <p><b>Nº Autorización:</b></p>
          <div class="auth-box">${doc.authorizationNum || doc.accessKey || "PENDIENTE-DE-AUTORIZACION-SRI"}</div>
          <p style="margin-top: 6px;"><b>Ambiente:</b> ${doc.environment === "PRODUCTION" ? "PRODUCCIÓN" : "PRUEBAS"}</p>
          <p><b>Emisión:</b> NORMAL</p>
        </div>
      </div>
      <div class="box" style="margin-bottom: 15px;">
        <p><b>Razón Social / Nombres:</b> ${doc.businessName}</p>
        <p><b>Identificación (${doc.idType}):</b> ${doc.identification}</p>
        <p><b>Fecha Emisión:</b> ${formattedDate}</p>
        <p><b>Email:</b> ${doc.email || "N/A"}</p>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th style="text-align: right;">Cantidad</th>
            <th style="text-align: right;">Precio Unitario</th>
            <th style="text-align: right;">Precio Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SERV-01</td>
            <td>Atención Odontológica Especializada</td>
            <td style="text-align: right;">1.00</td>
            <td style="text-align: right;">$${formattedTotal}</td>
            <td style="text-align: right; font-weight: bold;">$${formattedTotal}</td>
          </tr>
        </tbody>
      </table>
      <div class="total-box">
        <table class="total-table">
          <tr>
            <td><b>SUBTOTAL 0% (Salud):</b></td>
            <td style="text-align: right;">$${formattedTotal}</td>
          </tr>
          <tr>
            <td><b>SUBTOTAL 15%:</b></td>
            <td style="text-align: right;">$0.00</td>
          </tr>
          <tr>
            <td><b>IVA 0%:</b></td>
            <td style="text-align: right;">$0.00</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="font-size: 12px; font-weight: bold; color: #008bcd;">VALOR TOTAL:</td>
            <td style="text-align: right; font-size: 12px; font-weight: bold; color: #059669;">$${formattedTotal} USD</td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `

  return new NextResponse(rideHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  })
})