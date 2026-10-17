import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const isApiRoute = pathname.startsWith("/api");

    if (!token || token.isActive === false) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "No autorizado o cuenta deshabilitada." },
          { status: 401 }
        );
      }
      const url = new URL("/auth", req.url);
      if (token?.isActive === false) {
        url.searchParams.set("error", "AccountDisabled");
      }
      return NextResponse.redirect(url);
    }

    const role = String(token.role || "").toUpperCase().trim();

    if (pathname.startsWith("/api/admin")) {
      const isCatalogGet = pathname.startsWith("/api/admin/catalog") && req.method === "GET";
      const isSearchGet = pathname.startsWith("/api/admin/search") && req.method === "GET";

      if (!isCatalogGet && !isSearchGet && role !== "ADMIN") {
        return NextResponse.json(
          { error: "Acceso denegado. Se requiere rol de Administrador." },
          { status: 403 }
        );
      }
    }

    const adminOnlyRoutes = ["/admin", "/ajustes", "/convenios"];
    if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    const strictMedicalRoutes = [
      "/historia-clinica",
      "/odontograma",
      "/evoluciones",
      "/tratamientos",
      "/tratamiento",
      "/plans-treatment",
      "/laboratorio",
    ];

    if (strictMedicalRoutes.some((route) => pathname.startsWith(route))) {
      if (role !== "ADMIN" && role !== "DOCTOR") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    const generalOperationalRoutes = [
      "/pacientes",
      "/paciente",
      "/agenda",
      "/agenda-global",
      "/dashboard",
      "/cajas",
      "/inventario",
      "/comprobantes",
    ];

    if (generalOperationalRoutes.some((route) => pathname.startsWith(route))) {
      const allowedRoles = ["ADMIN", "DOCTOR", "RECEPTIONIST", "RECEPCIONISTA"];
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
    "/admin/:path*",
    "/ajustes/:path*",
    "/convenios/:path*",
    "/dashboard/:path*",
    "/pacientes/:path*",
    "/paciente/:path*",
    "/agenda/:path*",
    "/agenda-global/:path*",
    "/cajas/:path*",
    "/inventario/:path*",
    "/laboratorio/:path*",
    "/historia-clinica/:path*",
    "/odontograma/:path*",
    "/evoluciones/:path*",
    "/tratamientos/:path*",
    "/tratamiento/:path*",
    "/plans-treatment/:path*",
    "/comprobantes/:path*",
    "/api/((?!auth).*)",
  ],
};