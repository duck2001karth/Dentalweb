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
        <div className="flex items-center justify-between w-[95px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">
          <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
          <CheckCircle2 size={12} className="shrink-0" />
        </div>
      )
    }
    return (
      <div className="flex items-center justify-between w-[95px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md">
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
        <AlertCircle size={12} className="shrink-0" />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden print:hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/30 border-b border-border/70 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider w-14 text-center">N°</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Consentimiento Legal</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Especialista</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Emisión</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-center">Firmas Registradas</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="w-10 h-10 opacity-20 mb-2" />
                    <p className="font-semibold text-sm text-foreground">Sin consentimientos registrados</p>
                    <p className="text-xs">No existen documentos firmados o pendientes para este paciente.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDocs.map((doc, idx) => {
                const overallIndex = documents.length - ((safeCurrentPage - 1) * pageSize + idx)
                return (
                  <tr key={doc.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-semibold text-muted-foreground/70 text-center">
                      {overallIndex.toString().padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground text-xs line-clamp-1">{doc.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                        REF: {doc.id?.substring(0, 8).toUpperCase() || "S/R"}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {doc.specialistName || doc.author?.name || "Patricio C"}
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
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectDoc(doc)}
                        className="bg-background text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 border-border/80 font-semibold rounded-xl shadow-2xs h-8 text-xs cursor-pointer"
                      >
                        <Eye size={13} className="mr-1.5" /> Ver Documento
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* BARRA DE PAGINACIÓN */}
      {documents.length > 0 && (
        <div className="px-4 py-2.5 bg-muted/20 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Mostrando <b>{Math.min(documents.length, (safeCurrentPage - 1) * pageSize + 1)}</b> a{" "}
            <b>{Math.min(documents.length, safeCurrentPage * pageSize)}</b> de <b>{documents.length}</b> consentimientos
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="h-7 w-7 p-0 rounded-lg cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-semibold px-2">
              Página {safeCurrentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="h-7 w-7 p-0 rounded-lg cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}