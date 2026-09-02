"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useClinicSettings } from "@/config/clinic-settings"

interface OdontogramPrintProps {
  records: any[]
  view: string
  dentition: string
  patientFullName?: string
  patientDocId?: string
  doctorName?: string
  doctorSpecialty?: string
  getStatusLabel: (val: string) => string
}

const formatSurfacesForPrint = (surfaces: string[] | string, toothNumber: number): string => {
  const list = Array.isArray(surfaces) ? surfaces : [surfaces]
  const isTotal = list.length === 0 || list.includes("TODA_LA_PIEZA") || list.includes("all")

  if (isTotal) return "Toda la pieza"

  const quadrant = Math.floor(toothNumber / 10)

  const translate = (surface: string): string => {
    const low = surface?.toLowerCase()?.trim() || ""

    if (low === "center" || low === "middle") return "Oclusal / Incisal"
    if (low === "top") return "Vestibular"
    if (low === "bottom") {
      return toothNumber >= 31 && toothNumber <= 48 ? "Lingual" : "Palatino"
    }
    if (low === "left") {
      return quadrant === 1 || quadrant === 4 ? "Distal" : "Mesial"
    }
    if (low === "right") {
      return quadrant === 1 || quadrant === 4 ? "Mesial" : "Distal"
    }
    if (low === "mesial") return "Mesial"
    if (low === "distal") return "Distal"
    if (low === "vestibular") return "Vestibular"
    if (low === "lingual") return "Lingual"
    if (low === "palatino" || low === "palatina") return "Palatino"
    if (low === "oclusal") return "Oclusal"
    if (low === "incisal") return "Incisal"

    return surface
  }

  return list.map(translate).join(" • ")
}

export function OdontogramPrint({
  records = [],
  view,
  dentition,
  patientFullName = "Paciente",
  patientDocId = "No registrado",
  doctorName,
  doctorSpecialty,
  getStatusLabel
}: OdontogramPrintProps) {
  const { settings } = useClinicSettings()

  const clinicName = settings?.clinicName?.trim() || "CLÍNICA ODONTOLÓGICA"
  const clinicSlogan = settings?.slogan?.trim() || "CENTRO DE ESPECIALIDADES ODONTOLÓGICAS"
  const clinicRuc = settings?.ruc?.trim() || "1790000000001"
  const clinicAddress = settings?.address?.trim() || "AV. PRINCIPAL 123"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "(+593) 99 999 9999"
  const clinicCity = (settings as any)?.city?.trim() || "Provincia"
  const clinicCountry = (settings as any)?.country?.trim() || "País"
  const clinicLocation = `${clinicCity} - ${clinicCountry}`

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const activeDoctor = doctorName || settings?.razonSocial?.trim() || "Dr. Especialista"

  return (
    <div id="odontogram-printable" className="hidden print:block font-sans text-slate-900 bg-white min-h-[297mm] relative overflow-hidden">
      
      {/* Marca de agua */}
      {settings?.watermarkUrl && (
        <div 
          aria-hidden="true" 
          className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          style={{ opacity: ((settings as any)?.watermarkOpacity ?? 10) / 100 }}
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
          {/* Cabecera Membretada */}
          <div className="flex justify-between items-center pb-3.5 mb-4 border-b-[3px] border-[#008bcd]">
            <div className="flex items-center gap-3.5">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-14 max-w-[150px] object-contain" />
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
                ODONTOGRAMA ({view.toUpperCase()})
              </span>
              <p className="text-[10.5px] text-neutral-500 font-medium">
                Fecha: <strong className="text-neutral-900 font-bold">{today}</strong>
              </p>
            </div>
          </div>

          {/* Datos del Paciente */}
          <div className="grid grid-cols-2 gap-4 my-4 p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
            <div>
              <p className="text-neutral-400 font-bold text-[9px] uppercase tracking-wider">Paciente</p>
              <p className="font-black text-neutral-900 text-sm mt-0.5 uppercase">{patientFullName}</p>
              <p className="text-neutral-700 mt-1"><b>Documento:</b> <span className="font-mono">{patientDocId}</span></p>
            </div>
            <div className="border-l border-neutral-200 pl-4">
              <p className="text-neutral-400 font-bold text-[9px] uppercase tracking-wider">Especialista / Dentición</p>
              <p className="font-black text-neutral-900 text-sm mt-0.5">{activeDoctor}</p>
              <p className="text-neutral-700 mt-1">
                Dentición: <b className="capitalize">{dentition}</b>
                {doctorSpecialty && <span className="ml-2">• {doctorSpecialty}</span>}
              </p>
            </div>
          </div>

          {/* Resumen de Hallazgos y Simbología */}
          <div className="mt-4">
            <div className="border-b border-neutral-900 pb-1.5 mb-3 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                Registro de Hallazgos Odontológicos
              </span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase">
                Total Hallazgos: {records.length}
              </span>
            </div>

            {records.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-8">
                No hay afecciones ni tratamientos registrados en este esquema.
              </p>
            ) : (
              <table className="w-full text-left text-xs border border-neutral-200 rounded-xl overflow-hidden">
                <thead className="bg-neutral-100 text-neutral-700 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-2.5 w-16">Pieza</th>
                    <th className="p-2.5 w-48">Superficie(s)</th>
                    <th className="p-2.5">Diagnóstico / Procedimiento</th>
                    <th className="p-2.5">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {records.map((r, i) => (
                    <tr key={i} className="even:bg-neutral-50/50">
                      <td className="p-2.5 font-bold font-mono text-[#008bcd]">#{r.toothNumber}</td>
                      <td className="p-2.5 font-semibold text-neutral-700">
                        {formatSurfacesForPrint(r.surfaces, r.toothNumber)}
                      </td>
                      <td className="p-2.5 font-bold text-neutral-800">{getStatusLabel(r.status)}</td>
                      <td className="p-2.5 text-neutral-500 italic">
                        {r.notes ? `"${r.notes}"` : <span className="not-italic text-neutral-400">--</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pie de Página Institucional */}
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
              Documento clínico odontológico generado electrónicamente.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #odontogram-printable, #odontogram-printable * { visibility: visible !important; }
          #odontogram-printable {
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