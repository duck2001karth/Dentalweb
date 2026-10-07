"use client"

import React, { useState } from "react"
import { format, differenceInYears } from "date-fns"
import { es } from "date-fns/locale"
import { Eye, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useClinicSettings } from "@/config/clinic-settings"
import { appointmentStatuses, getReasonLabel } from "@/constants/status"
import { executePrintEngine } from "@/lib/print-engine"
import { escapeHTML } from "@/lib/sanitize"

export interface PrintPatientAppointmentsModalProps {
  patient?: any
  appointments: any[]
  trigger?: React.ReactNode
}

export function PrintPatientAppointmentsModal({
  patient,
  appointments = [],
  trigger,
}: PrintPatientAppointmentsModalProps) {
  const { settings } = useClinicSettings()
  const [open, setOpen] = useState(false)

  const activeAppointments = appointments.filter((c: any) => c.status !== "CANCELLED")
  const patientData = patient || activeAppointments[0]?.patient

  const clinicName = settings?.clinicName?.trim() || "CARMO DENTAL"
  const clinicSlogan = settings?.slogan?.trim() || "CLÍNICA DE ESPECIALIDADES ODONTOLÓGICAS"
  const doctorHolder = settings?.razonSocial?.trim() || "Dr. Especialista Asignado"
  const clinicRuc = settings?.ruc?.trim() || ""
  const clinicAddress = settings?.address?.trim() || "Solanda, Av Jose Argudo, Quito, Ecuador"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "(+593) 99 999 9999"
  const clinicEmail = settings?.email?.trim() || "contacto@clinicadental.com"

  const edad = patientData?.birthDate ? differenceInYears(new Date(), new Date(patientData.birthDate)) : "-"

  const buildAppointmentsTableHtml = () => {
    const rows = activeAppointments.length === 0
      ? `<tr><td colspan="6" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">No hay citas registradas en el historial.</td></tr>`
      : activeAppointments.map((cita: any, index: number) => {
          const numTrat = (activeAppointments.length - index).toString().padStart(2, "0")
          const docName = escapeHTML(cita.doctor?.name || cita.doctorName || "Dr. Asignado")
          const dateStr = format(new Date(cita.date), "dd/MM/yyyy")
          const timeStr = `${cita.startTime || "09:00"} - ${cita.endTime || "10:00"}`
          const boxStr = escapeHTML(cita.box || "Box 1")
          const reasonStr = escapeHTML(getReasonLabel(cita.reason) || "Consulta General")
          const statusCfg = appointmentStatuses[cita.status] || { label: cita.status }

          return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 9px 8px; font-family: monospace; font-weight: 700; color: #0f172a;">${numTrat}</td>
              <td style="padding: 9px 8px; font-weight: 600; color: #1e293b;">${docName}</td>
              <td style="padding: 9px 8px; color: #334155;">
                <div>${dateStr}</div>
                <span style="font-size: 9.5px; color: #64748b; font-family: monospace;">${timeStr}</span>
              </td>
              <td style="padding: 9px 8px; color: #475569;">
                <span style="padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 9px; font-weight: 700; background: #f8fafc;">${boxStr}</span>
              </td>
              <td style="padding: 9px 8px; color: #1e293b;">${reasonStr}</td>
              <td style="padding: 9px 8px; text-align: center;">
                <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 8.5px; font-weight: 800; text-transform: uppercase;">${escapeHTML(statusCfg.label)}</span>
              </td>
            </tr>
          `
        }).join("")

    return `
      <div style="font-size: 11px; font-weight: 900; color: #008bcd; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
        Historial Cronológico de Citas
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; margin-bottom: 20px;">
        <thead>
          <tr style="border-bottom: 2px solid #0f172a; text-transform: uppercase; font-size: 9px; font-weight: 900; background: #f8fafc; color: #1e293b;">
            <th style="padding: 8px;"># Trat.</th>
            <th style="padding: 8px;">Doctor Asignado</th>
            <th style="padding: 8px;">Fecha y Hora</th>
            <th style="padding: 8px;">Box</th>
            <th style="padding: 8px;">Motivo / Tratamiento</th>
            <th style="padding: 8px; text-align: center;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `
  }

  const handlePrint = () => {
    executePrintEngine({
      title: "Historial de Citas",
      documentTypeBadge: "AGENDA HISTÓRICA",
      patient: patientData,
      settings,
      bodyHtml: buildAppointmentsTableHtml(),
      doctorName: doctorHolder,
    })
  }

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
            <Eye className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-[#008bcd] transition-colors" />
            <span>Visualizar Historial</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[1000px] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border/80">
        <div className="px-6 py-4 border-b border-border/70 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#008bcd]/10 text-[#008bcd] border border-[#008bcd]/20">
              <Eye className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground">
                Visualización y Exportación de Historial
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Formato institucional oficial para impresión y exportación en PDF.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-muted/40 p-6 overflow-y-auto flex justify-center">
          <div
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
            className="w-full max-w-[800px] min-h-[960px] bg-white text-black p-8 sm:p-10 rounded-lg shadow-sm border border-neutral-200 relative flex flex-col justify-between"
          >
            {settings?.watermarkUrl && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
                style={{ opacity: ((settings as any)?.watermarkOpacity ?? 14) / 100 }}
              >
                <img
                  src={settings.watermarkUrl}
                  alt="Watermark"
                  style={{ transform: `scale(${((settings as any)?.watermarkScale || 100) / 100})` }}
                  className="max-w-[460px] max-h-[460px] object-contain"
                />
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
                    <h1 className="text-2xl font-black text-[#008bcd] tracking-tight uppercase leading-none">
                      {clinicName}
                    </h1>
                    <p className="text-[11px] font-black uppercase text-[#1e293b] tracking-wider">
                      {clinicSlogan}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-black text-neutral-900 tracking-tight leading-snug">
                    {doctorHolder}
                  </h3>
                  {clinicRuc && (
                    <p className="text-xs font-bold text-neutral-700 font-mono tracking-tight mt-0.5">
                      RUC: {clinicRuc}
                    </p>
                  )}
                  <div className="mt-1 text-[11px] text-neutral-500 font-medium">
                    Emisión: <strong className="text-neutral-800 font-bold">{format(new Date(), "dd/MM/yyyy")}</strong>
                  </div>
                </div>
              </div>

              {/* TARJETA DEL PACIENTE REDISEÑADA */}
              <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    PACIENTE
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900 capitalize">
                    {patientData?.firstName} {patientData?.lastName}
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    C.I. / Doc.: <strong className="font-mono text-slate-800 font-bold">{patientData?.ci || "--"}</strong>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 font-medium">Edad:</span>{" "}
                      <strong className="text-slate-800 font-bold">{edad} años</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Teléfono:</span>{" "}
                      <strong className="font-mono text-slate-800 font-bold">{patientData?.phone || "--"}</strong>
                    </div>
                  </div>
                  {patientData?.medicalAlerts && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                      <span>⚠️ Alerta:</span> <span>{patientData.medicalAlerts}</span>
                    </div>
                  )}
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-neutral-900 uppercase text-[10px] font-black tracking-wider bg-slate-50 text-slate-800">
                    <th className="py-2.5 px-2 w-14"># Trat.</th>
                    <th className="py-2.5 px-2">Doctor Asignado</th>
                    <th className="py-2.5 px-2">Fecha y Hora</th>
                    <th className="py-2.5 px-2">Box</th>
                    <th className="py-2.5 px-2">Motivo / Tratamiento</th>
                    <th className="py-2.5 px-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {activeAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-400 italic">
                        No hay citas registradas en el historial.
                      </td>
                    </tr>
                  ) : (
                    activeAppointments.map((cita: any, index: number) => {
                      const statusConfig = appointmentStatuses[cita.status] || {
                        label: cita.status,
                        badgeColor: "text-slate-600 bg-slate-100 border-slate-200",
                      }
                      return (
                        <tr key={cita.id} className="hover:bg-neutral-50/50">
                          <td className="py-2.5 px-2 font-mono font-bold text-neutral-900">
                            {(activeAppointments.length - index).toString().padStart(2, "0")}
                          </td>
                          <td className="py-2.5 px-2 font-semibold text-neutral-800">
                            {cita.doctor?.name || cita.doctorName || "Dr. Asignado"}
                          </td>
                          <td className="py-2.5 px-2 font-medium text-neutral-700">
                            <div>{format(new Date(cita.date), "dd/MM/yyyy")}</div>
                            <span className="text-[10px] text-neutral-500 font-mono">{cita.startTime} - {cita.endTime}</span>
                          </td>
                          <td className="py-2.5 px-2 font-medium text-neutral-600">
                            <span className="px-1.5 py-0.5 rounded border text-[9px] font-bold bg-neutral-50 border-neutral-300">
                              {cita.box || "Box 1"}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-medium text-neutral-800">
                            {getReasonLabel(cita.reason)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${statusConfig.badgeColor}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PIE INSTITUCIONAL CON FRANJA AZUL ASEGURADA */}
            <div className="relative z-10 pt-8 mt-6">
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="border-b-[1.5px] border-neutral-900 w-48 mb-1.5" />
                <p className="text-[10px] font-black text-neutral-900 tracking-wider uppercase">
                  FIRMA DEL PROFESIONAL
                </p>
              </div>
              <div className="w-full border-b-[3.5px] border-[#008bcd] mb-3" />
              <div className="text-center space-y-1 text-slate-800">
                <p className="text-[10.5px] font-black uppercase tracking-wider text-[#1e293b]">
                  DIRECCIÓN: {clinicAddress}
                </p>
                <p className="text-[10px] font-medium text-neutral-600">
                  Cel.: {clinicPhone} &nbsp;•&nbsp; e-mail: {clinicEmail}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border/70 bg-card sm:justify-between shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold cursor-pointer">
            Cerrar
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-[#008bcd] hover:bg-[#007bb6] text-white rounded-xl text-xs font-bold px-6 shadow-md shadow-[#008bcd]/20 cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-2" /> Imprimir Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}