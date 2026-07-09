import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    if (token.isActive === false) {
      return NextResponse.redirect(new URL("/auth?error=suspended", req.url));
    }

    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    const clinicalRoutes = ["/pacientes", "/paciente", "/agenda", "/agendavand"];
    if (clinicalRoutes.some(route => pathname.startsWith(route))) {
      const allowedRoles = ["ADMIN", "DOCTOR", "RECEPTIONIST"];
      if (!allowedRoles.includes(token.role)) {
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
    "/pacientes/:path*",
    "/paciente/:path*",
    "/agenda/:path*",
    "/agendavand/:path*"
  ],
};