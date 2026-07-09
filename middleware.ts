import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Logs temporales para depuración (puedes quitarlos después)
    console.log("========== MIDDLEWARE ==========");
    console.log("PATH:", pathname);
    console.log("TOKEN:", token);
    console.log("ROLE:", token?.role);
    console.log("===============================");

    const userRole = token?.role as UserRole | undefined;

    // ---------- ADMIN ----------
    if (pathname.startsWith("/admin")) {
      if (userRole !== UserRole.ADMIN) {
        console.log("Acceso denegado a ADMIN");

        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // ---------- MÓDULOS CLÍNICOS ----------
    const clinicalRoutes = [
      "/pacientes",
      "/paciente",
      "/agenda",
      "/agendavand",
    ];

    if (clinicalRoutes.some((route) => pathname.startsWith(route))) {
      const allowedRoles: UserRole[] = [
        UserRole.ADMIN,
        UserRole.DOCTOR,
        UserRole.RECEPTIONIST,
      ];

      if (!userRole || !allowedRoles.includes(userRole)) {
        console.log("Acceso denegado a módulo clínico");

        return NextResponse.redirect(
          new URL("/unauthorized", req.url)
        );
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
    "/pacientes/:path*",
    "/paciente/:path*",
    "/agenda/:path*",
    "/agendavand/:path*",
  ],
};