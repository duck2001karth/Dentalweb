"use client"

import React, { useState, useEffect, useCallback } from "react"
import { 
  Activity, Save, Loader2, Droplets, Edit, 
  X, Maximize2, Minimize2 
} from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { PeriodontogramHistory } from "@/components/patients-file/periodontograma/periodontogram-history"

const TOOTH_NUMBERS_SUP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const TOOTH_NUMBERS_INF = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

const createEmptyToothData = () => ({
  pd: ["", "", ""],
  mg: ["", "", ""],
  cal: ["", "", ""],
  bleeding: [false, false, false],
})

const PerioGraphic = ({ tooth, data, isUpper }: { tooth: number; data: any; isUpper: boolean }) => {
  const scale = 3.2
  const w = 76
  const h = 114
  const cejY = h / 2
  const x = [16, w / 2, w - 16]
  const dir = isUpper ? -1 : 1

  const mgVals = data.mg.map((v: any) => parseInt(v as string) || 0)
  const pdVals = data.pd.map((v: any) => parseInt(v as string) || 0)

  const mgY = mgVals.map((val: number) => cejY + val * scale * dir)
  const pdY = mgVals.map((val: number, i: number) => cejY + (val + pdVals[i]) * scale * dir)

  const mgPoints = `${x[0]},${mgY[0]} ${x[1]},${mgY[1]} ${x[2]},${mgY[2]}`
  const pocketPolygon = `${x[0]},${mgY[0]} ${x[1]},${mgY[1]} ${x[2]},${mgY[2]} ${x[2]},${pdY[2]} ${x[1]},${pdY[1]} ${x[0]},${pdY[0]}`

  const hasPocket = pdVals.some((val: number) => val > 3)
  const isMolar = [18, 17, 16, 26, 27, 28, 38, 37, 36, 46, 47, 48].includes(tooth)
  const isPremolar = [15, 14, 24, 25, 35, 34, 44, 45].includes(tooth)

  let rootPath = ""
  let crownPath = ""

  if (isMolar) {
    rootPath = `M 15,${cejY} C 14,${cejY + 22 * dir} 22,${cejY + 46 * dir} 25,${cejY + 46 * dir} C 28,${cejY + 46 * dir} 34,${cejY + 22 * dir} 38,${cejY + 12 * dir} C 42,${cejY + 22 * dir} 48,${cejY + 46 * dir} 51,${cejY + 46 * dir} C 54,${cejY + 46 * dir} 62,${cejY + 22 * dir} 61,${cejY}`
    crownPath = `M 15,${cejY} C 11,${cejY - 10 * dir} 15,${cejY - 26 * dir} 24,${cejY - 27 * dir} C 30,${cejY - 24 * dir} 34,${cejY - 20 * dir} 38,${cejY - 22 * dir} C 42,${cejY - 20 * dir} 46,${cejY - 24 * dir} 52,${cejY - 27 * dir} C 61,${cejY - 26 * dir} 65,${cejY - 10 * dir} 61,${cejY}`
  } else if (isPremolar) {
    rootPath = `M 18,${cejY} C 18,${cejY + 20 * dir} 34,${cejY + 48 * dir} 38,${cejY + 48 * dir} C 42,${cejY + 48 * dir} 58,${cejY + 20 * dir} 58,${cejY}`
    crownPath = `M 18,${cejY} C 15,${cejY - 12 * dir} 20,${cejY - 26 * dir} 28,${cejY - 27 * dir} C 34,${cejY - 23 * dir} 38,${cejY - 24 * dir} 42,${cejY - 23 * dir} C 48,${cejY - 26 * dir} 56,${cejY - 26 * dir} 58,${cejY}`
  } else {
    rootPath = `M 20,${cejY} C 20,${cejY + 22 * dir} 35,${cejY + 50 * dir} 38,${cejY + 50 * dir} C 41,${cejY + 50 * dir} 56,${cejY + 22 * dir} 56,${cejY}`
    crownPath = `M 20,${cejY} C 18,${cejY - 12 * dir} 22,${cejY - 27 * dir} 38,${cejY - 28 * dir} C 54,${cejY - 27 * dir} 58,${cejY - 12 * dir} 56,${cejY}`
  }

  return (
    <div className="flex justify-center w-full select-none">
      <svg width={w} height={h} className="overflow-visible">
        {[-4, -3, -2, -1, 1, 2, 3, 4].map((step) => {
          const yPos = cejY + step * 6 * dir
          return (
            <line
              key={step}
              x1="6"
              y1={yPos}
              x2={w - 6}
              y2={yPos}
              stroke="currentColor"
              className="text-border/40"
              strokeWidth="0.75"
              strokeDasharray={step % 2 === 0 ? "none" : "2,2"}
            />
          )
        })}

        <path d={rootPath} fill="none" className="stroke-muted-foreground/50 dark:stroke-muted-foreground/60" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d={crownPath} fill="none" className="stroke-foreground/80 dark:stroke-foreground/90" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        <line x1="8" y1={cejY} x2={w - 8} y2={cejY} stroke="#0ea5e9" strokeWidth="1.2" strokeOpacity="0.8" />
        <polygon points={pocketPolygon} fill={hasPocket ? "rgba(239, 68, 68, 0.28)" : "rgba(14, 165, 233, 0.14)"} />
        <polyline points={mgPoints} fill="none" stroke="#008bcd" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={`${x[0]},${pdY[0]} ${x[1]},${pdY[1]} ${x[2]},${pdY[2]}`} fill="none" stroke={hasPocket ? "#ef4444" : "#64748b"} strokeWidth="2" strokeLinecap="round" />

        {data.bleeding.map((isBleeding: boolean, i: number) =>
          isBleeding ? (
            <circle
              key={`blood-${i}`}
              cx={x[i]}
              cy={mgY[i] - 7 * dir}
              r="3.2"
              className="fill-red-500 animate-in zoom-in-75 duration-200"
            />
          ) : null
        )}
      </svg>
    </div>
  )
}

