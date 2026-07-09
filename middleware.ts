// middleware.ts

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {

    const token = req.nextauth.token as any;
    const pathname = req.nextUrl.pathname;

    if (token && token.isActive === false) {
      return NextResponse.redirect(new URL("/auth?error=suspended", req.url));
    }

    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    const clinicalRoutes = ["/pacientes", "/paciente", "/agenda", "/agendavand"];
    const isClinicalRoute = clinicalRoutes.some((route) => pathname.startsWith(route));

    if (isClinicalRoute) {
      const allowedRoles = ["ADMIN", "DOCTOR", "RECEPTIONIST"];
      
      if (!token?.role || !allowedRoles.includes(token.role)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
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