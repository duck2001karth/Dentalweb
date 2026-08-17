"use client"

import React, { useState } from "react"
import { Search, FlaskConical } from "lucide-react"
import { AppLayout } from "@/components/layouts/app-layout"
import { Input } from "@/components/ui/input"
import LaboratoryTab from "@/components/clinic-management/laboratory/laboratory-tab"

export default function LaboratoriosPage() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <AppLayout>
      <div className="w-full px-4 md:px-6 py-6 lg:py-8 animate-in fade-in duration-500 flex flex-col min-h-[calc(100vh-6rem)]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-10 bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-6 relative z-10 w-full lg:w-auto">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr from-violet-600 to-fuchsia-400 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 rotate-3 transition-transform hover:rotate-0">
              <FlaskConical className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                Laboratorios
              </h1>
              <p className="text-muted-foreground mt-1.5 text-sm md:text-base max-w-md">
                Gestión de empresas externas y cuentas por pagar.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-[400px] relative z-10">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
              </div>
              <Input 
                type="text" 
                placeholder="Buscar laboratorio..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-6 text-base rounded-xl border-2 border-border focus-visible:ring-0 focus-visible:border-violet-500 bg-background shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        <LaboratoryTab searchTerm={searchTerm} />

      </div>
    </AppLayout>
  )
}