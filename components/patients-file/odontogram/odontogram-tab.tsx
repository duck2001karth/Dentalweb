"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { 
  Sparkles, Save, Trash2, RotateCcw, 
  HelpCircle, Eye, Loader2, Stethoscope, AlertTriangle 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { OdontogramGrid } from "./odontogram-grid"
import { OdontogramHistory } from "./odontogram-history"
import { OdontogramActionMenu } from "./odontogram-action-menu"
import { OdontogramLegendModal } from "./odontogram-legend-modal"
import { odontogramStatuses } from "@/constants/status"

interface OdontogramTabProps {
  patientId: string
  planId?: string
  isPlanView?: boolean
  onToothClickCallback?: (tooth: number) => void
  onPlanUpdate?: () => void
}

export function OdontogramaTab({
  patientId,
  planId,
  isPlanView = false,
  onToothClickCallback,
  onPlanUpdate,
}: OdontogramTabProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const userRole = String(currentUser?.role || "DOCTOR").toUpperCase()
  const canEdit = userRole === "ADMIN" || userRole === "DOCTOR"

  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dentition, setDentition] = useState<"permanente" | "temporal">("permanente")
  const [view, setView] = useState<"inicial" | "evolucion">("evolucion")

  const [menuStep, setMenuStep] = useState<"NONE" | "OPTIONS" | "LESIONS" | "PREEXISTENCES" | "SAVE_FORM">("NONE")
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [currentSurfaces, setCurrentSurfaces] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<any>(null)
  const [recordComment, setRecordComment] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const isFetchingRef = useRef(false)

  const fetchRecords = useCallback(async () => {
    if (!patientId || isFetchingRef.current) return
    isFetchingRef.current = true
    try {
      const url = planId 
        ? `/api/odontogram?patientId=${patientId}&planId=${planId}`
        : `/api/odontogram?patientId=${patientId}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setRecords(Array.isArray(data) ? data : data.records || [])
      }
    } catch (e) {
      console.error("Error al cargar odontograma:", e)
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [patientId, planId])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleSurfaceClick = (tooth: number, surface: string) => {
    if (!canEdit) return
    setSelectedTooth(tooth)
    setCurrentSurfaces([surface])
    setMenuStep("OPTIONS")

    if (onToothClickCallback) {
      onToothClickCallback(tooth)
    }
  }

  const handleSaveRecord = async () => {
    if (!selectedTooth || !selectedStatus || isSaving) return
    setIsSaving(true)
    try {
      const payload = {
        patientId,
        planId: planId || null,
        toothNumber: selectedTooth,
        surfaces: currentSurfaces,
        status: selectedStatus.value,
        notes: recordComment.trim() || null,
        authorId: currentUser?.id,
      }

      const res = await fetch("/api/odontogram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()

      toast({ title: "Hallazgo guardado", variant: "success" })
      setMenuStep("NONE")
      setSelectedTooth(null)
      setCurrentSurfaces([])
      setRecordComment("")
      setSelectedStatus(null)
      
     await fetchRecords()

      if (onPlanUpdate) {
        onPlanUpdate()
      }
    } catch {
      toast({ title: "Error al guardar hallazgo", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDeleteRecord = async (record: any) => {
    if (!canEdit || !record?.id) return
    try {
      const res = await fetch(`/api/odontogram/${record.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Hallazgo eliminado", variant: "success" })
      await fetchRecords()
      if (onPlanUpdate) onPlanUpdate()
    } catch {
      toast({ title: "Error al eliminar registro", variant: "destructive" })
    }
  }

  const getRecordsForTooth = useCallback((toothNum: number) => {
    return records.filter((r) => Number(r.toothNumber) === toothNum)
  }, [records])

  const getStatusLabel = (statusKey: string) => {
    return (odontogramStatuses as any)?.[statusKey]?.label || statusKey
  }

  return (
    <div className="w-full space-y-6 font-sans antialiased">
      {/* Selector de Dentición */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-4 rounded-2xl border border-border/80">
        <div className="flex items-center gap-2">
          <div className="flex bg-background border border-border/80 rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setDentition("permanente")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                dentition === "permanente"
                  ? "bg-[#008bcd] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Permanente
            </button>
            <button
              type="button"
              onClick={() => setDentition("temporal")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                dentition === "temporal"
                  ? "bg-[#008bcd] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Temporal (Niños)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <OdontogramLegendModal />
        </div>
      </div>

      {/* Grid del Odontograma */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border/80 border-dashed gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#008bcd]" />
          <p className="text-xs font-bold text-muted-foreground">Cargando odontograma clínico...</p>
        </div>
      ) : (
        <OdontogramGrid
          dentition={dentition}
          getRecordsForTooth={getRecordsForTooth}
          selectedTooth={selectedTooth}
          currentSurfaces={currentSurfaces}
          handleSurfaceClick={handleSurfaceClick}
          canEdit={canEdit}
        />
      )}

      {/* Menú Flotante de Acciones */}
      <OdontogramActionMenu
        menuStep={menuStep}
        setMenuStep={setMenuStep}
        selectedTooth={selectedTooth}
        currentSurfaces={currentSurfaces}
        handleCloseMenu={() => {
          setMenuStep("NONE")
          setSelectedTooth(null)
          setCurrentSurfaces([])
        }}
        planId={planId}
        setIsCatalogModalOpen={() => {}}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        recordComment={recordComment}
        setRecordComment={setRecordComment}
        handleSaveRecord={handleSaveRecord}
        isSaving={isSaving}
      />

      {/* Historial Clínico de Hallazgos */}
      {!isPlanView && (
        <OdontogramHistory
          records={records}
          view={view}
          canEdit={canEdit}
          currentUser={currentUser}
          confirmDeleteRecord={confirmDeleteRecord}
          getStatusLabel={getStatusLabel}
          onRecordUpdated={fetchRecords}
        />
      )}
    </div>
  )
}

export const OdontogramTab = OdontogramaTab
export default OdontogramaTab