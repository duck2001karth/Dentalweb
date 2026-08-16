"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle } from "lucide-react"

import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"

import { CreatePlanModal } from "@/components/plans-treatment/create-plan-modal"
import { TreatmentPlanList } from "@/components/plans-treatment/treatment-list"
import { TreatmentPlanDetail } from "@/components/plans-treatment/treatment-detail"

import { useGetTreatmentPlans, useDeleteTreatmentPlan, useUpdateTreatmentPlan } from "@/hooks/treatments" 
import { useGetPatient } from "@/hooks/patients"

export function PatientTreatmentPlans({ patientId }: { patientId: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlPlanId = searchParams.get("planId")
  
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)

  const { plans = [], isLoading, refetch } = useGetTreatmentPlans({ patientId })
  const { patient } = useGetPatient(patientId)
  const { deleteTreatmentPlan, isLoading: isDeleting } = useDeleteTreatmentPlan()
  const { updateTreatmentPlan, isLoading: isSavingComment } = useUpdateTreatmentPlan()

  useEffect(() => {
    if (urlPlanId) {
      setSelectedPlanId(urlPlanId)
    } else {
      setSelectedPlanId(null)
    }
  }, [urlPlanId])

  const selectedPlan = plans.find((p: any) => p.id === selectedPlanId)

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
        setPlanToDelete(null)
        if (selectedPlanId === planToDelete) {
          handleBackToList()
        }
        refetch()
      },
      onError: () => {
        toast({ title: "Error al eliminar", variant: "destructive" })
      }
    })
  }

  return (
    <div className="w-full animate-in fade-in duration-500 font-sans antialiased">
      
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

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent className="bg-card border-border rounded-2xl shadow-2xl sm:max-w-[420px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 font-extrabold text-lg">
              <AlertTriangle className="w-5 h-5" /> ¿Mover a la papelera?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs font-medium mt-1">
              El plan pasará al estado anulado. Podrás restaurarlo o destruirlo desde la pestaña Papelera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="font-bold border-border rounded-xl text-xs h-10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePlan} 
              disabled={isDeleting} 
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs h-10 shadow-sm cursor-pointer"
            >
              Sí, mover a papelera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedPlanId && selectedPlan ? (
        <TreatmentPlanDetail 
          plan={selectedPlan} 
          patient={patient} 
          onBack={handleBackToList} 
          onPlanUpdate={refetch} 
          onSaveComment={handleSaveComment}
          isSavingComment={isSavingComment}
        />
      ) : (
        <TreatmentPlanList 
          plans={plans} 
          isLoading={isLoading} 
          patientName={patient ? `${patient.firstName} ${patient.lastName}` : ""} 
          onNewPlan={() => setIsCreateModalOpen(true)}
          onSelectPlan={handleSelectPlan}
          onDeletePlan={(id: string) => setPlanToDelete(id)}
          refetchPlans={refetch}
        />
      )}

    </div>
  )
}