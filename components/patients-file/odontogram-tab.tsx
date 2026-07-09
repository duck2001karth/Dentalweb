"use client"

import React, { useState, useEffect, useCallback } from "react"
import { 
  Printer, Save, X, Loader2, ChevronLeft, 
  Stethoscope, History, PlusCircle, CheckCircle, Search 
} from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Maximize2, Minimize2 } from "lucide-react"

// --- NOMENCLATURA INTERNACIONAL ---
const LESION_OPTIONS = [
  { label: "Caries", value: "CARIES", type: "surfaces", color: "bg-red-500", icon: "🔴" },
  { label: "Fractura", value: "FRACTURA", type: "tooth", color: "bg-red-500", icon: "⚡" },
  { label: "Infección Pulpar", value: "ENDO_INDICADA", type: "tooth", color: "bg-red-500", icon: "🔺" },
  { label: "Restauración Defectuosa", value: "REST_MALA", type: "surfaces", color: "bg-red-500", icon: "⭕" },
  { label: "Extracción Indicada", value: "EXT_INDICADA", type: "tooth", color: "bg-red-500", icon: "❌" },
  { label: "Sellante Defectuoso", value: "SELLANTE_MALO", type: "tooth", color: "bg-red-500", icon: "S" },
]

const PREEXISTENCE_OPTIONS = [
  { label: "Restauración Buena", value: "REST_BUENA", type: "surfaces", color: "bg-[#008bcd]", icon: "🔵" },
  { label: "Corona Buena", value: "CORONA_BUENA", type: "tooth", color: "bg-[#008bcd]", icon: "🔘" },
  { label: "Endodoncia Realizada", value: "ENDO_REALIZADA", type: "tooth", color: "bg-[#008bcd]", icon: "🔺" },
  { label: "Extracción Realizada / Ausente", value: "EXT_REALIZADA", type: "tooth", color: "bg-[#008bcd]", icon: "❌" },
  { label: "Sellante Bueno", value: "SELLANTE_BUENO", type: "tooth", color: "bg-[#008bcd]", icon: "S" },
]

const ALL_STATUS_OPTIONS = [...LESION_OPTIONS, ...PREEXISTENCE_OPTIONS]
const getStatusLabel = (val: string) => ALL_STATUS_OPTIONS.find(o => o.value === val)?.label || val

