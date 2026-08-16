import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const docId = searchParams.get("id")
    const type = searchParams.get("type") // "pdf" | "xml"

    if (!docId) {
      return NextResponse.json({ error: "ID de documento requerido" }, { status: 400 })
    }

    const doc = await prisma.taxDocument.findUnique({
      where: { id: docId },
      include: { patient: true }
    })

    if (!doc) {
      return NextResponse.json({ error: "Documento tributario no encontrado" }, { status: 404 })
    }

    if (type === "xml") {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">
  <infoTributaria>
    <ambiente>2</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>CARMO DENTAL</razonSocial>
    <nombreComercial>CARMO DENTAL</nombreComercial>
    <ruc>1719231696001</ruc>
    <claveAcceso>${doc.accessKey || doc.authorizationNum || "1508202601171923169600120010010000001231234567811"}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>${doc.secuencial.replace(/[^0-9]/g, "").slice(-9).padStart(9, "0")}</secuencial>
    <dirMatriz>Quito, Ecuador</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${format(doc.authorizationDate || doc.createdAt, "dd/MM/yyyy")}</fechaEmision>
    <dirEstablecimiento>Quito, Ecuador</dirEstablecimiento>
    <obligadoContabilidad>NO</obligadoContabilidad>
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
    <moneda>DOLAR</moneda>
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
    const formattedDate = format(doc.authorizationDate || doc.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: es })
    const formattedTotal = Number(doc.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })

    const rideHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>RIDE - ${doc.secuencial}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 15px; margin: 0; }
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
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body onload="window.print()">
        <div class="header-grid">
          <div class="box box-left">
            <div class="title">CARMO DENTAL</div>
            <p class="bold">CLÍNICA DE ESPECIALIDADES ODONTOLÓGICAS</p>
            <p><b>RUC:</b> 1719231696001</p>
            <p><b>Dirección Matriz:</b> Quito, Ecuador</p>
            <p><b>Obligado a llevar Contabilidad:</b> NO</p>
          </div>
          <div class="box box-right">
            <p class="bold" style="font-size: 14px; color: #0f172a;">R.U.C. 1719231696001</p>
            <p class="bold" style="font-size: 13px; color: #008bcd;">FACTURA ELECTRÓNICA</p>
            <p><b>Nº:</b> ${doc.secuencial}</p>
            <p><b>Nº Autorización:</b></p>
            <div class="auth-box">${doc.authorizationNum || doc.accessKey || "PENDIENTE-DE-AUTORIZACION-SRI"}</div>
            <p style="margin-top: 6px;"><b>Ambiente:</b> PRODUCCIÓN</p>
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
      headers: { "Content-Type": "text/html; charset=utf-8" }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al procesar descarga" }, { status: 500 })
  }
}