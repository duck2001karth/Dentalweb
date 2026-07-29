"use client"

import React, { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle } from "lucide-react"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { CreatePlanModal } from "@/components/plans-treatment/create-plan-modal"

import { TreatmentPlanList } from "@/components/plans-treatment/treatment-list"
import { TreatmentPlanDetail } from "@/components/plans-treatment/treatment-detail"

import { useGetTreatmentPlans, useDeleteTreatmentPlan, useUpdateTreatmentPlan } from "@/hooks/treatments" 
import { useGetPatient } from "@/hooks/patients"

export function PatientTreatmentPlans({ patientId }: { patientId: string }) {
  const { toast } = useToast()
  
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)

  const { plans = [], isLoading } = useGetTreatmentPlans({ patientId })
  const { patient } = useGetPatient(patientId)
  const { deleteTreatmentPlan, isLoading: isDeleting } = useDeleteTreatmentPlan()
  const { updateTreatmentPlan, isLoading: isSavingComment } = useUpdateTreatmentPlan()

  const selectedPlan = plans.find((p: any) => p.id === selectedPlanId)

  const handleSaveComment = (text: string) => {
    if (!selectedPlanId) return;
    updateTreatmentPlan({ id: selectedPlanId, input: { commentsToPatient: text } }, {
      onSuccess: () => toast({ title: "Comentario Guardado", variant: "success" })
    })
  }

  const confirmDeletePlan = () => {
    if (!planToDelete) return;
    deleteTreatmentPlan(planToDelete, {
      onSuccess: () => {
        toast({ title: "Plan Eliminado", description: "Enviado a la papelera.", variant: "success" })
        setPlanToDelete(null)
        if (selectedPlanId === planToDelete) setSelectedPlanId(null)
      }
    })
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      <CreatePlanModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        patientId={patientId} 
        onSuccessCallback={(id) => setSelectedPlanId(id)} 
      />

      {/* Alerta de Eliminación */}
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5" /> Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground mt-2">¿Estás seguro de que deseas eliminar este plan?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePlan} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white font-bold">Sí, eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {selectedPlanId && selectedPlan ? (
        <TreatmentPlanDetail 
          plan={selectedPlan} 
          patient={patient} 
          onBack={() => setSelectedPlanId(null)} 
          onSaveComment={handleSaveComment}
          isSavingComment={isSavingComment}
        />
      ) : (
        <TreatmentPlanList 
          plans={plans} 
          isLoading={isLoading} 
          patientName={patient?.firstName || ""} 
          onNewPlan={() => setIsCreateModalOpen(true)}
          onSelectPlan={(id) => setSelectedPlanId(id)}
          onDeletePlan={(id) => setPlanToDelete(id)}
        />
      )}

    </div>
  )
}