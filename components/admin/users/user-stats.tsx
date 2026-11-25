"use client"
import { Users, Shield, Clock, User } from "lucide-react"
import { getPresence } from "@/lib/user-presence"
export function UserStats({users=[],now=Date.now()}:{users:any[];now?:number}) {
 const cards=[{title:"Usuarios registrados",value:users.length,icon:Users,sub:"Directorio del equipo"},{title:"Acceso habilitado",value:users.filter(u=>u.isActive).length,icon:Shield,sub:"Permisos vigentes"},{title:"Actividad reciente",value:users.filter(u=>getPresence(u,now).kind==="recent").length,icon:Clock,sub:"Señal en los últimos 2 min"},{title:"Sin acceso registrado",value:users.filter(u=>!u.lastLogin).length,icon:User,sub:"Sin fecha de último ingreso"}]
 return <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(c=><div key={c.title} className="bg-card border rounded-2xl p-5 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-muted-foreground">{c.title}</p><p className="text-3xl font-black tabular-nums">{c.value}</p><p className="text-xs text-muted-foreground mt-1">{c.sub}</p></div><c.icon className="w-6 h-6 text-sky-600 dark:text-sky-400"/></div>)}</div>
}
