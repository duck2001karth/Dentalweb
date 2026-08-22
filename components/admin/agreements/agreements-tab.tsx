"use client"

import React, { useState, useEffect } from "react"
import { Handshake, Plus, Percent, DollarSign, Building2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgreementModal } from "./agreement-modal"
import { useToast } from "@/hooks/use-toast"

export function AgreementsTab() {
  const [agreements, setAgreements] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const loadAgreements = async () => {
    const res = await fetch("/api/agreements")
    if (res.ok) {
      const data = await res.json()
      setAgreements(data)
    }
  }

  useEffect(() => { loadAgreements() }, [])

  const handleSave = async (data: any) => {
    const res = await fetch("/api/agreements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    if (res.ok) {
      toast({ title: "Convenio registrado con éxito" })
      loadAgreements()
      return true
    }
    return false
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center bg-card/50 p-2 rounded-[24px]">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Convenios y Aseguradoras</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Administración de tarifas especiales para empresas y seguros.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#008bcd] hover:bg-[#008bcd]/90 text-white font-bold h-11 px-5 rounded-xl text-xs gap-2">
          <Plus className="w-4 h-4" /> Nuevo Convenio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {agreements.map((ag) => (
          <div key={ag.id} className="bg-card border border-border p-6 rounded-[22px] shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-[#008bcd]/10 text-[#008bcd] border border-[#008bcd]/20 mb-2">
                  {ag.discountType === "PERCENTAGE" ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                  {Number(ag.discountValue)} {ag.discountType === "PERCENTAGE" ? "% OFF" : "USD OFF"}
                </span>
                <h3 className="font-black text-lg text-foreground">{ag.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium mt-0.5">
                  <Building2 className="w-3.5 h-3.5" /> {ag.institutionName}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4 flex justify-between items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5" /> {ag._count?.treatmentPlans || 0} Planes aplicados
              </span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${ag.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                {ag.isActive ? "ACTIVO" : "INACTIVO"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <AgreementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} />
    </div>
  )
}