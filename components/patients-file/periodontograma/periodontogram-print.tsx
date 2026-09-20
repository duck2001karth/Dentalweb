"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useClinicSettings } from "@/config/clinic-settings"

const TOOTH_NUMBERS_SUP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const TOOTH_NUMBERS_INF = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

interface PeriodontogramPrintProps {
  chartData: any
  patientFullName?: string
  patientDocId?: string
  patientAge?: string | number
  doctorName?: string
  doctorSpecialty?: string
  doctorSignature?: string | null
  doctorLicense?: string
  PerioGraphicComponent: React.ComponentType<{ tooth: number; data: any; isUpper: boolean }>
}

export function PeriodontogramPrint({
  chartData,
  patientFullName = "Paciente",
  patientDocId = "No registrado",
  patientAge = "--",
  doctorName,
  doctorSpecialty,
  doctorSignature,
  doctorLicense,
  PerioGraphicComponent: PerioGraphic,
}: PeriodontogramPrintProps) {
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
  
  const rawDoctor = doctorName || settings?.razonSocial?.trim() || "Dr. Especialista"
  const activeDoctor = rawDoctor.startsWith("Dr") ? rawDoctor : `Dr. ${rawDoctor}`

  const renderPrintSection = (numbers: number[], label: string, isUpper: boolean) => (
    <div className="mb-6 break-inside-avoid">
      <div className="border-b border-[#008bcd] pb-1 mb-2 flex items-center justify-between">
        <h3 className="font-black text-xs text-[#008bcd] uppercase tracking-wider">{label}</h3>
        <span className="text-[10px] text-neutral-400 font-mono">16 Piezas Evaluadas</span>
      </div>
      <table className="w-full text-center border-collapse text-[10px] border border-neutral-300">
        <thead>
          <tr className="bg-neutral-50">
            <th className="p-1.5 border border-neutral-300 text-left font-bold text-neutral-600 w-24">Parámetro</th>
            {numbers.map((n) => (
              <th key={`head-${n}`} className="p-1 border border-neutral-300 font-mono font-bold text-neutral-900 bg-neutral-100">
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-1 border border-neutral-300 text-left font-semibold text-neutral-500 bg-neutral-50">Esquema</td>
            {numbers.map((n) => (
              <td key={`svg-${n}`} className="p-0 border border-neutral-300 bg-white align-bottom">
                <div className="scale-75 origin-bottom flex justify-center">
                  <PerioGraphic tooth={n} data={chartData[n]} isUpper={isUpper} />
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-1 border border-neutral-300 text-left font-medium text-neutral-600">Sangrado (BOP)</td>
            {numbers.map((n) => {
              const count = chartData[n]?.bleeding?.filter(Boolean).length || 0
              return (
                <td key={`bop-${n}`} className="p-1 border border-neutral-300 font-mono">
                  {count > 0 ? <span className="text-rose-600 font-bold">● {count}</span> : <span className="text-neutral-300">-</span>}
                </td>
              )
            })}
          </tr>
          <tr className="bg-neutral-50/50">
            <td className="p-1 border border-neutral-300 text-left font-bold text-neutral-700">Prof. Bolsa (PD)</td>
            {numbers.map((n) => (
              <td key={`pd-${n}`} className="p-1 border border-neutral-300 font-mono text-[9.5px]">
                {chartData[n]?.pd?.map((val: string, idx: number) => {
                  const num = parseInt(val) || 0
                  return (
                    <span key={idx} className={num > 3 ? "text-rose-600 font-black px-0.5" : "text-neutral-700 px-0.5"}>
                      {val || "-"}
                    </span>
                  )
                })}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-1 border border-neutral-300 text-left font-medium text-amber-700">Margen (MG)</td>
            {numbers.map((n) => (
              <td key={`mg-${n}`} className="p-1 border border-neutral-300 font-mono text-[9px] text-neutral-600">
                {chartData[n]?.mg?.map((val: string) => val || "-").join(" ")}
              </td>
            ))}
          </tr>
          <tr className="bg-neutral-100 font-bold">
            <td className="p-1 border border-neutral-300 text-left text-neutral-900">NIC / CAL</td>
            {numbers.map((n) => (
              <td key={`cal-${n}`} className="p-1 border border-neutral-300 font-mono text-[9.5px]">
                {chartData[n]?.cal?.map((val: string, idx: number) => {
                  const num = parseInt(val) || 0
                  return (
                    <span key={idx} className={num > 4 ? "text-rose-700 font-black px-0.5" : "text-neutral-800 px-0.5"}>
                      {val || "-"}
                    </span>
                  )
                })}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <div id="periodontogram-printable" className="hidden print:block font-sans text-slate-900 bg-white min-h-[210mm] relative overflow-hidden">
      {settings?.watermarkUrl && (
        <div
          aria-hidden="true"
          className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          style={{ opacity: ((settings as any)?.watermarkOpacity ?? 8) / 100 }}
        >
          <img
            src={settings.watermarkUrl}
            alt="Marca de agua"
            style={{ transform: `scale(${((settings as any)?.watermarkScale || 100) / 100})` }}
            className="w-[500px] max-h-[500px] object-contain"
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between min-h-[190mm]">
        <div>
          {/* Cabecera Membretada */}
          <div className="flex justify-between items-center pb-3 mb-4 border-b-[3px] border-[#008bcd]">
            <div className="flex items-center gap-3.5">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-12 max-w-[140px] object-contain" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-[#008bcd]/10 border border-[#008bcd]/30 flex items-center justify-center text-[#008bcd] font-black text-lg">
                  {clinicName.charAt(0)}
                </div>
              )}
              <div className="space-y-0.5">
                <h1 className="text-xl font-black text-[#008bcd] tracking-tight leading-none uppercase">{clinicName}</h1>
                <p className="text-[10px] font-black uppercase text-neutral-800 tracking-wider">{clinicSlogan}</p>
                <p className="text-[9.5px] text-neutral-500 font-medium">RUC: {clinicRuc} | {clinicAddress}</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-0.5">
              <span className="inline-block bg-white text-neutral-900 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider border border-neutral-300">
                REPORTE PERIODONTAL INTEGRAL
              </span>
              <p className="text-[10px] text-neutral-500 font-medium">
                Fecha: <strong className="text-neutral-900 font-bold">{today}</strong>
              </p>
            </div>
          </div>

          {/* Tarjeta de Paciente y Especialista con Firma y Matrícula */}
          <div className="grid grid-cols-2 gap-4 my-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
            <div>
              <p className="text-neutral-400 font-bold text-[9px] uppercase tracking-wider">Paciente</p>
              <p className="font-black text-neutral-900 text-sm mt-0.5">{patientFullName}</p>
              <div className="flex gap-4 text-neutral-700 mt-0.5 text-[11px]">
                <p><b>Identificación:</b> <span className="font-mono">{patientDocId}</span></p>
                <p><b>Edad:</b> {patientAge !== "--" ? `${patientAge} Años` : "--"}</p>
              </div>
            </div>
            
            <div className="border-l border-neutral-200 pl-4 flex items-center justify-between">
              <div>
                <p className="text-neutral-400 font-bold text-[9px] uppercase tracking-wider">Especialista Evaluador</p>
                <p className="font-black text-neutral-900 text-sm mt-0.5">{activeDoctor}</p>
                <p className="text-neutral-700 mt-0.5 text-[11px]">
                  <b>Especialidad:</b> {doctorSpecialty || "Ortodoncia"}
                </p>
                {doctorLicense && (
                  <p className="text-neutral-600 mt-0.5 text-[10px] font-mono font-bold">
                    Matrícula / Reg. MSP: {doctorLicense}
                  </p>
                )}
              </div>

              {doctorSignature && (
                <div className="text-center pr-2">
                  <img
                    src={doctorSignature}
                    alt="Firma del Evaluador"
                    className="h-12 max-w-[120px] object-contain"
                  />
                  <div className="border-t border-slate-400 text-[8px] font-bold text-slate-500 uppercase mt-0.5">
                    Firma Autorizada
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tablas de Evaluación */}
          {renderPrintSection(TOOTH_NUMBERS_SUP, "Maxilar Superior (Vestibular / Palatino)", true)}
          {renderPrintSection(TOOTH_NUMBERS_INF, "Maxilar Inferior (Vestibular / Lingual)", false)}
        </div>

        {/* Pie de Página Institucional */}
        <div className="pt-4 mt-4 break-inside-avoid">
          <div className="w-full h-[2px] bg-[#008bcd] mb-2" />
          <div className="text-center space-y-0.5 text-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-800">
              {clinicName.toUpperCase()} - {clinicSlogan}
            </p>
            <p className="text-[9px] text-slate-600">
              Dirección: {clinicAddress} • Cel.: {clinicPhone} • {clinicLocation}
            </p>
            <p className="text-[8px] text-slate-400 italic">
              Documento clínico periodontal generado por Carmo Dental. Las medidas de PD &gt; 3 mm y CAL &gt; 4 mm señalan sitios de compromiso periodontal.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #periodontogram-printable, #periodontogram-printable * { visibility: visible !important; }
          #periodontogram-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            display: block !important;
            background: white !important;
          }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>
    </div>
  )
}