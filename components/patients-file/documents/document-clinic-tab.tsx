"use client"

import React, { useState, useEffect, useCallback } from "react"
import { 
  Printer, Trash2, Edit, PenTool, Loader2, User, 
  FileText, Plus, Search, CalendarIcon, X, ShieldAlert,
  RefreshCw, CheckCircle2, MoreVertical
} from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

import { SignaturePad } from "@/components/patients-file/signature-pad" 
import { documentStatuses } from "@/constants/status"
import { ClinicalDocEditorModal } from "./document-editor-modal"
import { ClinicalDocPrint } from "@/components/patients-file/documents/document-print"

export function DocumentosClinicosTab({ 
  patientId, 
  patientData 
}: { 
  patientId: string
  patientData?: any 
}) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const currentUser = session?.user as any
  const userRole = String(currentUser?.role || "").toUpperCase().trim()
  const canEditDocs = userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "ADMINISTRADOR"

  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showVoided, setShowVoided] = useState(false) 
  const [searchTerm, setSearchTerm] = useState("")
  
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [signingRole, setSigningRole] = useState<"doctor" | "patient" | null>(null)

  const [isCreating, setIsCreating] = useState(false)
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  
  const [currentPatient, setCurrentPatient] = useState<any>(patientData?.patient || patientData || {})

  useEffect(() => {
    if (!currentPatient.firstName && patientId) {
      fetch(`/api/patients/${patientId}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data) setCurrentPatient(data.patient || data)
        })
        .catch(console.error)
    }
  }, [patientId, currentPatient.firstName])

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinical-documents?patientId=${patientId}`)
      if (!res.ok) throw new Error("Error al obtener documentos")
      const data = await res.json()
      setDocuments(Array.isArray(data) ? data : [])
    } catch { 
      toast({ title: "Error", description: "No se pudieron cargar los documentos.", variant: "destructive" }) 
    } finally { 
      setIsLoading(false) 
    }
  }, [patientId, toast])

  useEffect(() => { 
    fetchDocs() 
  }, [fetchDocs])

  const getStatusConfig = (doc: any) => {
    if (doc.isVoided) return documentStatuses?.VOIDED || { label: "Anulado", bg: "bg-red-500/10", color: "text-red-600", icon: ShieldAlert }
    if (doc.patientSignature && doc.doctorSignature) return documentStatuses?.COMPLETED || { label: "Completado", bg: "bg-emerald-500/10", color: "text-emerald-600", icon: CheckCircle2 }
    if (doc.patientSignature || doc.doctorSignature) return documentStatuses?.PARTIAL || { label: "Firma Parcial", bg: "bg-amber-500/10", color: "text-amber-600", icon: PenTool }
    return documentStatuses?.DRAFT || { label: "Borrador", bg: "bg-slate-500/10", color: "text-slate-600", icon: FileText }
  }

  const patientFullName = currentPatient?.firstName && currentPatient?.lastName
    ? `${currentPatient.firstName} ${currentPatient.lastName}`.trim()
    : currentPatient?.name || currentPatient?.fullName || "Paciente Registrado"

  const patientDocId = currentPatient?.ci || currentPatient?.identification || currentPatient?.dni || "N/A"

  const patientAge = currentPatient?.age || (
    currentPatient?.birthDate 
      ? new Date().getFullYear() - new Date(currentPatient.birthDate).getFullYear() 
      : ""
  )

  const handleSaveDocument = async (title: string, content: string): Promise<void> => {
    if (!canEditDocs) { 
      toast({ title: "Acceso Denegado", description: "No cuenta con privilegios clínicos.", variant: "destructive" })
      return 
    }
    if (!title.trim() || !content.trim()) { 
      toast({ title: "Datos incompletos", description: "El título y contenido son requeridos.", variant: "destructive" })
      return 
    }
    
    setIsSaving(true)
    try {
      const method = editingDocId ? "PUT" : "POST"
      const url = editingDocId ? `/api/clinical-documents/${editingDocId}` : `/api/clinical-documents`
      
      const res = await fetch(url, { 
        method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          patientId, 
          title, 
          content, 
          specialistName: currentUser?.name || "Dr(a). Tratante", 
          specialistIdDoc: currentUser?.ci || currentUser?.idDoc || null, 
          authorId: currentUser?.id 
        }) 
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error al procesar el documento")
      }

      toast({ title: editingDocId ? "Documento actualizado" : "Documento creado con éxito", variant: "success" })
      setIsCreating(false)
      setEditingDocId(null)
      setNewTitle("")
      setNewContent("")
      fetchDocs()
    } catch (error: any) { 
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" }) 
    } finally { 
      setIsSaving(false) 
    }
  }

  const handleEditInit = (doc: any) => { 
    if (!canEditDocs) return
    if (doc.isVoided) {
      toast({ title: "Documento Anulado", description: "No se puede modificar un documento legal anulado.", variant: "destructive" })
      return
    }
    setSelectedDoc(null)
    setEditingDocId(doc.id)
    setNewTitle(doc.title)
    setNewContent(doc.content)
    setIsCreating(true)
  }

  const handleVoidDocument = async (id: string) => {
    if (!canEditDocs) return
    try {
      const res = await fetch(`/api/clinical-documents/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "No se pudo anular")
      }
      toast({ title: "Documento anulado médico-legalmente" })
      if (selectedDoc?.id === id) setSelectedDoc(null)
      fetchDocs()
    } catch (error: any) { 
      toast({ title: "Error al anular", description: error.message, variant: "destructive" }) 
    }
  }

  const handleSaveSignature = async (base64Image: string) => {
    if (!selectedDoc || !signingRole) return
    if (signingRole === "doctor" && userRole === "RECEPTIONIST") {
      return toast({ title: "Acceso Denegado", description: "El médico debe firmar desde su propia cuenta.", variant: "destructive" })
    }

    const updateData = signingRole === "doctor" ? { doctorSignature: base64Image } : { patientSignature: base64Image }
    
    try {
      const res = await fetch(`/api/clinical-documents/${selectedDoc.id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(updateData) 
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al registrar la firma")
      }

      const updated = await res.json()
      setSelectedDoc(updated)
      fetchDocs()
      setSigningRole(null)
      toast({ title: "Firma registrada y auditada correctamente", variant: "success" })
    } catch (error: any) { 
      toast({ title: "Error al firmar", description: error.message, variant: "destructive" }) 
    }
  }

  const displayedDocs = documents.filter(d => {
    const matchesTab = showVoided ? d.isVoided : !d.isVoided
    const term = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      d.title?.toLowerCase().includes(term) || 
      d.author?.name?.toLowerCase().includes(term)
    return matchesTab && matchesSearch
  })

  if (isLoading) {
    return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-[#008bcd] w-10 h-10"/></div>
  }

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs sticky top-0 z-20 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
               <FileText className="w-5 h-5 text-[#008bcd]" />  Documentos Clínicos
              </h2>
              {!canEditDocs && (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 tracking-wider">
                  SÓLO LECTURA
                </span>
              )}
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Gestión de consentimientos, reportes y documentos médico-legales.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Buscar documento..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-9 bg-background border-border text-sm font-medium focus-visible:ring-[#008bcd] w-full h-11 rounded-xl" 
            />
          </div>

          <div className="flex w-full sm:w-auto gap-2">
            <Button 
              variant={showVoided ? "secondary" : "outline"} 
              onClick={() => setShowVoided(!showVoided)} 
              className={cn(
                "h-11 rounded-xl font-bold transition-all", 
                showVoided 
                  ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:border-red-900/50" 
                  : "bg-background border-border hover:bg-muted"
              )}
            >
              {showVoided ? "Volver a activos" : "Ver anulados"}
            </Button>
            
            {!showVoided && canEditDocs && (
              <Button 
                onClick={() => { 
                  setEditingDocId(null)
                  setNewTitle("")
                  setNewContent("")
                  setIsCreating(true)
                }} 
                className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold rounded-xl h-11 px-5 shadow-xs transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" /> Nuevo Documento
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Listado de Documentos */}
      {displayedDocs.length === 0 ? (
        <div className="bg-card border border-dashed border-border/80 rounded-2xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
          <FileText className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-bold text-foreground text-lg">
            {showVoided ? "No hay documentos anulados" : "Sin Documentos"}
          </p>
          <p className="text-sm">No se encontraron registros clínicos para este paciente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedDocs.map(doc => {
            const statusConfig = getStatusConfig(doc)
            const StatusIcon = statusConfig.icon

            return (
              <div 
                key={doc.id} 
                className={cn(
                  "bg-card border rounded-2xl shadow-xs flex flex-col p-5 transition-all hover:shadow-md group", 
                  doc.isVoided 
                    ? "border-red-200 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/10" 
                    : "border-border/80 hover:border-[#008bcd]/40"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                    statusConfig.bg,
                    statusConfig.color
                  )}>
                    <StatusIcon className="w-3.5 h-3.5 shrink-0" /> 
                    {statusConfig.label}
                  </span>

                  {canEditDocs && !doc.isVoided && (
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-amber-500 hover:bg-amber-500/10 rounded-lg" 
                        onClick={() => handleEditInit(doc)}
                      >
                        <Edit size={14} />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-500/10 rounded-lg">
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[24px]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Anular documento clínico?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción preservará el registro en el archivo de auditoría médica pero lo marcará como nulo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleVoidDocument(doc.id)} className="bg-red-600 rounded-xl font-bold">
                              Anular
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                
                <h3 className={cn(
                  "font-bold text-lg mb-3 line-clamp-2 leading-tight", 
                  doc.isVoided ? "text-red-700 dark:text-red-400 line-through" : "text-foreground"
                )}>
                  {doc.title}
                </h3>
                
                <div className="mt-auto pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-medium mb-4">
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-[#008bcd]" /> 
                    {doc.author?.name || doc.specialistName || "Dr. Asignado"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon size={13} /> 
                    {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => setSelectedDoc(doc)} 
                  className={cn(
                    "w-full font-bold rounded-xl h-10 transition-colors", 
                    doc.isVoided 
                      ? "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30" 
                      : "text-[#008bcd] border-[#008bcd]/30 hover:bg-[#008bcd]/10"
                  )}
                >
                  Ver documento clínico <span className="ml-1.5">»</span>
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Editor Modal */}
      <ClinicalDocEditorModal
        isOpen={isCreating}
        onClose={() => { 
          setIsCreating(false)
          setEditingDocId(null)
          setNewTitle("")
          setNewContent("") 
        }}
        onSave={handleSaveDocument}
        initialTitle={newTitle}
        initialContent={newContent}
        isSaving={isSaving}
        patientData={currentPatient}
        doctorName={currentUser?.name || "Dr(a). Asignado"}
      />

      {/* Impresión */}
      {selectedDoc && (
        <ClinicalDocPrint 
          document={selectedDoc} 
          patientFullName={patientFullName}
          patientAge={patientAge}
          patientDocId={patientDocId}
          doctorSpecialty={currentUser?.specialty || "Odontología Integral"}
        />
      )}

      {/* Visor Detallado */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl h-[85vh] flex flex-col bg-card border-border overflow-hidden p-0 rounded-[24px] shadow-2xl [&>button]:hidden print:hidden">
          <div className="shrink-0 flex flex-row justify-between items-center px-6 py-4 border-b border-border/70 bg-muted/15">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <FileText className="w-5 h-5 text-[#008bcd]" /> {selectedDoc?.title}
              </DialogTitle>
              {selectedDoc && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusConfig(selectedDoc).bg} ${getStatusConfig(selectedDoc).color}`}>
                  {getStatusConfig(selectedDoc).label}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {!selectedDoc?.isVoided && canEditDocs && (
                <Button size="sm" variant="outline" onClick={() => handleEditInit(selectedDoc)} className="rounded-xl font-bold border-border/80">
                  <Edit size={14} className="mr-1.5 text-amber-500" /> Editar
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => window.print()} className="rounded-xl font-bold border-border/80 hover:text-[#008bcd]">
                <Printer size={14} className="mr-1.5" /> Imprimir
              </Button>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl bg-muted/50 hover:bg-muted" onClick={() => setSelectedDoc(null)}>
                <X size={18} />
              </Button>
            </div>
          </div>

          {selectedDoc && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-background">
              {/* Panel Izquierdo: Metadatos y Firmas */}
              <div className="w-full md:w-[320px] shrink-0 border-r border-border/60 bg-muted/10 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-border/60">
                      <tr><td className="p-3 bg-muted/30 font-bold w-1/3">Especialista:</td><td className="p-3 font-medium text-foreground">{selectedDoc.specialistName}</td></tr>
                      <tr><td className="p-3 bg-muted/30 font-bold">Doc. Ident.:</td><td className="p-3 font-medium text-foreground">{selectedDoc.specialistIdDoc || "-"}</td></tr>
                      <tr><td className="p-3 bg-muted/30 font-bold">Emisión:</td><td className="p-3 font-medium text-foreground">{format(new Date(selectedDoc.createdAt), "dd/MM/yyyy HH:mm")}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4">
                  {/* Firma Paciente */}
                  <div className={cn("border rounded-xl p-5 shadow-xs transition-colors", selectedDoc.patientSignature ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card border-border/60")}>
                    <p className="font-extrabold text-[11px] uppercase tracking-wider mb-3 text-foreground text-center">Firma Paciente / Tutor</p>
                    {selectedDoc.patientSignature ? (
                      <div className="bg-white rounded-lg p-2 flex justify-center border border-slate-200">
                        <img src={selectedDoc.patientSignature} alt="Firma Paciente" className="h-16 object-contain mix-blend-multiply" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-center h-16 border-2 border-dashed border-border/80 rounded-lg bg-muted/30">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Falta Firma</span>
                        </div>
                        {!selectedDoc.isVoided && (
                          <Button variant="outline" size="sm" className="w-full rounded-lg font-bold border-border/80 hover:bg-muted" onClick={() => setSigningRole("patient")}>
                            <PenTool size={14} className="mr-2 text-[#008bcd]"/> Ingresar Firma
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Firma Doctor */}
                  <div className={cn("border rounded-xl p-5 shadow-xs transition-colors", selectedDoc.doctorSignature ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card border-border/60")}>
                    <p className="font-extrabold text-[11px] uppercase tracking-wider mb-3 text-foreground text-center">Firma Especialista</p>
                    {selectedDoc.doctorSignature ? (
                      <div className="bg-white rounded-lg p-2 flex justify-center border border-slate-200">
                        <img src={selectedDoc.doctorSignature} alt="Firma Doctor" className="h-16 object-contain mix-blend-multiply" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-center h-16 border-2 border-dashed border-border/80 rounded-lg bg-muted/30">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Falta Firma</span>
                        </div>
                        {!selectedDoc.isVoided && canEditDocs && (
                          <Button variant="outline" size="sm" className="w-full rounded-lg font-bold border-border/80 hover:bg-muted" onClick={() => setSigningRole("doctor")}>
                            <PenTool size={14} className="mr-2 text-[#008bcd]"/> Ingresar Firma
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel Derecho: Contenido */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                  <div className="border-l-4 border-[#008bcd] pl-4 mb-6">
                    <h3 className="text-2xl font-bold text-[#008bcd] tracking-tight">{selectedDoc.title}</h3>
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed text-sm font-medium">
                    {selectedDoc.content}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Firma */}
      <Dialog open={!!signingRole} onOpenChange={(open) => !open && setSigningRole(null)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-[24px] shadow-2xl p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/70 bg-muted/15">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <PenTool className="w-5 h-5 text-[#008bcd]" /> Registrar Firma Digital
            </DialogTitle>
          </div>
          <div className="p-6">
            {signingRole && (
              <SignaturePad 
                label={signingRole === "doctor" ? "Firma del Profesional Tratante" : "Firma del Paciente / Tutor"} 
                onSign={(data: string) => handleSaveSignature(data)} 
                onClear={() => {}} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}