import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("=================================");
  console.log("MIDDLEWARE EJECUTADO");
  console.log("PATH:", request.nextUrl.pathname);
  console.log("=================================");

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};