"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Loader2, Maximize2, Minimize2, Grid3X3, Printer } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { useGetPatient } from "@/hooks/patients"
import { OdontogramGrid } from "./odontogram-grid"
import { OdontogramActionMenu } from "./odontogram-action-menu"
import { OdontogramHistory } from "./odontogram-history"
import { printOdontogramSheet } from "@/components/patients-file/odontogram/odontogram-print"
import { useClinicSettings } from "@/config/clinic-settings"
import { OdontogramLegendModal } from "@/components/patients-file/odontogram/odontogram-legend-modal"
import { odontogramStatuses } from "@/constants/status"

export function OdontogramaTab({ 
  patientId, 
  planId, 
  onToothClickCallback, 
  isPlanView = false, 
  onPlanUpdate 
}: any) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  
  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"

  const { patient } = useGetPatient(patientId)

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
  
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(`/api/odontogram?patientId=${patientId}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(Array.isArray(data) ? data : [])
      }
    } catch (error) { 
      toast({ 
        title: "Error", 
        description: "No se pudieron cargar los registros del odontograma.", 
        variant: "destructive" 
      }) 
    } finally { 
      setIsLoading(false) 
    }
  }, [patientId, toast])

  useEffect(() => { 
    fetchRecords() 
  }, [fetchRecords])

  const handleSurfaceClick = (tooth: number, surface: string) => {
    if (!canEditClinicalData) return
    if (selectedTooth !== tooth) { 
      setSelectedTooth(tooth)
      setCurrentSurfaces(surface === "TODA_LA_PIEZA" ? [] : [surface]) 
      setMenuStep("OPTIONS")
      if (onToothClickCallback) onToothClickCallback(tooth)
    } else { 
      if (surface === "TODA_LA_PIEZA") {
        setCurrentSurfaces([])
      } else { 
        setCurrentSurfaces((prev) => 
          prev.includes(surface) ? prev.filter((s) => s !== surface) : [...prev, surface]
        )
      }
    }
  }

  const { settings } = useClinicSettings()

  const handlePrintOdontogram = () => {
    printOdontogramSheet({
      records,
      view,
      dentition,
      patientFullName: `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim(),
      patientDocId: patient?.ci,
      doctorName: currentUser?.name,
      doctorSpecialty: currentUser?.specialty,
      getStatusLabel,
      settings,
    })
  }

  const handleCloseMenu = () => {
    setMenuStep("NONE")
    setSelectedTooth(null)
    setCurrentSurfaces([])
    setSelectedStatus(null)
    setRecordComment("")
    if (onToothClickCallback) onToothClickCallback(0)
  }

  const handleSaveRecord = async () => {
    if (!canEditClinicalData) return
    setIsSaving(true)
    try {
      if (selectedStatus?.value === "DIENTE_SANO") {
        await fetch(`/api/odontogram?patientId=${patientId}&toothNumber=${selectedTooth}`, { 
          method: "DELETE" 
        })
      }

      let finalSurfaces = currentSurfaces
      if (selectedStatus?.type === "tooth" || finalSurfaces.length === 0) {
        finalSurfaces = ["TODA_LA_PIEZA"]
      }

      const res = await fetch(`/api/odontogram`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          patientId, 
          planId, 
          toothNumber: selectedTooth, 
          surfaces: finalSurfaces, 
          status: selectedStatus.value, 
          isEvolution: view === "evolucion", 
          authorId: currentUser?.id, 
          notes: recordComment
        })
      })

      if (!res.ok) throw new Error()
      
      toast({ 
        title: "Simbología registrada", 
        description: `Se actualizó la pieza #${selectedTooth} correctamente.`,
        variant: "success"
      })
      handleCloseMenu()
      await fetchRecords()
      if (onPlanUpdate) onPlanUpdate()
      router.refresh()
    } catch (error) { 
      toast({ 
        title: "Error al guardar", 
        description: "No se pudo registrar la condición en la pieza.", 
        variant: "destructive" 
      }) 
    } finally { 
      setIsSaving(false) 
    }
  }

  const confirmDeleteRecord = async (recordToDelete: any) => {
    try {
      const response = await fetch(`/api/odontogram?id=${recordToDelete.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error()
      toast({ title: "Registro anulado", description: "Se eliminó el hallazgo clínico del diente." }) 
      await fetchRecords()
      if (onPlanUpdate) onPlanUpdate()
      router.refresh()
    } catch (error) { 
      toast({ title: "Error al anular", variant: "destructive" }) 
    }
  }

  // Traducción y etiqueta garantizada con fallback limpio
  const getStatusLabel = (val: string) => {
    if (!val) return "Sin estado"
    if (odontogramStatuses && odontogramStatuses[val]) {
      return odontogramStatuses[val].label
    }
    return val.replace(/_/g, " ")
  }

  const getRecordsForTooth = (toothNum: number) => 
    records.filter((r) => r.toothNumber === toothNum && r.isEvolution === (view === "evolucion"))

  const currentViewRecords = records.filter((r) => r.isEvolution === (view === "evolucion"))

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#008bcd]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-semibold text-xs text-muted-foreground">Cargando odontograma...</p>
      </div>
    )
  }

  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out bg-background text-foreground", 
      isFocusMode 
        ? "fixed inset-0 z-[100] w-screen h-screen overflow-y-auto p-4 md:p-8" 
        : "relative w-full h-full animate-in fade-in space-y-6"
    )}>
      
      {/* HEADER ADAPTATIVO */}
      <div className={cn(
        "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-card rounded-2xl border border-border/80 shadow-xs sticky top-0 z-20 print:hidden transition-all",
        isPlanView ? "p-3 bg-muted/20 border-transparent shadow-none" : "p-5"
      )}>
        {!isPlanView ? (
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-[#008bcd]" /> Odontograma Clínico
              </h2>
              {!canEditClinicalData && (
                <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-md border border-border/80 tracking-wider">
                  SÓLO LECTURA
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              Registro visual anatómico y diagnóstico por superficies dentales.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-[#008bcd] tracking-wider flex items-center gap-1.5">
              <Grid3X3 className="w-4 h-4" /> Odontograma
            </span>
            {!canEditClinicalData && (
              <span className="text-[9px] bg-muted text-muted-foreground font-bold px-1.5 py-0.5 rounded border border-border/70">
                LECTURA
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Selector Dentición */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/80">
            <button 
              type="button"
              onClick={() => setDentition("permanente")} 
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                dentition === "permanente" 
                  ? "bg-background text-[#008bcd] shadow-2xs" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Permanente
            </button>
            <button 
              type="button"
              onClick={() => setDentition("temporal")} 
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                dentition === "temporal" 
                  ? "bg-background text-[#008bcd] shadow-2xs" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Temporal
            </button>
          </div>

          {/* Selector Diagnóstico / Evolución */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/80">
            <button 
              type="button"
              onClick={() => setView("diagnostico")} 
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                view === "diagnostico" 
                  ? "bg-[#008bcd] text-white shadow-2xs" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Diagnóstico
            </button>
            <button 
              type="button"
              onClick={() => setView("evolucion")} 
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                view === "evolucion" 
                  ? "bg-[#008bcd] text-white shadow-2xs" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Evolución
            </button>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-1.5">
            <OdontogramLegendModal />

            {!isPlanView && (
              <Button 
                type="button"
                variant="outline" 
                size="icon" 
                onClick={handlePrintOdontogram} 
                title="Imprimir Odontograma"
                className="h-10 w-10 shrink-0 rounded-xl bg-background border-border/80 text-muted-foreground hover:text-foreground cursor-pointer shadow-xs transition-all"
              >
                <Printer className="w-4 h-4" />
              </Button>
            )}
              <Button 
                type="button"
                variant="outline" 
                size="icon" 
                onClick={() => setIsFocusMode(!isFocusMode)} 
                className="h-10 w-10 shrink-0 rounded-xl bg-background border-border/80 text-muted-foreground hover:text-foreground cursor-pointer shadow-xs transition-all"
                title={isFocusMode ? "Salir de pantalla completa" : "Modo enfoque"}
              >
                {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
          </div>
        </div>
      </div>

      {/* COMPONENTES DE LA GRILLA INTERACTIVA */}
      <div className="print:hidden space-y-6">
        <OdontogramGrid 
          dentition={dentition} 
          getRecordsForTooth={getRecordsForTooth} 
          selectedTooth={selectedTooth} 
          currentSurfaces={currentSurfaces} 
          handleSurfaceClick={handleSurfaceClick} 
          canEdit={canEditClinicalData} 
        />
        
        <OdontogramActionMenu 
          menuStep={menuStep} 
          setMenuStep={setMenuStep} 
          selectedTooth={selectedTooth} 
          currentSurfaces={currentSurfaces} 
          handleCloseMenu={handleCloseMenu} 
          planId={planId} 
          setIsCatalogModalOpen={setIsCatalogModalOpen} 
          selectedStatus={selectedStatus} 
          setSelectedStatus={setSelectedStatus} 
          recordComment={recordComment} 
          setRecordComment={setRecordComment} 
          handleSaveRecord={handleSaveRecord} 
          isSaving={isSaving} 
        />

        {!planId && (
          <OdontogramHistory 
            records={currentViewRecords} 
            view={view} 
            canEdit={canEditClinicalData} 
            currentUser={currentUser} 
            confirmDeleteRecord={confirmDeleteRecord} 
            getStatusLabel={getStatusLabel} 
            onRecordUpdated={fetchRecords} 
          />
        )}
      </div>

    </div>
  )
}

export default OdontogramaTab