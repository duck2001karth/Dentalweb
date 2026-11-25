"use client"
import { Sparkles, Calendar, Banknote, Handshake, Users, ListTree, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
interface AdminHeroBannerProps {userName?:string;todayIncome:number;todayAppointments:number;activeAgreements:number}
export function AdminHeroBanner({userName="Administrador",todayIncome=0,todayAppointments=0,activeAgreements=0}:AdminHeroBannerProps){
 const money=todayIncome.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})
 return <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white p-6 lg:p-8 border border-slate-800 shadow-sm">
 <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
 <div className="space-y-2 min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-sky-300"><Sparkles size={16}/> Suite ejecutiva</span><span className="flex items-center gap-1 text-xs text-slate-300 capitalize"><Calendar size={15}/>{format(new Date(),"EEEE, d 'de' MMMM",{locale:es})}</span></div><h2 className="text-2xl lg:text-3xl font-black tracking-tight">Bienvenido, <span className="text-sky-400">{userName}</span></h2><p className="text-sm text-slate-300">Hoy la clínica tiene <strong className="text-white">{todayAppointments} citas</strong> en agenda y una recaudación de <strong className="text-emerald-300">${money}</strong>.</p></div>
 <div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3"><Banknote className="size-6 text-emerald-300"/><div><p className="text-xs text-slate-300">Caja de hoy</p><p className="font-black text-lg">${money}</p></div></div><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3"><Handshake className="size-6 text-sky-300"/><div><p className="text-xs text-slate-300">Convenios</p><p className="font-black text-lg">{activeAgreements} activos</p></div></div>
 <nav aria-label="Accesos ejecutivos" className="flex flex-wrap gap-2">{[{href:"/pacientes",label:"Pacientes",Icon:Users},{href:"/admin/catalogo",label:"Catálogo",Icon:ListTree},{href:"/admin/convenios",label:"Convenios",Icon:Handshake}].map(({href,label,Icon})=><Link key={href} href={href} className="inline-flex h-12 items-center gap-2 rounded-xl px-4 font-bold text-sm bg-sky-400 text-slate-950 hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-white"><Icon className="size-5 shrink-0"/>{label}{label==="Convenios"&&<ChevronRight className="size-4"/>}</Link>)}</nav></div></div></section>
}
