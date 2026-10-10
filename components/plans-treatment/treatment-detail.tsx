"use client"

import React, { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { useTreatmentState } from "./hooks/use-treatment-state"

import { TreatmentPlan } from "@/types/treatments"
import { TreatmentDetailHeader } from "./components/treatment-detail-header"
import { TreatmentSidebar } from "./components/treatment-sidebar"
import { TreatmentTable } from "./components/treatment-table"
import { TreatmentDetailDialogs } from "./modals/treatment-detail-dialogs"
import { TreatmentExtra } from "./components/treatment-extra"
import { OdontogramaTab } from "@/components/patients-file/odontogram/odontogram-tab"
import { printTreatmentPlanSheet, PrintMode } from "@/components/plans-treatment/print/treatment-print-view"
import { useClinicSettings } from "@/config/clinic-settings"

interface TreatmentPlanDetailProps {
  plan: TreatmentPlan | any
  patient: any
  onBack: () => void
  onPlanUpdate?: () => void
  onSaveComment?: (comment: string) => void
  isSavingComment?: boolean
}

export function TreatmentPlanDetail({
  plan,
  patient,
  onBack,
  onSaveComment,
  isSavingComment = false
}: TreatmentPlanDetailProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any

  const { state, setters, handlers } = useTreatmentState(plan, patient, currentUser, toast)
  const { settings } = useClinicSettings()

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [sectionToDelete, setSectionToDelete] = useState<{ id: string; name: string } | null>(null)

  const activeSectionName = useMemo(() => {
    if (!activeSectionId) return null
    const sec = (state.currentPlan?.sections || []).find((s: any) => s.id === activeSectionId)
    return sec?.name || null
  }, [activeSectionId, state.currentPlan?.sections])

  const calculateAge = (birthDate: string | Date | undefined) => {
    if (!birthDate) return undefined
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age > 0 ? age : undefined
  }

  const patientAge = patient?.age || calculateAge(patient?.birthDate)

  const handlePrint = (mode: PrintMode = "COMPLETO") => {
    const subtotal = state.calculatedTotals.subtotal
    const discountPct = state.discountPercent
    const discountAmt = subtotal * (discountPct / 100)
    const finalTotal = Math.max(0, subtotal - discountAmt)
    const autoRecoveredSignature = state.currentPlan?.patient?.signatureBase64 || patient?.signatureBase64

    printTreatmentPlanSheet({
      plan: { ...state.currentPlan, items: state.planItems },
      patient,
      patientAge,
      baseTotal: subtotal,
      discountPercent: discountPct,
      discountAmount: discountAmt,
      finalTotalCost: finalTotal,
      commentText: state.currentPlan?.comment,
      autoRecoveredSignature,
      getSignatureSrc: (sig: string) => sig.startsWith("data:") ? sig : `data:image/png;base64,${sig}`,
      printMode: mode,
      settings
    })
  }

  return (
    <div className="w-full font-sans antialiased animate-in fade-in duration-300 relative">
      <div className="print:hidden space-y-6">
       <TreatmentDetailHeader 
          planId={plan.id}
          patient={patient}
          onBack={onBack}
          onRefreshData={handlers.refreshPlanData}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <TreatmentSidebar 
              plan={{
                ...state.currentPlan,
                totalCost: state.calculatedTotals.subtotal,
                totalPaid: state.calculatedTotals.totalPaid,
                discount: state.discountPercent,
                collaborators: state.collaborators 
              }}
              patient={patient}
              currentUser={currentUser}
              onOpenDiscountModal={() => {
                setters.setTempDiscount(String(state.discountPercent))
                setters.setIsDiscountModalOpen(true)
              }}
              setTempDiscount={setters.setTempDiscount} 
              onOpenCollaboratorsModal={() => setters.setIsCollaboratorsOpen(true)}
              onOpenSignatureModal={() => setters.setIsSignatureModalOpen(true)}
              onPlanUpdate={handlers.refreshPlanData}
              onApplyAgreement={handlers.handleApplyAgreement}
            />
          </div>

          {/* COLUMNA DERECHA */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-xs">
              <OdontogramaTab 
                patientId={patient?.id}
                planId={plan.id}
                isPlanView={true}
                onToothClickCallback={(tooth: number) => {
                  if (tooth > 0) {
                    setActiveSectionId(null)
                    setters.setTargetToothOrRegion(String(tooth))
                    setters.setIsCatalogModalOpen(true)
                  }
                }}
                onPlanUpdate={handlers.refreshPlanData}
              />
            </div>

            <TreatmentTable 
              planId={plan.id}
              planItems={state.planItems}
              sections={state.currentPlan?.sections || []} 
              planDiscountPercent={state.discountPercent}
              setIsSectionModalOpen={setters.setIsSectionModalOpen}
              onRequestDeleteSection={(sec: { id: string; name: string }) => {
                setSectionToDelete(sec)
                setters.setDeleteMode("SECTION" as any)
                setters.setIsDeleteModalOpen(true)
              }}
              openCatalogModal={(region?: string, sectionId?: string) => {
                setters.setTargetToothOrRegion(region || "")
                setActiveSectionId(sectionId || null)
                setters.setIsCatalogModalOpen(true)
              }}
              setIsDiagnosisModalOpen={setters.setIsDiagnosisModalOpen}
              setIsConfirmClearOpen={() => {
                setters.setDeleteMode("ALL")
                setters.setIsDeleteModalOpen(true)
              }}
              onDeleteSelectedItems={handlers.handleDeleteSelected}
              openEvolutionModal={(item: any, prog: number) => {
                setters.setSelectedItemToEvolve(item)
                setters.setEvolutionProgress(prog)
                setters.setEvolutionNote(item.evolutionNote || "")
                setters.setIsEvolutionModalOpen(true)
              }}
              onUpdateItemDiscount={handlers.handleUpdateItemDiscount}
              onUpdateItemRegion={handlers.handleUpdateItemRegion}
              onPlanUpdate={handlers.refreshPlanData}
              onSelectPrintMode={(mode: any) => {
                handlePrint(mode as PrintMode)
              }}
            />
            <TreatmentExtra 
              plan={state.currentPlan}
              patient={patient}
              onSaveComment={onSaveComment}
              isSavingComment={isSavingComment}
              planSignature={state.currentPlan?.patient?.signatureBase64 || patient?.signatureBase64} 
              setIsSignatureModalOpen={setters.setIsSignatureModalOpen} 
              signedConsents={state.signedConsents} 
              onPlanUpdate={handlers.refreshPlanData}
              currentUser={currentUser}
              onApproveWithSavedSignature={handlers.handleApprovePlan} 
            />
          </div>
        </div>
      </div>
      
      {/* DIÁLOGOS Y MODALES */}
      <div className="print:hidden">
        <TreatmentDetailDialogs
          plan={state.currentPlan}
          patient={patient}
          currentUser={currentUser}
          planItems={state.planItems}
          isSectionModalOpen={state.isSectionModalOpen}
          setIsSectionModalOpen={setters.setIsSectionModalOpen}
          sectionName={state.sectionName}
          setSectionName={setters.setSectionName}
          handleCreateSection={handlers.handleCreateSection}
          isDiscountModalOpen={state.isDiscountModalOpen}
          setIsDiscountModalOpen={setters.setIsDiscountModalOpen}
          tempDiscount={state.tempDiscount}
          setTempDiscount={setters.setTempDiscount}
          handleApplyDiscount={handlers.handleApplyDiscount}
          isCatalogModalOpen={state.isCatalogModalOpen}
          setIsCatalogModalOpen={(open) => {
            setters.setIsCatalogModalOpen(open)
            if (!open) setActiveSectionId(null)
          }}
          catalogSearch={state.catalogSearch}
          setCatalogSearch={setters.setCatalogSearch}
          filteredCatalog={[]}
          handleAddManualProcedure={async (proc: any, toothOrRegionValue?: string, sectionId?: string | null) => {
            const finalProc = {
              ...proc,
              sectionId: sectionId !== undefined ? sectionId : activeSectionId
            }
            await (handlers.handleAddManualProcedure as any)(finalProc, toothOrRegionValue)
          }}
          isAddingProcedure={state.isAddingProcedure}
          targetToothOrRegion={state.targetToothOrRegion}
          targetSectionId={activeSectionId}
          targetSectionName={activeSectionName}
          isEvolutionModalOpen={state.isEvolutionModalOpen}
          setIsEvolutionModalOpen={setters.setIsEvolutionModalOpen}
          evolutionProgress={state.evolutionProgress}
          selectedItemToEvolve={state.selectedItemToEvolve}
          evolutionNote={state.evolutionNote}
          setEvolutionNote={setters.setEvolutionNote}
          handleSaveEvolution={handlers.handleSaveEvolution}
          isDiagnosisModalOpen={state.isDiagnosisModalOpen}
          setIsDiagnosisModalOpen={setters.setIsDiagnosisModalOpen}
          selectedDiagnosis={state.selectedDiagnosis}
          setSelectedDiagnosis={setters.setSelectedDiagnosis}
          isSignatureModalOpen={state.isSignatureModalOpen}
          setIsSignatureModalOpen={setters.setIsSignatureModalOpen}
          handleSaveSignature={handlers.handleSaveSignature}
          isCollaboratorsOpen={state.isCollaboratorsOpen}
          setIsCollaboratorsOpen={setters.setIsCollaboratorsOpen}
          collaborators={state.collaborators}
          setCollaborators={setters.setCollaborators}
          isDeleteModalOpen={state.isDeleteModalOpen}
          setIsDeleteModalOpen={setters.setIsDeleteModalOpen}
          deleteMode={state.deleteMode as any}
          sectionToDelete={sectionToDelete}
          handleClearPlan={handlers.handleClearPlan}
          executeDeleteSelected={handlers.executeDeleteSelected}
          handleDeleteSection={async () => {
            if (!sectionToDelete) return
            try {
              const res = await fetch(`/api/treatments/${plan.id}/sections/${sectionToDelete.id}`, {
                method: "DELETE"
              })
              if (!res.ok) throw new Error("No se pudo eliminar la fase")
              toast({ title: "Fase eliminada", variant: "success" })
              setSectionToDelete(null)
              setters.setIsDeleteModalOpen(false)
              await handlers.refreshPlanData()
            } catch (err: any) {
              toast({ 
                title: "Error al eliminar fase", 
                description: err.message, 
                variant: "destructive" 
              })
            }
          }}
          itemsToDelete={state.itemsToDelete}
          onPlanUpdate={handlers.refreshPlanData}
        />
      </div>
    </div>
  )
}

export default TreatmentPlanDetail