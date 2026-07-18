"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Printer, Trash2, Edit, PenTool, Loader2, User, FileSignature, Save, X, RefreshCw, FileText, CheckCircle2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { SignaturePad } from "@/components/patients-file/signature-pad" 
import { documentStatuses } from "@/constants/status"

export function DocumentosClinicosTab({ patientId, patientData }: { patientId: string, patientData?: any }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const canEditDocs = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"

  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showVoided, setShowVoided] = useState(false) 
  
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [signingRole, setSigningRole] = useState<"doctor" | "patient" | null>(null)
  
  const [isCreating, setIsCreating] = useState(false)
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinical-documents?patientId=${patientId}`)
      const data = await res.json()
      setDocuments(data || [])
    } catch (e) { toast({ title: "Error", variant: "destructive" }) } 
    finally { setIsLoading(false) }
  }, [patientId, toast])

  useEffect(() => { fetchDocs() }, [fetchDocs])
  const getDocumentStatusKey = (doc: any) => {
    if (doc.isVoided) return "VOIDED";
    if (doc.patientSignature && doc.doctorSignature) return "COMPLETED";
    if (doc.patientSignature || doc.doctorSignature) return "PARTIAL";
    return "DRAFT";
  }

  const handleSaveDocument = async () => {
    if (!canEditDocs) return toast({ title: "Acceso Denegado", description: "No tienes permisos para crear certificados.", variant: "destructive" })
    
    if (!newTitle.trim() || !newContent.trim()) return toast({ title: "Faltan datos", variant: "destructive" })
    setIsSaving(true)
    try {
      const method = editingDocId ? "PUT" : "POST"
      const url = editingDocId ? `/api/clinical-documents/${editingDocId}` : `/api/clinical-documents`
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId, title: newTitle, content: newContent, specialistName: currentUser?.name || "Dr. Asignado", specialistIdDoc: patientData?.ci || "109873553", authorId: currentUser?.id }) })
      toast({ title: editingDocId ? "Documento actualizado" : "Documento creado", variant: "success" })
      setIsCreating(false); setEditingDocId(null); setNewTitle(""); setNewContent(""); fetchDocs()
    } catch (error) { toast({ title: "Error al guardar", variant: "destructive" }) } finally { setIsSaving(false) }
  }

  const handleEditInit = (doc: any) => { 
    if (!canEditDocs) return; 
    setSelectedDoc(null); setEditingDocId(doc.id); setNewTitle(doc.title); setNewContent(doc.content); setIsCreating(true); 
  }

  const handleDeleteDocument = async (id: string) => {
    if (!canEditDocs) return; 
    try {
      await fetch(`/api/clinical-documents/${id}`, { method: "DELETE" })
      toast({ title: "Documento anulado", variant: "success" })
      if (selectedDoc?.id === id) setSelectedDoc(null)
      fetchDocs()
    } catch (error) { toast({ title: "Error", variant: "destructive" }) }
  }

  const handleRestoreDocument = async (id: string) => {
    if (!canEditDocs) return; 
    try {
      await fetch(`/api/clinical-documents/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isVoided: false }) })
      toast({ title: "Documento restaurado", variant: "success" })
      fetchDocs()
    } catch (error) { toast({ title: "Error", variant: "destructive" }) }
  }

  const handleSaveSignature = async (base64Image: string) => {
    if (!selectedDoc || !signingRole) return
    if (signingRole === "doctor" && currentUser?.role === "RECEPTIONIST") {
        return toast({ title: "Acceso Denegado", description: "El médico debe firmar desde su propia cuenta.", variant: "destructive" })
    }

    const updateData = signingRole === "doctor" ? { doctorSignature: base64Image } : { patientSignature: base64Image }
    try {
      const res = await fetch(`/api/clinical-documents/${selectedDoc.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updateData) })
      setSelectedDoc(await res.json()); fetchDocs(); setSigningRole(null)
      toast({ title: "Firma registrada", variant: "success" })
    } catch (error) { toast({ title: "Error al firmar", variant: "destructive" }) }
  }

  const displayedDocs = documents.filter(d => showVoided ? d.isVoided : !d.isVoided)

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#008bcd] w-10 h-10"/></div>

  return (
    <div className="animate-in fade-in pb-20">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-6 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
            <h2 className="text-2xl font-light flex items-center gap-2">
                {showVoided ? "Documentos Anulados (Papelera)" : "Documentos Clínicos"}
            </h2>
            {!canEditDocs && (
                <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md mt-1 inline-block border border-slate-200">
                    MODO LECTURA
                </span>
            )}
        </div>
        
        <div className="flex gap-2">
          <Button variant={showVoided ? "secondary" : "outline"} onClick={() => setShowVoided(!showVoided)} className={showVoided ? "bg-muted text-foreground" : "bg-background"}>
            {showVoided ? "Volver a activos" : "Ver anulados"}
          </Button>
          
          {!showVoided && canEditDocs && (
            <Button onClick={() => { setEditingDocId(null); setNewTitle(""); setNewContent(""); setIsCreating(true); }} className="bg-[#008bcd] hover:bg-[#0070a8] text-white">
              Nuevo documento clínico
            </Button>
          )}
        </div>
      </div>
      {displayedDocs.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground">
          {showVoided ? "No hay documentos anulados." : "Aún no se han creado documentos clínicos."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedDocs.map(doc => {
            const statusKey = getDocumentStatusKey(doc);
            const statusConfig = documentStatuses[statusKey];
            const StatusIcon = statusConfig.icon;

            return (
            <div key={doc.id} className={cn("bg-card border rounded-lg shadow-sm flex flex-col items-center p-6 transition-colors relative group", doc.isVoided ? "border-red-200 bg-red-50/10" : "border-border hover:border-[#008bcd]/50")}>
              {canEditDocs && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!doc.isVoided ? (
                    <>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-50" onClick={() => handleEditInit(doc)}><Edit size={14}/></Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"><Trash2 size={14}/></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Anular documento?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteDocument(doc.id)} className="bg-red-600">Anular</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </>
                    ) : (
                    <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 h-8 text-xs" onClick={() => handleRestoreDocument(doc.id)}>
                        <RefreshCw size={14} className="mr-1"/> Restaurar
                    </Button>
                    )}
                </div>
              )}

              {/* BADGE DE ESTADO */}
              <div className={`mt-2 mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusConfig.label}</span>
              </div>
              
              <h3 className={cn("font-bold text-center text-lg mb-4 px-4", doc.isVoided ? "text-red-700" : "text-foreground")}>{doc.title}</h3>
              
              <div className="flex justify-between w-full text-xs text-muted-foreground mb-4 border-t border-border pt-4 mt-auto">
                <div className="flex items-center gap-1"><User size={12}/> {doc.author?.name || "Administrador"}</div>
                <div className="flex items-center gap-1">{format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}</div>
              </div>

              <Button variant="outline" onClick={() => setSelectedDoc(doc)} className={cn("w-full font-bold", doc.isVoided ? "text-red-600 border-red-200 hover:bg-red-50" : "text-[#008bcd] border-[#008bcd]/30 hover:bg-[#008bcd]/10")}>
                Ver documento clínico <span className="ml-1">»</span>
              </Button>
            </div>
            )
          })}
        </div>
      )}
      {canEditDocs && (
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="max-w-4xl bg-card border-border">
            <DialogHeader><DialogTitle className="text-2xl font-light">{editingDocId ? "Editar documento clínico" : "Redactar nuevo documento clínico"}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <div><label className="text-sm font-bold text-muted-foreground mb-1 block">Título</label><Input placeholder="Ej: Certificado Médico" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-background"/></div>
              <div><label className="text-sm font-bold text-muted-foreground mb-1 block">Cuerpo del Documento</label><Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} className="min-h-[300px] bg-background"/></div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
              <Button onClick={handleSaveDocument} className="bg-[#008bcd] text-white">Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* CSS DE IMPRESIÓN */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-doc, #printable-doc * { visibility: visible; }
          #printable-doc { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: portrait; margin: 1.5cm; }
        }
      `}</style>

      {/* MODAL VISTA DETALLADA */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-6xl h-[90vh] flex flex-col bg-card border-border overflow-hidden p-0 [&>button]:hidden">
          <DialogHeader className="shrink-0 flex flex-row justify-between items-center px-6 py-4 border-b border-border bg-muted/10">
            <DialogTitle className="text-xl font-light flex items-center gap-3">
              <FileText size={20} className="text-[#008bcd]"/> {selectedDoc?.title}
              
              {/* STATUS DEL DOCUMENTO EN LA VISTA DETALLADA */}
              {selectedDoc && (() => {
                const config = documentStatuses[getDocumentStatusKey(selectedDoc)];
                return (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color} ml-2`}>
                    <config.icon className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                );
              })()}
            </DialogTitle>

            <div className="flex gap-2">
              {!selectedDoc?.isVoided && canEditDocs && <Button size="sm" variant="outline" onClick={() => handleEditInit(selectedDoc)}><Edit size={14} className="mr-1"/> Editar</Button>}
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer size={14} className="mr-1"/> Imprimir</Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedDoc(null)}><X size={18}/></Button>
            </div>
          </DialogHeader>

          {selectedDoc && (
            <div id="printable-doc" className="flex-1 overflow-y-auto custom-scrollbar p-6 print:m-0 print:p-0 bg-background">
              <div className="flex flex-col md:flex-row gap-8 h-full">
                <div className="w-full md:w-[35%] flex flex-col gap-4 shrink-0 print:w-full print:mb-6">
                  <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-border">
                        <tr><td className="p-3 bg-muted/30 font-semibold w-1/3">Especialista:</td><td className="p-3">{selectedDoc.specialistName}</td></tr>
                        <tr><td className="p-3 bg-muted/30 font-semibold">Doc. Ident.:</td><td className="p-3">{selectedDoc.specialistIdDoc || "-"}</td></tr>
                        <tr><td className="p-3 bg-muted/30 font-semibold">Fecha:</td><td className="p-3">{format(new Date(selectedDoc.createdAt), "dd/MM/yyyy HH:mm")}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* FIRMA PACIENTE */}
                  <div className="border border-border rounded-lg p-4 bg-card shadow-sm print:break-inside-avoid">
                    <p className="font-semibold text-sm mb-3">Firma Paciente:</p>
                    {selectedDoc.patientSignature ? (
                      <div className="bg-white rounded p-2 flex justify-center border-b border-dashed border-slate-300"><img src={selectedDoc.patientSignature} alt="Firma Paciente" className="h-16 object-contain" /></div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <span className="text-red-500 font-medium text-sm">Pendiente de firma</span>
                        {!selectedDoc.isVoided && <Button variant="outline" className="w-full print:hidden" onClick={() => setSigningRole("patient")}><PenTool size={14} className="mr-2"/> Firmar</Button>}
                      </div>
                    )}
                  </div>

                  {/* FIRMA DOCTOR */}
                  <div className="border border-border rounded-lg p-4 bg-card shadow-sm print:break-inside-avoid">
                    <p className="font-semibold text-sm mb-3">Firma Profesional Tratante:</p>
                    {selectedDoc.doctorSignature ? (
                      <div className="bg-white rounded p-2 flex justify-center border-b border-dashed border-slate-300"><img src={selectedDoc.doctorSignature} alt="Firma Doctor" className="h-16 object-contain" /></div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <span className="text-red-500 font-medium text-sm">Pendiente de firma</span>
                        {!selectedDoc.isVoided && canEditDocs && <Button variant="outline" className="w-full print:hidden" onClick={() => setSigningRole("doctor")}><PenTool size={14} className="mr-2"/> Firmar</Button>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-[65%] md:border-l md:border-border md:pl-8 pb-8 print:w-full print:border-none print:pl-0">
                  <div className="border-l-4 border-[#008bcd] pl-4 mb-6"><h3 className="text-2xl font-bold text-[#008bcd]">{selectedDoc.title}</h3></div>
                  <div className="prose dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed text-base">{selectedDoc.content}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL PAD DE FIRMAS (Usando el Componente Reutilizable) */}
      <Dialog open={!!signingRole} onOpenChange={(open) => !open && setSigningRole(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Registrar Firma Digital</DialogTitle>
          </DialogHeader>
          {signingRole && (
            <div className="mt-4">
              <SignaturePad 
                label={signingRole === "doctor" ? "Firma del Profesional Tratante" : "Firma del Paciente"} 
                onSign={(data) => handleSaveSignature(data)} 
                onClear={() => {}} // Local clear is managed inside the pad
              />
              <div className="flex justify-end gap-2 mt-6 border-t border-border pt-4">
                <Button variant="outline" onClick={() => setSigningRole(null)}>Cancelar</Button>
                {/* El botón de guardar ahora se activa desde el componente SignaturePad interno, pero si se quiere forzar la parada, el pad dispara onSign al soltar el trazo */}
                <span className="text-xs text-muted-foreground mt-2.5">El trazo se captura automáticamente. Cierra esta ventana si has terminado.</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}