// Agregamos la prop 'canEdit' al componente de la pieza dental
const ToothPiece = ({ number, toothRecords = [], selectedSurfaces = [], onClick, canEdit }: any) => {
  const hasStatus = (status: string) => toothRecords.some((r: any) => r.status === status)
  
  const getFill = (surface: string) => {
    if (selectedSurfaces.includes(surface)) return "#bae6fd" 
    const surfaceRecords = toothRecords.filter((r: any) => r.surfaces.includes(surface))
    if (surfaceRecords.length === 0) return "transparent"
    const recent = surfaceRecords[0]
    if (recent.status === "CARIES") return "#ef4444"
    if (recent.status === "REST_BUENA" || recent.status === "REST_MALA") return "#008bcd"
    return "transparent"
  }

  const getStroke = (surface: string) => {
    if (selectedSurfaces.includes(surface)) return "#0ea5e9"
    const surfaceRecords = toothRecords.filter((r: any) => r.surfaces.includes(surface))
    if (surfaceRecords.length > 0 && surfaceRecords[0].status === "REST_MALA") return "#ef4444" 
    return "#64748b"
  }

  const isAbsent = hasStatus("EXT_REALIZADA")

  const cursorClass = canEdit ? "cursor-pointer hover:scale-105" : "cursor-default"

  return (
    <div className={cn("flex flex-col items-center gap-1 group", isAbsent && "opacity-40")}>
      <span 
        className={cn("text-[10px] font-bold text-muted-foreground", canEdit && "group-hover:text-[#008bcd] cursor-pointer", selectedSurfaces.length > 0 && "text-[#008bcd]")} 
        onClick={() => canEdit && onClick("TODA_LA_PIEZA")}
      >
        {number}
      </span>
      <svg width="36" height="36" viewBox="0 0 100 100" className={cn("transition-transform relative drop-shadow-sm", cursorClass)}>
        <polygon points="0,0 25,25 75,25 100,0" fill={getFill("top")} stroke={getStroke("top")} strokeWidth="2" onClick={() => canEdit && onClick("top")} />
        <polygon points="0,0 25,25 25,75 0,100" fill={getFill("left")} stroke={getStroke("left")} strokeWidth="2" onClick={() => canEdit && onClick("left")} />
        <polygon points="100,0 75,25 75,75 100,100" fill={getFill("right")} stroke={getStroke("right")} strokeWidth="2" onClick={() => canEdit && onClick("right")} />
        <polygon points="0,100 25,75 75,75 100,100" fill={getFill("bottom")} stroke={getStroke("bottom")} strokeWidth="2" onClick={() => canEdit && onClick("bottom")} />
        <rect x="25" y="25" width="50" height="50" fill={getFill("center")} stroke={getStroke("center")} strokeWidth="2" onClick={() => canEdit && onClick("center")} />

        {hasStatus("EXT_INDICADA") && <g className="pointer-events-none"><line x1="0" y1="0" x2="100" y2="100" stroke="#ef4444" strokeWidth="6" /><line x1="100" y1="0" x2="0" y2="100" stroke="#ef4444" strokeWidth="6" /></g>}
        {hasStatus("EXT_REALIZADA") && <g className="pointer-events-none"><line x1="0" y1="0" x2="100" y2="100" stroke="#008bcd" strokeWidth="6" /><line x1="100" y1="0" x2="0" y2="100" stroke="#008bcd" strokeWidth="6" /></g>}
        {hasStatus("ENDO_INDICADA") && <polygon points="50,15 85,85 15,85" fill="none" stroke="#ef4444" strokeWidth="6" className="pointer-events-none"/>}
        {hasStatus("ENDO_REALIZADA") && <polygon points="50,15 85,85 15,85" fill="none" stroke="#008bcd" strokeWidth="6" className="pointer-events-none"/>}
        {hasStatus("CORONA_MALA") && <circle cx="50" cy="50" r="45" fill="none" stroke="#ef4444" strokeWidth="6" className="pointer-events-none"/>}
        {hasStatus("CORONA_BUENA") && <circle cx="50" cy="50" r="45" fill="none" stroke="#008bcd" strokeWidth="6" className="pointer-events-none"/>}
        {hasStatus("SELLANTE_MALO") && <text x="50" y="65" fill="#ef4444" fontSize="45" fontWeight="bold" textAnchor="middle" className="pointer-events-none">S</text>}
        {hasStatus("SELLANTE_BUENO") && <text x="50" y="65" fill="#008bcd" fontSize="45" fontWeight="bold" textAnchor="middle" className="pointer-events-none">S</text>}
        {hasStatus("FRACTURA") && <line x1="15" y1="85" x2="85" y2="15" stroke="#ef4444" strokeWidth="6" className="pointer-events-none"/>}
      </svg>
    </div>
  )
}

