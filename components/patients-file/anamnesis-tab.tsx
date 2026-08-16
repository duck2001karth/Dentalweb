"use client"

import React, { useState, useEffect } from "react"
import { Save, MoreVertical, X, Loader2, CheckCircle2, Trash2, ClipboardList, PlusCircle, History } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface AnamnesisCardProps {
  title: string
  icon?: React.ReactNode
  options: string[]
  tags: string[]
  setTags: (tags: string[]) => void
  notes: string
  setNotes: (notes: string) => void
  placeholderOptions?: string
  canEdit: boolean 
}

function AnamnesisCard({ 
  title, 
  icon, 
  options, 
  tags, 
  setTags, 
  notes, 
  setNotes, 
  placeholderOptions = "Añadir opción", 
  canEdit 
}: AnamnesisCardProps) {
  
  const handleAddTag = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value && !tags.includes(value)) {
      setTags([...tags, value])
    }
    e.target.value = ""
  }

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = e.currentTarget.value.trim()
      if (val && !tags.includes(val)) {
        setTags([...tags, val])
      }
      e.currentTarget.value = ""
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSetNone = () => {
    setTags([])
    setNotes("No refiere alteraciones / Sin antecedentes relevantes.")
  }

  const handleClear = () => {
    setTags([])
    setNotes("")
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden flex flex-col hover:border-[#008bcd]/30 hover:shadow-sm transition-all group">
      <div className="flex justify-between items-center px-5 py-3.5 border-b border-border/60 bg-muted/15">
        <h3 className="font-bold text-foreground text-[13px] flex items-center gap-2 uppercase tracking-wider">
          {icon || <ClipboardList className="w-4 h-4 text-[#008bcd]" />}
          {title}
        </h3>
        
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-colors focus:outline-none">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border rounded-xl shadow-xl">
              <DropdownMenuItem onClick={handleSetNone} className="cursor-pointer font-bold text-xs py-2.5">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Marcar "No refiere"
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClear} className="cursor-pointer font-bold text-xs py-2.5 text-red-500 focus:text-red-600 focus:bg-red-500/10">
                <Trash2 className="w-4 h-4 mr-2" /> Limpiar sección
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-4 bg-gradient-to-b from-transparent to-muted/5">
        
        {/* CONTROLES DE ADICIÓN (Solo lectura si no puede editar) */}
        {canEdit && (
          <div className="flex flex-col sm:flex-row gap-2.5 relative">
            <div className="relative flex-1">
              <PlusCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#008bcd]/60 pointer-events-none" />
              <select 
                defaultValue="" 
                onChange={handleAddTag} 
                className="w-full bg-background border border-input text-foreground text-xs font-medium rounded-lg pl-8 pr-3 py-2 h-9 focus:outline-none focus:ring-1 focus:ring-[#008bcd] cursor-pointer appearance-none"
              >
                <option value="" disabled>{placeholderOptions}</option>
                {options.map((opt, idx) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            
            <input 
              type="text"
              placeholder="Escribir otro y Enter..."
              onKeyDown={handleAddCustomTag}
              className="sm:w-[180px] bg-background border border-input text-foreground text-xs font-medium rounded-lg px-3 py-2 h-9 focus:outline-none focus:ring-1 focus:ring-[#008bcd] placeholder:text-muted-foreground/50"
            />
          </div>
        )}

        {/* ETIQUETAS (TAGS) DE DATOS */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {tags.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 bg-[#008bcd]/10 border border-[#008bcd]/20 text-[#008bcd] px-2.5 py-1 rounded-md text-xs font-bold">
                {tag}
                {canEdit && (
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-[#008bcd]/20 hover:text-red-500 rounded-sm p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* CUADRO DE NOTAS CLÍNICAS */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={canEdit ? "Escribe observaciones, gravedad o detalles adicionales aquí..." : "Sin observaciones registradas."}
          readOnly={!canEdit}
          className={cn(
            "w-full mt-auto min-h-[80px] resize-none border border-input text-xs leading-relaxed rounded-xl p-3.5 transition-colors",
            canEdit 
              ? "bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#008bcd] hover:border-border" 
              : "bg-muted/30 text-muted-foreground border-transparent cursor-not-allowed focus:outline-none font-medium"
          )}
        />
      </div>
    </div>
  )
}

// --- COMPONENTE PRINCIPAL ---
export function FichaAnamnesisTab({ patientId }: { patientId: string }) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const currentUser = session?.user as any
  const canEdit = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [motivoTags, setMotivoTags] = useState<string[]>([])
  const [motivoNotes, setMotivoNotes] = useState("")
  const [enfermedadTags, setEnfermedadTags] = useState<string[]>([])
  const [enfermedadNotes, setEnfermedadNotes] = useState("")
  const [alertasTags, setAlertasTags] = useState<string[]>([])
  const [alertasNotes, setAlertasNotes] = useState("")
  const [sistemicasTags, setSistemicasTags] = useState<string[]>([])
  const [sistemicasNotes, setSistemicasNotes] = useState("")
  const [medicamentosTags, setMedicamentosTags] = useState<string[]>([])
  const [medicamentosNotes, setMedicamentosNotes] = useState("")
  const [habitosTags, setHabitosTags] = useState<string[]>([])
  const [habitosNotes, setHabitosNotes] = useState("")
  const [odontoTags, setOdontoTags] = useState<string[]>([])
  const [odontoNotes, setOdontoNotes] = useState("")
  const [famTags, setFamTags] = useState<string[]>([])
  const [famNotes, setFamNotes] = useState("")

  const opcionesMotivo = ["Dolor", "Inflamación", "Limpieza", "Prótesis", "Ortodoncia", "Revisión general", "Estética"]
  const opcionesAlertas = ["Alergia a Penicilina", "Alergia a AINES", "Embarazo", "Marcapasos", "Hemorragias", "Ninguna"]
  const opcionesEnfermedades = ["Hipertensión", "Diabetes", "Asma", "Hipotiroidismo", "Cáncer", "Enfermedad Renal", "VIH"]
  const opcionesMedicamentos = ["Analgésicos", "Antibióticos", "Anticoagulantes", "Antihipertensivos", "Antidepresivos"]
  const opcionesHabitos = ["Alcohol", "Fumar", "Drogas", "Queilofagia", "Onicofagia", "Bruxismo", "Respirador bucal"]
  const opcionesOdonto = ["Ortodoncia previa", "Extracciones", "Endodoncias", "Prótesis", "Implantes", "Enfermedad Periodontal"]
  const opcionesFam = ["Diabetes", "Hipertensión", "Cáncer", "Enfermedades cardíacas", "Ninguno"]
  useEffect(() => {
    const fetchAnamnesis = async () => {
      try {
        const res = await fetch(`/api/patients/${patientId}/anamnesis`)
        const { data } = await res.json()
        
        if (data) {
          setMotivoTags(data.motivo?.tags || [])
          setMotivoNotes(data.motivo?.notes || "")
          setEnfermedadTags(data.enfermedadActual?.tags || [])
          setEnfermedadNotes(data.enfermedadActual?.notes || "")
          setAlertasTags(data.alertasMedicas?.tags || [])
          setAlertasNotes(data.alertasMedicas?.notes || "")
          setSistemicasTags(data.enfermedades?.tags || [])
          setSistemicasNotes(data.enfermedades?.notes || "")
          setMedicamentosTags(data.medicamentos?.tags || [])
          setMedicamentosNotes(data.medicamentos?.notes || "")
          setHabitosTags(data.habitos?.tags || [])
          setHabitosNotes(data.habitos?.notes || "")
          setOdontoTags(data.antecedentesOdonto?.tags || [])
          setOdontoNotes(data.antecedentesOdonto?.notes || "")
          setFamTags(data.antecedentesFamiliares?.tags || [])
          setFamNotes(data.antecedentesFamiliares?.notes || "")
        }
      } catch (error) {
        toast({ title: "Error", description: "No se pudo cargar la ficha médica.", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnamnesis()
  }, [patientId, toast])
  const handleSaveAnamnesis = async () => {
    setIsSaving(true)
    
    const anamnesisData = {
      motivo: { tags: motivoTags, notes: motivoNotes },
      enfermedadActual: { tags: enfermedadTags, notes: enfermedadNotes },
      alertasMedicas: { tags: alertasTags, notes: alertasNotes },
      enfermedades: { tags: sistemicasTags, notes: sistemicasNotes },
      medicamentos: { tags: medicamentosTags, notes: medicamentosNotes },
      habitos: { tags: habitosTags, notes: habitosNotes },
      antecedentesOdonto: { tags: odontoTags, notes: odontoNotes },
      antecedentesFamiliares: { tags: famTags, notes: famNotes },
    }

    try {
      const res = await fetch(`/api/patients/${patientId}/anamnesis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(anamnesisData)
      })

      if (!res.ok) throw new Error()
      
      toast({
        variant: "success",
        title: "Anamnesis actualizada",
        description: "La ficha médica se ha guardado correctamente.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "Hubo un problema de conexión con el servidor.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-[#008bcd] dark:text-blue-400 mb-4" />
        <p className="font-semibold text-muted-foreground">Cargando anamnesis...</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <History className="w-6 h-6 text-[#008bcd]" /> Ficha Anamnesis
            </h2>
            {!canEdit && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 tracking-wider">
                SÓLO LECTURA
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Registro detallado del historial médico, alertas y antecedentes del paciente.
          </p>
        </div>
        {canEdit && (
          <Button 
            onClick={handleSaveAnamnesis} 
            disabled={isSaving}
            className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold w-full sm:w-auto h-11 px-6 rounded-xl shadow-xs transition-transform active:scale-95"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
            Guardar Ficha
          </Button>
        )}
      </div>

      {/* GRILLA DE TARJETAS (ESTRUCTURA DE FORMULARIO MÉDICO) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="space-y-6">
          <AnamnesisCard 
            title="Motivo de Consulta" 
            options={opcionesMotivo} placeholderOptions="Seleccionar motivo..."
            tags={motivoTags} setTags={setMotivoTags} notes={motivoNotes} setNotes={setMotivoNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Enfermedad Actual" 
            options={[]} placeholderOptions="Añadir enfermedad actual (N/A)..."
            tags={enfermedadTags} setTags={setEnfermedadTags} notes={enfermedadNotes} setNotes={setEnfermedadNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Alertas Médicas y Alergias" 
            options={opcionesAlertas} placeholderOptions="Seleccionar alerta..."
            tags={alertasTags} setTags={setAlertasTags} notes={alertasNotes} setNotes={setAlertasNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Enfermedades Sistémicas" 
            options={opcionesEnfermedades} placeholderOptions="Seleccionar enfermedad..."
            tags={sistemicasTags} setTags={setSistemicasTags} notes={sistemicasNotes} setNotes={setSistemicasNotes} 
            canEdit={canEdit}
          />
        </div>

        <div className="space-y-6">
          <AnamnesisCard 
            title="Medicamentos Actuales" 
            options={opcionesMedicamentos} placeholderOptions="Seleccionar medicamento..."
            tags={medicamentosTags} setTags={setMedicamentosTags} notes={medicamentosNotes} setNotes={setMedicamentosNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Hábitos Personales" 
            options={opcionesHabitos} placeholderOptions="Seleccionar hábito..."
            tags={habitosTags} setTags={setHabitosTags} notes={habitosNotes} setNotes={setHabitosNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Antecedentes Odontológicos" 
            options={opcionesOdonto} placeholderOptions="Seleccionar antecedente..."
            tags={odontoTags} setTags={setOdontoTags} notes={odontoNotes} setNotes={setOdontoNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Antecedentes Familiares" 
            options={opcionesFam} placeholderOptions="Seleccionar antecedente familiar..."
            tags={famTags} setTags={setFamTags} notes={famNotes} setNotes={setFamNotes} 
            canEdit={canEdit}
          />
        </div>

      </div>
    </div>
  )
}