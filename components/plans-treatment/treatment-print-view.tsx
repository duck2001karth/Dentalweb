"use client"

import React from "react"
import { format } from "date-fns"

export function TreatmentPrintView({
  plan, 
  patient, 
  patientAge, 
  baseTotal, 
  discountPercent, 
  discountAmount, 
  finalTotalCost, 
  commentText, 
  autoRecoveredSignature, 
  getSignatureSrc,
  printMode = "COMPLETO"
}: any) {
  const isOnlyTotal = printMode === "SOLO_TOTAL";
  const isNoDetail = printMode === "SIN_DETALLE";
  const isLabOrder = printMode === "LABORATORIO";

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { 
            position: absolute; left: 0; top: 0; width: 100%; 
            padding: 1.5cm; background: white; color: black; 
            font-family: system-ui, -apple-system, sans-serif; 
          }
          .print-hidden { display: none !important; }
          .watermark { 
            position: fixed; top: 50%; left: 50%; 
            transform: translate(-50%, -50%); opacity: 0.05; 
            z-index: -1; width: 450px; pointer-events: none; 
          }
          @page { size: A4; margin: 0mm; }
        }
      `}</style>

      <div className="hidden print:block print-container">
        <img src="/logosn.png" alt="Marca de Agua" className="watermark" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        
        {/* ENCABEZADO INSTITUCIONAL CON RUC RESTAURADO */}
        <div className="flex justify-between items-end border-b-2 border-[#00b0e9] pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-[#00b0e9] tracking-tighter">CARMO DENTAL</h1>
            <p className="text-xs font-bold text-slate-600 tracking-widest uppercase">
              {isLabOrder ? "ORDEN DE TRABAJO DE LABORATORIO DENTAL" : "Clínica de Especialidades Odontológicas"}
            </p>
          </div>
          <div className="text-right text-xs font-bold text-slate-700">
            <p>{plan?.doctor?.name || "Dr. Asignado"}</p>
            <p className="text-slate-800 font-extrabold">RUC: 1719231696001</p>
            <p className="text-slate-500 font-medium">Plan Nº {plan?.id?.slice(-6)?.toUpperCase()}</p>
          </div>
        </div>

        {/* DATOS DEL PACIENTE CON EDAD DINÁMICA */}
        <div className="flex justify-between text-xs mb-3">
          <p>Fecha de emisión: <b>{format(new Date(), "dd/MM/yyyy")}</b></p>
          <p>Documento de Identidad: <b>{patient?.ci || "Sin registrar"}</b></p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs mb-6 space-y-1.5">
          <div className="flex justify-between">
            <p><span className="font-bold text-[#00b0e9]">Paciente:</span> {patient?.firstName} {patient?.lastName}</p>
            <p><span className="font-bold text-[#00b0e9]">Edad:</span> {patientAge ? `${patientAge} Años` : "--"}</p>
          </div>
          <p><span className="font-bold text-[#00b0e9]">Convenio / Cobertura:</span> {patient?.convenio || "Particular"}</p>
          {patient?.medicalAlerts && (
            <p><span className="font-bold text-red-600">Alertas Médicas:</span> {patient.medicalAlerts}</p>
          )}
        </div>

        {/* TITULO SEGÚN MODO DE IMPRESIÓN */}
        <h3 className="text-lg font-bold text-[#00b0e9] border-b border-slate-200 pb-2 mb-4 uppercase">
          {isLabOrder ? "Especificaciones del Laboratorio" : isOnlyTotal ? "Resumen de Presupuesto" : "Detalle de Tratamientos"}
        </h3>

        {!isOnlyTotal && (
          <table className="w-full text-xs mb-6 border-collapse">
            <thead className="bg-slate-100 font-bold text-slate-700">
              <tr>
                <th className="text-left p-2.5 border border-slate-200">Prestación / Procedimiento</th>
                <th className="text-center p-2.5 border border-slate-200 w-20">Pieza</th>
                {!isNoDetail && !isLabOrder && (
                  <>
                    <th className="text-center p-2.5 border border-slate-200 w-20">Dscto</th>
                    <th className="text-right p-2.5 border border-slate-200 w-28">Precio</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {plan?.items?.map((item: any, idx: number) => {
                const itemDscto = item.discount || 0;
                const cost = item.cost || 0;
                const finalCost = cost - (cost * (itemDscto / 100));

                return (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="p-2.5 border border-slate-200 font-medium">{item.procedureName}</td>
                    <td className="text-center p-2.5 border border-slate-200 font-bold text-[#00b0e9]">{item.tooth || "-"}</td>
                    {!isNoDetail && !isLabOrder && (
                      <>
                        <td className="text-center p-2.5 border border-slate-200">{itemDscto}%</td>
                        <td className="text-right p-2.5 border border-slate-200 font-bold">${finalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* RESUMEN FINANCIERO */}
        {!isLabOrder && (
          <div className="flex justify-end mb-6">
            <div className="w-1/2 text-xs space-y-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              {!isOnlyTotal && !isNoDetail && (
                <>
                  <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span>${baseTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium"><span>Descuento Comercial ({discountPercent}%):</span><span>-${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                  )}
                </>
              )}
              <div className="flex justify-between text-base font-black text-[#00b0e9] border-t border-slate-300 pt-2">
                <span>TOTAL PRESUPUESTO:</span>
                <span>${finalTotalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* OBSERVACIONES */}
        <div className="mb-12">
          <h4 className="font-bold text-[#00b0e9] text-xs uppercase mb-1">Observaciones / Indicaciones:</h4>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap p-3 bg-slate-50 border border-slate-200 rounded-lg">
            {commentText || "Validez del plan de tratamiento por 30 días. Sujeto a evaluación clínica."}
          </p>
        </div>

        {/* FIRMAS */}
        <div className="flex justify-around items-end mt-16 pt-6">
          <div className="text-center">
            <div className="h-14 w-44 border-b border-slate-400 mb-2 flex items-end justify-center"></div>
            <p className="font-bold text-[11px] uppercase text-slate-800">FIRMA DEL PROFESIONAL</p>
            <p className="text-[10px] text-slate-500">{plan?.doctor?.name || "Odontólogo Tratante"}</p>
          </div>
          <div className="text-center">
            <div className="h-14 w-44 border-b border-slate-400 mb-2 flex items-end justify-center">
              {autoRecoveredSignature && <img src={getSignatureSrc(autoRecoveredSignature)} className="h-12 w-auto object-contain" />}
            </div>
            <p className="font-bold text-[11px] uppercase text-slate-800">FIRMA DEL PACIENTE</p>
            <p className="text-[10px] text-slate-500">CI: {patient?.ci}</p>
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="fixed bottom-6 left-0 w-full text-center text-[10px] text-slate-500 border-t border-slate-200 pt-3">
          <p className="font-bold text-[#00b0e9]">CARMO DENTAL • CLINICA DE ESPECIALIDADES ODONTOLÓGICAS</p>
          <p>Quito - Ecuador • Contacto: carmodental@gmail.com</p>
        </div>
      </div>
    </>
  )
}