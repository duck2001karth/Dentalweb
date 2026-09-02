"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export interface ClinicConfig {
  name?: string
  slogan?: string
  ruc?: string
  address?: string
  phone?: string
  whatsappNumber?: string
  email?: string
  logoUrl?: string
  watermarkUrl?: string
  watermarkOpacity?: number
}

interface ClinicalDocPrintProps {
  document: any
  patientFullName: string
  patientAge?: string | number
  patientDocId?: string
  doctorSpecialty?: string
  clinic?: ClinicConfig
}

const DEFAULT_CLINIC: ClinicConfig = {
  name: "Carmo Dental",
  slogan: "CLÍNICA DE ESPECIALIDADES ODONTOLÓGICAS",
  ruc: "",
  address: "Quito, Ecuador",
  phone: "",
  whatsappNumber: "",
  email: "",
  logoUrl: "/logosn.png",
  watermarkUrl: "/logosn.png",
  watermarkOpacity: 6,
}

export function ClinicalDocPrint({
  document: doc,
  patientFullName,
  patientAge,
  patientDocId,
  doctorSpecialty = "Odontología General y Especialidades",
  clinic: customClinic,
}: ClinicalDocPrintProps) {
  const [dbClinic, setDbClinic] = useState<ClinicConfig | null>(null)

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
              .join(", ")

            setDbClinic({
              name: data.clinicName || "Carmo Dental",
              slogan: data.slogan || "CLÍNICA DE ESPECIALIDADES ODONTOLÓGICAS",
              ruc: data.ruc || "",
              address: formattedAddress || "Quito, Ecuador",
              phone: data.phone || "",
              whatsappNumber: data.whatsappNumber || "",
              email: data.email || "",
              logoUrl: data.logoUrl || "/logosn.png",
              watermarkUrl: data.watermarkUrl || data.logoUrl || "/logosn.png",
              watermarkOpacity: data.watermarkOpacity ? Number(data.watermarkOpacity) : 6,
            })
          }
        }
      } catch (error) {
        console.error("Error al cargar configuración en impresión:", error)
      }
    }

    fetchClinicSettings()

    return () => {
      isMounted = false
    }
  }, [])

  if (!doc) return null

  const clinicInfo: ClinicConfig = {
    ...DEFAULT_CLINIC,
    ...(dbClinic || {}),
    ...(customClinic || {}),
  }

  const formattedDate = format(
    new Date(doc.createdAt || new Date()),
    "dd 'de' MMMM 'de' yyyy, HH:mm",
    { locale: es }
  )

  const doctorName = doc.specialistName || doc.author?.name || "Dr(a). Profesional Tratante"
  const doctorSpecialtyFinal = doc.author?.specialty || doctorSpecialty

  const contactPhone = clinicInfo.phone || clinicInfo.whatsappNumber
  const opacityValue = (clinicInfo.watermarkOpacity || 6) / 100

  return (
    <div
      id="clinical-doc-printable"
      className="hidden print:block font-sans text-slate-900 bg-white min-h-[297mm] p-12 relative overflow-hidden"
    >
      {/* MARCA DE AGUA INSTITUCIONAL */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
        style={{ opacity: opacityValue }}
      >
        <img
          src={clinicInfo.watermarkUrl || clinicInfo.logoUrl || "/logosn.png"}
          alt={clinicInfo.name}
          className="w-[450px] object-contain"
        />
      </div>

      <div className="relative z-10 flex flex-col justify-between min-h-[265mm]">
        {/* CABECERA CON CONTACTO COMPLETO Y ALINEACIÓN INDEPENDIENTE */}
        <div>
          <div className="flex justify-between items-start border-b-2 border-[#008bcd] pb-4 gap-4">
            <div className="flex items-start gap-4">
              <img
                src={clinicInfo.logoUrl || "/logosn.png"}
                alt={`Logo ${clinicInfo.name}`}
                className="h-16 w-auto object-contain shrink-0 mt-0.5"
              />
              <div className="flex flex-col">
                <h1 className="text-2xl font-black text-[#008bcd] tracking-tight leading-none uppercase">
                  {clinicInfo.name}
                </h1>
                {clinicInfo.slogan && (
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mt-1">
                    {clinicInfo.slogan}
                  </p>
                )}
                <div className="text-[10px] text-slate-500 font-medium mt-1.5 flex flex-col gap-0.5">
                  <p>
                    {clinicInfo.ruc && (
                      <span className="font-semibold text-slate-700">RUC: {clinicInfo.ruc} • </span>
                    )}
                    <span>{clinicInfo.address}</span>
                  </p>
                  {(contactPhone || clinicInfo.email) && (
                    <p className="text-slate-600 font-medium">
                      {contactPhone && (
                        <span><b>Telf / WhatsApp:</b> {contactPhone}</span>
                      )}
                      {contactPhone && clinicInfo.email && <span> • </span>}
                      {clinicInfo.email && (
                        <span><b>Email:</b> {clinicInfo.email}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right flex flex-col items-end shrink-0">
              <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider border border-slate-200">
                Documento Clínico Oficial
              </span>
              <div className="text-[10px] text-slate-500 font-medium mt-2 leading-tight">
                <p>Fecha de Emisión:</p>
                <p className="text-xs font-bold text-slate-800">{formattedDate}</p>
              </div>
              <p className="text-[9px] text-slate-400 font-mono mt-1 uppercase tracking-wider">
                ID REF: {doc.id ? doc.id.substring(0, 10).toUpperCase() : "DOC-PEND"}
              </p>
            </div>
          </div>

          {/* DATOS DE FILIACIÓN */}
          <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-slate-50/80 border border-slate-200 rounded-xl text-xs print-section">
            <div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                Datos del Paciente
              </p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                {patientFullName}
              </p>
              <div className="flex gap-4 text-slate-600 mt-1">
                <p>
                  <b>Doc. Identidad:</b> {patientDocId || "No registrado"}
                </p>
                <p>
                  <b>Edad:</b> {patientAge ? `${patientAge} Años` : "--"}
                </p>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                Profesional Tratante
              </p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                {doctorName}
              </p>
              <p className="text-slate-600 mt-1">
                <b>Especialidad:</b> {doctorSpecialtyFinal}
              </p>
            </div>
          </div>

          {/* CONTENIDO DEL DOCUMENTO */}
          <div className="mt-6 print-content">
            <h2 className="text-lg font-bold text-[#008bcd] border-l-4 border-[#008bcd] pl-3.5 py-0.5 mb-4 tracking-tight uppercase">
              {doc.title}
            </h2>
            <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-normal pr-4">
              {doc.content}
            </div>
          </div>
        </div>

        {/* SECCIÓN DE FIRMAS Y PIE LEGAL */}
        <div className="pt-8 border-t border-slate-200 print-signatures">
          <div className="grid grid-cols-2 gap-16 text-center">
            {/* FIRMA PACIENTE */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-56 flex items-center justify-center border-b border-slate-300">
                {doc.patientSignature ? (
                  <img
                    src={doc.patientSignature}
                    alt="Firma Paciente"
                    className="max-h-14 max-w-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">
                    Pendiente de firma digital
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2 uppercase">
                {patientFullName}
              </p>
              <p className="text-[10px] text-slate-500">C.I.: {patientDocId || "S/N"}</p>
              <p className="text-[9px] text-slate-400 font-medium">
                Firma del Paciente / Tutor Legal
              </p>
            </div>

            {/* FIRMA PROFESIONAL */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-56 flex items-center justify-center border-b border-slate-300">
                {doc.doctorSignature ? (
                  <img
                    src={doc.doctorSignature}
                    alt="Firma Doctor"
                    className="max-h-14 max-w-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">
                    Pendiente de firma digital
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2 uppercase">
                {doctorName}
              </p>
              <p className="text-[10px] text-slate-500">{doctorSpecialtyFinal}</p>
              <p className="text-[9px] text-slate-400 font-medium">
                Firma y Sello Odontológico
              </p>
            </div>
          </div>

          <div className="text-center mt-6 text-[9px] text-slate-400">
            Documento emitido electrónicamente por el Sistema Clínico {clinicInfo.name}. Registrado bajo estándares de auditoría médica. Válido sin tachaduras ni enmendaduras.
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #clinical-doc-printable,
          #clinical-doc-printable * {
            visibility: visible !important;
          }
          #clinical-doc-printable {
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