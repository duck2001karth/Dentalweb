"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PrintArqueoTemplateProps {
  payments: any[]
  dateFilter: string
}

export function PrintArqueoTemplate({ payments, dateFilter }: PrintArqueoTemplateProps) {
  // Cálculos rápidos para el reporte
  const totalEfectivo = payments.filter(p => p.method === "CASH").reduce((a, b) => a + Number(b.amount), 0)
  const totalTransferencias = payments.filter(p => p.method === "TRANSFER").reduce((a, b) => a + Number(b.amount), 0)
  const totalTarjetas = payments.filter(p => p.method === "CREDIT_CARD" || p.method === "DEBIT_CARD").reduce((a, b) => a + Number(b.amount), 0)
  const totalGeneral = totalEfectivo + totalTransferencias + totalTarjetas

  const getFiltroLabel = () => {
    switch(dateFilter) {
      case "TODAY": return "Solo Hoy"
      case "YESTERDAY": return "Ayer"
      case "THIS_WEEK": return "Esta Semana"
      case "THIS_MONTH": return "Este Mes"
      default: return "Historial Completo"
    }
  }

  return (
    // Este div está oculto en pantalla normal (hidden) pero ocupa toda la pantalla en blanco al imprimir (print:block)
    <div className="hidden print:block absolute inset-0 bg-white text-black z-[99999] px-10 py-12 font-sans">
      
      {/* ENCABEZADO CLÍNICO */}
      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">Carmo Dental</h1>
          <h2 className="text-lg font-bold text-slate-600 mt-1">Reporte de Arqueo y Caja</h2>
          <p className="text-sm text-slate-500 mt-2">
            <strong>Generado:</strong> {format(new Date(), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-700 uppercase">Período de Evaluación</p>
          <p className="text-lg font-black text-[#008bcd]">{getFiltroLabel()}</p>
        </div>
      </div>

      {/* RESUMEN FINANCIERO */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Ingresos</p>
          <p className="text-xl font-black">${totalGeneral.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="border border-slate-300 rounded-lg p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Efectivo Físico</p>
          <p className="text-xl font-black">${totalEfectivo.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="border border-slate-300 rounded-lg p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transferencias</p>
          <p className="text-xl font-black">${totalTransferencias.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="border border-slate-300 rounded-lg p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tarjetas (POS)</p>
          <p className="text-xl font-black">${totalTarjetas.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* TABLA DE DETALLE */}
      <div className="mb-12">
        <h3 className="text-sm font-black uppercase text-slate-800 border-b border-slate-300 pb-2 mb-4">Detalle de Transacciones</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 border-y border-slate-300 text-[10px] uppercase font-bold text-slate-600">
            <tr>
              <th className="py-3 px-2">Hora</th>
              <th className="py-3 px-2">Recibo</th>
              <th className="py-3 px-2">Paciente / CI</th>
              <th className="py-3 px-2">Método</th>
              <th className="py-3 px-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center italic text-slate-500">No hay movimientos registrados.</td></tr>
            ) : (
              payments.map((p, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-2">{format(new Date(p.createdAt), "HH:mm")}</td>
                  <td className="py-3 px-2 font-mono font-bold">{p.receiptNumber || `#REC-${p.id.slice(-6).toUpperCase()}`}</td>
                  <td className="py-3 px-2">
                    <p className="font-bold">{p.patient?.firstName} {p.patient?.lastName}</p>
                    <p className="text-[10px] text-slate-500">CI: {p.patient?.ci || "S/N"}</p>
                  </td>
                  <td className="py-3 px-2 uppercase">{p.method === "CASH" ? "Efectivo" : p.method === "TRANSFER" ? "Transferencia" : "Tarjeta"}</td>
                  <td className="py-3 px-2 text-right font-black">${Number(p.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FIRMAS DE RESPONSABILIDAD */}
      <div className="grid grid-cols-2 gap-20 pt-20 mt-auto">
        <div className="text-center border-t border-slate-400 pt-2">
          <p className="font-bold text-sm">Entregué Conforme</p>
          <p className="text-xs text-slate-500">Firma Cajero / Recepción</p>
        </div>
        <div className="text-center border-t border-slate-400 pt-2">
          <p className="font-bold text-sm">Recibí Conforme</p>
          <p className="text-xs text-slate-500">Firma Administrador / Auditor</p>
        </div>
      </div>
    </div>
  )
}