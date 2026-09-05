"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export type PrintMode = "COMPLETO" | "SOLO_TOTAL" | "SIN_DETALLE" | "LABORATORIO"

interface TreatmentPrintViewProps {
  plan: any
  patient: any
  patientAge?: number | string
  baseTotal: number
  discountPercent: number
  discountAmount: number
  finalTotalCost: number
  commentText?: string
  autoRecoveredSignature?: string
  getSignatureSrc: (signature: string) => string
  printMode?: PrintMode
}

interface LocalClinicConfig {
  clinicName: string
  slogan: string
  razonSocial: string
  ruc: string
  address: string
  currency: string
  logoUrl: string
  watermarkUrl: string
  watermarkOpacity: number
}

export function TreatmentPrintView({
  plan,
  patient,
  patientAge,
  baseTotal,
  discountPercent,
  discountAmount,
  finalTotalCost,
  commentText,
  autoRecoveredSignature,
  getSignatureSrc,
  printMode = "COMPLETO"
}: TreatmentPrintViewProps) {
  const [dbClinic, setDbClinic] = useState<LocalClinicConfig | null>(null)

  // 1. CARGA DIRECTA DE LA CONFIGURACIÓN (Como en el documento clínico que te funciona)
  useEffect(() => {
    let isMounted = true

    async function fetchClinicSettings() {
      try {
        const res = await fetch("/api/configuration")
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data) {
            const formattedAddress = [data.address, data.city, data.country]
              .filter(Boolean)
              .join(" • ")

            setDbClinic({
              clinicName: data.clinicName || "Carmo Dental",
              slogan: data.slogan || "CLÍNICA DE ESPECIALIDADES ODONTOLÓGICAS",
              razonSocial: data.razonSocial || "Dr. Especialista",
              ruc: data.ruc || "",
              address: formattedAddress || "Quito, Ecuador",
              currency: data.currency || "USD",
              logoUrl: data.logoUrl || "/logosn.png",
              watermarkUrl: data.watermarkUrl || data.logoUrl || "/logosn.png",
              watermarkOpacity: data.watermarkOpacity ? Number(data.watermarkOpacity) / 100 : 0.06,
            })
          }
        }
      } catch (error) {
        console.error("Error al cargar configuración en impresión del presupuesto:", error)
      }
    }

    fetchClinicSettings()

    return () => {
      isMounted = false
    }
  }, [])

  // Datos seguros mientras carga o si falla
  const clinicInfo = dbClinic || {
    clinicName: "Carmo Dental",
    slogan: "CLÍNICA DE ESPECIALIDADES ODONTOLÓGICAS",
    razonSocial: "Dr. Especialista",
    ruc: "",
    address: "Quito, Ecuador",
    currency: "USD",
    logoUrl: "/logosn.png",
    watermarkUrl: "/logosn.png",
    watermarkOpacity: 0.06
  }

  const isOnlyTotal = printMode === "SOLO_TOTAL"
  const isNoDetail = printMode === "SIN_DETALLE"
  const isLabOrder = printMode === "LABORATORIO"

  // 2. FORMATEO DE FECHA Y NOMBRES
  const formattedDate = format(new Date(), "dd/MM/yyyy")
  
  const rawDoctorName = plan?.doctor?.name || "Profesional Asignado"
  const treatingDoctorFormatted = rawDoctorName.toLowerCase().startsWith("dr") 
    ? rawDoctorName 
    : `Dr. ${rawDoctorName}`

  return (
    <div
      id="treatment-plan-printable"
      className="hidden print:block font-sans text-slate-900 bg-white min-h-[297mm] p-12 relative overflow-hidden"
    >
      {/* MARCA DE AGUA INSTITUCIONAL */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
        style={{ opacity: clinicInfo.watermarkOpacity }}
      >
        <img
          src={clinicInfo.watermarkUrl}
          alt="Marca de agua"
          className="w-[450px] object-contain mix-blend-multiply"
        />
      </div>

      <div className="relative z-10 flex flex-col justify-between min-h-[265mm]">
        
        <div>
          {/* CABECERA */}
          <div className="flex justify-between items-center border-b-2 border-[#008bcd] pb-2.5 gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={clinicInfo.logoUrl}
                alt="Logo Clínica"
                className="h-12 w-auto object-contain shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-[#008bcd] tracking-tight leading-none uppercase">
                  {clinicInfo.clinicName}
                </h1>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-0.5">
                  {isLabOrder ? "ORDEN DE TRABAJO DE LABORATORIO" : clinicInfo.slogan}
                </p>
                <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                  {clinicInfo.address}
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end shrink-0">
              <h2 className="text-[11px] font-black text-[#008bcd] uppercase tracking-wide leading-tight">
                {clinicInfo.razonSocial}
              </h2>
              {clinicInfo.ruc && (
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mt-0.5">
                  RUC: {clinicInfo.ruc}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-slate-500 font-medium">
                  Emisión: <b className="text-slate-800">{formattedDate}</b>
                </span>
                <span className="text-[8px] text-slate-600 font-mono uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  #{plan?.id?.slice(-6)?.toUpperCase() || "PLAN"}
                </span>
              </div>
            </div>
          </div>

          {/* DATOS DEL PACIENTE COMPACTOS */}
          <div className="my-3 px-3.5 py-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg text-xs print-section">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-slate-400 font-semibold text-[9px] uppercase tracking-wider block">
                  Paciente
                </span>
                <p className="text-[13px] font-semibold text-slate-800 capitalize leading-tight mt-0.5 tracking-normal">
                  {patient ? `${patient.firstName} ${patient.lastName}`.toLowerCase() : "Paciente no registrado"}
                </p>
              </div>
              <div className="flex items-center gap-5 text-slate-600 text-[11px]">
                <p><span className="text-slate-400 font-medium">Doc.:</span> <span className="font-semibold text-slate-700">{patient?.ci || "--"}</span></p>
                <p><span className="text-slate-400 font-medium">Edad:</span> <span className="font-semibold text-slate-700">{patientAge ? `${patientAge} años` : "--"}</span></p>
                <p><span className="text-slate-400 font-medium">Convenio:</span> <span className="font-semibold text-slate-700">{patient?.convenio || plan?.agreementName || "Particular"}</span></p>
              </div>
            </div>
            
            {patient?.medicalAlerts && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60">
                <span className="text-red-600 text-[9px] font-bold tracking-wide">
                  ⚠️ Alerta médica: <span className="font-medium text-red-500">{patient.medicalAlerts}</span>
                </span>
              </div>
            )}
          </div>

          {/* TABLA DE PRESTACIONES */}
          <div className="print-content">
            <h2 className="text-[10px] font-black text-[#008bcd] uppercase tracking-widest mb-1.5">
              {isLabOrder ? "Especificaciones de Laboratorio" : isOnlyTotal ? "Resumen General" : "Desglose de Tratamientos"}
            </h2>

            {!isOnlyTotal && (
              <table className="w-full text-[11px] mb-6">
                <thead>
                  <tr className="border-y-2 border-[#008bcd]/30 bg-slate-50/80">
                    <th className="text-left py-2.5 px-3 font-bold text-[#008bcd] uppercase tracking-wider text-[9px]">Prestación / Procedimiento</th>
                    <th className="text-center py-2.5 px-3 font-bold text-[#008bcd] uppercase tracking-wider text-[9px] w-28">Región</th>
                    {!isNoDetail && !isLabOrder && (
                      <>
                        <th className="text-center py-2.5 px-3 font-bold text-[#008bcd] uppercase tracking-wider text-[9px] w-20">Dscto</th>
                        <th className="text-right py-2.5 px-3 font-bold text-[#008bcd] uppercase tracking-wider text-[9px] w-28">Importe</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plan?.items && plan.items.length > 0 ? (
                    plan.items.map((item: any, idx: number) => {
                      const itemDscto = Number(item.discount || 0)
                      const cost = Number(item.cost || item.price || 0)
                      const finalCost = cost - (cost * (itemDscto / 100))

                      return (
                        <tr key={idx} className="print-section">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{item.procedureName || item.name}</td>
                          <td className="text-center py-2.5 px-3 font-bold text-slate-600">{item.tooth || item.region || "-"}</td>
                          {!isNoDetail && !isLabOrder && (
                            <>
                              <td className="text-center py-2.5 px-3 text-slate-500 font-medium">{itemDscto > 0 ? `${itemDscto}%` : "-"}</td>
                              <td className="text-right py-2.5 px-3 font-bold font-mono text-slate-900">
                                {clinicInfo.currency} {finalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </>
                          )}
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic text-[11px]">
                        No hay prestaciones registradas en este presupuesto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* RESUMEN FINANCIERO */}
            {!isLabOrder && (
              <div className="flex justify-end mb-8 print-section">
                <div className="w-80 bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                  {!isOnlyTotal && !isNoDetail && (
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <span>Subtotal</span>
                        <span className="font-mono text-slate-900">{clinicInfo.currency} {Number(baseTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {discountPercent > 0 && (
                        <div className="flex justify-between text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                          <span>Dscto Global ({discountPercent}%)</span>
                          <span className="font-mono">- {clinicInfo.currency} {Number(discountAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t-2 border-[#008bcd]/20 pt-4">
                    <span className="font-black text-[14px] text-slate-900 uppercase tracking-widest">Total</span>
                    <span className="font-black font-mono text-[18px] text-[#008bcd]">
                      {clinicInfo.currency} {Number(finalTotalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN DE FIRMAS Y PIE LEGAL */}
        <div className="pt-6 border-t border-slate-200 print-signatures">
          <div className="mb-6">
            <h4 className="font-bold text-[#008bcd] text-[10px] uppercase tracking-widest mb-1.5">Observaciones / Condiciones</h4>
            <p className="text-[10px] text-slate-600 p-3 bg-slate-50/50 border border-slate-200 rounded-lg leading-relaxed italic">
              {commentText || "Validez del plan de tratamiento: 30 días calendario. Este presupuesto está sujeto a modificaciones tras evaluación clínica y radiográfica continua. Los valores expresados incluyen impuestos de ley aplicables."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-16 text-center">
            <div className="flex flex-col items-center">
              <div className="h-16 w-56 flex items-center justify-center border-b border-slate-300">
                {autoRecoveredSignature ? (
                  <img
                    src={getSignatureSrc(autoRecoveredSignature)}
                    alt="Firma Paciente"
                    className="max-h-14 max-w-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Pendiente de firma digital</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2 capitalize">
                {patient ? `${patient.firstName} ${patient.lastName}`.toLowerCase() : "Paciente"}
              </p>
              <p className="text-[10px] text-slate-500">C.I.: {patient?.ci || "--"}</p>
              <p className="text-[9px] text-slate-400 font-medium mt-1">Firma del Paciente / Tutor Legal</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-16 w-56 flex items-center justify-center border-b border-slate-300">
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2 uppercase">{treatingDoctorFormatted}</p>
              <p className="text-[10px] text-slate-500">
                {plan?.doctor?.specialty || plan?.doctor?.specialization || "Odontología General"}
              </p>
              <p className="text-[9px] text-slate-400 font-medium mt-1">Firma y Sello del Profesional</p>
            </div>
          </div>
          <div className="text-center mt-6 text-[9px] text-slate-400 uppercase">
            Documento generado por {clinicInfo.clinicName} • Válido para trámite interno y personal.
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #treatment-plan-printable,
          #treatment-plan-printable * {
            visibility: visible !important;
          }
          /* Esta estructura es la que elimina la barra de scroll y fija los márgenes correctos */
          #treatment-plan-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16mm 20mm !important;
            display: block !important;
            background: white !important;
          }
          .print-section {
            break-inside: avoid;
          }
          .print-signatures {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default TreatmentPrintView