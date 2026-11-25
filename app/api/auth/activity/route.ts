import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
export async function POST(req: Request) {
  if (req.headers.get("sec-fetch-site") === "cross-site" || req.headers.get("content-type")?.split(";")[0] !== "application/json") return NextResponse.json({ error: "Solicitud inválida" }, { status: 403 })
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.isActive !== true || !["ADMIN","DOCTOR","RECEPTIONIST"].includes(session.user.role)) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    await prisma.$executeRaw`UPDATE public."User" SET "lastSeenAt" = timezone('UTC', NOW()) WHERE "id" = ${session.user.id} AND "isActive" = true AND ("lastSeenAt" IS NULL OR "lastSeenAt" < timezone('UTC', NOW()) - INTERVAL '45 seconds')`
    return new NextResponse(null, { status: 204 })
  } catch { return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 }) }
}
