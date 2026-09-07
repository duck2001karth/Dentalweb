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
  const clinicName = settings?.clinicName?.trim() || "Clinica dental"
  const clinicSlogan = settings?.slogan?.trim() || "Cuidando tu sonrisa con excelencia"
  const clinicRuc = settings?.ruc?.trim() || "1000000001001"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "(+593) 99 999 9999"
  const rawAddress = settings?.address?.trim()
  const rawCity = (settings as any)?.city?.trim()
  const rawCountry = (settings as any)?.country?.trim()
  const clinicAddress = [rawAddress, rawCity, rawCountry].filter(Boolean).join(" • ") || "Calle principal Ciudad, País"

  const doctorHolder = settings?.razonSocial?.trim() || "Dr. Especialista Asignado"
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const activeDoctorName = doctorName || doctorHolder
  const activeDoctorSpecialty = doctorSpecialty || "Odontología General"

  // 2. ICONO POR DEFECTO (Se muestra si borran la imagen del logo)
  const DefaultLogoSVG = () => (
    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#008bcd]/10 text-[#008bcd]">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
        <path d="m9 10 3 3 3-3" />
      </svg>
    </div>
  )

  return (
    <div id="evolutions-printable" className="hidden print:block font-sans text-slate-900 bg-white relative">
      
      {/* MARCA DE AGUA CENTRADA */}
      {settings?.watermarkUrl && (
        <div 
          aria-hidden="true" 
          className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          style={{ opacity: ((settings as any)?.watermarkOpacity ?? 8) / 100 }}
        >
          <img 
            src={settings.watermarkUrl} 
            alt="Marca de Agua" 
            style={{ transform: `scale(${((settings as any)?.watermarkScale || 100) / 100})` }}
            className="w-[450px] max-h-[450px] object-contain filter grayscale"
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between min-h-full">
        <div>
          {/* CABECERA MEMBRETADA (Exactamente como tu imagen) */}
          <div className="flex justify-between items-end pb-3 mb-4 border-b-[3px] border-[#008bcd]">
            <div className="flex items-center gap-4">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt="Logo Clínica" 
                  className="max-h-16 max-w-[160px] object-contain" 
                />
              ) : (
                <DefaultLogoSVG />
              )}
              <div className="flex flex-col">
                <h1 className="text-[22px] font-black text-[#008bcd] tracking-tight leading-none uppercase">
                  {clinicName}
                </h1>
                <h2 className="text-[10px] font-bold text-[#008bcd] uppercase tracking-wider mt-1.5 mb-1">
                  {clinicSlogan}
                </h2>
                <p className="text-[9px] font-medium text-slate-600">
                  RUC: {clinicRuc} | {clinicAddress}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 pb-1">
              <span className="border border-slate-300 rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-700 bg-slate-50">
                Historial Clínico General
              </span>
              <p className="text-[9px] text-slate-500 font-medium">
                Fecha de Emisión: <strong className="text-slate-800">{today}</strong>
              </p>
            </div>
          </div>

          {/* DATOS DE FILIACIÓN (Diseño de cajas con bordes curvos) */}
          <div className="grid grid-cols-2 gap-0 mb-6 border border-slate-300 rounded-[14px] overflow-hidden bg-white">
            <div className="p-4 border-r border-slate-200">
              <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mb-1">Datos del Paciente</p>
              <p className="text-[13px] font-black text-slate-900 uppercase">{patientFullName}</p>
              <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-600">
                <p><strong className="text-slate-800">C.I. / Doc:</strong> {patientDocId || "No registrado"}</p>
                <p><strong className="text-slate-800">Edad:</strong> {patientAge ? `${patientAge} Años` : "--"}</p>
              </div>
            </div>

            <div className="p-4">
              <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mb-1">Profesional Responsable</p>
              <p className="text-[13px] font-black text-slate-900">{activeDoctorName}</p>
              <p className="text-[10px] text-slate-600 mt-1.5">
                <strong className="text-slate-800">Especialidad:</strong> {activeDoctorSpecialty}
              </p>
            </div>
          </div>

          {/* CABECERA DE LA LISTA */}
          <div className="flex justify-between items-end pb-1.5 mb-4 border-b-2 border-slate-900">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900">
              Línea de Tiempo de Intervenciones Clínicas
            </h3>
            <span className="text-[9px] font-bold text-slate-600 uppercase">
              Total Registros: {evolutionNotes.length}
            </span>
          </div>
            
          {/* LISTADO DE EVOLUCIONES O ESTADO VACÍO */}
          <div className="flex-1 space-y-4">
            {evolutionNotes.length === 0 ? (
              <div className="py-12 text-center text-[10px] italic text-slate-500">
                No hay registros clínicos para este paciente.
              </div>
            ) : (
              evolutionNotes.map((note) => {
                const statusConfig = treatmentStatuses[note.status] || treatmentStatuses.IN_PROGRESS
                const noteDate = note.createdAt ? format(new Date(note.createdAt), "dd/MM/yyyy HH:mm", { locale: es }) : "--"

                return (
                  <div key={note.id} className="border border-slate-200 rounded-xl p-3.5 bg-white break-inside-avoid">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 mb-2">
                      <div>
                        <h3 className="font-bold text-[#008bcd] text-[11px] uppercase tracking-wider">
                          Evolución #{note.id?.slice(-4).toUpperCase() || "EVOL"}
                        </h3>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{noteDate}</p>
                      </div>
                      <span className={`text-[8px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusConfig.bg || "bg-slate-50"} ${statusConfig.color || "text-slate-700"}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    <div className="text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                      {note.content}
                    </div>

                    {note.fileUrl && (
                      <div className="mt-2 mb-2">
                        <p className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Archivo Adjunto:</p>
                        <img src={note.fileUrl} alt="Adjunto" className="max-h-32 w-auto object-contain border border-slate-200 rounded-md p-1 bg-white" />
                      </div>
                    )}

                    {(note.professionalSignature || note.patientSignature) && (
                      <div className="mt-3 pt-2 border-t border-dashed border-slate-200 flex gap-8">
                        {note.professionalSignature && (
                          <div className="text-center">
                            <img src={note.professionalSignature} alt="Firma Profesional" className="h-8 object-contain mx-auto mix-blend-multiply" />
                            <p className="text-[8px] font-bold text-slate-700 uppercase border-t border-slate-300 pt-0.5 mt-1">
                              Prof. {note.author?.name || activeDoctorName}
                            </p>
                          </div>
                        )}
                        {note.patientSignature && (
                          <div className="text-center">
                            <img src={note.patientSignature} alt="Firma Paciente" className="h-8 object-contain mx-auto mix-blend-multiply" />
                            <p className="text-[8px] font-bold text-slate-700 uppercase border-t border-slate-300 pt-0.5 mt-1">
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

        {/* PIE DE PÁGINA (Igual a la referencia) */}
        <div className="pt-5 mt-10 break-inside-avoid border-t border-slate-200 text-center">
          <p className="text-[9px] font-black uppercase text-slate-800 tracking-wide mb-1">
            {clinicName} - {clinicSlogan}
          </p>
          <p className="text-[8.5px] text-slate-600 mb-1">
            Dirección: {clinicAddress} • Cel: {clinicPhone}
          </p>
          <p className="text-[7.5px] italic text-slate-400">
            Documento generado electrónicamente. Las firmas digitales gozan de plena validez legal y auditoría en el sistema.
          </p>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          body > *:not(#evolutions-printable) { display: none !important; }
          
          #evolutions-printable {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 12mm 15mm !important; /* Manejamos el margen internamente */
            z-index: 999999 !important;
            background: white !important;
            overflow-y: visible !important;
          }
          #evolutions-printable * { visibility: visible !important; }
          @page { size: A4 portrait; margin: 0; } /* Reseteamos los márgenes del navegador */
        }
      `}</style>
    </div>
  )
}