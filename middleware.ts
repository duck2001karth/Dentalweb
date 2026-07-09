import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    if (pathname.startsWith("/auth") || pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
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