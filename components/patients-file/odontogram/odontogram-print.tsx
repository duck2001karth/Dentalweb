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
  ToothPieceComponent: React.ComponentType<any>
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
    if (low === "bottom") return toothNumber >= 31 && toothNumber <= 48 ? "Lingual" : "Palatino"
    if (low === "left") return quadrant === 1 || quadrant === 4 ? "Distal" : "Mesial"
    if (low === "right") return quadrant === 1 || quadrant === 4 ? "Mesial" : "Distal"
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
  getStatusLabel,
  ToothPieceComponent: ToothPiece,
}: OdontogramPrintProps) {
  const { settings } = useClinicSettings()
  
  const clinicName = settings?.clinicName?.trim() || "Carmo Dental"
  const clinicSlogan = settings?.slogan?.trim() || "Clínica de Especialidades Odontológicas"
  const clinicRuc = settings?.ruc?.trim() || ""
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || ""
  const clinicAddress = [settings?.address?.trim(), settings?.city?.trim(), settings?.country?.trim()].filter(Boolean).join(", ") || ""
  
  const watermarkOpacity = ((settings?.watermarkOpacity ?? 8) / 100)
  const watermarkScale = ((settings?.watermarkScale || 100) / 100)
  
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const activeDoctor = doctorName || settings?.razonSocial?.trim() || "Especialista"

  const viewFormatted = view.toLowerCase().includes("diagn") ? "Diagnóstico" : "Evolución"
  const dentitionFormatted = dentition.toLowerCase().includes("perman") ? "Permanente" : "Temporal"

  const arcada1 = dentition === "permanente" ? [18, 17, 16, 15, 14, 13, 12, 11] : [55, 54, 53, 52, 51]
  const arcada2 = dentition === "permanente" ? [21, 22, 23, 24, 25, 26, 27, 28] : [61, 62, 63, 64, 65]
  const arcada4 = dentition === "permanente" ? [48, 47, 46, 45, 44, 43, 42, 41] : [85, 84, 83, 82, 81]
  const arcada3 = dentition === "permanente" ? [31, 32, 33, 34, 35, 36, 37, 38] : [71, 72, 73, 74, 75]

  const renderQuadrant = (teeth: number[]) => (
    <div className="flex gap-2 items-center">
      {teeth.map((num) => (
        <ToothPiece
          key={num}
          number={num}
          toothRecords={records.filter(r => r.toothNumber === num)}
          selectedSurfaces={[]}
          canEdit={false} 
          onClick={() => {}}
        />
      ))}
    </div>
  )

  return (
    <div id="odontogram-printable" className="hidden print:block font-sans text-slate-900 bg-white min-h-[280mm] relative">
      {/* MARCA DE AGUA */}
      {settings?.watermarkUrl && (
        <div 
          className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          style={{ opacity: watermarkOpacity }}
        >
          <img 
            src={settings.watermarkUrl} 
            alt="" 
            style={{ transform: `scale(${watermarkScale})` }}
            className="w-[450px] max-h-[450px] object-contain"
          />
        </div>
      )}

      <div className="relative z-10">
        {/* CABECERA */}
        <div className="flex justify-between items-end border-b-[3px] border-[#008bcd] pb-3 mb-5">
          <div className="flex items-center gap-4">
            {settings?.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" className="max-h-14 max-w-[150px] object-contain" />
            )}
            <div>
              <h1 className="text-2xl font-black text-[#008bcd] uppercase leading-none tracking-tight">{clinicName}</h1>
              <p className="text-[10px] font-bold text-slate-600 uppercase mt-1 tracking-wider">{clinicSlogan}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">RUC: {clinicRuc} | {clinicAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block border border-slate-300 bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Odontograma ({viewFormatted})
            </span>
            <p className="text-[10px] text-slate-500 mt-2">Fecha: <b className="text-slate-800">{today}</b></p>
          </div>
        </div>

        {/* TARJETAS DE PACIENTE Y DOCTOR */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-slate-300 rounded-lg p-3 bg-white">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Paciente</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">{patientFullName}</p>
            <p className="text-[10px] text-slate-600 mt-1"><b>Documento:</b> {patientDocId}</p>
          </div>
          <div className="border border-slate-300 rounded-lg p-3 bg-white">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Especialista / Dentición</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">{activeDoctor}</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Dentición: <b>{dentitionFormatted}</b> {doctorSpecialty ? ` | ${doctorSpecialty}` : ""}
            </p>
          </div>
        </div>

        {/* GRÁFICO DEL ODONTOGRAMA (IMÁGENES SVG) */}
        <div className="flex flex-col items-center gap-6 py-4 transform scale-95 origin-top mb-6">
          <div className="flex justify-center items-center gap-6">
            {renderQuadrant(arcada1)}
            <div className="w-px h-16 bg-slate-300" />
            {renderQuadrant(arcada2)}
          </div>
          
          <div className="w-full flex items-center justify-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Línea de Oclusión</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="flex justify-center items-center gap-6">
            {renderQuadrant(arcada4)}
            <div className="w-px h-16 bg-slate-300" />
            {renderQuadrant(arcada3)}
          </div>
        </div>

        {/* TABLA DE HALLAZGOS Y TRATAMIENTOS */}
        <div className="border-b-2 border-slate-900 flex justify-between items-end pb-1 mb-3">
          <h3 className="text-xs font-black uppercase text-slate-900">Registro de Hallazgos Odontológicos</h3>
          <span className="text-[10px] font-bold text-slate-500">Total Hallazgos: {records.length}</span>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-10 text-xs italic text-slate-500">
            No hay afecciones ni tratamientos registrados en este esquema.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="p-2.5 font-bold text-slate-600 w-16 text-center">Pieza</th>
                <th className="p-2.5 font-bold text-slate-600 w-48">Superficie(s)</th>
                <th className="p-2.5 font-bold text-slate-600">Diagnóstico / Procedimiento</th>
                <th className="p-2.5 font-bold text-slate-600">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.map((r) => (
                <tr key={r.id} className="bg-white">
                  <td className="p-2.5 font-black text-[#008bcd] text-center">#{r.toothNumber}</td>
                  <td className="p-2.5 font-semibold text-slate-700">{formatSurfacesForPrint(r.surfaces, r.toothNumber)}</td>
                  <td className="p-2.5 font-bold text-slate-900">{getStatusLabel(r.status)}</td>
                  <td className="p-2.5 text-slate-600 italic font-medium">{r.notes || "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* FOOTER */}
        <div className="mt-12 pt-4 border-t border-slate-200 text-center">
          <p className="text-[10px] font-bold text-slate-900">{clinicName} - {clinicSlogan}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Dirección: {clinicAddress} • Celular: {clinicPhone}</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #odontogram-printable, #odontogram-printable * { 
            visibility: visible !important; 
            /* REGLA VITAL PARA IMPRIMIR LOS COLORES Y DIBUJOS DE LOS DIENTES SVG */
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          #odontogram-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>
  )
}