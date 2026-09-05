"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ClinicBrandInfo {
  name?: string
  ruc?: string
  phone?: string
  address?: string
  logoUrl?: string
}

interface PrintArqueoTemplateProps {
  payments: any[]
  dateFilter: string
  clinicData?: ClinicBrandInfo
  cashierName?: string
}

export function PrintArqueoTemplate({ 
  payments = [], 
  dateFilter, 
  clinicData,
  cashierName = "Cajero de Turno"
}: PrintArqueoTemplateProps) {
  const totalEfectivo = payments.filter(p => p.method === "CASH").reduce((a, b) => a + Number(b.amount || 0), 0)
  const totalTransferencias = payments.filter(p => p.method === "TRANSFER").reduce((a, b) => a + Number(b.amount || 0), 0)
  const totalCredito = payments.filter(p => p.method === "CREDIT_CARD").reduce((a, b) => a + Number(b.amount || 0), 0)
  const totalDebito = payments.filter(p => p.method === "DEBIT_CARD").reduce((a, b) => a + Number(b.amount || 0), 0)
  const totalTarjetas = totalCredito + totalDebito
  const totalGeneral = totalEfectivo + totalTransferencias + totalTarjetas

  const getFiltroLabel = () => {
    switch (dateFilter) {
      case "TODAY": return "Solo Hoy"
      case "YESTERDAY": return "Ayer"
      case "THIS_WEEK": return "Esta Semana"
      case "THIS_MONTH": return "Este Mes"
      default: return "Historial Completo"
    }
  }

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "CASH": return "Efectivo"
      case "TRANSFER": return "Transferencia"
      case "CREDIT_CARD": return "T. Crédito"
      case "DEBIT_CARD": return "T. Débito"
      default: return method
    }
  }

  return (
    <div className="hidden print:block absolute inset-0 bg-white text-slate-900 z-[99999] px-8 py-8 font-sans antialiased text-[11px] leading-tight">
      
      {/* ENCABEZADO INSTITUCIONAL */}
      <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          {clinicData?.logoUrl ? (
            <img 
              src={clinicData.logoUrl} 
              alt="Logo" 
              className="w-14 h-14 object-contain" 
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center font-black text-lg text-slate-800">
              CD
            </div>
          )}
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900 leading-none">
              {clinicData?.name || "CARMO DENTAL"}
            </h1>
            <p className="text-[10px] text-slate-600 mt-1 font-semibold">
              RUC: {clinicData?.ruc || "1790000000001"} • Telf: {clinicData?.phone || "0992550241"}
            </p>
            <p className="text-[9px] text-slate-500">
              {clinicData?.address || "Quito, Ecuador"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-slate-300">
            Arqueo de Turno / Caja
          </span>
          <p className="text-xs font-bold text-slate-700 mt-1.5">
            Período: <strong className="text-[#008bcd]">{getFiltroLabel()}</strong>
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5">
            Emisión: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
          </p>
        </div>
      </div>

      {/* TARJETAS RESUMEN DE GAVETA */}
      <div className="grid grid-cols-5 gap-2.5 mb-6">
        <div className="border-2 border-slate-800 rounded-lg p-2.5 bg-slate-50">
          <p className="text-[9px] font-bold text-slate-600 uppercase">Total Recaudado</p>
          <p className="text-lg font-black text-slate-900">${totalGeneral.toFixed(2)}</p>
          <p className="text-[8px] text-slate-500">{payments.length} transacción(es)</p>
        </div>

        <div className="border border-slate-300 rounded-lg p-2.5 bg-white">
          <p className="text-[9px] font-bold text-slate-500 uppercase">Efectivo Físico</p>
          <p className="text-base font-black text-slate-800">${totalEfectivo.toFixed(2)}</p>
          <p className="text-[8px] text-slate-500">Gaveta monetaria</p>
        </div>

        <div className="border border-slate-300 rounded-lg p-2.5 bg-white">
          <p className="text-[9px] font-bold text-slate-500 uppercase">Transferencias</p>
          <p className="text-base font-black text-slate-800">${totalTransferencias.toFixed(2)}</p>
          <p className="text-[8px] text-slate-500">Bancos / QR</p>
        </div>

        <div className="border border-slate-300 rounded-lg p-2.5 bg-white">
          <p className="text-[9px] font-bold text-slate-500 uppercase">T. Débito</p>
          <p className="text-base font-black text-slate-800">${totalDebito.toFixed(2)}</p>
          <p className="text-[8px] text-slate-500">Vouchers POS</p>
        </div>

        <div className="border border-slate-300 rounded-lg p-2.5 bg-white">
          <p className="text-[9px] font-bold text-slate-500 uppercase">T. Crédito</p>
          <p className="text-base font-black text-slate-800">${totalCredito.toFixed(2)}</p>
          <p className="text-[8px] text-slate-500">Corriente / Diferido</p>
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS CON REFERENCIAS PARA AUDITORÍA */}
      <div className="mb-8">
        <div className="flex justify-between items-center border-b border-slate-400 pb-1.5 mb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Registro Detallado de Transacciones
          </h3>
          <span className="text-[9px] text-slate-500">Valores expresados en USD</span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-300 bg-slate-100 text-[9px] font-black uppercase text-slate-700">
              <th className="py-2 px-2 w-16">Fecha/Hora</th>
              <th className="py-2 px-2 w-24">N° Recibo</th>
              <th className="py-2 px-2">Paciente Titular</th>
              <th className="py-2 px-2 w-24">Método</th>
              <th className="py-2 px-2">Referencia / Lote POS</th>
              <th className="py-2 px-2 text-right w-20">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center italic text-slate-400 text-xs">
                  No existen cobros registrados en este período.
                </td>
              </tr>
            ) : (
              payments.map((p, idx) => (
                <tr key={idx} className="break-inside-avoid">
                  <td className="py-2 px-2 text-[10px] text-slate-600 font-mono">
                    {dateFilter === "TODAY" || dateFilter === "YESTERDAY" 
                      ? format(new Date(p.createdAt), "HH:mm")
                      : format(new Date(p.createdAt), "dd/MM HH:mm")}
                  </td>
                  <td className="py-2 px-2 font-mono font-bold text-slate-800">
                    {p.receiptNumber || `REC-${String(p.id).slice(-5).toUpperCase()}`}
                  </td>
                  <td className="py-2 px-2">
                    <span className="font-bold text-slate-900 block leading-none">
                      {p.patient?.firstName} {p.patient?.lastName}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      CI: {p.patient?.ci || "S/N"}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span className="font-bold text-slate-700 text-[10px]">
                      {getMethodBadge(p.method)}
                    </span>
                  </td>
                  <td className="py-2 px-2 font-mono text-[10px] text-slate-600">
                    {p.reference ? (
                      <span className="font-semibold">{p.reference}</span>
                    ) : (
                      <span className="text-slate-400 italic">N/A</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-black text-slate-900 font-mono">
                    ${Number(p.amount).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {payments.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-800 bg-slate-50 font-black text-xs">
                <td colSpan={5} className="py-2.5 px-2 text-right uppercase tracking-wider text-slate-700">
                  Total Liquidado:
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-sm text-slate-900">
                  ${totalGeneral.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* FIRMAS DE RESPONSABILIDAD (Evita cortes de página con print-together) */}
      <div className="grid grid-cols-2 gap-24 pt-12 mt-auto break-inside-avoid">
        <div className="text-center">
          <div className="border-t border-slate-400 pt-2 w-3/4 mx-auto">
            <p className="font-bold text-xs text-slate-800">{cashierName}</p>
            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Entregué Conforme (Cajero/a)</p>
          </div>
        </div>

        <div className="text-center">
          <div className="border-t border-slate-400 pt-2 w-3/4 mx-auto">
            <p className="font-bold text-xs text-slate-800">Administración / Auditoría</p>
            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Recibí Conforme (Caja Central)</p>
          </div>
        </div>
      </div>

    </div>
  )
}