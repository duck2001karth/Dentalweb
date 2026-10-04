import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    const whereClause: any = {}
    if (role) {
      whereClause.role = role
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        language: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id

    if (!currentUserId) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para guardar preferencias." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { language, calendarColor, phoneNumber } = body

    if (!language && calendarColor === undefined && phoneNumber === undefined) {
      return NextResponse.json(
        { error: "No se proporcionaron datos para actualizar." },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {}

    if (language !== undefined) {
      if (typeof language !== "string" || language.trim().length === 0) {
        return NextResponse.json(
          { error: "Formato de idioma no válido." },
          { status: 400 }
        )
      }
      updateData.language = language.trim()
    }

    if (calendarColor !== undefined) {
      updateData.calendarColor = calendarColor
    }

    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber
    }

    const previousUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { language: true, calendarColor: true, phoneNumber: true, name: true },
    })

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        language: true,
        calendarColor: true,
        phoneNumber: true,
      },
    })

    await logAuditEvent({
      userId: currentUserId,
      action: "UPDATE",
      entity: "USER_PREFERENCES",
      entityId: currentUserId,
      details: `Actualización de preferencias de usuario (${updatedUser.name || currentUserId}). Idioma: ${updatedUser.language}`,
      oldData: previousUser,
      newData: {
        language: updatedUser.language,
        calendarColor: updatedUser.calendarColor,
        phoneNumber: updatedUser.phoneNumber,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Preferencias guardadas exitosamente.",
      user: updatedUser,
    })
  } catch (error: any) {
    console.error("Error al actualizar preferencias de usuario:", error)
    return NextResponse.json(
      { error: error?.message || "Error interno al actualizar usuario." },
      { status: 500 }
    )
  }
}