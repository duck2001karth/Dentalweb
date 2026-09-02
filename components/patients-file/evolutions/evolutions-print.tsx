"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { treatmentStatuses } from "@/constants/status"
import { useClinicSettings } from "@/config/clinic-settings"

interface EvolutionsPrintProps {
  evolutionNotes: any[]
  patientFullName: string
  patientAge: string | number
  patientDocId: string
  doctorName?: string
  doctorSpecialty?: string
}

export function EvolutionsPrint({
  evolutionNotes = [],
  patientFullName,
  patientAge,
  patientDocId,
  doctorName,
  doctorSpecialty,
}: EvolutionsPrintProps) {
  const { settings } = useClinicSettings()

  if (!evolutionNotes || evolutionNotes.length === 0) return null
  const clinicName = settings?.clinicName?.trim() || "CLÍNICA ODONTOLÓGICA"
  const clinicSlogan = settings?.slogan?.trim() || "CENTRO DE ESPECIALIDADES MÉDICAS Y DENTALES"
  const doctorHolder = settings?.razonSocial?.trim() || "Dr. Especialista Asignado"
  const clinicRuc = settings?.ruc?.trim() || "1790000000001"
  const clinicAddress = settings?.address?.trim() || "AV. PRINCIPAL 123 Y CALLE SECUNDARIA"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "(+593) 99 999 9999"
  
  const clinicCity = (settings as any)?.city?.trim() || "Provincia"
  const clinicCountry = (settings as any)?.country?.trim() || "País"
  const clinicLocation = `${clinicCity} - ${clinicCountry}`

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const activeDoctorName = doctorName || doctorHolder
  const activeDoctorSpecialty = doctorSpecialty || "Odontología General"

  return (
    <div id="evolutions-printable" className="hidden print:block font-sans text-slate-900 bg-white min-h-[297mm] relative overflow-hidden">
      
      {/* MARCA DE AGUA DINÁMICA (Solo si está configurada) */}
      {settings?.watermarkUrl && (
        <div 
          aria-hidden="true" 
          className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          style={{ opacity: ((settings as any)?.watermarkOpacity ?? 12) / 100 }}
        >
          <img 
            src={settings.watermarkUrl} 
            alt="Marca de Agua" 
            style={{ transform: `scale(${((settings as any)?.watermarkScale || 100) / 100})` }}
            className="w-[450px] max-h-[450px] object-contain"
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between min-h-[265mm]">
        
        <div>
          {/* CABECERA MEMBRETADA */}
          <div className="flex justify-between items-center pb-3.5 mb-4 border-b-[3px] border-[#008bcd]">
            <div className="flex items-center gap-3.5">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt="Logo Clínica" 
                  className="h-14 max-w-[150px] object-contain" 
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-[#008bcd]/10 border border-[#008bcd]/30 flex items-center justify-center text-[#008bcd] font-black text-xl">
                  {clinicName.charAt(0)}
                </div>
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
                HISTORIAL DE EVOLUCIONES
              </span>
              <p className="text-[10.5px] text-neutral-500 font-medium">
                Fecha de Emisión: <strong className="text-neutral-900 font-bold">{today}</strong>
              </p>
            </div>
          </div>

          {/* DATOS DE FILIACIÓN */}
          <div className="grid grid-cols-2 gap-4 my-4 p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
            <div>
              <p className="text-neutral-400 font-bold text-[9px] uppercase tracking-wider">Datos del Paciente</p>
              <p className="font-black text-neutral-900 text-sm mt-0.5 uppercase">{patientFullName}</p>
              <div className="flex gap-4 text-neutral-700 mt-1">
                <p><b>Doc. Identidad:</b> <span className="font-mono">{patientDocId || "No registrado"}</span></p>
                <p><b>Edad:</b> {patientAge ? `${patientAge} Años` : "--"}</p>
              </div>
            </div>

            <div className="border-l border-neutral-200 pl-4">
              <p className="text-neutral-400 font-bold text-[9px] uppercase tracking-wider">Profesional a Cargo</p>
              <p className="font-black text-neutral-900 text-sm mt-0.5">{activeDoctorName}</p>
              <p className="text-neutral-700 mt-1">
                <b>Especialidad:</b> {activeDoctorSpecialty}
              </p>
            </div>
          </div>

          {/* LISTADO DE EVOLUCIONES */}
          <div className="flex-1 mt-2 space-y-4">
            <div className="border-b border-neutral-900 pb-1 mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-black text-neutral-900 uppercase tracking-wider">
                Registros Clínicos de Evolución
              </h2>
              <span className="text-[10px] font-bold text-neutral-500 uppercase">
                Total: {evolutionNotes.length}
              </span>
            </div>
            
            {evolutionNotes.map((note) => {
              const statusConfig = treatmentStatuses[note.status] || treatmentStatuses.IN_PROGRESS
              const noteDate = note.createdAt ? format(new Date(note.createdAt), "dd/MM/yyyy HH:mm", { locale: es }) : "--"

              return (
                <div key={note.id} className="border border-neutral-200 rounded-xl p-3.5 bg-white break-inside-avoid shadow-xs">
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-1.5 mb-2">
                    <div>
                      <h3 className="font-bold text-[#008bcd] text-xs uppercase tracking-wider">
                        Evolución #{note.id?.slice(-4).toUpperCase() || "EVOL"}
                      </h3>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{noteDate}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusConfig.bg || "bg-neutral-50"} ${statusConfig.color || "text-neutral-700"}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  <div className="text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap font-medium">
                    {note.content}
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
            })}
          </div>
        </div>

        {/* PIE DE PÁGINA INSTITUCIONAL AJUSTADO (GENÉRICO / SIN CORREO) */}
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
          #evolutions-printable, #evolutions-printable * { visibility: visible !important; }
          #evolutions-printable {
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