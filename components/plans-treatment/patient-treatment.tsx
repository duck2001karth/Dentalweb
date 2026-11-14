"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

import { AdminPlanDeleteDialog } from "@/components/plans-treatment/modals/admin-plan-delete-dialog"
import { useSession } from "next-auth/react"

import { CreatePlanModal } from "@/components/plans-treatment/modals/create-plan-modal"
import { TreatmentPlanList } from "@/components/plans-treatment/components/treatment-list"
import { TreatmentPlanDetail } from "@/components/plans-treatment/treatment-detail"
import { useGetTreatmentPlans, useUpdateTreatmentPlan } from "@/hooks/treatments"
import { useGetPatient } from "@/hooks/patients"

export function PatientTreatmentPlans({ patientId }: { patientId: string }) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const isAdmin = String((session?.user as any)?.role || "").toUpperCase() === "ADMIN"
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlPlanId = searchParams.get("planId")
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(urlPlanId || null)
  const [newlyCreatedPlan, setNewlyCreatedPlan] = useState<any | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<{ id: string; permanent: boolean } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFetchingDirect, setIsFetchingDirect] = useState(false)

  const { plans = [], isLoading, refetch } = useGetTreatmentPlans({ patientId })
  const { patient } = useGetPatient(patientId)
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
    setNewlyCreatedPlan(initialData || null)
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

  const planForDeletion = (plans as any[]).find((p: any) => String(p.id) === planToDelete?.id) ||
    (newlyCreatedPlan?.id === planToDelete?.id ? newlyCreatedPlan : null)

  const confirmDeletePlan = async (reason: string): Promise<boolean> => {
    if (!planToDelete || !isAdmin || isDeleting) return false
    setIsDeleting(true)
    try {
      const url = `/api/treatments/${encodeURIComponent(planToDelete.id)}${planToDelete.permanent ? "?force=true" : ""}`
      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast({
          title: "No se pudo procesar el plan",
          description: String(result?.error || `Error HTTP ${response.status}`),
          variant: "destructive",
        })
        return false
      }
      const deletedId = planToDelete.id
      setPlanToDelete(null)
      toast({ title: planToDelete.permanent ? "Plan eliminado definitivamente" : "Plan enviado a la papelera", variant: "success" })
      if (selectedPlanId === deletedId) handleBackToList()
      void refetch()
      return true
    } catch {
      toast({ title: "Error de conexión al gestionar el plan", variant: "destructive" })
      return false
    } finally {
      setIsDeleting(false)
    }
  }

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

      <AdminPlanDeleteDialog
        open={!!planToDelete}
        plan={planForDeletion}
        permanent={!!planToDelete?.permanent}
        loading={isDeleting}
        onClose={() => setPlanToDelete(null)}
        onConfirm={confirmDeletePlan}
      />

      {selectedPlanId ? (
        activePlan ? (
          <TreatmentPlanDetail
            key={activePlan.id}
            plan={activePlan}
            patient={patient}
            onBack={handleBackToList}
            onPlanUpdate={refetch}
            onCorrectedDraft={(newId: string) => {
              void refetch()
              handleSelectPlan(newId)
            }}
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
          onDeletePlan={isAdmin ? (id: string, permanent = false) => setPlanToDelete({ id, permanent }) : undefined}
          refetchPlans={refetch}
        />
      )}
    </div>
  )
}

export default PatientTreatmentPlans