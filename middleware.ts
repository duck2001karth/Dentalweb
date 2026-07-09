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

    // Permite el paso a ADMIN, DOCTOR y RECEPTIONIST. Bloquea a otros (ej: pacientes, invitados)
    if (pathname.startsWith("/pacientes") || pathname.startsWith("/agenda") || pathname.startsWith("/paciente/")) {
      const allowedRoles = ["ADMIN", "DOCTOR", "RECEPTIONIST"];
      if (!allowedRoles.includes(token?.role)) {
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

// ¡IMPORTANTE! Debes agregar las nuevas rutas al matcher para que el middleware las escuche
export const config = {
  matcher: [
    "/admin/:path*",     
    "/dashboard/:path*",  

  ],
};