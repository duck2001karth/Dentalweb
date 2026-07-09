"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Stethoscope, FileText, Settings, CreditCard, HelpCircle, 
  Search, Bell, User, Menu, X, ChevronRight, Home, Briefcase
} from 'lucide-react';

// --- DATA DEL MENÚ CON RUTAS ---
const MENU_CATEGORIES = [
  {
    title: 'Soluciones normativas',
    icon: <FileText size={18} />,
    items: [
      { name: 'Historia clínica digital', path: '/admin/normativas/historia-clinica' },
      { name: 'Registro de evoluciones', path: '/admin/normativas/registro-evoluciones' },
      { name: 'Reportes RIPS y FEVRIPS', path: '/admin/normativas/reportes-rips' }
    ]
  },
  {
    title: 'Soluciones clínicas',
    icon: <Stethoscope size={18} />,
    items: [
      { name: 'Videoconsulta', path: '/admin/clinicas/videoconsulta' },
      { name: 'Control de agenda', path: '/admin/clinicas/agenda' },
      { name: 'Consentimientos informados', path: '/admin/clinicas/consentimientos' },
      { name: 'Carga de imágenes y documentos', path: '/admin/clinicas/imagenes' },
      { name: 'Odontograma y periodontograma', path: '/admin/clinicas/odontograma' },
      { name: 'Módulo de ortodoncia', path: '/admin/clinicas/ortodoncia' }
    ]
  },
  {
    title: 'Administración',
    icon: <Briefcase size={18} />,
    items: [
      { name: 'Convenios', path: '/admin/administracion/convenios' },
      { name: 'Facturación electrónica', path: '/admin/administracion/facturacion' },
      { name: 'Gastos', path: '/admin/administracion/gastos' },
      { name: 'Gestión de odontólogos', path: '/admin/administracion/odontologos' },
      { name: 'Inventario', path: '/admin/administracion/inventario' },
      { name: 'Laboratorios', path: '/admin/administracion/laboratorios' },
      { name: 'Liquidaciones', path: '/admin/administracion/liquidaciones' },
      { name: 'Planificación y uso de Box', path: '/admin/administracion/planificacion-box' },
      { name: 'Usuarios', path: '/admin/administracion/usuarios' }
    ]
  },
  {
    title: 'Configuración',
    icon: <Settings size={18} />,
    items: [
      { name: 'Agenda Online', path: '/admin/configuracion/agenda-online' },
      { name: 'Arancel de precios', path: '/admin/configuracion/aranceles' },
      { name: 'Bancos y entidades financieras', path: '/admin/configuracion/bancos' },
      { name: 'Documentos clínicos', path: '/admin/configuracion/documentos-clinicos' },
      { name: 'Estados de agenda', path: '/admin/configuracion/estados-agenda' },
      { name: 'Logotipo', path: '/admin/configuracion/logotipo' },
      { name: 'Opciones de pago', path: '/admin/configuracion/opciones-pago' },
      { name: 'Pagos anulados y pendientes', path: '/admin/configuracion/pagos-pendientes' },
      { name: 'Configuraciones especiales', path: '/admin/configuracion/configuraciones-especiales' }
    ]
  },
  {
    title: 'Soporte',
    icon: <HelpCircle size={18} />,
    items: [
      { name: 'Soporte por chat', path: '/admin/soporte/chat' },
      { name: 'Centro de ayuda', path: '/admin/soporte/centro-ayuda' }
    ]
  }
];

// Aquí corregimos el error de TypeScript agregando la definición de ReactNode
export default function AdminDashboard({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname(); // Obtiene la URL real en Next.js

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* --- SIDEBAR (Menú Lateral) --- */}
      <aside 
        className={`${isSidebarOpen ? 'w-72' : 'w-0 -translate-x-full'} 
        transition-all duration-300 ease-in-out bg-white border-r border-slate-200 flex flex-col fixed md:relative z-20 h-full shrink-0`}
      >
        {/* Logo de la Clínica */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-2xl font-bold text-[#008bcd]">
            <span>Carmo</span>
            <span className="text-slate-700 font-light">Dental</span>
            <span className="text-xl">🦷</span>
          </div>
        </div>

        {/* Lista de Navegación con Scroll */}
        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          
          <Link 
            href="/admin"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-6 transition-colors ${
              pathname === '/admin' ? 'bg-blue-50 text-[#008bcd] font-medium' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Home size={20} />
            <span>Panel de Inicio</span>
          </Link>

          {MENU_CATEGORIES.map((category, idx) => (
            <div key={idx} className="mb-6">
              <div className="flex items-center gap-2 px-3 mb-2 text-slate-400">
                {category.icon}
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  {category.title}
                </h3>
              </div>
              <ul className="space-y-0.5">
                {category.items.map((item, itemIdx) => {
                  const isActive = pathname === item.path || (pathname && pathname.startsWith(item.path + '/'));
                  
                  return (
                    <li key={itemIdx}>
                      <Link
                        href={item.path}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-[#008bcd] text-white font-medium shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate pr-2 text-left">{item.name}</span>
                        {isActive && <ChevronRight size={14} />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50 text-xs text-center text-slate-500">
          Carmo Dental v1.0.0
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-slate-100 text-slate-600 focus:outline-none"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="hidden md:flex relative text-slate-500">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} />
              <input 
                type="text" 
                placeholder="Buscar pacientes, citas..." 
                className="w-80 py-2 pl-9 pr-4 rounded-full bg-slate-100 border-transparent focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button className="relative p-2 text-slate-400 hover:text-[#008bcd] transition-colors rounded-full hover:bg-blue-50">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            
            <button className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#008bcd] to-blue-400 flex items-center justify-center text-white font-bold shadow-sm">
                <User size={18} />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-slate-700 leading-none mb-1">Administrador</p>
                <p className="text-xs text-slate-500 leading-none">Sede Principal</p>
              </div>
            </button>
          </div>
        </header>

        {/* ÁREA DE TRABAJO DINÁMICA (Aquí inyecta Next.js el contenido de page.tsx) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </div>
      </main>

      {/* Estilos globales inyectados para el scrollbar de la barra lateral */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
}