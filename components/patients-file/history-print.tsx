"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useGetPatient } from "@/hooks/patients"

interface HistorialPrintProps {
  patientId: string
  notes: any[]
  doctorName: string
  doctorSpecialty: string
}

export function HistorialPrint({ patientId, notes, doctorName, doctorSpecialty }: HistorialPrintProps) {
  const { patient } = useGetPatient(patientId)

  if (!patient) return null

  const calculateAge = (birthDate: string | Date | undefined | null) => {
    if (!birthDate) return "--"
    const today = new Date()
    const dob = new Date(birthDate)
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age
  }

  const patientFullName = `${patient.firstName} ${patient.lastName}`
  const patientDocId = patient.ci || "No registrado"
  const patientAge = calculateAge(patient.birthDate)
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })

  // Función para renderizar el contenido dependiendo si es texto plano o JSON (Recetas)
  const renderContent = (note: any) => {
    if (note.type === "PRESCRIPTION") {
      try {
        const data = typeof note.content === "string" && note.content.startsWith("{") 
          ? JSON.parse(note.content) 
          : { medications: note.content }

        return (
          <div className="space-y-3 mt-2 text-xs">
            {data.medications && (
              <div>
                <p className="font-extrabold text-[10px] text-[#008bcd] uppercase tracking-wider mb-0.5">R.P. (Medicamentos)</p>
                <div dangerouslySetInnerHTML={{ __html: data.medications }} className="pl-1" />
              </div>
            )}
            {data.indications && (
              <div className="pt-2 border-t border-slate-200">
                <p className="font-extrabold text-[10px] text-[#008bcd] uppercase tracking-wider mb-0.5">Indicaciones</p>
                <div dangerouslySetInnerHTML={{ __html: data.indications }} className="pl-1" />
              </div>
            )}
            {data.observations && (
              <div className="pt-2 border-t border-dashed border-slate-200">
                <p className="font-extrabold text-[10px] text-amber-600 uppercase tracking-wider mb-0.5">Observaciones</p>
                <div dangerouslySetInnerHTML={{ __html: data.observations }} className="pl-1 text-slate-600" />
              </div>
            )}
          </div>
        )
      } catch {
        return <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{note.content}</p>
      }
    }

    return (
      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{note.content}</p>
    )
  }

  return (
    <div id="historial-printable" className="hidden print:block font-sans text-slate-900 bg-white min-h-[297mm] relative overflow-hidden">
      
      {/* 📍 MARCA DE AGUA CON LOGO ORIGINAL */}
      <div aria-hidden="true" className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none z-0">
        <img src="/logosn.png" alt="Marca de Agua Carmo Dental" className="w-[500px] object-contain" />
      </div>

      <div className="relative z-10 flex flex-col min-h-[265mm]">
        
        {/* 📍 CABECERA MEMBRETADA */}
        <div>
          <div className="flex justify-between items-start border-b-2 border-[#008bcd] pb-4">
            <div className="flex items-center gap-4">
              <img src="/logosn.png" alt="Logo Clínica" className="h-14 w-auto object-contain" />
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
                Historial Clínico General
              </span>
              <p className="text-[11px] text-slate-500 font-medium mt-2">
                Fecha de Emisión: <b className="text-slate-800">{today}</b>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Datos del Paciente</p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{patientFullName}</p>
              <div className="flex gap-4 text-slate-600 mt-1">
                <p><b>C.I./DNI:</b> {patientDocId}</p>
                <p><b>Edad:</b> {patientAge !== "--" ? `${patientAge} Años` : "--"}</p>
              </div>
              {patient.medicalAlerts && (
                <p className="text-red-600 font-bold mt-1.5 flex items-center gap-1">
                  ⚠️ Alerta Médica: {patient.medicalAlerts}
                </p>
              )}
            </div>

            <div className="border-l border-slate-200 pl-4">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Profesional Responsable</p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{doctorName}</p>
              <p className="text-slate-600 mt-1">
                <b>Especialidad:</b> {doctorSpecialty}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 mt-2 space-y-5">
          {notes.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-10">No hay registros clínicos para este paciente.</p>
          ) : (
            notes.map((note: any) => {
              const isEvolution = note.type === "EVOLUTION"
              const isPrescription = note.type === "PRESCRIPTION"
              const codeId = `#${note.id?.slice(-4).toUpperCase() || "REG"}`

              return (
                <div key={note.id} className="border border-slate-200 rounded-lg p-4 bg-white/80 break-inside-avoid shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <h3 className="font-bold text-[#008bcd] text-xs uppercase tracking-wider">
                      {isEvolution ? `Evolución Clínica ${codeId}` : 
                       isPrescription ? `Receta Médica ${codeId}` : 
                       `Documento / Rx ${codeId}`}
                    </h3>
                    <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                      {format(new Date(note.createdAt), "dd MMM yyyy - HH:mm", { locale: es }).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Contenido Parseado */}
                  <div className="mb-3">
                    {renderContent(note)}
                  </div>

                  {/* Imagen Adjunta */}
                  {note.fileUrl && (
                    <div className="mt-3 mb-2">
                      <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Archivo Adjunto:</p>
                      <img src={note.fileUrl} alt="Adjunto Clínico" className="max-h-40 w-auto object-contain border border-slate-200 rounded-md p-1 bg-white" />
                    </div>
                  )}

                  {(note.professionalSignature || note.patientSignature) && (
                    <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex gap-10">
                      {note.professionalSignature && (
                        <div className="text-center">
                          <img src={note.professionalSignature} alt="Firma Profesional" className="h-10 object-contain mx-auto mix-blend-multiply" />
                          <p className="text-[9px] font-bold text-slate-800 mt-1 uppercase border-t border-slate-300 pt-1">
                            Prof. {note.author?.name || "Especialista"}
                          </p>
                        </div>
                      )}
                      {note.patientSignature && (
                        <div className="text-center">
                          <img src={note.patientSignature} alt="Firma Paciente" className="h-10 object-contain mx-auto mix-blend-multiply" />
                          <p className="text-[9px] font-bold text-slate-800 mt-1 uppercase border-t border-slate-300 pt-1">
                            Paciente / Tutor
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        <div className="mt-16 pt-10 break-inside-avoid">
          <div className="flex justify-between items-end px-10 mb-8">
            <div className="text-center border-t border-black w-56 pt-2">
              <p className="font-bold text-[10px] uppercase text-slate-800">Firma del Paciente / Tutor</p>
              <p className="text-[9px] text-slate-500 mt-0.5">C.I./DNI: {patientDocId}</p>
            </div>
            <div className="text-center border-t border-black w-56 pt-2">
              <p className="font-bold text-[10px] uppercase text-slate-800">{doctorName}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Firma del Profesional Tratante</p>
            </div>
          </div>
          
          <div className="border-t border-[#008bcd] pt-4 text-center text-[9px] text-slate-500 leading-relaxed">
            <p className="font-bold text-slate-700">CARMO DENTAL - Clínica de Especialidades Odontológicas</p>
            <p>Dirección: Solanda Sector 4, José Argudo S24-72 y Av. Solanda • Cel.: 0998 990 215 • Quito - Ecuador</p>
            <p className="mt-1 italic">Documento generado electrónicamente. Las firmas digitales gozan de plena validez legal y auditoría en el sistema.</p>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #historial-printable, #historial-printable * { visibility: visible !important; }
          #historial-printable {
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