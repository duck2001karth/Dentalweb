"use client"

import React, { useState, useEffect } from "react"
import { Save, MoreVertical, X, Loader2, CheckCircle2, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface AnamnesisCardProps {
  title: string
  options: string[]
  tags: string[]
  setTags: (tags: string[]) => void
  notes: string
  setNotes: (notes: string) => void
  placeholderOptions?: string
  canEdit: boolean 
}

function AnamnesisCard({ title, options, tags, setTags, notes, setNotes, placeholderOptions = "Añadir opción", canEdit }: AnamnesisCardProps) {
  
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
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-muted/40">
        <h3 className="font-bold text-foreground text-sm">{title}</h3>
        {/* Solo mostramos el menú de "limpiar" si tiene permisos */}
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-[#008bcd] transition-colors focus:outline-none">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border">
              <DropdownMenuItem onClick={handleSetNone} className="cursor-pointer font-medium hover:text-emerald-500">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Marcar "No refiere"
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClear} className="cursor-pointer font-medium text-red-500 hover:text-red-600 focus:text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Limpiar sección
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-4">
        
        {/* Controles de adición: Solo visibles si puede editar */}
        {canEdit && (
          <div className="flex flex-col sm:flex-row gap-2">
            <select 
              defaultValue="" 
              onChange={handleAddTag} 
              className="flex-1 bg-background border border-border text-foreground text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008bcd] cursor-pointer"
            >
              <option value="" disabled>{placeholderOptions}</option>
              {options.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
            
            <input 
              type="text"
              placeholder="Otro (Presiona Enter)"
              onKeyDown={handleAddCustomTag}
              className="sm:w-[160px] bg-background border border-border text-foreground text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008bcd]"
            />
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {tags.map((tag, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm text-foreground group bg-muted/20 px-3 py-2 rounded-md border border-border/50">
                <span className="capitalize font-medium">{tag}</span>
                {/* Botón de eliminar X: Solo si puede editar */}
                {canEdit && (
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    className="text-muted-foreground opacity-50 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cuadro de texto de notas largas: Solo lectura si no tiene permisos */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={canEdit ? "Observaciones o detalles adicionales..." : "Sin observaciones registradas."}
          readOnly={!canEdit}
          className={`w-full mt-auto min-h-[70px] resize-y border border-border text-sm rounded-md p-3 placeholder:text-muted-foreground/60 ${
            canEdit 
              ? "bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#008bcd]" 
              : "bg-muted/30 text-muted-foreground cursor-not-allowed focus:outline-none"
          }`}
        />
      </div>
    </div>
  )
}

// --- COMPONENTE PRINCIPAL ---
export function FichaAnamnesisTab({ patientId }: { patientId: string }) {
  const { toast } = useToast()
  
  // --- CONTROL DE ROLES ---
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

  // --- CARGAR DATOS REALES ---
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

  // --- GUARDAR EN BASE DE DATOS ---
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
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#008bcd] dark:text-blue-400" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm sticky top-0 z-20">
        <div>
          <h2 className="text-2xl font-light text-foreground flex items-center gap-3">
            Ficha Anamnesis
            {!canEdit && (
              <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-md tracking-widest border border-slate-200">
                SÓLO LECTURA
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Historial médico y antecedentes del paciente</p>
        </div>
        
        {/* Solo el Doctor y Administrador ven el botón de Guardar */}
        {canEdit && (
          <Button 
            onClick={handleSaveAnamnesis} 
            disabled={isSaving}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold w-full sm:w-auto shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
            Guardar Ficha
          </Button>
        )}
      </div>

      {/* GRILLA DE TARJETAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="space-y-6">
          <AnamnesisCard 
            title="Motivo de consulta" 
            options={opcionesMotivo} placeholderOptions="Añadir motivo"
            tags={motivoTags} setTags={setMotivoTags} notes={motivoNotes} setNotes={setMotivoNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Enfermedad actual" 
            options={[]} placeholderOptions="Añadir enfermedad actual (N/A)"
            tags={enfermedadTags} setTags={setEnfermedadTags} notes={enfermedadNotes} setNotes={setEnfermedadNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Alertas médicas" 
            options={opcionesAlertas} placeholderOptions="Añadir alerta"
            tags={alertasTags} setTags={setAlertasTags} notes={alertasNotes} setNotes={setAlertasNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Enfermedades Sistémicas" 
            options={opcionesEnfermedades} placeholderOptions="Añadir enfermedad"
            tags={sistemicasTags} setTags={setSistemicasTags} notes={sistemicasNotes} setNotes={setSistemicasNotes} 
            canEdit={canEdit}
          />
        </div>

        <div className="space-y-6">
          <AnamnesisCard 
            title="Medicamentos actuales" 
            options={opcionesMedicamentos} placeholderOptions="Añadir medicamento"
            tags={medicamentosTags} setTags={setMedicamentosTags} notes={medicamentosNotes} setNotes={setMedicamentosNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Hábitos" 
            options={opcionesHabitos} placeholderOptions="Añadir hábito"
            tags={habitosTags} setTags={setHabitosTags} notes={habitosNotes} setNotes={setHabitosNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Antecedentes odontológicos" 
            options={opcionesOdonto} placeholderOptions="Añadir antecedente"
            tags={odontoTags} setTags={setOdontoTags} notes={odontoNotes} setNotes={setOdontoNotes} 
            canEdit={canEdit}
          />
          <AnamnesisCard 
            title="Antecedentes familiares" 
            options={opcionesFam} placeholderOptions="Añadir antecedente familiar"
            tags={famTags} setTags={setFamTags} notes={famNotes} setNotes={setFamNotes} 
            canEdit={canEdit}
          />
        </div>

      </div>
    </div>
  )
}