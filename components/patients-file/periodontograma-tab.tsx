"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Printer, Save, Loader2, Droplets, Edit, Trash2, X, Activity } from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Maximize2, Minimize2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { useGetPatient } from "@/hooks/patients"

const TOOTH_NUMBERS_SUP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const TOOTH_NUMBERS_INF = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const createEmptyToothData = () => ({ pd: ["", "", ""], mg: ["", "", ""], cal: ["", "", ""], bleeding: [false, false, false] });

// Edad
const calculateAge = (birthDateString?: string | Date | null) => {
  if (!birthDateString) return ""
  const today = new Date()
  const birthDate = new Date(birthDateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

const PerioGraphic = ({ tooth, data, isUpper }: { tooth: number, data: any, isUpper: boolean }) => {
  const scale = 3.5; 
  const w = 76; 
  const h = 110; 
  const cejY = h / 2; 
  const x = [16, w/2, w - 16]; 
  const dir = isUpper ? -1 : 1; 

  const mgVals = data.mg.map((v: any) => parseInt(v as string) || 0);
  const pdVals = data.pd.map((v: any) => parseInt(v as string) || 0);

  const mgY = mgVals.map((val: number) => cejY + (val * scale * dir));
  const pdY = mgVals.map((val: number, i: number) => cejY + ((val + pdVals[i]) * scale * dir));

  const mgPoints = `${x[0]},${mgY[0]} ${x[1]},${mgY[1]} ${x[2]},${mgY[2]}`;
  const pocketPolygon = `${x[0]},${mgY[0]} ${x[1]},${mgY[1]} ${x[2]},${mgY[2]} ${x[2]},${pdY[2]} ${x[1]},${pdY[1]} ${x[0]},${pdY[0]}`;
  
  const hasPocket = pdVals.some((val: number) => val > 3);
  const isMolar = [18,17,16,26,27,28,38,37,36,46,47,48].includes(tooth);

  let rootPath = "";
  let crownPath = "";

  if (isMolar) {
    rootPath = `M 16,${cejY} C 16,${cejY + (20*dir)} 24,${cejY + (45*dir)} 26,${cejY + (45*dir)} C 28,${cejY + (45*dir)} 34,${cejY + (20*dir)} 38,${cejY} C 42,${cejY + (20*dir)} 48,${cejY + (45*dir)} 50,${cejY + (45*dir)} C 52,${cejY + (45*dir)} 60,${cejY + (20*dir)} 60,${cejY}`;
    crownPath = `M 16,${cejY} C 12,${cejY - (10*dir)} 16,${cejY - (25*dir)} 24,${cejY - (25*dir)} C 30,${cejY - (25*dir)} 34,${cejY - (15*dir)} 38,${cejY - (15*dir)} C 42,${cejY - (15*dir)} 46,${cejY - (25*dir)} 52,${cejY - (25*dir)} C 60,${cejY - (25*dir)} 64,${cejY - (10*dir)} 60,${cejY}`;
  } else {
    rootPath = `M 16,${cejY} C 16,${cejY + (20*dir)} 36,${cejY + (45*dir)} 38,${cejY + (45*dir)} C 40,${cejY + (45*dir)} 60,${cejY + (20*dir)} 60,${cejY}`;
    crownPath = `M 16,${cejY} C 16,${cejY - (15*dir)} 24,${cejY - (25*dir)} 38,${cejY - (25*dir)} C 52,${cejY - (25*dir)} 60,${cejY - (15*dir)} 60,${cejY}`;
  }

  return (
    <div className="flex justify-center w-full">
      <svg width={w} height={h} className="bg-transparent">
        {[...Array(12)].map((_, i) => (
          <line key={i} x1="0" y1={i * 10} x2={w} y2={i * 10} className="stroke-border" strokeWidth="1" opacity="0.6"/>
        ))}
        
        <path d={rootPath} fill="none" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1.5" />
        <path d={crownPath} fill="none" className="stroke-slate-600 dark:stroke-slate-300" strokeWidth="1.5" />
        <line x1="0" y1={cejY} x2={w} y2={cejY} stroke="#ef4444" strokeWidth="1.5" />

        <polygon points={pocketPolygon} fill={hasPocket ? "rgba(239, 68, 68, 0.2)" : "rgba(148, 163, 184, 0.15)"} />
        <polyline points={mgPoints} fill="none" stroke="#008bcd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={`${x[0]},${pdY[0]} ${x[1]},${pdY[1]} ${x[2]},${pdY[2]}`} fill="none" stroke={hasPocket ? "#ef4444" : "#64748b"} strokeWidth="2" strokeLinecap="round" />
        
        {data.bleeding.map((b: boolean, i: number) => 
          b && (
            <circle 
              key={`blood-${i}`} 
              cx={x[i]} 
              cy={mgY[i] - (8 * dir)} 
              r="3.5" 
              fill="#ef4444" 
              className="animate-in zoom-in duration-200" 
            />
          )
        )}
      </svg>
    </div>
  )
}
const handlePrint = () => {
    window.print()
  }

const PerioInput = ({ value, onChange, isAlert = false, readOnly = false, isMargin = false }: any) => (
  <input 
    type="text" inputMode="numeric" value={value} 
    onChange={(e) => {
      const val = e.target.value;
      if (/^-?\d*$/.test(val) && !readOnly) onChange(val);
    }}
    readOnly={readOnly}
    className={cn(
      "w-6 h-7 text-center text-xs border rounded-md outline-none transition-colors mx-[1px]", 
      readOnly ? "bg-muted/40 cursor-not-allowed border-transparent font-medium" : "bg-background border-border shadow-sm focus:ring-2 focus:ring-[#008bcd]",
      isMargin && !readOnly && "border-orange-200 focus:ring-orange-400",
      isAlert && "text-red-600 font-bold bg-red-50 border-red-200"
    )}
  />
);

export function PeriodontogramaTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isFocusMode, setIsFocusMode] = useState(false)
  const toggleFocus = () => setIsFocusMode(!isFocusMode)

  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"

  const { patient } = useGetPatient(patientId)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [history, setHistory] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [chartData, setChartData] = useState<any>(() => {
    const initial: any = {};
    [...TOOTH_NUMBERS_SUP, ...TOOTH_NUMBERS_INF].forEach(n => initial[n] = createEmptyToothData());
    return initial;
  });

  const patientFullName = patient ? `${patient.firstName} ${patient.lastName}` : "Cargando..."
  const patientDocId = patient?.ci || "No registrado"
  const patientAge = calculateAge(patient?.birthDate)
  const doctorName = currentUser?.name || "Especialista Asignado"
  const doctorSpecialty = currentUser?.specialty || "Odontología General"

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/periodontogram?patientId=${patientId}`)
      const data = await res.json()
      setHistory(data || [])
      if (!editingId) {
        const reset: any = {};
        [...TOOTH_NUMBERS_SUP, ...TOOTH_NUMBERS_INF].forEach(n => reset[n] = createEmptyToothData());
        setChartData(reset);
      }
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }, [patientId, editingId])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleValueChange = (tooth: number, field: string, index: number, value: any) => {
    if (!canEditClinicalData) return; 

    setChartData((prev: any) => {
      const newTooth = { ...prev[tooth] };
      const newArray = [...newTooth[field]];
      newArray[index] = value;
      newTooth[field] = newArray;
      
      if (field === "pd" || field === "mg") {
        newTooth.cal = newTooth.pd.map((_: any, i: number) => {
          const pdNum = parseInt(newTooth.pd[i]) || 0;
          const mgNum = parseInt(newTooth.mg[i]) || 0;
          return pdNum + mgNum === 0 && (newTooth.pd[i]==="" && newTooth.mg[i]==="") ? "" : (pdNum + mgNum).toString();
        });
      }
      return { ...prev, [tooth]: newTooth };
    });
  }

  const handleSave = async () => {
    if (!canEditClinicalData) return;

    setIsSaving(true)
    try {
      const method = editingId ? "PUT" : "POST"
      const url = editingId ? `/api/periodontogram/${editingId}` : `/api/periodontogram`
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, data: chartData, authorId: currentUser?.id })
      })
      if (!res.ok) throw new Error()
      
      toast({ title: editingId ? "Actualizado" : "Guardado", variant: "success" })
      setEditingId(null)
      fetchHistory()
    } catch (e) { toast({ title: "Error", variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!canEditClinicalData) return;
    await fetch(`/api/periodontogram/${id}`, { method: "DELETE" })
    toast({ title: "Eliminado", variant: "success" })
    if (editingId === id) setEditingId(null)
    fetchHistory()
  }

  const renderArcadaSection = (numbers: number[], label: string, isUpper: boolean) => (
    <div className="mb-10 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none print:mb-6">
      <div className="px-4 py-3 border-b border-border flex items-center bg-muted/10 print:bg-transparent print:border-b-2 print:border-slate-300">
        <h3 className="font-bold text-[#008bcd] text-sm flex items-center gap-2 uppercase tracking-wide"><Activity size={16} className="print:hidden"/> {label}</h3>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar print:overflow-visible">
        <table className="w-max text-center border-collapse text-xs print:w-full print:scale-90 print:origin-top-left">
          <thead>
            {/* Gráfico Visual */}
            <tr>
              <th className="w-32 bg-card border-r border-border sticky left-0 z-10 p-2 text-left font-semibold text-muted-foreground shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] print:static print:shadow-none print:bg-transparent print:border-r-2 print:border-slate-300">
                Gráfico Clínico
              </th>
              {numbers.map(n => (
                <th key={`svg-${n}`} className="min-w-[76px] border-border p-0 bg-background relative align-bottom print:bg-transparent">
                  <PerioGraphic tooth={n} data={chartData[n]} isUpper={isUpper} />
                </th>
              ))}
            </tr>
            {/* Fila: Pieza */}
            <tr className="border-t border-border print:border-slate-300">
              <th className="w-32 bg-card border-r border-border sticky left-0 z-10 p-2 text-left font-bold text-foreground shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] print:static print:shadow-none print:bg-transparent print:border-r-2 print:border-slate-300">
                Pieza
              </th>
              {numbers.map(n => <th key={`th-${n}`} className="p-2 font-bold text-foreground bg-muted/30 print:bg-slate-100 print:text-[#008bcd]">{n}</th>)}
            </tr>
          </thead>
          <tbody className="bg-background print:bg-transparent">
            {/* Fila: Sangrado */}
            <tr className="border-t border-border print:border-slate-300">
              <td className="w-32 bg-card border-r border-border sticky left-0 z-10 p-2 text-left font-medium text-muted-foreground shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] print:static print:shadow-none print:bg-transparent print:border-r-2 print:border-slate-300">
                Sangrado
              </td>
              {numbers.map(n => (
                <td key={`bl-${n}`} className="p-1.5">
                  <div className="flex justify-center gap-1">
                    {[0,1,2].map(i => (
                      <button 
                        key={i} 
                        onClick={() => handleValueChange(n, "bleeding", i, !chartData[n].bleeding[i])}
                        disabled={!canEditClinicalData}
                        className={cn("w-[22px] h-5 rounded flex items-center justify-center transition-colors border", 
                          chartData[n].bleeding[i] ? "bg-red-500 border-red-600 text-white shadow-sm" : "border-border text-transparent hover:bg-muted",
                          !canEditClinicalData && !chartData[n].bleeding[i] && "cursor-not-allowed hover:bg-transparent",
                          "print:border-none print:bg-transparent print:text-red-500" // Al imprimir, mostrar gota roja o nada, sin botones
                        )}
                      >
                        {chartData[n].bleeding[i] ? <Droplets size={12} strokeWidth={3} className="text-white print:text-red-500"/> : <div className="print:hidden"><Droplets size={12} strokeWidth={3} className="text-muted-foreground/30"/></div>}
                      </button>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            {/* Fila: Prof. Bolsa */}
            <tr className="border-t border-border print:border-slate-300">
              <td className="w-32 bg-card border-r border-border sticky left-0 z-10 p-2 text-left font-bold text-foreground shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] print:static print:shadow-none print:bg-transparent print:border-r-2 print:border-slate-300">
                Prof. Bolsa
              </td>
              {numbers.map(n => (
                <td key={`pd-${n}`} className="p-1">
                  <div className="flex justify-center">{[0,1,2].map(i => <PerioInput key={i} value={chartData[n].pd[i]} onChange={(v:any) => handleValueChange(n, "pd", i, v)} isAlert={parseInt(chartData[n].pd[i]) > 3} readOnly={!canEditClinicalData} />)}</div>
                </td>
              ))}
            </tr>
            {/* Fila: Margen */}
            <tr className="border-t border-border print:border-slate-300">
              <td className="w-32 bg-card border-r border-border sticky left-0 z-10 p-2 text-left font-bold text-orange-500 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] print:static print:shadow-none print:bg-transparent print:border-r-2 print:border-slate-300">
                Margen
              </td>
              {numbers.map(n => (
                <td key={`mg-${n}`} className="p-1">
                  <div className="flex justify-center">{[0,1,2].map(i => <PerioInput key={i} value={chartData[n].mg[i]} onChange={(v:any) => handleValueChange(n, "mg", i, v)} isMargin readOnly={!canEditClinicalData} />)}</div>
                </td>
              ))}
            </tr>
            {/* Fila: NIC / CAL */}
            <tr className="border-t border-b border-border bg-muted/10 print:bg-slate-50 print:border-slate-300">
              <td className="w-32 bg-card border-r border-border sticky left-0 z-10 p-2 text-left font-bold text-foreground shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] print:static print:shadow-none print:bg-transparent print:border-r-2 print:border-slate-300">
                NIC / CAL
              </td>
              {numbers.map(n => (
                <td key={`cal-${n}`} className="p-1">
                  <div className="flex justify-center">{[0,1,2].map(i => <PerioInput key={i} value={chartData[n].cal[i]} readOnly isAlert={parseInt(chartData[n].cal[i]) > 4} />)}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#008bcd] w-10 h-10"/></div>

  return (
    <div 
          className={cn("transition-all duration-300 ease-in-out bg-background", isFocusMode ? "fixed inset-0 z-[100] w-screen h-screen overflow-y-auto p-4 md:p-8 bg-card" 
              : "relative w-full h-full animate-in fade-in"
          )}
        >

      {/* ----------------------------------------------------------- */}
      {/* CSS DE IMPRESIÓN Y MARCA DE AGUA */}
      {/* ----------------------------------------------------------- */}
      <style>{`
        @media print {
          aside, nav, header, footer, .print-hidden, [class*="sidebar"], [class*="menu"] { display: none !important; }
          main, body, [class*="main-content"] { 
            width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; 
          }
          .watermark-container {
            display: flex !important; position: fixed !important; top: 0; left: 0; right: 0; bottom: 0;
            justify-content: center; align-items: center; z-index: -1; pointer-events: none; opacity: 0.2;
          }
          .watermark-img { width: 500px; grayscale: 100%; }
          @page { size: landscape; margin: 1cm; }
        }
      `}</style>

      {/* MARCA DE AGUA (CENTRADA) */}
      <div className="hidden print:flex watermark-container">
        <img src="/logosn.png" alt="Watermark" className="watermark-img" />
      </div>

      {/* HEADER Y CONTROLES (Solo Web) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm sticky top-0 z-20 print-hidden">
        <div>
          <h2 className="text-2xl font-light flex items-center gap-3">
            Periodontograma
            {editingId && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><Edit size={14}/> Editando</span>}
          </h2>
          {!canEditClinicalData && (
             <span className="text-[10px] font-bold tracking-widest bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md mt-1 inline-block">
               SÓLO LECTURA
             </span>
          )}
        </div>
        
        {/* BARRA DE HERRAMIENTAS (Toolbar) */}
        <div className="flex items-center gap-1 bg-muted/40 p-1.5 rounded-xl border border-border shadow-sm">
          
          {/* Botones de acción protegidos por rol */}
          {canEditClinicalData && (
            editingId ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {setEditingId(null); fetchHistory();}} 
                  className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <X size={14} className="mr-1.5"/> Cancelar
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm"
                >
                  <Save size={14} className="mr-1.5"/> Actualizar
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={isSaving} 
                className="h-8 text-xs font-bold bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-lg shadow-sm transition-transform active:scale-95"
              >
                <Save size={14} className="mr-1.5"/> Guardar Nuevo
              </Button>
            )
          )}

          {/* Divisor vertical suave */}
          <div className="w-px h-5 bg-border mx-1"></div>

          {/* Botón Imprimir */}
          <Button 
            onClick={handlePrint} 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background hover:shadow-sm transition-all"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
          </Button>
          
          {/* Botón Focus Suave */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleFocus} 
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background hover:shadow-sm transition-all"
            title={isFocusMode ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

        </div>
      </div>

      {/* ENCABEZADO DE REPORTE (Solo Impresión) */}
      <div className="hidden print:block mb-8 w-full">
        <div className="flex justify-between items-center mb-6 border-b-2 border-[#008bcd] pb-4">
          <h1 className="text-3xl font-black text-black uppercase tracking-tight">
            REPORTE PERIODONTAL
          </h1>
          <div className="text-right text-[#008bcd]">
            <h3 className="text-2xl font-black tracking-tight">CARMODENTAL</h3>
            <p className="text-[10px] font-bold text-slate-600 uppercase">Clínica de Especialidades Odontológicas</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 text-sm text-black mb-8 border border-slate-200 rounded-lg p-6 bg-slate-50/50">
          <div className="space-y-1">
            <h4 className="font-bold text-xs mb-2 uppercase text-[#008bcd] border-b border-slate-200 pb-1">Datos del Paciente</h4>
            <p><span className="font-bold">Paciente:</span> {patientFullName}</p>
            <p><span className="font-bold">Identificación:</span> {patientDocId}</p>
            <p><span className="font-bold">Edad:</span> {patientAge ? `${patientAge} Años` : "--"}</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs mb-2 uppercase text-[#008bcd] border-b border-slate-200 pb-1">Datos del Profesional</h4>
            <p><span className="font-bold">Especialista:</span> {doctorName}</p>
            <p><span className="font-bold">Especialidad:</span> {doctorSpecialty}</p>
            <p><span className="font-bold">Fecha de Reporte:</span> {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</p>
          </div>
        </div>
      </div>

      {/* ARCADAS */}
      {renderArcadaSection(TOOTH_NUMBERS_SUP, "Maxilar Superior (Vestibular / Palatino)", true)}
      {renderArcadaSection(TOOTH_NUMBERS_INF, "Maxilar Inferior (Vestibular / Lingual)", false)}

      {/* TABLA DE HISTORIAL (Oculta al imprimir) */}
      <div className="mt-10 bg-card border border-border rounded-xl shadow-sm overflow-hidden print:hidden">
        <h3 className="bg-muted/10 p-4 font-bold border-b border-border text-sm text-foreground">Historial de Evaluaciones</h3>
        <table className="w-full text-sm text-left">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="p-4 font-semibold">Fecha de Registro</th>
              <th className="p-4 font-semibold">Profesional</th>
              {/* Acciones solo si puede editar */}
              {canEditClinicalData && <th className="p-4 font-semibold text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={canEditClinicalData ? 3 : 2} className="p-8 text-center text-muted-foreground">No hay evaluaciones previas registradas.</td>
              </tr>
            ) : 
            history.map((r: any) => (
              <tr key={r.id} className={cn("border-b border-border hover:bg-muted/30 transition-colors", editingId === r.id && "bg-amber-50/50 dark:bg-amber-900/10")}>
                <td className="p-4 font-medium">{format(new Date(r.createdAt), "dd/MM/yyyy - HH:mm")}</td>
                <td className="p-4">{r.author?.name || "Dr. Asignado"}</td>
                
                {/* Ocultamos las acciones de edición a la recepcionista */}
                {canEditClinicalData && (
                  <td className="p-4 flex justify-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => {setEditingId(r.id); setChartData(r.data)}} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"><Edit size={16} className="mr-2"/> Editar</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={16}/></Button></AlertDialogTrigger>
                      <AlertDialogContent className="bg-background border-border">
                        <AlertDialogHeader><AlertDialogTitle className="text-red-600">¿Eliminar evaluación?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(r.id)} className="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}