"use client"

import React from "react"
import { Clock, ChevronRight, ShieldCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface AuditLogItem {
  id: string | number
  action: string
  user: string
  details: string
  time: string
}

interface RecentAuditLogsProps {
  logs?: AuditLogItem[]
}

export function RecentAuditLogs({ logs = [] }: RecentAuditLogsProps) {
  const router = useRouter()

  return (
    <div className="bg-card rounded-[24px] border border-border shadow-xs p-6 flex flex-col h-[320px]">
      
      <div className="mb-3 flex justify-between items-center border-b border-border/60 pb-3">
        <h3 className="font-black text-sm text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#008bcd]" /> Auditoría Reciente
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/auditoria")}
          className="h-7 px-2 text-[11px] font-bold text-[#008bcd] hover:bg-[#008bcd]/10 rounded-lg"
        >
          Ver todo <ChevronRight className="w-3 h-3 ml-0.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-6">
            <ShieldCheck className="w-8 h-8 mb-2 opacity-30 text-[#008bcd]" />
            <p className="text-xs font-bold text-foreground">Sin incidencias registradas</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">El sistema mantiene trazabilidad activa.</p>
          </div>
        ) : (
          logs.map((activity, index) => (
            <div key={activity.id} className="relative pl-5 text-xs">
              {index !== logs.length - 1 && (
                <span className="absolute top-4 left-[7px] w-0.5 h-full bg-border" />
              )}
              <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-card bg-[#008bcd] shadow-xs" />
              
              <div className="flex flex-col space-y-0.5">
                <span className="text-[10px] font-black text-[#008bcd] uppercase tracking-wider">
                  {activity.action}
                </span>
                <p className="font-bold text-foreground leading-snug">
                  {activity.details}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium pt-0.5">
                  <span className="font-bold text-foreground/80">{activity.user}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: es })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}