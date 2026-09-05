"use client"

import React from "react"
import { AlertTriangle } from "lucide-react"
import { TreatmentPlanModals } from "./treatment-plan-modals"
import { AssignCollaboratorsModal } from "./treatment-collaborators"
import { SignaturePadModal } from "./signature-modal"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"
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
  handleAddSection?: () => void
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
  handleAddManualProcedure: (procedure: any, toothNum?: string) => Promise<void>
  isAddingProcedure: boolean
  targetToothOrRegion?: string
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
  deleteMode: "ALL" | "SELECTED"
  handleClearPlan: () => Promise<void>
  executeDeleteSelected: () => Promise<void>
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
  handleClearPlan,
  executeDeleteSelected,
  itemsToDelete
}: TreatmentDetailDialogsProps) {
  // Construir la ubicación anatómica exacta para el modal
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
        handleAddSection={handleAddSection || (() => setIsSectionModalOpen(false))}
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

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="bg-card border border-border/80 rounded-2xl shadow-2xl sm:max-w-[420px] p-6 font-sans antialiased">
          <AlertDialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center border border-destructive/20">
              <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              {deleteMode === "ALL" ? "¿Vaciar todo el presupuesto?" : "¿Eliminar prestaciones?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-semibold text-muted-foreground leading-relaxed">
              {deleteMode === "ALL" 
                ? "Esta acción eliminará de forma permanente todas las prestaciones cargadas a este plan de tratamiento."
                : `¿Estás seguro de que deseas eliminar las ${itemsToDelete.length} prestación(es) seleccionada(s)? Esta acción es irreversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="w-full flex sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="border-border/80 hover:bg-muted text-foreground font-bold rounded-xl h-10 px-5 text-xs cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteMode === "ALL" ? handleClearPlan : executeDeleteSelected} 
              className="bg-destructive hover:bg-destructive/90 text-white font-bold rounded-xl h-10 px-6 shadow-md text-xs transition-all active:scale-95 cursor-pointer"
            >
              {deleteMode === "ALL" ? "Sí, Vaciar Presupuesto" : "Sí, Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default TreatmentDetailDialogs