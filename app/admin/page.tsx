"use client"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { AdminHeroBanner } from "@/components/admin/admin-hero-banner"
import { ClinicalKPIs } from "@/components/admin/dashboard/clinical-kpis"
import { IncomeEvolutionChart } from "@/components/admin/dashboard/evolution-chart"
import { InfrastructureHealth } from "@/components/admin/dashboard/infrastructure"
import { RecentAuditLogs } from "@/components/admin/dashboard/audit-logs"
import { Button } from "@/components/ui/button"
export default function AdminPage() {
 const {data:session,status}=useSession()
 const allowed=session?.user?.role==="ADMIN" && session.user.isActive===true
 const q=useQuery({queryKey:["admin-dashboard",session?.user?.id],enabled:allowed,queryFn:async()=>{const r=await fetch("/api/admin/dashboard",{cache:"no-store"});if(!r.ok)throw new Error("No disponible");return r.json()},refetchInterval:60000,refetchIntervalInBackground:false,refetchOnWindowFocus:true,staleTime:15000,retry:false})
 if(status!=="loading" && !allowed) return <p className="p-8 text-muted-foreground">Acceso restringido.</p>
 if(!q.data) return <div className="min-h-[50vh] grid place-content-center gap-3 text-center text-muted-foreground">{q.isError?<><p>No se pudo cargar el panel.</p><Button onClick={()=>void q.refetch()}>Reintentar</Button></>:<><Loader2 className="mx-auto animate-spin"/><p>Cargando suite ejecutiva…</p></>}</div>
 const data=q.data
 return <div className="w-full space-y-6">
 {q.isError && <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">No se pudo sincronizar. Se muestran los últimos datos disponibles.</p>}
 <AdminHeroBanner userName={session?.user?.name||"Administrador"} todayIncome={data.stats.todayIncome} todayAppointments={data.stats.todayAppointments} activeAgreements={data.stats.activeAgreements}/>
 <ClinicalKPIs income={data.stats.income} incomeGrowth={data.stats.incomeGrowth} patients={data.stats.patients} patientsGrowth={data.stats.patientsGrowth} acceptanceRate={data.stats.acceptanceRate} totalAccountsReceivable={data.stats.totalAccountsReceivable} averageTicket={data.stats.averageTicket} payingPatientsCount={data.stats.payingPatientsCount}/>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><IncomeEvolutionChart chartPeriods={data.chartPeriods}/></div><div className="space-y-6"><InfrastructureHealth/><RecentAuditLogs logs={data.recentActivity}/></div></div></div>
}
