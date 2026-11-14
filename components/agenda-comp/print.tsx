"use client"

import React, { useState, useRef } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Eye, Printer, CalendarDays, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useClinicSettings } from "@/config/clinic-settings"

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

const formatStatus = (status?: string, clinicBrandColor: string = "#008bcd") => {
  switch (status) {
    case "SCHEDULED": 
      return { 
        label: "AGENDADA", 
        hexText: clinicBrandColor, 
        hexBg: `${clinicBrandColor}15`, 
        hexBorder: `${clinicBrandColor}35` 
      }
    case "CONFIRMED": 
      return { 
        label: "CONFIRMADA", 
        hexText: "#047857", 
        hexBg: "#ecfdf5", 
        hexBorder: "#a7f3d0" 
      }
    case "WAITING": 
      return { 
        label: "EN SALA", 
        hexText: "#b45309", 
        hexBg: "#fffbeb", 
        hexBorder: "#fde68a" 
      }
    case "IN_PROGRESS": 
      return { 
        label: "EN ATENCIÓN", 
        hexText: "#4338ca", 
        hexBg: "#eef2ff", 
        hexBorder: "#c7d2fe" 
      }
    case "COMPLETED": 
      return { 
        label: "COMPLETADA", 
        hexText: "#0f766e", 
        hexBg: "#f0fdfa", 
        hexBorder: "#99f6e4" 
      }
    case "NO_SHOW": 
      return { 
        label: "NO ASISTIÓ", 
        hexText: "#be123c", 
        hexBg: "#fff1f2", 
        hexBorder: "#fecdd3" 
      }
    case "CANCELLED": 
      return { 
        label: "CANCELADA", 
        hexText: "#475569", 
        hexBg: "#f1f5f9", 
        hexBorder: "#cbd5e1" 
      }
    default: 
      return { 
        label: (status || "AGENDADA").toUpperCase(), 
        hexText: clinicBrandColor, 
        hexBg: `${clinicBrandColor}15`, 
        hexBorder: `${clinicBrandColor}35` 
      }
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
  const printSheetRef = useRef<HTMLDivElement>(null)

  const clinicBrandColor = (settings as any)?.primaryColor || "#008bcd"

  const [internalOpen, setInternalOpen] = useState(false)

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
  const filteredAppointments = rawList
    .filter((cita: any) => cita.status !== "CANCELLED")
    .slice()
    .sort((a: any, b: any) => String(a.startTime || "").localeCompare(String(b.startTime || "")))

  const handlePrint = () => {
    if (!printSheetRef.current || typeof document === "undefined") return

    // La vista previa contiene datos clínicos: el marco solo vive durante la impresión.
    const frame = document.createElement("iframe")
    frame.setAttribute("title", "Impresión de agenda clínica")
    frame.setAttribute("aria-hidden", "true")
    Object.assign(frame.style, {
      position: "fixed",
      width: "0",
      height: "0",
      right: "0",
      bottom: "0",
      border: "0",
      visibility: "hidden",
    })
    document.body.appendChild(frame)

    const frameWindow = frame.contentWindow
    const frameDocument = frameWindow?.document
    if (!frameWindow || !frameDocument) {
      frame.remove()
      return
    }

    // Reutilizar los estilos ya cargados de Tailwind permite imprimir las clases de la hoja.
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((element) => element.outerHTML)
      .join("\n")

    frameDocument.open()
    frameDocument.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <base href="${document.baseURI.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" />
  <title>Agenda ${format(validDate, "dd-MM-yyyy")}</title>
  ${styles}
  <style>
    @page { size: A4 portrait; margin: 12mm 12mm; }
    *, *::before, *::after { box-sizing: border-box !important; }
    html, body { margin: 0 !important; padding: 0 !important; background: white !important; color: #0f172a !important; }
    body { font-family: Inter, ui-sans-serif, system-ui, sans-serif !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    #printable-agenda-sheet {
      width: 100% !important; max-width: 100% !important;
      background: #fff !important; color: #0f172a !important;
      border: 0 !important; border-radius: 0 !important;
      padding: 0 !important; margin: 0 !important; box-shadow: none !important;
      min-height: 0 !important; display: block !important;
      overflow: visible !important;
    }
    #printable-agenda-sheet table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    #printable-agenda-sheet thead { display: table-header-group; }
    #printable-agenda-sheet tr { page-break-inside: avoid; break-inside: avoid; }
    #printable-agenda-sheet th, #printable-agenda-sheet td { overflow-wrap: anywhere; }
    #printable-agenda-sheet .print-footer-block {
      page-break-inside: avoid; break-inside: avoid;
      margin-top: 20mm !important;
    }
  </style>
</head>
<body>${printSheetRef.current.outerHTML}</body>
</html>`)
    frameDocument.close()

    let cleaned = false
    const cleanup = () => {
      if (cleaned) return
      cleaned = true
      frameWindow.removeEventListener("afterprint", cleanup)
      frame.remove()
    }
    frameWindow.addEventListener("afterprint", cleanup)

    // Aguardar fuentes, CSS e imágenes antes de abrir el diálogo de impresión.
    const ready = async () => {
      const links = Array.from(frameDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      await Promise.all(links.map((link) => new Promise<void>((resolve) => {
        if (link.sheet) { resolve(); return }
        link.addEventListener("load", () => resolve(), { once: true })
        link.addEventListener("error", () => resolve(), { once: true })
      })))
      await Promise.all(Array.from(frameDocument.images).map((img) => {
        if (img.complete) return Promise.resolve()
        return new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true })
          img.addEventListener("error", () => resolve(), { once: true })
        })
      }))
      try { await frameDocument.fonts?.ready } catch { /* Fuente de respaldo disponible */ }
    }

    // Fallback para hojas de estilo que no responden y para navegadores sin afterprint.
    const maxWait = new Promise<void>((resolve) => window.setTimeout(resolve, 1800))
    void Promise.race([ready(), maxWait]).then(() => {
      try {
        frameWindow.focus()
        frameWindow.print()
      } catch {
        cleanup()
      }
    })
    window.setTimeout(cleanup, 60000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button variant="outline" className="h-10 gap-2 rounded-xl border-border bg-card px-4 text-sm font-medium text-foreground shadow-none hover:bg-muted">
            <Printer className="h-4 w-4 text-muted-foreground" />
            Imprimir
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="flex h-[min(90dvh,940px)] w-[calc(100vw-24px)] max-w-[1050px] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-background p-0 font-sans shadow-xl sm:max-w-[1050px]">
        <DialogHeader className="shrink-0 border-b border-border bg-card px-5 py-4 text-left sm:px-6">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60 text-primary">
              <Eye className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                Vista previa de la agenda
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Revisa las citas antes de imprimir el documento institucional.
              </DialogDescription>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{format(validDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}</span>
            <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">{filteredAppointments.length} cita{filteredAppointments.length === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Documento interno</span>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/35 p-3 sm:p-6 [scrollbar-width:thin]">
          <div className="mx-auto w-max min-w-full max-w-fit">
          <div
            ref={printSheetRef}
            id="printable-agenda-sheet"
            style={{
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
            className="relative mx-auto flex min-h-[270mm] w-[210mm] flex-col justify-between border border-neutral-200 bg-white p-[13mm] text-slate-950 shadow-sm"
          >
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

            <div className="relative z-10">
              <div 
                className="flex items-center justify-between gap-4 pb-3 mb-3 border-b-2"
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
                    Fecha: <strong className="text-neutral-900 font-semibold">{format(validDate, "d 'de' MMMM yyyy", { locale: es })}</strong>
                  </p>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs mt-1">
                <thead>
                  <tr className="border-b-2 border-neutral-900 uppercase text-[9.5px] font-black tracking-wider bg-slate-50 text-slate-800">
                    <th className="py-2 px-1.5 w-6 text-center"></th>
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
                      const statusObj = formatStatus(cita.status, clinicBrandColor)
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
                              CI: {cita.patient?.ci || cita.patientCi || "-"} | Tel: {cita.patient?.phone || cita.patientPhone || "-"}
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
                            <span 
                              className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase tracking-wider border"
                              style={{
                                color: statusObj.hexText,
                                backgroundColor: statusObj.hexBg,
                                borderColor: statusObj.hexBorder,
                              }}
                            >
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
                    Total citas: {filteredAppointments.length}
                  </p>
                </div>
              </div>
              <p className="text-[8px] text-center text-neutral-400 mt-3 leading-tight uppercase font-medium">
                {settings?.footerText || "DOCUMENTO DE USO INTERNO EXCLUSIVO. CONTIENE INFORMACIÓN MÉDICA CONFIDENCIAL."}
              </p>
            </div>
          </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t border-border bg-card px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-10 rounded-xl px-5 text-sm font-medium">
            Cerrar
          </Button>
          <Button type="button" onClick={handlePrint} className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Printer className="mr-2 h-4 w-4" /> Imprimir agenda
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}

export { PrintAgendaModal as PrintPreviewModal }