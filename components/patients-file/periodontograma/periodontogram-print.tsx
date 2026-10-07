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
  const clinicSlogan = settings?.slogan?.trim() || "CENTRO DE ESPECIALIDADES"
  const clinicRuc = settings?.ruc?.trim() || ""
  const clinicAddress = settings?.address?.trim() || ""
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const activeDoctor = doctorName?.startsWith("Dr") ? doctorName : `Dr. ${doctorName || "Especialista"}`

  const renderPrintSection = (numbers: number[], label: string, isUpper: boolean) => (
    <div className="mb-6 break-inside-avoid w-full">
      <div className="border-b-[1.5px] border-[#008bcd] pb-1 mb-2 flex items-center justify-between">
        <h3 className="font-black text-[11px] text-[#008bcd] uppercase tracking-wider">{label}</h3>
      </div>
      <table className="w-full text-center border-collapse text-[10px] border border-neutral-300">
        <thead>
          <tr className="bg-neutral-50">
            <th className="p-1 border border-neutral-300 text-left font-bold text-neutral-600 w-20">Parámetro</th>
            {numbers.map((n) => (
              <th key={`head-${n}`} className="p-1 border border-neutral-300 font-mono font-bold text-neutral-900 bg-neutral-100">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-1 border border-neutral-300 text-left font-semibold text-neutral-500 bg-neutral-50">Esquema</td>
            {numbers.map((n) => (
              <td key={`svg-${n}`} className="p-0 border border-neutral-300 bg-white align-bottom">
                {/* SVG Render (Los gráficos se imprimirán intactos gracias a print-color-adjust) */}
                <div className="scale-75 origin-bottom flex justify-center">
                  <PerioGraphic tooth={n} data={chartData[n]} isUpper={isUpper} />
                </div>
              </td>
            ))}
          </tr>
          {/* Filas de datos (BOP, PD, MG, CAL) */}
          <tr>
            <td className="p-1 border border-neutral-300 text-left font-medium text-neutral-600">BOP</td>
            {numbers.map((n) => {
              const count = chartData[n]?.bleeding?.filter(Boolean).length || 0
              return (
                <td key={`bop-${n}`} className="p-1 border border-neutral-300 font-mono">
                  {count > 0 ? <span className="text-rose-600 font-bold">{count}</span> : <span className="text-neutral-300">-</span>}
                </td>
              )
            })}
          </tr>
          <tr className="bg-neutral-50/50">
            <td className="p-1 border border-neutral-300 text-left font-bold text-neutral-700">Prof. Bolsa</td>
            {numbers.map((n) => (
              <td key={`pd-${n}`} className="p-1 border border-neutral-300 font-mono text-[9px]">
                {chartData[n]?.pd?.map((v: string) => parseInt(v)>3 ? `<b style="color:red">${v}</b>` : v || "-").join(" ")}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <div id="periodontogram-printable" className="hidden print:block font-sans text-slate-900 bg-white min-h-[210mm] relative overflow-hidden">
      <div className="relative z-10 flex flex-col justify-between min-h-[190mm]">
        <div>
          {/* Cabecera */}
          <div className="flex justify-between items-center pb-3 mb-4 border-b-[3px] border-[#008bcd]">
            <div>
              <h1 className="text-xl font-black text-[#008bcd] tracking-tight uppercase">{clinicName}</h1>
              <p className="text-[10px] font-bold text-neutral-600 uppercase">{clinicSlogan}</p>
            </div>
            <div className="text-right">
              <span className="bg-neutral-100 text-neutral-900 text-[10px] font-black px-2 py-1 rounded border border-neutral-300 uppercase">
                REPORTE PERIODONTAL
              </span>
              <p className="text-[9px] mt-1 text-neutral-500">Fecha: <b>{today}</b></p>
            </div>
          </div>

          <div className="flex gap-10 mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs">
            <div>
              <p className="text-[9px] font-bold text-neutral-400 uppercase">Paciente</p>
              <p className="font-black text-sm">{patientFullName}</p>
              <p className="text-[10px] text-neutral-600">ID: {patientDocId} | Edad: {patientAge}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-neutral-400 uppercase">Evaluador</p>
              <p className="font-black text-sm">{activeDoctor}</p>
              <p className="text-[10px] text-neutral-600">{doctorSpecialty} {doctorLicense ? ` | Reg: ${doctorLicense}` : ""}</p>
            </div>
          </div>

          {renderPrintSection(TOOTH_NUMBERS_SUP, "Maxilar Superior", true)}
          {renderPrintSection(TOOTH_NUMBERS_INF, "Maxilar Inferior", false)}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #periodontogram-printable, #periodontogram-printable * { 
            visibility: visible !important; 
            /* REGLA CRÍTICA PARA IMPRIMIR LOS DIBUJOS SVG (Rojo y Azul) */
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          #periodontogram-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
          }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>
    </div>
  )
}