"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation" 
import { Wrench, Lock, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const SUB_TABS = [
  { id: "pagos", label: "Pagos" },
  { id: "documentos_emitidos", label: "Documentos emitidos" },
  { id: "devoluciones", label: "Devoluciones" },
  { id: "eliminados", label: "Pagos Eliminados" },
  { id: "balance", label: "Balance" },
]

export function PayBillingLayout({ 
  patientId, 
  patient, 
  plans, 
  onRefreshData 
}: { 
  patientId: string;
  patient?: any;
  plans?: any[];
  onRefreshData?: () => void;
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get("tab")

  const [activeTab, setActiveTab] = useState(tabFromUrl || "pagos")

  useEffect(() => {
    if (tabFromUrl && SUB_TABS.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    router.replace(`${pathname}?tab=${tabId}`, { scroll: false })
  }

  const getTabLabel = (id: string) => {
    const tab = SUB_TABS.find(t => t.id === id)
    return tab ? tab.label : id
  }

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full w-full overflow-hidden font-sans">
      
      {/* BARRA DE SUBPESTAÑAS CON ID ÚNICO 'documentos_emitidos' */}
      <div className="w-full border-b border-border mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] print:hidden">
        <div className="flex w-max min-w-full px-2">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 relative -mb-[1px] cursor-pointer",
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

      {/* TARJETA EN DESARROLLO CON NOMBRE EXACTO */}
      <div className="flex-1 w-full flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-card border border-border/80 rounded-2xl p-10 max-w-md text-center shadow-xs space-y-4">
          
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
            <Wrench className="w-8 h-8 animate-pulse stroke-[2]" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Clock className="w-3 h-3" /> Módulo en desarrollo
            </span>
            <h3 className="text-xl font-bold text-foreground">
              Facturación y Pagos ({getTabLabel(activeTab)})
            </h3>
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
              Esta sección está temporalmente deshabilitada por mantenimiento y sincronización con el sistema SRI / Comprobantes.
            </p>
          </div>

          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl text-left text-xs font-semibold text-muted-foreground flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#008bcd] shrink-0" />
            <span>Los cobros directos siguen disponibles desde el botón <b>"Recibir pago"</b>.</span>
          </div>

        </div>
      </div>

    </div>
  )
}