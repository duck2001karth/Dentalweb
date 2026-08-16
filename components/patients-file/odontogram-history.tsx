"use client"
import React, { useState } from "react"
import { format } from "date-fns"
import { Search, Calendar, FilterX, MessageSquare, AlertTriangle, CheckCircle, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { odontogramStatuses } from "@/constants/status"

export function OdontogramHistory({ records, view, canEdit, currentUser, confirmDeleteRecord, getStatusLabel }: any) {
  const [historySearch, setHistorySearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<any>(null)
  const [recordToDelete, setRecordToDelete] = useState<any>(null)

  const canUserDeleteRecord = (record: any) => {
    if (!canEdit) return false;
    if (currentUser?.role === "ADMIN") return true;
    return record.authorId === currentUser?.id || record.author?.id === currentUser?.id;
  }

  const filteredHistoryRecords = records.filter((r: any) => {
    const query = historySearch.toLowerCase().trim()
    const matchesSearch = !query || r.toothNumber?.toString().includes(query) || getStatusLabel(r.status).toLowerCase().includes(query) || r.author?.name?.toLowerCase().includes(query)
    const recordDate = new Date(r.createdAt)
    const matchesFrom = !dateFrom || recordDate >= new Date(dateFrom)
    const matchesTo = !dateTo || recordDate <= new Date(dateTo + "T23:59:59")
    return matchesSearch && matchesFrom && matchesTo
  })

  return (
    <div className="mt-8 space-y-4">
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* HEADER Y FILTROS */}
        <div className="p-5 border-b border-border bg-muted/30 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
          <div>
            <h3 className="font-black text-foreground text-lg tracking-tight">DETALLE DE HALLAZGOS CLÍNICOS</h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Historial acumulado de registros e impresiones diagnósticas</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Buscar pieza, hallazgo..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="pl-9 h-10 text-xs bg-background border-border rounded-xl focus-visible:ring-[#008bcd]" />
            </div>
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl p-1">
              <Calendar className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent text-xs font-semibold text-foreground outline-none p-1"/>
              <span className="text-muted-foreground font-bold">-</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent text-xs font-semibold text-foreground outline-none p-1"/>
            </div>
            {(historySearch || dateFrom || dateTo) && (
              <Button variant="ghost" size="icon" onClick={() => { setHistorySearch(""); setDateFrom(""); setDateTo(""); }} className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl">
                <FilterX className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* TABLA DE AUDITORÍA */}
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
                {canEdit && <th className="p-4 text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredHistoryRecords.length === 0 ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="p-12 text-center text-muted-foreground font-medium">Sin hallazgos clínicos.</td></tr>
              ) : (
                filteredHistoryRecords.map((record: any) => (
                  <tr key={record.id} className="hover:bg-accent/40 transition-colors">
                    <td className="p-4 font-semibold text-foreground">
                      {format(new Date(record.createdAt), "dd/MM/yyyy")}
                      <span className="block text-[11px] text-muted-foreground font-normal">{format(new Date(record.createdAt), "HH:mm")}</span>
                    </td>
                    <td className="p-4 font-black text-center text-[#008bcd] text-lg">{record.toothNumber}</td>
                    <td className="p-4 font-medium">
                      {record.surfaces.includes("TODA_LA_PIEZA") ? <span className="bg-muted px-2.5 py-1 rounded-md text-xs font-semibold border border-border">Toda la pieza</span> : record.surfaces.join(", ")}
                    </td>
                    <td className="p-4">
                      {(() => {
                        const config = odontogramStatuses[record.status];
                        if (record.status === "DIENTE_SANO" || !config) {
                          return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><CheckCircle className="w-3.5 h-3.5" /> Diente Sano</div>;
                        }
                        return <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}><config.icon /> <span>{config.label}</span></div>;
                      })()}
                    </td>
                    <td className="p-4 flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 border border-border"><AvatarImage src={record.author?.image} /><AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">D</AvatarFallback></Avatar>
                      <span className="text-xs font-bold text-foreground">{record.author?.name || "Dr(a). Asignado"}</span>
                    </td>
                    <td className="p-4 text-center">
                      {record.notes ? (
                        <Button variant="outline" size="sm" onClick={() => setSelectedRecordForDetail(record)} className="h-8 px-3 rounded-lg text-xs font-bold border-amber-500/30 text-amber-600 bg-amber-500/10 hover:bg-amber-500/20">
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Ver Nota
                        </Button>
                      ) : <span className="text-xs text-muted-foreground italic">Sin notas</span>}
                    </td>
                    {canEdit && (
                      <td className="p-4 text-right">
                        {canUserDeleteRecord(record) ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive font-bold hover:bg-destructive/10 h-8 px-3 flex items-center gap-1.5 ml-auto rounded-lg transition-colors" 
                            onClick={() => setRecordToDelete(record)}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Anular</span>
                          </Button>
                        ) : (
                          <span className="text-[11px] font-semibold text-muted-foreground/60 italic">No permitido</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE DE COMENTARIO */}
      <Dialog open={!!selectedRecordForDetail} onOpenChange={(open) => !open && setSelectedRecordForDetail(null)}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border rounded-2xl shadow-xl">
          <DialogHeader><DialogTitle className="text-lg font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#008bcd]" /> Observación Clínica</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-background border border-border rounded-xl text-sm font-medium whitespace-pre-wrap">{selectedRecordForDetail?.notes}</div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent className="bg-card border-border rounded-[24px] sm:max-w-[450px] p-0 overflow-hidden shadow-2xl">
          <div className="p-6">
            <AlertDialogHeader className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center border border-red-500/20 mb-2">
                <Trash2 className="w-8 h-8" />
              </div>
              <AlertDialogTitle className="text-xl font-black text-foreground">
                ¿Anular hallazgo de la pieza {recordToDelete?.toothNumber}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                Esta acción eliminará la simbología <b className="text-foreground">"{getStatusLabel(recordToDelete?.status || '')}"</b> del odontograma del paciente. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          
          <AlertDialogFooter className="w-full flex sm:justify-center gap-3 p-6 pt-0 bg-card">
            <AlertDialogCancel className="rounded-xl h-11 px-6 border-border hover:bg-accent font-bold text-foreground mt-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { confirmDeleteRecord(recordToDelete); setRecordToDelete(null); }} 
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 px-6 shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Trash2 className="w-4 h-4" />
              Sí, Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}