"use client"

import React, { useState, useMemo } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConsentsTableProps {
  documents: any[]
  onSelectDoc: (doc: any) => void
  pageSize?: number
}

export function ConsentsTable({
  documents,
  onSelectDoc,
  pageSize = 6,
}: ConsentsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(documents.length / pageSize) || 1
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedDocs = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return documents.slice(start, start + pageSize)
  }, [documents, safeCurrentPage, pageSize])

  const SignatureBadge = ({ isSigned, label }: { isSigned: boolean; label: string }) => {
    if (isSigned) {
      return (
        <div className="flex items-center justify-between w-[95px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold">
          <span className="text-[10px] uppercase tracking-wide">{label}</span>
          <CheckCircle2 size={12} className="shrink-0" />
        </div>
      )
    }
    return (
      <div className="flex items-center justify-between w-[95px] bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md font-bold">
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
        <AlertCircle size={12} className="shrink-0" />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden print:hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider w-14 text-center">N°</th>
              <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider">Consentimiento Legal</th>
              <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider">Especialista</th>
              <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider">Emisión</th>
              <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-center">Firmas Registradas</th>
              <th className="px-4 py-3 font-bold text-[11px] uppercase tracking-wider text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="w-10 h-10 opacity-20 mb-2" />
                    <p className="font-bold text-sm text-foreground">Sin consentimientos registrados</p>
                    <p className="text-xs font-medium mt-0.5">No existen documentos firmados o pendientes para este paciente.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDocs.map((doc, idx) => {
                const overallIndex = documents.length - ((safeCurrentPage - 1) * pageSize + idx)
                return (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-muted-foreground/80 text-center">
                      {overallIndex.toString().padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground text-xs line-clamp-1">{doc.title}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mt-0.5">
                        REF: {doc.id?.substring(0, 8).toUpperCase() || "S/R"}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {doc.specialistName || doc.author?.name || "Especialista Asignado"}
                    </td>
                    <td className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      {format(new Date(doc.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <SignatureBadge isSigned={Boolean(doc.patientSignature)} label="Paciente" />
                        <SignatureBadge isSigned={Boolean(doc.doctorSignature)} label="Doctor" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectDoc(doc)}
                        style={{
                          "--doctor-accent": "var(--doctor-accent, #008bcd)",
                        } as React.CSSProperties}
                        className="h-8 px-3 rounded-xl font-bold text-xs border border-border/80 bg-card text-foreground shadow-2xs transition-all cursor-pointer hover:bg-[var(--doctor-accent)]/10 hover:border-[var(--doctor-accent)] hover:text-[var(--doctor-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent)]"
                      >
                        <Eye size={13} className="mr-1.5 shrink-0 text-[var(--doctor-accent)] transition-colors" />
                        <span>Ver Documento</span>
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* BARRA DE PAGINACIÓN ADAPTATIVA */}
      {documents.length > 0 && (
        <div className="px-4 py-3 bg-muted/20 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">
            Mostrando <b className="font-bold text-foreground">{Math.min(documents.length, (safeCurrentPage - 1) * pageSize + 1)}</b> a{" "}
            <b className="font-bold text-foreground">{Math.min(documents.length, safeCurrentPage * pageSize)}</b> de{" "}
            <b className="font-bold text-foreground">{documents.length}</b> consentimientos
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="h-8 w-8 rounded-xl border border-border/80 bg-card text-foreground shadow-2xs transition-all cursor-pointer hover:bg-muted hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </Button>
            
            <span className="text-xs font-bold px-1 text-muted-foreground">
              Página <span className="text-foreground">{safeCurrentPage}</span> de <span className="text-foreground">{totalPages}</span>
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="h-8 w-8 rounded-xl border border-border/80 bg-card text-foreground shadow-2xs transition-all cursor-pointer hover:bg-muted hover:border-[var(--doctor-accent,#008bcd)] hover:text-[var(--doctor-accent,#008bcd)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--doctor-accent,#008bcd)]"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}