"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Printer, Save, Trash2, Edit, Send, Loader2, Bold, Italic, List, CalendarIcon, PlusCircle, CheckCircle2, X } from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { useGetPatient } from "@/hooks/patients"

// --- UTILIDAD: CALCULAR EDAD ---
const calculateAge = (birthDateString?: string | Date | null) => {
  if (!birthDateString) return ""
  const today = new Date()
  const birthDate = new Date(birthDateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

// --- COMPONENTE INTERNO: PAD DE FIRMAS ---
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
          <Button onClick={handleSave} className="bg-[#008bcd] text-white">Guardar Firma</Button>
        </div>
      </div>
    </div>
  )
}

// --- COMPONENTE INTERNO: EDITOR ENRIQUECIDO ---
const RichEditor = ({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder: string }) => {
  const editorRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || ""
    }
  }, [value])

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    let html = e.currentTarget.innerHTML;
    if (html === '<br>' || html === '<div><br></div>' || html.trim() === '') {
      html = '';
      if (editorRef.current) editorRef.current.innerHTML = '';
    }
    onChange(html);
  }

  const isEmpty = !value || value === '<br>' || value === '<div><br></div>' || value.trim() === '';

  return (
    <div className="relative w-full">
      {isEmpty && (
        <div className="absolute top-2 left-2 text-sm text-muted-foreground pointer-events-none select-none">
          {placeholder}
        </div>
      )}
      <div 
        ref={editorRef} 
        contentEditable 
        onInput={handleInput}
        className="w-full min-h-[120px] outline-none text-sm text-foreground p-2 focus:bg-muted/10 rounded-lg cursor-text border border-border bg-background"
      />
    </div>
  )
}

