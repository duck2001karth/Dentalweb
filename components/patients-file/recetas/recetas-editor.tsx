"use client"

import React, { useRef, useEffect } from "react"
import { Bold, Italic, List, Utensils, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PrescriptionEditorProps {
  editingId: string | null
  medications: string
  setMedications: React.Dispatch<React.SetStateAction<string>>
  indications: string
  setIndications: React.Dispatch<React.SetStateAction<string>>
  observations: string
  setObservations: React.Dispatch<React.SetStateAction<string>>
  setIsDirty: (v: boolean) => void
}

const RichEditor = ({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || ""
    }
  }, [value])

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    let html = e.currentTarget.innerHTML
    if (html === "<br>" || html === "<div><br></div>" || html.trim() === "") {
      html = ""
      if (editorRef.current) editorRef.current.innerHTML = ""
    }
    onChange(html)
  }

  const isEmpty = !value || value === "<br>" || value === "<div><br></div>" || value.trim() === ""

  return (
    <div className="relative w-full">
      {isEmpty && (
        <div className="absolute top-2.5 left-3 text-xs text-muted-foreground pointer-events-none select-none">
          {placeholder}
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full min-h-[90px] outline-none text-xs text-foreground p-2.5 focus:bg-muted/10 rounded-lg cursor-text border border-border bg-background leading-relaxed"
      />
    </div>
  )
}

export function PrescriptionEditor({
  editingId,
  medications,
  setMedications,
  indications,
  setIndications,
  observations,
  setObservations,
  setIsDirty,
}: PrescriptionEditorProps) {
  const applyFormat = (e: React.MouseEvent, cmd: string) => {
    e.preventDefault()
    document.execCommand(cmd, false, "")
    setIsDirty(true)
  }

  const addQuickObservation = (text: string) => {
    setObservations((prev: string) => (prev ? `${prev}<br>- ${text}` : `- ${text}`))
    setIsDirty(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors",
          editingId ? "border-[#008bcd]/50 ring-2 ring-[#008bcd]/10" : "border-border"
        )}
      >
        {/* BARRA DE HERRAMIENTAS */}
        <div className="bg-muted/50 border-b border-border p-2 flex gap-1 items-center justify-between">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onMouseDown={(e) => applyFormat(e, "bold")}
              className="w-7 h-7 rounded-sm text-muted-foreground hover:text-foreground"
            >
              <Bold size={13} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onMouseDown={(e) => applyFormat(e, "italic")}
              className="w-7 h-7 rounded-sm text-muted-foreground hover:text-foreground"
            >
              <Italic size={13} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onMouseDown={(e) => applyFormat(e, "insertUnorderedList")}
              className="w-7 h-7 rounded-sm text-muted-foreground hover:text-foreground"
            >
              <List size={13} />
            </Button>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1 tracking-wider">
            Editor de Receta
          </span>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* 1. MEDICAMENTOS */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">
              1. Medicamentos (R.P.)
            </label>
            <RichEditor
              value={medications}
              onChange={(v) => {
                setMedications(v)
                setIsDirty(true)
              }}
              placeholder="Ej: Amoxicilina 500mg #21"
            />
          </div>

          {/* 2. INDICACIONES */}
          <div className="border-t border-border pt-3">
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">
              2. Indicaciones
            </label>
            <RichEditor
              value={indications}
              onChange={(v) => {
                setIndications(v)
                setIsDirty(true)
              }}
              placeholder="Ej: Tomar 1 cápsula cada 8 horas por 7 días"
            />
          </div>

          {/* 3. OBSERVACIONES / CUIDADOS */}
          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                3. Observaciones / Cuidados
              </label>
            </div>

            {/* ATAJOS RÁPIDOS */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              <button
                type="button"
                onClick={() => addQuickObservation("Consumir con alimentos")}
                className="text-[11px] font-medium bg-muted/40 hover:bg-muted text-foreground px-2.5 py-1 rounded-md border border-border/60 transition-all flex items-center gap-1.5"
              >
                <Utensils size={12} className="text-[#008bcd]" /> Con alimentos
              </button>

              <button
                type="button"
                onClick={() => addQuickObservation("Tomar 30 min después de cada alimento")}
                className="text-[11px] font-medium bg-muted/40 hover:bg-muted text-foreground px-2.5 py-1 rounded-md border border-border/60 transition-all flex items-center gap-1.5"
              >
                <Clock size={12} className="text-[#008bcd]" /> 30 min post-comida
              </button>

              <button
                type="button"
                onClick={() => addQuickObservation("No ingerir bebidas alcohólicas ni lácteos")}
                className="text-[11px] font-medium bg-muted/40 hover:bg-muted text-foreground px-2.5 py-1 rounded-md border border-border/60 transition-all flex items-center gap-1.5"
              >
                <AlertCircle size={12} className="text-muted-foreground" /> Sin alcohol/lácteos
              </button>
            </div>

            <RichEditor
              value={observations}
              onChange={(v) => {
                setObservations(v)
                setIsDirty(true)
              }}
              placeholder="Ej: Consumir con alimentos para evitar irritación gástrica"
            />
          </div>
        </div>
      </div>
    </div>
  )
}