export function OdontogramaTab({ patientId, planId, onToothClickCallback, isPlanView = false }: { patientId: string; planId?: string; onToothClickCallback?: (tooth: number) => void; isPlanView?: boolean }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isFocusMode, setIsFocusMode] = useState(false)
  const toggleFocus = () => setIsFocusMode(!isFocusMode)

  // --- REGLAS DE SEGURIDAD POR ROL ---
  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"

  const [dentition, setDentition] = useState<"permanente" | "temporal">("permanente")
  const [view, setView] = useState("diagnostico")
  
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [currentSurfaces, setCurrentSurfaces] = useState<string[]>([])
  const [menuStep, setMenuStep] = useState<"NONE" | "OPTIONS" | "LESIONS" | "PREEXISTENCES" | "PROCEDURES" | "SAVE_FORM">("NONE")
  const [selectedStatus, setSelectedStatus] = useState<any>(null)
  const [recordComment, setRecordComment] = useState("")
  
  const [catalogoReal, setCatalogoReal] = useState<any[]>([])
  const [procedureSearch, setProcedureSearch] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const arcada1 = [18, 17, 16, 15, 14, 13, 12, 11]; const arcada2 = [21, 22, 23, 24, 25, 26, 27, 28]
  const arcada4 = [48, 47, 46, 45, 44, 43, 42, 41]; const arcada3 = [31, 32, 33, 34, 35, 36, 37, 38]
  const arcadaTemp1 = [55, 54, 53, 52, 51]; const arcadaTemp2 = [61, 62, 63, 64, 65]
  const arcadaTemp4 = [85, 84, 83, 82, 81]; const arcadaTemp3 = [71, 72, 73, 74, 75]

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(`/api/odontogram?patientId=${patientId}`)
      setRecords(await res.json() || [])
    } catch (error) { toast({ title: "Error", variant: "destructive" }) } finally { setIsLoading(false) }
  }, [patientId, toast])

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/catalog')
      if (res.ok) {
        const data = await res.json()
        const activos = data.filter((item: any) => item.isActive)
        setCatalogoReal(activos)
        setProcedureSearch(activos)
      }
    } catch (error) { console.error("Error cargando catálogo", error) }
  }, [])

  useEffect(() => { 
    fetchRecords() 
    if (planId && canEditClinicalData) fetchCatalog() 
  }, [fetchRecords, fetchCatalog, planId, canEditClinicalData])

  useEffect(() => {
    if (!searchTerm) {
      setProcedureSearch(catalogoReal)
      return
    }
    const filtered = catalogoReal.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setProcedureSearch(filtered);
  }, [searchTerm, catalogoReal]);

  const handleSurfaceClick = (tooth: number, surface: string) => {
    if (!canEditClinicalData) return;

    if (selectedTooth !== tooth) { 
        setSelectedTooth(tooth)
        setCurrentSurfaces(surface === "TODA_LA_PIEZA" ? [] : [surface]) 
        setMenuStep("OPTIONS")
        if(onToothClickCallback) onToothClickCallback(tooth);
    } else { 
        if (surface === "TODA_LA_PIEZA") setCurrentSurfaces([]);
        else setCurrentSurfaces(currentSurfaces.includes(surface) ? currentSurfaces.filter(s => s !== surface) : [...currentSurfaces, surface]) 
    }
  }

  const handleCloseMenu = () => {
    setMenuStep("NONE"); setSelectedTooth(null); setCurrentSurfaces([]); setSelectedStatus(null); setRecordComment(""); setSearchTerm("");
    if(onToothClickCallback) onToothClickCallback(0);
  }

  const handleSaveRecord = async () => {
    if (!canEditClinicalData) return;
    let finalSurfaces = currentSurfaces
    if (selectedStatus?.type === "tooth" || finalSurfaces.length === 0) finalSurfaces = ["TODA_LA_PIEZA"]
    
    setIsSaving(true)
    try {
      const res = await fetch(`/api/odontogram`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            patientId, planId, 
            toothNumber: selectedTooth, 
            surfaces: finalSurfaces, 
            status: selectedStatus.value, 
            isEvolution: view === "evolucion", 
            authorId: currentUser?.id,
            comments: recordComment
        })
      })
      if (!res.ok) throw new Error()
      toast({ title: "Registro guardado", variant: "success" })
      handleCloseMenu(); fetchRecords();
    } catch (error) { toast({ title: "Error", variant: "destructive" }) } finally { setIsSaving(false) }
  }

  const handleHealthyTooth = async () => {
    if (!selectedTooth || !canEditClinicalData) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/odontogram?patientId=${patientId}&toothNumber=${selectedTooth}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Pieza saneada", description: `Se han limpiado los registros de la pieza ${selectedTooth}`, variant: "success" });
      handleCloseMenu(); fetchRecords();
    } catch (e) { toast({ title: "Error al limpiar", variant: "destructive" }) } finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!canEditClinicalData) return;
    try {
        const response = await fetch(`/api/odontogram?id=${id}`, { method: "DELETE" })
        if (!response.ok) throw new Error()
        toast({ title: "Registro anulado", variant: "success" }); fetchRecords()
    } catch (error) { toast({ title: "Error", variant: "destructive" }) }
  }

  const handleAddProcedure = async (procedure: any) => {
    if (!planId || !canEditClinicalData) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/treatments/${planId}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureId: procedure.id,
          name: procedure.name,
          price: procedure.basePrice,
          toothNumber: selectedTooth,
          surfaces: currentSurfaces
        })
      });
      if (!res.ok) throw new Error();
      toast({ title: "Prestación añadida", description: `${procedure.name} sumado al presupuesto.`, variant: "success" });
      handleCloseMenu();
      window.location.reload(); 
    } catch (e) { toast({ title: "Error", variant: "destructive" }) } finally { setIsSaving(false) }
  }

  const getRecordsForTooth = (toothNum: number) => records.filter(r => r.toothNumber === toothNum && r.isEvolution === (view === "evolucion"))

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#008bcd]" /></div>

  return (
    <div 
      className={cn("transition-all duration-300 ease-in-out bg-background", isFocusMode ? "fixed inset-0 z-[100] w-screen h-screen overflow-y-auto p-4 md:p-8 bg-card" 
          : "relative w-full h-full animate-in fade-in"
      )}
    >
      
      {/* HEADER DE HERRAMIENTAS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm sticky top-0 z-20 print-hidden">
        
        {/* Selector de Dentición */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
          <button onClick={() => setDentition("permanente")} className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", dentition === "permanente" ? "bg-background text-[#008bcd] shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>Permanente <span className="opacity-60 font-normal ml-1">32</span></button>
          <button onClick={() => setDentition("temporal")} className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", dentition === "temporal" ? "bg-background text-[#008bcd] shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>Temporal <span className="opacity-60 font-normal ml-1">20</span></button>
        </div>
        
        {/* Herramientas Derecha */}
        <div className="flex items-center gap-3">
          {!canEditClinicalData && (
            <span className="text-[10px] font-bold tracking-widest bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 px-2 py-1.5 rounded-md">
              SÓLO LECTURA
            </span>
          )}
          
          {/* Selector Elegante de Vista (Diagnóstico / Evolución) */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
            <button 
              onClick={() => setView("diagnostico")} 
              className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", view === "diagnostico" ? "bg-[#008bcd] text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
            >
              Diagnóstico Inicial
            </button>
            <button 
              onClick={() => setView("evolucion")} 
              className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", view === "evolucion" ? "bg-[#008bcd] text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
            >
              Evolución Clínica
            </button>
          </div>

          {/* Separador */}
          <div className="w-px h-6 bg-border mx-1"></div>

          {/* Botón Focus Suave */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleFocus} 
            className="rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors h-8 w-8"
            title={isFocusMode ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFocusMode ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          
        </div>
      </div>

      {/* ODONTOGRAMAS GRÁFICOS */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-x-auto">
        <div className="min-w-[800px] flex flex-col gap-10">
          <div className="flex justify-center gap-8">
            <div className="flex gap-2">{(dentition === "permanente" ? arcada1 : arcadaTemp1).map(num => (<ToothPiece key={num} number={num} toothRecords={getRecordsForTooth(num)} selectedSurfaces={selectedTooth === num ? currentSurfaces : []} onClick={(s: string) => handleSurfaceClick(num, s)} canEdit={canEditClinicalData} />))}</div>
            <div className="flex gap-2 border-l border-border pl-8">{(dentition === "permanente" ? arcada2 : arcadaTemp2).map(num => (<ToothPiece key={num} number={num} toothRecords={getRecordsForTooth(num)} selectedSurfaces={selectedTooth === num ? currentSurfaces : []} onClick={(s: string) => handleSurfaceClick(num, s)} canEdit={canEditClinicalData} />))}</div>
          </div>
          <div className="flex justify-center gap-8">
            <div className="flex gap-2">{(dentition === "permanente" ? arcada4 : arcadaTemp4).map(num => (<ToothPiece key={num} number={num} toothRecords={getRecordsForTooth(num)} selectedSurfaces={selectedTooth === num ? currentSurfaces : []} onClick={(s: string) => handleSurfaceClick(num, s)} canEdit={canEditClinicalData} />))}</div>
            <div className="flex gap-2 border-l border-border pl-8">{(dentition === "permanente" ? arcada3 : arcadaTemp3).map(num => (<ToothPiece key={num} number={num} toothRecords={getRecordsForTooth(num)} selectedSurfaces={selectedTooth === num ? currentSurfaces : []} onClick={(s: string) => handleSurfaceClick(num, s)} canEdit={canEditClinicalData} />))}</div>
          </div>
        </div>
      </div>

      {/* MENÚ INTERACTIVO FLOTANTE - Solo se abrirá si tiene permisos */}
      {menuStep !== "NONE" && canEditClinicalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background w-[90%] max-w-[500px] rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-7 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                {menuStep !== "OPTIONS" && (
                   <Button variant="ghost" size="icon" onClick={() => setMenuStep("OPTIONS")} className="h-9 w-9 text-white hover:bg-white/20 rounded-full"><ChevronLeft className="w-5 h-5"/></Button>
                )}
                <div>
                  <h3 className="font-bold text-xl leading-tight">
                    {menuStep === "OPTIONS" ? "Opciones de Pieza" : menuStep === "LESIONS" ? "Definir lesión" : menuStep === "PREEXISTENCES" ? "Agregar preexistencia" : menuStep === "PROCEDURES" ? "Seleccionar Prestación" : "Detalle"}
                  </h3>
                  <p className="text-xs opacity-80 font-medium tracking-wide uppercase mt-0.5">PIEZA {selectedTooth} {currentSurfaces.length > 0 && currentSurfaces[0] !== "TODA_LA_PIEZA" ? `• CARAS: ${currentSurfaces.join(", ")}` : ""}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseMenu} className="h-9 w-9 text-white hover:bg-white/20 rounded-full"><X className="w-5 h-5"/></Button>
            </div>

            {menuStep === "OPTIONS" && (
              <div className="flex flex-col bg-background">
               {!isPlanView && (
                  <>
                <button onClick={() => setMenuStep("PREEXISTENCES")} className="flex items-center gap-5 px-7 py-5 hover:bg-muted/50 transition-colors text-left border-b border-border">
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-[#008bcd] p-3 rounded-full"><History className="w-6 h-6" /></div>
                  <div>
                    <p className="font-bold text-foreground text-base">Agregar preexistencia</p>
                    <p className="text-xs text-muted-foreground mt-1">Restauraciones o tratamientos previos</p>
                  </div>
                </button>
                
                <button onClick={() => setMenuStep("LESIONS")} className="flex items-center gap-5 px-7 py-5 hover:bg-muted/50 transition-colors text-left border-b border-border">
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-full"><Stethoscope className="w-6 h-6" /></div>
                  <div>
                    <p className="font-bold text-foreground text-base">Definir lesión</p>
                    <p className="text-xs text-muted-foreground mt-1">Caries, fracturas o patologías actuales</p>
                  </div>
                </button>
              </>
              )}

                {planId ? (
                  <button onClick={() => setMenuStep("PROCEDURES")} className="flex items-center gap-5 px-7 py-5 hover:bg-muted/50 transition-colors text-left border-b border-border">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 p-3 rounded-full"><PlusCircle className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold text-foreground text-base">Agregar prestación</p>
                      <p className="text-xs text-muted-foreground mt-1">Agrega un tratamiento al presupuesto</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-5 px-7 py-5 opacity-40 cursor-not-allowed border-b border-border">
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 p-3 rounded-full"><PlusCircle className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold text-foreground text-base">Cobros deshabilitados</p>
                      <p className="text-xs text-muted-foreground mt-1">Crea o abre un Plan para habilitar cobros.</p>
                    </div>
                  </div>
                )}
               {!isPlanView && (
                <button onClick={handleHealthyTooth} disabled={isSaving} className="flex items-center gap-5 px-7 py-5 hover:bg-muted/50 transition-colors text-left">
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-3 rounded-full">
                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin"/> : <CheckCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base">Diente sano</p>
                    <p className="text-xs text-muted-foreground mt-1">Limpia marcas previas en la pieza</p>
                  </div>
                </button>
                )}
              </div>
            )}

            {(menuStep === "LESIONS" || menuStep === "PREEXISTENCES") && (
              <div className="grid grid-cols-3 gap-4 p-7 bg-background">
                {(menuStep === "LESIONS" ? LESION_OPTIONS : PREEXISTENCE_OPTIONS).map((opt) => (
                  <button key={opt.value} onClick={() => { setSelectedStatus(opt); setMenuStep("SAVE_FORM"); }} className="flex flex-col items-center justify-center gap-3 py-5 px-2 rounded-2xl hover:bg-muted/60 transition-colors text-center border border-transparent hover:border-border">
                    <div className="text-4xl">{opt.icon}</div>
                    <span className="text-xs font-semibold text-muted-foreground leading-tight px-1">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {menuStep === "PROCEDURES" && (
              <div className="flex flex-col h-[450px] bg-background">
                <div className="p-5 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input placeholder="Buscar procedimiento..." className="pl-11 h-12 bg-muted/30 border-border text-base rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {procedureSearch.length > 0 ? procedureSearch.map((proc) => (
                    <button key={proc.id} onClick={() => handleAddProcedure(proc)} disabled={isSaving} className="w-full flex items-center justify-between p-5 border-b border-border/50 hover:bg-muted/50 transition-colors text-left group">
                      <div>
                        <p className="font-bold text-foreground text-base">{proc.name}</p>
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {proc.code ? `${proc.code} • ` : ""}{proc.category}
                        </span>
                      </div>
                      <p className="font-bold text-emerald-600 text-base">${proc.basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </button>
                  )) : (
                    <div className="text-center py-12 text-base font-medium text-muted-foreground">No se encontraron resultados</div>
                  )}
                </div>
              </div>
            )}

            {menuStep === "SAVE_FORM" && selectedStatus && (
              <div className="p-7 space-y-6 bg-background">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{selectedStatus.icon}</div>
                  <h4 className="font-bold text-xl">{selectedStatus.label}</h4>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-muted-foreground uppercase">Comentario (opcional)</Label>
                  <Textarea value={recordComment} onChange={(e) => setRecordComment(e.target.value)} placeholder={`Detalles adicionales...`} className="bg-muted/30 border-border resize-none text-base p-4 rounded-xl" rows={3} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setMenuStep(LESION_OPTIONS.some(opt => opt.value === selectedStatus.value) ? "LESIONS" : "PREEXISTENCES")} className="font-bold h-11 px-6 rounded-xl border-border">Atrás</Button>
                  <Button onClick={handleSaveRecord} disabled={isSaving} className="bg-[#008bcd] hover:bg-[#008bcd]/90 text-white font-bold h-11 px-6 rounded-xl shadow-sm">
                    {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : null} Guardar hallazgo
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      {/* TABLA DE REGISTROS DE HISTORIAL */}
      {!planId && (
      <div className="mt-8">
        <h3 className="font-bold text-lg mb-4 text-foreground uppercase">Detalle de Hallazgos Clínicos</h3>
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-bold uppercase">Fecha</th>
                <th className="p-4 font-bold uppercase text-center">Pieza</th>
                <th className="p-4 font-bold uppercase">Caras</th>
                <th className="p-4 font-bold uppercase">Hallazgo / Tratamiento</th>
                {canEditClinicalData && <th className="p-4 font-bold text-center">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.filter(r => r.isEvolution === (view === "evolucion")).length === 0 ? (
                <tr><td colSpan={canEditClinicalData ? 5 : 4} className="p-8 text-center text-muted-foreground font-medium">Sin registros.</td></tr>
              ) : (
                records.filter(r => r.isEvolution === (view === "evolucion")).map((record) => (
                  <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{format(new Date(record.createdAt), "dd/MM/yyyy HH:mm")}</td>
                    <td className="p-4 font-black text-center text-[#008bcd] text-base">{record.toothNumber}</td>
                    <td className="p-4 capitalize font-medium">{record.surfaces.includes("TODA_LA_PIEZA") ? "Toda la pieza" : record.surfaces.join(", ")}</td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{getStatusLabel(record.status)}</td>
                    {/* ACCIÓN PROTEGIDA POR ROL */}
                    {canEditClinicalData && (
                      <td className="p-4 text-center">
                          <Button variant="ghost" size="sm" className="text-red-500 font-bold hover:bg-red-50" onClick={() => handleDelete(record.id)}>Anular</Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
       )}
    </div>
  )
}