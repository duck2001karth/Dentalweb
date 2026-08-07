"use client"

import React from "react"
import { format } from "date-fns"

interface ConsentPrintViewProps {
  patient: any
  consent: any
  signatureBase64: string | null
  getSignatureSrc: (src: string) => string
}

export function ConsentPrintView({
  patient,
  consent,
  signatureBase64,
  getSignatureSrc,
}: ConsentPrintViewProps) {
  const consentData = consent || {}

  return (
    <>
      <style>{`
        @media print {
          /* 1. Ocultar todos los elementos si estamos imprimiendo un consentimiento (SIN !important) */
          body.printing-consent * {
            visibility: hidden;
          }

          /* 2. Hacer visible EXCLUSIVAMENTE la hoja de consentimiento y sus hijos */
          body.printing-consent .consent-print-view,
          body.printing-consent .consent-print-view * {
            visibility: visible;
          }

          /* 3. Posicionar la hoja en la esquina superior izquierda cubriendo todo */
          body.printing-consent .consent-print-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 1.5cm 2cm;
            background: white;
            color: black;
            font-family: system-ui, -apple-system, sans-serif;
          }

          /* 4. Marca de agua (Logo centrado) */
          .watermark-consent {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 450px;
            opacity: 0.08;
            z-index: -1;
            pointer-events: none;
          }

          @page { size: A4; margin: 0mm; }
        }
      `}</style>

      {/* CLASE HIDDEN EN PANTALLA, BLOCK EN IMPRESIÓN */}
      <div className="hidden print:block consent-print-view">
        
        <img 
          src="/logosn.png" 
          alt="Marca de agua Carmo Dental" 
          className="watermark-consent" 
          onError={(e) => { e.currentTarget.style.display = 'none'; }} 
        />

        <div className="flex justify-between items-end border-b-2 border-[#008bcd] pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-[#008bcd] tracking-tighter">CARMO DENTAL</h1>
            <p className="text-xs font-bold text-slate-600 tracking-widest uppercase">
              Clínica de Especialidades Odontológicas
            </p>
          </div>
          <div className="text-right text-xs font-bold text-slate-700">
            <p className="text-slate-800 font-extrabold">RUC: 1719231696001</p>
            <p className="text-slate-500 font-medium">Documento Clínico Legal</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs mb-8 space-y-1.5">
          <div className="flex justify-between">
            <p><span className="font-bold text-[#008bcd]">Paciente:</span> {patient?.firstName} {patient?.lastName}</p>
            <p><span className="font-bold text-[#008bcd]">C.I. / DNI:</span> {patient?.ci || "Sin registrar"}</p>
          </div>
          <p><span className="font-bold text-[#008bcd]">Fecha de Emisión:</span> {format(new Date(), "dd/MM/yyyy")}</p>
        </div>

        <div className="space-y-4 mb-16">
          <h3 className="text-xl font-extrabold text-[#008bcd] border-b border-slate-200 pb-2 uppercase text-center">
            {consentData.title || "DECLARACIÓN DE CONSENTIMIENTO INFORMADO"}
          </h3>
          
          <div className="text-xs text-slate-800 leading-relaxed text-justify space-y-3 p-5 border border-slate-200 rounded-xl bg-slate-50/30">
            <p className="font-bold">
              Yo, <span className="text-[#008bcd] uppercase">{patient?.firstName} {patient?.lastName}</span>, mayor de edad, identificado con C.I. Nº {patient?.ci || "________"}, declaro expresamente que:
            </p>
            <p>
              He recibido explicación clara, detallada y comprensible sobre el procedimiento clínico a realizar, sus alternativas de tratamiento, riesgos inherentes, beneficios esperados y recomendaciones post-operatorias.
            </p>
            <div className="p-4 bg-white border border-slate-200 rounded-lg italic font-medium my-4 leading-relaxed">
              "{consentData.content || consentData.description || "El paciente declara estar en pleno conocimiento de las prestaciones contenidas en su plan de tratamiento y autoriza al equipo profesional para su ejecución."}"
            </div>
            <p>
              En constancia de lo anterior, firmo el presente documento de manera libre y voluntaria.
            </p>
          </div>
        </div>

        <div className="flex justify-around items-end mt-20 pt-6">
          <div className="text-center">
            <div className="h-16 w-48 border-b border-slate-400 mb-2 flex items-end justify-center"></div>
            <p className="font-bold text-[11px] uppercase text-slate-800">FIRMA Y SELLO DEL PROFESIONAL</p>
            <p className="text-[10px] text-slate-500">Odontólogo Tratante</p>
          </div>
          
          <div className="text-center">
            <div className="h-16 w-48 border-b border-slate-400 mb-2 flex items-end justify-center">
              {signatureBase64 && (
                <img src={getSignatureSrc(signatureBase64)} alt="Firma Paciente" className="h-14 w-auto object-contain" />
              )}
            </div>
            <p className="font-bold text-[11px] uppercase text-slate-800">FIRMA DEL PACIENTE</p>
            <p className="text-[10px] text-slate-500">C.I: {patient?.ci}</p>
          </div>
        </div>

        <div className="fixed bottom-6 left-0 w-full text-center text-[10px] text-slate-500 border-t border-slate-200 pt-3">
          <p className="font-bold text-[#008bcd]">CARMO DENTAL • CLÍNICA DE ESPECIALIDADES ODONTOLÓGICAS</p>
          <p>Quito - Ecuador • Contacto: carmodental@gmail.com</p>
        </div>
      </div>
    </>
  )
}