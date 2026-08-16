"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface BalancePrintProps {
  patientFullName: string
  patientDocId: string
  patientAge?: string | number
  totalIncome: number
  totalRefunds: number
  netBalance: number
  pendingDebt: number
  transactions: any[]
  issuedBy?: string
}

export function BalancePrint({
  patientFullName,
  patientDocId,
  patientAge = "--",
  totalIncome = 0,
  totalRefunds = 0,
  netBalance = 0,
  pendingDebt = 0,
  transactions = [],
  issuedBy = "Administración / Caja",
}: BalancePrintProps) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })

  return (
    <div id="balance-printable" className="hidden print:block font-sans text-slate-900 bg-white min-h-[297mm] p-12 relative overflow-hidden">
      <div 
        aria-hidden="true" 
        className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none z-0"
      >
        <img 
          src="/logosn.png" 
          alt="Marca de Agua Carmo Dental" 
          className="w-[450px] object-contain"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-[265mm]">
        
        {/* CABECERA MEMBRETADA */}
        <div>
          <div className="flex justify-between items-start border-b-2 border-[#008bcd] pb-4">
            <div className="flex items-center gap-4">
              <img 
                src="/logosn.png" 
                alt="Logo Carmo Dental" 
                className="h-14 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-black text-[#008bcd] tracking-tight leading-none uppercase">
                  Carmo Dental
                </h1>
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mt-1">
                  Clínica de Especialidades Odontológicas
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  RUC: 1719231696001 | Solanda, Quito - Ecuador
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-slate-100 text-slate-800 text-[11px] font-black px-4 py-1.5 rounded-lg uppercase tracking-wider border border-slate-200">
                Estado de Cuenta Financiero
              </span>
              <p className="text-[11px] text-slate-500 font-medium mt-2">
                Fecha de Emisión: <b className="text-slate-800">{today}</b>
              </p>
            </div>
          </div>

          {/* DATOS DE FILIACIÓN DEL PACIENTE */}
          <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Datos del Paciente</p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{patientFullName}</p>
              <div className="flex gap-4 text-slate-600 mt-1">
                <p><b>Doc. Identidad:</b> {patientDocId}</p>
                <p><b>Edad:</b> {patientAge ? `${patientAge} Años` : "--"}</p>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Detalles de Emisión</p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{issuedBy}</p>
              <p className="text-slate-600 mt-1">
                <b>Tipo:</b> Consolidado de Pagos y Liquidación
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
            <p className="text-[10px] font-bold uppercase text-slate-500">Total Cobrado (+)</p>
            <p className="text-base font-black text-slate-900 mt-0.5">
              ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
            <p className="text-[10px] font-bold uppercase text-amber-700">Notas de Crédito (-)</p>
            <p className="text-base font-black text-amber-700 mt-0.5">
              ${totalRefunds.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="border-2 border-[#008bcd]/30 p-3 rounded-lg bg-[#008bcd]/5">
            <p className="text-[10px] font-bold uppercase text-[#008bcd]">Balance Neto Percibido</p>
            <p className="text-base font-black text-[#008bcd] mt-0.5">
              ${netBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className={`border p-3 rounded-lg ${pendingDebt > 0 ? "border-red-200 bg-red-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>
            <p className={`text-[10px] font-bold uppercase ${pendingDebt > 0 ? "text-red-700" : "text-emerald-700"}`}>
              {pendingDebt > 0 ? "Saldo Pendiente" : "Estado Contable"}
            </p>
            <p className={`text-base font-black mt-0.5 ${pendingDebt > 0 ? "text-red-700" : "text-emerald-700"}`}>
              {pendingDebt > 0 ? `$${pendingDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Al Día"}
            </p>
          </div>
        </div>
        <div className="flex-1 mt-2">
          <h2 className="text-xs font-bold text-[#008bcd] border-b border-[#008bcd] pb-1 uppercase tracking-wider mb-3">
            Detalle de Movimientos de Caja y Pagos
          </h2>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500 font-bold text-[10px] uppercase">
                <th className="py-2 px-2">Fecha</th>
                <th className="py-2 px-2"># Comprobante</th>
                <th className="py-2 px-2">Concepto / Procedimiento</th>
                <th className="py-2 px-2">Medio</th>
                <th className="py-2 px-2 text-center">Tipo</th>
                <th className="py-2 px-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                    Sin registros financieros asociados a la ficha.
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any, idx: number) => {
                  const isIncome = tx.type === "INCOME"
                  return (
                    <tr key={tx.id || idx} className="break-inside-avoid">
                      <td className="py-2 px-2 text-slate-600">
                        {format(tx.date, "dd/MM/yyyy HH:mm", { locale: es })}
                      </td>
                      <td className="py-2 px-2 font-bold text-slate-800">
                        {tx.number}
                      </td>
                      <td className="py-2 px-2 text-slate-700 font-medium">
                        {tx.description}
                      </td>
                      <td className="py-2 px-2 text-slate-600">
                        {tx.method}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          isIncome ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {isIncome ? "Ingreso" : "Nota Crédito"}
                        </span>
                      </td>
                      <td className={`py-2 px-2 text-right font-bold ${
                        isIncome ? "text-slate-900" : "text-amber-700"
                      }`}>
                        {isIncome ? "+" : "-"}${Math.abs(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-14 pt-6 break-inside-avoid">
          <div className="flex justify-between items-end px-12 mb-6">
            <div className="text-center border-t border-black w-56 pt-2">
              <p className="font-bold text-[10px] uppercase text-slate-800">{patientFullName}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Firma del Paciente / Titular</p>
            </div>
            <div className="text-center border-t border-black w-56 pt-2">
              <p className="font-bold text-[10px] uppercase text-slate-800">{issuedBy}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Firma / Sello de Caja y Recaudación</p>
            </div>
          </div>

          <div className="border-t border-[#008bcd] pt-3 text-center text-[9px] text-slate-500">
            <p className="font-bold text-slate-700">CARMO DENTAL - Clínica de Especialidades Odontológicas</p>
            <p>Dirección: Solanda Sector 4, José Argudo S24-72 y Av. Solanda • Cel.: 0998 990 215 • Quito - Ecuador</p>
            <p className="mt-0.5 italic">Documento emitido electrónicamente como comprobante de balance y conciliación.</p>
          </div>
        </div>

      </div>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #balance-printable, #balance-printable * { visibility: visible !important; }
          #balance-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            display: block !important;
            background: white !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>
  )
}