"use client"
import { Clock, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
interface AuditLogItem {id:string|number;action:string;user:string;details:string;time:string}
export function RecentAuditLogs({logs=[]}:{logs?:AuditLogItem[]}) {
 return <section className="bg-card rounded-3xl border p-6 space-y-4"><header className="flex justify-between items-center"><h3 className="flex items-center gap-2 font-bold"><Clock size={16}/>Auditoría reciente</h3><Link href="/admin/auditoria" className="flex gap-1 items-center text-xs font-bold text-sky-600 dark:text-sky-400">Ver todo<ChevronRight size={14}/></Link></header><p className="text-xs text-muted-foreground">Actualización con el panel cada minuto</p><div className="max-h-80 overflow-auto divide-y divide-border">{!logs.length?<p className="py-8 text-sm text-muted-foreground text-center">No hay movimientos recientes.</p>:logs.map(log=><article key={log.id} className="py-3 flex gap-3"><span className="mt-1.5 w-2 h-2 rounded-full bg-sky-500 shrink-0"/><div className="min-w-0 space-y-1"><p className="text-xs font-bold text-sky-700 dark:text-sky-400">{log.action.replaceAll("_"," ")}</p><p className="text-sm break-words">{log.details}</p><p className="text-xs text-muted-foreground">{log.user} · {Number.isFinite(Date.parse(log.time))?formatDistanceToNow(new Date(log.time),{locale:es,addSuffix:true}):"Fecha desconocida"}</p></div></article>)}</div></section>
}
