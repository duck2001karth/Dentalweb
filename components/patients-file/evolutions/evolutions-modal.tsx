"use client"

import React, { useState, useEffect } from "react"
import {
  FileText,
  Loader2,
  UploadCloud,
  X,
  PenTool,
  CheckCircle2,
  ShieldAlert,
  Calendar as CalendarIcon,
  ShieldCheck,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SignaturePad } from "@/components/patients-file/signature-pad"
import { treatmentStatuses } from "@/constants/status"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

interface EvolutionModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  noteContent: string
  setNoteContent: (val: string) => void
  entryDate: string
  setEntryDate: (val: string) => void
  fileBase64: string | null
  setFileBase64: (val: string | null) => void
  fileName: string | null
  setFileName: (val: string | null) => void
  patientSignature: string | null
  setPatientSignature: (val: string | null) => void
  doctorSignature?: string | null
  doctorName?: string
  doctorSpecialty?: string
  doctorLicense?: string
  onSave: () => void
  isWorking: boolean
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  status: string
  setStatus: (status: string) => void
}

export function EvolutionModal({
  isOpen,
  onOpenChange,
  editingId,
  noteContent,
  setNoteContent,
  entryDate,
  setEntryDate,
  fileBase64,
  setFileBase64,
  fileName,
  setFileName,
  patientSignature,
  setPatientSignature,
  doctorSignature,
  doctorName,
  doctorSpecialty,
  doctorLicense,
  onSave,
  isWorking,
  handleImageUpload,
  status,
  setStatus,
}: EvolutionModalProps) {
  const { data: session } = useSession()
  const currentUser = session?.user as any

  const [isSignModalOpen, setIsSignModalOpen] = useState(false)

  const [doctorData, setDoctorData] = useState<{
    signature: string | null
    license: string
    name: string
    specialty: string
    loading: boolean
  }>({
    signature: doctorSignature || currentUser?.signatureBase64 || null,
    license: doctorLicense || currentUser?.professionalCard || currentUser?.licenseNumber || "",
    name: doctorName || (currentUser?.name ? `Dr. ${currentUser.name.replace(/^Dr\.\s*/i, "")}` : "Dr. Especialista"),
    specialty: doctorSpecialty || currentUser?.specialty || "Ortodoncia",
    loading: true,
  })

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    const loadSignature = async () => {
      try {
        const res = await fetch(`/api/users/signature?t=${Date.now()}`, {
          cache: "no-store",
        })

        if (res.ok) {
          const data = await res.json()
          if (!isMounted) return

          let sig = data.signatureBase64 || doctorSignature || currentUser?.signatureBase64 || null
          if (sig && !sig.startsWith("data:") && !sig.startsWith("http")) {
            sig = `data:image/png;base64,${sig}`
          }

          setDoctorData({
            signature: sig,
            license: data.professionalCard || data.licenseNumber || doctorLicense || currentUser?.professionalCard || "",
            name: doctorName || (currentUser?.name ? `Dr. ${currentUser.name.replace(/^Dr\.\s*/i, "")}` : "Dr. Especialista"),
            specialty: data.specialty || doctorSpecialty || currentUser?.specialty || "Ortodoncia",
            loading: false,
          })
          return
        }
      } catch (err) {
        console.error("Error al cargar firma en modal:", err)
      }

      if (isMounted) {
        let fallbackSig = doctorSignature || currentUser?.signatureBase64 || null
        if (fallbackSig && !fallbackSig.startsWith("data:") && !fallbackSig.startsWith("http")) {
          fallbackSig = `data:image/png;base64,${fallbackSig}`
        }

        setDoctorData({
          signature: fallbackSig,
          license: doctorLicense || currentUser?.professionalCard || currentUser?.licenseNumber || "",
          name: doctorName || (currentUser?.name ? `Dr. ${currentUser.name.replace(/^Dr\.\s*/i, "")}` : "Dr. Especialista"),
          specialty: doctorSpecialty || currentUser?.specialty || "Ortodoncia",
          loading: false,
        })
      }
    }

    loadSignature()

    return () => {
      isMounted = false
    }
  }, [isOpen, doctorSignature, doctorLicense, doctorName, doctorSpecialty, currentUser])

  const currentStatusConfig = treatmentStatuses[status] || treatmentStatuses.IN_PROGRESS
  const CurrentIcon = currentStatusConfig.icon

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[940px] w-[95vw] bg-card text-foreground border border-border/80 rounded-[24px] shadow-2xl p-0 overflow-hidden font-sans">
          {/* CABECERA */}
          <DialogHeader className="px-7 py-4.5 border-b border-border/70 bg-muted/20 flex flex-row items-center gap-3 text-left">
            <div className="p-2.5 bg-[#008bcd]/15 text-[#008bcd] dark:text-[#38bdf8] rounded-2xl shrink-0 border border-[#008bcd]/20">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {editingId ? "Editar Evolución Clínica" : "Registrar Nueva Evolución Clínica"}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                {editingId
                  ? "Actualiza las anotaciones y el estado del tratamiento."
                  : "Detalla el procedimiento realizado, fecha de atención y firma de conformidad del paciente."}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* CONTENIDO */}
          <div className="p-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Detalle de la Evolución / Acto Clínico *
                  </Label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="flex min-h-[150px] w-full rounded-xl border border-input bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#008bcd] resize-none"
                    placeholder="Ej: Se realiza obturación con resina compuesta en pieza 16 cara oclusal bajo aislamiento absoluto..."
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 h-4">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#008bcd]" /> Fecha Atención
                    </Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        className="h-10 w-full rounded-xl bg-background border-input text-xs font-bold cursor-pointer px-3 flex items-center justify-between"
                      />
                    </div>
                  </div>

                  {/* SELECTOR DE ESTADO */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider h-4 flex items-center">
                      Estado Tratamiento
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-10 w-full rounded-xl bg-background border-input text-xs font-bold px-3">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <CurrentIcon className={`w-4 h-4 ${currentStatusConfig.color}`} />
                            <span className={currentStatusConfig.color}>{currentStatusConfig.label}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {Object.values(treatmentStatuses).map((s) => {
                          const Icon = s.icon
                          return (
                            <SelectItem key={s.value} value={s.value} className="text-xs font-semibold py-2">
                              <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${s.color}`} />
                                <span className={s.color}>{s.label}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ADJUNTAR IMAGEN */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider h-4 flex items-center">
                      Evidencia Foto
                    </Label>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 border-dashed border border-input rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-muted/40 overflow-hidden relative cursor-pointer px-3 bg-background"
                      >
                        <input
                          type="file"
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <UploadCloud className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{fileName || "Subir foto"}</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* PREVIEW DE IMAGEN */}
                {fileBase64 && (
                  <div className="flex items-center justify-between bg-muted/40 p-2 px-3 rounded-xl border border-border/80 text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <img
                        src={fileBase64}
                        alt="Preview"
                        className="w-8 h-8 object-cover rounded-lg shadow-2xs border border-border shrink-0"
                      />
                      <span className="font-semibold text-foreground truncate max-w-[200px]">
                        {fileName || "Imagen seleccionada"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFileBase64(null)
                        setFileName(null)
                      }}
                      className="h-7 w-7 p-0 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 bg-muted/15 border border-border/80 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-foreground/80 uppercase tracking-wider">
                  <PenTool className="w-3.5 h-3.5 text-[#008bcd]" />
                  Firmas de Conformidad
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Firma del Profesional</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" /> Vinculada al Perfil
                    </span>
                  </div>

                  <div className="border border-border/80 rounded-xl p-3 bg-white text-slate-900 flex flex-col items-center justify-center min-h-[105px] shadow-2xs">
                    {doctorData.loading ? (
                      <div className="h-12 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#008bcd]" />
                        <span className="text-[11px] text-slate-400">Consultando credenciales...</span>
                      </div>
                    ) : doctorData.signature ? (
                      <img
                        src={doctorData.signature}
                        alt="Firma Profesional"
                        className="h-11 max-w-[180px] object-contain py-0.5"
                      />
                    ) : (
                      <div className="h-9 flex items-center justify-center">
                        <span className="text-[11px] text-slate-400 italic">
                          Sin firma registrada en perfil
                        </span>
                      </div>
                    )}

                    <div className="border-t border-slate-200 w-full text-center pt-1.5 mt-1">
                      <p className="text-[11px] font-bold text-slate-900 leading-tight">
                        {doctorData.name}
                      </p>
                      <p className="text-[9.5px] font-medium text-slate-600 leading-tight">
                        {doctorData.specialty}
                      </p>
                      {doctorData.license ? (
                        <p className="text-[8.5px] font-mono font-bold text-[#008bcd] mt-0.5">
                          Matrícula / Reg. MSP: {doctorData.license}
                        </p>
                      ) : (
                        <p className="text-[8.5px] font-mono text-slate-400 mt-0.5">
                          Sin matrícula registrada
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {!editingId ? (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Firma del Paciente / Tutor</span>
                      {patientSignature ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Firmado
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          Falta firma
                        </span>
                      )}
                    </div>

                    <div
                      className={cn(
                        "border rounded-xl p-3 text-center transition-colors min-h-[95px] flex flex-col justify-center items-center shadow-2xs",
                        patientSignature
                          ? "bg-white border-slate-200 text-slate-900"
                          : "bg-card border-border/70 text-foreground"
                      )}
                    >
                      {patientSignature ? (
                        <div className="w-full flex flex-col items-center gap-2">
                          <img
                            src={patientSignature}
                            alt="Firma Paciente"
                            className="h-11 object-contain mix-blend-multiply"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsSignModalOpen(true)}
                              className="text-[10px] font-bold text-[#008bcd] hover:bg-[#008bcd]/10 h-6 px-2 rounded-md cursor-pointer"
                            >
                              <PenTool size={11} className="mr-1" /> Cambiar firma
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setPatientSignature(null)}
                              className="text-[10px] font-bold text-red-500 hover:bg-red-500/10 h-6 px-2 rounded-md cursor-pointer"
                            >
                              <RotateCcw size={11} className="mr-1" /> Quitar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full space-y-2 py-1">
                          <p className="text-[11px] text-muted-foreground font-medium">
                            El paciente aún no ha asentado su firma táctil
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSignModalOpen(true)}
                            className="w-full rounded-xl font-bold border-border/80 hover:bg-muted text-xs h-9 cursor-pointer shadow-2xs"
                          >
                            <PenTool size={13} className="mr-1.5 text-[#008bcd]" /> Firmar en Pantalla
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground bg-background rounded-xl border border-border/60">
                    <ShieldAlert className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                    Las firmas asentadas se conservan inalterables para auditoría legal.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <DialogFooter className="px-7 py-4 border-t border-border/70 bg-muted/10 flex flex-row items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold h-10 px-5 hover:bg-muted cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={isWorking || !noteContent.trim()}
              className="bg-[#008bcd] hover:bg-[#0074a8] text-white rounded-xl text-xs font-bold h-10 px-6 shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              {isWorking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              )}
              {editingId ? "Actualizar Evolución" : "Guardar Evolución"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL EMERGENTE DEDICADO PARA LA FIRMA DEL PACIENTE */}
      <Dialog open={isSignModalOpen} onOpenChange={setIsSignModalOpen}>
        <DialogContent className="sm:max-w-[650px] w-[95vw] bg-card border-border/80 rounded-2xl p-0 overflow-hidden font-sans shadow-2xl">
          <div className="px-6 py-4 border-b border-border/70 bg-muted/15 flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <PenTool className="w-4 h-4 text-[#008bcd]" /> Registrar Firma de Conformidad
            </DialogTitle>
          </div>
          <div className="p-6">
            <SignaturePad
              label="Firma del Paciente / Tutor Legal"
              onSign={(sigData: string) => {
                setPatientSignature(sigData)
                setIsSignModalOpen(false)
              }}
              onClear={() => setPatientSignature(null)}
              onCancel={() => setIsSignModalOpen(false)}
              confirmButtonText="Confirmar y Guardar Firma"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}