// --- COMPONENTE PRINCIPAL ---
export function RecetasTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  // --- REGLAS DE SEGURIDAD POR ROL ---
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
  
  const [printingDoc, setPrintingDoc] = useState<any>(null)
  const [signingRecipe, setSigningRecipe] = useState<any>(null)

  // VARIABLES DEL MEMBRETE
  const patientFullName = patient ? `${patient.firstName} ${patient.lastName}` : "Cargando..."
  const patientDocId = patient?.ci || "No registrado"
  const patientAge = calculateAge(patient?.birthDate)
  const patientAllergies = patient?.medicalAlerts || "Ninguna registrada"
  const patientPhone = patient?.phone || ""
  
  const today = format(new Date(), "dd/MM/yyyy")

  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await fetch(`/api/prescriptions?patientId=${patientId}`)
      const data = await res.json()
      setPrescriptions(data || [])
    } catch (e) { toast({ title: "Error al cargar recetas", variant: "destructive" }) } 
    finally { setIsLoading(false) }
  }, [patientId, toast])

  useEffect(() => { fetchPrescriptions() }, [fetchPrescriptions])

  // Autoguardado (Solo activo si tiene permisos)
  useEffect(() => {
    if (!canEditClinicalData) return;
    const timer = setTimeout(() => {
      if (isDirty && (medications.trim() || indications.trim())) handleSave(true)
    }, 1500);
    return () => clearTimeout(timer);
  }, [medications, indications, isDirty, canEditClinicalData]);

  const handleSave = async (isAutoSave = false) => {
    if (!canEditClinicalData) return;

    if (!medications.trim() && !indications.trim()) {
      if (!isAutoSave) toast({ title: "La receta está vacía", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const method = editingId ? "PUT" : "POST"
      const url = editingId ? `/api/prescriptions/${editingId}` : `/api/prescriptions`
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, medications, indications, authorId: currentUser?.id })
      })
      const savedDoc = await res.json()
      
      if (!isAutoSave) {
        toast({ title: editingId ? "Receta actualizada" : "Receta creada", variant: "success" })
        handleNewRecipe() 
      } else {
        if (!editingId && savedDoc.id) setEditingId(savedDoc.id)
        setIsDirty(false)
      }
      
      fetchPrescriptions()
    } catch (error) { 
      if (!isAutoSave) toast({ title: "Error al guardar", variant: "destructive" }) 
    } finally { 
      setIsSaving(false) 
    }
  }

  const handleNewRecipe = () => { 
    setEditingId(null); setMedications(""); setIndications(""); setIsDirty(false); 
  }

  const handleEdit = (p: any) => {
    if (!canEditClinicalData) return;
    setEditingId(p.id); setMedications(p.medications); setIndications(p.indications); setIsDirty(false);
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!canEditClinicalData) return;
    try {
      await fetch(`/api/prescriptions/${id}`, { method: "DELETE" })
      toast({ title: "Receta eliminada", variant: "success" })
      if (editingId === id) handleNewRecipe()
      fetchPrescriptions()
    } catch (error) { toast({ title: "Error", variant: "destructive" }) }
  }

  const handleWhatsApp = (p: any) => {
    if (!patientPhone) return toast({ title: "Atención", description: "El paciente no tiene celular registrado.", variant: "destructive" })
    
    const htmlToWA = (html: string) => {
      let t = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<div[^>]*>/gi, '')
      t = t.replace(/<\/p>/gi, '\n').replace(/<p[^>]*>/gi, '')
      t = t.replace(/<\/li>/gi, '\n').replace(/<li[^>]*>/gi, '- ')
      t = t.replace(/<ul>/gi, '').replace(/<\/ul>/gi, '')
      t = t.replace(/<b>(.*?)<\/b>/gi, '*$1*').replace(/<strong>(.*?)<\/strong>/gi, '*$1*')
      t = t.replace(/<i>(.*?)<\/i>/gi, '_$1_').replace(/<em>(.*?)<\/em>/gi, '_$1_')
      return t.replace(/<[^>]+>/g, '').trim()
    }

    const msg = `Hola ${patientFullName},\nAquí tienes tu receta médica de *Carmodental*:\n\n*Medicamentos (R.P.):*\n${htmlToWA(p.medications)}\n\n*Indicaciones:*\n${htmlToWA(p.indications)}\n\n_Que te mejores pronto._`
    window.open(`https://wa.me/${patientPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const applyFormat = (e: React.MouseEvent, cmd: string) => {
    e.preventDefault()
    document.execCommand(cmd, false, "")
    setIsDirty(true)
  }

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      
      {/* ----------------------------------------------------------- */}
      {/* CSS DE IMPRESIÓN Y MARCA DE AGUA */}
      {/* ----------------------------------------------------------- */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; } 
          body { margin: 0; padding: 0; background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden; }
          .print-wrapper { display: flex; flex-direction: row; width: 100vw; height: 100vh; max-height: 100vh; background: white; color: black; overflow: hidden; page-break-after: avoid; page-break-inside: avoid; box-sizing: border-box; }
          .print-pane { width: 50vw; height: 100vh; border-right: 1px dashed #9ca3af; padding: 1.5cm; box-sizing: border-box; display: flex; flex-direction: column; position: relative; }
          .print-pane:last-child { border-right: none; }
          
          /* Marca de Agua Centrada Perfectamente en cada panel */
          .watermark-container {
            display: flex !important; position: absolute !important; top: 0; left: 0; right: 0; bottom: 0;
            justify-content: center; align-items: center; z-index: -1; pointer-events: none; opacity: 0.15;
          }
          .watermark-img { width: 350px; grayscale: 100%; }
        }
      `}</style>

      {/* PLANTILLA DE IMPRESIÓN */}
      {printingDoc && (
        <div className="hidden print:flex fixed inset-0 z-50 print-wrapper text-sm bg-white">
          
          {/* LADO 1: R.P. */}
          <div className="print-pane relative">
            <div className="hidden print:flex watermark-container">
               <img src="/logosn.png" alt="Watermark" className="watermark-img" />
            </div>

            <div className="flex justify-between items-start mb-4 border-b-2 border-[#008bcd] pb-3">
              <div>
                <h1 className="text-2xl font-bold text-[#008bcd] tracking-tight uppercase">Carmodental</h1>
                <p className="text-[10px] font-bold text-slate-800 uppercase">Clínica de Especialidades Odontológicas</p>
              </div>
              <div className="text-right text-[10px] leading-tight">
                <p className="font-bold text-black">{printingDoc.author?.name || "Dr. Asignado"}</p>
                <p className="text-black">RUC.: 1719231696001</p>
              </div>
            </div>
            
            <div className="flex justify-between text-xs mb-2 text-black border-b border-slate-200 pb-2">
              <p>Fecha de emisión: <span className="font-semibold">{today}</span></p>
              <p className="text-red-600 font-bold">Nº {printingDoc.id.substring(0,6).toUpperCase()}</p>
            </div>
            
            <div className="text-xs mb-6 space-y-2 text-black bg-slate-50 p-3 rounded">
              <div className="flex justify-between">
                 <p><span className="font-bold text-[#008bcd]">Paciente:</span> {patientFullName}</p>
                 <p><span className="font-bold text-[#008bcd]">Edad:</span> {patientAge ? `${patientAge} Años` : "--"}</p>
              </div>
              <p><span className="font-bold text-[#008bcd]">Doc. Identidad:</span> {patientDocId}</p>
              <p><span className="font-bold text-red-600">Alergias:</span> {patientAllergies}</p>
            </div>

            <div className="flex-1 text-black">
              <h3 className="font-bold text-lg mb-3 text-[#008bcd] border-b border-slate-200 pb-1">Medicamentos (R.P.)</h3>
              <div className="whitespace-pre-wrap leading-relaxed [&>ul]:list-disc [&>ul]:ml-5 text-sm" dangerouslySetInnerHTML={{ __html: printingDoc.medications }} />
            </div>

            <div className="mt-4 shrink-0 flex flex-col justify-end pb-2">
              {printingDoc.doctorSignature ? (
                <div className="text-center border-t border-black pt-1 w-48 mx-auto mb-4">
                  <img src={printingDoc.doctorSignature} alt="Firma Doctor" className="h-12 object-contain mx-auto -mt-12 bg-white px-2" />
                  <p className="text-[9px] font-bold uppercase text-black">Firma del Profesional</p>
                </div>
              ) : (
                <div className="text-center border-t border-black w-48 pt-1 mx-auto mb-4 mt-8">
                   <p className="text-[9px] font-bold uppercase text-black">Firma del Profesional</p>
                </div>
              )}
              {/* PIE DE PÁGINA ADAPTADO AL RECETARIO FÍSICO */}
              <div className="border-t-2 border-[#008bcd] pt-2 text-[9px] text-slate-800 flex flex-col text-center">
                <p className="font-semibold uppercase tracking-wider mb-1">Dirección: Solanda Sector 4, José Argudo S24-72 y Av. Solanda</p>
                <p>Cel.: 0998 990 215 • e-mail: carmodental@gmail.com • Quito - Ecuador</p>
              </div>
            </div>
          </div>

          {/* LADO 2: INDICACIONES */}
          <div className="print-pane relative">
             <div className="hidden print:flex watermark-container">
               <img src="/logosn.png" alt="Watermark" className="watermark-img" />
            </div>

             <div className="flex justify-between items-start mb-4 border-b-2 border-[#008bcd] pb-3">
              <div>
                <h1 className="text-2xl font-bold text-[#008bcd] tracking-tight uppercase">Carmodental</h1>
                <p className="text-[10px] font-bold text-slate-800 uppercase">Clínica de Especialidades Odontológicas</p>
              </div>
              <div className="text-right text-[10px] leading-tight">
                 <p className="font-bold text-black">{printingDoc.author?.name || "Dr. Asignado"}</p>
                 <p className="text-black">RUC.: 1719231696001</p>
              </div>
            </div>
            
            <div className="flex justify-between text-xs mb-2 text-black border-b border-slate-200 pb-2">
              <p>Fecha de emisión: <span className="font-semibold">{today}</span></p>
              <p className="text-red-600 font-bold">Nº {printingDoc.id.substring(0,6).toUpperCase()}</p>
            </div>
            
            <div className="text-xs mb-6 space-y-2 text-black bg-slate-50 p-3 rounded">
               <div className="flex justify-between">
                 <p><span className="font-bold text-[#008bcd]">Paciente:</span> {patientFullName}</p>
                 <p><span className="font-bold text-[#008bcd]">Edad:</span> {patientAge ? `${patientAge} Años` : "--"}</p>
              </div>
              <p><span className="font-bold text-[#008bcd]">Doc. Identidad:</span> {patientDocId}</p>
              <p><span className="font-bold text-red-600">Alergias:</span> {patientAllergies}</p>
            </div>

            <div className="flex-1 text-black">
              <h3 className="font-bold text-lg mb-3 text-[#008bcd] border-b border-slate-200 pb-1">Indicaciones</h3>
              <div className="whitespace-pre-wrap leading-relaxed [&>ul]:list-disc [&>ul]:ml-5 text-sm" dangerouslySetInnerHTML={{ __html: printingDoc.indications }} />
            </div>

            <div className="mt-4 shrink-0 flex flex-col justify-end pb-2">
               {printingDoc.doctorSignature ? (
                <div className="text-center border-t border-black pt-1 w-48 mx-auto mb-4">
                  <img src={printingDoc.doctorSignature} alt="Firma Doctor" className="h-12 object-contain mx-auto -mt-12 bg-white px-2" />
                  <p className="text-[9px] font-bold uppercase text-black">Firma del Profesional</p>
                </div>
              ) : (
                <div className="text-center border-t border-black w-48 pt-1 mx-auto mb-4 mt-8">
                   <p className="text-[9px] font-bold uppercase text-black">Firma del Profesional</p>
                </div>
              )}
              {/* PIE DE PÁGINA ADAPTADO AL RECETARIO FÍSICO */}
              <div className="border-t-2 border-[#008bcd] pt-2 text-[9px] text-slate-800 flex flex-col text-center">
                <p className="font-semibold uppercase tracking-wider mb-1">Dirección: Solanda Sector 4, José Argudo S24-72 y Av. Solanda</p>
                <p>Cel.: 0998 990 215 • e-mail: carmodental@gmail.com • Quito - Ecuador</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FIRMA */}
      <Dialog open={!!signingRecipe} onOpenChange={(open) => !open && setSigningRecipe(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Firma del Especialista</DialogTitle></DialogHeader>
          {signingRecipe && (
            <SignaturePad title="Firme aquí para validar la receta antes de imprimir" onCancel={() => setSigningRecipe(null)} 
              onSave={async (img: string) => {
                await fetch(`/api/prescriptions/${signingRecipe.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctorSignature: img }) })
                setPrintingDoc({ ...signingRecipe, doctorSignature: img }); setSigningRecipe(null);
                setTimeout(() => { window.print(); setPrintingDoc(null); }, 300)
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* CABECERA UI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm print:hidden sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Recetas y Prescripciones</h2>
          {!canEditClinicalData && (
             <span className="text-[10px] font-bold tracking-widest bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md">
               SÓLO LECTURA
             </span>
          )}
          {isSaving && <span className="text-xs text-muted-foreground flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> Guardando...</span>}
          {!isSaving && isDirty && <span className="text-xs text-amber-500 font-bold">Cambios sin guardar</span>}
          {!isSaving && !isDirty && editingId && <span className="text-xs text-emerald-500 font-bold flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Editando Borrador</span>}
        </div>
        
        {/* BOTONES: Solo el Doctor o Admin pueden guardar o crear nueva receta */}
        {canEditClinicalData && (
          <div className="flex gap-2 w-full sm:w-auto">
            {editingId && <Button variant="outline" onClick={handleNewRecipe} className="bg-background text-foreground"><PlusCircle size={14} className="mr-1"/> Nueva Receta</Button>}
            <Button onClick={() => handleSave(false)} className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold">
              <Save className="mr-2 w-4 h-4"/> Guardar Manual
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        
        {/* EDITOR ENRIQUECIDO (Solo Doctor o Admin) */}
        {canEditClinicalData && (
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className={cn("bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors", editingId ? "border-[#008bcd]/50 ring-2 ring-[#008bcd]/10" : "border-border")}>
              <div className="bg-muted/50 border-b border-border p-2 flex gap-1">
                <Button variant="ghost" size="icon" onMouseDown={(e) => applyFormat(e, 'bold')} className="w-8 h-8 rounded-sm text-muted-foreground"><Bold size={14}/></Button>
                <Button variant="ghost" size="icon" onMouseDown={(e) => applyFormat(e, 'italic')} className="w-8 h-8 rounded-sm text-muted-foreground"><Italic size={14}/></Button>
                <Button variant="ghost" size="icon" onMouseDown={(e) => applyFormat(e, 'insertUnorderedList')} className="w-8 h-8 rounded-sm text-muted-foreground"><List size={14}/></Button>
              </div>
              
              <div className="p-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">1. Medicamentos (R.P.)</label>
                  <RichEditor value={medications} onChange={(v) => {setMedications(v); setIsDirty(true)}} placeholder="Ej: Ibuprofeno 600mg #20" />
                </div>
                <div className="border-t border-border pt-4">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">2. Indicaciones</label>
                  <RichEditor value={indications} onChange={(v) => {setIndications(v); setIsDirty(true)}} placeholder="Ej: Tomar 1 tableta cada 8 horas por 5 días" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORIAL (Abarca todo el ancho si es recepcionista) */}
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
                  <div dangerouslySetInnerHTML={{__html: p.medications}} className="mb-3"/>
                  <p className="font-bold text-xs text-muted-foreground mb-1 uppercase">Indicaciones</p>
                  <div dangerouslySetInnerHTML={{__html: p.indications}}/>
                </div>
                <div className="bg-muted/10 px-4 py-2 border-t border-border flex flex-wrap justify-end gap-1">
                {/* WhatsApp e Imprimir están disponibles para todos (incluida recepcionista) */}
                <Button variant="ghost" size="sm" onClick={() => handleWhatsApp(p)} className="text-[#25D366] hover:text-[#1da851] hover:bg-[#25D366]/10 h-8 text-xs font-medium">
                  <Send size={14} className="mr-1.5"/> Enviar WhatsApp
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  if (!p.doctorSignature && canEditClinicalData) setSigningRecipe(p)
                  else { setPrintingDoc(p); setTimeout(() => { window.print(); setPrintingDoc(null) }, 300) }
                }} className="text-muted-foreground hover:text-[#008bcd] h-8 text-xs">
                  <Printer size={14} className="mr-1.5"/> Imprimir
                </Button>
                
                {/* Editar: SOLO para Doctor o Admin */}
                {canEditClinicalData && (
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="text-muted-foreground hover:text-amber-600 h-8 text-xs">
                    <Edit size={14} className="mr-1.5"/> Editar
                  </Button>
                )}

                {/* Eliminar: SOLO para Administrador */}
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