"use client"

import React, { useState, useEffect, useCallback } from "react"
import { 
  X, Loader2, ChevronLeft, 
  Stethoscope, History, CheckCircle, Search,
  Maximize2, Minimize2, Calendar, User, MessageSquare, FilterX, AlertTriangle, PlusCircle
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ToothPiece } from "@/components/patients-file/odontooth-piece"
import { odontogramStatuses } from "@/constants/status"

// --- NOMENCLATURA INTERNACIONAL ---
const LESION_OPTIONS = [
  { label: "Caries", value: "CARIES", type: "surfaces", icon: "🔴" },
  { label: "Fractura", value: "FRACTURA", type: "tooth", icon: "⚡" },
  { label: "Infección Pulpar", value: "ENDO_INDICADA", type: "tooth", icon: "🔺" },
  { label: "Restauración Defectuosa", value: "REST_MALA", type: "surfaces", icon: "⭕" },
  { label: "Extracción Indicada", value: "EXT_INDICADA", type: "tooth", icon: "❌" },
  { label: "Sellante Defectuoso", value: "SELLANTE_MALO", type: "tooth", icon: "S" },
]

const PREEXISTENCE_OPTIONS = [
  { label: "Restauración Buena", value: "REST_BUENA", type: "surfaces", icon: "🔵" },
  { label: "Corona Buena", value: "CORONA_BUENA", type: "tooth", icon: "🔘" },
  { label: "Endodoncia Realizada", value: "ENDO_REALIZADA", type: "tooth", icon: "🔺" },
  { label: "Ausente", value: "EXT_REALIZADA", type: "tooth", icon: "❌" },
  { label: "Sellante Bueno", value: "SELLANTE_BUENO", type: "tooth", icon: "S" },
]

const HEALTHY_OPTION = { label: "Diente sano", value: "DIENTE_SANO", type: "tooth", icon: "✓" }

const ALL_STATUS_OPTIONS = [...LESION_OPTIONS, ...PREEXISTENCE_OPTIONS, HEALTHY_OPTION]
const getStatusLabel = (val: string) => ALL_STATUS_OPTIONS.find(o => o.value === val)?.label || val

