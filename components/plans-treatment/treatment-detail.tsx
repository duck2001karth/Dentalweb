"use client"

import React, { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { 
  ChevronLeft, Edit2, User, Users, ClipboardList, 
  Plus, ChevronDown, CheckCircle, FileSignature, 
  Loader2, Save, Edit, Search, AlertCircle, FileText
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { OdontogramaTab } from "@/components/patients-file/odontogram-tab"
import { TreatmentActions } from "./treatment-actions"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

// Helper para edad
const calculateAge = (birthDateString?: string | Date | null) => {
  if (!birthDateString) return ""
  const today = new Date()
  const birthDate = new Date(birthDateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

export function TreatmentPlanDetail({
  plan, patient, onBack, onSaveComment, isSavingComment,
}: {
  plan: any; patient: any; onBack: () => void; onSaveComment: (text: string) => void; isSavingComment: boolean
}) {
  const { toast } = useToast()

  // Estados
  const [isEditingComments, setIsEditingComments] = useState(false)
  const [commentText, setCommentText] = useState(plan.commentsToPatient || "")
  const [activeToothFromOdontogram, setActiveToothFromOdontogram] = useState<number | null>(null)
  
  const [discountPercent, setDiscountPercent] = useState(0)
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
  const [tempDiscount, setTempDiscount] = useState("0")

  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
  const [catalogItems, setCatalogItems] = useState<any[]>([])
  const [catalogSearch, setCatalogSearch] = useState("")
  const [isAddingProcedure, setIsAddingProcedure] = useState(false)

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [sectionName, setSectionName] = useState("")

  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false)
  const [evolutionProgress, setEvolutionProgress] = useState(0)
  const [selectedItemToEvolve, setSelectedItemToEvolve] = useState<any>(null)
  const [evolutionNote, setEvolutionNote] = useState("")

  // Cálculos Financieros
  const baseTotal = plan.totalCost || 0
  const discountAmount = baseTotal * (discountPercent / 100)
  const finalTotalCost = baseTotal - discountAmount
  const totalPaid = plan.totalPaid || 0
  const debt = finalTotalCost - totalPaid

  // Firmas y Consentimientos
  const docList = patient?.clinicalDocument || plan?.patient?.clinicalDocument || []
  const noteList = patient?.clinicalNotes || plan?.patient?.clinicalNotes || []
  const signedConsents = docList.filter((doc: any) => doc.patientSignature)
  const signedEvolutions = noteList.filter((note: any) => note.patientSignature)
  
  const autoRecoveredSignature = 
    patient?.signatureBase64 || plan?.patient?.signatureBase64 ||
    (signedConsents.length > 0 ? signedConsents[0].patientSignature : null) || 
    (signedEvolutions.length > 0 ? signedEvolutions[0].patientSignature : null)

  const pendingConsents = docList.length - signedConsents.length
  const patientAge = calculateAge(patient?.birthDate)

  // Acciones
  const handleSaveComments = () => { {onSaveComment(commentText); setIsEditingComments(false)} }
  const handleApplyDiscount = () => {
    const val = parseFloat(tempDiscount); if (!isNaN(val) && val >= 0 && val <= 100) setDiscountPercent(val)
    setIsDiscountModalOpen(false)
  }
  const handleAddSection = () => {
    if (!sectionName.trim()) return;
    toast({ title: "Sección agregada", description: `Fase: ${sectionName}`, variant: "success" })
    setIsSectionModalOpen(false); setSectionName("")
  }
  const openCatalogModal = async () => {
    setIsCatalogModalOpen(true)
    try {
      const res = await fetch('/api/admin/catalog'); if (res.ok) setCatalogItems((await res.json()).filter((item: any) => item.isActive))
    } catch (error) { toast({ title: "Error", description: "No se pudo cargar el catálogo.", variant: "destructive" }) }
  }
  const handleAddManualProcedure = async (procedure: any) => {
    setIsAddingProcedure(true)
    try {
      const res = await fetch(`/api/treatments/${plan.id}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ procedureId: procedure.id, name: procedure.name, price: procedure.basePrice, toothNumber: null, surfaces: [] })
      });
      if (!res.ok) throw new Error();
      toast({ title: "Prestación agregada", variant: "success" }); setIsCatalogModalOpen(false); window.location.reload(); 
    } catch (e) { toast({ title: "Error", variant: "destructive" }) } finally { setIsAddingProcedure(false) }
  }
  const openEvolutionModal = (item: any, progress: number) => { setSelectedItemToEvolve(item); setEvolutionProgress(progress); setEvolutionNote(""); setIsEvolutionModalOpen(true) }
  const handleSaveEvolution = () => { setIsEvolutionModalOpen(false); toast({ title: "Evolución registrada", variant: "success" }) }

  const filteredCatalog = catalogItems.filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || p.category.toLowerCase().includes(catalogSearch.toLowerCase()))
  const getSignatureSrc = (base64String: string) => base64String.includes('data:image') ? base64String : `data:image/png;base64,${base64String}`

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-500 pb-20 relative">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 2cm; background: white; color: black; font-family: sans-serif; }
          .print-hidden { display: none !important; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; z-index: -1; width: 500px; pointer-events: none; }
          @page { size: auto; margin: 0mm; }
        }
      `}</style>

      <div className="hidden print:block print-container">
        <img src="/logosn.png" alt="Marca de Agua" className="watermark" />
        
        {/* Cabecera del PDF */}
        <div className="flex justify-between items-end border-b-2 border-[#00b0e9] pb-4 mb-6">
          <div>
            <h1 className="text-4xl font-black text-[#00b0e9] tracking-tighter">CARMODENTAL</h1>
            <p className="text-sm font-bold text-slate-700 tracking-widest uppercase">Clínica de Especialidades Odontológicas</p>
          </div>
          <div className="text-right text-xs font-bold text-slate-700">
            <p>{plan.doctor?.name || "Dr. Asignado"}</p>
            <p>RUC.: 1719231696001</p>
          </div>
        </div>

        <div className="flex justify-between text-sm mb-6">
          <p>Fecha de emisión: <b>{format(new Date(), "dd/MM/yyyy")}</b></p>
          <p className="font-black text-red-600">Nº {plan.id?.slice(-6)?.toUpperCase()}</p>
        </div>

        {/* Datos del paciente en PDF */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-sm mb-8 space-y-2">
          <div className="flex justify-between">
            <p><span className="font-bold text-[#00b0e9]">Paciente:</span> {patient?.firstName} {patient?.lastName}</p>
            <p><span className="font-bold text-[#00b0e9]">Edad:</span> {patientAge ? `${patientAge} Años` : "--"}</p>
          </div>
          <p><span className="font-bold text-[#00b0e9]">Doc. Identidad:</span> {patient?.ci}</p>
          <p><span className="font-bold text-red-600">Alergias:</span> {patient?.medicalAlerts || "Ninguna registrada"}</p>
        </div>

        {/* Tabla de Prestaciones PDF */}
        <h3 className="text-xl font-bold text-[#00b0e9] border-b border-slate-200 pb-2 mb-4">Presupuesto de Tratamiento</h3>
        <table className="w-full text-sm mb-8">
          <thead className="bg-slate-100 font-bold">
            <tr>
              <th className="text-left p-2 border border-slate-200">Prestación</th>
              <th className="text-center p-2 border border-slate-200">Pieza</th>
              <th className="text-right p-2 border border-slate-200">Costo</th>
            </tr>
          </thead>
          <tbody>
            {plan.items?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="p-2 border border-slate-200">{item.procedureName}</td>
                <td className="text-center p-2 border border-slate-200">{item.tooth || "-"}</td>
                <td className="text-right p-2 border border-slate-200">${item.cost?.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales PDF */}
        <div className="flex justify-end mb-8">
          <div className="w-1/3 text-sm space-y-2">
            <div className="flex justify-between"><span className="font-bold">Subtotal:</span><span>${baseTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between"><span className="font-bold">Descuento ({discountPercent}%):</span><span>-${discountAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between text-lg font-black text-[#00b0e9] border-t border-slate-200 pt-2"><span className="font-bold">TOTAL:</span><span>${finalTotalCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
          </div>
        </div>

        {/* Observaciones PDF */}
        <div className="mb-16">
          <h4 className="font-bold text-[#00b0e9] mb-2">Observaciones / Indicaciones:</h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{commentText || "Validez del plan de tratamiento por 30 días. Plan sujeto a evaluación clínica."}</p>
        </div>

        {/* Firmas PDF */}
        <div className="flex justify-around items-end mt-20 pt-10">
          <div className="text-center">
             <div className="h-16 w-40 border-b border-black mb-2 flex items-end justify-center">
                {/* Simulador de firma del doctor si existiera */}
             </div>
             <p className="font-bold text-xs uppercase">FIRMA DEL PROFESIONAL</p>
          </div>
          <div className="text-center">
             <div className="h-16 w-40 border-b border-black mb-2 flex items-end justify-center">
                {autoRecoveredSignature && <img src={getSignatureSrc(autoRecoveredSignature)} className="h-14 w-auto object-contain" />}
             </div>
             <p className="font-bold text-xs uppercase">FIRMA DEL PACIENTE</p>
             <p className="text-[10px]">CI: {patient?.ci}</p>
          </div>
        </div>

        {/* Footer PDF */}
        <div className="fixed bottom-10 left-0 w-full text-center text-xs text-[#00b0e9] border-t-2 border-[#00b0e9] pt-4">
          <p className="font-bold">DIRECCIÓN: SOLANDA SECTOR 4, JOSÉ ARGUDO S24-72 Y AV. SOLANDA</p>
          <p>Cel.: 0998 990 215 • e-mail: carmodental@gmail.com • Quito - Ecuador</p>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* VISTA NORMAL DE PANTALLA (INTERFAZ DE USUARIO) */}
      {/* ========================================================================= */}
      <div className="print-hidden">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
          <Button variant="outline" size="icon" onClick={onBack} className="h-9 w-9 rounded-xl shadow-sm border-border bg-background hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
              Plan de tratamiento <span className="text-[#00b0e9] font-medium">#{plan.id?.slice(-6)?.toUpperCase()}</span>
            </h2>
            <p className="text-sm text-muted-foreground font-medium">Paciente: {patient?.firstName} {patient?.lastName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SIDEBAR IZQUIERDO */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 sticky top-24 self-start">
            <div className="shadow-lg rounded-xl overflow-hidden border border-border bg-card">
              <div className="bg-[#00b0e9] p-5 text-white relative">
                <p className="text-sm font-semibold opacity-90 mb-1">Plan de tratamiento</p>
                <h3 className="text-2xl font-black leading-tight">{plan.name}</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="text-center pb-4 border-b border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Presupuesto total</p>
                  <h4 className="text-4xl font-black text-[#00b0e9]">${finalTotalCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</h4>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-foreground">
                  <span>Descuento comercial</span>
                  <span className="flex items-center gap-2 cursor-pointer hover:text-[#00b0e9]" onClick={() => { setTempDiscount(discountPercent.toString()); setIsDiscountModalOpen(true); }}>
                    {discountPercent}% <Edit2 className="w-3 h-3" />
                  </span>
                </div>
                <div className="space-y-2 text-sm pt-2">
                  <div className="flex justify-between text-muted-foreground border-b border-dashed border-border pb-1"><span>Realizado</span><span>$0.00</span></div>
                  <div className="flex justify-between text-muted-foreground border-b border-dashed border-border pb-1"><span>Abonado</span><span>${totalPaid.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                  <div className="flex justify-between font-bold text-foreground pt-1"><span>Saldo por abonar</span><span>${debt.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                </div>
                <Button className="w-full bg-[#00b0e9] hover:bg-[#0095c6] text-white font-bold mt-2">Cotizar con convenios</Button>
              </div>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-5 space-y-5 text-sm">
              <div className="flex gap-3"><User className="w-5 h-5 text-muted-foreground" /><div><p className="text-xs font-semibold text-muted-foreground">Profesional a cargo</p><p className="font-bold text-[#00b0e9]">{plan.doctor?.name || "Dr(a) Asignado"}</p></div></div>
              <div className="flex gap-3"><Users className="w-5 h-5 text-muted-foreground" /><div><p className="text-xs font-semibold text-muted-foreground">Colaboradores</p><button className="font-bold text-[#00b0e9] hover:underline">Asignar colaboradores</button></div></div>
              <div className="flex gap-3"><ClipboardList className="w-5 h-5 text-muted-foreground" /><div><p className="text-xs font-semibold text-muted-foreground">Convenio / EPS</p><p className="font-bold text-foreground">{patient?.convenio || "Sin convenio"}</p></div></div>
            </div>
          </div>

          {/* PANEL DERECHO */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            
            {/* ODONTOGRAMA */}
            <div className="bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-muted/20 border-b border-border">
                <OdontogramaTab patientId={patient?.id} planId={plan.id} isPlanView={true} onToothClickCallback={(toothNumber: number) => setActiveToothFromOdontogram(toothNumber)} />
              </div>
            </div>

            {/* PRESTACIONES */}
            <div className="bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border flex flex-wrap gap-2 items-center justify-between bg-slate-50 dark:bg-muted/10">
                 <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={() => setIsSectionModalOpen(true)} className="text-[#00b0e9] border-[#00b0e9] hover:bg-[#00b0e9]/10"><Plus className="w-4 h-4 mr-1"/> Sección</Button>
                   <Button variant="outline" size="sm" onClick={openCatalogModal} className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"><Plus className="w-4 h-4 mr-1"/> Prestación</Button>
                   
                   {/* NUEVO MENÚ DE ACCIONES */}
                   <TreatmentActions planId={plan.id} patientEmail={patient?.email} onClearPlan={() => console.log("Vaciar presupuesto")} />
                 </div>
                 <div className="text-sm font-semibold text-[#00b0e9] cursor-pointer">Arcadas y Sextantes <ChevronDown className="w-4 h-4 inline" /></div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs uppercase text-muted-foreground font-bold border-b border-border bg-white dark:bg-card">
                    <tr>
                      <th className="px-4 py-3 w-10"></th><th className="px-4 py-3">Prestación</th><th className="px-4 py-3 text-center">Pieza</th>
                      <th className="px-4 py-3 text-center">Dscto</th><th className="px-4 py-3 text-right">Precio</th><th className="px-4 py-3 text-center">Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {plan.items?.length > 0 ? (
                      plan.items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" className="w-8 h-8 p-0 rounded-full border-2 border-slate-300 hover:border-[#00b0e9]"></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem className="font-bold text-emerald-600" onClick={() => openEvolutionModal(item, 100)}>Realizar (100%)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEvolutionModal(item, 50)}>Evolucionar (50%)</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500" onClick={() => openEvolutionModal(item, 0)}>Deshacer (0%)</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{item.procedureName}</td>
                          <td className="px-4 py-3 text-center">{item.tooth ? <span className="border border-border rounded px-2 py-1 text-xs">{item.tooth}</span> : <span className="text-muted-foreground">-</span>}</td>
                          <td className="px-4 py-3 text-center">0%</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-200">${item.cost?.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                          <td className="px-4 py-3 text-center"><div className="w-3 h-3 rounded-full bg-red-500 mx-auto"></div></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No hay prestaciones agregadas. Usa el odontograma o el botón "+ Prestación".</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN DOCUMENTOS Y FIRMAS */}
            <div className="bg-white dark:bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
              
              <div className="border-b border-border pb-4 flex justify-between items-center">
                <h4 className="text-lg font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Firma de Conformidad</h4>
              </div>

              {/* LIENZO BLANCO PARA LA FIRMA (Soluciona Modo Oscuro/Claro) */}
              {autoRecoveredSignature ? (
                 <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                   <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center h-20 w-40">
                     <img src={getSignatureSrc(autoRecoveredSignature)} alt="Firma" className="max-h-full max-w-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                   </div>
                   <div>
                     <p className="font-extrabold text-emerald-800 dark:text-emerald-400 text-sm mb-0.5">Firma recuperada automáticamente</p>
                     <p className="text-xs text-emerald-600/80 dark:text-emerald-500 font-medium">El sistema ha vinculado una firma válida de los registros clínicos previos del paciente.</p>
                   </div>
                 </div>
              ) : (
                 <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
                   <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                   <div>
                     <p className="font-bold text-amber-800 dark:text-amber-400 text-sm">Pendiente de firma</p>
                     <p className="text-xs text-amber-700 dark:text-amber-500 mb-3">El paciente no ha firmado ningún documento. Solicite la firma de este presupuesto.</p>
                     <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-8"><FileSignature className="w-4 h-4 mr-1"/> Capturar firma digital</Button>
                   </div>
                 </div>
              )}
              {/* CONSENTIMIENTOS */}
              <div className="border-t border-border pt-6">
                <h5 className="font-bold text-sm mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400"/> Consentimientos Informados</h5>
                {signedConsents.length > 0 ? (
                   <div className="space-y-2 mb-4">
                     {signedConsents.map((doc: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-muted/20 border border-border rounded-lg">
                          <span className="text-sm font-semibold">{doc.title || "Consentimiento Informado"}</span>
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">Firmado</span>
                        </div>
                     ))}
                   </div>
                ) : ( <p className="text-sm text-muted-foreground mb-4">No se han registrado consentimientos firmados para este paciente.</p> )}
                
                {/* BOTÓN FANTASMA/OUTLINE LIGERO */}
              <Link href={`/paciente/${patient.id}?tab=consentimientos`}>
                  <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 bg-transparent font-medium rounded-lg">
                    <Plus className="w-4 h-4 mr-1.5"/> Redactar nuevo consentimiento
                  </Button>
                </Link>
              </div>
              {/* OBSERVACIONES CLÍNICAS REFINADAS */}
              <div className="border-t border-border pt-6">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-bold text-sm text-foreground flex items-center gap-2">
                    Observaciones Clínicas 
                    <span className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider bg-muted/50 px-2 py-0.5 rounded-md">Visible en impresión</span>
                  </h5>
                  {isEditingComments ? (
                    <Button onClick={handleSaveComments} disabled={isSavingComment} size="sm" className="bg-[#00b0e9] hover:bg-[#0095c6] text-white shadow-sm rounded-xl h-8 px-4 font-bold">
                      {isSavingComment ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />} Guardar
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingComments(true)} className="text-[#00b0e9] hover:bg-[#00b0e9]/10 rounded-xl h-8 px-4 font-bold">
                      <Edit className="w-3 h-3 mr-1.5" /> Editar nota
                    </Button>
                  )}
                </div>
                
                {isEditingComments ? (
                  <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} className="min-h-[120px] bg-background border-border rounded-xl shadow-inner focus-visible:ring-[#00b0e9] resize-none p-4" placeholder="Recomendaciones post-tratamiento, condiciones de validez del presupuesto..." />
                ) : (
                  <div className="relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00b0e9] rounded-l-xl"></div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 p-5 pl-6 bg-slate-50/50 dark:bg-muted/10 rounded-xl border border-border/60 min-h-[80px] whitespace-pre-wrap leading-relaxed shadow-sm">
                      {commentText || <span className="italic text-muted-foreground">Validez del plan de tratamiento por 30 días. Plan sujeto a evaluación clínica.</span>}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALES FLOTANTES */}
      {/* ========================================================================= */}
      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent className="sm:max-w-[400px]"><DialogHeader><DialogTitle>Agregar Nueva Sección</DialogTitle></DialogHeader><div className="py-4"><p className="text-sm text-muted-foreground mb-4">Agrupa tus prestaciones por fases.</p><Input placeholder="Nombre de la sección..." value={sectionName} onChange={(e) => setSectionName(e.target.value)} autoFocus /></div><DialogFooter><Button variant="outline" onClick={() => setIsSectionModalOpen(false)}>Cancelar</Button><Button onClick={handleAddSection} className="bg-[#00b0e9] text-white">Crear Sección</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
        <DialogContent className="sm:max-w-[400px]"><DialogHeader><DialogTitle>Descuento comercial</DialogTitle></DialogHeader><div className="py-4"><p className="text-sm text-muted-foreground mb-4">Porcentaje de descuento aplicado al presupuesto.</p><div className="relative"><Input type="number" min="0" max="100" value={tempDiscount} onChange={(e) => setTempDiscount(e.target.value)} className="pr-8" /><span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">%</span></div></div><DialogFooter><Button variant="outline" onClick={() => setIsDiscountModalOpen(false)}>Cancelar</Button><Button onClick={handleApplyDiscount} className="bg-[#00b0e9] text-white">Aplicar descuento</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0"><DialogHeader className="p-6 border-b border-border pb-4"><DialogTitle>Catálogo de Prestaciones</DialogTitle></DialogHeader><div className="p-4 border-b border-border bg-muted/20"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" /><Input placeholder="Buscar por nombre o categoría..." value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} className="pl-9 bg-background" autoFocus/></div></div><div className="flex-1 overflow-y-auto p-2">{filteredCatalog.length > 0 ? filteredCatalog.map((proc) => (<button key={proc.id} onClick={() => handleAddManualProcedure(proc)} disabled={isAddingProcedure} className="w-full text-left p-4 hover:bg-muted/50 border-b border-border flex justify-between items-center transition-colors"><div><p className="font-bold text-foreground">{proc.name}</p><p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{proc.category}</p></div><p className="font-black text-emerald-600">${proc.basePrice.toLocaleString()}</p></button>)) : (<div className="p-10 text-center text-muted-foreground">No se encontraron prestaciones.</div>)}</div></DialogContent>
      </Dialog>

      <Dialog open={isEvolutionModalOpen} onOpenChange={setIsEvolutionModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-background"><DialogHeader><DialogTitle className="text-xl font-bold uppercase">Evolución para {patient?.firstName}</DialogTitle></DialogHeader><div className="py-4 space-y-4"><div><p className="text-sm font-semibold mb-2">Profesional que realizó la prestación</p><select className="w-full border border-border rounded-md h-10 px-3 text-sm bg-background"><option>{plan.doctor?.name || "Dr. Asignado"}</option></select></div><div><div className="flex justify-between items-center mb-2"><p className="text-sm font-semibold">Evolución escrita (opcional):</p></div><Textarea value={evolutionNote} onChange={(e) => setEvolutionNote(e.target.value)} className="min-h-[120px] resize-none" placeholder="Escriba los detalles clínicos aquí..."/></div></div><DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-muted/20 border-t border-border flex justify-end gap-2 -mx-6 -mb-6 mt-2"><Button variant="outline" onClick={() => setIsEvolutionModalOpen(false)} className="font-bold">Cancelar</Button><Button onClick={handleSaveEvolution} className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold px-6">Evolucionar ({evolutionProgress}%)</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}