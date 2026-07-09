import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const evolutions = await prisma.clinicalNote.findMany({
      where: {
        type: "EVOLUTION",
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, ci: true }
        },
        author: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(evolutions)
  } catch (error) {
    console.error("[GLOBAL_EVOLUTIONS_GET_ERROR]", error)
    return NextResponse.json({ error: "Error al obtener las evoluciones globales" }, { status: 500 })
  }
}