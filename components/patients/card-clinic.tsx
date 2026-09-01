"use client"

import React from "react"
import { LucideIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface DataCardProps {
  label: string
  value?: string | number | null | React.ReactNode
  isEditing?: boolean
  children?: React.ReactNode
  required?: boolean
  icon?: LucideIcon
  className?: string
  placeholder?: string
}

export const DataCard = ({
  label,
  value,
  isEditing,
  children,
  required,
  icon: Icon,
  className,
  placeholder = "No registrado",
}: DataCardProps) => {
  return (
    <div className={cn("space-y-1.5 flex flex-col group", className)}>
      <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 select-none">
        {Icon && (
          <Icon className="w-3.5 h-3.5 text-[#008bcd] shrink-0 stroke-[2.2]" />
        )}
        <span>{label}</span>
        {required && isEditing && (
          <span className="text-destructive font-bold ml-0.5">*</span>
        )}
      </Label>

      {isEditing ? (
        <div className="w-full animate-in fade-in duration-200">
          {children}
        </div>
      ) : (
        <div className="min-h-[38px] flex items-center text-sm font-semibold text-foreground px-3 py-1.5 rounded-xl bg-muted/20 border border-transparent group-hover:border-border/80 group-hover:bg-muted/40 transition-all duration-200">
          {value !== undefined && value !== null && value !== "" ? (
            <span className="break-words leading-relaxed">{value}</span>
          ) : (
            <span className="text-muted-foreground/50 font-normal italic text-xs">
              {placeholder}
            </span>
          )}
        </div>
      )}
    </div>
  )
}