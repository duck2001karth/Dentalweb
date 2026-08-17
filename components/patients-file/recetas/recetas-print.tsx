"use client"

import React from "react"
import { format } from "date-fns"

interface PrescriptionPrintProps {
  printingDoc: any
  patientFullName: string
  patientAge: string | number
  patientDocId: string
  patientAllergies: string
}

export function PrescriptionPrint({
  printingDoc,
  patientFullName,
  patientAge,
  patientDocId,
  patientAllergies,
}: PrescriptionPrintProps) {
  if (!printingDoc) return null
  const today = format(new Date(), "dd/MM/yyyy")
  const doctorName = printingDoc.author?.name || printingDoc.specialistName || "Dr. Asignado"

  return (
    <>
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; } 
          body { 
            margin: 0; 
            padding: 0; 
            background-color: white !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            overflow: hidden; 
          }
          .print-wrapper { 
            display: flex; 
            flex-direction: row; 
            width: 100vw; 
            height: 100vh; 
            max-height: 100vh; 
            background: white; 
            color: black; 
            overflow: hidden; 
            page-break-after: avoid; 
            page-break-inside: avoid; 
            box-sizing: border-box; 
          }
          .print-pane { 
            width: 50vw; 
            height: 100vh; 
            border-right: 1px dashed #9ca3af; 
            padding: 1.2cm 1.5cm; 
            box-sizing: border-box; 
            display: flex; 
            flex-direction: column; 
            position: relative; 
          }
          .print-pane:last-child { border-right: none; }
          
          .watermark-container {
            display: flex !important; 
            position: absolute !important; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0;
            justify-content: center; 
            align-items: center; 
            z-index: 0; 
            pointer-events: none; 
            opacity: 0.12;
          }
          .watermark-img { 
            width: 320px; 
            object-fit: contain;
          }
        }
      `}</style>

      <div className="hidden print:flex fixed inset-0 z-50 print-wrapper text-sm bg-white font-sans">
        
        {/* LADO 1: MEDICAMENTOS (R.P.) */}
        <div className="print-pane relative">
          <div className="hidden print:flex watermark-container">
            <img src="/logosn.png" alt="Marca de Agua" className="watermark-img" />
          </div>

          <div className="flex justify-between items-start mb-3 border-b-2 border-[#008bcd] pb-2 relative z-10">
            <div className="flex items-center gap-3">
              <img src="/logosn.png" alt="Logo Carmodental" className="h-10 w-auto object-contain" />
              <div>
                <h1 className="text-2xl font-black text-[#008bcd] tracking-tight uppercase leading-none">Carmodental</h1>
                <p className="text-[10px] font-bold text-slate-800 uppercase mt-0.5">Clínica de Especialidades Odontológicas</p>
              </div>
            </div>
            <div className="text-right text-[10px] leading-tight">
              <p className="font-bold text-black"><span>Dr.</span> José Napoleón Cargua Ríos</p>
              <p className="text-black">RUC: 1719231696001</p>
            </div>
          </div>
          
          <div className="flex justify-between text-xs mb-2 text-black border-b border-slate-200 pb-1.5 relative z-10">
            <p>Fecha de emisión: <span className="font-semibold">{today}</span></p>
            <p className="text-red-600 font-bold">Nº {printingDoc.id?.substring(0, 6).toUpperCase()}</p>
          </div>
          
          <div className="text-xs mb-3 space-y-1 text-black bg-slate-50 p-2.5 rounded border border-slate-100 relative z-10">
            <div className="flex justify-between">
              <p><span className="font-bold text-[#008bcd]">Paciente:</span> {patientFullName}</p>
              <p><span className="font-bold text-[#008bcd]">Edad:</span> {patientAge ? `${patientAge} Años` : "--"}</p>
            </div>
            <p><span className="font-bold text-[#008bcd]">Doc. Identidad:</span> {patientDocId}</p>
            <p><span className="font-bold text-red-600">Alergias:</span> {patientAllergies || "Ninguna reportada"}</p>
          </div>

          {/* CUERPO MEDICAMENTOS */}
          <div className="flex-1 text-black relative z-10">
            <h3 className="font-bold text-base mb-1.5 text-[#008bcd] border-b border-slate-200 pb-1">Medicamentos (R.P.)</h3>
            <div className="whitespace-pre-wrap leading-relaxed [&>ul]:list-disc [&>ul]:ml-5 text-xs" dangerouslySetInnerHTML={{ __html: printingDoc.medications }} />
          </div>

          {/* FIRMA Y PIE DE PÁGINA */}
          <div className="mt-auto shrink-0 flex flex-col justify-end pt-2 relative z-10">
            {printingDoc.doctorSignature ? (
              <div className="text-center border-t border-black pt-1 w-48 mx-auto mb-2">
                <img src={printingDoc.doctorSignature} alt="Firma Doctor" className="h-12 object-contain mx-auto -mt-12 bg-white px-2" />
                <p className="text-[9px] font-bold uppercase text-black">Firma del Profesional</p>
              </div>
            ) : (
              <div className="text-center border-t border-black w-48 pt-1 mx-auto mb-2 mt-6">
                <p className="text-[9px] font-bold uppercase text-black">Firma del Profesional</p>
              </div>
            )}
            <div className="border-t-2 border-[#008bcd] pt-1.5 text-[9px] text-slate-800 flex flex-col text-center">
              <p className="font-semibold uppercase tracking-wider mb-0.5">Dirección: Solanda Sector 4, José Argudo S24-72 y Av. Solanda</p>
              <p>Cel.: 0998 990 215 • e-mail: carmodental@gmail.com • Quito - Ecuador</p>
            </div>
          </div>
        </div>

        {/* LADO 2: INDICACIONES Y OBSERVACIONES */}
        <div className="print-pane relative">
          <div className="hidden print:flex watermark-container">
            <img src="/logosn.png" alt="Marca de Agua" className="watermark-img" />
          </div>

          <div className="flex justify-between items-start mb-3 border-b-2 border-[#008bcd] pb-2 relative z-10">
            <div className="flex items-center gap-3">
              <img src="/logosn.png" alt="Logo Carmodental" className="h-10 w-auto object-contain" />
              <div>
                <h1 className="text-2xl font-black text-[#008bcd] tracking-tight uppercase leading-none">Carmodental</h1>
                <p className="text-[10px] font-bold text-slate-800 uppercase mt-0.5">Clínica de Especialidades Odontológicas</p>
              </div>
            </div>
            <div className="text-right text-[10px] leading-tight">
              <p className="font-bold text-black"><span>Dr.</span> José Napoleón Cargua Ríos</p>
              <p className="text-black">RUC: 1719231696001</p>
            </div>
          </div>
          
          <div className="flex justify-between text-xs mb-2 text-black border-b border-slate-200 pb-1.5 relative z-10">
            <p>Fecha de emisión: <span className="font-semibold">{today}</span></p>
            <p className="text-red-600 font-bold">Nº {printingDoc.id?.substring(0, 6).toUpperCase()}</p>
          </div>
          
          <div className="text-xs mb-3 space-y-1 text-black bg-slate-50 p-2.5 rounded border border-slate-100 relative z-10">
            <div className="flex justify-between">
              <p><span className="font-bold text-[#008bcd]">Paciente:</span> {patientFullName}</p>
              <p><span className="font-bold text-[#008bcd]">Edad:</span> {patientAge ? `${patientAge} Años` : "--"}</p>
            </div>
            <p><span className="font-bold text-[#008bcd]">Doc. Identidad:</span> {patientDocId}</p>
            <p><span className="font-bold text-red-600">Alergias:</span> {patientAllergies || "Ninguna reportada"}</p>
          </div>

          {/* INDICACIONES */}
          <div className="flex-1 text-black relative z-10">
            <h3 className="font-bold text-base mb-1.5 text-[#008bcd] border-b border-slate-200 pb-1">Indicaciones</h3>
            <div className="whitespace-pre-wrap leading-relaxed [&>ul]:list-disc [&>ul]:ml-5 text-xs" dangerouslySetInnerHTML={{ __html: printingDoc.indications }} />
          </div>

          {/* OBSERVACIONES ELEVADAS CON MARGEN INFERIOR */}
          {printingDoc.observations && (
            <div className="mb-8 pb-2 border-t border-slate-200 relative z-10">
              <h3 className="font-bold text-[11px] mt-2 mb-1 text-amber-700 uppercase tracking-wider">
                Observaciones / Recomendaciones Especiales:
              </h3>
              <div 
                className="whitespace-pre-wrap leading-relaxed [&>ul]:list-disc [&>ul]:ml-5 text-xs text-slate-800 font-medium" 
                dangerouslySetInnerHTML={{ __html: printingDoc.observations }} 
              />
            </div>
          )}

          {/* FIRMA Y PIE DE PÁGINA */}
          <div className="mt-auto shrink-0 flex flex-col justify-end relative z-10">
            {printingDoc.doctorSignature ? (
              <div className="text-center border-t border-black pt-1 w-48 mx-auto mb-2">
                <img src={printingDoc.doctorSignature} alt="Firma Doctor" className="h-12 object-contain mx-auto -mt-12 bg-white px-2" />
                <p className="text-[9px] font-bold uppercase text-black">Firma del Profesional</p>
              </div>
            ) : (
              <div className="text-center border-t border-black w-48 pt-1 mx-auto mb-2 mt-4">
                <p className="text-[9px] font-bold uppercase text-black">Firma del Profesional</p>
              </div>
            )}
            <div className="border-t-2 border-[#008bcd] pt-1.5 text-[9px] text-slate-800 flex flex-col text-center">
              <p className="font-semibold uppercase tracking-wider mb-0.5">Dirección: Solanda Sector 4, José Argudo S24-72 y Av. Solanda</p>
              <p>Cel.: 0998 990 215 • e-mail: carmodental@gmail.com • Quito - Ecuador</p>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}