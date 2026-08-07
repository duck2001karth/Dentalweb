"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Printer, Save, Trash2, Edit, Send, Loader2, CalendarIcon, PlusCircle, CheckCircle2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { useGetPatient } from "@/hooks/patients"
import { PrescriptionPrint } from "./recetas-print"
import { PrescriptionEditor } from "./recetas-editor"

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
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.strokeStyle = "#000000"
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke(); ctx.beginPath(); ctx.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const handleClear = () => canvasRef.current?.getContext("2d")?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  const handleSave = () => onSave(canvasRef.current?.toDataURL("image/png"))

  return (
    <div className="flex flex-col gap-4 items-center">
      <p className="font-medium text-foreground">{title}</p>
      <div className="border-2 border-dashed border-border rounded-lg bg-white overflow-hidden touch-none">
        <canvas ref={canvasRef} width={400} height={200} 
          onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onMouseMove={draw}
          onTouchStart={startDrawing} onTouchEnd={stopDrawing} onTouchMove={draw} className="cursor-crosshair" />
      </div>
      <div className="flex gap-2 w-full justify-between mt-2">
        <Button variant="outline" onClick={handleClear}>Limpiar</Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-[#008bcd] text-white font-bold">Guardar Firma</Button>
        </div>
      </div>
    </div>
  )
}

