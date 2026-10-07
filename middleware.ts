import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // ==========================================
    // 1. EXPULSIÓN INMEDIATA (USUARIOS INACTIVOS)
    // ==========================================
    if (token && token.isActive === false) {
      const url = new URL("/auth", req.url);
      url.searchParams.set("error", "AccountDisabled");
      return NextResponse.redirect(url);
    }

    if (!token) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    const role = token.role as string;

    // ==========================================
    // 2. RUTAS EXCLUSIVAS DE ADMINISTRADOR (Admin y Ajustes)
    // ==========================================
    const adminOnlyRoutes = [
      "/admin",
      "/ajustes",
      "/convenios"
    ];

    if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // ==========================================
    // 3. RUTAS CLÍNICAS ESTRICTAS (Solo Doctores y Admin)
    // ==========================================
    const strictMedicalRoutes = [
      "/historia-clinica",
      "/odontograma",
      "/evoluciones",
      "/tratamientos", 
      "/tratamiento",
      "/laboratorio" // Añadido: gestión de trabajos de laboratorio dental
    ];

    if (strictMedicalRoutes.some(route => pathname.startsWith(route))) {
      if (role !== "ADMIN" && role !== "DOCTOR") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // ==========================================
    // 4. RUTAS GENERALES Y OPERATIVAS (Admin, Doctores y Recepción)
    // ==========================================
    const generalOperationalRoutes = [
      "/pacientes",
      "/paciente",
      "/agenda",
      "/agenda-global",
      "/dashboard",
      "/cajas",         // Añadido: módulo de caja y arqueos
      "/inventario",    // Añadido: control de insumos y stock
    ];

    if (generalOperationalRoutes.some(route => pathname.startsWith(route))) {
      const allowedRoles = ["ADMIN", "DOCTOR", "RECEPTIONIST"];
      
      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token && token.isActive !== false,
    },
    pages: {
      signIn: "/auth",
    },
  }
);

export const config = {
  matcher: [
    // Admin & Configuración
    "/admin/:path*",
    "/ajustes/:path*",
    "/convenios/:path*",

    // Dashboard
    "/dashboard/:path*",

    // Gestión de Pacientes y Agenda
    "/pacientes/:path*",
    "/paciente/:path*",
    "/agenda/:path*",
    "/agenda-global/:path*",

    // Módulos Financieros, Inventario y Laboratorio
    "/cajas/:path*",
    "/inventario/:path*",
    "/laboratorio/:path*",

    // Clínica Estricta
    "/historia-clinica/:path*",
    "/odontograma/:path*",
    "/evoluciones/:path*",
    "/tratamientos/:path*",
    "/tratamiento/:path*",
  ],
};