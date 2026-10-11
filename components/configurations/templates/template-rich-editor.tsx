"use client"

import React, { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Eye, Edit3, Type } from "lucide-react"
import { cn } from "@/lib/utils"

interface TemplateRichEditorProps {
  content: string
  onChange: (value: string) => void
  insertTagTrigger?: string | null
}

// OWASP: Límite estricto de caracteres para evitar ataques de agotamiento de memoria (DoS)
const MAX_TEMPLATE_LENGTH = 15000 

function formatTemplateVisual(text: string) {
  if (!text) return <span className="text-muted-foreground italic">El documento está vacío...</span>
  
  // OWASP: Sanitización visual básica (React ya escapa HTML, pero aseguramos el renderizado)
  const parts = text.split(/(\{\{[a-zA-Z0-9_]+\}\})/g)
  
  return parts.map((part, index) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      const isPatient = part.includes("paciente")
      return (
        <span
          key={index}
          className={cn(
            "inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md text-[11px] font-mono font-black shadow-2xs select-all transition-colors",
            isPatient
              ? "bg-[#008bcd]/15 text-[#008bcd] border border-[#008bcd]/20"
              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          )}
        >
          {part}
        </span>
      )
    }
    return <span key={index} className="leading-relaxed">{part}</span>
  })
}

export function TemplateRichEditor({ content, onChange, insertTagTrigger }: TemplateRichEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit")
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  useEffect(() => {
    if (insertTagTrigger) insertTagAtCursor(insertTagTrigger)
  }, [insertTagTrigger])

  const insertTagAtCursor = (tag: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      if (content.length + tag.length <= MAX_TEMPLATE_LENGTH) {
        onChange(content + tag)
      }
      return
    }
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + tag + content.substring(end)
    
    if (newContent.length <= MAX_TEMPLATE_LENGTH) {
      onChange(newContent)
      if (editorTab !== "edit") setEditorTab("edit")
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + tag.length, start + tag.length)
      }, 10)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const tag = e.dataTransfer.getData("text/plain")
    if (!tag) return
    
    const textarea = textareaRef.current
    if (!textarea) return
    
    const pos = textarea.selectionStart || content.length
    const newContent = content.substring(0, pos) + ` ${tag} ` + content.substring(pos)
    
    if (newContent.length <= MAX_TEMPLATE_LENGTH) {
      onChange(newContent)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(pos + tag.length + 2, pos + tag.length + 2)
      }, 10)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-[400px] bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
      {/* HEADER DEL EDITOR TIPO MAC OS */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/60">
        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-[#008bcd]" /> Cuerpo del Documento <span className="text-rose-500">*</span>
        </Label>
        
        <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setEditorTab("edit")}
            className={cn(
              "px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5",
              editorTab === "edit"
                ? "bg-background text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Edit3 className="w-3 h-3" /> Edición
          </button>
          <button
            type="button"
            onClick={() => setEditorTab("preview")}
            className={cn(
              "px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5",
              editorTab === "preview"
                ? "bg-background text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="w-3 h-3" /> Vista Previa
          </button>
        </div>
      </div>

      {/* ÁREA DE TEXTO */}
      <div className="relative flex-1 bg-background">
        {editorTab === "edit" ? (
          <Textarea
            ref={textareaRef}
            value={content}
            maxLength={MAX_TEMPLATE_LENGTH}
            onChange={(e) => onChange(e.target.value)}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "copy"
              setIsDraggingOver(true)
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            placeholder="Redacte aquí el texto oficial o arrastre los campos desde la barra lateral..."
            className={cn(
              "w-full h-full border-0 focus-visible:ring-0 resize-none p-5 text-sm font-medium leading-relaxed transition-colors",
              isDraggingOver ? "bg-[#008bcd]/5" : "bg-transparent"
            )}
          />
        ) : (
          <div
            onClick={() => setEditorTab("edit")}
            className="w-full h-full p-5 text-sm font-medium text-foreground whitespace-pre-wrap overflow-y-auto cursor-text"
            title="Haz clic para volver a editar"
          >
            {formatTemplateVisual(content)}
          </div>
        )}
      </div>
      
      {/* FOOTER CON CONTADOR DE CARACTERES (Prevención DoS) */}
      <div className="px-4 py-2 border-t border-border/60 bg-muted/10 flex justify-between items-center text-[10px] font-bold">
        <span className={cn(
          content.length >= MAX_TEMPLATE_LENGTH - 500 ? "text-amber-500" : "text-muted-foreground"
        )}>
          {content.length} / {MAX_TEMPLATE_LENGTH} caracteres
        </span>
        {isDraggingOver && <span className="text-[#008bcd] animate-pulse">Suelte la variable aquí...</span>}
      </div>
    </div>
  )
}