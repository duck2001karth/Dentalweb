"use client"

import React, { useState, useEffect, useMemo } from "react"
import { 
  Loader2, Save, User, MapPin, HeartPulse, ShieldAlert, 
  X, Plus, ChevronRight, ChevronLeft, CheckCircle2, 
  Calendar, Phone, Mail, Map, Home, Droplet, Stethoscope 
} from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export const PatientsForm = ({ isOpen, onClose, onSuccess, initialData = null }: any) => {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  const isEditing = !!initialData

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    tipoIdentificacion: "Cédula De Ciudadanía",
    ci: "",
    birthDate: "",
    sexo: "Femenino",
    phone: "",
    email: "",
    ciudad: "",
    departamento: "",
    address: "",
    eps: "",
    grupoSanguineo: "O+",
    medicalAlerts: "",
  })
  const patientAge = useMemo(() => {
    if (!formData.birthDate) return null
    const birthDate = new Date(formData.birthDate)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }, [formData.birthDate])

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setFormData({
        firstName: initialData?.firstName || "",
        lastName: initialData?.lastName || "",
        tipoIdentificacion: initialData?.tipoIdentificacion || "Cédula De Ciudadanía",
        ci: initialData?.ci || "",
        birthDate: initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : "",
        sexo: initialData?.sexo || "Femenino",
        phone: initialData?.phone || "",
        email: initialData?.email || "",
        ciudad: initialData?.ciudad || "",
        departamento: initialData?.departamento || "",
        address: initialData?.address || "",
        eps: initialData?.eps || "",
        grupoSanguineo: initialData?.grupoSanguineo || "O+",
        medicalAlerts: initialData?.medicalAlerts || "",
      })
    }
  }, [isOpen, initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const formattedValue = (name === "firstName" || name === "lastName") 
      ? value.replace(/\b\w/g, l => l.toUpperCase()) 
      : value
      
    setFormData(prev => ({ ...prev, [name]: formattedValue }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.ci || !formData.birthDate) {
        toast({ title: "Datos incompletos", description: "Por favor llena los campos obligatorios marcados con (*)", variant: "destructive" })
        return
      }
    }
    setStep(prev => prev + 1)
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step < 3) {
      e.preventDefault()
      handleNext()
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    const patientDataToSave = {
      ...formData,
      birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : undefined,
      medicalAlerts: formData.medicalAlerts.trim() === "" ? null : formData.medicalAlerts,
    }

    try {
      const url = isEditing ? `/api/patients/${initialData.id}` : '/api/patients'
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: patientDataToSave }),
      })

      if (!response.ok) {
        if (response.status === 409) throw new Error("DUPLICATE_CI")
        throw new Error("Error al guardar")
      }

      toast({ 
        title: isEditing ? "Paciente actualizado" : "Paciente registrado", 
        description: isEditing ? "Los cambios se guardaron con éxito." : "El nuevo paciente ha sido añadido al sistema.",
        variant: "success" 
      })
      
      onSuccess() 
      onClose()  
    } catch (error: any) {
      if (error.message === "DUPLICATE_CI") {
        toast({ title: "Documento duplicado", description: "Ya existe un paciente registrado con este número de CI/Identificación.", variant: "destructive" })
        setStep(1)
      } else {
        toast({ title: "Error", description: "Hubo un problema al procesar la solicitud.", variant: "destructive" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] bg-card border-border/60 p-0 overflow-hidden flex flex-col gap-0 rounded-[24px] shadow-2xl [&>button]:hidden">
        
        {/* CABECERA DEL MODAL */}
        <DialogHeader className="px-8 py-6 border-b border-border/50 bg-muted/10 flex flex-row items-start justify-between sticky top-0 z-10">
          <div>
            <DialogTitle className="text-xl md:text-2xl font-black text-foreground tracking-tight">
              {isEditing ? "Editar Perfil del Paciente" : "Registrar Nuevo Paciente"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5 font-medium">
              Completa la información requerida a continuación. Los campos con <span className="text-rose-500 font-bold">(*)</span> son obligatorios.
            </DialogDescription>
          </div>
          <button onClick={onClose} className="p-2 bg-muted/50 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X size={18} strokeWidth={2.5} />
          </button>
        </DialogHeader>
        <div className="px-8 py-5 bg-background border-b border-border/50 flex items-center justify-between shrink-0">
          {[
            { num: 1, title: "Principal" },
            { num: 2, title: "Contacto" },
            { num: 3, title: "Médicos" }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center w-full">
              <div className={`flex items-center gap-3 transition-all duration-300 ${step === s.num ? "opacity-100" : step > s.num ? "opacity-100" : "opacity-40 grayscale"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300
                  ${step === s.num ? "bg-[#008bcd] text-white shadow-lg shadow-[#008bcd]/30 ring-4 ring-[#008bcd]/10" : step > s.num ? "bg-emerald-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"}`}
                >
                  {step > s.num ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : s.num}
                </div>
                <span className={`text-sm font-bold hidden sm:block ${step === s.num ? "text-[#008bcd] dark:text-blue-400" : step > s.num ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
              {i < 2 && <div className={`flex-1 h-[2px] mx-4 sm:mx-6 rounded-full transition-all duration-500 ${step > s.num ? "bg-emerald-500/50" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <div className="overflow-y-auto p-8 custom-scrollbar bg-card flex-1 min-h-[350px]" onKeyDown={handleKeyDown}>
          <div className="space-y-6">
            
            {/* PASO 1: PRINCIPAL */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                <div className="flex items-center gap-2.5 text-[#008bcd] dark:text-blue-400 border-b border-border/50 pb-2">
                  <User size={18} className="stroke-[2.5]" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-foreground">Información Principal</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Nombres <span className="text-rose-500">*</span></Label>
                    <Input name="firstName" value={formData.firstName} onChange={handleChange} required className="h-11 rounded-xl bg-background border-border/80 focus:ring-[#008bcd]/20 font-semibold" placeholder="Ej. Juan Carlos" autoFocus />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Apellidos <span className="text-rose-500">*</span></Label>
                    <Input name="lastName" value={formData.lastName} onChange={handleChange} required className="h-11 rounded-xl bg-background border-border/80 focus:ring-[#008bcd]/20 font-semibold" placeholder="Ej. Pérez Gómez" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Tipo de Documento</Label>
                    <Select value={formData.tipoIdentificacion} onValueChange={(val) => handleSelectChange("tipoIdentificacion", val)}>
                      <SelectTrigger className="h-11 rounded-xl bg-background border-border/80 font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/80">
                        <SelectItem value="Cédula De Ciudadanía" className="font-semibold">Cédula De Ciudadanía</SelectItem>
                        <SelectItem value="Tarjeta de Identidad" className="font-semibold">Tarjeta de Identidad</SelectItem>
                        <SelectItem value="Pasaporte" className="font-semibold">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Número de Documento (CI) <span className="text-rose-500">*</span></Label>
                    <Input name="ci" value={formData.ci} onChange={handleChange} required className="h-11 rounded-xl bg-background border-border/80 focus:ring-[#008bcd]/20 font-semibold font-mono" placeholder="Ej. 1712345678" />
                  </div>
                  
                  <div className="space-y-2 relative">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Fecha de Nacimiento <span className="text-rose-500">*</span></Label>
                    <div className="relative">
                      <Input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required className="h-11 rounded-xl bg-background border-border/80 focus:ring-[#008bcd]/20 font-semibold pr-16" />
                      {patientAge !== null && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black bg-muted px-2 py-1 rounded text-muted-foreground pointer-events-none">
                          {patientAge} AÑOS
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Sexo</Label>
                    <Select value={formData.sexo} onValueChange={(val) => handleSelectChange("sexo", val)}>
                      <SelectTrigger className="h-11 rounded-xl bg-background border-border/80 font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/80">
                        <SelectItem value="Femenino" className="font-semibold">Femenino</SelectItem>
                        <SelectItem value="Masculino" className="font-semibold">Masculino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: CONTACTO */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 border-b border-border/50 pb-2">
                  <MapPin size={18} className="stroke-[2.5]" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-foreground">Contacto y Ubicación</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Phone size={12}/> Teléfono Móvil</Label>
                    <Input name="phone" value={formData.phone} onChange={handleChange} className="h-11 rounded-xl bg-background border-border/80 focus:ring-[#008bcd]/20 font-semibold font-mono" placeholder="Ej. 0998877665" autoFocus />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Mail size={12}/> Correo Electrónico</Label>
                    <Input type="email" name="email" value={formData.email} onChange={handleChange} className="h-11 rounded-xl bg-background border-border/80 focus:ring-[#008bcd]/20 font-semibold" placeholder="correo@ejemplo.com" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Map size={12}/> Ciudad</Label>
                    <Input name="ciudad" value={formData.ciudad} onChange={handleChange} className="h-11 rounded-xl bg-background border-border/80 focus:ring-[#008bcd]/20 font-semibold" placeholder="Ej. Santa Cruz" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><MapPin size={12}/> Provincia / Dpto.</Label>
                    <Input name="departamento" value={formData.departamento} onChange={handleChange} className="h-11 rounded-xl bg-background border-border/80 focus:ring-[#008bcd]/20 font-semibold" placeholder="Ej. Santa Cruz" />
                  </div>
                  
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Home size={12}/> Dirección Completa</Label>
                    <Input name="address" value={formData.address} onChange={handleChange} className="h-11 rounded-xl bg-background border-border/80 focus:ring-[#008bcd]/20 font-semibold" placeholder="Ej. Av. Principal, Calle 4, Nro 123..." />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: MÉDICOS */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 border-b border-border/50 pb-2">
                  <HeartPulse size={18} className="stroke-[2.5]" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-foreground">Información Médica</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Stethoscope size={12}/> EPS / Seguro Médico</Label>
                    <Input name="eps" value={formData.eps} onChange={handleChange} className="h-11 rounded-xl bg-background border-border/80 focus:ring-[#008bcd]/20 font-semibold" placeholder="Ej. Seguro de Salud" autoFocus />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Droplet size={12}/> Grupo Sanguíneo</Label>
                    <Select value={formData.grupoSanguineo} onValueChange={(val) => handleSelectChange("grupoSanguineo", val)}>
                      <SelectTrigger className="h-11 rounded-xl bg-background border-border/80 font-semibold text-rose-500 dark:text-rose-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/80">
                        {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(g => (
                          <SelectItem key={g} value={g} className="font-bold">{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2 space-y-2 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20 mt-2">
                    <Label className="text-amber-600 dark:text-amber-500 flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                      <ShieldAlert size={14} className="stroke-[2.5]" /> Alertas Médicas Importantes
                    </Label>
                    <Input 
                      name="medicalAlerts" 
                      value={formData.medicalAlerts} 
                      onChange={handleChange} 
                      className="h-11 rounded-xl bg-background border-amber-500/30 focus:ring-amber-500/30 font-semibold text-foreground placeholder:text-muted-foreground/60 shadow-inner" 
                      placeholder="Alergias a medicamentos, enfermedades crónicas, etc..." 
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* FOOTER - BOTONES DE ACCIÓN */}
        <div className="px-8 py-5 border-t border-border/50 bg-muted/10 flex items-center justify-between sticky bottom-0">
          <Button 
            type="button"
            variant="ghost" 
            onClick={step === 1 ? onClose : handleBack}
            className="hover:bg-muted text-muted-foreground font-bold rounded-xl h-10 px-6 text-xs transition-colors"
          >
            {step === 1 ? "Cancelar" : <><ChevronLeft className="w-4 h-4 mr-1.5"/> Volver</>}
          </Button>

          {step < 3 ? (
            <Button onClick={handleNext} className="bg-primary hover:bg-[#0070a8] text-white font-bold h-10 px-8 shadow-md shadow-[#008bcd]/20 rounded-xl text-xs transition-all active:scale-95">
              Siguiente <ChevronRight className="w-4 h-4 ml-1.5 stroke-[2.5]" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-8 shadow-md shadow-emerald-600/20 rounded-xl text-xs transition-all active:scale-95"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4 stroke-[2.5]" /> {isEditing ? "Guardar Cambios" : "Finalizar Registro"}</>
              )}
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}

export const NewPatientModal = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleSuccess = () => {
    if (onSuccess) onSuccess()
    setIsOpen(false)
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 h-11 rounded-xl flex items-center gap-2 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 transition-all hover:-translate-y-0.5"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" /> Nuevo Paciente
      </Button>
      
      <PatientsForm 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onSuccess={handleSuccess} 
      />
    </>
  )
}