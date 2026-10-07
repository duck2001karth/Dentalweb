"use client"

import React from "react"
import { format } from "date-fns"
import DOMPurify from "isomorphic-dompurify" 
import { useClinicSettings } from "@/config/clinic-settings"

interface PrescriptionPrintProps {
  printingDoc: any
  patientFullName: string
  patientAge: string | number
  patientDocId: string
  patientAllergies: string
}

export function PrescriptionPrint({
  printingDoc,
  patientFullName,
  patientAge,
  patientDocId,
  patientAllergies,
}: PrescriptionPrintProps) {
  const { settings } = useClinicSettings()

  if (!printingDoc) return null

  const today = format(new Date(), "dd/MM/yyyy")
  const clinicName = settings?.clinicName?.trim() || "No registrado"
  const clinicSlogan = settings?.slogan?.trim() || "No registrado"
  const clinicRuc = settings?.ruc?.trim() || "No registrado"
  const clinicHolder = settings?.razonSocial?.trim() || "No registrado"
  const clinicAddress = settings?.address?.trim() || "No registrado"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "No registrado"
  const clinicEmail = settings?.email?.trim() || "No registrado"
  const clinicCity = (settings as any)?.city?.trim() || "No registrado"
  const clinicCountry = (settings as any)?.country?.trim() || "No registrado"
  const clinicLocation = `${clinicCity} - ${clinicCountry}`

  const logoUrl = settings?.logoUrl || ""
  const watermarkUrl = settings?.watermarkUrl || ""
  const watermarkOpacity = ((settings as any)?.watermarkOpacity ?? 12) / 100
  const watermarkScale = ((settings as any)?.watermarkScale || 100) / 100
  const isMonochrome = settings?.defaultPrintMode === "bw"
  const filterStyle = isMonochrome ? "grayscale(100%)" : "none"

  // Datos del facultativo normalizados
  const rawDoctorName =
    printingDoc.doctorName ||
    printingDoc.author?.name ||
    "Dr. Especialista"
  const doctorDisplayName = rawDoctorName.startsWith("Dr") ? rawDoctorName : `Dr. ${rawDoctorName}`

  const doctorSpecialty =
    printingDoc.doctorSpecialty ||
    printingDoc.author?.specialty ||
    "Ortodoncia"

  const doctorLicense =
    printingDoc.doctorLicense ||
    printingDoc.author?.professionalCard ||
    printingDoc.author?.licenseNumber ||
    ""

  const doctorSignature =
    printingDoc.doctorSignature ||
    printingDoc.author?.signatureBase64 ||
    null

  // Componente unificado para el pie de firma y sello profesional
  const renderDoctorSignatureBlock = () => (
    <div className="mt-auto shrink-0 flex flex-col justify-end pt-2 relative z-10">
      <div className="text-center w-56 mx-auto mb-2">
        {doctorSignature ? (
          <div className="relative flex flex-col items-center">
            <img
              src={doctorSignature}
              alt="Firma Profesional"
              className="h-14 max-w-[170px] object-contain mx-auto -mb-1 bg-transparent"
            />
            <div className="w-full border-t border-slate-900 pt-1">
              <p className="text-[10px] font-bold text-slate-900 leading-tight">
                {doctorDisplayName}
              </p>
              <p className="text-[9px] font-semibold text-slate-700 leading-tight">
                {doctorSpecialty}
              </p>
              {doctorLicense ? (
                <p className="text-[8.5px] font-mono font-bold text-slate-600 mt-0.5">
                  Matrícula / Reg. MSP: {doctorLicense}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-900 w-full pt-1.5 mt-8">
            <p className="text-[10px] font-bold text-slate-900 leading-tight">
              {doctorDisplayName}
            </p>
            <p className="text-[9px] font-semibold text-slate-700 leading-tight">
              {doctorSpecialty}
            </p>
            {doctorLicense ? (
              <p className="text-[8.5px] font-mono font-bold text-slate-600 mt-0.5">
                Matrícula / Reg. MSP: {doctorLicense}
              </p>
            ) : null}
          </div>
        )}
      </div>
      <div className="border-t-2 border-[#008bcd] pt-1.5 text-[9px] text-slate-800 flex flex-col text-center">
        <p className="font-semibold uppercase tracking-wider mb-0.5">
          Dirección: {clinicAddress}
        </p>
        <p>Cel.: {clinicPhone} | e-mail: {clinicEmail} | {clinicLocation}</p>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; } 
          body { 
            margin: 0; 
            padding: 0; 
            background-color: white !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            overflow: hidden; 
          }
          .print-wrapper { 
            display: flex; 
            flex-direction: row; 
            width: 100vw; 
            height: 100vh; 
            max-height: 100vh; 
            background: white; 
            color: black; 
            overflow: hidden; 
            page-break-after: avoid; 
            page-break-inside: avoid; 
            box-sizing: border-box; 
          }
          .print-pane { 
            width: 50vw; 
            height: 100vh; 
            border-right: 1px dashed #9ca3af; 
            padding: 1.2cm 1.5cm; 
            box-sizing: border-box; 
            display: flex; 
            flex-direction: column; 
            position: relative; 
          }
          .print-pane:last-child { border-right: none; }
          
          .watermark-container {
            display: flex !important; 
            position: absolute !important; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0;
            justify-content: center; 
            align-items: center; 
            z-index: 0; 
            pointer-events: none; 
          }
          .watermark-img { 
            width: 320px; 
            object-fit: contain;
          }
        }
      `}</style>

      <div className="hidden print:flex fixed inset-0 z-50 print-wrapper text-sm bg-white font-sans">
        
        {/* LADO 1: MEDICAMENTOS (R.P.) */}
        <div className="print-pane relative">
          <div
            className="hidden print:flex watermark-container"
            style={{ opacity: watermarkOpacity }}
          >
            <img
              src={watermarkUrl}
              alt="Marca de Agua"
              className="watermark-img"
              style={{
                transform: `scale(${watermarkScale})`,
                filter: filterStyle,
              }}
            />
          </div>

          <div className="flex justify-between items-start mb-3 border-b-2 border-[#008bcd] pb-2 relative z-10">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt={`Logo ${clinicName}`}
                className="h-10 w-auto object-contain"
                style={{ filter: filterStyle }}
              />
              <div>
                <h1 className="text-2xl font-black text-[#008bcd] tracking-tight uppercase leading-none">
                  {clinicName}
                </h1>
                <p className="text-[10px] font-bold text-slate-800 uppercase mt-0.5">
                  {clinicSlogan}
                </p>
              </div>
            </div>
            <div className="text-right text-[10px] leading-tight">
              <p className="font-bold text-black">{clinicHolder}</p>
              <p className="text-black">RUC: {clinicRuc}</p>
            </div>
          </div>

          <div className="flex justify-between text-xs mb-2 text-black border-b border-slate-200 pb-1.5 relative z-10">
            <p>
              Fecha de emisión: <span className="font-semibold">{today}</span>
            </p>
            <p className="text-red-600 font-bold">
              Nº {printingDoc.id?.substring(0, 6).toUpperCase()}
            </p>
          </div>

          <div className="text-xs mb-3 space-y-1 text-black bg-slate-50 p-2.5 rounded border border-slate-100 relative z-10">
            <div className="flex justify-between">
              <p>
                <span className="font-bold text-[#008bcd]">Paciente:</span> {patientFullName}
              </p>
              <p>
                <span className="font-bold text-[#008bcd]">Edad:</span>{" "}
                {patientAge ? `${patientAge} Años` : "--"}
              </p>
            </div>
            <p>
              <span className="font-bold text-[#008bcd]">Doc. Identidad:</span> {patientDocId}
            </p>
            <p>
              <span className="font-bold text-red-600">Alergias:</span>{" "}
              {patientAllergies || "Ninguna reportada"}
            </p>
          </div>

          {/* CUERPO MEDICAMENTOS (Sanitizado) */}
          <div className="flex-1 text-black relative z-10">
            <h3 className="font-bold text-base mb-1.5 text-[#008bcd] border-b border-slate-200 pb-1">
              Medicamentos (R.P.)
            </h3>
            <div
              className="whitespace-pre-wrap leading-relaxed [&>ul]:list-disc [&>ul]:ml-5 text-xs"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(printingDoc.medications) }}
            />
          </div>

          {/* FIRMA Y PIE DE PÁGINA PROFESIONAL LADO 1 */}
          {renderDoctorSignatureBlock()}
        </div>

        {/* LADO 2: INDICACIONES Y OBSERVACIONES */}
        <div className="print-pane relative">
          <div
            className="hidden print:flex watermark-container"
            style={{ opacity: watermarkOpacity }}
          >
            <img
              src={watermarkUrl}
              alt="Marca de Agua"
              className="watermark-img"
              style={{
                transform: `scale(${watermarkScale})`,
                filter: filterStyle,
              }}
            />
          </div>

          <div className="flex justify-between items-start mb-3 border-b-2 border-[#008bcd] pb-2 relative z-10">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt={`Logo ${clinicName}`}
                className="h-10 w-auto object-contain"
                style={{ filter: filterStyle }}
              />
              <div>
                <h1 className="text-2xl font-black text-[#008bcd] tracking-tight uppercase leading-none">
                  {clinicName}
                </h1>
                <p className="text-[10px] font-bold text-slate-800 uppercase mt-0.5">
                  {clinicSlogan}
                </p>
              </div>
            </div>
            <div className="text-right text-[10px] leading-tight">
              <p className="font-bold text-black">{clinicHolder}</p>
              <p className="text-black">RUC: {clinicRuc}</p>
            </div>
          </div>

          <div className="flex justify-between text-xs mb-2 text-black border-b border-slate-200 pb-1.5 relative z-10">
            <p>
              Fecha de emisión: <span className="font-semibold">{today}</span>
            </p>
            <p className="text-red-600 font-bold">
              Nº {printingDoc.id?.substring(0, 6).toUpperCase()}
            </p>
          </div>

          <div className="text-xs mb-3 space-y-1 text-black bg-slate-50 p-2.5 rounded border border-slate-100 relative z-10">
            <div className="flex justify-between">
              <p>
                <span className="font-bold text-[#008bcd]">Paciente:</span> {patientFullName}
              </p>
              <p>
                <span className="font-bold text-[#008bcd]">Edad:</span>{" "}
                {patientAge ? `${patientAge} Años` : "--"}
              </p>
            </div>
            <p>
              <span className="font-bold text-[#008bcd]">Doc. Identidad:</span> {patientDocId}
            </p>
            <p>
              <span className="font-bold text-red-600">Alergias:</span>{" "}
              {patientAllergies || "Ninguna reportada"}
            </p>
          </div>

          {/* INDICACIONES (Sanitizado) */}
          <div className="flex-1 text-black relative z-10">
            <h3 className="font-bold text-base mb-1.5 text-[#008bcd] border-b border-slate-200 pb-1">
              Indicaciones
            </h3>
            <div
              className="whitespace-pre-wrap leading-relaxed [&>ul]:list-disc [&>ul]:ml-5 text-xs"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(printingDoc.indications) }}
            />
          </div>

          {/* OBSERVACIONES (Sanitizado) */}
          {printingDoc.observations && (
            <div className="mb-4 pb-2 border-t border-slate-200 relative z-10">
              <h3 className="font-bold text-[11px] mt-2 mb-1 text-amber-700 uppercase tracking-wider">
                Observaciones / Recomendaciones Especiales:
              </h3>
              <div
                className="whitespace-pre-wrap leading-relaxed [&>ul]:list-disc [&>ul]:ml-5 text-xs text-slate-800 font-medium"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(printingDoc.observations) }}
              />
            </div>
          )}

          {renderDoctorSignatureBlock()}
        </div>
      </div>
    </>
  )
}