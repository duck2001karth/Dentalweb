"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, Loader2 } from "lucide-react"

import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"

import { CreatePlanModal } from "@/components/plans-treatment/modals/create-plan-modal"
import { TreatmentPlanList } from "@/components/plans-treatment/components/treatment-list"
import { TreatmentPlanDetail } from "@/components/plans-treatment/treatment-detail"

import { useGetTreatmentPlans, useDeleteTreatmentPlan, useUpdateTreatmentPlan } from "@/hooks/treatments" 
import { useGetPatient } from "@/hooks/patients"

export function PatientTreatmentPlans({ patientId }: { patientId: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlPlanId = searchParams.get("planId")
  
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(urlPlanId || null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)

  const { plans = [], isLoading, refetch } = useGetTreatmentPlans({ patientId })
  const { patient } = useGetPatient(patientId)
  const { deleteTreatmentPlan, isLoading: isDeleting } = useDeleteTreatmentPlan()
  const { updateTreatmentPlan, isLoading: isSavingComment } = useUpdateTreatmentPlan()

  useEffect(() => {
    setSelectedPlanId(urlPlanId || null)
  }, [urlPlanId])

  const selectedPlan = (plans || []).find((p: any) => p.id === selectedPlanId)

  const handleBackToList = () => {
    setSelectedPlanId(null)
    router.push(`${pathname}?tab=planes`)
    refetch()
  }

  const handleSelectPlan = (id: string) => {
    setSelectedPlanId(id)
    router.push(`${pathname}?tab=planes&planId=${id}`)
  }

  const handleSaveComment = (text: string) => {
    if (!selectedPlanId) return
    updateTreatmentPlan(
      { id: selectedPlanId, input: { commentsToPatient: text } }, 
      {
        onSuccess: () => toast({ title: "Comentario Guardado", variant: "success" })
      }
    )
  }

  const confirmDeletePlan = () => {
    if (!planToDelete) return
    deleteTreatmentPlan(planToDelete, {
      onSuccess: () => {
        toast({ title: "Plan enviado a la papelera", variant: "success" })
        const deletedId = planToDelete
        setPlanToDelete(null)
        if (selectedPlanId === deletedId) {
          handleBackToList()
        }
        refetch()
      },
      onError: () => {
        toast({ title: "Error al anular el plan", variant: "destructive" })
      }
    })
  }

  return (
    <div className="w-full animate-in fade-in duration-300 font-sans antialiased">
      
      {/* MODAL NUEVO PLAN */}
      <CreatePlanModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        patientId={patientId} 
        onSuccessCallback={(id: string) => {
          handleSelectPlan(id)
          refetch()
        }} 
      />

      {/* MODAL CONFIRMACIÓN PAPELERA */}
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent className="bg-card border-border rounded-2xl shadow-2xl sm:max-w-[420px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 font-extrabold text-lg">
              <AlertTriangle className="w-5 h-5" /> ¿Mover a la papelera?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs font-medium mt-1">
              El plan pasará al estado anulado. Podrás restaurarlo o destruirlo definitivamente desde la papelera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="font-bold border-border rounded-xl text-xs h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePlan} 
              disabled={isDeleting} 
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs h-10 shadow-xs cursor-pointer border-none"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sí, mover a papelera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* RENDERIZADO CONDICIONAL: DETALLE vs LISTA */}
      {selectedPlanId ? (
        isLoading && !selectedPlan ? (
          <div className="flex flex-col items-center justify-center py-24 bg-card rounded-2xl border border-border border-dashed gap-3">
            <Loader2 className="w-9 h-9 animate-spin text-[#008bcd]" />
            <p className="text-xs font-bold text-muted-foreground">Cargando detalles del tratamiento...</p>
          </div>
        ) : selectedPlan ? (
          <TreatmentPlanDetail 
            plan={selectedPlan} 
            patient={patient} 
            onBack={handleBackToList} 
            onPlanUpdate={refetch} 
            onSaveComment={handleSaveComment}
            isSavingComment={isSavingComment}
          />
        ) : (
          <div className="p-8 text-center bg-card rounded-2xl border border-border space-y-3">
            <p className="text-sm font-bold text-foreground">El tratamiento solicitado no fue encontrado.</p>
            <button
              onClick={handleBackToList}
              className="text-xs font-bold text-[#008bcd] hover:underline"
            >
              ← Volver al listado de planes
            </button>
          </div>
        )
      ) : (
        <TreatmentPlanList 
          plans={plans} 
          isLoading={isLoading} 
          patientName={patient ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() : ""} 
          onNewPlan={() => setIsCreateModalOpen(true)}
          onSelectPlan={handleSelectPlan}
          onDeletePlan={(id: string) => setPlanToDelete(id)}
          refetchPlans={refetch}
        />
      )}

    </div>
  )
}

export default PatientTreatmentPlans