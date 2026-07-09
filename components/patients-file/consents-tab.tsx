"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Loader2, FileText, CheckCircle2, XCircle, Eye, Printer, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function ConsentimientosTab({ patientId }: { patientId: string }) {
  const { toast } = useToast()
  
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinical-documents?patientId=${patientId}`)
      const data = await res.json()
      setDocuments((data || []).filter((d: any) => !d.isVoided))
    } catch (e) { toast({ title: "Error", variant: "destructive" }) } 
    finally { setIsLoading(false) }
  }, [patientId, toast])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5cb85c] w-10 h-10"/></div>

  return (
    <div className="animate-in fade-in pb-20">
      
      <div className="flex justify-between items-center mb-6 bg-card p-4 rounded-xl border border-border shadow-sm">
        <h2 className="text-2xl font-light text-foreground flex items-center gap-2">
          <FileText className="text-[#5cb85c]" size={24}/> Historial de Consentimientos
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">
          Solo lectura (Auditoría Legal)
        </span>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground">
              <tr>
                <th className="p-4 font-bold">#</th>
                <th className="p-4 font-bold">Nombre del Consentimiento</th>
                <th className="p-4 font-bold">Profesional</th>
                <th className="p-4 font-bold">Fecha de Creación</th>
                <th className="p-4 font-bold text-center">Estado de Firmas</th>
                <th className="p-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No existen consentimientos firmados o pendientes.</td></tr>
              ) : (
                documents.map((doc, index) => (
                  <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium text-muted-foreground">{documents.length - index}</td>
                    <td className="p-4 font-bold text-[#008bcd]">{doc.title}</td>
                    <td className="p-4">{doc.specialistName || "No especificado"}</td>
                    <td className="p-4">{format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-center justify-center text-xs">
                        <div className="flex items-center gap-1 w-24 justify-between">
                          <span className="text-muted-foreground">Paciente:</span> 
                          {doc.patientSignature ? <CheckCircle2 size={14} className="text-emerald-500"/> : <XCircle size={14} className="text-red-500"/>}
                        </div>
                        <div className="flex items-center gap-1 w-24 justify-between">
                          <span className="text-muted-foreground">Doctor:</span> 
                          {doc.doctorSignature ? <CheckCircle2 size={14} className="text-emerald-500"/> : <XCircle size={14} className="text-red-500"/>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDoc(doc)} className="bg-background text-[#5cb85c] hover:bg-[#5cb85c]/10 hover:text-[#4cae4c] border-[#5cb85c]/30">
                        <Eye size={14} className="mr-2"/> Ver
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-doc-view, #printable-doc-view * { visibility: visible; }
          #printable-doc-view { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: portrait; margin: 1.5cm; }
        }
      `}</style>

      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl h-[85vh] flex flex-col bg-card border-border overflow-hidden p-0 [&>button]:hidden">
          <DialogHeader className="shrink-0 flex flex-row justify-between items-center px-6 py-4 border-b border-border bg-muted/10">
            <DialogTitle className="text-xl font-light text-[#5cb85c]">Vista de Consentimiento</DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer size={14} className="mr-1"/> Imprimir Respaldo</Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedDoc(null)}><X size={18}/></Button>
            </div>
          </DialogHeader>

          {selectedDoc && (
            <div id="printable-doc-view" className="flex-1 overflow-y-auto custom-scrollbar p-8 print:m-0 print:p-0 bg-background">
              
              <div className="text-center mb-8 border-b border-border pb-6">
                <h1 className="text-2xl font-bold uppercase mb-2">{selectedDoc.title}</h1>
                <p className="text-muted-foreground text-sm">Generado el: {format(new Date(selectedDoc.createdAt), "dd/MM/yyyy HH:mm")}</p>
              </div>

              <div className="prose dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed text-base mb-12">
                {selectedDoc.content}
              </div>

              <div className="grid grid-cols-2 gap-12 mt-12 print:mt-12 print:break-inside-avoid">
                {/* FIRMA PACIENTE (Read Only) */}
                <div className="flex flex-col items-center border-t border-slate-400 pt-4">
                  {selectedDoc.patientSignature ? (
                    <img src={selectedDoc.patientSignature} alt="Firma Paciente" className="h-20 object-contain -mt-16 mb-2" />
                  ) : (
                    <div className="h-16 flex items-center justify-center text-red-500 font-bold mb-2">NO FIRMADO</div>
                  )}
                  <p className="font-bold text-sm uppercase">Firma del Paciente</p>
                </div>

                {/* FIRMA DOCTOR (Read Only) */}
                <div className="flex flex-col items-center border-t border-slate-400 pt-4">
                  {selectedDoc.doctorSignature ? (
                    <img src={selectedDoc.doctorSignature} alt="Firma Doctor" className="h-20 object-contain -mt-16 mb-2" />
                  ) : (
                    <div className="h-16 flex items-center justify-center text-red-500 font-bold mb-2">NO FIRMADO</div>
                  )}
                  <p className="font-bold text-sm uppercase">{selectedDoc.specialistName}</p>
                  <p className="text-xs text-muted-foreground">Profesional Tratante</p>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}