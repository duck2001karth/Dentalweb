import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // BLOQUEO DE SEGURIDAD
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado al registro de auditoría." }, { status: 403 })
    }

    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    })
    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error al obtener logs de auditoría:", error)
    return NextResponse.json(
      { error: "Error interno al cargar la auditoría" }, 
      { status: 500 }
    )
  }
}