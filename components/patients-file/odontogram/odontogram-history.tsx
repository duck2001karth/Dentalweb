"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Search, Calendar, FilterX, MessageSquare, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { odontogramStatuses } from "@/constants/status"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { OdontogramHistoryModals } from "./odontogram-history-modals"

const getSurfaceLabel = (surface: string, toothNumber: number): string => {
  const low = surface?.toLowerCase()?.trim() || ""
  if (low === "center" || low === "middle") return "Oclusal / Incisal"
  if (low === "top") return "Vestibular"
  if (low === "bottom") return toothNumber >= 31 && toothNumber <= 48 ? "Lingual" : "Palatino"
  if (low === "left") {
    const quadrant = Math.floor(toothNumber / 10)
    return quadrant === 1 || quadrant === 4 ? "Distal" : "Mesial"
  }
  if (low === "right") {
    const quadrant = Math.floor(toothNumber / 10)
    return quadrant === 1 || quadrant === 4 ? "Mesial" : "Distal"
  }
  if (low === "mesial") return "Mesial"
  if (low === "distal") return "Distal"
  if (low === "vestibular") return "Vestibular"
  if (low === "lingual") return "Lingual"
  if (low === "palatino" || low === "palatina") return "Palatino"
  if (low === "oclusal") return "Oclusal"
  if (low === "incisal") return "Incisal"
  return surface
}

