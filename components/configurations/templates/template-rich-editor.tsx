"use client"

import React, { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TemplateRichEditorProps {
  content: string
  onChange: (value: string) => void
  insertTagTrigger?: string | null // Recibe la señal del padre para insertar al hacer clic
}

function formatTemplateVisual(text: string) {
  const parts = text.split(/(\{\{[a-zA-Z0-9_]+\}\})/g)
  return parts.map((part, index) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      const isPatient = part.includes("paciente")
      return (
        <span
          key={index}
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-bold select-all",
            isPatient
              ? "bg-[#008bcd]/15 text-[#008bcd] dark:text-[#38bdf8]"
              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          )}
        >
          {part}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export function TemplateRichEditor({ content, onChange, insertTagTrigger }: TemplateRichEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit")

  // Escucha cuando el padre envía un tag (por hacer clic en el botón lateral)
  useEffect(() => {
    if (insertTagTrigger) {
      insertTagAtCursor(insertTagTrigger)
    }
  }, [insertTagTrigger])

  const insertTagAtCursor = (tag: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      onChange(content + tag)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + tag + content.substring(end)
    onChange(newContent)

    // Forzamos volver a la pestaña de edición si estaba en vista previa
    if(editorTab !== "edit") setEditorTab("edit")

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + tag.length, start + tag.length)
    }, 10)
  }

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const tag = e.dataTransfer.getData("text/plain")
    if (!tag) return

    const textarea = textareaRef.current
    if (!textarea) return

    const pos = textarea.selectionStart || content.length
    const newContent = content.substring(0, pos) + ` ${tag} ` + content.substring(pos)
    onChange(newContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(pos + tag.length + 2, pos + tag.length + 2)
    }, 10)
  }

  return (
    <div className="space-y-2 flex-1 flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Cuerpo del Documento <span className="text-rose-500">*</span>
        </Label>

        <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setEditorTab("edit")}
            className={cn(
              "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
              editorTab === "edit"
                ? "bg-background text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Edición
          </button>
          <button
            type="button"
            onClick={() => setEditorTab("preview")}
            className={cn(
              "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
              editorTab === "preview"
                ? "bg-background text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Vista Previa
          </button>
        </div>
      </div>

      {editorTab === "edit" ? (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = "copy"
          }}
          onDrop={handleDrop}
          placeholder="Redacte aquí el texto oficial o arrastre los campos desde la barra lateral..."
          className="w-full h-full flex-1 text-sm leading-relaxed font-sans bg-background border-border rounded-xl p-4 focus-visible:ring-[#008bcd]/50 resize-none shadow-inner"
        />
      ) : (
        <div
          onClick={() => setEditorTab("edit")}
          className="w-full h-full flex-1 text-sm leading-relaxed font-sans bg-background border border-border rounded-xl p-4 whitespace-pre-wrap overflow-y-auto cursor-text text-foreground shadow-inner"
          title="Haz clic para volver a editar"
        >
          {formatTemplateVisual(content)}
        </div>
      )}
    </div>
  )
}