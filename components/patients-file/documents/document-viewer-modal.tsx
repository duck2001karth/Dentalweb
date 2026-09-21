"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Edit,
  Printer,
  X,
  User,
  PenTool,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDoc: any
  setSelectedDoc: (doc: any) => void
  canEditDocs: boolean
  onEdit: (doc: any) => void
  onPrint: (doc: any) => void
  onOpenSignPad: (role: "doctor" | "patient") => void
  onSuccessMutation?: () => void
  currentUser?: any
  statusConfig: {
    label: string
    bg: string
    color: string
    icon: any
  }
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  selectedDoc,
  setSelectedDoc,
  canEditDocs,
  onEdit,
  onPrint,
  onOpenSignPad,
  onSuccessMutation,
  currentUser,
  statusConfig,
}: DocumentViewerModalProps) {
  const { toast } = useToast()
  const [isLinkingProfileSig, setIsLinkingProfileSig] = useState(false)

  if (!selectedDoc) return null

  const handleApplyProfileSignature = async () => {
    if (!canEditDocs) return
    setIsLinkingProfileSig(true)
    try {
      let sig = currentUser?.signatureBase64 || null
      if (!sig) {
        const res = await fetch("/api/users/signature", { cache: "no-store" })
        if (res.ok) {
          const creds = await res.json()
          sig = creds?.signatureBase64 || null
        }
      }

      if (!sig) {
        toast({
          title: "Sin firma registrada",
          description: "Configura primero tu firma en tu perfil de usuario.",
          variant: "destructive",
        })
        return
      }

      const resUpdate = await fetch(`/api/clinical-documents/${selectedDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorSignature: sig }),
      })

      if (!resUpdate.ok) throw new Error()
      const updated = await resUpdate.json()
      setSelectedDoc(updated)
      if (onSuccessMutation) onSuccessMutation()
      toast({ title: "Firma vinculada con éxito" })
    } catch {
      toast({ title: "Error al vincular firma", variant: "destructive" })
    } finally {
      setIsLinkingProfileSig(false)
    }
  }

  const doctorDisplayName =
    selectedDoc.specialistName ||
    selectedDoc.author?.name ||
    currentUser?.name ||
    "Dr. Patricio C"

  const doctorSpecialty =
    selectedDoc.author?.specialty || currentUser?.specialty || "Ortodoncia22"

  const doctorLicense =
    selectedDoc.author?.professionalCard ||
    selectedDoc.author?.licenseNumber ||
    currentUser?.professionalCard ||
    currentUser?.licenseNumber ||
    "1824124AC-1234"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1000px] w-[95vw] h-[85vh] max-h-[85vh] flex flex-col bg-card border-border/80 p-0 rounded-2xl shadow-2xl [&>button]:hidden print:hidden font-sans overflow-hidden">
        {/* CABECERA COMPACTA */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 bg-[#008bcd]/15 text-[#008bcd] rounded-xl shrink-0">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground truncate max-w-md lg:max-w-xl">
                {selectedDoc.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  REF: #{selectedDoc.id?.substring(0, 8).toUpperCase()}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                    statusConfig.bg,
                    statusConfig.color
                  )}
                >
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">

          {!selectedDoc.isVoided && canEditDocs && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(selectedDoc)}
              className="rounded-xl font-bold border-border/80 bg-card text-foreground hover:bg-muted text-xs h-8 px-3 shadow-2xs transition-all cursor-pointer"
            >
              <Edit size={13} className="mr-1.5 text-amber-500" /> Editar
            </Button>
          )}
         <Button
            size="sm"
            variant="outline"
            onClick={() => onPrint(selectedDoc)}
            className="rounded-xl font-bold border-border/80 bg-card text-foreground hover:bg-muted hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] text-xs h-8 px-3 shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]"
          >
            <Printer size={13} className="mr-1.5" style={{ color: 'var(--doctor-accent, #008bcd)' }} /> Imprimir Respaldo
          </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-xl bg-muted/50 hover:bg-muted"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* CONTENIDO INTERNO */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 bg-background overflow-hidden">
          {/* PANEL IZQUIERDO: METADATOS Y FIRMAS */}
          <div className="md:col-span-4 border-r border-border/60 bg-muted/10 p-4 overflow-y-auto space-y-3.5 [scrollbar-width:thin]">
            {/* DATOS DEL FACULTATIVO */}
            <div className="bg-card border border-border/70 rounded-xl p-3.5 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center gap-1.5 pb-1.5 border-b border-border/60 font-bold uppercase text-[11px] text-foreground tracking-wider">
                <User className="w-3.5 h-3.5 text-[#008bcd]" /> Datos del Facultativo
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Especialista</span>
                <p className="font-bold text-foreground truncate">{doctorDisplayName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Especialidad</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">{doctorSpecialty}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Reg. MSP / Matrícula</span>
                <p className="font-mono font-bold text-[#008bcd] truncate">{doctorLicense}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Fecha Emisión</span>
                <p className="text-muted-foreground font-medium">
                  {format(new Date(selectedDoc.createdAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            </div>

            {/* FIRMA PACIENTE */}
            <div
              className={cn(
                "border rounded-xl p-3 shadow-2xs text-center transition-colors",
                selectedDoc.patientSignature ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card border-border/70"
              )}
            >
              <p className="font-bold text-[10px] uppercase tracking-wider mb-2 text-foreground">
                Firma Paciente / Tutor
              </p>
              {selectedDoc.patientSignature ? (
                <div className="bg-white rounded-lg p-1.5 flex justify-center border border-slate-200">
                  <img
                    src={selectedDoc.patientSignature}
                    alt="Firma Paciente"
                    className="h-12 object-contain mix-blend-multiply"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-11 border border-dashed border-border/80 rounded-lg flex items-center justify-center bg-muted/20">
                    <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">
                      Pendiente Firma
                    </span>
                  </div>
                  {!selectedDoc.isVoided && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-lg font-bold text-xs h-8"
                      onClick={() => onOpenSignPad("patient")}
                    >
                      <PenTool size={12} className="mr-1.5 text-[#008bcd]" /> Firmar en Pantalla
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* FIRMA ESPECIALISTA */}
            <div
              className={cn(
                "border rounded-xl p-3 shadow-2xs text-center transition-colors",
                selectedDoc.doctorSignature ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card border-border/70"
              )}
            >
              <p className="font-bold text-[10px] uppercase tracking-wider mb-2 text-foreground">
                Firma Especialista
              </p>
              {selectedDoc.doctorSignature ? (
                <div className="bg-white rounded-lg p-1.5 flex justify-center border border-slate-200">
                  <img
                    src={selectedDoc.doctorSignature}
                    alt="Firma Doctor"
                    className="h-12 object-contain mix-blend-multiply"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-11 border border-dashed border-border/80 rounded-lg flex items-center justify-center bg-muted/20">
                    <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">
                      Pendiente Firma
                    </span>
                  </div>
                  {!selectedDoc.isVoided && canEditDocs && (
                    <div className="space-y-1.5">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={isLinkingProfileSig}
                        className="w-full rounded-lg font-bold bg-[#008bcd] hover:bg-[#0070a8] text-white text-xs h-8"
                        onClick={handleApplyProfileSignature}
                      >
                        {isLinkingProfileSig ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : (
                          <CheckCircle2 size={13} className="mr-1.5 stroke-[2.5]" />
                        )}
                        Vincular Firma Perfil
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-lg font-bold text-xs h-7 text-muted-foreground"
                        onClick={() => onOpenSignPad("doctor")}
                      >
                        <PenTool size={11} className="mr-1.5" /> Firmar a Mano
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PANEL DERECHO: CUERPO DEL DOCUMENTO */}
          <div className="md:col-span-8 p-5 overflow-y-auto [scrollbar-width:thin]">
            <div className="bg-card border border-border/70 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="border-l-4 border-[#008bcd] pl-3">
                <h3 className="text-base font-black text-[#008bcd] tracking-tight uppercase">
                  {selectedDoc.title}
                </h3>
              </div>
              <div className="text-foreground whitespace-pre-wrap leading-relaxed text-xs text-justify font-normal">
                {selectedDoc.content}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}