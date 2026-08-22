import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
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