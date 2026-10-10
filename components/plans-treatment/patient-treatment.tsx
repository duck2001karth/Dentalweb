"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog"

import { CreatePlanModal } from "@/components/plans-treatment/modals/create-plan-modal"
import { TreatmentPlanList } from "@/components/plans-treatment/components/treatment-list"
import { TreatmentPlanDetail } from "@/components/plans-treatment/treatment-detail"
import { useGetTreatmentPlans, useDeleteTreatmentPlan, useUpdateTreatmentPlan } from "@/hooks/treatments"
import { useGetPatient } from "@/hooks/patients"

export function PatientTreatmentPlans({ patientId }: { patientId: string }) {
  const { toast } = useToast()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlPlanId = searchParams.get("planId")
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(urlPlanId || null)
  const [newlyCreatedPlan, setNewlyCreatedPlan] = useState<any | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)
  const [isFetchingDirect, setIsFetchingDirect] = useState(false)

  const { plans = [], isLoading, refetch } = useGetTreatmentPlans({ patientId })
  const { patient } = useGetPatient(patientId)
  const { deleteTreatmentPlan, isLoading: isDeleting } = useDeleteTreatmentPlan()
  const { updateTreatmentPlan, isLoading: isSavingComment } = useUpdateTreatmentPlan()

  useEffect(() => {
    if (urlPlanId !== selectedPlanId) {
      setSelectedPlanId(urlPlanId || null)
    }
  }, [urlPlanId])

  const matchedPlanFromList = useMemo(() => {
    if (!selectedPlanId || !Array.isArray(plans) || plans.length === 0) return null
    return plans.find((p: any) => String(p.id).trim() === String(selectedPlanId).trim()) || null
  }, [plans, selectedPlanId])

  useEffect(() => {
    if (selectedPlanId && !matchedPlanFromList && !newlyCreatedPlan) {
      let isMounted = true
      setIsFetchingDirect(true)

      fetch(`/api/treatments/${selectedPlanId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isMounted) return
          const planData = data?.plan || data
          if (planData?.id) {
            setNewlyCreatedPlan(planData)
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsFetchingDirect(false)
        })

      return () => {
        isMounted = false
      }
    }
  }, [selectedPlanId, matchedPlanFromList, newlyCreatedPlan])

  const activePlan = matchedPlanFromList || newlyCreatedPlan

  const handleSelectPlan = useCallback((id: string, initialData?: any) => {
    const cleanId = String(id).trim()
    if (initialData) {
      setNewlyCreatedPlan(initialData)
    }
    setSelectedPlanId(cleanId)
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `${pathname}?tab=planes&planId=${cleanId}`)
    }
  }, [pathname])

  const handleBackToList = useCallback(() => {
    setSelectedPlanId(null)
    setNewlyCreatedPlan(null)
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `${pathname}?tab=planes`)
    }
    refetch()
  }, [pathname, refetch])

  const handleSaveComment = useCallback(
    (text: string) => {
      if (!selectedPlanId) return
      updateTreatmentPlan(
        { id: selectedPlanId, input: { commentsToPatient: text } },
        {
          onSuccess: () => toast({ title: "Comentario guardado", variant: "success" }),
        }
      )
    },
    [selectedPlanId, updateTreatmentPlan, toast]
  )

  const confirmDeletePlan = useCallback(() => {
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
      },
    })
  }, [planToDelete, deleteTreatmentPlan, selectedPlanId, handleBackToList, refetch, toast])

  return (
    <div className="w-full font-sans antialiased">
      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        patientId={patientId}
        onSuccessCallback={(id: string, createdData?: any) => {
          handleSelectPlan(id, createdData)
          refetch()
        }}
      />

      <ConfirmDestructiveDialog
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={confirmDeletePlan}
        isLoading={isDeleting}
        title="¿Mover a la papelera?"
        description="El plan pasará al estado anulado. Podrás restaurarlo o destruirlo definitivamente desde la papelera."
        confirmText="Sí, mover a papelera"
        iconType="warning"
      />

      {selectedPlanId ? (
        activePlan ? (
          <TreatmentPlanDetail
            key={activePlan.id}
            plan={activePlan}
            patient={patient}
            onBack={handleBackToList}
            onPlanUpdate={refetch}
            onSaveComment={handleSaveComment}
            isSavingComment={isSavingComment}
          />
        ) : (isLoading || isFetchingDirect) ? (
          <div className="flex flex-col items-center justify-center py-24 bg-card rounded-2xl border border-border border-dashed gap-3">
            <Loader2 className="w-9 h-9 animate-spin text-[#008bcd]" />
            <p className="text-xs font-bold text-muted-foreground">Abriendo expediente del tratamiento...</p>
          </div>
        ) : (
          <div className="p-8 text-center bg-card rounded-2xl border border-border space-y-3">
            <p className="text-sm font-bold text-foreground">El tratamiento solicitado no fue encontrado.</p>
            <button
              type="button"
              onClick={handleBackToList}
              className="text-xs font-bold text-[#008bcd] hover:underline cursor-pointer"
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