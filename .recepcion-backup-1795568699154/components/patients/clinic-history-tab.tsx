"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

import { HistorialTab } from "@/components/patients-file/history/history-tab"
import { EvolucionesTab } from "@/components/patients-file/evolutions/evolutions-tab"
import { FichaAnamnesisTab } from "@/components/patients-file/anamnesis/anamnesis-tab"
import { OdontogramaTab } from "@/components/patients-file/odontogram/odontogram-tab"
import { PeriodontogramaTab } from "@/components/patients-file/periodontograma/periodontograma-tab"
import { RxDocumentsTab } from "@/components/patients-file/documents/rx-documents-tab"
import { DocumentosClinicosTab } from "@/components/patients-file/documents/document-clinic-tab"
import { RecetasTab } from "@/components/patients-file/recetas/recetas-tab"
import { ConsentimientosTab } from "@/components/patients-file/documents/consents-tab"

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
  const { data: session } = useSession()

  const currentUser = session?.user as any
  const userRole = String(currentUser?.role || "").toUpperCase().trim()
  const isReceptionist = userRole === "RECEPTIONIST"

  const visibleTabs = useMemo(() => {
    if (isReceptionist) {
      return SUB_TABS.filter((tab) => ["historial", "rx", "recetas"].includes(tab.id))
    }
    return SUB_TABS
  }, [isReceptionist])

  const tabFromUrl = searchParams.get("tab")
  const defaultTab = visibleTabs[0]?.id || "historial"

  const [activeTab, setActiveTab] = useState(
    tabFromUrl && visibleTabs.some((t) => t.id === tabFromUrl) ? tabFromUrl : defaultTab
  )

  useEffect(() => {
    if (tabFromUrl && visibleTabs.some((t) => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    } else if (tabFromUrl && !visibleTabs.some((t) => t.id === tabFromUrl)) {
      handleTabChange(defaultTab)
    }
  }, [tabFromUrl, visibleTabs, defaultTab])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const currentParams = new URLSearchParams(searchParams.toString())
    currentParams.set("tab", tabId)
    router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false })
  }

  return (
    <div className="animate-in fade-in duration-300 flex flex-col h-full w-full font-sans">
      {/* Barra de subpestañas clínicas: texto tamaño normal (text-sm / 14px), espaciado uniforme y scrollbar oculta */}
      <div className="w-full border-b border-border/80 mb-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden print:hidden">
        <nav className="flex items-center gap-6 sm:gap-8 pb-px min-w-max px-1">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "py-3 text-sm transition-colors border-b-2 relative -mb-[1px] cursor-pointer select-none outline-none whitespace-nowrap",
                  isActive
                    ? "border-[#008bcd] text-[#008bcd] font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border font-medium"
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Vistas clínicas por subpestaña */}
      <div className="flex-1 w-full">
        {activeTab === "historial" && <HistorialTab patientId={patientId} />}
        {activeTab === "evoluciones" && !isReceptionist && <EvolucionesTab patientId={patientId} />}
        {activeTab === "anamnesis" && !isReceptionist && <FichaAnamnesisTab patientId={patientId} />}
        {activeTab === "odontograma" && !isReceptionist && <OdontogramaTab patientId={patientId} />}
        {activeTab === "periodontograma" && !isReceptionist && <PeriodontogramaTab patientId={patientId} />}
        {activeTab === "rx" && <RxDocumentsTab patientId={patientId} />}
        {activeTab === "recetas" && <RecetasTab patientId={patientId} />}
        {activeTab === "documentos" && !isReceptionist && <DocumentosClinicosTab patientId={patientId} />}
        {activeTab === "consentimientos" && !isReceptionist && <ConsentimientosTab patientId={patientId} />}
      </div>
    </div>
  )
}