"use client"
import { useQuery } from "@tanstack/react-query"
import { Loader2, RefreshCw } from "lucide-react"
import { useSession } from "next-auth/react"
import { AdminHeroBanner } from "@/components/admin/admin-hero-banner"
import { ClinicalKPIs } from "@/components/admin/dashboard/clinical-kpis"
import { IncomeEvolutionChart } from "@/components/admin/dashboard/evolution-chart"
import { InfrastructureHealth } from "@/components/admin/dashboard/infrastructure"
import { RecentAuditLogs } from "@/components/admin/dashboard/audit-logs"
import { Button } from "@/components/ui/button"
export default function AdminPage() {
 const {data:session,status}=useSession()
 const q=useQuery({queryKey:["admin-dashboard",session?.user?.id],enabled:session?.user?.role==="ADMIN"&&session.user.isActive===true,queryFn:async()=>{const r=await fetch("/api/admin/dashboard",{cache:"no-store"});if(!r.ok)throw new Error("No disponible");return r.json()},refetchInterval:60000,refetchIntervalInBackground:false,refetchOnWindowFocus:true,staleTime:15000,retry:false})
 if(status!=="loading" && (session?.user?.role!=="ADMIN" || session.user.isActive!==true)) return <p className="p-8 text-muted-foreground">Acceso restringido.</p>
 if(!q.data) return <div className="min-h-[50vh] grid place-content-center gap-3 text-center text-muted-foreground">{q.isError?<><p>No se pudo cargar el panel.</p><Button onClick={()=>void q.refetch()}>Reintentar</Button></>:<><Loader2 className="mx-auto animate-spin"/><p>Cargando suite ejecutiva…</p></>}</div>
 const data=q.data
 return <div className="w-full space-y-6"><div className="flex items-center justify-end gap-3 text-xs text-muted-foreground" role="status">{q.isError?"No se pudo actualizar; se muestran datos anteriores":`Actualizado: ${new Date(q.dataUpdatedAt).toLocaleTimeString()}`}<Button variant="outline" size="sm" disabled={q.isFetching} onClick={()=>void q.refetch()}><RefreshCw className={`w-4 h-4 mr-2 ${q.isFetching?"animate-spin":""}`}/>Actualizar</Button></div>
 <AdminHeroBanner userName={session?.user?.name||"Administrador"} todayIncome={data.stats.todayIncome} todayAppointments={data.stats.todayAppointments} activeAgreements={data.stats.activeAgreements}/>
 <ClinicalKPIs income={data.stats.income} incomeGrowth={data.stats.incomeGrowth} patients={data.stats.patients} patientsGrowth={data.stats.patientsGrowth} acceptanceRate={data.stats.acceptanceRate} totalAccountsReceivable={data.stats.totalAccountsReceivable} averageTicket={data.stats.averageTicket} payingPatientsCount={data.stats.payingPatientsCount}/>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><IncomeEvolutionChart chartPeriods={data.chartPeriods}/></div><div className="space-y-6"><InfrastructureHealth/><RecentAuditLogs logs={data.recentActivity}/></div></div></div>
}
