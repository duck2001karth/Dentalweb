"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ClinicalDocPrintProps {
  document: any
  patientFullName: string
  patientAge?: string | number
  patientDocId?: string
  doctorSpecialty?: string
}

export function ClinicalDocPrint({
  document: doc,
  patientFullName,
  patientAge,
  patientDocId,
  doctorSpecialty = "Odontología General y Especialidades",
}: ClinicalDocPrintProps) {
  if (!doc) return null

  const formattedDate = format(
    new Date(doc.createdAt || new Date()),
    "dd 'de' MMMM 'de' yyyy, HH:mm",
    { locale: es }
  )

  const doctorName = doc.specialistName || doc.author?.name || "Dr(a). Profesional Tratante"

  return (
    <div id="clinical-doc-printable" className="hidden print:block font-sans text-slate-900 bg-white min-h-[297mm] p-12 relative overflow-hidden">
      
      {/*MARCA DE AGUA CON TU LOGO OFICIAL */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] select-none z-0"
      >
        <img 
          src="/logosn.png" 
          alt="Marca de Agua Carmo Dental" 
          className="w-[420px] object-contain"
        />
      </div>

      <div className="relative z-10 flex flex-col justify-between min-h-[265mm]">
        
        {/*CABECERA MEMBRETADA CON LOGO OFICIAL */}
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
              <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider border border-slate-200">
                Documento Clínico Oficial
              </span>
              <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                Fecha de Emisión: <b className="text-slate-800">{formattedDate}</b>
              </p>
            </div>
          </div>

          {/* DATOS DE FILIACIÓN */}
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
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Profesional Tratante</p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{doctorName}</p>
              <p className="text-slate-600 mt-1">
                <b>Especialidad:</b> {doctorSpecialty}
              </p>
            </div>
          </div>

          {/* CONTENIDO DEL DOCUMENTO */}
          <div className="mt-6">
            <h2 className="text-lg font-bold text-[#008bcd] border-l-4 border-[#008bcd] pl-3.5 py-0.5 mb-4 tracking-tight">
              {doc.title}
            </h2>
            <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-normal pr-4">
              {doc.content}
            </div>
          </div>
        </div>

        {/*SECCIÓN DE FIRMAS */}
        <div className="pt-8 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-16 text-center">
            
            {/* FIRMA PACIENTE */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-52 flex items-center justify-center border-b border-slate-300">
                {doc.patientSignature ? (
                  <img 
                    src={doc.patientSignature} 
                    alt="Firma Paciente" 
                    className="max-h-14 max-w-full object-contain" 
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Pendiente de firma digital</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2">{patientFullName}</p>
              <p className="text-[10px] text-slate-500">C.I.: {patientDocId}</p>
              <p className="text-[9px] text-slate-400 font-medium">Firma del Paciente / Representante</p>
            </div>

            {/* FIRMA PROFESIONAL */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-52 flex items-center justify-center border-b border-slate-300">
                {doc.doctorSignature ? (
                  <img 
                    src={doc.doctorSignature} 
                    alt="Firma Doctor" 
                    className="max-h-14 max-w-full object-contain" 
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Pendiente de firma digital</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2">{doctorName}</p>
              <p className="text-[10px] text-slate-500">{doctorSpecialty}</p>
              <p className="text-[9px] text-slate-400 font-medium">Firma y Sello Odontológico</p>
            </div>

          </div>

          <div className="text-center mt-6 text-[9px] text-slate-400">
            Documento emitido electrónicamente por el Sistema Clínico Carmo Dental. Válido sin tachaduras ni enmendaduras.
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #clinical-doc-printable, #clinical-doc-printable * {
            visibility: visible !important;
          }
          #clinical-doc-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16mm 20mm !important;
            display: block !important;
            background: white !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}