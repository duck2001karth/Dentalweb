"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  CheckCircle, FileText, Plus, 
  Edit, Save, Loader2, Printer, AlertCircle, PenTool, Check
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface TreatmentExtraProps {
  patient: any
  plan: any
  planSignature: string | null
  setIsSignatureModalOpen: (open: boolean) => void
  signedConsents?: any[]
  commentText: string
  setCommentText: (text: string) => void
  isEditingComments: boolean
  setIsEditingComments: (editing: boolean) => void
  handleSaveComments: () => void
  isSavingComment: boolean
  isSignaturePending?: boolean
  onApproveWithSavedSignature?: () => void
}

export function TreatmentExtraSection({
  patient,
  plan,
  planSignature,
  setIsSignatureModalOpen,
  signedConsents = [],
  commentText,
  setCommentText,
  isEditingComments,
  setIsEditingComments,
  handleSaveComments,
  isSavingComment,
  onApproveWithSavedSignature
}: TreatmentExtraProps) {

  const [selectedConsent, setSelectedConsent] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const firstSignedDoc = signedConsents.find((doc: any) => doc.patientSignature)

  const savedPatientSignature = 
    planSignature ||
    plan?.signatureBase64 ||
    patient?.signatureBase64 || 
    patient?.signature || 
    patient?.patientSignature ||
    (plan as any)?.patient?.signatureBase64 ||
    (plan as any)?.patient?.signature ||
    (plan as any)?.patient?.patientSignature ||
    firstSignedDoc?.patientSignature || null

  const activeSignature = planSignature || savedPatientSignature
  const isPlanApproved = 
    plan?.status === "ACTIVE" || 
    plan?.status === "COMPLETED" || 
    Boolean(planSignature) ||
    Boolean(plan?.signatureBase64)

  const getSignatureSrc = (base64String: string | null) => {
    if (!base64String) return ""
    if (base64String.startsWith("data:image")) return base64String
    return `data:image/png;base64,${base64String}`
  }

  const handlePrintDocument = () => {
    setIsPreviewOpen(false)

    setTimeout(() => {
      document.body.classList.add("printing-consent")
      window.print()
      setTimeout(() => {
        document.body.classList.remove("printing-consent")
        setIsPreviewOpen(true) 
      }, 500)
    }, 300)
  }

  return (
    <div className="space-y-6 font-sans antialiased">
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs p-6 space-y-6">
        <div className="border-b border-border/80 pb-4 flex justify-between items-center">
          <div>
            <h4 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <CheckCircle className={`w-5 h-5 ${isPlanApproved ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`} /> 
              Aprobación y Firma del Paciente
            </h4>
            <p className="text-xs text-muted-foreground">(Se incluirán en la impresión de presupuestos y evoluciones)</p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
            isPlanApproved 
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
          }`}>
            {isPlanApproved ? "✓ Presupuesto Aprobado" : "Pendiente de Firma"}
          </span>
        </div>
        {isPlanApproved ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {activeSignature && (
                /* 1. Fondo bg-white explícito para contraste */
                <div className="w-32 h-16 bg-white rounded-xl border border-border/80 p-2 flex items-center justify-center shrink-0 shadow-xs">
                  <img 
                    src={getSignatureSrc(activeSignature)} 
                    alt="Firma Paciente" 
                    /* 2. Opcional: dark:invert o dark:brightness-200 si la caja no tuviera fondo blanco */
                    className="max-h-full object-contain dark:filter-none" 
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                  Presupuesto Aprobado Digitalmente
                </p>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  El paciente autorizó la ejecución y los cobros de este plan.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSignatureModalOpen(true)}
              className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs h-9 px-4 rounded-xl cursor-pointer"
            >
              Re-firmar
            </Button>
          </div>
        ) : savedPatientSignature ? (
          /* 2. PLAN SIN FIRMAR, PERO EXISTE FIRMA PREVIA REGISTRADA EN FICHA */
          <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-background p-2 rounded-xl border border-border/80 shadow-xs flex items-center justify-center h-16 w-32 shrink-0 overflow-hidden opacity-90">
                <img 
                  src={getSignatureSrc(savedPatientSignature)} 
                  alt="Firma Paciente Guardada" 
                  className="max-h-full max-w-full object-contain" 
                />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-[#008bcd] dark:text-blue-400">
                  Firma disponible en Ficha Clínica
                </p>
                <p className="text-muted-foreground font-medium mt-0.5">
                  Haz clic para vincular la firma registrada del paciente y activar el presupuesto.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button 
                onClick={onApproveWithSavedSignature}
                className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold rounded-xl h-9 text-xs px-4 shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4 mr-1.5" /> Aprobar con firma guardada
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsSignatureModalOpen(true)}
                className="border-border text-foreground font-bold rounded-xl h-9 text-xs px-3 cursor-pointer"
                title="Dibujar nueva firma desde cero"
              >
                <PenTool className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          /* 3. PLAN SIN APROBAR Y SIN FIRMAS GUARDADAS */
          <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-amber-700 dark:text-amber-400">
                  Aprobación requerida para activar cobros
                </p>
                <p className="text-muted-foreground font-medium">
                  Solicita al paciente su firma digital en pantalla para activar este presupuesto.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setIsSignatureModalOpen(true)}
              className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold rounded-xl h-9 text-xs px-4 shadow-xs shrink-0 cursor-pointer"
            >
              <PenTool className="w-4 h-4 mr-1.5" /> Firmar Aprobación
            </Button>
          </div>
        )}

        {/* LISTADO DE CONSENTIMIENTOS INFORMADOS */}
        <div className="border-t border-border/80 pt-6">
          <h5 className="font-bold text-sm mb-3 flex items-center gap-2 text-foreground">
            <FileText className="w-4 h-4 text-muted-foreground"/> Consentimientos Informados
          </h5>

          {signedConsents.length > 0 ? (
            <div className="space-y-2 mb-4">
              {signedConsents.map((doc: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-muted/20 border border-border/80 rounded-xl gap-3">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedConsent(doc)
                        setIsPreviewOpen(true)
                      }}
                      className="text-xs font-bold text-[#008bcd] h-8 px-3 rounded-lg"
                    >
                      Ver Documento
                    </Button>
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                      ✓ Firmado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : ( 
            <p className="text-xs text-muted-foreground mb-4 font-medium">No se han registrado consentimientos firmados para este paciente.</p> 
          )}
          
          <Link href={`/paciente/${patient?.id}?tab=consentimientos`}>
            <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 bg-transparent font-bold rounded-xl text-xs h-9 cursor-pointer">
              <Plus className="w-3.5 h-3.5 mr-1.5"/> Redactar nuevo consentimiento
            </Button>
          </Link>
        </div>

        {/* COMENTARIOS DE PRESUPUESTO */}
        <div className="border-t border-border/80 pt-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h5 className="font-bold text-sm text-foreground">Comentarios para el paciente</h5>
              <p className="text-xs text-muted-foreground">Se incluirán en la impresión de presupuestos</p>
            </div>

            {isEditingComments ? (
              <Button onClick={handleSaveComments} disabled={isSavingComment} size="sm" className="bg-[#008bcd] hover:bg-[#0070a8] text-white shadow-xs rounded-xl h-8 px-4 font-bold text-xs cursor-pointer">
                {isSavingComment ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />} Guardar
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsEditingComments(true)} className="text-[#008bcd] hover:bg-[#008bcd]/10 rounded-xl h-8 px-4 font-bold text-xs cursor-pointer">
                <Edit className="w-3 h-3 mr-1.5" /> Editar
              </Button>
            )}
          </div>
          
          {isEditingComments ? (
            <Textarea 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)} 
              className="min-h-[100px] bg-background border-border rounded-xl shadow-inner focus-visible:ring-[#008bcd] resize-none p-3.5 text-xs font-medium text-foreground" 
              placeholder="Recomendaciones post-tratamiento, condiciones de validez del presupuesto..." 
            />
          ) : (
            <div className="p-4 bg-muted/10 rounded-xl border border-border/80 min-h-[70px] text-xs text-foreground/80 leading-relaxed shadow-xs font-medium">
              {commentText || <span className="italic text-muted-foreground">Validez del plan de tratamiento por 30 días. Plan sujeto a evaluación clínica.</span>}
            </div>
          )}
        </div>

      </div>

      {/* MODAL VISOR DE CONSENTIMIENTO INFORMADO */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[650px] bg-card border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b border-border bg-slate-50 dark:bg-muted/30 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#008bcd]" />
                {selectedConsent?.title || selectedConsent?.name || "Consentimiento Informado"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Paciente: {patient?.firstName} {patient?.lastName}</p>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="p-4 bg-muted/20 border border-border/80 rounded-xl space-y-3 text-xs leading-relaxed text-foreground">
              <p className="font-bold border-b border-border/60 pb-2">DECLARACIÓN DE CONSENTIMIENTO INFORMADO</p>
              <p>
                Yo, <b className="text-[#008bcd]">{patient?.firstName} {patient?.lastName}</b>, confirmo que he sido informado detalladamente sobre el plan de tratamiento odontológico, sus beneficios y posibles riesgos inherentes.
              </p>
              <p className="text-muted-foreground">
                {selectedConsent?.content || selectedConsent?.description || "Autorizo la realización de las prestaciones odontológicas detalladas en el presupuesto."}
              </p>
            </div>

            {activeSignature && (
              <div className="pt-3 border-t border-border/80 flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Firma Digital del Paciente</p>
                  <img src={getSignatureSrc(activeSignature)} alt="Firma Digital" className="h-14 object-contain mt-1" />
                </div>
                <div className="text-right text-[10px] text-muted-foreground font-semibold">
                  <p>Estado: FIRMADO DIGITALMENTE</p>
                  <p>Fecha: {new Date().toLocaleDateString("es-ES")}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-3.5 border-t border-border bg-slate-50/50 dark:bg-muted/20 flex flex-row items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="rounded-xl text-xs h-9 font-bold cursor-pointer">
              Cerrar
            </Button>
            <Button onClick={handlePrintDocument} className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold rounded-xl text-xs h-9 px-4 cursor-pointer">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Imprimir Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}