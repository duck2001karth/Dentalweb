"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Loader2, FileText, CheckCircle2, Eye, Printer, X, ShieldCheck, AlertCircle, Search } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

import { useGetPatient } from "@/hooks/patients"
import { ClinicalDocPrint } from "@/components/patients-file/documents/document-print"

const calculateAge = (birthDateString?: string | Date | null) => {
  if (!birthDateString) return ""
  const today = new Date()
  const birthDate = new Date(birthDateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

export function ConsentimientosTab({ patientId }: { patientId: string }) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const currentUser = session?.user as any
  const { patient } = useGetPatient(patientId)
  
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const patientFullName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : "Paciente Registrado"
  const patientDocId = patient?.ci || "No registrado"
  const patientAge = calculateAge(patient?.birthDate)

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinical-documents?patientId=${patientId}`)
      if (!res.ok) throw new Error("Error en la respuesta")
      const data = await res.json()
      
      const consentList = (Array.isArray(data) ? data : [])
        .filter((d: any) => !d.isVoided)
        .filter((d: any) => 
          d.title?.toLowerCase().includes("consentimiento") || 
          d.title?.toLowerCase().includes("autorización") ||
          d.title?.toLowerCase().includes("acuerdo")
        )

      setDocuments(consentList)
    } catch { 
      toast({ title: "Error", description: "No se pudo cargar el historial de consentimientos", variant: "destructive" }) 
    } finally { 
      setIsLoading(false) 
    }
  }, [patientId, toast])

  useEffect(() => { 
    fetchDocs() 
  }, [fetchDocs])

  const filteredDocs = useMemo(() => {
    if (!searchTerm) return documents
    const term = searchTerm.toLowerCase()
    return documents.filter(doc => 
      doc.title?.toLowerCase().includes(term) ||
      doc.specialistName?.toLowerCase().includes(term)
    )
  }, [documents, searchTerm])

  const SignatureBadge = ({ isSigned, label }: { isSigned: boolean, label: string }) => {
    if (isSigned) {
      return (
        <div className="flex items-center justify-between w-[110px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md">
          <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          <CheckCircle2 size={14} className="shrink-0" />
        </div>
      )
    }
    return (
      <div className="flex items-center justify-between w-[110px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        <AlertCircle size={14} className="shrink-0" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-[#008bcd]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-semibold text-muted-foreground">Cargando auditoría de consentimientos...</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      
      {/* CABECERA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm sticky top-0 z-20 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="text-emerald-500 w-6 h-6" />
              Historial de Consentimientos
            </h2>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 tracking-wider">
              AUDITORÍA LEGAL - SOLO LECTURA
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Registro inmutable de acuerdos y procedimientos autorizados por el paciente o tutor.
          </p>
        </div>

        <div className="relative w-full sm:w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Buscar consentimiento..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-9 bg-background border-border text-sm font-medium focus-visible:ring-[#008bcd] w-full h-11 rounded-xl" 
          />
        </div>
      </div>

      {/* TABLA DE AUDITORÍA */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 border-b border-border/70 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider w-16">Nº</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Consentimiento Legal</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Especialista</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Emisión</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">Firmas Registradas</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 opacity-20 mb-3" />
                      <p className="font-bold text-lg text-foreground">Sin consentimientos registrados</p>
                      <p className="text-sm">No existen consentimientos informados firmados o pendientes para este paciente.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, index) => (
                  <tr key={doc.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4 font-bold text-muted-foreground/70">
                      {(filteredDocs.length - index).toString().padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground line-clamp-1">{doc.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 font-mono">
                        REF: {doc.id.substring(0, 8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {doc.specialistName || doc.author?.name || "Profesional Asignado"}
                    </td>
                    <td className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">
                      {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-center justify-center">
                        <SignatureBadge isSigned={Boolean(doc.patientSignature)} label="Paciente" />
                        <SignatureBadge isSigned={Boolean(doc.doctorSignature)} label="Doctor" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedDoc(doc)} 
                        className="bg-background text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 border-border/80 font-bold rounded-lg shadow-xs"
                      >
                        <Eye size={14} className="mr-1.5"/> Ver Documento
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPONENTE DE IMPRESIÓN */}
      {selectedDoc && (
        <ClinicalDocPrint 
          document={selectedDoc} 
          patientFullName={patientFullName}
          patientAge={patientAge}
          patientDocId={patientDocId}
          doctorSpecialty={selectedDoc.author?.specialty || currentUser?.specialty || "Odontología Integral"}
        />
      )}

      {/* VISOR TIPO AUDITORÍA */}
      <Dialog open={Boolean(selectedDoc)} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl h-[90vh] flex flex-col bg-card border-border overflow-hidden p-0 rounded-[24px] shadow-2xl [&>button]:hidden print:hidden">
          
          <DialogHeader className="shrink-0 flex flex-row justify-between items-center px-6 py-4 border-b border-border/70 bg-muted/15">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Auditoría de Consentimiento
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Visualización legal inmutable y verificación de firmas.
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => window.print()} className="rounded-xl font-bold border-border/80">
                <Printer size={14} className="mr-1.5"/> Imprimir Respaldo
              </Button>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl bg-muted/50 hover:bg-muted" onClick={() => setSelectedDoc(null)}>
                <X size={18}/>
              </Button>
            </div>
          </DialogHeader>

          {selectedDoc && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-muted/20">
              <div className="max-w-[210mm] mx-auto bg-white dark:bg-slate-50 my-8 p-12 rounded-lg shadow-sm border border-border/40 text-slate-900 font-sans relative">
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
                  <ShieldCheck className="w-96 h-96" />
                </div>

                <div className="relative z-10">
                  <div className="text-center mb-8 border-b-2 border-emerald-500/20 pb-6">
                    <h1 className="text-2xl font-black uppercase text-slate-800 tracking-tight">{selectedDoc.title}</h1>
                    <p className="text-slate-500 text-xs font-bold mt-2 tracking-wider">
                      CONSENTIMIENTO INFORMADO • EMISIÓN: {format(new Date(selectedDoc.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>

                  <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed font-medium mb-16">
                    {selectedDoc.content}
                  </div>

                  <div className="grid grid-cols-2 gap-16 mt-16 pt-8 border-t border-slate-200">
                    {/* FIRMA PACIENTE */}
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-56 flex items-center justify-center border-b border-slate-300">
                        {selectedDoc.patientSignature ? (
                          <img src={selectedDoc.patientSignature} alt="Firma Paciente" className="max-h-14 max-w-full object-contain mix-blend-multiply" />
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold tracking-widest bg-red-500/10 px-3 py-1 rounded-md">PENDIENTE DE FIRMA</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-2 uppercase">{patientFullName}</p>
                      <p className="text-[10px] text-slate-500">C.I.: {patientDocId}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Firma del Paciente / Tutor</p>
                    </div>

                    {/* FIRMA DOCTOR */}
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-56 flex items-center justify-center border-b border-slate-300">
                        {selectedDoc.doctorSignature ? (
                          <img src={selectedDoc.doctorSignature} alt="Firma Doctor" className="max-h-14 max-w-full object-contain mix-blend-multiply" />
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold tracking-widest bg-red-500/10 px-3 py-1 rounded-md">PENDIENTE DE FIRMA</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-2 uppercase">{selectedDoc.specialistName || selectedDoc.author?.name || "Profesional Asignado"}</p>
                      <p className="text-[10px] text-slate-500">{selectedDoc.author?.specialty || "Especialista Tratante"}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Firma del Profesional</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}