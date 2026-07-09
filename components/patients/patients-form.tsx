"use client"

import { useState, useEffect } from "react"
import { Loader2, Save, User, MapPin, HeartPulse, ShieldAlert, X, Plus, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const inputClass = "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#008bcd] disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    const patientDataToSave = {
      ...formData,
      birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : undefined,
      // Si está vacío, lo enviamos como nulo para mayor limpieza en la BD
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
        if (response.status === 409) {
           throw new Error("DUPLICATE_CI");
        }
        throw new Error("Error al guardar");
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
        toast({ title: "Documento duplicado", description: "Ya existe un paciente registrado con este número de CI/DNI.", variant: "destructive" })
        setStep(1); 
      } else {
        toast({ title: "Error", description: "Hubo un problema al procesar la solicitud.", variant: "destructive" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* MAGIA AQUÍ: [&>button]:hidden oculta la X por defecto de Shadcn */}
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-background border-border p-0 overflow-hidden flex flex-col gap-0 rounded-2xl [&>button]:hidden">
        
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between sticky top-0 z-10">
          <div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {isEditing ? "Editar Paciente" : "Registrar Nuevo Paciente"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Completa la información requerida a continuación. Los campos con (*) son obligatorios.
            </DialogDescription>
          </div>
          <button onClick={onClose} className="p-2 bg-muted hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </DialogHeader>

        <div className="px-6 py-4 bg-muted/20 border-b border-border flex items-center justify-between shrink-0">
          {[
            { num: 1, title: "Principal" },
            { num: 2, title: "Contacto" },
            { num: 3, title: "Médicos" }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center gap-2 ${step === s.num ? "opacity-100" : step > s.num ? "opacity-100" : "opacity-60"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${step === s.num ? "bg-[#008bcd] text-white shadow-md ring-4 ring-blue-500/20" : step > s.num ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                >
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-sm font-semibold hidden sm:block ${step === s.num ? "text-[#008bcd] dark:text-blue-400" : step > s.num ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
              {i < 2 && <div className={`w-8 sm:w-16 h-1 mx-2 sm:mx-4 rounded-full transition-colors ${step > s.num ? "bg-emerald-400" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar min-h-[350px]">
          <div className="space-y-8">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-4 text-[#008bcd] dark:text-blue-400">
                  <User size={18} />
                  <h3 className="font-bold text-lg text-foreground">Información Principal</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Nombres <span className="text-red-500">*</span></Label>
                    <Input name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} placeholder="Ej. Juan Carlos" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Apellidos <span className="text-red-500">*</span></Label>
                    <Input name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} placeholder="Ej. Pérez Gómez" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Tipo de Documento</Label>
                    <select name="tipoIdentificacion" value={formData.tipoIdentificacion} onChange={handleChange} className={inputClass}>
                      <option value="Cédula De Ciudadanía">Cédula De Ciudadanía</option>
                      <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Número de Documento (CI) <span className="text-red-500">*</span></Label>
                    <Input name="ci" value={formData.ci} onChange={handleChange} required className={inputClass} placeholder="Ej. 1712345678" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Fecha de Nacimiento <span className="text-red-500">*</span></Label>
                    <Input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Sexo</Label>
                    <select name="sexo" value={formData.sexo} onChange={handleChange} className={inputClass}>
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400">
                  <MapPin size={18} />
                  <h3 className="font-bold text-lg text-foreground">Contacto y Ubicación</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Teléfono Móvil</Label>
                    <Input name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="Ej. 0998877665" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Correo Electrónico</Label>
                    <Input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="correo@ejemplo.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Ciudad</Label>
                    <Input name="ciudad" value={formData.ciudad} onChange={handleChange} className={inputClass} placeholder="Ej. Santa Cruz" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Provincia</Label>
                    <Input name="departamento" value={formData.departamento} onChange={handleChange} className={inputClass} placeholder="Ej. Santa Cruz" />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-foreground">Dirección Completa</Label>
                    <Input name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="Ej. Av. Principal 123..." />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400">
                  <HeartPulse size={18} />
                  <h3 className="font-bold text-lg text-foreground">Información Médica</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-foreground">EPS / Seguro Médico</Label>
                    <Input name="eps" value={formData.eps} onChange={handleChange} className={inputClass} placeholder="Ej. Seguro Social" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground">Grupo Sanguíneo</Label>
                    <select name="grupoSanguineo" value={formData.grupoSanguineo} onChange={handleChange} className={inputClass}>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-amber-600 dark:text-amber-500 flex items-center gap-1"><ShieldAlert size={14} /> Alertas Médicas (Alergias, Enfermedades crónicas)</Label>
                    <Input 
                      name="medicalAlerts" 
                      value={formData.medicalAlerts} 
                      onChange={handleChange} 
                      className={cn(inputClass, "border-amber-300 dark:border-amber-500/50 focus:ring-amber-500")} 
                      placeholder="Ej. Alérgico a la penicilina, Hipertensión..." 
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between sticky bottom-0">
          <Button 
            variant="outline" 
            onClick={step === 1 ? onClose : handleBack}
            className="border-border text-foreground bg-background hover:bg-accent font-semibold px-6"
          >
            {step === 1 ? "Cancelar" : <><ChevronLeft className="w-4 h-4 mr-1"/> Anterior</>}
          </Button>

          {step < 3 ? (
            <Button onClick={handleNext} className="bg-[#008bcd] hover:bg-[#0070a8] text-white">
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold px-8 shadow-md"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> {isEditing ? "Guardar Cambios" : "Registrar Paciente"}</>
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
        className="bg-[#008bcd] hover:bg-[#0070a8] dark:bg-[#008bcd] dark:hover:bg-blue-600 transition-colors text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm h-auto"
      >
        <Plus className="w-5 h-5" /> Nuevo Paciente
      </Button>
      
      <PatientsForm 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onSuccess={handleSuccess} 
      />
    </>
  )
}