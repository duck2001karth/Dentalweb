import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const userRole = token?.role as string;

    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url)); 
    }

    const clinicalRoutes = ["/pacientes", "/paciente", "/agenda", "/agendavand"];
    if (clinicalRoutes.some(route => pathname.startsWith(route))) {
      const allowedRoles = ["ADMIN", "DOCTOR", "RECEPTIONIST"];
      if (!allowedRoles.includes(userRole)) {
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
)

export const config = {
  matcher: [
    "/admin/:path*", 
    "/pacientes/:path*",
    "/paciente/:path*",
    "/agenda/:path*",
    "/agendavand/:path*",
    "/dashboard/:path*"
  ],
}