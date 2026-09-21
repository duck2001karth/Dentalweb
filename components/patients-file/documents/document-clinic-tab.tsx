"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Edit,
  Loader2,
  User,
  FileText,
  Plus,
  Search,
  CalendarIcon,
  ShieldAlert,
  CheckCircle2,
  PenTool,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { SignaturePad } from "@/components/patients-file/signature-pad"
import { documentStatuses } from "@/constants/status"
import { ClinicalDocEditorModal } from "./document-editor-modal"
import { DocumentViewerModal } from "./document-viewer-modal"
import { DocumentVoidDialog } from "./document-void-dialog"
import { printClinicalDocSheet } from "@/components/patients-file/documents/document-print"
import { useClinicSettings } from "@/config/clinic-settings"

export function DocumentosClinicosTab({
  patientId,
  patientData,
}: {
  patientId: string
  patientData?: any
}) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const { settings } = useClinicSettings()

  const currentUser = session?.user as any
  const userRole = String(currentUser?.role || "").toUpperCase().trim()
  const canEditDocs =
    userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "ADMINISTRADOR"

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

  const [currentPatient, setCurrentPatient] = useState<any>(
    patientData?.patient || patientData || {}
  )

  useEffect(() => {
    if (!currentPatient.firstName && patientId) {
      fetch(`/api/patients/${patientId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setCurrentPatient(data.patient || data)
        })
        .catch(console.error)
    }
  }, [patientId, currentPatient.firstName])

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinical-documents?patientId=${patientId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDocuments(Array.isArray(data) ? data : [])
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [patientId, toast])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const getStatusConfig = (doc: any) => {
    if (doc.isVoided)
      return (
        documentStatuses?.VOIDED || {
          label: "Anulado",
          bg: "bg-red-500/10",
          color: "text-red-600",
          icon: ShieldAlert,
        }
      )
    if (doc.patientSignature && doc.doctorSignature)
      return (
        documentStatuses?.COMPLETED || {
          label: "Completado",
          bg: "bg-emerald-500/10",
          color: "text-emerald-600",
          icon: CheckCircle2,
        }
      )
    if (doc.patientSignature || doc.doctorSignature)
      return (
        documentStatuses?.PARTIAL || {
          label: "Firma Parcial",
          bg: "bg-amber-500/10",
          color: "text-amber-600",
          icon: PenTool,
        }
      )
    return (
      documentStatuses?.DRAFT || {
        label: "Borrador",
        bg: "bg-slate-500/10",
        color: "text-slate-600",
        icon: FileText,
      }
    )
  }

  const patientFullName =
    currentPatient?.firstName && currentPatient?.lastName
      ? `${currentPatient.firstName} ${currentPatient.lastName}`.trim()
      : currentPatient?.name || "Paciente Registrado"

  const patientDocId =
    currentPatient?.ci || currentPatient?.identification || "N/A"

  const patientAge =
    currentPatient?.age ||
    (currentPatient?.birthDate
      ? new Date().getFullYear() - new Date(currentPatient.birthDate).getFullYear()
      : "")

  const handlePrintDocument = (docToPrint: any) => {
    printClinicalDocSheet({
      document: docToPrint,
      patientFullName,
      patientAge,
      patientDocId,
      doctorSpecialty:
        docToPrint.author?.specialty || currentUser?.specialty || "Ortodoncia22",
      doctorLicense:
        docToPrint.author?.professionalCard ||
        docToPrint.author?.licenseNumber ||
        currentUser?.professionalCard ||
        currentUser?.licenseNumber ||
        "1824124AC-1234",
      settings,
    })
  }

  const handleSaveDocument = async (title: string, content: string): Promise<void> => {
    if (!canEditDocs || !title.trim() || !content.trim()) return
    setIsSaving(true)
    try {
      const method = editingDocId ? "PUT" : "POST"
      const url = editingDocId
        ? `/api/clinical-documents/${editingDocId}`
        : `/api/clinical-documents`

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          title,
          content,
          specialistName: currentUser?.name || "Dr(a). Tratante",
          specialistIdDoc: currentUser?.ci || null,
          authorId: currentUser?.id,
        }),
      })

      if (!res.ok) throw new Error()
      toast({
        title: editingDocId ? "Documento actualizado" : "Documento creado",
      })
      setIsCreating(false)
      setEditingDocId(null)
      fetchDocs()
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditInit = (doc: any) => {
    if (!canEditDocs || doc.isVoided) return
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
      if (!res.ok) throw new Error()
      toast({ title: "Documento anulado" })
      if (selectedDoc?.id === id) setSelectedDoc(null)
      fetchDocs()
    } catch {
      toast({ title: "Error al anular", variant: "destructive" })
    }
  }

  const handleSaveSignature = async (base64Image: string) => {
    if (!selectedDoc || !signingRole) return
    const updateData =
      signingRole === "doctor"
        ? { doctorSignature: base64Image }
        : { patientSignature: base64Image }

    try {
      const res = await fetch(`/api/clinical-documents/${selectedDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setSelectedDoc(updated)
      fetchDocs()
      setSigningRole(null)
      toast({ title: "Firma guardada correctamente" })
    } catch {
      toast({ title: "Error al firmar", variant: "destructive" })
    }
  }

  const displayedDocs = useMemo(() => {
    return documents.filter((d) => {
      const matchesTab = showVoided ? d.isVoided : !d.isVoided
      const term = searchTerm.toLowerCase()
      return (
        matchesTab &&
        (!searchTerm ||
          d.title?.toLowerCase().includes(term) ||
          d.author?.name?.toLowerCase().includes(term))
      )
    })
  }, [documents, showVoided, searchTerm])

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin text-[#008bcd] w-10 h-10" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-card p-6 rounded-2xl border border-border/80 shadow-xs sticky top-0 z-20 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-[#008bcd]" /> Documentos Clínicos
            </h2>
            {!canEditDocs && (
              <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-1 rounded-md border border-border tracking-wider">
                SÓLO LECTURA
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Gestión de consentimientos, acuerdos y documentos médico-legales.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background text-sm font-medium h-11 rounded-xl focus-visible:ring-[#008bcd] border-border/80 w-full"
            />
          </div>

          <div className="flex w-full sm:w-auto gap-2">
            <Button
              variant={showVoided ? "secondary" : "outline"}
              onClick={() => setShowVoided(!showVoided)}
              className={cn(
                "h-11 rounded-xl font-bold text-sm px-4 transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2",
                showVoided
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60 focus-visible:ring-red-500"
                  : "bg-card text-foreground border border-border/80 hover:bg-muted hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] focus-visible:ring-[var(--doctor-accent,#008bcd)]"
              )}
            >
              {showVoided ? "Ver activos" : "Ver anulados"}
            </Button>

            {!showVoided && canEditDocs && (
              <Button
                onClick={() => {
                  setEditingDocId(null)
                  setNewTitle("")
                  setNewContent("")
                  setIsCreating(true)
                }}
                className="h-11 px-5 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                Nuevo Documento
              </Button>
            )}
          </div>
        </div>
      </div>

      {displayedDocs.length === 0 ? (
        <div className="bg-card border border-dashed border-border/80 rounded-2xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
          <FileText className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-bold text-foreground text-base">Sin Documentos</p>
          <p className="text-sm">No hay registros clínicos para este paciente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedDocs.map((doc) => {
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
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                      statusConfig.bg,
                      statusConfig.color
                    )}
                  >
                    <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                    {statusConfig.label}
                  </span>

                  {canEditDocs && !doc.isVoided && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/15 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                        onClick={() => handleEditInit(doc)}
                        title="Editar documento"
                      >
                        <Edit size={14} className="shrink-0" />
                      </Button>
                      <DocumentVoidDialog
                        docId={doc.id}
                        docTitle={doc.title}
                        onConfirmVoid={handleVoidDocument}
                      />
                    </div>
                  )}
                </div>

                <h3
                  className={cn(
                    "font-bold text-base mb-3 line-clamp-2 leading-tight",
                    doc.isVoided ? "line-through text-red-600" : "text-foreground"
                  )}
                >
                  {doc.title}
                </h3>

                <div className="mt-auto pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-medium mb-4">
                  <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                    <User size={13} className="text-[#008bcd]" />
                    <span className="truncate">{doc.author?.name || doc.specialistName || "Dr. Asignado"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <CalendarIcon size={13} />
                    {format(new Date(doc.createdAt), "dd MMM yyyy", { locale: es })}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setSelectedDoc(doc)}
                  className="w-full font-bold rounded-xl h-10 text-xs text-[#008bcd] border-[#008bcd]/30 hover:bg-[#008bcd]/10 cursor-pointer"
                >
                  Ver documento clínico <span className="ml-1">»</span>
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <ClinicalDocEditorModal
        isOpen={isCreating}
        onClose={() => {
          setIsCreating(false)
          setEditingDocId(null)
        }}
        onSave={handleSaveDocument}
        initialTitle={newTitle}
        initialContent={newContent}
        isSaving={isSaving}
        patientData={currentPatient}
        doctorName={currentUser?.name || "Dr(a). Asignado"}
      />

      <DocumentViewerModal
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        selectedDoc={selectedDoc}
        setSelectedDoc={setSelectedDoc}
        canEditDocs={canEditDocs}
        onEdit={handleEditInit}
        onPrint={handlePrintDocument}
        onOpenSignPad={(role) => setSigningRole(role)}
        onSuccessMutation={fetchDocs}
        currentUser={currentUser}
        statusConfig={selectedDoc ? getStatusConfig(selectedDoc) : ({} as any)}
      />

      <Dialog open={!!signingRole} onOpenChange={(open) => !open && setSigningRole(null)}>
        <DialogContent className="sm:max-w-[680px] w-[95vw] bg-card border-border/80 rounded-2xl p-0 overflow-hidden font-sans shadow-2xl">
          <div className="px-6 py-4 border-b border-border/70 bg-muted/15 flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <PenTool className="w-4 h-4 text-[#008bcd]" /> Registrar Firma Digital
            </DialogTitle>
          </div>
          <div className="p-6">
            {signingRole && (
              <SignaturePad
                label={
                  signingRole === "doctor"
                    ? "Firma del Profesional Tratante"
                    : "Firma del Paciente / Tutor"
                }
                onSign={(data: string) => handleSaveSignature(data)}
                onClear={() => {}}
                onCancel={() => setSigningRole(null)}
                confirmButtonText="Confirmar y Guardar Firma"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}