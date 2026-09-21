"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Loader2,
  Printer,
  X,
  ShieldCheck,
  Search,
  PenTool,
  Check,
  Stethoscope,
} from "lucide-react"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useGetPatient } from "@/hooks/patients"
import { printClinicalDocSheet } from "@/components/patients-file/documents/document-print"
import { useClinicSettings } from "@/config/clinic-settings"
import { SignaturePad } from "@/components/patients-file/signature-pad"
import { ConsentsTable } from "./consents-table"
import { cn } from "@/lib/utils"

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
  const userRole = String(currentUser?.role || "").toUpperCase().trim()
  const canSign = userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "ADMINISTRADOR"

  const { patient } = useGetPatient(patientId)
  const { settings } = useClinicSettings()

  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [signingRole, setSigningRole] = useState<"doctor" | "patient" | null>(null)
  const [isApplyingProfileSig, setIsApplyingProfileSig] = useState(false)

  const patientFullName = patient
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
    : "Paciente Registrado"
  const patientDocId = patient?.ci || "No registrado"
  const patientAge = calculateAge(patient?.birthDate)

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/clinical-documents?patientId=${patientId}`)
      if (!res.ok) throw new Error("Error en la respuesta")
      const data = await res.json()

      const consentList = (Array.isArray(data) ? data : [])
        .filter((d: any) => !d.isVoided)
        .filter(
          (d: any) =>
            d.title?.toLowerCase().includes("consentimiento") ||
            d.title?.toLowerCase().includes("autorización") ||
            d.title?.toLowerCase().includes("autorizacion") ||
            d.title?.toLowerCase().includes("acuerdo")
        )
      setDocuments(consentList)
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de consentimientos",
        variant: "destructive",
      })
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
    return documents.filter(
      (doc) =>
        doc.title?.toLowerCase().includes(term) ||
        doc.specialistName?.toLowerCase().includes(term)
    )
  }, [documents, searchTerm])

  const handlePrintDocument = (document: any) => {
    printClinicalDocSheet({
      document,
      patientFullName,
      patientAge,
      patientDocId,
      doctorSpecialty: document.author?.specialty || currentUser?.specialty || "Ortodoncia22",
      doctorLicense:
        document.author?.professionalCard ||
        document.author?.licenseNumber ||
        currentUser?.professionalCard ||
        currentUser?.licenseNumber ||
        "1824124AC-1234",
      settings,
    })
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
      toast({ title: "Firma registrada y auditada correctamente" })
    } catch {
      toast({ title: "Error al firmar", variant: "destructive" })
    }
  }

  const handleApplyProfileSignature = async () => {
    if (!selectedDoc || !canSign) return
    setIsApplyingProfileSig(true)
    try {
      let signatureToUse = currentUser?.signatureBase64 || null
      if (!signatureToUse) {
        const res = await fetch("/api/users/signature", { cache: "no-store" })
        if (res.ok) {
          const creds = await res.json()
          signatureToUse = creds?.signatureBase64 || null
        }
      }

      if (!signatureToUse) {
        toast({
          title: "Sin firma registrada",
          description: "Configura primero tu firma en tu perfil de especialista.",
          variant: "destructive",
        })
        return
      }

      const resUpdate = await fetch(`/api/clinical-documents/${selectedDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorSignature: signatureToUse }),
      })
      if (!resUpdate.ok) throw new Error()
      const updated = await resUpdate.json()
      setSelectedDoc(updated)
      fetchDocs()
      toast({ title: "Firma institucional vinculada con éxito" })
    } catch {
      toast({ title: "Error al vincular firma", variant: "destructive" })
    } finally {
      setIsApplyingProfileSig(false)
    }
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-card p-6 rounded-2xl border border-border/80 shadow-xs sticky top-0 z-20 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <ShieldCheck className="text-emerald-500 w-6 h-6" />
              Historial de Consentimientos
            </h2>
            <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-1 rounded-md border border-border tracking-wider">
              AUDITORÍA LEGAL Y CLÍNICA
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Registro inmutable de acuerdos y procedimientos autorizados por el paciente o tutor.
          </p>
        </div>

        <div className="relative w-full sm:w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar consentimiento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background text-sm font-medium h-11 rounded-xl focus-visible:ring-[#008bcd] border-border/80 w-full"
          />
        </div>
      </div>

      <ConsentsTable
        documents={filteredDocs}
        onSelectDoc={(doc) => setSelectedDoc(doc)}
        pageSize={6}
      />

      <Dialog open={Boolean(selectedDoc)} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="sm:max-w-[1000px] w-[95vw] h-[85vh] max-h-[85vh] flex flex-col bg-card border-border/80 p-0 rounded-2xl shadow-2xl [&>button]:hidden print:hidden font-sans overflow-hidden">
          <DialogHeader className="shrink-0 flex flex-row justify-between items-center px-6 py-3.5 border-b border-border/70 bg-muted/20">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Auditoría de Consentimiento
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Visualización legal inmutable y verificación de firmas.
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePrintDocument(selectedDoc)}
                className="rounded-xl font-bold border-border/80 bg-card text-foreground hover:bg-muted hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] text-xs h-8 px-3 shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]"
              >
                <Printer size={13} className="mr-1.5" style={{ color: 'var(--doctor-accent, #008bcd)' }} /> Imprimir Respaldo
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer"
                onClick={() => setSelectedDoc(null)}
              >
                <X size={16} />
              </Button>
            </div>
          </DialogHeader>

          {selectedDoc && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 bg-background overflow-hidden">
              {/* PANEL LATERAL IZQUIERDO: METADATOS Y FIRMAS */}
              <div className="md:col-span-4 border-r border-border/60 bg-muted/10 p-4 overflow-y-auto space-y-3.5 [scrollbar-width:thin]">
                {/* FICHA DEL FACULTATIVO */}
                <div className="bg-card border border-border/70 rounded-xl p-3.5 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-border/60 font-bold uppercase text-[11px] text-foreground tracking-wider">
                    <Stethoscope className="w-3.5 h-3.5 text-[#008bcd]" /> Datos del Facultativo
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Especialista</span>
                    <p className="font-bold text-foreground truncate">
                      {selectedDoc.specialistName || selectedDoc.author?.name || currentUser?.name || "Dr. Especialista"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Especialidad</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {selectedDoc.author?.specialty || currentUser?.specialty || "Ortodoncia22"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Reg. MSP / Matrícula</span>
                    <p className="font-mono font-bold text-[#008bcd] truncate">
                      {selectedDoc.author?.professionalCard ||
                        selectedDoc.author?.licenseNumber ||
                        currentUser?.professionalCard ||
                        currentUser?.licenseNumber ||
                        "1824124AC-1234"}
                    </p>
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
                    <div className="space-y-2">
                      <div className="bg-white rounded-lg p-1.5 flex justify-center border border-slate-200">
                        <img
                          src={selectedDoc.patientSignature}
                          alt="Firma Paciente"
                          className="h-12 object-contain mix-blend-multiply"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSigningRole("patient")}
                        className="w-full text-[10px] font-bold text-[#008bcd] hover:bg-[#008bcd]/10 h-7 rounded-lg cursor-pointer"
                      >
                        <PenTool size={11} className="mr-1" /> Cambiar / Volver a firmar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-11 border border-dashed border-border/80 rounded-lg flex items-center justify-center bg-muted/20">
                        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">
                          Pendiente Firma
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-lg font-bold text-xs h-8 cursor-pointer"
                        onClick={() => setSigningRole("patient")}
                      >
                        <PenTool size={12} className="mr-1.5 text-[#008bcd]" /> Firmar en Pantalla
                      </Button>
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
                      {canSign && (
                        <div className="space-y-1.5">
                          <Button
                            variant="default"
                            size="sm"
                            disabled={isApplyingProfileSig}
                            className="w-full rounded-lg font-bold bg-[#008bcd] hover:bg-[#0070a8] text-white text-xs h-8 cursor-pointer"
                            onClick={handleApplyProfileSignature}
                          >
                            {isApplyingProfileSig ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : (
                              <Check size={13} className="mr-1.5 stroke-[2.5]" />
                            )}
                            Vincular Firma Perfil
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg font-bold text-xs h-7 text-muted-foreground cursor-pointer"
                            onClick={() => setSigningRole("doctor")}
                          >
                            <PenTool size={11} className="mr-1.5" /> Firmar a Mano
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-8 p-5 overflow-y-auto [scrollbar-width:thin]">
                <div className="bg-card border border-border/70 rounded-xl p-5 shadow-2xs space-y-4">
                  <div className="border-l-4 border-[#008bcd] pl-3">
                    <h3 className="text-base font-black text-[#008bcd] tracking-tight uppercase">
                      {selectedDoc.title}
                    </h3>
                    <p className="text-xs font-bold text-muted-foreground mt-0.5">
                      PACIENTE: <strong className="text-foreground">{patientFullName}</strong> (C.I.: {patientDocId})
                    </p>
                  </div>
                  <div className="text-foreground whitespace-pre-wrap leading-relaxed text-xs text-justify font-normal">
                    {selectedDoc.content}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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