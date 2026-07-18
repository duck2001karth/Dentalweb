"use client"

import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Activity, ListTree, Loader2, ArrowUpRight, ArrowDownRight, Clock, Plus, Download, HardDrive, Database, Wifi } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface DashboardData {
  stats: {
    income: number;
    incomeGrowth: number;
    patients: number;
    patientsGrowth: number;
    activePlans: number;
    catalogItems: number;
  };
  revenueData: { name: string; total: number }[];
  recentActivity: { id: string | number; action: string; user: string; details: string; time: string }[];
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const router = useRouter();
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) setData(await res.json());
      } catch (error) { console.error(error); } 
      finally { setIsLoading(false); }
    };
    fetchDashboardData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-primary">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-muted-foreground">Cargando métricas empresariales...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Vista General</h1>
          <p className="text-muted-foreground mt-1">Métricas de rendimiento y atajos administrativos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-bold text-foreground hover:bg-accent transition-colors shadow-sm">
            <Plus className="w-4 h-4 text-emerald-500" /> Registrar Pago
          </button>
          <button onClick={() => router.push('/pacientes')}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-bold text-foreground hover:bg-accent transition-colors shadow-sm"
          >
            <Users className="w-4 h-4 text-primary" /> Nuevo Paciente
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-bold text-foreground hover:bg-accent transition-colors shadow-sm">
            <Activity className="w-4 h-4 text-orange-500" /> Crear Plan
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Ingresos del Mes", value: `$${data.stats.income.toLocaleString('en-US', {minimumFractionDigits: 2})}`, sub: `${data.stats.incomeGrowth}% vs mes anterior`, icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10", trend: data.stats.incomeGrowth >= 0 },
          { title: "Pacientes Activos", value: data.stats.patients.toLocaleString(), sub: `+${data.stats.patientsGrowth} este mes`, icon: Users, color: "text-primary bg-primary/10" },
          { title: "Planes Activos", value: data.stats.activePlans, sub: "En tratamiento", icon: Activity, color: "text-orange-500 bg-orange-500/10" },
          { title: "Catálogo", value: data.stats.catalogItems, sub: "Procedimientos", icon: ListTree, color: "text-purple-500 bg-purple-500/10" }
        ].map((card, i) => (
          <div key={i} className="bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-bold text-muted-foreground">{card.title}</p>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-foreground">{card.value}</h3>
              <p className={`text-xs font-bold mt-2 flex items-center ${card.trend !== undefined ? (card.trend ? 'text-emerald-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                {card.trend !== undefined && (card.trend ? <ArrowUpRight className="w-3 h-3 mr-1"/> : <ArrowDownRight className="w-3 h-3 mr-1"/>)}
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm border border-border p-6 flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="font-black text-foreground text-lg">Evolución de Ingresos</h3>
              <p className="text-sm font-medium text-muted-foreground">Comparativa de los últimos 6 meses</p>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
              <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008bcd" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#008bcd" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Ingresos']} 
                />
                <Area type="monotone" dataKey="total" stroke="#008bcd" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-[60px] opacity-10 pointer-events-none"></div>
            <h3 className="font-black text-lg text-foreground mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-primary"/> Salud del Sistema</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1 font-medium"><span className="text-muted-foreground">Base de Datos</span><span className="text-emerald-500 flex items-center gap-1"><Wifi className="w-3 h-3"/> Conectado</span></div>
                <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }}></div></div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1 font-medium"><span className="text-muted-foreground">Almacenamiento</span><span className="text-foreground font-bold">45%</span></div>
                <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: '45%' }}></div></div>
                <p className="text-[10px] text-muted-foreground mt-1">45GB de 100GB utilizados</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex flex-col h-[260px]">
            <div className="mb-4 flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-black text-foreground">Actividad Reciente</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {data.recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No hay actividad.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {data.recentActivity.map((activity, index) => (
                    <div key={activity.id} className="relative pl-5">
                      {index !== data.recentActivity.length - 1 && (
                        <span className="absolute top-4 left-[7px] w-0.5 h-full bg-border"></span>
                      )}
                      <span className="absolute left-0 top-1 w-4 h-4 rounded-full border-[3px] border-card bg-primary shadow-sm"></span>
                      
                      <div className="flex flex-col">
                        <p className="text-[10px] font-black text-primary tracking-wider uppercase mb-0.5">{activity.action}</p>
                        <p className="text-sm font-bold text-foreground leading-tight">{activity.details}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] font-medium text-muted-foreground">{activity.user}</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}