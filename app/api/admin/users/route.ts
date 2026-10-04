import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        language: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        image: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, password, role, specialty, isActive, language } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y correo son obligatorios" }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña es obligatoria y debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    const userEmail = email.toLowerCase().trim()
    const existingUser = await prisma.user.findUnique({ where: { email: userEmail } })
    if (existingUser) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email: userEmail,
        password: hashedPassword,
        role: role || "DOCTOR",
        specialty: specialty || null,
        language: language || "es-EC",
        isActive: isActive ?? true,
      },
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "CREATE",
      entity: "USER",
      entityId: newUser.id,
      details: `Se registró al usuario: ${name} con rol ${role || "DOCTOR"}`,
      newData: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        language: newUser.language,
      },
    })

    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return NextResponse.json({ error: "Error interno al crear usuario" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { id, name, email, password, role, isActive, specialty, language } = body

    if (!id) return NextResponse.json({ error: "Falta ID" }, { status: 400 })

    const previousUser = await prisma.user.findUnique({ where: { id } })
    if (!previousUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    let hashedPassword: string | undefined = undefined
    if (password && password.trim().length >= 6) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email.toLowerCase().trim() }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(specialty !== undefined && { specialty: specialty || null }),
        ...(language !== undefined && { language }),
      },
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "UPDATE",
      entity: "USER",
      entityId: updatedUser.id,
      details: `Modificación de perfil/permisos de: ${updatedUser.name} (${updatedUser.email})`,
      oldData: {
        name: previousUser.name,
        email: previousUser.email,
        role: previousUser.role,
        isActive: previousUser.isActive,
        specialty: previousUser.specialty,
        language: previousUser.language,
      },
      newData: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        specialty: updatedUser.specialty,
        language: updatedUser.language,
      },
    })

    const { password: _, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })

    const userToDelete = await prisma.user.findUnique({ where: { id } })
    if (!userToDelete) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    await prisma.user.delete({ where: { id } })

    await logAuditEvent({
      userId: session.user.id,
      action: "DELETE",
      entity: "USER",
      entityId: id,
      details: `Se revocó y eliminó al usuario: ${userToDelete.name || id}`,
      oldData: {
        id: userToDelete.id,
        name: userToDelete.name,
        email: userToDelete.email,
        role: userToDelete.role,
      },
    })

    return NextResponse.json({ success: true, message: "Usuario eliminado" })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}