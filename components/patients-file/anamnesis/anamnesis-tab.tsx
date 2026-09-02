"use client"

import React, { useState, useEffect } from "react"
import { 
  Save, MoreVertical, X, Loader2, CheckCircle2, 
  Trash2, ClipboardList, History,
  AlertTriangle, HeartPulse, Pill, Activity, Stethoscope, 
  Users, Sparkles
} from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface AnamnesisCardProps {
  title: string
  icon: React.ReactNode
  options: string[]
  tags: string[]
  setTags: (tags: string[]) => void
  notes: string
  setNotes: (notes: string) => void
  placeholderOptions?: string
  canEdit: boolean 
  badgeColor?: string
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
  canEdit,
  badgeColor = "bg-[#008bcd]/10 border-[#008bcd]/20 text-[#008bcd]"
}: AnamnesisCardProps) {
  const [customInput, setCustomInput] = useState("")

  const handleSelectTag = (value: string) => {
    if (value && !tags.includes(value)) {
      setTags([...tags, value])
    }
  }

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = customInput.trim()
      if (val && !tags.includes(val)) {
        setTags([...tags, val])
      }
      setCustomInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSetNone = () => {
    setTags([])
    setNotes("No refiere alteraciones / Sin antecedentes clínicos relevantes.")
  }

  const handleClear = () => {
    setTags([])
    setNotes("")
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden flex flex-col hover:border-[#008bcd]/40 hover:shadow-md transition-all group">
      <div className="flex justify-between items-center px-5 py-3.5 border-b border-border/70 bg-muted/20">
        <h3 className="font-black text-foreground text-xs flex items-center gap-2.5 uppercase tracking-wider">
          <span className="p-1.5 rounded-lg bg-background border border-border/70 shadow-2xs">
            {icon}
          </span>
          {title}
        </h3>
        
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer">
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-border/80 rounded-xl shadow-xl">
              <DropdownMenuItem onClick={handleSetNone} className="cursor-pointer font-bold text-xs py-2">
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Marcar "No refiere"
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClear} className="cursor-pointer font-bold text-xs py-2 text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" /> Limpiar campos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3.5">
        {canEdit && (
          <div className="flex flex-col sm:flex-row gap-2.5">
            {options.length > 0 && (
              <div className="flex-1">
                <Select onValueChange={handleSelectTag} value="">
                  <SelectTrigger className="w-full h-9 rounded-xl bg-background border-border/80 text-xs font-semibold focus:ring-1 focus:ring-[#008bcd]">
                    <SelectValue placeholder={placeholderOptions} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/80 rounded-xl shadow-xl max-h-60">
                    {options.map((opt, idx) => (
                      <SelectItem 
                        key={idx} 
                        value={opt}
                        className="text-xs font-medium cursor-pointer focus:bg-[#008bcd]/10 focus:text-[#008bcd]"
                      >
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className={cn("relative", options.length > 0 ? "sm:w-[190px]" : "w-full")}>
              <Input 
                type="text"
                placeholder="Otro hallazgo + Enter..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                className="h-9 rounded-xl bg-background border-border/80 text-xs font-medium focus-visible:ring-1 focus-visible:ring-[#008bcd]"
              />
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {tags.map((tag, idx) => (
              <span 
                key={idx} 
                className={cn(
                  "inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs",
                  badgeColor
                )}
              >
                <span>{tag}</span>
                {canEdit && (
                  <button 
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-black/10 dark:hover:bg-white/10 rounded-sm p-0.5 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={canEdit ? "Observaciones, gravedad, evolución o notas clínicas específicas..." : "Sin observaciones registradas."}
          readOnly={!canEdit}
          rows={3}
          className={cn(
            "w-full mt-auto resize-none border text-xs leading-relaxed rounded-xl p-3.5 transition-all outline-none",
            canEdit 
              ? "bg-background/80 border-border/80 text-foreground focus:ring-1 focus:ring-[#008bcd] hover:border-border" 
              : "bg-muted/30 text-muted-foreground border-transparent cursor-not-allowed font-medium"
          )}
        />
      </div>
    </div>
  )
}

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

  const opcionesMotivo = ["Dolor agudo", "Inflamación / Sangrado", "Limpieza y Profilaxis", "Prótesis dental", "Tratamiento de Ortodoncia", "Revisión preventiva", "Rehabilitación estética", "Traumatismo"]
  const opcionesAlertas = ["Alergia a Penicilina", "Alergia a AINES / Ibuprofeno", "Embarazo / Lactancia", "Portador de Marcapasos", "Tendencia a Hemorragias", "Alergia a Látex", "Alergia a Anestesia local"]
  const opcionesEnfermedades = ["Hipertensión arterial", "Diabetes Mellitus", "Asma bronquial", "Hipotiroidismo", "Cardiopatía isquémica", "Enfermedad Renal", "VIH / SIDA", "Hepatitis"]
  const opcionesMedicamentos = ["Analgésicos / Antiinflamatorios", "Antibióticos", "Anticoagulantes / Antiagregantes", "Antihipertensivos", "Hipoglucemiantes / Insulina", "Antidepresivos / Ansiolíticos", "Bifosfonatos"]
  const opcionesHabitos = ["Consumo de Alcohol", "Tabaquismo activo", "Bruxismo diurno/nocturno", "Queilofagia", "Onicofagia", "Respirador bucal crónico", "Consumo excesivo de azúcares"]
  const opcionesOdonto = ["Ortodoncia previa", "Extracciones complicadas", "Tratamientos de Endodoncia", "Prótesis fijas/removibles", "Implantes oseointegrados", "Enfermedad Periodontal"]
  const opcionesFam = ["Diabetes Mellitus", "Hipertensión arterial", "Cáncer", "Cardiopatías hereditarias", "Enfermedades hemorrágicas"]

  useEffect(() => {
    const fetchAnamnesis = async () => {
      try {
        const res = await fetch(`/api/patients/${patientId}/anamnesis`)
        if (!res.ok) return
        const resJson = await res.json()
        const data = resJson?.data
        
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
        console.error("Error al cargar anamnesis:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnamnesis()
  }, [patientId])

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

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData?.error || "Error al persistir")
      }
      
      toast({
        title: "Ficha Anamnesis Guardada",
        description: "El expediente médico se sincronizó exitosamente.",
        variant: "success",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message || "Problema al guardar en la base de datos.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 text-[#008bcd]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-semibold text-xs text-muted-foreground">Cargando ficha médica...</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-300 pb-12 space-y-6">
      
      {/* Cabecera Superior limpia (sin botón de impresión innecesario) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-2xl border border-border/80 shadow-xs sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-[#008bcd]" /> Ficha Anamnesis
            </h2>
            {!canEdit && (
              <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-md border border-border/80 tracking-wider">
                SÓLO LECTURA
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">
            Registro sistemático de antecedentes patológicos, alertas y estado de salud general.
          </p>
        </div>

        {canEdit && (
          <Button 
            onClick={handleSaveAnamnesis} 
            disabled={isSaving}
            className="bg-[#008bcd] hover:bg-[#0070a8] text-white font-bold h-10 px-6 rounded-xl shadow-xs transition-all cursor-pointer text-xs w-full sm:w-auto"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
            ) : (
              <><Save className="w-4 h-4 mr-2 stroke-[2.2]" /> Guardar Ficha</>
            )}
          </Button>
        )}
      </div>

      {/* Bloques de Formulario Clínico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <AnamnesisCard 
            title="Motivo de Consulta" 
            icon={<ClipboardList className="w-4 h-4 text-[#008bcd]" />}
            options={opcionesMotivo} 
            placeholderOptions="Seleccionar motivo principal..."
            tags={motivoTags} 
            setTags={setMotivoTags} 
            notes={motivoNotes} 
            setNotes={setMotivoNotes} 
            canEdit={canEdit}
            badgeColor="bg-[#008bcd]/10 border-[#008bcd]/20 text-[#008bcd]"
          />

          <AnamnesisCard 
            title="Enfermedad Actual y Sintomatología" 
            icon={<Activity className="w-4 h-4 text-blue-500" />}
            options={[]} 
            placeholderOptions="Añadir síntomas..."
            tags={enfermedadTags} 
            setTags={setEnfermedadTags} 
            notes={enfermedadNotes} 
            setNotes={setEnfermedadNotes} 
            canEdit={canEdit}
            badgeColor="bg-blue-500/10 border-blue-500/20 text-blue-500"
          />

          <AnamnesisCard 
            title="Alertas Médicas y Alergias Críticas" 
            icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
            options={opcionesAlertas} 
            placeholderOptions="Seleccionar alerta / alergia..."
            tags={alertasTags} 
            setTags={setAlertasTags} 
            notes={alertasNotes} 
            setNotes={setAlertasNotes} 
            canEdit={canEdit}
            badgeColor="bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
          />

          <AnamnesisCard 
            title="Enfermedades Sistémicas" 
            icon={<HeartPulse className="w-4 h-4 text-amber-500" />}
            options={opcionesEnfermedades} 
            placeholderOptions="Seleccionar patología..."
            tags={sistemicasTags} 
            setTags={setSistemicasTags} 
            notes={sistemicasNotes} 
            setNotes={setSistemicasNotes} 
            canEdit={canEdit}
            badgeColor="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
          />
        </div>

        <div className="space-y-5">
          <AnamnesisCard 
            title="Medicamentos en Uso" 
            icon={<Pill className="w-4 h-4 text-purple-500" />}
            options={opcionesMedicamentos} 
            placeholderOptions="Seleccionar fármaco..."
            tags={medicamentosTags} 
            setTags={setMedicamentosTags} 
            notes={medicamentosNotes} 
            setNotes={setMedicamentosNotes} 
            canEdit={canEdit}
            badgeColor="bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
          />

          <AnamnesisCard 
            title="Hábitos Personales" 
            icon={<Sparkles className="w-4 h-4 text-teal-500" />}
            options={opcionesHabitos} 
            placeholderOptions="Seleccionar hábito..."
            tags={habitosTags} 
            setTags={setHabitosTags} 
            notes={habitosNotes} 
            setNotes={setHabitosNotes} 
            canEdit={canEdit}
            badgeColor="bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400"
          />

          <AnamnesisCard 
            title="Antecedentes Odontológicos" 
            icon={<Stethoscope className="w-4 h-4 text-sky-500" />}
            options={opcionesOdonto} 
            placeholderOptions="Seleccionar antecedente odontológico..."
            tags={odontoTags} 
            setTags={setOdontoTags} 
            notes={odontoNotes} 
            setNotes={setOdontoNotes} 
            canEdit={canEdit}
            badgeColor="bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400"
          />

          <AnamnesisCard 
            title="Antecedentes Familiares Hereditarios" 
            icon={<Users className="w-4 h-4 text-indigo-500" />}
            options={opcionesFam} 
            placeholderOptions="Seleccionar antecedente familiar..."
            tags={famTags} 
            setTags={setFamTags} 
            notes={famNotes} 
            setNotes={setFamNotes} 
            canEdit={canEdit}
            badgeColor="bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
          />
        </div>
      </div>

    </div>
  )
}