"use client"

import React from "react"
import { format, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { Edit2, User, Users, ClipboardList, Calendar, Clock, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TreatmentSidebar({
  plan,
  patient,
  finalTotalCost,
  discountPercent,
  setTempDiscount,
  setIsDiscountModalOpen,
  totalPaid,
  debt,
  handleCotizarConvenio,
  setIsCollaboratorsOpen,
  collaborators,
  appointmentList,
  planItems = []
}: any) {
  // Cálculo de Progreso
  const totalItemsCount = planItems.length;
  const completedItemsCount = planItems.filter((i: any) => i.isCompleted || i.progress === 100).length;
  const progressPercent = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;

  // Fecha de Vencimiento (30 días desde la creación)
  const creationDate = plan?.createdAt ? new Date(plan.createdAt) : new Date();
  const expirationDate = addDays(creationDate, 30);

  return (
    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 sticky top-24 self-start">
      
      {/* TARJETA DE PRESUPUESTO CON BARRA DE PROGRESO */}
      <div className="shadow-lg rounded-2xl overflow-hidden border border-border bg-card">
        <div className="bg-[#00b0e9] p-5 text-white relative">
          <p className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">Plan de Tratamiento</p>
          <h3 className="text-2xl font-extrabold leading-tight">{plan.name}</h3>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center pb-4 border-b border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Presupuesto Total</p>
            <h4 className="text-4xl font-black text-[#00b0e9]">${finalTotalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
          </div>

          <div className="flex justify-between items-center text-sm font-bold text-foreground">
            <span>Descuento Comercial</span>
            <span 
              className="flex items-center gap-1.5 cursor-pointer text-[#00b0e9] hover:underline" 
              onClick={() => { setTempDiscount(discountPercent.toString()); setIsDiscountModalOpen(true); }}
            >
              {discountPercent}% <Edit2 className="w-3 h-3" />
            </span>
          </div>

          <div className="space-y-2 text-sm pt-1">
            <div className="flex justify-between text-muted-foreground border-b border-dashed border-border pb-1">
              <span>Realizado</span>
              <span className="font-bold text-emerald-600">${(finalTotalCost * (progressPercent / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-muted-foreground border-b border-dashed border-border pb-1">
              <span>Abonado</span>
              <span className="font-bold text-blue-600">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground pt-1">
              <span>Saldo por Abonar</span>
              <span className="text-red-500">${debt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* BARRA DE PROGRESO GENERAL DEL PLAN */}
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground">Progreso del Plan:</span>
              <span className="text-[#00b0e9]">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00b0e9] rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <Button onClick={handleCotizarConvenio} className="w-full bg-[#00b0e9] hover:bg-[#0095c6] text-white font-bold rounded-xl mt-2">
            Cotizar con múltiples convenios
          </Button>
        </div>
      </div>

      {/* CONTROL DE VENCIMIENTO DEL PRESUPUESTO */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-500 shrink-0" />
        <div className="text-xs">
          <p className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Vencimiento de Aranceles</p>
          <p className="text-muted-foreground font-medium mt-0.5">
            Válido hasta: <b className="text-foreground">{format(expirationDate, "dd 'de' MMMM, yyyy", { locale: es })}</b>
          </p>
        </div>
      </div>

      {/* PERSONAL A CARGO */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-5 space-y-4 text-sm">
        <div className="flex gap-3">
          <User className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Profesional a cargo</p>
            <p className="font-bold text-[#00b0e9]">{plan.doctor?.name || "Dr(a) Asignado"}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Users className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Colaboradores</p>
            <button onClick={() => setIsCollaboratorsOpen(true)} className="font-bold text-[#00b0e9] hover:underline text-xs">
              {collaborators.length > 0 ? `${collaborators.length} Colaboradores` : "Asignar colaboradores"}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <ClipboardList className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Convenio / EPS</p>
            <p className="font-bold text-foreground">{patient?.convenio || "Particular / Sin convenio"}</p>
          </div>
        </div>
      </div>

      {/* CITAS DEL PACIENTE */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Calendar className="w-4 h-4 text-[#00b0e9]" />
          <h4 className="font-bold text-sm text-foreground">Citas del paciente</h4>
        </div>
        {appointmentList.length > 0 ? (
          <div className="space-y-3">
            {appointmentList.slice(0, 3).map((cita: any, idx: number) => (
              <div key={idx} className="p-3 bg-muted/30 border border-border rounded-xl text-xs space-y-1">
                <p className="font-bold text-foreground">Cita #{cita.id?.slice(-4)?.toUpperCase() || idx + 1}</p>
                <p className="text-muted-foreground font-medium">{cita.date ? format(new Date(cita.date), "dd 'de' MMMM, HH:mm", { locale: es }) : "Fecha no asignada"}</p>
                <p className="text-[#00b0e9] font-semibold">{cita.doctor?.name || plan.doctor?.name || "Dr. Asignado"}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No hay citas registradas para este paciente.</p>
        )}
      </div>

    </div>
  )
}