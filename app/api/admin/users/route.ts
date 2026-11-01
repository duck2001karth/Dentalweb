import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"
import bcrypt from "bcryptjs"

export const GET = createApiHandler(
  { roles: ["ADMIN"] },
  async () => {
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
    return users
  }
)

export const POST = createApiHandler(
  { roles: ["ADMIN"], schema: z.any() },
  async (req, { user, data }) => {
    const { name, email, password, role, specialty, isActive, language } = data

    if (!name || !email) {
      throw new Error("Nombre y correo son obligatorios")
    }
    if (!password || String(password).length < 6) {
      throw new Error("La contraseña es obligatoria y debe tener al menos 6 caracteres")
    }

    const userEmail = String(email).toLowerCase().trim()
    const existingUser = await prisma.user.findUnique({ where: { email: userEmail } })
    if (existingUser) {
      throw new Error("ALREADY_EXISTS")
    }

    const hashedPassword = await bcrypt.hash(String(password), 10)

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: String(name).trim(),
          email: userEmail,
          password: hashedPassword,
          role: (role as any) || "DOCTOR",
          specialty: specialty || null,
          language: language || "es-EC",
          isActive: isActive ?? true,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_USER",
          entity: "USER",
          entityId: created.id,
          details: `Se registró al usuario: ${created.name} con rol ${created.role}`,
          newData: {
            id: created.id,
            name: created.name,
            email: created.email,
            role: created.role,
            language: created.language,
          },
          ipAddress,
          userAgent,
        },
      })

      return created
    })

    const { password: _, ...userWithoutPassword } = newUser
    return userWithoutPassword
  }
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN"], schema: z.any() },
  async (req, { user, data }) => {
    const { id, name, email, password, role, isActive, specialty, language } = data
    if (!id) throw new Error("Falta ID")

    let hashedPassword: string | undefined = undefined
    if (password && String(password).trim().length >= 6) {
      hashedPassword = await bcrypt.hash(String(password).trim(), 10)
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedUser = await prisma.$transaction(async (tx) => {
      const previousUser = await tx.user.findUnique({ where: { id } })
      if (!previousUser) throw new Error("NOT_FOUND")

      const updated = await tx.user.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: String(name).trim() }),
          ...(email !== undefined && { email: String(email).toLowerCase().trim() }),
          ...(hashedPassword && { password: hashedPassword }),
          ...(role !== undefined && { role: role as any }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
          ...(specialty !== undefined && { specialty: specialty || null }),
          ...(language !== undefined && { language }),
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_USER",
          entity: "USER",
          entityId: updated.id,
          details: `Modificación de perfil/permisos de: ${updated.name} (${updated.email})`,
          oldData: {
            name: previousUser.name,
            email: previousUser.email,
            role: previousUser.role,
            isActive: previousUser.isActive,
            specialty: previousUser.specialty,
            language: previousUser.language,
          },
          newData: {
            name: updated.name,
            email: updated.email,
            role: updated.role,
            isActive: updated.isActive,
            specialty: updated.specialty,
            language: updated.language,
          },
          ipAddress,
          userAgent,
        },
      })

      return updated
    })

    const { password: _, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN"] },
  async (req, { user, searchParams }) => {
    const id = searchParams.get("id")
    if (!id) throw new Error("ID no proporcionado")

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const userToDelete = await tx.user.findUnique({ where: { id } })
      if (!userToDelete) throw new Error("NOT_FOUND")

      await tx.user.delete({ where: { id } })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_USER",
          entity: "USER",
          entityId: id,
          details: `Se revocó y eliminó al usuario: ${userToDelete.name || id}`,
          oldData: {
            id: userToDelete.id,
            name: userToDelete.name,
            email: userToDelete.email,
            role: userToDelete.role,
          },
          ipAddress,
          userAgent,
        },
      })
    })

    return { success: true, message: "Usuario eliminado" }
  }
)