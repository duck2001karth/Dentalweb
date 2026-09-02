import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const daysParam = parseInt(searchParams.get("days") || "7", 10)
    const doctorId = searchParams.get("doctorId")
    const limit = parseInt(searchParams.get("limit") || "100", 10)
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - (isNaN(daysParam) ? 7 : daysParam))

    const evolutions = await prisma.clinicalNote.findMany({
      where: {
        type: "EVOLUTION",
        createdAt: {
          gte: fromDate,
        },
        ...(doctorId && { authorId: doctorId }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            ci: true,
            phone: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    })

    return NextResponse.json(evolutions)
  } catch (error) {
    console.error("[GLOBAL_EVOLUTIONS_GET_ERROR]:", error)
    return NextResponse.json(
      { error: "Error al obtener las evoluciones clínicas globales" },
      { status: 500 }
    )
  }
}