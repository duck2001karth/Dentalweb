"use client"

import React, { useState } from "react"
import { Plus, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TreatmentPlanCard } from "@/components/plans-treatment/treatment-card"

export function TreatmentPlanList({ 
  plans, isLoading, patientName, onNewPlan, onSelectPlan, onDeletePlan 
}: { 
  plans: any[], isLoading: boolean, patientName: string, 
  onNewPlan: () => void, onSelectPlan: (id: string) => void, onDeletePlan: (id: string) => void 
}) {
  const [filter, setFilter] = useState("ACTIVE")

  const filteredPlans = plans.filter((p: any) => {
    if (filter === "ACTIVE") return p.status !== "CANCELLED";
    return p.status === filter;
  })

  const sectionTitle = filter === "ACTIVE" ? "En ejecución" : filter === "DRAFT" ? "Borradores / Diagnóstico" : filter === "COMPLETED" ? "Finalizados" : "Todos los planes"

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-4 rounded-xl border border-border shadow-sm">
        <h2 className="text-2xl font-light text-muted-foreground">Planes de tratamiento</h2>
        
        <div className="flex items-center gap-4">
          <select 
            className="h-10 px-3 py-2 text-sm border border-border rounded-md bg-transparent text-[#008bcd] font-medium outline-none cursor-pointer"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ACTIVE">Tratamientos activos</option>
            <option value="DRAFT">Borradores</option>
            <option value="COMPLETED">Finalizados</option>
            <option value="ALL">Todos</option>
          </select>

          <Button onClick={onNewPlan} className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold h-10 shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Nuevo plan
          </Button>
        </div>
      </div>

      <h3 className="text-2xl font-light text-[#008bcd]">{sectionTitle}</h3>
      <div className="space-y-4">
        {isLoading && (<Skeleton className="h-[200px] w-full rounded-xl bg-muted/50" />)}
        
        {!isLoading && filteredPlans.length === 0 && (
           <div className="text-center py-20 bg-white dark:bg-card rounded-2xl border border-dashed border-border shadow-sm">
             <ClipboardList className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-3" />
             <p className="text-lg font-bold text-foreground">No hay planes en esta categoría</p>
           </div>
        )}

        {!isLoading && filteredPlans.map((plan: any) => (
           <TreatmentPlanCard 
             key={plan.id} 
             plan={plan} 
             onClick={() => onSelectPlan(plan.id)} 
             onDelete={(e) => { e.stopPropagation(); onDeletePlan(plan.id); }} 
           />
        ))}
      </div>
    </div>
  )
}