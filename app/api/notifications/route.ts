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

    const userRole = session.user.role as string
    const userId = session.user.id as string

    let whereClause: any = {}

    if (userRole !== "ADMIN") {
      whereClause.OR = [
        { targetRole: userRole },
        { targetRole: "ALL" },
        { userId: userId }
      ]
    }


    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 20 
    })

    return NextResponse.json(notifications)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { ids } = await request.json()
    
    await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { isRead: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}