const PerioInput = ({
  value,
  onChange,
  isAlert = false,
  readOnly = false,
  isMargin = false,
}: {
  value: any
  onChange?: (val: string) => void
  isAlert?: boolean
  readOnly?: boolean
  isMargin?: boolean
}) => (
  <input
    type="text"
    inputMode="numeric"
    value={value}
    onChange={(e) => {
      const val = e.target.value
      if (/^-?\d*$/.test(val) && !readOnly && onChange) {
        if (val.length <= 2) onChange(val)
      }
    }}
    readOnly={readOnly}
    className={cn(
      "w-[22px] h-6 text-center font-mono text-[11px] rounded-md outline-none transition-all mx-[1px] bg-transparent",
      readOnly
        ? "border border-border/50 text-foreground/80 font-bold select-none cursor-default"
        : "border border-border/80 text-foreground font-semibold hover:border-slate-400 dark:hover:border-slate-500 focus:border-[#008bcd] focus:bg-background focus:ring-1 focus:ring-[#008bcd]",
      isMargin && !readOnly && "border-amber-400/40 text-amber-600 dark:text-amber-400 focus:border-amber-500 focus:ring-amber-500",
      isAlert && value && "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-black"
    )}
  />
)

export function PeriodontogramaTab({ patientId }: { patientId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const currentUser = session?.user as any
  const canEditClinicalData = currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN"

  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [history, setHistory] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  const [chartData, setChartData] = useState<any>(() => {
    const initial: any = {}
    ;[...TOOTH_NUMBERS_SUP, ...TOOTH_NUMBERS_INF].forEach((n) => (initial[n] = createEmptyToothData()))
    return initial
  })

const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/periodontogram?patientId=${patientId}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setHistory(list)
      if (!editingId) {
        if (list.length > 0 && list[0]?.data) {
          const latestData = list[0].data
          const normalized: any = {}
          ;[...TOOTH_NUMBERS_SUP, ...TOOTH_NUMBERS_INF].forEach((n) => {
            normalized[n] = latestData[n] || latestData[n.toString()] || createEmptyToothData()
          })
          setChartData(normalized)
        } else {
          const reset: any = {}
          ;[...TOOTH_NUMBERS_SUP, ...TOOTH_NUMBERS_INF].forEach((n) => (reset[n] = createEmptyToothData()))
          setChartData(reset)
        }
      }
    } catch (e) {
      console.error("Error al cargar historial periodontal:", e)
    } finally {
      setIsLoading(false)
    }
  }, [patientId, editingId])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleValueChange = (tooth: number, field: string, index: number, value: any) => {
    if (!canEditClinicalData) return

    setChartData((prev: any) => {
      const newTooth = { ...prev[tooth] }
      const newArray = [...newTooth[field]]
      newArray[index] = value
      newTooth[field] = newArray

      if (field === "pd" || field === "mg") {
        newTooth.cal = newTooth.pd.map((_: any, i: number) => {
          const pdNum = parseInt(newTooth.pd[i]) || 0
          const mgNum = parseInt(newTooth.mg[i]) || 0
          if (newTooth.pd[i] === "" && newTooth.mg[i] === "") return ""
          return (pdNum + mgNum).toString()
        })
      }
      return { ...prev, [tooth]: newTooth }
    })
  }

 const handleSave = async () => {
    if (!canEditClinicalData) return

    setIsSaving(true)
    try {
      const method = editingId ? "PUT" : "POST"
      const url = editingId ? `/api/periodontogram/${editingId}` : `/api/periodontogram`

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, data: chartData, authorId: currentUser?.id }),
      })
      if (!res.ok) throw new Error()

      const savedRecord = await res.json()

      toast({
        title: editingId ? "Evaluación actualizada" : "Evaluación registrada",
        description: "Los valores periodontales se han guardado exitosamente.",
        variant: "success" as any
      })

      setEditingId(null)
      fetchHistory()
    } catch {
      toast({
        title: "Error al guardar",
        description: "No se pudo sincronizar la evaluación.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!canEditClinicalData) return
    try {
      const res = await fetch(`/api/periodontogram/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "Evaluación eliminada", description: "El registro ha sido removido." })
      if (editingId === id) setEditingId(null)
      fetchHistory()
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el registro.", variant: "destructive" })
    }
  }

  const renderArcadaSection = (numbers: number[], label: string, isUpper: boolean) => {
  const getTooth = (n: number) => chartData?.[n] || chartData?.[n.toString()] || createEmptyToothData();

  return (
    <div className="mb-6 bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-border/70 flex items-center justify-between bg-muted/10">
        <h3 className="font-bold text-foreground/85 text-sm flex items-center gap-2 tracking-wide">
          <Activity size={14} className="text-[#008bcd]" /> 
          <span>{label}</span>
        </h3>
        <span className="text-[10px] text-muted-foreground font-medium">16 Piezas Dentales</span>
      </div>

      <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60">
        <table className="w-max text-center border-collapse text-xs">
          <thead>
            {/* 1. FILA MODIFICADA: Gráfico Clínico */}
            <tr>
              <th className="w-28 bg-card border-r border-border/80 sticky left-0 z-10 p-2 text-left text-[11px] font-bold text-muted-foreground shadow-xs">
                Línea Gingival
              </th>
              {numbers.map((n) => (
                <th key={`svg-${n}`} className="min-w-[76px] p-0 bg-background/50 border-r border-border/40 align-bottom">
                  <PerioGraphic tooth={n} data={getTooth(n)} isUpper={isUpper} />
                </th>
              ))}
            </tr>

            {/* Fila: Número Pieza */}
            <tr className="border-t border-border/60 bg-muted/10">
              <th className="w-28 bg-card border-r border-border/70 sticky left-0 z-10 p-2 text-left text-[11px] font-semibold text-foreground/80 shadow-xs">
                Pieza FDI
              </th>
              {numbers.map((n) => (
                <th key={`th-${n}`} className="p-1.5 font-mono font-bold text-xs text-[#008bcd] border-r border-border/30">
                  {n}
                </th>
              ))}
            </tr>
          </thead>

         <tbody className="divide-y divide-border/50 bg-background">
            <tr>
              <td className="w-28 bg-card border-r border-border/70 sticky left-0 z-10 p-2 text-left text-[11px] font-medium text-muted-foreground shadow-xs">
                Sangrado (BOP)
              </td>
              {numbers.map((n) => {
                const tooth = getTooth(n);
                return (
                  <td key={`bl-${n}`} className="p-1 border-r border-border/30">
                    <div className="flex justify-center gap-1">
                      {[0, 1, 2].map((i) => {
                        const isBleeding = Boolean(tooth.bleeding?.[i]);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleValueChange(n, "bleeding", i, !isBleeding)}
                            disabled={!canEditClinicalData}
                            className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer border",
                              isBleeding
                                ? "bg-rose-500 border-rose-600 text-white shadow-xs scale-105"
                                : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/30",
                              !canEditClinicalData && "cursor-not-allowed opacity-40 hover:bg-transparent"
                            )}
                            title={`Sitio ${i + 1}: ${isBleeding ? "Sangrado activo" : "Marcar sangrado"}`}
                          >
                            <Droplets size={10} strokeWidth={isBleeding ? 2.5 : 1.5} />
                          </button>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="w-28 bg-card border-r border-border/80 sticky left-0 z-10 p-2 text-left text-[11px] font-black text-foreground shadow-xs">
                Prof. Bolsa (PD)
              </td>
              {numbers.map((n) => {
                const tooth = getTooth(n);
                return (
                  <td key={`pd-${n}`} className="p-1 border-r border-border/40">
                    <div className="flex justify-center">
                      {[0, 1, 2].map((i) => (
                        <PerioInput
                          key={i}
                          value={tooth.pd[i]}
                          onChange={(v: any) => handleValueChange(n, "pd", i, v)}
                          isAlert={parseInt(tooth.pd[i]) > 3}
                          readOnly={!canEditClinicalData}
                        />
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* 4. FILA MODIFICADA: Margen Gingival (MG) */}
            <tr>
              <td className="w-28 bg-card border-r border-border/80 sticky left-0 z-10 p-2 text-left text-[11px] font-bold text-amber-600 dark:text-amber-400 shadow-xs">
                Margen (MG)
              </td>
              {numbers.map((n) => {
                const tooth = getTooth(n);
                return (
                  <td key={`mg-${n}`} className="p-1 border-r border-border/40">
                    <div className="flex justify-center">
                      {[0, 1, 2].map((i) => (
                        <PerioInput
                          key={i}
                          value={tooth.mg[i]}
                          onChange={(v: any) => handleValueChange(n, "mg", i, v)}
                          isMargin
                          readOnly={!canEditClinicalData}
                        />
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* 5. FILA MODIFICADA: Nivel de Inserción Clínica (NIC / CAL) */}
            <tr className="bg-muted/15 font-bold">
              <td className="w-28 bg-card border-r border-border/80 sticky left-0 z-10 p-2 text-left text-[11px] font-black text-foreground shadow-xs">
                NIC / CAL
              </td>
              {numbers.map((n) => {
                const tooth = getTooth(n);
                return (
                  <td key={`cal-${n}`} className="p-1 border-r border-border/40">
                    <div className="flex justify-center">
                      {[0, 1, 2].map((i) => (
                        <PerioInput
                          key={i}
                          value={tooth.cal[i]}
                          readOnly
                          isAlert={parseInt(tooth.cal[i]) > 4}
                        />
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-[#008bcd]">
        <Loader2 className="animate-spin w-10 h-10 mb-3" />
        <p className="font-semibold text-xs text-muted-foreground">Cargando periodontograma...</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out bg-background text-foreground",
        isFocusMode ? "fixed inset-0 z-[100] w-screen h-screen overflow-y-auto p-6 bg-card" : "relative w-full h-full animate-in fade-in space-y-6"
      )}
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-5 rounded-2xl border border-border/80 shadow-xs sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#008bcd]" /> Periodontograma Clínico
            </h2>
            {editingId && (
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Edit size={12} /> Modificando Registro
              </span>
            )}
            {!canEditClinicalData && (
              <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-md border border-border/80 tracking-wider">
                SÓLO LECTURA
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">
            Mapeo de profundidad de sondaje, recesión de margen y nivel de inserción clínica (NIC/CAL).
          </p>
        </div>

        {/* Toolbar de Acciones */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {canEditClinicalData && (
            editingId ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingId(null)
                    fetchHistory()
                  }}
                  className="h-10 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
                >
                  <X size={14} className="mr-1.5" /> Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-10 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs"
                >
                  {isSaving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                  Actualizar Evaluación
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-10 text-xs font-bold bg-[#008bcd] hover:bg-[#0070a8] text-white rounded-xl shadow-xs transition-all cursor-pointer px-4"
              >
                {isSaving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                Guardar Evaluación
              </Button>
            )
          )}

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsFocusMode(!isFocusMode)}
            className="bg-background border-border/80 text-foreground hover:bg-accent shrink-0 rounded-xl h-10 w-10 font-bold cursor-pointer transition-all"
            title={isFocusMode ? "Salir de pantalla completa" : "Modo Enfoque"}
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* GUÍA RÁPIDA DE INTERPRETACIÓN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-border/70 bg-card flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
            <Droplets size={16} />
          </div>
          <div>
            <p className="font-bold text-xs text-foreground">BOP (Bleeding on Probing)</p>
            <p className="text-[14px] text-muted-foreground">Sangrado gingival activo al sondaje.</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border/70 bg-card flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#008bcd]/10 border border-[#008bcd]/20 flex items-center justify-center text-[#008bcd] shrink-0 font-mono font-bold text-xs">
            PD
          </div>
          <div>
            <p className="font-bold text-xs text-foreground">Profundidad de Bolsa &gt; 3 mm</p>
            <p className="text-[14px] text-muted-foreground">Se resalta en rojo indicando bolsa patológica.</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border/70 bg-card flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 font-mono font-bold text-xs">
            CAL
          </div>
          <div>
            <p className="font-bold text-xs text-foreground">CAL = PD + MG</p>
            <p className="text-[14px] text-muted-foreground">Pérdida de inserción calculada automáticamente.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {renderArcadaSection(TOOTH_NUMBERS_SUP, "Maxilar Superior (Vestibular / Palatino)", true)}
        {renderArcadaSection(TOOTH_NUMBERS_INF, "Maxilar Inferior (Vestibular / Lingual)", false)}
      </div>
      <PeriodontogramHistory
        history={history}
        editingId={editingId}
        canEdit={canEditClinicalData}
        currentUser={currentUser}     
        onEdit={(record) => {
          setEditingId(record.id)
          setChartData(record.data)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}