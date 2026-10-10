"use client"

import React from "react"
import { TreatmentPlanModals } from "./treatment-plan-modals"
import { AssignCollaboratorsModal } from "./treatment-collaborators"
import { SignaturePadModal } from "./signature-modal"
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog"
import { TreatmentPlan, TreatmentItem, EvolutionInput } from "@/types/treatments"

interface TreatmentDetailDialogsProps {
  plan: TreatmentPlan
  patient: any
  currentUser: any
  planItems: TreatmentItem[]
  isSectionModalOpen: boolean
  setIsSectionModalOpen: (open: boolean) => void
  sectionName: string
  setSectionName: (name: string) => void
  handleAddSection?: () => void | Promise<void>
  handleCreateSection?: () => void | Promise<void>
  isDiscountModalOpen: boolean
  setIsDiscountModalOpen: (open: boolean) => void
  tempDiscount: string
  setTempDiscount: (val: string) => void
  handleApplyDiscount: () => void
  isCatalogModalOpen: boolean
  setIsCatalogModalOpen: (open: boolean) => void
  catalogSearch?: string
  setCatalogSearch?: (search: string) => void
  filteredCatalog?: any[]
  handleAddManualProcedure: (procedure: any, toothNum?: string, sectionId?: string | null) => Promise<void> | void
  isAddingProcedure: boolean
  targetToothOrRegion?: string
  targetSectionId?: string | null
  targetSectionName?: string | null
  initialLocation?: { type: "GENERAL" | "TOOTH" | "ARCADA" | "SEXTANTE"; value: string }
  isEvolutionModalOpen: boolean
  setIsEvolutionModalOpen: (open: boolean) => void
  evolutionProgress: number
  selectedItemToEvolve: TreatmentItem | null
  evolutionNote: string
  setEvolutionNote: (note: string) => void
  handleSaveEvolution: (data?: EvolutionInput) => Promise<void>
  isDiagnosisModalOpen: boolean
  setIsDiagnosisModalOpen: (open: boolean) => void
  selectedDiagnosis: string
  setSelectedDiagnosis: (diag: string) => void
  handleSaveDiagnosis?: () => void
  isSignatureModalOpen: boolean
  setIsSignatureModalOpen: (open: boolean) => void
  handleSaveSignature: (signature: string) => Promise<void>
  isCollaboratorsOpen: boolean
  setIsCollaboratorsOpen: (open: boolean) => void
  collaborators: string[]
  setCollaborators: (collabs: string[]) => void
  isDeleteModalOpen: boolean
  setIsDeleteModalOpen: (open: boolean) => void
  deleteMode: "ALL" | "SELECTED" | "SECTION"
  sectionToDelete?: { id: string; name: string } | null
  handleClearPlan: () => Promise<void>
  executeDeleteSelected: () => Promise<void>
  handleDeleteSection?: () => Promise<void>
  onPlanUpdate?: () => void
  itemsToDelete: string[]
}

