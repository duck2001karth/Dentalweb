"use client"

import React from "react"
import { Stethoscope } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { EvolutionModal } from "@/components/plans-treatment/modals/treatment-plan-evolution"
import { TreatmentCatalogModal } from "@/components/plans-treatment/catalog/treatment-catalog-modal"

const COMMON_DIAGNOSES = [
  "K02.1 - Caries de la dentina",
  "K02.0 - Caries limitada al esmalte",
  "K04.0 - Pulpitis irreversible",
  "K04.1 - Necrosis pulpar",
  "K05.0 - Gingivitis aguda",
  "K05.3 - Periodontitis crónica",
  "K08.1 - Pérdida de dientes por traumatismo o extracción",
  "K07.2 - Anomalías de la relación maxilobasilar (Maloclusión)",
]

export function TreatmentPlanModals({
  plan,
  patient,
  currentUser,
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
  catalogSearch,
  setCatalogSearch,
  filteredCatalog,
  handleAddManualProcedure,
  isAddingProcedure,
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
}: any) {
  return (
    <>
      {/* 1. MODAL AGREGAR FASE / SECCIÓN */}
      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card text-card-foreground border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Agregar Nueva Sección</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Agrupa tus prestaciones clínicas por fases o etapas de tratamiento.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Nombre de la Fase / Sección
            </Label>
            <Input
              placeholder="Ej: Fase 1: Higiene y Operatoria"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              autoFocus
              className="bg-background border-border text-xs font-semibold"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsSectionModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddSection}
              className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold"
            >
              Crear Sección
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. MODAL DESCUENTO GLOBAL */}
      <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card text-card-foreground border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Descuento Comercial</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Porcentaje global aplicado al presupuesto total del plan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                value={tempDiscount}
                onChange={(e) => setTempDiscount(e.target.value)}
                className="pr-10 bg-background border-border text-lg font-bold font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-extrabold text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDiscountModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleApplyDiscount}
              className="bg-[#008bcd] hover:bg-[#0073a8] text-white font-bold"
            >
              Aplicar Descuento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. MODAL CATÁLOGO DESACOPLADO */}
      <TreatmentCatalogModal
        isOpen={isCatalogModalOpen}
        setIsOpen={setIsCatalogModalOpen}
        catalogSearch={catalogSearch}
        setCatalogSearch={setCatalogSearch}
        filteredCatalog={filteredCatalog}
        handleAddManualProcedure={handleAddManualProcedure}
        isAddingProcedure={isAddingProcedure}
        initialLocation={initialLocation} // <--- 2. SE LO ENTREGAMOS AL CATÁLOGO
      />

      {/* 4. MODAL EVOLUCIÓN CLÍNICA (Nota médica y porcentaje) */}
      <EvolutionModal
        isOpen={isEvolutionModalOpen}
        setIsOpen={setIsEvolutionModalOpen}
        patient={patient}
        plan={plan}
        selectedItemToEvolve={selectedItemToEvolve}
        evolutionProgress={evolutionProgress}
        evolutionNote={evolutionNote}
        setEvolutionNote={setEvolutionNote}
        handleSaveEvolution={handleSaveEvolution}
      />

      {/* 5. MODAL DE DIAGNÓSTICO CLÍNICO (CIE-10 Odontológico) */}
      <Dialog open={isDiagnosisModalOpen} onOpenChange={setIsDiagnosisModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 border-b border-border bg-slate-100/80 dark:bg-slate-900/80">
            <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#008bcd]" />
              Ingresar Diagnóstico Odontológico
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Asigne un diagnóstico presuntivo o definitivo según codificación CIE-10.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Diagnósticos CIE-10 Odontológicos Frecuentes
            </Label>
            <select
              value={selectedDiagnosis}
              onChange={(e) => setSelectedDiagnosis(e.target.value)}
              className="w-full h-11 px-3 border border-border rounded-xl text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#008bcd]"
            >
              <option value="">Seleccione un diagnóstico...</option>
              {COMMON_DIAGNOSES.map((diag) => (
                <option key={diag} value={diag}>
                  {diag}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-100/80 dark:bg-slate-900/80 border-t border-border flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDiagnosisModalOpen(false)}
              className="font-bold border-border"
            >
              Cerrar
            </Button>
            <Button
              onClick={handleSaveDiagnosis}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl"
            >
              Guardar Diagnóstico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TreatmentPlanModals