"use client"

import React, { useState, useRef } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Eye, Printer } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useClinicSettings } from "@/config/clinic-settings"
import { appointmentStatuses } from "@/constants/status"

export interface PrintAgendaModalProps {
  isOpen?: boolean
  onClose?: () => void
  date?: Date | null
  appointments?: any[]
  citas?: any[]
  doctors?: any[]
  trigger?: React.ReactNode
}

const formatReason = (reason?: string) => {
  if (!reason) return "Consulta General"
  switch (reason) {
    case "PATIENT_REQUEST": return "Solicitud del Paciente"
    case "DOCTOR_UNAVAILABILITY": return "Ausencia Médica"
    case "NO_SHOW": return "Reagendamiento por Inasistencia"
    case "CLINIC_SCHEDULE_CHANGE": return "Ajuste de Horario Clínica"
    default: return reason
  }
}

const formatStatus = (status?: string) => {
  if (!status) return { label: "AGENDADA", color: "text-[#008bcd] bg-[#008bcd]/10 border-[#008bcd]/20" }

  const statusConfig = appointmentStatuses[status]
  if (statusConfig?.label) {
    return {
      label: statusConfig.label.toUpperCase(),
      color: "text-[#008bcd] bg-[#008bcd]/10 border-[#008bcd]/20"
    }
  }

  switch (status) {
    case "SCHEDULED": return { label: "AGENDADA", color: "text-[#008bcd] bg-[#008bcd]/10 border-[#008bcd]/20" }
    case "CONFIRMED": return { label: "CONFIRMADA", color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
    case "WAITING": return { label: "EN SALA", color: "text-amber-700 bg-amber-50 border-amber-200" }
    case "IN_PROGRESS": return { label: "EN ATENCIÓN", color: "text-indigo-700 bg-indigo-50 border-indigo-200" }
    case "COMPLETED": return { label: "COMPLETADA", color: "text-teal-700 bg-teal-50 border-teal-200" }
    case "NO_SHOW": return { label: "NO ASISTIÓ", color: "text-rose-700 bg-rose-50 border-rose-200" }
    case "CANCELLED": return { label: "CANCELADA", color: "text-slate-600 bg-slate-100 border-slate-200" }
    default: return { label: status.toUpperCase(), color: "text-[#008bcd] bg-[#008bcd]/10 border-[#008bcd]/20" }
  }
}

export function PrintAgendaModal({
  isOpen: controlledIsOpen,
  onClose,
  date,
  appointments = [],
  citas = [],
  trigger,
}: PrintAgendaModalProps) {
  const { settings } = useClinicSettings()
  const { data: session } = useSession()
  const printSheetRef = useRef<HTMLDivElement>(null)

  const currentUser = session?.user as any
  const doctorAccentColor = currentUser?.calendarColor || "#008bcd"
  const clinicBrandColor = (settings as any)?.primaryColor || "#008bcd"

  const [internalOpen, setInternalOpen] = useState(false)
  const [isTriggerHovered, setIsTriggerHovered] = useState(false)

  const isControlled = controlledIsOpen !== undefined
  const open = isControlled ? controlledIsOpen : internalOpen

  const setOpen = (value: boolean) => {
    if (isControlled) {
      if (!value && onClose) onClose()
    } else {
      setInternalOpen(value)
    }
  }

  const rawList = appointments.length > 0 ? appointments : citas
  const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date()
  const filteredAppointments = rawList.filter((cita: any) => cita.status !== "CANCELLED")

 const handlePrint = () => {
    if (!printSheetRef.current) return

    const printFrame = document.createElement("iframe")
    printFrame.style.position = "fixed"
    printFrame.style.right = "0"
    printFrame.style.bottom = "0"
    printFrame.style.width = "0"
    printFrame.style.height = "0"
    printFrame.style.border = "0"
    document.body.appendChild(printFrame)

    const frameDoc = printFrame.contentWindow?.document
    if (!frameDoc) return

    const styleTags = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((tag) => tag.outerHTML)
      .join("")

    frameDoc.open()
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Agenda - ${format(validDate, "dd-MM-yyyy")}</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
            }
            html {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              /* Margen físico perimetral exacto en A4 */
              padding: 13mm 15mm 13mm 15mm !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Ocupa toda la altura útil de la hoja A4 para centrar la marca de agua y anclar la firma */
            #printable-agenda-sheet {
              border: none !important;
              box-shadow: none !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: calc(297mm - 26mm) !important;
              padding: 0 !important;
              margin: 0 !important;
              position: relative !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              background: transparent !important;
            }
            /* Marca de agua centrada en toda la hoja */
            .watermark-container {
              position: absolute !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              width: 100% !important;
              height: 100% !important;
              pointer-events: none !important;
              z-index: 0 !important;
            }
            thead {
              display: table-header-group !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .print-footer-block {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-top: auto !important;
              padding-top: 16px !important;
            }
          </style>
        </head>
        <body>
          ${printSheetRef.current.outerHTML}
        </body>
      </html>
    `)
    frameDoc.close()

    printFrame.contentWindow?.focus()
    setTimeout(() => {
      printFrame.contentWindow?.print()
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame)
        }
      }, 500)
    }, 300)
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            onMouseEnter={() => setIsTriggerHovered(true)}
            onMouseLeave={() => setIsTriggerHovered(false)}
            style={{
              color: isTriggerHovered ? doctorAccentColor : undefined,
              backgroundColor: isTriggerHovered ? `${doctorAccentColor}15` : undefined,
              borderColor: isTriggerHovered ? `${doctorAccentColor}40` : undefined,
            }}
            className="flex-1 md:flex-none bg-transparent border border-border/80 text-foreground font-bold text-sm h-11 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-none group"
          >
            <Printer 
              className="h-5 w-5 mr-2 text-muted-foreground transition-colors" 
              style={{ color: isTriggerHovered ? doctorAccentColor : undefined }}
            />
            <span>Imprimir</span>
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-[1000px] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border/80">
        
        {/* CABECERA MODAL (INTERFAZ EN PANTALLA) */}
        <div className="px-6 py-4 border-b border-border/70 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl border transition-colors"
              style={{
                backgroundColor: `${doctorAccentColor}18`,
                borderColor: `${doctorAccentColor}35`,
                color: doctorAccentColor,
              }}
            >
              <Eye className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground">
                Visualización y Exportación de Agenda
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Vista previa con el formato institucional configurado.
              </p>
            </div>
          </div>
        </div>

        {/* CONTENEDOR VISUALIZADOR CON SCROLL SUTIL */}
        <div className="flex-1 bg-muted/40 p-4 sm:p-6 overflow-y-auto flex justify-center [scrollbar-width:thin]">
          
          <div
            ref={printSheetRef}
            id="printable-agenda-sheet"
            style={{
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
            className="w-full max-w-[800px] bg-white text-black p-8 rounded-lg shadow-sm border border-neutral-200 relative flex flex-col justify-between"
          >
            {/* MARCA DE AGUA */}
            {settings?.watermarkUrl && (
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
                style={{ opacity: ((settings as any)?.watermarkOpacity ?? 12) / 100 }}
              >
                <img
                  src={settings.watermarkUrl}
                  alt="Watermark"
                  style={{ transform: `scale(${((settings as any)?.watermarkScale || 100) / 100})` }}
                  className="max-w-[380px] max-h-[380px] object-contain"
                />
              </div>
            )}

            {/* SECCIÓN SUPERIOR */}
            <div className="relative z-10">
              
              {/* CABECERA INSTITUCIONAL */}
              <div 
                className="flex items-center justify-between pb-3 mb-3 border-b-[3px]"
                style={{ borderBottomColor: clinicBrandColor }}
              >
                <div className="flex items-center gap-3.5">
                  {settings?.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      className="h-14 max-w-[140px] object-contain"
                    />
                  ) : (
                    <div 
                      className="font-black text-xl tracking-tight"
                      style={{ color: clinicBrandColor }}
                    >
                      {settings?.clinicName || "Carmo Dental"}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <h1 
                      className="text-lg font-black tracking-tight uppercase leading-tight"
                      style={{ color: clinicBrandColor }}
                    >
                      {settings?.clinicName || "Carmo Dental"}
                    </h1>
                    <p className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                      {settings?.slogan || "Clínica Odontológica"}
                    </p>
                    <p className="text-[10px] text-neutral-600 font-medium">
                      RUC: {settings?.ruc || "1700000083134"} | {settings?.address || "Solanda, Av Jose Argudo"}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <div className="px-3 py-1 rounded-lg border border-neutral-200 bg-white shadow-xs">
                    <span className="text-[10px] font-black tracking-wide text-neutral-800 uppercase">
                      AGENDA DIARIA
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-600 font-medium">
                    Emisión: <strong className="text-neutral-900 font-bold">{format(validDate, "d 'de' MMMM yyyy", { locale: es })}</strong>
                  </p>
                </div>
              </div>

              {/* TABLA DE CITAS */}
              <table className="w-full text-left border-collapse text-xs mt-1">
                <thead>
                  <tr className="border-b-2 border-neutral-900 uppercase text-[9.5px] font-black tracking-wider bg-slate-50 text-slate-800">
                    <th className="py-2 px-1.5 w-6 text-center">✓</th>
                    <th className="py-2 px-2 w-20">Horario</th>
                    <th className="py-2 px-2">Paciente / Contacto</th>
                    <th className="py-2 px-2">Especialista / Box</th>
                    <th className="py-2 px-2">Motivo / Estado</th>
                    <th className="py-2 px-2 w-28">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400 italic text-[11px]">
                        No hay citas programadas para esta fecha.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((cita: any) => {
                      const statusObj = formatStatus(cita.status)
                      return (
                        <tr key={cita.id} className="hover:bg-neutral-50/50">
                          <td className="py-2 px-1.5 text-center align-top">
                            <div className="w-3.5 h-3.5 border border-neutral-400 rounded-sm mx-auto" />
                          </td>
                          <td className="py-2 px-2 font-mono font-bold text-neutral-800 align-top">
                            {cita.startTime}
                            <span className="block text-[9.5px] text-neutral-500 font-normal">
                              a {cita.endTime}
                            </span>
                          </td>
                          <td className="py-2 px-2 align-top">
                            <p className="font-bold text-neutral-900 leading-tight">
                              {cita.patient?.firstName || cita.patientName} {cita.patient?.lastName || ""}
                            </p>
                            <p className="text-[9.5px] text-neutral-500 font-mono mt-0.5">
                              CI: {cita.patient?.ci || cita.patientCi || "-"} • Tel: {cita.patient?.phone || cita.patientPhone || "-"}
                            </p>
                          </td>
                          <td className="py-2 px-2 align-top">
                            <p className="font-semibold text-neutral-800">{cita.doctor?.name || cita.doctorName || "Dr. Asignado"}</p>
                            <span className="inline-block mt-0.5 px-1 py-0.2 rounded border text-[8.5px] font-bold bg-neutral-50 border-neutral-300">
                              {cita.box || "Box 1"}
                            </span>
                          </td>
                          <td className="py-2 px-2 align-top">
                            <p className="font-semibold text-neutral-800 leading-snug">
                              {formatReason(cita.reason)}
                            </p>
                            <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase tracking-wider border ${statusObj.color}`}>
                              {statusObj.label}
                            </span>
                          </td>
                          <td className="py-2 px-2 align-top">
                            <div className="space-y-1 pt-1">
                              <div className="border-b border-dashed border-neutral-300 w-full h-2" />
                              <div className="border-b border-dashed border-neutral-300 w-full h-2" />
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>

            </div>

            {/* SECCIÓN INFERIOR: FIRMA Y RESUMEN (PROTEGIDO CONTRA RUPTURAS DE PÁGINA) */}
            <div className="relative z-10 pt-3 mt-6 border-t border-neutral-200 print-footer-block">
              <div className="flex items-end justify-between">
                <div className="text-center w-44">
                  <div className="border-b border-neutral-800 w-full mb-1" />
                  <p className="text-[9px] font-bold text-neutral-800 uppercase tracking-wider">
                    Firma del Encargado
                  </p>
                </div>

                <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-right">
                  <p className="text-[8.5px] font-bold text-neutral-500 uppercase">Resumen Operativo</p>
                  <p className="text-xs font-black text-neutral-900 mt-0.5">
                    Total Pacientes: {filteredAppointments.length}
                  </p>
                </div>
              </div>

              <p className="text-[8px] text-center text-neutral-400 mt-3 leading-tight uppercase font-medium">
                {settings?.footerText || "DOCUMENTO DE USO INTERNO EXCLUSIVO. CONTIENE INFORMACIÓN MÉDICA CONFIDENCIAL."}
              </p>
            </div>

          </div>
        </div>

        {/* PIE DEL MODAL */}
        <DialogFooter className="px-6 py-3 border-t border-border/70 bg-card sm:justify-between shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold cursor-pointer">
            Cerrar
          </Button>
          <Button 
            onClick={handlePrint} 
            style={{
              backgroundColor: doctorAccentColor,
              boxShadow: `0 8px 16px -4px ${doctorAccentColor}40`,
            }}
            className="text-white rounded-xl text-xs font-bold px-6 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4 mr-2" /> Imprimir Documento
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}

export { PrintAgendaModal as PrintPreviewModal }