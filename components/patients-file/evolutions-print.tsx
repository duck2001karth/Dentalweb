"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { treatmentStatuses } from "@/constants/status"

interface EvolutionsPrintProps {
  evolutionNotes: any[]
  patientFullName: string
  patientAge: string | number
  patientDocId: string
  doctorName: string
  doctorSpecialty: string
}

export function EvolutionsPrint({
  evolutionNotes,
  patientFullName,
  patientAge,
  patientDocId,
  doctorName,
  doctorSpecialty,
}: EvolutionsPrintProps) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })

  if (!evolutionNotes || evolutionNotes.length === 0) return null

  return (
    <div id="evolutions-printable" className="hidden print:block font-sans text-slate-900 bg-white min-h-[297mm] p-12 relative overflow-hidden">
      
      {/* MARCA DE AGUA CON LOGO ORIGINAL */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.12] select-none z-0 fixed"
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
              <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider border border-slate-200">
                Historial de Evoluciones
              </span>
              <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                Fecha de Emisión: <b className="text-slate-800">{today}</b>
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
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Profesional a Cargo</p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{doctorName}</p>
              <p className="text-slate-600 mt-1">
                <b>Especialidad:</b> {doctorSpecialty}
              </p>
            </div>
          </div>
        </div>

        {/* LISTADO DE EVOLUCIONES */}
        <div className="flex-1 mt-2 space-y-6">
          <h2 className="text-sm font-bold text-[#008bcd] border-b border-[#008bcd] pb-1 uppercase tracking-wider mb-4">
            Registros Clínicos
          </h2>
          
          {evolutionNotes.map((note, index) => {
            const statusConfig = treatmentStatuses[note.status] || treatmentStatuses.IN_PROGRESS
            const noteDate = note.createdAt ? format(new Date(note.createdAt), "dd/MM/yyyy HH:mm", { locale: es }) : "--"

            return (
              <div key={note.id} className="border border-slate-200 rounded-lg p-4 bg-white/60 break-inside-avoid shadow-sm">
                <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">Evolución #{note.id?.slice(-4).toUpperCase() || "EVOL"}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{noteDate}</p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${statusConfig.color.replace('dark:', '')} bg-slate-50`}>
                    {statusConfig.label}
                  </span>
                </div>
                
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </div>

                {/* FIRMAS SI EXISTEN */}
                {(note.professionalSignature || note.patientSignature) && (
                  <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex gap-8">
                    {note.professionalSignature && (
                      <div className="text-center">
                        <img src={note.professionalSignature} alt="Firma Dr" className="h-10 object-contain mx-auto mix-blend-multiply" />
                        <p className="text-[9px] font-bold text-slate-800 mt-1">Dr(a). {note.author?.name}</p>
                      </div>
                    )}
                    {note.patientSignature && (
                      <div className="text-center">
                        <img src={note.patientSignature} alt="Firma Px" className="h-10 object-contain mx-auto mix-blend-multiply" />
                        <p className="text-[9px] font-bold text-slate-800 mt-1">Paciente / Tutor</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* PIE DE PÁGINA */}
        <div className="pt-6 mt-8 border-t border-[#008bcd] text-center text-[9px] text-slate-500">
          <p className="font-bold text-slate-700">CARMO DENTAL - Clínica de Especialidades Odontológicas</p>
          <p>Dirección: Solanda Sector 4, José Argudo S24-72 y Av. Solanda • Cel.: 0998 990 215 • Quito - Ecuador</p>
          <p className="mt-2 italic">Documento emitido electrónicamente. Válido sin tachaduras ni enmendaduras.</p>
        </div>

      </div>

++
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #evolutions-printable, #evolutions-printable * { visibility: visible !important; }
          #evolutions-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16mm 20mm !important;
            display: block !important;
            background: white !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>
  )
}