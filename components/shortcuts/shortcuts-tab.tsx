"use client"
import { useState } from "react"
import { Keyboard, Search } from "lucide-react"
import { useSession } from "next-auth/react"
import { forRole } from "@/config/keyboard-shortcuts"
export function ShortcutsTab({accentColor}:{accentColor?:string}) {
 const {data,status}=useSession();const [query,setQuery]=useState("")
 const role=status==="authenticated"&&data?.user?.isActive===true?data.user.role:null
 const list=forRole(role).filter(s=>`${s.label} ${s.key} ${s.group}`.toLowerCase().includes(query.toLowerCase().trim()))
 const roleLabel=role==="ADMIN"?"Administrador":role==="DOCTOR"?"Doctor":role==="RECEPTIONIST"?"Recepción y caja":"Sin sesión activa"
 return <section className="space-y-5 max-w-3xl"><div className="flex items-center gap-3"><Keyboard className="size-6 shrink-0" style={{color:accentColor}}/><div><h3 className="text-lg font-bold">Atajos de teclado</h3><p className="text-sm text-muted-foreground">Disponibles para tu rol: {roleLabel}</p></div></div><label className="flex items-center gap-2 rounded-xl border bg-background px-3"><Search className="size-4 text-muted-foreground"/><input aria-label="Filtrar atajos" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar acción o combinación…" className="h-10 w-full bg-transparent text-sm outline-none"/></label>{Array.from(new Set(list.map(s=>s.group))).map(group=><div key={group} className="space-y-2"><h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{group}</h4><div className="rounded-xl border divide-y bg-card">{list.filter(s=>s.group===group).map(s=><div key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"><span>{s.label}{s.tab&&<small className="block text-muted-foreground">Con un paciente abierto</small>}</span><kbd className="rounded-md border bg-muted px-2 py-1 font-mono text-xs">{s.key}</kbd></div>)}</div></div>)}{!list.length&&<p className="text-sm text-muted-foreground">No hay atajos coincidentes.</p>}<p className="text-xs leading-relaxed text-muted-foreground">En macOS puedes usar Cmd en lugar de Ctrl para el buscador. Esc cierra los diálogos compatibles. Los atajos se suspenden al escribir o dentro de un diálogo. Algunas combinaciones pueden estar reservadas por el navegador o sistema operativo.</p></section>
}
