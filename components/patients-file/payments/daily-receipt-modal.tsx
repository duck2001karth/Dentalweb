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

interface DailyReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  payment: any
  patient?: any
  allPaymentsOfDay?: any[]
  clinicInfo?: any
}

export function DailyReceiptModal({
  isOpen,
  onClose,
  payment,
  patient,
  allPaymentsOfDay = [],
  clinicInfo,
}: DailyReceiptModalProps) {
  const { settings } = useClinicSettings()

  if (!payment) return null
  const clinicName = settings?.clinicName?.trim() || clinicInfo?.clinicName || "Carmo Dental"
  const clinicRuc = settings?.ruc?.trim() || clinicInfo?.ruc || null
  const rawAddress = [settings?.address, settings?.city, settings?.country].filter(Boolean).join(", ")
  const clinicAddress = rawAddress || clinicInfo?.address || "Dirección no registrada"
  const clinicPhone = settings?.phone || settings?.whatsappNumber || clinicInfo?.phone || null
  const clinicEmail = settings?.email || clinicInfo?.email || null
  const currencySymbol = (settings?.currency || "USD").trim() + " "

  const logoUrl = settings?.logoUrl || clinicInfo?.logoUrl 
  const watermarkUrl = settings?.watermarkUrl || logoUrl
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 4) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)
  const isMonochrome = settings?.defaultPrintMode === "bw"

  const transactionDate = new Date()

  const dayPayments = allPaymentsOfDay.length > 0 ? allPaymentsOfDay : [payment]

  const totalCash = dayPayments
    .filter((p: any) => p.method === "CASH" || p.method === "EFECTIVO")
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

  const totalCard = dayPayments
    .filter((p: any) => p.method?.includes("CARD") || p.method?.includes("TARJETA"))
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

  const totalTransfer = dayPayments
    .filter((p: any) => p.method === "TRANSFER" || p.method === "TRANSFERENCIA" || p.method === "DEUNA")
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

  const totalDay = dayPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

  const handlePrint = () => {
    const printArea = document.getElementById("area-imprimible-diario")
    if (!printArea) return

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
          <title>Cierre de Caja - ${format(transactionDate, "dd/MM/yyyy")}</title>
          <style>
            @page {
                size: A4 portrait;
                margin: 10mm 12mm;
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
              padding: 12mm 15mm; 
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 14px;
              margin-bottom: 16px;
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
              font-size: 20px;
              font-weight: 900;
              color: #008bcd;
              text-transform: uppercase;
            }
            .brand-subtitle {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .clinic-meta {
              font-size: 10px;
              color: #64748b;
              margin-top: 4px;
            }
            .info-right {
              text-align: right;
              font-size: 10px;
              color: #334155;
              line-height: 1.4;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 10px 14px;
              border-radius: 8px;
              margin-bottom: 16px;
            }
            .kpi-label {
              font-size: 9px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
            }
            .kpi-value {
              font-size: 13px;
              font-weight: 900;
              color: #0f172a;
              margin-top: 2px;
            }
            .kpi-total-val {
              font-size: 15px;
              font-weight: 900;
              color: #008bcd;
              margin-top: 2px;
            }
            .section-title {
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 4px;
              margin-bottom: 6px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th {
              background: #f1f5f9;
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
                  <div class="brand-subtitle">${settings?.slogan || "Cierre y Arqueo Diario de Caja"}</div>
                  ${clinicRuc ? `<div class="clinic-meta">RUC: ${clinicRuc}</div>` : ""}
                </div>
              </div>
              <div class="info-right">
                <div style="font-weight: 700; color: #0f172a;">${clinicAddress}</div>
                ${clinicPhone ? `<div>Telf: ${clinicPhone}</div>` : ""}
                ${clinicEmail ? `<div>${clinicEmail}</div>` : ""}
                <div style="font-weight: 800; color: #008bcd; margin-top: 4px;">
                  Fecha: ${format(transactionDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                </div>
              </div>
            </div>

            <div class="kpi-grid">
              <div>
                <div class="kpi-label">Efectivo</div>
                <div class="kpi-value">${currencySymbol}${totalCash.toFixed(2)}</div>
              </div>
              <div>
                <div class="kpi-label">Tarjetas</div>
                <div class="kpi-value">${currencySymbol}${totalCard.toFixed(2)}</div>
              </div>
              <div>
                <div class="kpi-label">Transferencias</div>
                <div class="kpi-value">${currencySymbol}${totalTransfer.toFixed(2)}</div>
              </div>
              <div style="border-left: 1px solid #cbd5e1; padding-left: 8px;">
                <div class="kpi-label" style="color: #008bcd;">Total Recaudado</div>
                <div class="kpi-total-val">${currencySymbol}${totalDay.toFixed(2)}</div>
              </div>
            </div>

            <div class="section-title">Detalle de Cobros Registrados</div>
            <table>
              <thead>
                <tr>
                  <th># Recibo</th>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Medio</th>
                  <th style="text-align: right;">Monto</th>
                </tr>
              </thead>
              <tbody>
                ${dayPayments.map((item: any) => {
                  const patientName = item.patient
                    ? `${item.patient.firstName || ''} ${item.patient.lastName || ''}`.trim()
                    : (patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : "Paciente registrado")
                  
                  return `
                    <tr>
                      <td style="font-weight: 800; color: #008bcd;">${item.receiptNumber || `#REC-${item.id?.slice(-6)}`}</td>
                      <td>${format(new Date(item.createdAt || new Date()), "HH:mm")}</td>
                      <td style="font-weight: 700;">${patientName}</td>
                      <td>${formatPaymentMethod(item.method || item.paymentMethod)}</td>
                      <td style="text-align: right; font-weight: 900;">${currencySymbol}${Number(item.amount || 0).toFixed(2)}</td>
                    </tr>
                  `
                }).join("")}
              </tbody>
            </table>

            <div class="doc-footer">
              Documento de Cierre Contable Interno — ${clinicName}
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
      <DialogContent 
        className="sm:max-w-[920px] max-h-[92vh] flex flex-col bg-muted/30 border-border p-0 overflow-hidden rounded-2xl [&>button]:hidden font-sans antialiased"
      >
        <div className="bg-background px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 no-print">
          <div>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#008bcd]" />
              Comprobante Diario de Caja — {format(transactionDate, "dd/MM/yyyy")}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Resumen consolidado de ingresos de la jornada.</p>
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
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ESTILOS DE IMPRESIÓN Y SCROLL OCULTO */}
       <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
        {/* ÁREA DESPLAZABLE CENTRADA CON SCROLL OCULTO */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 sm:p-8 bg-slate-200/70 dark:bg-slate-800/60 flex justify-center items-start">
          <div 
            id="area-imprimible-diario" 
            className="bg-white p-8 sm:p-10 print:p-0 text-slate-900 w-full max-w-[210mm] min-h-[260mm] print:min-h-0 print:h-auto shadow-xl border border-slate-200 print:border-none rounded-lg print:rounded-none font-sans relative overflow-hidden my-auto"          >
            {/* MARCA DE AGUA CENTRADA EN LA HOJA */}
            <div 
              className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center"
              style={{ opacity: watermarkOpacity }}
            >
              <img 
                src={watermarkUrl} 
                alt="Marca de agua" 
                className={`max-w-[420px] max-h-[420px] w-auto h-auto object-contain ${isMonochrome ? "grayscale" : ""}`}
                style={{
                  transform: `scale(${watermarkScale})`,
                }} 
              />
            </div>

            <div className="relative z-10">
              {/* CABECERA DEL DOCUMENTO */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-5">
                <div className="flex items-center gap-4">
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className={`w-20 h-20 object-contain ${isMonochrome ? "grayscale" : ""}`}
                    onError={(e: any) => { e.currentTarget.style.display = 'none' }} 
                  />
                  <div>
                    <h1 className="text-2xl font-black text-[#008bcd] uppercase">{clinicName}</h1>
                    <h2 className="text-xs font-bold text-slate-500 uppercase mt-0.5">
                      {settings?.slogan || "Cierre y Arqueo Diario de Caja"}
                    </h2>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {clinicRuc ? (
                        <p className="font-semibold">RUC: {clinicRuc}</p>
                      ) : (
                        <span className="no-print inline-flex items-center gap-1 text-amber-600 text-[10px] font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
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
                    <span className="no-print inline-flex items-center gap-1 text-amber-600 text-[10px] font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <AlertTriangle className="w-3 h-3" /> Sin teléfono
                    </span>
                  )}
                  {clinicEmail && <p>{clinicEmail}</p>}
                  <p className="text-[#008bcd] font-bold mt-1">
                    Fecha: {format(transactionDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              {/* RESUMEN POR MÉTODOS DE PAGO */}
              <div className="grid grid-cols-4 gap-3 mb-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Efectivo</p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {currencySymbol}{totalCash.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Tarjetas</p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {currencySymbol}{totalCard.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Transferencias</p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {currencySymbol}{totalTransfer.toFixed(2)}
                  </p>
                </div>
                <div className="border-l border-slate-300 pl-3">
                  <p className="text-[10px] font-bold text-[#008bcd] uppercase">Total Recaudado</p>
                  <p className="text-base font-black text-[#008bcd]">
                    {currencySymbol}{totalDay.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* TABLA DE COBROS */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider border-b-2 border-slate-800 pb-1 text-slate-900">
                  Detalle de Cobros Registrados
                </h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100/90 font-bold text-slate-700">
                      <th className="py-2 px-2"># Recibo</th>
                      <th className="py-2 px-2">Hora</th>
                      <th className="py-2 px-2">Paciente</th>
                      <th className="py-2 px-2">Medio</th>
                      <th className="py-2 px-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {dayPayments.map((item: any, idx: number) => {
                      const itemPatientName = item.patient
                        ? `${item.patient.firstName || ''} ${item.patient.lastName || ''}`.trim()
                        : (patient 
                            ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
                            : "Paciente registrado")

                      return (
                        <tr key={item.id || idx}>
                          <td className="py-2.5 px-2 font-bold text-[#008bcd]">
                            {item.receiptNumber || `#REC-${item.id?.slice(-6)}`}
                          </td>
                          <td className="py-2.5 px-2">
                            {format(new Date(item.createdAt || new Date()), "HH:mm")}
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-900">
                            {itemPatientName}
                          </td>
                          <td className="py-2.5 px-2">
                            {formatPaymentMethod(item.method || item.paymentMethod)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-black">
                            {currencySymbol}{Number(item.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* FOOTER */}
              <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Documento de Cierre Contable Interno — {clinicName}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}