"use client"

import React from "react"
import { format, differenceInYears } from "date-fns"
import { es } from "date-fns/locale"
import { useGetPatient } from "@/hooks/patients"
import { useClinicSettings } from "@/config/clinic-settings"

interface HistorialPrintProps {
  patientId: string
  notes: any[]
  doctorName?: string
  doctorSpecialty?: string
}

export function HistorialPrint({ 
  patientId, 
  notes = [], 
  doctorName, 
  doctorSpecialty 
}: HistorialPrintProps) {
  const { patient } = useGetPatient(patientId)
  const { settings } = useClinicSettings()

  if (!patient) return null
  const clinicName = settings?.clinicName?.trim() || "Clinica"
  const clinicSlogan = settings?.slogan?.trim() || "Clínica de Especialidades"
  const doctorHolder = settings?.razonSocial?.trim() || "Dr. Especialista Asignado"
  const clinicRuc = settings?.ruc?.trim() || "1719231696001"
  const clinicAddress = settings?.address?.trim() || "Av. San Francisco N30"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "0999 999 999"
  
  const clinicCity = (settings as any)?.city?.trim() || "Quito"
  const clinicCountry = (settings as any)?.country?.trim() || "Ecuador"
  const clinicLocation = `${clinicCity} - ${clinicCountry}`

  const calculateAge = (birthDate: string | Date | undefined | null) => {
    if (!birthDate) return "--"
    try {
      return differenceInYears(new Date(), new Date(birthDate))
    } catch {
      return "--"
    }
  }

  const patientFullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
  const patientDocId = patient.ci || "No registrado"
  const patientAge = calculateAge(patient.birthDate)
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const activeDoctorName = doctorName || doctorHolder
  const activeDoctorSpecialty = doctorSpecialty || "Odontología General"

  const renderContent = (note: any) => {
    if (note.type === "PRESCRIPTION") {
      try {
        const data = typeof note.content === "string" && note.content.startsWith("{") 
          ? JSON.parse(note.content) 
          : { medications: note.content }

        return (
          <div className="space-y-2 mt-2 text-xs">
            {data.medications && (
              <div>
                <p className="font-bold text-[10px] text-[#008bcd] uppercase tracking-wider mb-0.5">R.P. (Medicamentos)</p>
                <div dangerouslySetInnerHTML={{ __html: data.medications }} className="pl-1 text-slate-900" />
              </div>
            )}
            {data.indications && (
              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-[10px] text-[#008bcd] uppercase tracking-wider mb-0.5">Indicaciones</p>
                <div dangerouslySetInnerHTML={{ __html: data.indications }} className="pl-1 text-slate-800" />
              </div>
            )}
            {data.observations && (
              <div className="pt-2 border-t border-dashed border-slate-100">
                <p className="font-bold text-[10px] text-amber-600 uppercase tracking-wider mb-0.5">Observaciones</p>
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
      
      {/* Marca de Agua Institucional */}
      {settings?.watermarkUrl ? (
        <div 
          aria-hidden="true" 
          className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          style={{ opacity: ((settings as any)?.watermarkOpacity ?? 8) / 100 }}
        >
          <img 
            src={settings.watermarkUrl} 
            alt="Marca de Agua" 
            style={{ transform: `scale(${((settings as any)?.watermarkScale || 100) / 100})` }}
            className="w-[480px] max-h-[480px] object-contain" 
          />
        </div>
      ) : (
        <div aria-hidden="true" className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none z-0">
          <img src="/logosn.png" alt="Marca de Agua Carmo Dental" className="w-[480px] object-contain" />
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between min-h-[265mm]">
        <div>
          
          {/* 1. ENCABEZADO INSTITUCIONAL */}
          <div className="flex justify-between items-center pb-3.5 mb-4 border-b-[3px] border-[#008bcd]">
            <div className="flex items-center gap-3.5">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-14 max-w-[150px] object-contain" />
              ) : (
                <img src="/logosn.png" alt="Logo Clínica" className="h-14 w-auto object-contain" />
              )}
              <div className="space-y-0.5">
                <h1 className="text-2xl font-black text-[#008bcd] tracking-tight leading-none uppercase">
                  {clinicName}
                </h1>
                <p className="text-[11px] font-black uppercase text-[#1e293b] tracking-wider">
                  {clinicSlogan}
                </p>
                <p className="text-[10px] text-neutral-500 font-medium">
                  RUC: {clinicRuc} | {clinicAddress}
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-1">
              <span className="inline-block bg-white text-neutral-800 text-[11px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider border border-neutral-200 shadow-xs">
                HISTORIAL CLÍNICO GENERAL
              </span>
              <p className="text-[10.5px] text-neutral-500 font-medium">
                Fecha de Emisión: <strong className="text-neutral-900 font-bold">{today}</strong>
              </p>
            </div>
          </div>

          {/* 2. TARJETA DE RESUMEN: DATOS PACIENTE Y PROFESIONAL RESPONSABLE */}
          <div className="grid grid-cols-2 gap-4 my-4 p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
            <div>
              <p className="text-neutral-400 font-bold text-[9px] uppercase tracking-wider">Datos del Paciente</p>
              <p className="font-black text-neutral-900 text-sm mt-0.5 uppercase">{patientFullName}</p>
              <div className="flex gap-4 text-neutral-700 mt-1">
                <p><b>C.I. / Doc:</b> <span className="font-mono">{patientDocId}</span></p>
                <p><b>Edad:</b> {patientAge !== "--" ? `${patientAge} Años` : "--"}</p>
              </div>
              {patient.medicalAlerts && (
                <p className="text-rose-600 font-bold mt-1.5 flex items-center gap-1 text-[11px]">
                  ⚠️ Alerta Médica: {patient.medicalAlerts}
                </p>
              )}
            </div>

            <div className="border-l border-neutral-200 pl-4">
              <p className="text-neutral-400 font-bold text-[9px] uppercase tracking-wider">Profesional Responsable</p>
              <p className="font-black text-neutral-900 text-sm mt-0.5">{activeDoctorName}</p>
              <p className="text-neutral-700 mt-1">
                <b>Especialidad:</b> {activeDoctorSpecialty}
              </p>
            </div>
          </div>

          {/* 3. LÍNEA DE TIEMPO CLÍNICA */}
          <div className="border-b border-neutral-900 pb-1.5 mb-3 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
              Línea de Tiempo de Intervenciones Clínicas
            </span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase">
              Total Registros: {notes.length}
            </span>
          </div>

          <div className="space-y-3.5 mt-2">
            {notes.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-12">
                No hay registros clínicos para este paciente.
              </p>
            ) : (
              notes.map((note: any, index: number) => {
                const isEvolution = note.type === "EVOLUTION"
                const isPrescription = note.type === "PRESCRIPTION"
                const codeId = `#${note.id?.slice(-4).toUpperCase() || (notes.length - index).toString().padStart(2, "0")}`

                return (
                  <div key={note.id} className="border border-neutral-200 rounded-xl p-3.5 bg-white break-inside-avoid shadow-xs">
                    <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#008bcd] text-xs uppercase tracking-wider">
                          {isEvolution ? `Evolución Clínica ${codeId}` : 
                           isPrescription ? `Receta Médica ${codeId}` : 
                           `Documento / Rx ${codeId}`}
                        </span>
                        <span className="text-[10px] text-neutral-600 font-medium">
                          • Dr(a). {note.author?.name || activeDoctorName}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-600 font-bold bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200 font-mono">
                        {note.createdAt ? format(new Date(note.createdAt), "dd MMM yyyy - HH:mm", { locale: es }).toUpperCase() : "-"}
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      {renderContent(note)}
                    </div>

                    {note.fileUrl && (
                      <div className="mt-2 mb-2">
                        <p className="text-[9px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">Archivo Adjunto:</p>
                        <img src={note.fileUrl} alt="Adjunto Clínico" className="max-h-36 w-auto object-contain border border-neutral-200 rounded-md p-1 bg-white" />
                      </div>
                    )}

                    {(note.professionalSignature || note.patientSignature) && (
                      <div className="mt-3 pt-2 border-t border-dashed border-neutral-200 flex gap-8">
                        {note.professionalSignature && (
                          <div className="text-center">
                            <img src={note.professionalSignature} alt="Firma Profesional" className="h-8 object-contain mx-auto mix-blend-multiply" />
                            <p className="text-[8.5px] font-bold text-neutral-800 uppercase border-t border-neutral-300 pt-0.5">
                              Prof. {note.author?.name || activeDoctorName}
                            </p>
                          </div>
                        )}
                        {note.patientSignature && (
                          <div className="text-center">
                            <img src={note.patientSignature} alt="Firma Paciente" className="h-8 object-contain mx-auto mix-blend-multiply" />
                            <p className="text-[8.5px] font-bold text-neutral-800 uppercase border-t border-neutral-300 pt-0.5">
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
        </div>

        {/* 4. PIE DE PÁGINA INSTITUCIONAL DIRECTO (SIN FIRMAS FÍSICAS DE FINAL) */}
        <div className="pt-6 mt-8 break-inside-avoid">
          <div className="w-full h-[2px] bg-[#008bcd] mb-3" />
          <div className="text-center space-y-1 text-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-800">
              {clinicName.toUpperCase()} - {clinicSlogan}
            </p>
            <p className="text-[9.5px] text-slate-600">
              Dirección: {clinicAddress} • Cel.: {clinicPhone} • {clinicLocation}
            </p>
            <p className="text-[8.5px] text-slate-400 italic pt-0.5">
              Documento generado electrónicamente. Las firmas digitales gozan de plena validez legal y auditoría en el sistema.
            </p>
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
            padding: 12mm 15mm !important;
            display: block !important;
            background: white !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>
  )
}