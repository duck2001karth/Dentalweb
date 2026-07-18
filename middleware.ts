import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    console.log("=================================");
    console.log("PATH:", pathname);
    console.log("TOKEN:", token);
    console.log("ROLE:", token?.role);
    console.log("=================================");

    // Si no existe sesión, enviar al login
    if (!token) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    const role = token.role as string;

    // ==========================
    // SOLO ADMIN
    // ==========================
    if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // ==========================
    // RUTAS CLÍNICAS
    // ==========================
    const clinicalRoutes = [
      "/pacientes",
      "/paciente",
      "/agenda",
      "/agendavand",
      "/dashboard",
      "/historia-clinica",
      "/odontograma",
      "/evoluciones",
      "/tratamientos",
      "/tratamiento",
    ];

    if (clinicalRoutes.some(route => pathname.startsWith(route))) {
      const allowedRoles = [
        "ADMIN",
        "DOCTOR",
        "RECEPTIONIST",
      ];

      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",

    "/dashboard/:path*",

    "/pacientes/:path*",
    "/paciente/:path*",

    "/agenda/:path*",
    "/agendavand/:path*",

    "/historia-clinica/:path*",
    "/odontograma/:path*",
    "/evoluciones/:path*",

    "/tratamientos/:path*",
    "/tratamiento/:path*",
  ],
};