"use client"

import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Edit3, Trash2, CalendarClock, History, Check, Droplets, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PeriodontogramHistoryProps {
  history: any[]
  editingId: string | null
  canEdit: boolean
  currentUser?: any
  onEdit: (record: any) => void
  onDelete: (id: string) => void
}

export function PeriodontogramHistory({
  history = [],
  editingId,
  canEdit,
  currentUser,
  onEdit,
  onDelete,
}: PeriodontogramHistoryProps) {
  // Validación de rol flexible para administradores
  const userRole = String(currentUser?.role || "").toUpperCase().trim()
  const canUserDelete = userRole === "ADMIN" || userRole === "ADMINISTRADOR" || userRole === "ADMINISTRATION"

  // Métricas del examen
  const getExamSummary = (data: any) => {
    if (!data) return { bopPercent: 0, deepPockets: 0 }
    let totalSites = 0
    let bleedingSites = 0
    let deepPockets = 0

    Object.values(data).forEach((tooth: any) => {
      if (Array.isArray(tooth?.bleeding)) {
        tooth.bleeding.forEach((b: boolean) => {
          totalSites++
          if (b) bleedingSites++
        })
      }
      if (Array.isArray(tooth?.pd)) {
        tooth.pd.forEach((val: string) => {
          const depth = parseInt(val, 10)
          if (depth >= 4) deepPockets++
        })
      }
    })

    const bopPercent = totalSites > 0 ? Math.round((bleedingSites / totalSites) * 100) : 0
    return { bopPercent, deepPockets }
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
      
      {/* Cabecera */}
      <div className="px-6 py-4 border-b border-border/70 flex items-center justify-between bg-muted/15">
        <h3 className="font-bold text-sm text-foreground uppercase tracking-wide flex items-center gap-2.5">
          <History className="w-4 h-4 text-[#008bcd]" />
          Historial Cronológico Periodontal
        </h3>
        <span className="text-xs font-semibold text-muted-foreground bg-background px-3 py-1 rounded-full border border-border/80">
          {history.length} {history.length === 1 ? "Registro" : "Registros"}
        </span>
      </div>

      {/* Tabla con fuentes de tamaño estándar */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="border-b border-border/70 text-muted-foreground bg-muted/10 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Fecha de Toma</th>
              <th className="px-6 py-3.5">Especialista Evaluador</th>
              <th className="px-6 py-3.5 text-center">Sangrado (BOP)</th>
              <th className="px-6 py-3.5 text-center">Bolsas (&ge; 4mm)</th>
              <th className="px-6 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-background text-sm">
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-muted-foreground">
                  <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-center mx-auto mb-3">
                    <CalendarClock className="w-6 h-6 text-muted-foreground/60" />
                  </div>
                  <p className="font-semibold text-base text-foreground">Sin evaluaciones registradas</p>
                  <p className="text-sm mt-1">Guarda los índices periodontales para iniciar el seguimiento cronológico.</p>
                </td>
              </tr>
            ) : (
              history.map((r: any) => {
                const isSelected = editingId === r.id
                const summary = getExamSummary(r.data)

                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      isSelected && "bg-[#008bcd]/5 border-l-4 border-l-[#008bcd]"
                    )}
                  >
                    {/* Fecha de Toma */}
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      <p className="font-bold text-foreground text-sm">
                        {format(new Date(r.createdAt), "dd/MM/yyyy", { locale: es })}
                      </p>
                      <span className="text-xs text-muted-foreground font-normal">
                        {format(new Date(r.createdAt), "HH:mm")} hrs
                      </span>
                    </td>

                    {/* Especialista */}
                    <td className="px-6 py-4 font-semibold text-foreground text-sm">
                      {r.author?.name || "Dr(a). Evaluador"}
                    </td>

                    {/* BOP */}
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border font-mono",
                        summary.bopPercent > 10 
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20" 
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      )}>
                        <Droplets size={12} />
                        {summary.bopPercent}%
                      </span>
                    </td>

                    {/* Bolsas */}
                    <td className="px-6 py-4 text-center">
                      {summary.deepPockets > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono">
                          <AlertTriangle size={12} />
                          {summary.deepPockets} sitios
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/70 font-medium">0 sitios</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => onEdit(r)}
                            className={cn(
                              "h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
                              isSelected 
                                ? "bg-[#008bcd] text-white hover:bg-[#0076ad]" 
                                : "text-foreground hover:text-[#008bcd] border-border/80"
                            )}
                          >
                            {isSelected ? (
                              <>
                                <Check size={14} className="mr-1.5" /> Editando
                              </>
                            ) : (
                              <>
                                <Edit3 size={14} className="mr-1.5 text-muted-foreground" /> Cargar / Editar
                              </>
                            )}
                          </Button>
                        )}

                        {/* Botón de Eliminar para Administrador */}
                        {canUserDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-xl text-destructive/80 hover:text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/40 cursor-pointer"
                                title="Eliminar Registro"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border/80 rounded-2xl sm:max-w-[420px]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive font-bold text-base flex items-center gap-2">
                                  <Trash2 size={18} /> ¿Eliminar Evaluación Periodontal?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-muted-foreground mt-2 font-medium">
                                  Esta acción eliminará de forma permanente los índices de sondaje y nivel de inserción clínica de este registro.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-4 gap-2">
                                <AlertDialogCancel className="rounded-xl text-xs font-bold border-border/80 cursor-pointer">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(r.id)}
                                  className="bg-destructive hover:bg-destructive/90 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                  Sí, Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}