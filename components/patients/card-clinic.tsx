"use client"

import { Label } from "@/components/ui/label"

export const DataCard = ({ label, value, isEditing, children, required, icon: Icon }: any) => (
  <div className="space-y-1.5 flex flex-col group">
    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-[#008bcd] dark:text-blue-400" />}
      {label} {required && isEditing && <span className="text-red-500">*</span>}
    </Label>
    {isEditing ? (
      children
    ) : (
      <div className="text-[15px] font-semibold text-foreground py-1.5 border-b border-transparent group-hover:border-border transition-colors">
        {value || <span className="text-muted-foreground/60 font-medium italic text-[13px]">No registrado</span>}
      </div>
    )}
  </div>
)