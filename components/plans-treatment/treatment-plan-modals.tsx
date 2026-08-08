"use client"

import React, { useState, useEffect } from "react"
import { Search, ShieldCheck, Check, Plus, Loader2, DollarSign } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

import { EvolutionModal } from "@/components/plans-treatment/treatment-plan-evolution"

const CONVENIOS_DISPONIBLES = [
  { id: "conv-1", name: "Seguro Médico Dental Gold", discountPercent: 20 },
  { id: "conv-2", name: "Convenio Corporativo EPS", discountPercent: 15 },
  { id: "conv-3", name: "Plan Familiar Prevención", discountPercent: 10 },
  { id: "conv-4", name: "Seguro Universitario", discountPercent: 25 },
];

export function TreatmentPlanModals({
  plan, patient, currentUser,
  isSectionModalOpen, setIsSectionModalOpen, sectionName, setSectionName, handleAddSection,
  isDiscountModalOpen, setIsDiscountModalOpen, tempDiscount, setTempDiscount, handleApplyDiscount,
  isCatalogModalOpen, setIsCatalogModalOpen, catalogSearch, setCatalogSearch, filteredCatalog, handleAddManualProcedure, isAddingProcedure,
  isEvolutionModalOpen, setIsEvolutionModalOpen, evolutionProgress, selectedItemToEvolve, evolutionNote, setEvolutionNote, handleSaveEvolution,
  isDiagnosisModalOpen, setIsDiagnosisModalOpen, selectedDiagnosis, setSelectedDiagnosis, handleSaveDiagnosis,
  isMultiConvenioOpen, setIsMultiConvenioOpen, onApplyMultiConvenio,
  isPaymentModalOpen, setIsPaymentModalOpen, selectedItemToPay, paymentAmount, setPaymentAmount, paymentMethod, setPaymentMethod, handleSavePayment
}: any) {

  const { toast } = useToast()
  const [selectedConvenios, setSelectedConvenios] = useState<string[]>([])
  const [selectedToothForManual, setSelectedToothForManual] = useState<string>("")

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [templatesList, setTemplatesList] = useState<any[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState("")

  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateText, setNewTemplateText] = useState("")
  const [isSavingNewTemplate, setIsSavingNewTemplate] = useState(false)

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "DOCTOR";

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true)
    try {
      const res = await fetch('/api/admin/evolution-templates')
      if (res.ok) {
        const data = await res.json()
        setTemplatesList(data || [])
      }
    } catch (e) {
      console.error("Error al cargar plantillas", e)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  useEffect(() => {
    if (isTemplateModalOpen) {
      fetchTemplates();
    }
  }, [isTemplateModalOpen])

  const toggleConvenio = (id: string) => {
    setSelectedConvenios(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const handleApplyConvenios = () => {
    const totalDscto = selectedConvenios.reduce((acc, cId) => {
      const conv = CONVENIOS_DISPONIBLES.find(c => c.id === cId)
      return acc + (conv?.discountPercent || 0)
    }, 0)
    onApplyMultiConvenio(Math.min(totalDscto, 50));
    setIsMultiConvenioOpen(false);
  }

  const handleApplyTemplate = () => {
    const tpl = templatesList.find(t => t.id === selectedTemplateId)
    if (tpl) {
      setEvolutionNote((prev: string) => prev ? `${prev}\n${tpl.text}` : tpl.text)
      toast({ title: "Plantilla aplicada", description: tpl.name, variant: "success" })
    }
    setIsTemplateModalOpen(false)
  }

  const handleCreateNewTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateText.trim()) {
      toast({ title: "Campos requeridos", description: "Ingrese el nombre y texto de la plantilla.", variant: "destructive" });
      return;
    }
    setIsSavingNewTemplate(true);
    try {
      const res = await fetch('/api/admin/evolution-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTemplateName, text: newTemplateText })
      });

      if (!res.ok) throw new Error();

      toast({ title: "Plantilla creada correctamente", variant: "success" });
      setNewTemplateName("");
      setNewTemplateText("");
      setIsCreatingTemplate(false);
      await fetchTemplates();
    } catch (e) {
      toast({ title: "Error al guardar la plantilla", variant: "destructive" });
    } finally {
      setIsSavingNewTemplate(false);
    }
  }

  return (
    <>
      {/* 1. CREAR SECCIÓN */}
      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Agregar Nueva Sección</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Agrupa tus prestaciones por fases de tratamiento.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Nombre de la Fase / Sección</Label>
            <Input placeholder="Ej: Fase 1: Higiene y Operatoria" value={sectionName} onChange={(e) => setSectionName(e.target.value)} autoFocus className="bg-background border-border" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsSectionModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddSection} className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold">Crear Sección</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. DESCUENTO COMERCIAL */}
      <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card text-card-foreground border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Descuento Comercial</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Porcentaje global aplicado al presupuesto total.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative">
              <Input type="number" min="0" max="100" value={tempDiscount} onChange={(e) => setTempDiscount(e.target.value)} className="pr-10 bg-background border-border text-lg font-bold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-extrabold text-muted-foreground">%</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDiscountModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleApplyDiscount} className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold">Aplicar Descuento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. MULTI-CONVENIOS */}
      <Dialog open={isMultiConvenioOpen} onOpenChange={setIsMultiConvenioOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-5 border-b border-border bg-slate-900 text-white dark:bg-slate-950">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#008bcd]" /> Cotizar con múltiples convenios
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300">Seleccione los convenios vigentes aplicables a este plan.</DialogDescription>
          </DialogHeader>
          <div className="p-5 space-y-3 max-h-[320px] overflow-y-auto">
            {CONVENIOS_DISPONIBLES.map((conv) => {
              const isSelected = selectedConvenios.includes(conv.id)
              return (
                <div key={conv.id} onClick={() => toggleConvenio(conv.id)} className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${isSelected ? "border-[#008bcd] bg-[#008bcd]/10 font-bold" : "border-border bg-background hover:bg-muted/50"}`}>
                  <div>
                    <p className="text-sm font-bold text-foreground">{conv.name}</p>
                    <p className="text-xs text-emerald-600 font-extrabold">Descuento: {conv.discountPercent}%</p>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-[#008bcd]" />}
                </div>
              )
            })}
          </div>
          <DialogFooter className="p-4 bg-muted/20 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsMultiConvenioOpen(false)}>Cancelar</Button>
            <Button onClick={handleApplyConvenios} className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold rounded-xl px-5">Aplicar Convenios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. CATÁLOGO DE PRESTACIONES */}
      <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
        <DialogContent className="sm:max-w-[620px] h-[82vh] flex flex-col p-0 bg-card text-card-foreground border-border rounded-2xl overflow-hidden shadow-2xl">
          <DialogHeader className="p-5 border-b border-border bg-slate-900 text-white dark:bg-slate-950">
            <DialogTitle className="text-xl font-bold">Catálogo de Prestaciones</DialogTitle>
            <DialogDescription className="text-xs text-slate-300">Selecciona el procedimiento y asigna la pieza dental deseada.</DialogDescription>
          </DialogHeader>
          <div className="p-4 border-b border-border bg-muted/20 space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-bold shrink-0">Pieza Dental:</Label>
              <select value={selectedToothForManual} onChange={(e) => setSelectedToothForManual(e.target.value)} className="h-9 px-3 text-xs font-bold bg-background border border-border rounded-xl focus:ring-2 focus:ring-[#008bcd] outline-none">
                <option value="">-- Tratamiento General --</option>
                {["18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28","48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"].map(p => (
                  <option key={p} value={p}>Pieza {p}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Buscar prestación..." value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} className="pl-9 bg-background border-border text-xs" autoFocus />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredCatalog.length > 0 ? (
              filteredCatalog.map((proc: any) => (
                <button key={proc.id} onClick={() => { handleAddManualProcedure(proc, selectedToothForManual); setSelectedToothForManual(""); }} disabled={isAddingProcedure} className="w-full text-left p-3.5 hover:bg-accent border-b border-border/60 flex justify-between items-center transition-colors rounded-lg group">
                  <div>
                    <p className="font-bold text-foreground text-sm group-hover:text-[#008bcd]">{proc.name}</p>
                    <p className="text-[11px] text-muted-foreground font-semibold uppercase">{proc.category}</p>
                  </div>
                  <p className="font-black text-emerald-600 dark:text-emerald-400 text-base">${proc.basePrice?.toFixed(2)}</p>
                </button>
              ))
            ) : (
              <div className="p-10 text-center text-muted-foreground">No se encontraron prestaciones activas.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. EVOLUCIÓN CLÍNICA (COMPONENTE MODULAR EXTRAÍDO Y ADAPTATIVO) */}
      <EvolutionModal 
        isOpen={isEvolutionModalOpen}
        setIsOpen={setIsEvolutionModalOpen}
        patient={patient}
        plan={plan}
        selectedItemToEvolve={selectedItemToEvolve}
        evolutionProgress={evolutionProgress}
        evolutionNote={evolutionNote}
        setEvolutionNote={setEvolutionNote}
        handleSaveEvolution={handleSaveEvolution}
        setIsTemplateModalOpen={setIsTemplateModalOpen}
      />

      {/* 6. SELECTOR / CREADOR DE PLANTILLAS */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="sm:max-w-[520px] bg-card text-card-foreground border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 border-b border-border bg-slate-100/80 dark:bg-slate-900/80 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-extrabold text-foreground">Selector de Plantillas</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">Seleccione una plantilla grabada en el sistema.</DialogDescription>
            </div>
            {isAdmin && !isCreatingTemplate && (
              <Button size="sm" onClick={() => setIsCreatingTemplate(true)} className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Plantilla
              </Button>
            )}
          </DialogHeader>
          {isCreatingTemplate ? (
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Nombre de la Plantilla</Label>
                <Input placeholder="Ej: Resina Fotocurable" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} className="bg-background border-border text-sm font-semibold" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Nota Médica Predeterminada</Label>
                <Textarea placeholder="Escriba el protocolo..." value={newTemplateText} onChange={(e) => setNewTemplateText(e.target.value)} className="min-h-[120px] bg-background border-border text-xs font-medium" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsCreatingTemplate(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleCreateNewTemplate} disabled={isSavingNewTemplate} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {isSavingNewTemplate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Guardar
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {isLoadingTemplates ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-[#008bcd]" /></div>
              ) : templatesList.length > 0 ? (
                <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="w-full h-11 px-3 border border-border rounded-xl text-xs font-bold bg-background text-foreground outline-none focus:ring-2 focus:ring-[#008bcd]">
                  <option value="">-- Seleccione una plantilla --</option>
                  {templatesList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              ) : (
                <div className="p-6 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">No hay plantillas guardadas en la base de datos.</div>
              )}
            </div>
          )}
          <DialogFooter className="p-4 bg-slate-100/80 dark:bg-slate-900/80 border-t border-border flex justify-between gap-2">
            <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)} className="font-bold border-border">Cerrar</Button>
            {!isCreatingTemplate && (
              <Button onClick={handleApplyTemplate} disabled={!selectedTemplateId} className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold rounded-xl px-6">
                Usar plantilla
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. DIAGNÓSTICO */}
      <Dialog open={isDiagnosisModalOpen} onOpenChange={setIsDiagnosisModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 border-b border-border bg-slate-100/80 dark:bg-slate-900/80">
            <DialogTitle className="text-lg font-extrabold text-foreground">Ingresar un diagnóstico</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Seleccione un diagnóstico para esta prestación.</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Diagnósticos Disponibles</Label>
            <select value={selectedDiagnosis} onChange={(e) => setSelectedDiagnosis(e.target.value)} className="w-full h-11 px-3 border border-border rounded-xl text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#008bcd]">
              <option value="">Seleccione un diagnóstico...</option>
              <option value="Carie de la dentina">Carie de la dentina</option>
              <option value="Pulpitis irreversible">Pulpitis irreversible</option>
            </select>
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-100/80 dark:bg-slate-900/80 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDiagnosisModalOpen(false)} className="font-bold border-border">Cerrar</Button>
            <Button onClick={handleSaveDiagnosis} className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold px-6 rounded-xl">Guardar Diagnóstico</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. ABONO / PAGO */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Registrar Abono a Prestación
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Prestación: <b className="text-foreground">{selectedItemToPay?.procedureName}</b>
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const itemCost = selectedItemToPay?.cost || 0;
            const itemDscto = selectedItemToPay?.discount || 0;
            const finalPrice = itemCost - (itemCost * (itemDscto / 100));
            const currentPaid = selectedItemToPay?.paidAmount || 0;
            const pendingBalance = Math.max(0, finalPrice - currentPaid);

            return (
              <div className="py-4 space-y-4">
                <div className="p-3.5 bg-muted/30 border border-border rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between text-muted-foreground"><span>Precio Base:</span><span className="font-bold text-foreground">${itemCost.toFixed(2)}</span></div>
                  {itemDscto > 0 && <div className="flex justify-between text-emerald-600 font-semibold"><span>Descuento ({itemDscto}%):</span><span>-${(itemCost * (itemDscto / 100)).toFixed(2)}</span></div>}
                  <div className="flex justify-between text-muted-foreground"><span>Abonado:</span><span className="font-bold text-blue-600">${currentPaid.toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1.5 text-sm font-extrabold"><span className="text-foreground">Saldo Pendiente:</span><span className="text-red-500">${pendingBalance.toFixed(2)}</span></div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Monto a Abonar ($)</Label>
                    <button type="button" onClick={() => setPaymentAmount(pendingBalance.toFixed(2))} className="text-[11px] font-bold text-[#008bcd] hover:underline">
                      Pagar todo (${pendingBalance.toFixed(2)})
                    </button>
                  </div>
                  <Input type="number" step="0.01" min="0.01" max={pendingBalance} placeholder="0.00" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="bg-background border-border text-base font-bold" autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Método de Pago</Label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full h-10 px-3 border border-border rounded-xl text-xs font-bold bg-background text-foreground outline-none focus:ring-2 focus:ring-[#008bcd]">
                    <option value="CASH">Efectivo</option>
                    <option value="TRANSFER">Transferencia / QR</option>
                    <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                    <option value="DEBIT_CARD">Tarjeta de Débito</option>
                  </select>
                </div>
              </div>
            );
          })()}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePayment} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5">Registrar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}