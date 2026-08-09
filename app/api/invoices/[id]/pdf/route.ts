import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Comprobante de Pago #${id}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
        .title { color: #008bcd; font-size: 24px; font-weight: bold; }
        .badge { background: #d1fae5; color: #059669; padding: 6px 12px; rounded-radius: 8px; font-weight: bold; font-size: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 13px; }
        th { background: #f8fafc; font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 11px; }
        .total-box { margin-top: 30px; text-align: right; font-size: 18px; font-weight: bold; color: #059669; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">Clínica Odontológica</div>
          <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Comprobante Oficial de Transacción</p>
        </div>
        <div class="badge">COMPROBANTE PAGADO</div>
      </div>

      <div class="info-grid">
        <div>
          <strong style="color: #64748b; font-size: 11px; text-transform: uppercase;">Nº de Recibo:</strong>
          <p style="margin-top: 4px; font-weight: bold;">#${id}</p>
        </div>
        <div>
          <strong style="color: #64748b; font-size: 11px; text-transform: uppercase;">Fecha de Emisión:</strong>
          <p style="margin-top: 4px; font-weight: bold;">${new Date().toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descripción de Prestación</th>
            <th>Estado Pago</th>
            <th style="text-align: right;">Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tratamiento Dental Aprobado</td>
            <td>PAGADO EN CAJA</td>
            <td style="text-align: right; font-weight: bold;">$3,100.00 USD</td>
          </tr>
        </tbody>
      </table>

      <div class="total-box">
        Total Abonado: $3,100.00 USD
      </div>

      <script>
        // Dispara la vista de impresión automáticamente si el usuario lo desea
        // window.print();
      </script>
    </body>
    </html>
  `

  return new NextResponse(htmlContent, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}