export function TreatmentDetailDialogs({
  plan,
  patient,
  currentUser,
  planItems,
  isSectionModalOpen,
  setIsSectionModalOpen,
  sectionName,
  setSectionName,
  handleAddSection,
  handleCreateSection,
  isDiscountModalOpen,
  setIsDiscountModalOpen,
  tempDiscount,
  setTempDiscount,
  handleApplyDiscount,
  isCatalogModalOpen,
  setIsCatalogModalOpen,
  catalogSearch = "",
  setCatalogSearch,
  filteredCatalog = [],
  handleAddManualProcedure,
  isAddingProcedure,
  targetToothOrRegion,
  targetSectionId,
  targetSectionName,
  initialLocation,
  isEvolutionModalOpen,
  setIsEvolutionModalOpen,
  evolutionProgress,
  selectedItemToEvolve,
  evolutionNote,
  setEvolutionNote,
  handleSaveEvolution,
  isDiagnosisModalOpen,
  setIsDiagnosisModalOpen,
  selectedDiagnosis,
  setSelectedDiagnosis,
  handleSaveDiagnosis,
  isSignatureModalOpen,
  setIsSignatureModalOpen,
  handleSaveSignature,
  isCollaboratorsOpen,
  setIsCollaboratorsOpen,
  collaborators,
  setCollaborators,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  deleteMode,
  sectionToDelete,
  handleClearPlan,
  executeDeleteSelected,
  handleDeleteSection,
  itemsToDelete
}: TreatmentDetailDialogsProps) {
  
  const onSectionSubmit = handleCreateSection || handleAddSection || (() => setIsSectionModalOpen(false))
  const computedLocation = initialLocation || (targetToothOrRegion ? {
    type: targetToothOrRegion.includes("Arcada")
      ? ("ARCADA" as const)
      : targetToothOrRegion.includes("Sextante")
      ? ("SEXTANTE" as const)
      : targetToothOrRegion.toLowerCase() === "general"
      ? ("GENERAL" as const)
      : ("TOOTH" as const),
    value: targetToothOrRegion === "GENERAL" ? "" : targetToothOrRegion
  } : { type: "GENERAL" as const, value: "" })

  // Textos y Acciones Dinámicas para el Dialog Reutilizable
  const deleteTitle = deleteMode === "ALL"
    ? "¿Vaciar todo el presupuesto?"
    : deleteMode === "SECTION"
    ? `¿Eliminar "${sectionToDelete?.name || "esta fase"}"?`
    : "¿Eliminar prestaciones?"

  const deleteDescription = deleteMode === "ALL"
    ? "Esta acción eliminará de forma permanente todas las prestaciones cargadas a este plan de tratamiento."
    : deleteMode === "SECTION"
    ? "La fase será eliminada del presupuesto. Las prestaciones que contenía no se borrarán; pasarán automáticamente a la lista general."
    : `¿Es seguro de que deseas eliminar las ${itemsToDelete.length} prestación(es) seleccionada(s)? Esta acción es irreversible.`

  const confirmDeleteHandler = deleteMode === "ALL"
    ? handleClearPlan
    : deleteMode === "SECTION"
    ? handleDeleteSection!
    : executeDeleteSelected

  const confirmDeleteText = deleteMode === "ALL" ? "Sí, Vaciar Presupuesto" : "Sí, Eliminar"

  return (
    <>
      <TreatmentPlanModals
         plan={{ ...plan, items: planItems }}
         patient={patient}
         currentUser={currentUser}
         isSectionModalOpen={isSectionModalOpen}
         setIsSectionModalOpen={setIsSectionModalOpen}
         sectionName={sectionName}
         setSectionName={setSectionName}
         handleAddSection={onSectionSubmit}
         isDiscountModalOpen={isDiscountModalOpen}
         setIsDiscountModalOpen={setIsDiscountModalOpen}
         tempDiscount={tempDiscount}
         setTempDiscount={setTempDiscount}
         handleApplyDiscount={handleApplyDiscount}
         isCatalogModalOpen={isCatalogModalOpen}
         setIsCatalogModalOpen={setIsCatalogModalOpen}
         catalogSearch={catalogSearch}
         setCatalogSearch={setCatalogSearch}
         filteredCatalog={filteredCatalog}
         handleAddManualProcedure={handleAddManualProcedure}
         isAddingProcedure={isAddingProcedure}
         targetSectionId={targetSectionId}
         targetSectionName={targetSectionName}
         initialLocation={computedLocation}
         isEvolutionModalOpen={isEvolutionModalOpen}
         setIsEvolutionModalOpen={setIsEvolutionModalOpen}
         evolutionProgress={evolutionProgress}
         selectedItemToEvolve={selectedItemToEvolve}
         evolutionNote={evolutionNote}
         setEvolutionNote={setEvolutionNote}
         handleSaveEvolution={handleSaveEvolution}
         isDiagnosisModalOpen={isDiagnosisModalOpen}
         setIsDiagnosisModalOpen={setIsDiagnosisModalOpen}
         selectedDiagnosis={selectedDiagnosis}
         setSelectedDiagnosis={setSelectedDiagnosis}
         handleSaveDiagnosis={handleSaveDiagnosis || (() => setIsDiagnosisModalOpen(false))}
      />

      <SignaturePadModal
         isOpen={isSignatureModalOpen}
         setIsOpen={setIsSignatureModalOpen}
         onSaveSignature={handleSaveSignature}
         patientName={`${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Paciente"}
       />

      <AssignCollaboratorsModal
         isOpen={isCollaboratorsOpen}
         setIsOpen={setIsCollaboratorsOpen}
         planId={plan?.id}
         mainDoctorId={plan?.doctorId || plan?.doctor?.id}
         currentUser={currentUser}
         currentCollaborators={collaborators}
         onSaveCollaborators={(selected: string[]) => setCollaborators(selected)}
       />

      <ConfirmDestructiveDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteHandler}
        title={deleteTitle}
        description={deleteDescription}
        confirmText={confirmDeleteText}
        iconType="warning"
      />
    </>
  )
}

export default TreatmentDetailDialogs