export function OdontogramHistory({
  records = [],
  view,
  canEdit,
  currentUser,
  confirmDeleteRecord,
  getStatusLabel,
  onRecordUpdated,
}: any) {
  const { toast } = useToast()
  const [historySearch, setHistorySearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<any>(null)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [editedNote, setEditedNote] = useState("")
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<any>(null)

  const canUserDeleteRecord = (record: any) => {
    if (!canEdit) return false
    if (currentUser?.role === "ADMIN") return true
    return record.authorId === currentUser?.id || record.author?.id === currentUser?.id
  }

  const filteredHistoryRecords = records.filter((r: any) => {
    const query = historySearch.toLowerCase().trim()
    const matchesSearch =
      !query ||
      r.toothNumber?.toString().includes(query) ||
      getStatusLabel(r.status).toLowerCase().includes(query) ||
      r.author?.name?.toLowerCase().includes(query) ||
      r.notes?.toLowerCase().includes(query)

    const recordDate = new Date(r.createdAt)
    const matchesFrom = !dateFrom || recordDate >= new Date(dateFrom)
    const matchesTo = !dateTo || recordDate <= new Date(dateTo + "T23:59:59")
    return matchesSearch && matchesFrom && matchesTo
  })

  const handleSaveObservation = async () => {
    if (!selectedRecordForDetail) return
    setIsSavingNote(true)
    try {
      const res = await fetch(`/api/odontogram`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRecordForDetail.id,
          notes: editedNote,
        }),
      })

      if (!res.ok) throw new Error()

      toast({
        title: "Observación actualizada",
        description: "Se guardó la nota clínica para la pieza #" + selectedRecordForDetail.toothNumber,
        variant: "success",
      })

      setIsEditingNote(false)
      setSelectedRecordForDetail(null)
      if (onRecordUpdated) onRecordUpdated()
    } catch {
      toast({
        title: "Error al actualizar",
        description: "No se pudo guardar la observación clínica.",
        variant: "destructive",
      })
    } finally {
      setIsSavingNote(false)
    }
  }

  const renderSurfacesBadges = (surfaces: string[] | string, toothNumber: number) => {
    const list = Array.isArray(surfaces) ? surfaces : [surfaces]
    const isTotal = list.length === 0 || list.includes("TODA_LA_PIEZA") || list.includes("all")

    if (isTotal) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-muted/70 text-muted-foreground border border-border/80">
          Toda la pieza
        </span>
      )
    }

    return (
      <div className="flex flex-wrap gap-1">
        {list.map((surface, idx) => (
          <span
            key={idx}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#008bcd]/10 text-[#008bcd] border border-[#008bcd]/20"
          >
            {getSurfaceLabel(surface, toothNumber)}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4 font-sans antialiased">
      <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
        {/* HEADER Y FILTROS */}
        <div className="p-5 border-b border-border/70 bg-muted/15 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
          <div>
            <h3 className="font-black text-foreground text-base tracking-tight uppercase">
              Detalle de Hallazgos Clínicos
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Historial cronológico de patologías, tratamientos e impresiones diagnósticas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 items-center w-full lg:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar pieza, hallazgo..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-background border-border/80 rounded-xl focus-visible:ring-1 focus-visible:ring-[#008bcd]"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-xl px-2 h-9 w-full sm:w-auto">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-[11px] font-semibold text-foreground outline-none cursor-pointer"
                title="Fecha desde"
              />
              <span className="text-muted-foreground font-bold text-xs">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-[11px] font-semibold text-foreground outline-none cursor-pointer"
                title="Fecha hasta"
              />
            </div>

            {(historySearch || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setHistorySearch("")
                  setDateFrom("")
                  setDateTo("")
                }}
                className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl shrink-0 cursor-pointer"
                title="Limpiar filtros"
              >
                <FilterX className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* TABLA DE AUDITORÍA */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-muted/10 border-b border-border/70 text-[10px] uppercase text-muted-foreground font-bold">
              <tr>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-4 py-3 text-center">Pieza</th>
                <th className="px-4 py-3">Superficie(s)</th>
                <th className="px-4 py-3">Hallazgo / Tratamiento</th>
                <th className="px-4 py-3">Profesional</th>
                <th className="px-4 py-3 text-center">Observación</th>
                {canEdit && <th className="px-5 py-3 text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-background">
              {filteredHistoryRecords.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="p-12 text-center text-muted-foreground font-medium">
                    Sin hallazgos clínicos registrados para este criterio.
                  </td>
                </tr>
              ) : (
                filteredHistoryRecords.map((record: any) => {
                  const cfg = (odontogramStatuses as any)?.[record.status]
                  const isHealthy = record.status === "DIENTE_SANO"
                  const isBad =
                    record.status.includes("MALA") ||
                    record.status.includes("MALO") ||
                    record.status.includes("CARIES") ||
                    record.status.includes("FRACTURA") ||
                    record.status.includes("INDICADA")

                  const displayLabel = cfg?.label || getStatusLabel(record.status)
                  const displayColor = cfg?.color || (isHealthy ? "text-emerald-600 border-emerald-500/20" : isBad ? "text-rose-600 border-rose-500/20" : "text-[#008bcd] border-[#008bcd]/20")
                  const displayBg = cfg?.bg || (isHealthy ? "bg-emerald-500/10" : isBad ? "bg-rose-500/10" : "bg-[#008bcd]/10")

                  return (
                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                      {/* Fecha y Hora */}
                      <td className="px-5 py-3.5 font-mono text-muted-foreground">
                        <p className="font-bold text-foreground">
                          {format(new Date(record.createdAt), "dd/MM/yyyy", { locale: es })}
                        </p>
                        <span className="text-[10px] text-muted-foreground/70">
                          {format(new Date(record.createdAt), "HH:mm")}
                        </span>
                      </td>

                      {/* Número de Pieza */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-black font-mono text-sm text-[#008bcd] bg-[#008bcd]/10 border border-[#008bcd]/20 px-2.5 py-1 rounded-lg">
                          {record.toothNumber}
                        </span>
                      </td>

                      {/* Caras Anatómicas Traducidas */}
                      <td className="px-4 py-3.5">
                        {renderSurfacesBadges(record.surfaces, record.toothNumber)}
                      </td>

                      {/* Estado Clínico (Inmune a fallos de importación) */}
                      <td className="px-4 py-3.5">
                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border", displayBg, displayColor)}>
                          <span className={cn("w-2 h-2 rounded-full", isHealthy ? "bg-emerald-500" : isBad ? "bg-rose-500" : "bg-[#008bcd]")} />
                          <span>{displayLabel}</span>
                        </div>
                      </td>

                      {/* Especialista Responsable */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-border/80">
                            <AvatarImage src={record.author?.image} />
                            <AvatarFallback className="bg-[#008bcd]/10 text-[#008bcd] font-black text-[9px]">
                              {record.author?.name?.charAt(0) || "D"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-foreground">
                            {record.author?.name || "Dr(a). Asignado"}
                          </span>
                        </div>
                      </td>

                      {/* Observaciones y Nota */}
                      <td className="px-4 py-3.5 text-center">
                        {record.notes ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRecordForDetail(record)
                              setEditedNote(record.notes || "")
                              setIsEditingNote(false)
                            }}
                            className="h-7 px-2.5 rounded-lg text-[11px] font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3 mr-1 text-amber-500" /> Ver Nota
                          </Button>
                        ) : canEdit ? (
                          <button
                            onClick={() => {
                              setSelectedRecordForDetail(record)
                              setEditedNote("")
                              setIsEditingNote(true)
                            }}
                            className="text-[11px] text-muted-foreground/50 hover:text-[#008bcd] font-medium transition-colors cursor-pointer"
                          >
                            + Añadir nota
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/40 italic">Sin notas</span>
                        )}
                      </td>

                      {/* Acción de Anular */}
                      {canEdit && (
                        <td className="px-5 py-3.5 text-right">
                          {canUserDeleteRecord(record) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive font-bold hover:bg-destructive/10 h-7 px-2.5 text-xs rounded-lg cursor-pointer ml-auto transition-colors"
                              onClick={() => setRecordToDelete(record)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Anular
                            </Button>
                          ) : (
                            <span className="text-[10px] font-medium text-muted-foreground/50 italic">
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

      {/* DIÁLOGOS Y MODALES DELEGADOS */}
      <OdontogramHistoryModals
        selectedRecordForDetail={selectedRecordForDetail}
        setSelectedRecordForDetail={setSelectedRecordForDetail}
        isEditingNote={isEditingNote}
        setIsEditingNote={setIsEditingNote}
        editedNote={editedNote}
        setEditedNote={setEditedNote}
        isSavingNote={isSavingNote}
        handleSaveObservation={handleSaveObservation}
        recordToDelete={recordToDelete}
        setRecordToDelete={setRecordToDelete}
        confirmDeleteRecord={confirmDeleteRecord}
        canEdit={canEdit}
        getStatusLabel={getStatusLabel}
      />
    </div>
  )
}

export default OdontogramHistory