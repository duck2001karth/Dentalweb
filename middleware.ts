import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("=================================");
  console.log("PATH:", pathname);
  console.log("TOKEN:", token);
  console.log("ROLE:", token?.role);
  console.log("=================================");

  // Si no está autenticado
  if (!token) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  // Solo ADMIN puede acceder a /admin
  if (pathname.startsWith("/admin")) {
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Rutas clínicas
  if (
    pathname.startsWith("/pacientes") ||
    pathname.startsWith("/paciente") ||
    pathname.startsWith("/agenda") ||
    pathname.startsWith("/agendavand")
  ) {
    const allowedRoles = ["ADMIN", "DOCTOR", "RECEPTIONIST"];

    if (!allowedRoles.includes(String(token.role))) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/pacientes/:path*",
    "/paciente/:path*",
    "/agenda/:path*",
    "/agendavand/:path*",
    "/dashboard/:path*",
  ],
};