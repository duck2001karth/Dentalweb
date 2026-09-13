import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAudit } from "@/lib/log"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        image: true
      },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const ip = req.headers.get("x-forwarded-for") || "Local"
    const body = await req.json()
    const { name, email, password, role, specialty, isActive } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y correo son obligatorios" }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "La contraseña es obligatoria y debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "DOCTOR",
        specialty: specialty || null,
        isActive: isActive ?? true
      }
    })

    await logAudit({
      action: "CREATE",
      target: "Usuarios",
      details: `Se registró al usuario: ${name} con rol ${role || "DOCTOR"}`,
      userId: session?.user?.id,
      ipAddress: ip
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
    const ip = req.headers.get("x-forwarded-for") || "Local"
    const body = await req.json()
    const { id, name, email, password, role, isActive, specialty } = body

    if (!id) return NextResponse.json({ error: "Falta ID" }, { status: 400 })
    let hashedPassword: string | undefined = undefined
    if (password && password.trim().length >= 6) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(specialty !== undefined && { specialty: specialty || null })
      }
    })

    await logAudit({
      action: "UPDATE",
      target: "Usuarios",
      details: `Modificación de perfil/permisos de: ${updatedUser.name} (${updatedUser.email})`,
      userId: session?.user?.id,
      ipAddress: ip
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
    const ip = req.headers.get("x-forwarded-for") || "Local"
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })

    const userToDelete = await prisma.user.findUnique({ where: { id } })

    await prisma.user.delete({ where: { id } })

    await logAudit({
      action: "DELETE",
      target: "Usuarios",
      details: `Se revocó y eliminó al usuario: ${userToDelete?.name || id}`,
      userId: session?.user?.id,
      ipAddress: ip
    })

    return NextResponse.json({ success: true, message: "Usuario eliminado" })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}