"use client"

import React, { useState } from "react"
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
import { TreatmentPrintView, PrintMode } from "./print/treatment-print-view"

interface TreatmentPlanDetailProps {
  plan: TreatmentPlan | any
  patient: any
  onBack: () => void
  onPlanUpdate?: () => void
  onSaveComment?: (comment: string) => void
  isSavingComment?: boolean
}

export function TreatmentPlanDetail({
  plan, patient, onBack, onSaveComment, isSavingComment = false
}: TreatmentPlanDetailProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any

  const { state, setters, handlers } = useTreatmentState(plan, patient, currentUser, toast)
  const [printMode, setPrintMode] = useState<PrintMode>("COMPLETO")
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

  return (
    <div className="w-full font-sans antialiased animate-in fade-in duration-300 relative">
      <div className="print:hidden space-y-6">
        <TreatmentDetailHeader 
          planId={plan.id} 
          patient={patient} 
          onBack={onBack} 
          onRefreshData={handlers.refreshPlanData}
          onSelectRegion={(region: string) => {
            setters.setTargetToothOrRegion(region)
            setters.setIsCatalogModalOpen(true)
          }}
          onClearPlan={() => {
            setters.setDeleteMode("ALL")
            setters.setIsDeleteModalOpen(true)
          }}
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
              onOpenCollaboratorsModal={() => setters.setIsCollaboratorsOpen(true)}
              onOpenSignatureModal={() => setters.setIsSignatureModalOpen(true)}
              onPlanUpdate={handlers.refreshPlanData}
              onApplyAgreement={handlers.handleApplyAgreement}
            />
          </div>

          {/* COLUMNA DERECHA: ODONTOGRAMA, TABLA Y FIRMAS */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-xs">
              <OdontogramaTab 
                patientId={patient?.id}
                planId={plan.id}
                isPlanView={true}
                onToothClickCallback={(tooth: number) => {
                  if (tooth > 0) {
                    setters.setTargetToothOrRegion(String(tooth))
                    setters.setIsCatalogModalOpen(true)
                  }
                }}
                onPlanUpdate={handlers.refreshPlanData}
              />
            </div>

            <TreatmentTable 
              planItems={state.planItems}
              planDiscountPercent={state.discountPercent}
              setIsSectionModalOpen={setters.setIsSectionModalOpen}
              openCatalogModal={(region?: string) => {
                setters.setTargetToothOrRegion(region)
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
              onSelectPrintMode={(mode: string) => {
                setPrintMode(mode as PrintMode)
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
      <TreatmentPrintView
        plan={{ ...state.currentPlan, items: state.planItems }}
        patient={patient}
        patientAge={patientAge}
        baseTotal={state.calculatedTotals.subtotal}
        discountPercent={state.discountPercent}
        discountAmount={state.calculatedTotals.subtotal * (state.discountPercent / 100)}
        finalTotalCost={Math.max(0, state.calculatedTotals.subtotal - (state.calculatedTotals.subtotal * (state.discountPercent / 100)))}
        commentText={state.currentPlan?.comment}
        autoRecoveredSignature={state.currentPlan?.patient?.signatureBase64 || patient?.signatureBase64}
        getSignatureSrc={(sig: string) => sig.startsWith("data:") ? sig : `data:image/png;base64,${sig}`}
        printMode={printMode}
      />
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
          isDiscountModalOpen={state.isDiscountModalOpen}
          setIsDiscountModalOpen={setters.setIsDiscountModalOpen}
          tempDiscount={state.tempDiscount}
          setTempDiscount={setters.setTempDiscount}
          handleApplyDiscount={handlers.handleApplyDiscount}
          isCatalogModalOpen={state.isCatalogModalOpen}
          setIsCatalogModalOpen={setters.setIsCatalogModalOpen}
          catalogSearch={state.catalogSearch}
          setCatalogSearch={setters.setCatalogSearch}
          filteredCatalog={[]}
          handleAddManualProcedure={handlers.handleAddManualProcedure}
          isAddingProcedure={state.isAddingProcedure}
          targetToothOrRegion={state.targetToothOrRegion}
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
          deleteMode={state.deleteMode}
          handleClearPlan={handlers.handleClearPlan}
          executeDeleteSelected={handlers.executeDeleteSelected}
          itemsToDelete={state.itemsToDelete}
          onPlanUpdate={handlers.refreshPlanData}
        />
      </div>
      
    </div>
  )
}

export default TreatmentPlanDetail