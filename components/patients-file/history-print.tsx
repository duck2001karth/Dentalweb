"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useGetPatient } from "@/hooks/patients"

export function HistorialPrint({ patientId, notes, doctorName, doctorSpecialty }: { patientId: string, notes: any[], doctorName: string, doctorSpecialty: string }) {
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

  // Variables del paciente
  const patientFullName = `${patient.firstName} ${patient.lastName}`
  const patientDocId = patient.ci || "No registrado"
  const patientAge = calculateAge(patient.birthDate)

  return (
    <>
      {/* ----------------------------------------------------------- */}
      {/* CSS DE IMPRESIÓN Y MARCA DE AGUA (WATERMARK) */}
      {/* ----------------------------------------------------------- */}
      <style>{`
        @media print {
          aside, nav, header, footer, .print-hidden, [class*="sidebar"], [class*="menu"] { display: none !important; }
          main, body, [class*="main-content"] { 
            width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; 
          }
          .watermark-container {
            display: flex !important; position: fixed !important; top: 0; left: 0; right: 0; bottom: 0;
            justify-content: center; align-items: center; z-index: -1; pointer-events: none; opacity: 0.15;
          }
          .watermark-img { width: 500px; grayscale: 100%; }
          @page { size: auto; margin: 1.5cm; }
        }
      `}</style>

      {/* MARCA DE AGUA (CENTRADA) */}
      <div className="hidden print:flex watermark-container">
        <img src="/logosn.png" alt="Watermark" className="watermark-img" />
      </div>

      <div className="hidden print:block w-full bg-white text-black">
        
        {/* ----------------------------------------------------------- */}
        {/* ENCABEZADO PREMIUM DE IMPRESIÓN */}
        {/* ----------------------------------------------------------- */}
        <div className="hidden print:block mb-10 w-full">
          <div className="flex justify-between items-center mb-6 border-b-2 border-[#008bcd] pb-4">
              <h1 className="text-3xl font-black text-black uppercase tracking-tight">
                HISTORIAL CLÍNICO GENERAL
              </h1>
              <div className="text-right text-[#008bcd]">
              <h3 className="text-2xl font-black tracking-tight">CARMODENTAL</h3>
              <p className="text-[10px] font-bold text-slate-600 uppercase">Clínica de Especialidades Odontológicas</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm text-black mb-8">
            <div className="space-y-1">
              <h4 className="font-bold text-xs mb-2 uppercase text-[#008bcd] border-b border-slate-100 pb-1">Datos del Paciente</h4>
              <p><span className="font-bold">Paciente:</span> {patientFullName}</p>
              <p><span className="font-bold">Identificación:</span> {patientDocId}</p>
              <p><span className="font-bold">Edad:</span> {patientAge !== "--" ? `${patientAge} Años` : "--"}</p>
              {patient.medicalAlerts && <p className="text-red-600 mt-2"><span className="font-bold">Alerta Médica:</span> {patient.medicalAlerts}</p>}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-xs mb-2 uppercase text-[#008bcd] border-b border-slate-100 pb-1">Datos del Profesional</h4>
              <p><span className="font-bold">Especialista:</span> {doctorName}</p>
              <p><span className="font-bold">Especialidad:</span> {doctorSpecialty}</p>
              <p><span className="font-bold">Fecha de Reporte:</span> {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</p>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* LISTADO DE NOTAS CLÍNICAS (HISTORIAL) */}
        {/* ----------------------------------------------------------- */}
        <div>
          {notes.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-10">No hay registros clínicos para este paciente.</p>
          ) : (
            <div className="space-y-6">
              {notes.map((note: any) => {
                const isEvolution = note.type === "EVOLUTION"
                const isPrescription = note.type === "PRESCRIPTION"
                const isGeneral = note.type === "GENERAL" 

                return (
                  <div key={note.id} className="border border-slate-300 rounded-lg p-5 break-inside-avoid shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                      <h3 className="font-bold text-[#008bcd] text-sm uppercase">
                        {isEvolution ? `Evolución / Plan #${note.id.substring(0,4).toUpperCase()}` : 
                         isPrescription ? `Receta Médica #${note.id.substring(0,4).toUpperCase()}` : 
                         `Documento Clínico / Rx`}
                      </h3>
                      <span className="text-xs text-slate-600 font-bold bg-slate-100 px-2 py-1 rounded">
                        {format(new Date(note.createdAt), "dd MMM yyyy - HH:mm", { locale: es }).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-black whitespace-pre-wrap mb-4 pl-1 leading-relaxed">
                      {note.content}
                    </div>

                    {/* Si tiene imagen adjunta (ej. Radiografía) */}
                    {note.fileUrl && (
                       <div className="mt-3 mb-4">
                         <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Imagen / Rx Adjunta:</p>
                         <img src={note.fileUrl} alt="Adjunto" className="max-h-48 w-auto object-contain border border-slate-200 rounded p-1" />
                       </div>
                    )}

                    {/* Firmas Digitales si existen */}
                    {(note.professionalSignature || note.patientSignature) && (
                      <div className="mt-4 pt-3 border-t border-dashed border-slate-300">
                        <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Firmas Digitales de la Intervención:</p>
                        <div className="flex gap-12">
                          {note.professionalSignature && (
                            <div className="flex flex-col items-center">
                              <img src={note.professionalSignature} alt="Firma Profesional" className="h-14 w-auto object-contain" />
                              <span className="text-[10px] font-medium text-slate-600 border-t border-slate-400 pt-1 w-32 text-center uppercase">Prof. {note.author?.name}</span>
                            </div>
                          )}
                          {note.patientSignature && (
                            <div className="flex flex-col items-center">
                              <img src={note.patientSignature} alt="Firma Paciente" className="h-14 w-auto object-contain" />
                              <span className="text-[10px] font-medium text-slate-600 border-t border-slate-400 pt-1 w-32 text-center uppercase">Paciente</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-3 mt-3 border-t border-slate-200 uppercase">
                      <p><strong>Registrado por:</strong> {note.author?.name || "Especialista Asignado"}</p>
                      {isEvolution && note.isSigned && <p className="font-bold">ESTADO: ACLARADA</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* FIRMAS FÍSICAS AL FINAL DE LA HOJA */}
        {/* ----------------------------------------------------------- */}
        <div className="flex justify-between items-end mt-24 px-12 break-inside-avoid">
            <div className="text-center border-t-2 border-black w-64 pt-2">
                <p className="font-bold text-xs uppercase">Firma del Paciente</p>
                <p className="text-[10px] text-slate-500">C.I./DNI: {patientDocId}</p>
            </div>
            <div className="text-center border-t-2 border-black w-64 pt-2">
                <p className="font-bold text-xs uppercase">{doctorName}</p>
                <p className="text-[10px] text-slate-500">Firma del Profesional</p>
            </div>
        </div>

      </div>
    </>
  )
}