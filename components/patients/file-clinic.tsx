"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation" 
import { cn } from "@/lib/utils"

import { HistorialTab } from "@/components/patients-file/history/history-tab"
import { EvolucionesTab } from "@/components/patients-file/evolutions/evolutions-tab"
import { FichaAnamnesisTab } from "@/components/patients-file/anamnesis/anamnesis-tab"
import { OdontogramaTab } from "@/components/patients-file/odontogram/odontogram-tab"
import { PeriodontogramaTab } from "@/components/patients-file/periodontograma/periodontograma-tab"
import { RxDocumentsTab } from "@/components/patients-file/documents/rx-documents-tab"
import { DocumentosClinicosTab } from "@/components/patients-file/documents/document-clinic-tab"
import { RecetasTab } from "@/components/patients-file/recetas/recetas-tab"
import { ConsentimientosTab } from "../patients-file/documents/consents-tab"

const SUB_TABS = [
  { id: "historial", label: "Historial" },
  { id: "evoluciones", label: "Evoluciones" },
  { id: "anamnesis", label: "Ficha Anamnesis" },
  { id: "odontograma", label: "Odontograma" },
  { id: "periodontograma", label: "Periodontograma" },
  { id: "rx", label: "Rx y Documentos" },
  { id: "recetas", label: "Recetas" },
  { id: "documentos", label: "Documentos Clínicos" },
  { id: "consentimientos", label: "Consentimientos" },
]

export function FichaClinicaLayout({ patientId }: { patientId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get("tab")

  const [activeTab, setActiveTab] = useState(tabFromUrl || "historial")

  useEffect(() => {
    if (tabFromUrl && SUB_TABS.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])


  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    router.replace(`${pathname}?tab=${tabId}`, { scroll: false })
  }

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full w-full overflow-hidden">
      
      <div className="w-full border-b border-border mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] print:hidden">
        <div className="flex w-max min-w-full px-2">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 relative -mb-[1px]",
                activeTab === tab.id 
                  ? "border-[#008bcd] text-[#008bcd] dark:text-blue-400" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Renderizado Dinámico del Componente Activo */}
      <div className="flex-1 w-full">
        {activeTab === "historial" && <HistorialTab patientId={patientId} />}
        {activeTab === "evoluciones" && <EvolucionesTab patientId={patientId} />}
        {activeTab === "anamnesis" && <FichaAnamnesisTab patientId={patientId} />}
        {activeTab === "odontograma" && <OdontogramaTab patientId={patientId} />}
        {activeTab === "periodontograma" && <PeriodontogramaTab patientId={patientId} />}
        {activeTab === "rx" && <RxDocumentsTab patientId={patientId} />}
        {activeTab === "recetas" && <RecetasTab patientId={patientId} />}
        {activeTab === "documentos" && <DocumentosClinicosTab patientId={patientId} />}
        {activeTab === "consentimientos" && <ConsentimientosTab patientId={patientId} />}
      </div>
    </div>
  )
}