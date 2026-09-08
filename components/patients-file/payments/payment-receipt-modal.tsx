"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Printer, FileText, X, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { useClinicSettings } from "@/config/clinic-settings"

interface PaymentReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  payment: any
  patient: any
  clinicInfo?: any
}

const formatPaymentMethod = (method?: string) => {
  if (!method) return "Efectivo"
  const m = method.toUpperCase()
  switch (m) {
    case "CASH":
    case "EFECTIVO":
      return "Efectivo"
    case "CREDIT_CARD":
    case "TARJETA_CREDITO":
    case "TARJETA":
      return "Tarjeta de Crédito"
    case "DEBIT_CARD":
    case "TARJETA_DEBITO":
      return "Tarjeta de Débito"
    case "TRANSFER":
    case "TRANSFERENCIA":
    case "DEUNA":
      return "Transferencia Bancaria"
    case "CHECK":
    case "CHEQUE":
      return "Cheque"
    default:
      return method
  }
}

export function PaymentReceiptModal({
  isOpen,
  onClose,
  payment,
  patient,
  clinicInfo,
}: PaymentReceiptModalProps) {
  const { settings } = useClinicSettings()

  if (!payment) return null

  const clinicName = settings?.clinicName?.trim() || clinicInfo?.clinicName || "Nombre de Clinica"
  const clinicSlogan = settings?.slogan?.trim() || clinicInfo?.slogan || "Sonrisa slogan"
  const clinicRuc = settings?.ruc?.trim() || clinicInfo?.ruc || null
  const rawAddress = [settings?.address, settings?.city, settings?.country].filter(Boolean).join(", ")
  const clinicAddress = rawAddress || clinicInfo?.address || "Calle principal av. #123, Ciudad, País"
  const clinicPhone = settings?.phone || settings?.whatsappNumber || clinicInfo?.phone || null
  const clinicEmail = settings?.email || clinicInfo?.email || null
  const currencySymbol = (settings?.currency || "USD").trim() + " "

  const logoUrl = settings?.logoUrl || clinicInfo?.logoUrl 
  const watermarkUrl = settings?.watermarkUrl || logoUrl
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 4) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)
  const isMonochrome = settings?.defaultPrintMode === "bw"

  // 2. Datos del pago y paciente
  const patientName = patient 
    ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
    : payment?.patientName || "Paciente registrado"
  const patientCi = patient?.ci || payment?.patientCi || payment?.patientIdNum || "S/I"

  const receiptNum = payment.paymentNumber || payment.receiptNumber || `#REC-${payment.id?.slice(-6)}`
  const cleanReceiptNum = receiptNum.replace(/^#+/, "#")
  
  const treatmentName = payment.treatmentPlan?.name || payment.treatmentName || "Tratamiento Odontológico"
  const rawAmount = Number(payment.amount || payment.paidAmount || 0)
  const methodSpanish = formatPaymentMethod(payment.method || payment.paymentMethod)
  const invoiceNum = payment.invoiceNumber || payment.receiptNumberFiscal || payment.taxDocuments?.[0]?.secuencial || "-"
  const refCode = payment.reference ? `Ref: ${payment.reference}` : ""

  const receiptDate = payment.createdAt || payment.receiptDate || new Date()
  const dueDate = payment.dueDate || receiptDate

  let detailedItems: any[] = []
  if (payment.notes) {
    try {
      const parsedNotes = JSON.parse(payment.notes)
      if (Array.isArray(parsedNotes)) detailedItems = parsedNotes
    } catch {
    }
  }
  if (detailedItems.length === 0) {
    detailedItems = payment.itemsPaid || payment.treatmentPlan?.items || []
  }

  const handlePrint = () => {
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "none"
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprobante ${cleanReceiptNum} - ${clinicName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            body {
              background: #fff;
              color: #0f172a;
              padding: 0;
            }
            .watermark-container {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(${watermarkScale});
              width: 450px;
              height: 450px;
              opacity: ${watermarkOpacity};
              z-index: 0;
              pointer-events: none;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .watermark-container img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              ${isMonochrome ? "filter: grayscale(100%);" : ""}
            }
            .content-wrapper {
              position: relative;
              z-index: 1;
              padding: 10mm 12mm;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .brand-col {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .brand-logo {
              width: 65px;
              height: 65px;
              object-fit: contain;
              ${isMonochrome ? "filter: grayscale(100%);" : ""}
            }
            .brand-title {
              font-size: 22px;
              font-weight: 900;
              color: #008bcd;
              text-transform: uppercase;
              line-height: 1;
            }
            .brand-subtitle {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              margin-top: 3px;
              letter-spacing: 0.5px;
            }
            .clinic-meta {
              font-size: 10px;
              color: #64748b;
              margin-top: 3px;
            }
            .info-right {
              text-align: right;
              font-size: 10px;
              color: #334155;
              line-height: 1.4;
            }
            .patient-box {
              margin-bottom: 14px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
            }
            .section-title {
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 3px;
              margin-bottom: 6px;
              margin-top: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th {
              background: #f8fafc;
              padding: 6px 8px;
              text-align: left;
              font-weight: 800;
              color: #334155;
              border-bottom: 1px solid #cbd5e1;
            }
            td {
              padding: 6px 8px;
              border-bottom: 1px solid #e2e8f0;
            }
            .total-row {
              display: flex;
              justify-content: flex-end;
              padding-top: 6px;
              font-size: 11px;
              font-weight: 700;
            }
            .doc-footer {
              margin-top: 25px;
              padding-top: 8px;
              border-top: 1px solid #cbd5e1;
              text-align: center;
              font-size: 9px;
              font-weight: 700;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="watermark-container">
            <img src="${watermarkUrl}" alt="" />
          </div>

          <div class="content-wrapper">
            <div class="header-row">
              <div class="brand-col">
                <img src="${logoUrl}" class="brand-logo" alt="Logo" onerror="this.style.display='none'" />
                <div>
                  <div class="brand-title">${clinicName}</div>
                  <div class="brand-subtitle">${clinicSlogan}</div>
                  ${clinicRuc ? `<div class="clinic-meta">RUC: ${clinicRuc}</div>` : ""}
                </div>
              </div>
              <div class="info-right">
                <div style="font-weight: 700; color: #0f172a;">${clinicAddress}</div>
                ${clinicPhone ? `<div>Telf: ${clinicPhone}</div>` : ""}
                ${clinicEmail ? `<div>${clinicEmail}</div>` : ""}
                <div style="font-weight: 800; color: #008bcd; margin-top: 3px;">
                  EMISIÓN: ${format(new Date(receiptDate), "dd/MM/yyyy • HH:mm")}
                </div>
              </div>
            </div>

            <div class="patient-box">
              <div style="font-size: 14px; font-weight: 900; text-transform: uppercase; color: #0f172a;">
                Comprobante de Pago ${cleanReceiptNum}
              </div>
              <div style="font-size: 11px; margin-top: 3px; color: #334155;">
                Paciente: <b style="color: #0f172a;">${patientName}</b> &nbsp;•&nbsp; C.I.: <b style="color: #0f172a;">${patientCi}</b>
              </div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                Transacción registrada el ${format(new Date(receiptDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
              </div>
            </div>

            <div class="section-title">Cargos a abonar</div>
            <table>
              <thead>
                <tr>
                  <th>Nº Ref</th>
                  <th>Descripción</th>
                  <th style="text-align: right;">Abono</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 800; color: #008bcd;">${cleanReceiptNum}</td>
                  <td>
                    Tratamiento: <b>${treatmentName}</b><br/>
                    <span style="font-size: 10px; color: #64748b;">Convenio: ${patient?.convenio || "Sin convenio"}</span>
                  </td>
                  <td style="text-align: right; font-weight: 900;">
                    ${currencySymbol}${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="total-row">
              <span>Total: <b style="font-size: 13px; margin-left: 8px; color: #0f172a;">${currencySymbol}${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</b></span>
            </div>

            <div class="section-title">Transacciones</div>
            <table>
              <thead>
                <tr>
                  <th>Nº Transacción</th>
                  <th>Factura / Boleta</th>
                  <th>Medio de Pago</th>
                  <th>Fecha Vencimiento</th>
                  <th style="text-align: right;">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 800; color: #008bcd;">${cleanReceiptNum}</td>
                  <td>${invoiceNum}</td>
                  <td>${methodSpanish} ${refCode ? `<span style="font-size: 9px; color: #64748b;">(${refCode})</span>` : ""}</td>
                  <td>${format(new Date(dueDate), "dd/MM/yyyy")}</td>
                  <td style="text-align: right; font-weight: 900;">
                    ${currencySymbol}${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="total-row" style="border-top: 1px solid #cbd5e1; margin-top: 4px;">
              <span>Total Recibido: <b style="font-size: 13px; margin-left: 8px; color: #0f172a;">${currencySymbol}${rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</b></span>
            </div>

            ${detailedItems.length > 0 ? `
              <div class="section-title">Detalle de prestaciones abonadas</div>
              <table>
                <thead>
                  <tr>
                    <th>Pieza</th>
                    <th>Prestación / Procedimiento</th>
                    <th style="text-align: right;">Abonado</th>
                  </tr>
                </thead>
                <tbody>
                  ${detailedItems.map((item: any) => {
                    const tooth = item.tooth || item.toothNumber || "General"
                    const procName = item.procedureName || item.name || item.description || "Consulta / Procedimiento"
                    const amountVal = Number(item.appliedAmount || item.applied || item.cost || rawAmount)
                    return `
                      <tr>
                        <td style="font-weight: 700; color: #475569;">${typeof tooth === "number" || (!isNaN(Number(tooth)) && tooth !== "") ? `Pieza ${tooth}` : tooth}</td>
                        <td style="font-weight: 700;">${procName}</td>
                        <td style="text-align: right; font-weight: 900;">${currencySymbol}${amountVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    `
                  }).join("")}
                </tbody>
              </table>
            ` : ""}

            <div class="doc-footer">
              Comprobante de pago emitido por ${clinicName}. <br/> Gracias por su preferencia.
            </div>
          </div>
        </body>
      </html>
    `)
    doc.close()

    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1500)
    }, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[920px] max-h-[92vh] flex flex-col bg-muted/30 border-border p-0 overflow-hidden rounded-2xl [&>button]:hidden font-sans antialiased">
        
        {/* CABECERA MODAL */}
        <div className="bg-background px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 no-print">
          <div>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#008bcd]" />
              Vista Previa de Comprobante {cleanReceiptNum}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Revisa el formato antes de mandarlo a la impresora física.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              className="bg-[#008bcd] hover:bg-[#0070a8] text-white shadow-xs font-bold w-full sm:w-auto rounded-xl h-10 px-4 cursor-pointer" 
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" /> Mandar a Impresora
            </Button>

            <Button 
              variant="outline" 
              onClick={onClose} 
              className="rounded-xl h-10 w-10 p-0 cursor-pointer border-border hover:bg-muted"
              title="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* CSS PARA SCROLL OCULTO */}
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />

        {/* CONTENEDOR VISUAL CON FONDO CLARO */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 sm:p-8 bg-slate-200/70 dark:bg-slate-800/60 flex justify-center items-start">
          <div 
            id="area-imprimible" 
            className="bg-white p-8 sm:p-10 text-slate-900 w-full max-w-[210mm] min-h-[260mm] shadow-xl border border-slate-200 rounded-lg font-sans relative overflow-hidden my-auto"
          >
            {/* MARCA DE AGUA DINÁMICA CENTRADA */}
            <div 
              className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center select-none"
              style={{ opacity: watermarkOpacity }}
            >
              <img 
                src={watermarkUrl} 
                alt="Watermark" 
                className={`max-w-[420px] max-h-[420px] w-auto h-auto object-contain ${isMonochrome ? "grayscale" : ""}`}
                style={{ transform: `scale(${watermarkScale})` }}
              />
            </div>

            {/* CONTENIDO */}
            <div className="relative z-10">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className={`w-20 h-20 object-contain ${isMonochrome ? "grayscale" : ""}`}
                      onError={(e: any) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-[#008bcd] uppercase leading-none">
                      {clinicName}
                    </h1>
                    <h2 className="text-xs font-bold text-slate-500 uppercase mt-1.5">
                      {clinicSlogan}
                    </h2>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {clinicRuc ? (
                        <p className="font-semibold">RUC: {clinicRuc}</p>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-[10px] font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Sin RUC configurado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs font-semibold text-slate-600 leading-relaxed">
                  <p className="text-slate-900 font-bold">{clinicAddress}</p>
                  {clinicPhone ? (
                    <p>Telf: {clinicPhone}</p>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 text-[10px] font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <AlertTriangle className="w-3 h-3" /> Sin teléfono
                    </span>
                  )}
                  {clinicEmail && <p>{clinicEmail}</p>}
                  <p className="text-[#008bcd] font-bold mt-1 uppercase text-[10px]">
                    EMISIÓN: {format(new Date(receiptDate), "dd/MM/yyyy • HH:mm")}
                  </p>
                </div>
              </div>

              {/* DATOS DEL PACIENTE */}
              <div className="py-2 space-y-1 mb-5">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Comprobante de Pago</h2>
                <p className="text-xs font-medium text-slate-700">
                  Paciente: <span className="font-extrabold text-slate-900">{patientName}</span> &nbsp;•&nbsp; C.I.: <span className="font-extrabold text-slate-900">{patientCi}</span>
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Transacción registrada el {format(new Date(receiptDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>

              {/* SECCIÓN 1: CARGOS A ABONAR */}
              <div className="space-y-2 mt-4">
                <h3 className="text-xs font-black uppercase tracking-wider border-b-2 border-slate-800 pb-1 text-slate-900">
                  Cargos a abonar
                </h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 font-bold text-slate-700">
                      <th className="py-2 px-2">Nº Ref</th>
                      <th className="py-2 px-2">Descripción</th>
                      <th className="py-2 px-2 text-right">Abono</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    <tr>
                      <td className="py-2.5 px-2 font-bold text-[#008bcd]">{cleanReceiptNum}</td>
                      <td className="py-2.5 px-2">
                        Tratamiento: <span className="font-bold text-slate-900">{treatmentName}</span>
                        <br />
                        <span className="text-[10px] text-slate-500">Convenio: {patient?.convenio || "Sin convenio"}</span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-extrabold text-slate-900">
                        {currencySymbol}{rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex justify-end pt-1 text-xs font-bold">
                  <span>Total: <b className="text-base font-black ml-4 text-slate-900">{currencySymbol}{rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</b></span>
                </div>
              </div>

              {/* SECCIÓN 2: TRANSACCIONES */}
              <div className="space-y-2 mt-5">
                <h3 className="text-xs font-black uppercase tracking-wider border-b-2 border-slate-800 pb-1 text-slate-900">
                  Transacciones
                </h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 font-bold text-slate-700">
                      <th className="py-2 px-2">Nº Transacción</th>
                      <th className="py-2 px-2">Factura / Boleta</th>
                      <th className="py-2 px-2">Medio de Pago</th>
                      <th className="py-2 px-2">Fecha Vencimiento</th>
                      <th className="py-2 px-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    <tr>
                      <td className="py-2.5 px-2 font-bold text-[#008bcd]">{cleanReceiptNum}</td>
                      <td className="py-2.5 px-2">{invoiceNum}</td>
                      <td className="py-2.5 px-2 font-semibold">
                        {methodSpanish} {refCode && <span className="text-[10px] text-slate-500">({refCode})</span>}
                      </td>
                      <td className="py-2.5 px-2">{format(new Date(dueDate), "dd/MM/yyyy")}</td>
                      <td className="py-2.5 px-2 text-right font-extrabold text-slate-900">
                        {currencySymbol}{rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex justify-end pt-1 text-xs font-bold border-t border-slate-300">
                  <span>Total Recibido: <b className="text-base font-black ml-4 text-slate-900">{currencySymbol}{rawAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</b></span>
                </div>
              </div>

              {/* SECCIÓN 3: PRESTACIONES ABONADAS */}
              {detailedItems.length > 0 && (
                <div className="space-y-2 mt-5">
                  <h3 className="text-xs font-black uppercase tracking-wider border-b-2 border-slate-800 pb-1 text-slate-900">
                    Detalle de prestaciones abonadas
                  </h3>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-50 font-bold text-slate-700">
                        <th className="py-2 px-2">Pieza</th>
                        <th className="py-2 px-2">Prestación / Procedimiento</th>
                        <th className="py-2 px-2 text-right">Abonado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {detailedItems.map((item: any, idx: number) => {
                        const tooth = item.tooth || item.toothNumber || "General"
                        const procName = item.procedureName || item.name || item.description || "Consulta / Procedimiento"
                        const amountVal = Number(item.appliedAmount || item.applied || item.cost || rawAmount)
                        return (
                          <tr key={idx}>
                            <td className="py-2 px-2 font-bold text-slate-700">
                              {typeof tooth === "number" || (!isNaN(Number(tooth)) && tooth !== "") ? `Pieza ${tooth}` : tooth}
                            </td>
                            <td className="py-2 px-2 font-semibold text-slate-900">{procName}</td>
                            <td className="py-2 px-2 text-right font-extrabold text-slate-900">
                              {currencySymbol}{amountVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* FOOTER */}
              <div className="mt-10 pt-4 border-t border-slate-200 text-center flex flex-col items-center">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                  Comprobante de pago emitido por {clinicName}. <br/> Gracias por su preferencia.
                </p>
              </div>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}