export function RecetasTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"
  const canDeleteData = currentUser?.role === "ADMIN"

  const { patient } = useGetPatient(patientId)

  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [medications, setMedications] = useState("")
  const [indications, setIndications] = useState("")
  const [observations, setObservations] = useState("") 

  const [printingDoc, setPrintingDoc] = useState<any>(null)
  const [signingRecipe, setSigningRecipe] = useState<any>(null)

  const patientFullName = patient ? `${patient.firstName} ${patient.lastName}` : "Cargando..."
  const patientDocId = patient?.ci || "No registrado"
  const patientAge = calculateAge(patient?.birthDate)
  const patientAllergies = patient?.medicalAlerts || "Ninguna registrada"
  const patientPhone = patient?.phone || ""

  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await fetch(`/api/prescriptions?patientId=${patientId}`)
      const data = await res.json()
      setPrescriptions(data || [])
    } catch (e) { toast({ title: "Error al cargar recetas", variant: "destructive" }) }
    finally { setIsLoading(false) }
  }, [patientId, toast])

  useEffect(() => { fetchPrescriptions() }, [fetchPrescriptions])

  useEffect(() => {
    if (!canEditClinicalData) return
    const timer = setTimeout(() => {
      if (isDirty && (medications.trim() || indications.trim() || observations.trim())) handleSave(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [medications, indications, observations, isDirty, canEditClinicalData])

const handleSave = async (isAutoSave = false) => {
  if (!canEditClinicalData) return;

  if (!medications.trim() && !indications.trim() && !observations.trim()) {
    if (!isAutoSave) toast({ title: "La receta está vacía", variant: "destructive" });
    return;
  }

  setIsSaving(true);
  try {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/prescriptions/${editingId}` : `/api/prescriptions`;
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        patientId, 
        medications, 
        indications, 
        observations, // Envia el estado de observaciones
        authorId: currentUser?.id 
      })
    });

    if (!res.ok) throw new Error("Error en la respuesta del servidor");

    const savedDoc = await res.json();
    
    if (!isAutoSave) {
      toast({ title: editingId ? "Receta actualizada" : "Receta creada", variant: "success" });
      handleNewRecipe(); 
    } else {
      if (!editingId && savedDoc.id) setEditingId(savedDoc.id);
      setIsDirty(false);
    }
    
    // REFRESCA INMEDIATAMENTE LA LISTA EN PANTALLA
    await fetchPrescriptions();
  } catch (error) { 
    if (!isAutoSave) toast({ title: "Error al guardar", variant: "destructive" });
  } finally { 
    setIsSaving(false); 
  }
};

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

  const handleDelete = async (id: string) => {
    if (!canEditClinicalData) return
    try {
      await fetch(`/api/prescriptions/${id}`, { method: "DELETE" })
      toast({ title: "Receta eliminada", variant: "success" })
      if (editingId === id) handleNewRecipe()
      fetchPrescriptions()
    } catch (error) { toast({ title: "Error", variant: "destructive" }) }
  }

  // ENVÍO DE RECETA DIGITAL POR WHATSAPP (INCLUYE OBSERVACIONES)
  const handleWhatsApp = (p: any) => {
    if (!patientPhone) return toast({ title: "Atención", description: "El paciente no tiene celular registrado.", variant: "destructive" })

    const htmlToWA = (html: string) => {
      if (!html) return ""
      let t = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<div[^>]*>/gi, '')
      t = t.replace(/<\/p>/gi, '\n').replace(/<p[^>]*>/gi, '')
      t = t.replace(/<\/li>/gi, '\n').replace(/<li[^>]*>/gi, '- ')
      t = t.replace(/<ul>/gi, '').replace(/<\/ul>/gi, '')
      t = t.replace(/<b>(.*?)<\/b>/gi, '*$1*').replace(/<strong>(.*?)<\/strong>/gi, '*$1*')
      t = t.replace(/<i>(.*?)<\/i>/gi, '_$1_').replace(/<em>(.*?)<\/em>/gi, '_$1_')
      return t.replace(/<[^>]+>/g, '').trim()
    }

    let msg = `Hola *${patientFullName}*,\nAquí tienes tu receta médica de *Carmodental*:\n\n💊 *Medicamentos (R.P.):*\n${htmlToWA(p.medications)}\n\n📋 *Indicaciones:*\n${htmlToWA(p.indications)}`
    
    if (p.observations) {
      msg += `\n\n⚠️ *Observaciones / Recomendaciones:*\n${htmlToWA(p.observations)}`
    }

    msg += `\n\n_Que te mejores pronto._`

    window.open(`https://wa.me/${patientPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      
      {/* 1. IMPRESIÓN MODULAR */}
      <PrescriptionPrint 
        printingDoc={printingDoc} 
        patientFullName={patientFullName} 
        patientAge={patientAge} 
        patientDocId={patientDocId} 
        patientAllergies={patientAllergies} 
      />

      {/* 2. MODAL DE FIRMA */}
      <Dialog open={!!signingRecipe} onOpenChange={(open) => !open && setSigningRecipe(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Firma del Especialista</DialogTitle></DialogHeader>
          {signingRecipe && (
            <SignaturePad title="Firme aquí para validar la receta digital antes de imprimir" onCancel={() => setSigningRecipe(null)} 
              onSave={async (img: string) => {
                await fetch(`/api/prescriptions/${signingRecipe.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctorSignature: img }) })
                setPrintingDoc({ ...signingRecipe, doctorSignature: img }); setSigningRecipe(null)
                setTimeout(() => { window.print(); setPrintingDoc(null) }, 300)
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* CABECERA Y ACCIONES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm print:hidden sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Recetas y Prescripciones</h2>
          {!canEditClinicalData && (
            <span className="text-[10px] font-bold tracking-widest bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md">
              SÓLO LECTURA
            </span>
          )}
          {isSaving && (
            <span className="text-xs text-muted-foreground flex items-center">
              <Loader2 className="w-3 h-3 mr-1 animate-spin"/> Guardando...
            </span>
          )}
          {!isSaving && isDirty && (
            <span className="text-xs text-amber-500 font-bold">Cambios sin guardar</span>
          )}
          {!isSaving && !isDirty && editingId && (
            <span className="text-xs text-emerald-500 font-bold flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1"/> Editando Receta #{editingId.substring(0, 6).toUpperCase()}
            </span>
          )}
        </div>
        
        {canEditClinicalData && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* BOTÓN "NUEVA RECETA": SIEMPRE VISIBLE */}
            <Button 
              variant="outline" 
              onClick={handleNewRecipe} 
              className="bg-background text-foreground hover:bg-muted font-bold border-border rounded-xl"
            >
              <PlusCircle size={15} className="mr-1.5 text-[#008bcd]"/> Nueva Receta
            </Button>

            {/* BOTÓN GUARDAR MANUAL */}
            <Button 
              onClick={() => handleSave(false)} 
              disabled={isSaving}
              className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold rounded-xl shadow-sm"
            >
              {isSaving ? <Loader2 className="mr-2 w-4 h-4 animate-spin"/> : <Save className="mr-2 w-4 h-4"/>} 
              Guardar Manual
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        
        {/* 3. EDITOR MODULAR (Solo Doctor/Admin) */}
        {canEditClinicalData && (
          <PrescriptionEditor 
            editingId={editingId}
            medications={medications} setMedications={setMedications}
            indications={indications} setIndications={setIndications}
            observations={observations} setObservations={setObservations}
            setIsDirty={setIsDirty}
          />
        )}

        {/* HISTORIAL DE RECETAS */}
        <div className={cn("flex flex-col gap-4", canEditClinicalData ? "lg:col-span-7" : "lg:col-span-12")}>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#008bcd] w-8 h-8"/></div>
          ) : prescriptions.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center text-muted-foreground">No hay recetas previas para este paciente.</div>
          ) : (
            prescriptions.map((p) => (
              <div key={p.id} className={cn("bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors", editingId === p.id ? "border-[#008bcd]/50" : "border-border")}>
                
                <div className="bg-muted/30 px-4 py-3 border-b border-border flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#008bcd]/10 flex items-center justify-center text-[#008bcd] font-bold text-xs">{p.author?.name ? p.author.name.charAt(0) : "D"}</div>
                    <span className="font-semibold text-[#008bcd]">{p.author?.name || "Dr. Asignado"}</span>
                  </div>
                  <div className="text-muted-foreground text-xs flex items-center gap-2">
                    <CalendarIcon size={12}/> {format(new Date(p.createdAt), "dd MMM yyyy - HH:mm", { locale: es })}
                  </div>
                </div>

                <div className="p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed [&>ul]:list-disc [&>ul]:ml-5">
                  <p className="font-bold text-xs text-muted-foreground mb-1 uppercase">R.P.</p>
                  <div dangerouslySetInnerHTML={{ __html: p.medications }} className="mb-3"/>
                  
                  <p className="font-bold text-xs text-muted-foreground mb-1 uppercase">Indicaciones</p>
                  <div dangerouslySetInnerHTML={{ __html: p.indications }} className="mb-3"/>

                  {p.observations && (
                  <div className="mt-3 pt-2.5 border-t border-border/60">
                    <p className="font-bold text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                      Observaciones / Cuidados
                    </p>
                    <div 
                      dangerouslySetInnerHTML={{ __html: p.observations }} 
                      className="text-foreground text-xs font-medium leading-relaxed"
                    />
                  </div>
                )}
                </div>

                <div className="bg-muted/10 px-4 py-2 border-t border-border flex flex-wrap justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleWhatsApp(p)} className="text-[#25D366] hover:text-[#1da851] hover:bg-[#25D366]/10 h-8 text-xs font-medium">
                    <Send size={14} className="mr-1.5"/> Enviar WhatsApp
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (!p.doctorSignature && canEditClinicalData) setSigningRecipe(p)
                    else { setPrintingDoc(p); setTimeout(() => { window.print(); setPrintingDoc(null) }, 300) }
                  }} className="text-muted-foreground hover:text-[#008bcd] h-8 text-xs">
                    <Printer size={14} className="mr-1.5"/> Imprimir
                  </Button>

                  {canEditClinicalData && (
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="text-muted-foreground hover:text-amber-600 h-8 text-xs">
                      <Edit size={14} className="mr-1.5"/> Editar
                    </Button>
                  )}

                  {canDeleteData && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500 hover:bg-red-50 h-8 text-xs">
                          <Trash2 size={14} className="mr-1.5"/> Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-background border-border">
                        <AlertDialogHeader><AlertDialogTitle className="text-foreground">¿Eliminar receta?</AlertDialogTitle><AlertDialogDescription>Se eliminará de forma permanente del historial del paciente.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel className="text-foreground border-border">Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-red-600 text-white hover:bg-red-700">Eliminar</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}