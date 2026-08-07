"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Printer, FileText, CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface PrintAgendaModalProps {
  date: Date | undefined
  citas: any[] 
}

const translateStatus = (status: string) => {
  switch(status) {
    case "SCHEDULED": return "Agendada";
    case "WAITING": return "En Sala";
    case "IN_PROGRESS": return "En Box";
    case "COMPLETED": return "Atendido";
    default: return status;
  }
}

export function PrintAgendaModal({ date, citas }: PrintAgendaModalProps) {
  const fechaAImprimir = date || new Date()

  const handlePrint = () => {
    window.scrollTo(0, 0)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex-1 md:flex-none bg-transparent border border-border/80 text-foreground hover:text-[#008bcd] hover:bg-[#008bcd]/10 hover:border-[#008bcd]/30 font-bold text-sm h-11 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-none group"
        >
          <Printer className="h-5 w-5 mr-2 text-muted-foreground group-hover:text-[#008bcd] transition-colors" />
          <span>Imprimir</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[900px] bg-muted/30 border-border p-0 overflow-hidden rounded-2xl">
        
        <div className="bg-background px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <div>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#008bcd]" />
              Vista Previa de Impresión
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Revisa el formato antes de mandarlo a la impresora física.</p>
          </div>
          
          <Button 
            className="bg-[#008bcd] hover:bg-[#0070a8] text-white shadow-sm font-bold w-full sm:w-auto mr-8 rounded-xl h-10 px-4" 
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" /> Mandar a Impresora
          </Button>
        </div>

        {/* --- ESTILOS MÁGICOS PARA IMPRESIÓN --- */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { margin: 1cm; size: portrait; }
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body * { visibility: hidden; }
            
            div[role="dialog"] {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              transform: none !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
            }

            .no-print, .no-print * { display: none !important; }

            #area-imprimible, #area-imprimible * { visibility: visible; }
            #area-imprimible {
              position: relative !important;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-row { page-break-inside: avoid; }
          }
        `}} />

        <div className="p-6 overflow-y-auto max-h-[75vh] custom-scrollbar flex justify-center">
           <div id="area-imprimible" className="bg-white p-10 text-black w-full max-w-[210mm] min-h-[297mm] shadow-2xl border border-slate-300 rounded-sm">
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Carmo Dental</h1>
                <h2 className="text-base font-semibold text-slate-500 tracking-widest uppercase mt-1">Hoja de Ruta Clínica</h2>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <CalendarDays className="w-5 h-5 text-slate-700" />
                  <p className="text-lg font-bold text-slate-900 capitalize">
                    {format(fechaAImprimir, "EEEE, d 'de' MMMM", { locale: es })}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  GENERADO: {format(new Date(), "dd/MM/yyyy • HH:mm")}
                </p>
              </div>
            </div>

            {!citas || citas.length === 0 ? (
              <div className="text-center py-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <p className="text-xl text-slate-400 font-bold uppercase tracking-wider">Día Libre / Sin Citas Programadas</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-800 bg-slate-50">
                    <th className="py-3 px-2 font-black text-xs text-slate-700 w-8 text-center">✓</th>
                    <th className="py-3 px-2 font-black text-xs text-slate-700 w-24 uppercase">Horario</th>
                    <th className="py-3 px-2 font-black text-xs text-slate-700 uppercase">Paciente / Contacto</th>
                    <th className="py-3 px-2 font-black text-xs text-slate-700 w-32 uppercase">Especialista / Box</th>
                    <th className="py-3 px-2 font-black text-xs text-slate-700 uppercase">Motivo / Estado</th>
                    <th className="py-3 px-2 font-black text-xs text-slate-700 w-32 uppercase border-l border-slate-200">Notas Adicionales</th>
                  </tr>
                </thead>
                <tbody>
                  {citas.map((cita, index) => (
                    <tr key={cita.id || index} className="border-b border-slate-200 print-row hover:bg-slate-50">
                      
                      <td className="py-4 px-2 text-center align-top">
                        <div className="w-5 h-5 border-2 border-slate-300 rounded-sm mx-auto"></div>
                      </td>
                      
                      <td className="py-4 px-2 align-top">
                        <div className="font-bold text-sm text-slate-900">{cita.startTime}</div>
                        <div className="text-[10px] font-semibold text-slate-500">a {cita.endTime}</div>
                      </td>
                      
                      <td className="py-4 px-2 align-top">
                        <div className="font-bold text-sm text-slate-900 uppercase">
                          {cita.patient?.firstName} {cita.patient?.lastName}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 flex gap-2">
                          <span className="font-semibold text-slate-800">CI:</span> {cita.patient?.ci}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          <span className="font-semibold text-slate-800">Tel:</span> {cita.patient?.phone || "N/A"}
                        </div>
                      </td>
                      
                      <td className="py-4 px-2 align-top">
                        <div className="font-bold text-sm text-slate-800">{cita.doctor?.name || "Dr. Asignado"}</div>
                        <div className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-600">
                          {cita.box || "Box N/A"}
                        </div>
                      </td>
                      
                      <td className="py-4 px-2 align-top">
                        <div className="text-sm font-semibold text-slate-900 line-clamp-2">{cita.reason || "Evaluación General"}</div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {cita.situation && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-bold uppercase text-slate-600 rounded border border-slate-200">
                              {cita.situation}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] font-bold uppercase text-white rounded">
                            {translateStatus(cita.status)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-2 border-l border-slate-200 align-top">
                         <div className="border-b border-dashed border-slate-300 w-full mt-4"></div>
                         <div className="border-b border-dashed border-slate-300 w-full mt-5"></div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Resumen Final en Papel */}
            {citas && citas.length > 0 && (
              <div className="mt-8 flex justify-end">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg w-64">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-2 border-b border-slate-200 pb-2">Resumen del Día</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">Total Pacientes:</span>
                    <span className="text-lg font-black text-slate-900">{citas.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pie de página */}
            <div className="mt-16 pt-6 border-t border-slate-200 text-center flex flex-col items-center">
              <div className="w-48 border-t border-slate-800 pt-2 mb-4">
                <p className="text-xs font-bold text-slate-800 uppercase">Firma del Encargado</p>
              </div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                Documento de uso interno exclusivo de Carmo Dental. <br/> Contiene información clínica confidencial.
              </p>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}