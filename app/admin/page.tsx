"use client"

import React from "react"
import { DollarSign, Users, Activity, ListTree, ArrowUpRight } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-8">
      
      <div>
        <h2 className="text-3xl font-black text-foreground tracking-tight">Vista General</h2>
        <p className="text-muted-foreground mt-1 font-medium">Métricas de rendimiento y atajos administrativos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-muted-foreground">Ingresos del Mes</h3>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-2 rounded-lg"><DollarSign className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-foreground">$14,520.00</p>
          <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> +12% vs mes anterior
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-muted-foreground">Pacientes Activos</h3>
            <div className="bg-blue-100 dark:bg-blue-900/30 text-[#008bcd] p-2 rounded-lg"><Users className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-foreground">1,204</p>
          <p className="text-xs text-muted-foreground font-medium mt-2">
            32 pacientes nuevos este mes
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-muted-foreground">Planes Activos</h3>
            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 p-2 rounded-lg"><Activity className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-foreground">86</p>
          <p className="text-xs text-muted-foreground font-medium mt-2">
            En tratamiento actual
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-muted-foreground">Catálogo de Precios</h3>
            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2 rounded-lg"><ListTree className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-foreground">142</p>
          <p className="text-xs text-muted-foreground font-medium mt-2">
            Procedimientos registrados
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground font-medium text-sm">Aquí irá el gráfico de ingresos...</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[300px]">
          <h3 className="font-bold text-foreground mb-4">Actividad Reciente</h3>
          <p className="text-muted-foreground font-medium text-sm text-center mt-20">No hay actividad para mostrar.</p>
        </div>
      </div>

    </div>
  )
}