export function OdontogramaTab({ patientId, planId, onToothClickCallback, isPlanView = false, onPlanUpdate }: { 
  patientId: string; planId?: string; onToothClickCallback?: (tooth: number) => void; isPlanView?: boolean; onPlanUpdate?: () => void;
}) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false)
  const toggleFocus = () => setIsFocusMode(!isFocusMode)

  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"

  const [dentition, setDentition] = useState<"permanente" | "temporal">("permanente")
  const [view, setView] = useState("diagnostico")
  
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [currentSurfaces, setCurrentSurfaces] = useState<string[]>([])
  const [menuStep, setMenuStep] = useState<"NONE" | "OPTIONS" | "LESIONS" | "PREEXISTENCES" | "SAVE_FORM">("NONE")
  const [selectedStatus, setSelectedStatus] = useState<any>(null)
  const [recordComment, setRecordComment] = useState("")
  
  const [catalogoReal, setCatalogoReal] = useState<any[]>([])
  const [procedureSearch, setProcedureSearch] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [historySearch, setHistorySearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<any>(null)
  const [recordToDelete, setRecordToDelete] = useState<any>(null)

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
    if (!searchTerm) { setProcedureSearch(catalogoReal); return; }
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
    setIsSaving(true)
    try {
      if (selectedStatus?.value === "DIENTE_SANO") {
        await fetch(`/api/odontogram?patientId=${patientId}&toothNumber=${selectedTooth}`, { method: "DELETE" });
      }

      let finalSurfaces = currentSurfaces
      if (selectedStatus?.type === "tooth" || finalSurfaces.length === 0) finalSurfaces = ["TODA_LA_PIEZA"]

      const res = await fetch(`/api/odontogram`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            patientId, planId, 
            toothNumber: selectedTooth, 
            surfaces: finalSurfaces, 
            status: selectedStatus.value, 
            isEvolution: view === "evolucion", 
            authorId: currentUser?.id,
            notes: recordComment
        })
      })
      if (!res.ok) throw new Error()
      
      toast({ title: "Simbología registrada", variant: "success" })
      handleCloseMenu(); 
      fetchRecords();
      router.refresh();
    } catch (error) { toast({ title: "Error al guardar", variant: "destructive" }) } finally { setIsSaving(false) }
  }

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
        const response = await fetch(`/api/odontogram?id=${recordToDelete.id}`, { method: "DELETE" })
        if (!response.ok) throw new Error()
        toast({ title: "Registro anulado correctamente", variant: "success" }); 
        setRecordToDelete(null);
        fetchRecords();
        router.refresh();
    } catch (error) { toast({ title: "Error al anular", variant: "destructive" }) }
  }

  const canUserDeleteRecord = (record: any) => {
    if (!canEditClinicalData) return false;
    if (currentUser?.role === "ADMIN") return true;
    return record.authorId === currentUser?.id || record.author?.id === currentUser?.id;
  }

  const handleAddProcedure = async (procedure: any) => {
    if (!planId || !canEditClinicalData) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/treatments/${planId}/items`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureId: procedure.id,
          name: procedure.name,
          price: procedure.basePrice,
          toothNumber: selectedTooth,
          surfaces: currentSurfaces
        })
      });

      if (!res.ok) throw new Error();

      toast({ 
        title: "Prestación añadida", 
        description: `${procedure.name} (Pieza ${selectedTooth || 'General'}) sumado al presupuesto.`, 
        variant: "success" 
      });

      setIsCatalogModalOpen(false);
      setMenuStep("NONE"); 
      setSelectedTooth(null);
      setCurrentSurfaces([]);

      if (onPlanUpdate) onPlanUpdate();
      router.refresh(); 

    } catch (e) { 
      toast({ title: "Error al agregar prestación", variant: "destructive" }) 
    } finally { 
      setIsSaving(false); 
    }
  }

  const getRecordsForTooth = (toothNum: number) => records.filter(r => r.toothNumber === toothNum && r.isEvolution === (view === "evolucion"))

  const filteredHistoryRecords = records
    .filter(r => r.isEvolution === (view === "evolucion"))
    .filter(r => {
      const query = historySearch.toLowerCase().trim()
      const matchesSearch = !query || 
        r.toothNumber?.toString().includes(query) ||
        r.status?.toLowerCase().includes(query) ||
        getStatusLabel(r.status).toLowerCase().includes(query) ||
        r.notes?.toLowerCase().includes(query) ||
        r.author?.name?.toLowerCase().includes(query)

      const recordDate = new Date(r.createdAt)
      const matchesFrom = !dateFrom || recordDate >= new Date(dateFrom)
      const matchesTo = !dateTo || recordDate <= new Date(dateTo + "T23:59:59")

      return matchesSearch && matchesFrom && matchesTo
    })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#008bcd]" /></div>

  return (
    <div className={cn("transition-all duration-300 ease-in-out bg-background text-foreground", isFocusMode ? "fixed inset-0 z-[100] w-screen h-screen overflow-y-auto p-4 md:p-8 bg-background" : "relative w-full h-full animate-in fade-in")}>
      
      {/* HEADER DE HERRAMIENTAS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm sticky top-0 z-20 print-hidden">
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
          <button onClick={() => setDentition("permanente")} className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", dentition === "permanente" ? "bg-background text-[#008bcd] shadow-sm" : "text-muted-foreground hover:text-foreground")}>Permanente <span className="opacity-60 font-normal ml-1">32</span></button>
          <button onClick={() => setDentition("temporal")} className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", dentition === "temporal" ? "bg-background text-[#008bcd] shadow-sm" : "text-muted-foreground hover:text-foreground")}>Temporal <span className="opacity-60 font-normal ml-1">20</span></button>
        </div>
        <div className="flex items-center gap-3">
          {!canEditClinicalData && (
            <span className="text-[10px] font-bold tracking-widest bg-muted border border-border text-muted-foreground px-2 py-1.5 rounded-md">
              SÓLO LECTURA
            </span>
          )}
          
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
            <button 
              onClick={() => setView("diagnostico")} 
              className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", view === "diagnostico" ? "bg-[#008bcd] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Diagnóstico Inicial
            </button>
            <button 
              onClick={() => setView("evolucion")} 
              className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", view === "evolucion" ? "bg-[#008bcd] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Evolución Clínica
            </button>
          </div>

          <div className="w-px h-6 bg-border mx-1"></div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleFocus} 
            className="rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors h-8 w-8"
            title={isFocusMode ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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

      {/* MENÚ INTERACTIVO FLOTANTE DE PIEZA */}
      {menuStep !== "NONE" && canEditClinicalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card text-card-foreground w-[90%] max-w-[500px] rounded-[24px] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 dark:bg-slate-950 px-7 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                {menuStep !== "OPTIONS" && (
                   <Button variant="ghost" size="icon" onClick={() => setMenuStep("OPTIONS")} className="h-9 w-9 text-white hover:bg-white/20 rounded-full"><ChevronLeft className="w-5 h-5"/></Button>
                )}
                <div>
                  <h3 className="font-bold text-xl leading-tight">
                    {menuStep === "OPTIONS" ? "Opciones de Pieza" : menuStep === "LESIONS" ? "Definir lesión" : menuStep === "PREEXISTENCES" ? "Agregar preexistencia" : "Detalle"}
                  </h3>
                  <p className="text-xs opacity-80 font-medium tracking-wide uppercase mt-0.5">PIEZA {selectedTooth} {currentSurfaces.length > 0 && currentSurfaces[0] !== "TODA_LA_PIEZA" ? `• CARAS: ${currentSurfaces.join(", ")}` : ""}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseMenu} className="h-9 w-9 text-white hover:bg-white/20 rounded-full"><X className="w-5 h-5"/></Button>
            </div>

            {menuStep === "OPTIONS" && (
              <div className="flex flex-col bg-card">
                {/* 1. PREEXISTENCIA */}
                <button onClick={() => setMenuStep("PREEXISTENCES")} className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left border-b border-border">
                  <div className="bg-blue-50 dark:bg-blue-900/30 text-[#008bcd] p-3 rounded-full"><History className="w-6 h-6" /></div>
                  <div>
                    <p className="font-bold text-foreground text-base">Agregar preexistencia</p>
                    <p className="text-xs text-muted-foreground mt-1">Restauraciones o tratamientos previos</p>
                  </div>
                </button>
                
                {/* 2. LESIÓN */}
                <button onClick={() => setMenuStep("LESIONS")} className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left border-b border-border">
                  <div className="bg-red-50 dark:bg-red-900/30 text-red-500 p-3 rounded-full"><Stethoscope className="w-6 h-6" /></div>
                  <div>
                    <p className="font-bold text-foreground text-base">Definir lesión</p>
                    <p className="text-xs text-muted-foreground mt-1">Caries, fracturas o patologías actuales</p>
                  </div>
                </button>

                {/* 3. AGREGAR PRESTACIÓN (SOLO PLAN DE TRATAMIENTO) */}
                {planId && (
                  <button 
                    onClick={() => {
                      setMenuStep("NONE");
                      setIsCatalogModalOpen(true); 
                    }} 
                    className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left border-b border-border"
                  >
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 p-3 rounded-full">
                      <PlusCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-base">Agregar prestación</p>
                      <p className="text-xs text-muted-foreground mt-1">Agrega un tratamiento al presupuesto</p>
                    </div>
                  </button>
                )}

                {/* 4. DIENTE SANO */}
                <button 
                  onClick={() => {
                    setSelectedStatus(HEALTHY_OPTION);
                    setRecordComment("");
                    setMenuStep("SAVE_FORM");
                  }} 
                  className="flex items-center gap-5 px-7 py-5 hover:bg-accent transition-colors text-left"
                >
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-3 rounded-full">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base">Diente sano</p>
                    <p className="text-xs text-muted-foreground mt-1">Limpia marcas previas e ingresa comentarios</p>
                  </div>
                </button>
              </div>
            )}

            {(menuStep === "LESIONS" || menuStep === "PREEXISTENCES") && (
              <div className="grid grid-cols-3 gap-4 p-7 bg-card">
                {(menuStep === "LESIONS" ? LESION_OPTIONS : PREEXISTENCE_OPTIONS).map((opt) => (
                  <button key={opt.value} onClick={() => { setSelectedStatus(opt); setMenuStep("SAVE_FORM"); }} className="flex flex-col items-center justify-center gap-3 py-5 px-2 rounded-2xl hover:bg-accent transition-colors text-center border border-transparent hover:border-border">
                    <div className="text-4xl">{opt.icon}</div>
                    <span className="text-xs font-semibold text-muted-foreground leading-tight px-1">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {menuStep === "SAVE_FORM" && selectedStatus && (
              <div className="p-7 space-y-6 bg-card">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{selectedStatus.icon}</div>
                  <div>
                    <h4 className="font-bold text-xl text-foreground">
                      Agregar comentario a esta simbología: <span className="text-[#008bcd]">{selectedStatus.label}</span>
                    </h4>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Ingrese un comentario (opcional):</Label>
                  <Textarea 
                    value={recordComment} 
                    onChange={(e) => setRecordComment(e.target.value)} 
                    placeholder="Detalles clínicos o notas opcionales..." 
                    className="bg-background border-border resize-none text-base p-4 rounded-xl focus-visible:ring-[#008bcd]" 
                    rows={4} 
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setMenuStep("OPTIONS")} className="font-bold h-11 px-6 rounded-xl border-border">Cerrar</Button>
                  <Button onClick={handleSaveRecord} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl shadow-sm">
                    {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : null} Guardar simbología
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* --- MODAL DEL CATÁLOGO DE PRESTACIONES --- */}
      <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 z-[200] bg-card text-card-foreground border-border rounded-2xl overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 border-b border-border pb-4 bg-slate-900 text-white dark:bg-slate-950">
            <DialogTitle className="text-xl font-bold">Catálogo de Prestaciones</DialogTitle>
            <DialogDescription className="text-xs text-slate-300">
              {selectedTooth ? `Seleccionando tratamiento para la Pieza ${selectedTooth}` : "Seleccionando tratamiento general"}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 border-b border-border bg-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Buscar por nombre o categoría..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-9 bg-background border-border" 
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {procedureSearch.length > 0 ? procedureSearch.map((proc) => (
              <button 
                key={proc.id} 
                onClick={() => handleAddProcedure(proc)} 
                disabled={isSaving}
                className="w-full text-left p-4 hover:bg-accent border-b border-border flex justify-between items-center transition-colors rounded-lg group"
              >
                <div>
                  <p className="font-bold text-foreground text-sm group-hover:text-[#008bcd]">{proc.name}</p>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{proc.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600 dark:text-emerald-400 text-base">${proc.basePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin text-emerald-500 ml-auto mt-1" />}
                </div>
              </button>
            )) : (
              <div className="p-10 text-center text-muted-foreground">No se encontraron prestaciones activas.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- TABLA DE HISTORIAL CLÍNICO Y AUDITORÍA --- */}
      {!planId && (
        <div className="mt-8 space-y-4">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            
            <div className="p-5 border-b border-border bg-muted/30 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
              <div>
                <h3 className="font-black text-foreground text-lg tracking-tight">
                  DETALLE DE HALLAZGOS CLÍNICOS
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Historial acumulado de registros e impresiones diagnósticas</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Buscar pieza, hallazgo, doctor..." 
                    value={historySearch} 
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="pl-9 h-10 text-xs bg-background border-border rounded-xl focus-visible:ring-[#008bcd]"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl p-1 w-full sm:w-auto">
                  <Calendar className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
                  <input 
                    type="date" 
                    value={dateFrom} 
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-foreground outline-none p-1"
                    title="Fecha desde"
                  />
                  <span className="text-muted-foreground font-bold">-</span>
                  <input 
                    type="date" 
                    value={dateTo} 
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-foreground outline-none p-1"
                    title="Fecha hasta"
                  />
                </div>

                {(historySearch || dateFrom || dateTo) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { setHistorySearch(""); setDateFrom(""); setDateTo(""); }}
                    className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                    title="Limpiar filtros"
                  >
                    <FilterX className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-bold">
                  <tr>
                    <th className="p-4">Fecha</th>
                    <th className="p-4 text-center">Pieza</th>
                    <th className="p-4">Caras</th>
                    <th className="p-4">Hallazgo / Tratamiento</th>
                    <th className="p-4">Profesional</th>
                    <th className="p-4 text-center">Observación</th>
                    {canEditClinicalData && <th className="p-4 text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredHistoryRecords.length === 0 ? (
                    <tr>
                      <td colSpan={canEditClinicalData ? 7 : 6} className="p-12 text-center text-muted-foreground font-medium">
                        {historySearch || dateFrom || dateTo 
                          ? "No se encontraron hallazgos con los filtros seleccionados." 
                          : "Sin hallazgos clínicos registrados aún."}
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryRecords.map((record) => {
                      const canDeleteThis = canUserDeleteRecord(record);

                      return (
                        <tr key={record.id} className="hover:bg-accent/40 transition-colors">
                          <td className="p-4 font-semibold text-foreground">
                            {format(new Date(record.createdAt), "dd/MM/yyyy")}
                            <span className="block text-[11px] text-muted-foreground font-normal">{format(new Date(record.createdAt), "HH:mm")}</span>
                          </td>
                          <td className="p-4 font-black text-center text-[#008bcd] text-lg">{record.toothNumber}</td>
                          <td className="p-4 capitalize font-medium">
                            {record.surfaces.includes("TODA_LA_PIEZA") ? (
                              <span className="bg-muted text-foreground border border-border px-2.5 py-1 rounded-md text-xs font-semibold">Toda la pieza</span>
                            ) : (
                              <div className="flex gap-1 flex-wrap">
                                {record.surfaces.map((s: string) => (
                                  <span key={s} className="bg-muted text-foreground border border-border px-2 py-0.5 rounded-md text-xs font-semibold">{s}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {(() => {
                              const config = odontogramStatuses[record.status];
                              if (record.status === "DIENTE_SANO" || !config) {
                                return (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold w-max bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle className="w-3.5 h-3.5" /> <span>Diente Sano</span>
                                  </div>
                                );
                              }
                              return (
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold w-max ${config.bg} ${config.color}`}>
                                  <config.icon /> <span>{config.label}</span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-7 w-7 border border-border">
                                <AvatarImage src={record.author?.image || ""} alt={record.author?.name || "Doctor"} />
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                  {record.author?.name ? record.author.name.charAt(0).toUpperCase() : "D"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-bold text-foreground">
                                {record.author?.name || "Dr(a). Asignado"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {record.notes ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedRecordForDetail(record)}
                                className="h-8 px-3 rounded-lg text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                              >
                                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Ver Nota
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Sin notas</span>
                            )}
                          </td>
                          {canEditClinicalData && (
                            <td className="p-4 text-right">
                              {canDeleteThis ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-destructive font-bold hover:bg-destructive/10 rounded-lg h-8" 
                                  onClick={() => setRecordToDelete(record)}
                                >
                                  Anular
                                </Button>
                              ) : (
                                <span className="text-[11px] font-semibold text-muted-foreground/60 italic px-2" title="Solo el doctor creador o un administrador puede anular este registro">
                                  No permitido
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL DE DETALLE CLÍNICO / COMENTARIOS --- */}
      <Dialog open={!!selectedRecordForDetail} onOpenChange={(open) => !open && setSelectedRecordForDetail(null)}>
        <DialogContent className="sm:max-w-[450px] bg-card text-card-foreground border-border rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <MessageSquare className="w-5 h-5 text-[#008bcd]" />
              Observación Clínica - Pieza {selectedRecordForDetail?.toothNumber}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Registrado el {selectedRecordForDetail && format(new Date(selectedRecordForDetail.createdAt), "dd/MM/yyyy 'a las' HH:mm")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={selectedRecordForDetail?.author?.image || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">D</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Profesional a cargo</p>
                <p className="text-sm font-bold text-foreground">{selectedRecordForDetail?.author?.name || "Doctor Registrado"}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Nota / Comentario Médico:</Label>
              <div className="p-4 bg-background border border-border rounded-xl text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap">
                {selectedRecordForDetail?.notes}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE CONFIRMACIÓN PARA ANULAR --- */}
      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent className="bg-card border-border rounded-[24px] shadow-2xl sm:max-w-[450px]">
          <AlertDialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-foreground">
              ¿Anular hallazgo de la pieza {recordToDelete?.toothNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Esta acción eliminará la simbología <b className="text-foreground">"{getStatusLabel(recordToDelete?.status || '')}"</b> del odontograma del paciente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="w-full flex sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="border-border hover:bg-accent text-foreground font-bold rounded-xl h-11 px-5">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteRecord} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl h-11 px-6 shadow-sm"
            >
              Sí, Anular Registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}