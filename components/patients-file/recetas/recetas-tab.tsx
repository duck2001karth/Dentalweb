"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Printer, Save, Trash2, Edit, Send, Loader2, CalendarIcon, PlusCircle, CheckCircle2, Search, Pill, PenTool } from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import DOMPurify from "isomorphic-dompurify"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog"

import { useGetPatient } from "@/hooks/patients"
import { PrescriptionPrint } from "./recetas-print"
import { PrescriptionEditor } from "./recetas-editor"
import { RecipeShareModal } from "./recipe-share-modal"

const calculateAge = (birthDateString?: string | Date | null) => {
  if (!birthDateString) return ""
  const today = new Date()
  const birthDate = new Date(birthDateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

const SignaturePad = ({ onSave, onCancel, title }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const startDrawing = (e: any) => { setIsDrawing(true); draw(e); }
  const stopDrawing = () => { setIsDrawing(false); canvasRef.current?.getContext("2d")?.beginPath(); }

  const draw = (e: any) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    if (e.type.includes('touch')) e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.strokeStyle = "#000000"
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const handleClear = () => canvasRef.current?.getContext("2d")?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  const handleSave = () => onSave(canvasRef.current?.toDataURL("image/png"))

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      <p className="font-medium text-xs text-muted-foreground">{title}</p>
      <div className="relative w-full rounded-xl border-2 border-dashed border-border/80 bg-white shadow-xs overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="cursor-crosshair w-full h-40"
        />
      </div>
      <div className="flex gap-2 w-full justify-end mt-2">
        <Button variant="outline" onClick={handleClear} className="rounded-xl font-bold">Limpiar lienzo</Button>
        <Button variant="ghost" onClick={onCancel} className="rounded-xl font-bold">Cancelar</Button>
        <Button onClick={handleSave} className="bg-primary hover:bg-[#0070a8] text-white font-bold rounded-xl shadow-sm">
          Guardar Firma
        </Button>
      </div>
    </div>
  )
}

export function RecetasTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const currentUser = session?.user as any
  const userRole = String(currentUser?.role || "").toUpperCase().trim()
  const isAdmin = userRole === "ADMIN" || userRole === "ADMINISTRADOR"
  const isDoctor = userRole === "DOCTOR"
  const canEditClinicalData = isDoctor || isAdmin

  const { patient } = useGetPatient(patientId)
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [medications, setMedications] = useState("")
  const [indications, setIndications] = useState("")
  const [observations, setObservations] = useState("")

  const [printingDoc, setPrintingDoc] = useState<any>(null)
  const [signingRecipe, setSigningRecipe] = useState<any>(null)
  const [pendingActionAfterSign, setPendingActionAfterSign] = useState<"print" | "whatsapp" | null>(null)
  
  const [sharingRecipe, setSharingRecipe] = useState<any>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // Estado para el modal destructivo unificado
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null)
  const [isDeletingRecipe, setIsDeletingRecipe] = useState(false)

  const patientFullName = patient ? `${patient.firstName} ${patient.lastName}` : "Cargando..."
  const patientDocId = patient?.ci || "No registrado"
  const patientAge = calculateAge(patient?.birthDate)
  const patientAllergies = patient?.medicalAlerts || "Ninguna registrada"
  const patientPhone = patient?.phone || ""

  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await fetch(`/api/prescriptions?patientId=${patientId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPrescriptions(data || [])
    } catch (e) {
      toast({ title: "Error al cargar recetas", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [patientId, toast])

  useEffect(() => {
    fetchPrescriptions()
  }, [fetchPrescriptions])

  useEffect(() => {
    if (!canEditClinicalData || !isDirty || isSaving) return
    if (!medications.trim() && !indications.trim() && !observations.trim()) return

    const timer = setTimeout(() => {
      handleSave(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [medications, indications, observations, isDirty, canEditClinicalData, isSaving])

  const handleSave = async (isAutoSave = false) => {
    if (!canEditClinicalData || isSaving) return
    if (!medications.trim() && !indications.trim() && !observations.trim()) {
      if (!isAutoSave) toast({ title: "La receta está vacía", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const method = editingId ? "PUT" : "POST"
      const url = editingId ? `/api/prescriptions/${editingId}` : `/api/prescriptions`

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          medications,
          indications,
          observations,
          authorId: currentUser?.id,
          doctorSignature: currentUser?.signatureBase64 || null,
          doctorLicense: currentUser?.professionalCard || currentUser?.licenseNumber || "",
        }),
      })

      if (!res.ok) throw new Error("Error en la respuesta del servidor")
      const savedDoc = await res.json()
      
      setIsDirty(false)

      if (!isAutoSave) {
        toast({ title: editingId ? "Receta actualizada" : "Receta creada con éxito", variant: "default" })
        handleNewRecipe()
        await fetchPrescriptions()
      } else {
        if (!editingId && savedDoc.id) {
          setEditingId(savedDoc.id)
        }
        await fetchPrescriptions()
      }
    } catch (error) {
      if (!isAutoSave) toast({ title: "Error al guardar la receta", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewRecipe = () => {
    setEditingId(null)
    setMedications("")
    setIndications("")
    setObservations("")
    setIsDirty(false)
  }

  const handleEdit = (p: any) => {
    if (!canEditClinicalData) return
    setEditingId(p.id)
    setMedications(p.medications || "")
    setIndications(p.indications || "")
    setObservations(p.observations || "")
    setIsDirty(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return
    setIsDeletingRecipe(true)
    try {
      const res = await fetch(`/api/prescriptions/${recipeToDelete}`, { method: "DELETE" })
      if (!res.ok) throw new Error("No se pudo eliminar")
      toast({ title: "Receta eliminada correctamente" })
      if (editingId === recipeToDelete) handleNewRecipe()
      fetchPrescriptions()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsDeletingRecipe(false)
      setRecipeToDelete(null)
    }
  }

  const handleWhatsApp = async (p: any) => {
    let sig = p.doctorSignature || p.author?.signatureBase64 || currentUser?.signatureBase64 || null
    let license = p.doctorLicense || p.author?.professionalCard || p.author?.licenseNumber || currentUser?.professionalCard || ""

    if (!sig) {
      try {
        const res = await fetch("/api/users/signature")
        if (res.ok) {
          const creds = await res.json()
          if (creds?.signatureBase64) sig = creds.signatureBase64
          if (creds?.professionalCard) license = creds.professionalCard
        }
      } catch {}
    }

    const docWithDoctorCredentials = {
      ...p,
      doctorSignature: sig,
      doctorLicense: license,
      doctorSpecialty: p.author?.specialty || currentUser?.specialty || "Ortodoncia",
      doctorName: p.author?.name || currentUser?.name || "Dr. Especialista",
    }

    setSharingRecipe(docWithDoctorCredentials)
    setIsShareModalOpen(true)
  }

  const handlePrintClick = async (p: any) => {
    let sig = p.doctorSignature || p.author?.signatureBase64 || currentUser?.signatureBase64 || null
    let license = p.doctorLicense || p.author?.professionalCard || p.author?.licenseNumber || currentUser?.professionalCard || ""

    if (!sig) {
      try {
        const res = await fetch("/api/users/signature")
        if (res.ok) {
          const creds = await res.json()
          if (creds?.signatureBase64) sig = creds.signatureBase64
          if (creds?.professionalCard) license = creds.professionalCard
        }
      } catch {}
    }

    const docToPrint = {
      ...p,
      doctorSignature: sig,
      doctorLicense: license,
      doctorSpecialty: p.author?.specialty || currentUser?.specialty || "Ortodoncia",
      doctorName: p.author?.name || currentUser?.name || "Dr. Especialista",
    }

    setPrintingDoc(docToPrint)
    setTimeout(() => {
      window.print()
      setTimeout(() => {
        setPrintingDoc(null)
      }, 500)
    }, 600)
  }

  const filteredPrescriptions = prescriptions.filter(p => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return p.medications?.toLowerCase().includes(term) ||
           p.indications?.toLowerCase().includes(term) ||
           p.author?.name?.toLowerCase().includes(term)
  })

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      
      {/* 1. IMPRESIÓN MODULAR DOBLE PÁGINA (Se mantiene para respetar el formato médico) */}
      <PrescriptionPrint
        printingDoc={printingDoc}
        patientFullName={patientFullName}
        patientAge={patientAge}
        patientDocId={patientDocId}
        patientAllergies={patientAllergies}
      />

      {/* 2. MODAL DE FIRMA DIGITAL */}
      <Dialog
        open={!!signingRecipe}
        onOpenChange={(open) => {
          if (!open) {
            setSigningRecipe(null)
            setPendingActionAfterSign(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-xl bg-card border-border rounded-[24px] shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border/70 bg-muted/15">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <PenTool className="w-5 h-5 text-[#008bcd]" /> Firma del Especialista
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {signingRecipe && (
              <SignaturePad
                title="Firme aquí para validar la receta digital antes de imprimir o compartir"
                onCancel={() => {
                  setSigningRecipe(null)
                  setPendingActionAfterSign(null)
                }}
                onSave={async (img: string) => {
                  try {
                    await fetch(`/api/prescriptions/${signingRecipe.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ doctorSignature: img })
                    })
                    const docConFirma = { ...signingRecipe, doctorSignature: img }
                    
                    setSigningRecipe(null)
                    fetchPrescriptions()

                    if (pendingActionAfterSign === "whatsapp") {
                      setSharingRecipe(docConFirma)
                      setIsShareModalOpen(true)
                    } else {
                      setPrintingDoc(docConFirma)
                      setTimeout(() => {
                        window.print()
                        setPrintingDoc(null)
                      }, 300)
                    }
                    setPendingActionAfterSign(null)
                  } catch (e) {
                    toast({ title: "Error al guardar firma", variant: "destructive" })
                  }
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. CABECERA Y ACCIONES */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-5 bg-card p-5 rounded-2xl border border-border shadow-sm sticky top-0 z-20 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#008bcd]" /> Recetas y Prescripciones
              </h2>
              {!canEditClinicalData && (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 tracking-wider">
                  SÓLO LECTURA
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-sm font-medium text-muted-foreground">
              Emisión y control farmacológico del paciente.
            </p>
            {isSaving && (
              <span className="text-[11px] bg-blue-500/10 text-blue-600 font-bold px-2 py-0.5 rounded-full flex items-center">
                <Loader2 className="w-3 h-3 mr-1 animate-spin"/> Guardando...
              </span>
            )}
            {!isSaving && isDirty && (
              <span className="text-[11px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded-full">
                Cambios sin guardar
              </span>
            )}
            {!isSaving && !isDirty && editingId && (
              <span className="text-[11px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1"/> Editando #{editingId.substring(0, 6).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar medicamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background border-border text-sm font-medium focus-visible:ring-[#008bcd] w-full h-11 rounded-xl"
            />
          </div>
          {canEditClinicalData && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleNewRecipe}
                className="bg-background text-foreground hover:bg-muted font-bold border-border rounded-xl h-11"
              >
                <PlusCircle size={16} className="mr-1.5 text-[#008bcd]"/> Nueva Receta
              </Button>
              <Button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="bg-primary hover:bg-[#0070a8] text-white font-bold rounded-xl h-11 shadow-sm transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="mr-2 w-4 h-4 animate-spin"/> : <Save className="mr-2 w-4 h-4"/>}
                Guardar Manual
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 4. CONTENIDO PRINCIPAL (Diseño Integrado Original) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
         
        {/* EDITOR (Izquierda) */}
        {canEditClinicalData && (
          <div className="lg:col-span-5">
            <PrescriptionEditor
              editingId={editingId}
              medications={medications} setMedications={setMedications}
              indications={indications} setIndications={setIndications}
              observations={observations} setObservations={setObservations}
              setIsDirty={setIsDirty}
            />
          </div>
        )}

        {/* HISTORIAL DE RECETAS (Derecha) */}
        <div className={cn("flex flex-col gap-5", canEditClinicalData ? "lg:col-span-7" : "lg:col-span-12")}>
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#008bcd] w-8 h-8"/></div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="bg-card border border-dashed border-border/80 rounded-2xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[300px]">
              <Pill className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold text-foreground text-lg">Sin Recetas</p>
              <p className="text-sm">No hay prescripciones registradas para este paciente.</p>
            </div>
          ) : (
            filteredPrescriptions.map((p) => {
              const canDeleteThis = isAdmin || (isDoctor && p.authorId === currentUser?.id)
              return (
                <div
                  key={p.id}
                  className={cn(
                    "bg-card border rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all hover:shadow-sm",
                    editingId === p.id ? "border-[#008bcd] ring-1 ring-[#008bcd]/20" : "border-border/80 hover:border-border"
                  )}
                >
                  <div className="bg-muted/15 px-5 py-3.5 border-b border-border/60 flex flex-wrap gap-3 justify-between items-center text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#008bcd]/10 flex items-center justify-center text-[#008bcd] font-bold text-xs shadow-xs">
                        {p.author?.name ? p.author.name.charAt(0) : "D"}
                      </div>
                      <span className="font-bold text-foreground">{p.author?.name || "Dr. Asignado"}</span>
                      {p.author?.specialty && (
                        <span className="text-[11px] text-muted-foreground font-normal">({p.author.specialty})</span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs font-medium flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-md border border-border/50">
                      <CalendarIcon size={12}/> {format(new Date(p.createdAt), "dd MMM yyyy - HH:mm", { locale: es })}
                    </div>
                  </div>

                  <div className="p-5 text-sm text-foreground whitespace-pre-wrap leading-relaxed [&>ul]:list-disc [&>ul]:ml-5">
                    <div className="mb-4">
                      <p className="font-extrabold text-[11px] text-[#008bcd] mb-1.5 uppercase tracking-wider flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5" /> R.P. (Medicamentos)
                      </p>
                      {/* Sanitización contra XSS */}
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.medications) }} className="pl-1"/>
                    </div>
                    
                    <div>
                      <p className="font-extrabold text-[11px] text-[#008bcd] mb-1.5 uppercase tracking-wider">
                        Indicaciones
                      </p>
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.indications) }} className="pl-1"/>
                    </div>

                    {p.observations && (
                      <div className="mt-4 pt-3 border-t border-dashed border-border/60 bg-amber-500/5 -mx-5 px-5 pb-1">
                        <p className="font-extrabold text-[11px] text-amber-600 mb-1.5 uppercase tracking-wider">
                          Observaciones Especiales
                        </p>
                        <div
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.observations) }}
                          className="text-foreground text-xs font-medium leading-relaxed pl-1"
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/10 px-4 py-3 border-t border-border/60 flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWhatsApp(p)}
                      className="text-[#25D366] hover:text-[#1da851] hover:bg-[#25D366]/10 border-[#25D366]/20 h-8 text-xs font-bold rounded-lg"
                    >
                      <Send size={14} className="mr-1.5"/> WhatsApp
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintClick(p)}
                      className="text-foreground hover:text-[#008bcd] hover:bg-[#008bcd]/10 border-border h-8 text-xs font-bold rounded-lg"
                    >
                      <Printer size={14} className="mr-1.5"/> Imprimir
                    </Button>

                    {canEditClinicalData && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(p)}
                        className="text-foreground hover:text-amber-600 hover:bg-amber-500/10 border-border h-8 text-xs font-bold rounded-lg"
                      >
                        <Edit size={14} className="mr-1.5"/> Editar
                      </Button>
                    )}

                    {canDeleteThis && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRecipeToDelete(p.id)}
                        className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 border-border/80 hover:border-destructive/30 rounded-lg cursor-pointer"
                      >
                        <Trash2 size={14} className="mr-1.5"/> Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* MODAL DESTRUCTIVO UNIFICADO */}
      <ConfirmDestructiveDialog
        isOpen={Boolean(recipeToDelete)}
        onClose={() => setRecipeToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeletingRecipe}
        title="¿Eliminar receta?"
        description="Esta acción eliminará el registro de forma permanente del expediente médico y quedará asentada en la auditoría."
        confirmText="Eliminar"
      />

      {/* 5. MODAL DE COMPARTIR RECETA */}
      {sharingRecipe && (
        <RecipeShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false)
            setSharingRecipe(null)
          }}
          patientName={patientFullName}
          patientPhone={patientPhone}
          patientAge={patientAge}
          patientAllergies={patientAllergies}
          recipeData={sharingRecipe}
          patientDocId={patientDocId}
          doctorSignature={sharingRecipe.doctorSignature || currentUser?.signatureBase64 || null}
          doctorLicense={
            sharingRecipe.doctorLicense ||
            currentUser?.professionalCard ||
            currentUser?.licenseNumber ||
            ""
          }
          doctorName={sharingRecipe.doctorName || currentUser?.name || "Dr. Especialista"}
          doctorSpecialty={sharingRecipe.doctorSpecialty || currentUser?.specialty || "Ortodoncia"}
        />
      )}
    </div>
  )
}