"use client"
import React, { useState, useEffect, useCallback } from "react"
import { Loader2, Maximize2, Minimize2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { OdontogramGrid } from "./odontogram-grid"
import { OdontogramActionMenu, HEALTHY_OPTION, LESION_OPTIONS, PREEXISTENCE_OPTIONS } from "./odontogram-action-menu"
import { OdontogramHistory } from "./odontogram-history"

export function OdontogramaTab({ patientId, planId, onToothClickCallback, isPlanView = false, onPlanUpdate }: any) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  
  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"

  const [isFocusMode, setIsFocusMode] = useState(false)
  const [dentition, setDentition] = useState<"permanente" | "temporal">("permanente")
  const [view, setView] = useState("diagnostico")
  
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [currentSurfaces, setCurrentSurfaces] = useState<string[]>([])
  const [menuStep, setMenuStep] = useState<"NONE" | "OPTIONS" | "LESIONS" | "PREEXISTENCES" | "SAVE_FORM">("NONE")
  const [selectedStatus, setSelectedStatus] = useState<any>(null)
  const [recordComment, setRecordComment] = useState("")
  
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(`/api/odontogram?patientId=${patientId}`)
      setRecords(await res.json() || [])
    } catch (error) { toast({ title: "Error", variant: "destructive" }) } finally { setIsLoading(false) }
  }, [patientId, toast])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleSurfaceClick = (tooth: number, surface: string) => {
    if (!canEditClinicalData) return;
    if (selectedTooth !== tooth) { 
        setSelectedTooth(tooth)
        setCurrentSurfaces(surface === "TODA_LA_PIEZA" ? [] : [surface]) 
        setMenuStep("OPTIONS")
        if(onToothClickCallback) onToothClickCallback(tooth);
    } else { 
        if (surface === "TODA_LA_PIEZA") setCurrentSurfaces([]);
        else setCurrentSurfaces(currentSurfaces.includes(surface) ? currentSurfaces.filter(s => s !== surface) : [...currentSurfaces, surface]) 
    }
  }

  const handleCloseMenu = () => {
    setMenuStep("NONE"); setSelectedTooth(null); setCurrentSurfaces([]); setSelectedStatus(null); setRecordComment("");
    if(onToothClickCallback) onToothClickCallback(0);
  }

  const handleSaveRecord = async () => {
    if (!canEditClinicalData) return;
    setIsSaving(true)
    try {
      if (selectedStatus?.value === "DIENTE_SANO") {
        await fetch(`/api/odontogram?patientId=${patientId}&toothNumber=${selectedTooth}`, { method: "DELETE" });
      }

      let finalSurfaces = currentSurfaces
      if (selectedStatus?.type === "tooth" || finalSurfaces.length === 0) finalSurfaces = ["TODA_LA_PIEZA"]

      const res = await fetch(`/api/odontogram`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            patientId, planId, toothNumber: selectedTooth, surfaces: finalSurfaces, 
            status: selectedStatus.value, isEvolution: view === "evolucion", 
            authorId: currentUser?.id, notes: recordComment
        })
      })
      if (!res.ok) throw new Error()
      
      toast({ title: "Simbología registrada", variant: "success" })
      handleCloseMenu(); fetchRecords(); router.refresh();
    } catch (error) { toast({ title: "Error al guardar", variant: "destructive" }) } finally { setIsSaving(false) }
  }

  const confirmDeleteRecord = async (recordToDelete: any) => {
    try {
        const response = await fetch(`/api/odontogram?id=${recordToDelete.id}`, { method: "DELETE" })
        if (!response.ok) throw new Error()
        toast({ title: "Registro anulado correctamente", variant: "success" }); 
        fetchRecords(); router.refresh();
    } catch (error) { toast({ title: "Error al anular", variant: "destructive" }) }
  }

  const getStatusLabel = (val: string) => [...LESION_OPTIONS, ...PREEXISTENCE_OPTIONS, HEALTHY_OPTION].find(o => o.value === val)?.label || val
  const getRecordsForTooth = (toothNum: number) => records.filter(r => r.toothNumber === toothNum && r.isEvolution === (view === "evolucion"))

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#008bcd]" /></div>

  return (
    <div className={cn("transition-all duration-300 ease-in-out bg-background text-foreground", isFocusMode ? "fixed inset-0 z-[100] w-screen h-screen overflow-y-auto p-4 md:p-8" : "relative w-full h-full animate-in fade-in")}>
      
      {/* HEADER DE HERRAMIENTAS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
          <button onClick={() => setDentition("permanente")} className={cn("px-4 py-1.5 text-xs font-bold rounded-md", dentition === "permanente" ? "bg-background text-[#008bcd] shadow-sm" : "text-muted-foreground")}>Permanente</button>
          <button onClick={() => setDentition("temporal")} className={cn("px-4 py-1.5 text-xs font-bold rounded-md", dentition === "temporal" ? "bg-background text-[#008bcd] shadow-sm" : "text-muted-foreground")}>Temporal</button>
        </div>
        <div className="flex items-center gap-3">
          {!canEditClinicalData && <span className="text-[10px] font-bold bg-muted border px-2 py-1.5 rounded-md">SÓLO LECTURA</span>}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
            <button onClick={() => setView("diagnostico")} className={cn("px-4 py-1.5 text-xs font-bold rounded-md", view === "diagnostico" ? "bg-[#008bcd] text-white shadow-sm" : "text-muted-foreground")}>Diagnóstico</button>
            <button onClick={() => setView("evolucion")} className={cn("px-4 py-1.5 text-xs font-bold rounded-md", view === "evolucion" ? "bg-[#008bcd] text-white shadow-sm" : "text-muted-foreground")}>Evolución</button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsFocusMode(!isFocusMode)} className="h-8 w-8">
            {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* COMPONENTES HIJOS */}
      <OdontogramGrid dentition={dentition} getRecordsForTooth={getRecordsForTooth} selectedTooth={selectedTooth} currentSurfaces={currentSurfaces} handleSurfaceClick={handleSurfaceClick} canEdit={canEditClinicalData} />
      
      <OdontogramActionMenu menuStep={menuStep} setMenuStep={setMenuStep} selectedTooth={selectedTooth} currentSurfaces={currentSurfaces} handleCloseMenu={handleCloseMenu} planId={planId} setIsCatalogModalOpen={setIsCatalogModalOpen} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} recordComment={recordComment} setRecordComment={setRecordComment} handleSaveRecord={handleSaveRecord} isSaving={isSaving} />

      {!planId && (
        <OdontogramHistory records={records.filter(r => r.isEvolution === (view === "evolucion"))} view={view} canEdit={canEditClinicalData} currentUser={currentUser} confirmDeleteRecord={confirmDeleteRecord} getStatusLabel={getStatusLabel} />
      )}
    </div>
  )
}