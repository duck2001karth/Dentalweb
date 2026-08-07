"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  CheckCircle, FileSignature, FileText, Plus, 
  Eye, Edit, Save, Loader2, Link2, Printer 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ConsentPrintView } from "./consent-print-view"

interface TreatmentExtraProps {
  patient: any
  autoRecoveredSignature: string | null
  isSignaturePending: boolean
  getSignatureSrc: (src: string) => string
  setIsSignatureModalOpen: (open: boolean) => void
  signedConsents: any[]
  commentText: string
  setCommentText: (text: string) => void
  isEditingComments: boolean
  setIsEditingComments: (editing: boolean) => void
  handleSaveComments: () => void
  isSavingComment: boolean
}

export function TreatmentExtraSection({
  patient,
  autoRecoveredSignature,
  isSignaturePending,
  getSignatureSrc,
  setIsSignatureModalOpen,
  signedConsents,
  commentText,
  setCommentText,
  isEditingComments,
  setIsEditingComments,
  handleSaveComments,
  isSavingComment
}: TreatmentExtraProps) {
  const { toast } = useToast()

  const [selectedConsent, setSelectedConsent] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleOpenPdf = (doc: any) => {
    setSelectedConsent(doc)
    if (doc.fileUrl || doc.pdfUrl) {
      window.open(doc.fileUrl || doc.pdfUrl, "_blank")
    } else {
      setIsPreviewOpen(true)
    }
  }

  // 💡 Lógica de impresión segura:
  const handlePrintDocument = () => {
    // 1. Ocultar modal primero
    setIsPreviewOpen(false)

    // 2. Dar 300ms a React para borrar el modal de la pantalla
    setTimeout(() => {
      document.body.classList.add("printing-consent")
      window.print()

      // 3. Volver a la normalidad cuando se cierre el cuadro de impresión
      setTimeout(() => {
        document.body.classList.remove("printing-consent")
        setIsPreviewOpen(true) 
      }, 500)
    }, 300)
  }

  return (
    <div className="space-y-6">
      
      {/* VISTA PREVIA IMPRESA OCULTA */}
      <ConsentPrintView 
        patient={patient}
        consent={selectedConsent}
        signatureBase64={autoRecoveredSignature}
        getSignatureSrc={getSignatureSrc}
      />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
        
        {/* ENCABEZADO DE FIRMA */}
        <div className="border-b border-border pb-4 flex justify-between items-center">
          <div>
            <h4 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <CheckCircle className="w-5 h-5 text-emerald-500" /> Firma del paciente
            </h4>
            <p className="text-xs text-muted-foreground">(Se incluirán en la impresión de evoluciones)</p>
          </div>
        </div>

        {/* ESTADO DE FIRMA */}
        {autoRecoveredSignature ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl border border-border shadow-sm flex items-center justify-center h-20 w-40 shrink-0">
                <img 
                  src={getSignatureSrc(autoRecoveredSignature)} 
                  alt="Firma Paciente" 
                  className="max-h-full max-w-full object-contain" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                />
              </div>
              <div>
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm mb-0.5">Firma recuperada automáticamente</p>
                <p className="text-xs text-muted-foreground font-medium">El sistema ha vinculado una firma válida de los registros clínicos del paciente.</p>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsSignatureModalOpen(true)} 
              className="text-xs font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-500/10 rounded-xl"
            >
              Re-firmar
            </Button>
          </div>
        ) : isSignaturePending ? (
          <div className="p-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-3">
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
              Hay 1 documento pendiente por firmar
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Se completó el procedimiento clínico al 100%. Por norma sanitaria se requiere la conformidad firmada del paciente.
            </p>
            <Button 
              size="sm" 
              onClick={() => setIsSignatureModalOpen(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6 rounded-xl shadow-md transition-all hover:scale-105"
            >
              <FileSignature className="w-4 h-4 mr-2"/> Solicitar firma
            </Button>
          </div>
        ) : (
          <div className="p-6 bg-slate-50/50 dark:bg-muted/10 border border-border rounded-xl text-center">
            <p className="text-xs text-muted-foreground font-medium">
              La firma de conformidad se solicitará cuando se evolucione un procedimiento al 100%.
            </p>
          </div>
        )}

        {/* LISTA DE CONSENTIMIENTOS */}
        <div className="border-t border-border pt-6">
          <h5 className="font-bold text-sm mb-3 flex items-center gap-2 text-foreground">
            <FileText className="w-4 h-4 text-muted-foreground"/> Consentimientos Informados
          </h5>

          {signedConsents.length > 0 ? (
            <div className="space-y-2 mb-4">
              {signedConsents.map((doc: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-muted/20 border border-border rounded-xl gap-3">
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#008bcd]/10 text-[#008bcd] rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-foreground block">{doc.title || doc.name || "Consentimiento Informado"}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Firmado digitalmente por el paciente</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-md mr-1">
                      ✓ Firmado
                    </span>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenPdf(doc)}
                      className="h-8 text-xs font-semibold text-foreground border-border hover:bg-accent rounded-lg"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-[#008bcd]" /> Ver PDF
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toast({ title: "Documento vinculado", description: "Documento asociado al presupuesto activo.", variant: "success" })}
                      className="h-8 text-xs font-semibold text-foreground border-border hover:bg-accent rounded-lg"
                    >
                      <Link2 className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Vincular
                    </Button>
                  </div>

                </div>
              ))}
            </div>
          ) : ( 
            <p className="text-xs text-muted-foreground mb-4">No se han registrado consentimientos firmados para este paciente.</p> 
          )}
          
          <Link href={`/paciente/${patient?.id}?tab=consentimientos`}>
            <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 bg-transparent font-semibold rounded-xl text-xs h-9">
              <Plus className="w-3.5 h-3.5 mr-1.5"/> Redactar nuevo consentimiento
            </Button>
          </Link>
        </div>

        {/* COMENTARIOS */}
        <div className="border-t border-border pt-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h5 className="font-bold text-sm text-foreground">Comentarios para el paciente</h5>
              <p className="text-xs text-muted-foreground">Se incluirán en la impresión de presupuestos</p>
            </div>

            {isEditingComments ? (
              <Button onClick={handleSaveComments} disabled={isSavingComment} size="sm" className="bg-[#008bcd] hover:bg-[#0070a8] text-white shadow-sm rounded-xl h-8 px-4 font-bold text-xs">
                {isSavingComment ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />} Guardar
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsEditingComments(true)} className="text-[#008bcd] hover:bg-[#008bcd]/10 rounded-xl h-8 px-4 font-bold text-xs">
                <Edit className="w-3 h-3 mr-1.5" /> Editar
              </Button>
            )}
          </div>
          
          {isEditingComments ? (
            <Textarea 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)} 
              className="min-h-[100px] bg-background border-border rounded-xl shadow-inner focus-visible:ring-[#008bcd] resize-none p-3.5 text-xs font-medium" 
              placeholder="Recomendaciones post-tratamiento, condiciones de validez del presupuesto..." 
            />
          ) : (
            <div className="p-4 bg-muted/10 rounded-xl border border-border min-h-[70px] text-xs text-foreground/80 leading-relaxed shadow-sm">
              {commentText || <span className="italic text-muted-foreground">Validez del plan de tratamiento por 30 días. Plan sujeto a evaluación clínica.</span>}
            </div>
          )}
        </div>

      </div>

      {/* MODAL VISOR */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[650px] bg-card border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b border-border bg-slate-50 dark:bg-muted/30 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#008bcd]" />
                {selectedConsent?.title || "Consentimiento Informado"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Paciente: {patient?.firstName} {patient?.lastName}</p>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-3 text-xs leading-relaxed text-foreground">
              <p className="font-bold border-b border-border/60 pb-2">DECLARACIÓN DE CONSENTIMIENTO INFORMADO</p>
              <p>
                Yo, <b className="text-[#008bcd]">{patient?.firstName} {patient?.lastName}</b>, confirmo que he sido informado detalladamente sobre el plan de tratamiento odontológico, sus beneficios y posibles riesgos inherentes.
              </p>
              <p className="text-muted-foreground italic">
                {selectedConsent?.content || selectedConsent?.description || "El paciente declara estar en pleno conocimiento de las prestaciones contenidas en su plan de tratamiento y autoriza al equipo profesional para su ejecución."}
              </p>
            </div>

            {autoRecoveredSignature && (
              <div className="pt-3 border-t border-border flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Firma Digital del Paciente</p>
                  <img src={getSignatureSrc(autoRecoveredSignature)} alt="Firma" className="h-14 object-contain mt-1" />
                </div>
                <div className="text-right text-[10px] text-muted-foreground font-semibold">
                  <p>Estado: FIRMADO DIGITALMENTE</p>
                  <p>Fecha: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-3.5 border-t border-border bg-slate-50/50 dark:bg-muted/20 flex flex-row items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="rounded-xl text-xs h-9 font-bold">
              Cerrar
            </Button>
            <Button onClick={handlePrintDocument} className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold rounded-xl text-xs h-9 px-4">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Imprimir Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}