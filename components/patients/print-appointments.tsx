"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Eye, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useClinicSettings } from "@/config/clinic-settings"
import { appointmentStatuses, getReasonLabel } from "@/constants/status"

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
  const clinicName = settings?.clinicName?.trim() || "CLÍNICA ODONTOLÓGICA"
  const clinicSlogan = settings?.slogan?.trim() || "CENTRO DE ESPECIALIDADES MÉDICAS Y DENTALES"
  const doctorHolder = settings?.razonSocial?.trim() || "Dr. Especialista Asignado"
  const clinicRuc = settings?.ruc?.trim() || "1790000000001"
  const clinicAddress = settings?.address?.trim() || "AV. PRINCIPAL 123 Y CALLE SECUNDARIA"
  const clinicPhone = settings?.phone?.trim() || settings?.whatsappNumber?.trim() || "(+593) 99 999 9999"
  const clinicEmail = settings?.email?.trim() || "contacto@clinicadental.com"

  const handlePrint = () => {
    window.print()
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

      <DialogContent className="sm:max-w-[1000px] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border/80 print:p-0 print:border-0 print:h-auto print:max-w-none">
        
        {/* Cabecera del Modal (No Imprimible) */}
        <div className="px-6 py-4 border-b border-border/70 flex items-center justify-between bg-card shrink-0 print:hidden">
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

        {/* Hoja de Reporte Imprimible */}
        <div className="flex-1 bg-muted/40 p-6 overflow-y-auto flex justify-center print:bg-white print:p-0 print:overflow-visible">
          <div
            id="printable-patient-history"
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
            className="w-full max-w-[800px] min-h-[960px] bg-white text-black p-8 sm:p-10 rounded-lg shadow-sm border border-neutral-200 relative flex flex-col justify-between"
          >
            {/* Marca de Agua Institucional */}
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
              
              {/* CABECERA INSTITUCIONAL */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b-[3px] border-[#008bcd]">
                
                {/* Lado Izquierdo: Logotipo o Icono de Respaldo + Nombre Clínica + Eslogan */}
                <div className="flex items-center gap-3.5">
                  {settings?.logoUrl ? (
                    <img 
                      src={settings.logoUrl} 
                      alt="Logo" 
                      className="h-14 max-w-[150px] object-contain" 
                    />
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

                {/* Lado Derecho: Titular Profesional + RUC */}
                <div className="text-right">
                  <h3 className="text-sm font-black text-neutral-900 tracking-tight leading-snug">
                    {doctorHolder}
                  </h3>
                  <p className="text-xs font-bold text-neutral-700 font-mono tracking-tight mt-0.5">
                    RUC: {clinicRuc}
                  </p>
                </div>

              </div>

              {/* Ficha Resumen del Paciente & Fecha de Emisión */}
              <div className="mb-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-800">
                <div className="flex items-center gap-4 flex-wrap">
                  {patientData && (
                    <>
                      <div>
                        <span className="text-neutral-500 font-medium">Paciente:</span>{" "}
                        <strong className="font-bold text-neutral-900">{patientData.firstName} {patientData.lastName}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-500 font-medium">CI / Doc:</span>{" "}
                        <strong className="font-mono text-neutral-900">{patientData.ci || "Sin documento"}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-500 font-medium">Teléfono:</span>{" "}
                        <strong className="font-mono text-neutral-900">{patientData.phone || "Sin contacto"}</strong>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-right text-[11px] text-neutral-600">
                  <span>Emisión: </span>
                  <strong className="text-neutral-900 font-bold">{format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}</strong>
                </div>
              </div>

              {/* Tabla de Citas */}
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

            {/* PIE DE PÁGINA INSTITUCIONAL */}
            <div className="relative z-10 pt-8 mt-6">
              
              {/* Firma Centrada */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="border-b border-neutral-900 w-48 mb-1.5" />
                <p className="text-[11px] font-black text-neutral-900 tracking-wider uppercase">
                  FIRMA DEL PROFESIONAL
                </p>
              </div>

              {/* Línea Azul Separadora */}
              <div className="w-full h-[3px] bg-[#008bcd] mb-3" />

              {/* Bloque de Ubicación y Contacto */}
              <div className="text-center space-y-1 text-slate-800">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#1e293b]">
                  DIRECCIÓN: {clinicAddress}
                </p>
                <p className="text-[10.5px] font-medium text-neutral-600">
                  Cel.: {clinicPhone} • e-mail: {clinicEmail}
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* Pie del Modal (No Imprimible) */}
        <DialogFooter className="px-6 py-3 border-t border-border/70 bg-card sm:justify-between shrink-0 print:hidden">
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