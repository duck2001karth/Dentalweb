"use client"

import React, { useState } from "react"
import { Loader2, Stethoscope } from "lucide-react"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query" 

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

import { useCreateTreatmentPlan } from "@/hooks/treatments"

interface CreatePlanModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  onSuccessCallback?: (planId: string) => void
}

export function CreatePlanModal({ isOpen, onClose, patientId, onSuccessCallback }: CreatePlanModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [newPlanName, setNewPlanName] = useState("")
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(session?.user?.id || "")

  const { createTreatmentPlan, isLoading: isCreating } = useCreateTreatmentPlan()

  const { data: usersData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ["doctorsList"],
    queryFn: async () => {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Error al obtener los doctores')
      return res.json()
    },
    enabled: isOpen, 
  })
  
  const doctors = Array.isArray(usersData) ? usersData.filter((u: any) => u.role === "DOCTOR") : []

  const handleCreatePlan = () => {
    if (!newPlanName.trim()) {
      toast({ title: "Atención", description: "Debes ingresar un nombre para el tratamiento.", variant: "destructive" })
      return
    }

    createTreatmentPlan({
      patientId,
      name: newPlanName,
      doctorId: selectedDoctorId || session?.user?.id, 
      status: "DRAFT", 
      totalCost: 0,
      totalPaid: 0,
    }, {
      onSuccess: (data) => {
        toast({ title: "Plan Creado", description: "El plan de tratamiento se generó correctamente.", variant: "success" })
        setNewPlanName("")
        onClose()
        if (onSuccessCallback && data?.plan?.id) {
          onSuccessCallback(data.plan.id)
        }
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "No se pudo crear el plan.", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] bg-background border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
        
        {/* HEADER PREMIUM */}
        <DialogHeader className="px-6 py-5 border-b border-border bg-slate-50 dark:bg-slate-900/50">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
             <Stethoscope className="w-5 h-5 text-[#008bcd]" /> Nuevo Tratamiento
          </DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground mt-1">
             Asigna un nombre descriptivo y el profesional a cargo.
          </DialogDescription>
        </DialogHeader>
        
        {/* FORMULARIO */}
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">Nombre del Tratamiento *</Label>
            <Input 
              placeholder="Ej: Limpieza, Ortodoncia, Corona..." 
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              className="bg-background border-border h-11 font-semibold focus-visible:ring-[#008bcd] shadow-sm rounded-xl"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">Profesional a cargo</Label>
            <Select 
              value={selectedDoctorId} 
              onValueChange={setSelectedDoctorId}
              disabled={isLoadingDoctors}
            >
              <SelectTrigger className="bg-background border-border h-11 font-semibold focus:ring-[#008bcd] shadow-sm rounded-xl">
                <SelectValue placeholder={isLoadingDoctors ? "Cargando profesionales..." : "Seleccione un profesional"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-xl">
                <SelectItem value={session?.user?.id || "default"} className="font-medium">
                  {session?.user?.name || "Dr. Asignado"} (Tú)
                </SelectItem>
                {doctors.filter((doc: any) => doc.id !== session?.user?.id).map((doctor: any) => (
                  <SelectItem key={doctor.id} value={doctor.id} className="font-medium">
                    {doctor.name || doctor.email} {doctor.specialty ? `(${doctor.specialty})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* FOOTER */}
        <DialogFooter className="px-6 py-4 border-t border-border bg-slate-50/50 dark:bg-muted/20">
          <Button variant="ghost" onClick={onClose} className="font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800">
             Cancelar
          </Button>
          <Button onClick={handleCreatePlan} disabled={isCreating} className="bg-[#008bcd] hover:bg-blue-600 text-white font-bold px-6 shadow-sm rounded-xl transition-all">
            {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Crear Plan
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
