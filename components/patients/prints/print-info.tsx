"use client"

import React, { useState } from "react"
import { format, differenceInYears } from "date-fns"
import { Eye, Printer, ShieldAlert, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useClinicSettings } from "@/config/clinic-settings"
import { executePrintEngine } from "@/lib/print-engine"
import { escapeHTML } from "@/lib/sanitize"

export interface PrintPatientInfoModalProps {
  patient: any
  trigger?: React.ReactNode
}

export function PrintPatientInfoModal({ patient, trigger }: PrintPatientInfoModalProps) {
  const { settings } = useClinicSettings()
  const [open, setOpen] = useState(false)

  const clinicName = settings?.clinicName?.trim() || "CARMO DENTAL"
  const clinicSlogan = settings?.slogan?.trim() || "CLÍNICA DE ESPECIALIDADES ODONTOLÓGICAS"
  const doctorHolder = settings?.razonSocial?.trim() || "Dr. Especialista Asignado"
  const clinicRuc = settings?.ruc?.trim() || ""
  const clinicAddress = settings?.address?.trim() || "Solanda, Av Jose Argudo, Quito, Ecuador"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "(+593) 99 999 9999"
  const clinicEmail = settings?.email?.trim() || "contacto@clinicadental.com"

  const edad = patient?.birthDate ? differenceInYears(new Date(), new Date(patient.birthDate)) : "-"
  const formattedBirthDate = patient?.birthDate ? format(new Date(patient.birthDate), "dd/MM/yyyy") : "-"

  const buildInfoBodyHtml = () => {
    const row = (label: string, value: any) => `
      <div style="display: flex; border-bottom: 1px solid #e2e8f0; padding: 4px 0;">
        <div style="width: 40%; font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">${escapeHTML(label)}</div>
        <div style="width: 60%; font-size: 11px; font-weight: 700; color: #0f172a;">${escapeHTML(value || "-")}</div>
      </div>
    `

    return `
      ${patient?.medicalAlerts ? `
        <div style="margin-bottom: 14px; padding: 8px 12px; border: 1px solid #fecdd3; background: #fff1f2; border-radius: 8px; color: #e11d48; font-size: 11px; font-weight: 700;">
          ⚠️ ALERTA MÉDICA: ${escapeHTML(patient.medicalAlerts)}
        </div>
      ` : ""}

      <div style="display: grid; grid-template-columns: 1fr 1fr; column-gap: 24px; row-gap: 16px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 10px; font-weight: 900; color: #008bcd; text-transform: uppercase; border-bottom: 1px solid #008bcd; padding-bottom: 3px; margin-bottom: 6px;">
            1. Información Personal
          </div>
          ${row("Fecha Nacimiento", `${formattedBirthDate} (${edad} años)`)}
          ${row("Sexo", patient?.sexo)}
          ${row("Estado Civil", patient?.estadoCivil)}
          ${row("Profesión", patient?.profesion)}
          ${row("Nivel Educativo", patient?.nivelEducativo)}

          <div style="font-size: 10px; font-weight: 900; color: #008bcd; text-transform: uppercase; border-bottom: 1px solid #008bcd; padding-bottom: 3px; margin-top: 14px; margin-bottom: 6px;">
            2. Contacto y Ubicación
          </div>
          ${row("Celular", patient?.phone)}
          ${row("Teléfono Fijo", patient?.telefonoFijo)}
          ${row("Email", patient?.email)}
          ${row("Ciudad / Prov.", `${patient?.ciudad || ""} ${patient?.departamento ? `/ ${patient.departamento}` : ""}`)}
          ${row("Dirección", patient?.address)}
        </div>

        <div>
          <div style="font-size: 10px; font-weight: 900; color: #008bcd; text-transform: uppercase; border-bottom: 1px solid #008bcd; padding-bottom: 3px; margin-bottom: 6px;">
            3. Datos de Salud y Seguro
          </div>
          ${row("EPS / Seguro", patient?.eps)}
          ${row("Tipo Paciente", patient?.tipoPaciente)}
          ${row("Convenio", patient?.convenio)}
          ${row("Grupo Sanguíneo", patient?.grupoSanguineo)}

          <div style="font-size: 10px; font-weight: 900; color: #008bcd; text-transform: uppercase; border-bottom: 1px solid #008bcd; padding-bottom: 3px; margin-top: 14px; margin-bottom: 6px;">
            4. Acompañante / Emergencia
          </div>
          ${row("Nombre Acudiente", patient?.nombreAcompanante)}
          ${row("Cédula Acudiente", patient?.cedulaAcudiente)}
          ${row("Teléfono Acudiente", patient?.telefonoAcompanante)}

          <div style="font-size: 10px; font-weight: 900; color: #008bcd; text-transform: uppercase; border-bottom: 1px solid #008bcd; padding-bottom: 3px; margin-top: 14px; margin-bottom: 6px;">
            5. Observaciones
          </div>
          <div style="font-size: 10.5px; color: #334155; line-height: 1.4; padding-top: 4px; white-space: pre-wrap;">
            ${escapeHTML(patient?.observaciones || "Sin observaciones adicionales.")}
          </div>
        </div>
      </div>
    `
  }

  const handlePrint = () => {
    executePrintEngine({
      title: "Expediente Clínico",
      documentTypeBadge: "FICHA CLÍNICA",
      patient,
      settings,
      bodyHtml: buildInfoBodyHtml(),
      doctorName: doctorHolder,
      showSignature: false, 
    })
  }

  const PrintRow = ({ label, value }: { label: string; value: any }) => (
    <div className="flex border-b border-neutral-200 py-1.5">
      <div className="w-2/5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{label}</div>
      <div className="w-3/5 text-[11px] font-semibold text-neutral-900">{value || "-"}</div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="flex-1 md:flex-none bg-transparent border border-border/80 text-foreground hover:text-[#008bcd] hover:bg-[#008bcd]/10 hover:border-[#008bcd]/30 font-bold text-sm h-10 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-none group"
          >
            <Printer className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-[#008bcd] transition-colors" />
            <span>Imprimir Ficha</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[850px] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border/80">
        <div className="px-6 py-4 border-b border-border/70 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#008bcd]/10 text-[#008bcd] border border-[#008bcd]/20">
              <Eye className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground">
                Visualización de Ficha Clínica
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Documento de expediente para uso interno de la clínica.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-muted/40 p-6 overflow-y-auto flex justify-center">
          <div
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
            className="w-full max-w-[750px] min-h-[960px] bg-white text-black p-8 sm:p-10 rounded-lg shadow-sm border border-neutral-200 relative flex flex-col justify-between"
          >
            {settings?.watermarkUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden" style={{ opacity: ((settings as any)?.watermarkOpacity ?? 14) / 100 }}>
                <img src={settings.watermarkUrl} alt="Watermark" style={{ transform: `scale(${((settings as any)?.watermarkScale || 100) / 100})` }} className="max-w-[460px] max-h-[460px] object-contain" />
              </div>
            )}
            <div className="relative z-10">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b-[3px] border-[#008bcd]">
                <div className="flex items-center gap-3.5">
                  {settings?.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="h-14 max-w-[150px] object-contain" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-[#008bcd]/10 border border-[#008bcd]/30 flex items-center justify-center text-[#008bcd] font-black text-xl">
                      {clinicName.charAt(0)}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <h1 className="text-2xl font-black text-[#008bcd] tracking-tight uppercase leading-none">{clinicName}</h1>
                    <p className="text-[11px] font-black uppercase text-[#1e293b] tracking-wider">{clinicSlogan}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-black text-neutral-900 tracking-tight leading-snug">{doctorHolder}</h3>
                  {clinicRuc && <p className="text-xs font-bold text-neutral-700 font-mono tracking-tight mt-0.5">RUC: {clinicRuc}</p>}
                  <div className="mt-1 text-[11px] text-neutral-500 font-medium">
                    Emisión: <strong className="text-neutral-800 font-bold">{format(new Date(), "dd/MM/yyyy")}</strong>
                  </div>
                </div>
              </div>

              {/* TARJETA DEL PACIENTE CON FOTO Y FORMATO REFORZADO */}
              <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#008bcd] shrink-0 bg-neutral-200 flex items-center justify-center shadow-xs">
                    {patient?.photoUrl ? (
                      <img src={patient.photoUrl} alt={patient?.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#008bcd] text-white flex items-center justify-center font-black text-lg uppercase">
                        {patient?.firstName ? patient.firstName.charAt(0) : <User className="w-6 h-6" />}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#008bcd] bg-[#008bcd]/10 px-2 py-0.5 rounded">
                      EXPEDIENTE CLÍNICO
                    </span>
                    <h2 className="text-base font-black text-neutral-900 uppercase mt-0.5">
                      {patient?.firstName} {patient?.lastName}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      C.I. / Doc.: <strong className="font-mono text-slate-800 font-bold">{patient?.ci || "--"}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 text-right">
                  <div className="text-xs text-slate-600">
                    <span className="text-slate-400 font-medium">Edad:</span>{" "}
                    <strong className="text-slate-800 font-bold">{edad} años</strong>
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="text-slate-400 font-medium">Teléfono:</span>{" "}
                    <strong className="font-mono text-slate-800 font-bold">{patient?.phone || "--"}</strong>
                  </div>
                </div>
              </div>

              {patient?.medicalAlerts && (
                <div className="mb-4 p-2.5 border border-rose-400 bg-rose-50 rounded-lg flex gap-2.5 items-start">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider">Alerta Médica:</span>
                    <p className="text-[11px] font-bold text-rose-900 leading-tight mt-0.5">{patient.medicalAlerts}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <h4 className="text-[11px] font-black text-[#008bcd] uppercase tracking-wider mb-1.5 border-b border-[#008bcd]/30 pb-0.5">
                    1. Información Personal
                  </h4>
                  <PrintRow label="Fecha Nacimiento" value={`${formattedBirthDate} (${edad} años)`} />
                  <PrintRow label="Sexo" value={patient?.sexo} />
                  <PrintRow label="Estado Civil" value={patient?.estadoCivil} />
                  <PrintRow label="Profesión" value={patient?.profesion} />
                  <PrintRow label="Nivel Educativo" value={patient?.nivelEducativo} />
                  <h4 className="text-[11px] font-black text-[#008bcd] uppercase tracking-wider mt-4 mb-1.5 border-b border-[#008bcd]/30 pb-0.5">
                    2. Contacto y Ubicación
                  </h4>
                  <PrintRow label="Celular" value={patient?.phone} />
                  <PrintRow label="Teléfono Fijo" value={patient?.telefonoFijo} />
                  <PrintRow label="Email" value={patient?.email} />
                  <PrintRow label="Ciudad / Prov." value={`${patient?.ciudad || ""} ${patient?.departamento ? `/ ${patient.departamento}` : ""}`} />
                  <PrintRow label="Dirección" value={patient?.address} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-[#008bcd] uppercase tracking-wider mb-1.5 border-b border-[#008bcd]/30 pb-0.5">
                    3. Datos de Salud y Seguro
                  </h4>
                  <PrintRow label="EPS / Seguro" value={patient?.eps} />
                  <PrintRow label="Tipo Paciente" value={patient?.tipoPaciente} />
                  <PrintRow label="Convenio" value={patient?.convenio} />
                  <PrintRow label="Grupo Sanguíneo" value={patient?.grupoSanguineo} />
                  <h4 className="text-[11px] font-black text-[#008bcd] uppercase tracking-wider mt-4 mb-1.5 border-b border-[#008bcd]/30 pb-0.5">
                    4. Acompañante / Emergencia
                  </h4>
                  <PrintRow label="Nombre Acudiente" value={patient?.nombreAcompanante} />
                  <PrintRow label="Cédula Acudiente" value={patient?.cedulaAcudiente} />
                  <PrintRow label="Teléfono Acudiente" value={patient?.telefonoAcompanante} />
                  <h4 className="text-[11px] font-black text-[#008bcd] uppercase tracking-wider mt-4 mb-1.5 border-b border-[#008bcd]/30 pb-0.5">
                    5. Observaciones
                  </h4>
                  <p className="text-[11px] text-neutral-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {patient?.observaciones || "Sin observaciones adicionales."}
                  </p>
                </div>
              </div>
            </div>

            {/* PIE INSTITUCIONAL */}
            <div className="relative z-10 pt-6 mt-6">
              <div className="w-full border-b-[3.5px] border-[#008bcd] mb-3" />
              <div className="text-center space-y-1 text-slate-800">
                <p className="text-[10.5px] font-black uppercase tracking-wider text-[#1e293b]">DIRECCIÓN: {clinicAddress}</p>
                <p className="text-[10px] font-medium text-neutral-600">Cel.: {clinicPhone} &nbsp;•&nbsp; e-mail: {clinicEmail}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border/70 bg-card sm:justify-between shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold cursor-pointer">
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="bg-primary hover:bg-[#007bb6] text-white rounded-xl text-xs font-bold px-6 shadow-md shadow-[#008bcd]/20 cursor-pointer">
            <Printer className="w-4 h-4 mr-2" /> Imprimir Ficha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}