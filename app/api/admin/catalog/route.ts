import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async () => {
    const items = await prisma.procedureCatalog.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })
    return items
  }
)

export const POST = createApiHandler(
  { roles: ["ADMIN"], schema: z.any() },
  async (req, { user, data }) => {
    const { code, name, category, basePrice, isActive } = data

    if (!name || basePrice === undefined) {
      throw new Error("El nombre y el precio base son obligatorios.")
    }

    const parsedPrice = parseFloat(String(basePrice))
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw new Error("El precio base debe ser un valor numérico válido.")
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const newItem = await prisma.$transaction(async (tx) => {
      const created = await tx.procedureCatalog.create({
        data: {
          code: code?.trim() || null,
          name: String(name).trim(),
          category: category?.trim() || "General",
          basePrice: parsedPrice,
          isActive: isActive ?? true,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_CATALOG_ITEM",
          entity: "PROCEDURE_CATALOG",
          entityId: created.id,
          details: `Nueva prestación creada: "${created.name}" (${created.category}) - $${created.basePrice.toFixed(2)}`,
          newData: {
            id: created.id,
            code: created.code,
            name: created.name,
            category: created.category,
            basePrice: created.basePrice,
            isActive: created.isActive,
          },
          ipAddress,
          userAgent,
        },
      })

      return created
    })

    return newItem
  }
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN"], schema: z.any() },
  async (req, { user, data }) => {
    const { id, code, name, category, basePrice, isActive } = data
    if (!id) throw new Error("Falta el ID del procedimiento para actualizar.")

    const updateData: Record<string, any> = {}
    if (code !== undefined) updateData.code = code ? String(code).trim() : null
    if (name !== undefined) updateData.name = String(name).trim()
    if (category !== undefined) updateData.category = String(category).trim()
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (basePrice !== undefined) {
      const parsedPrice = parseFloat(String(basePrice))
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new Error("El precio base debe ser un valor numérico válido.")
      }
      updateData.basePrice = parsedPrice
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedItem = await prisma.$transaction(async (tx) => {
      const previousItem = await tx.procedureCatalog.findUnique({ where: { id } })
      if (!previousItem) throw new Error("NOT_FOUND")

      const updated = await tx.procedureCatalog.update({
        where: { id },
        data: updateData,
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_CATALOG_ITEM",
          entity: "PROCEDURE_CATALOG",
          entityId: updated.id,
          details: `Prestación modificada: "${updated.name}" (${updated.category}) - $${updated.basePrice.toFixed(2)}`,
          oldData: {
            code: previousItem.code,
            name: previousItem.name,
            category: previousItem.category,
            basePrice: previousItem.basePrice,
            isActive: previousItem.isActive,
          },
          newData: {
            code: updated.code,
            name: updated.name,
            category: updated.category,
            basePrice: updated.basePrice,
            isActive: updated.isActive,
          },
          ipAddress,
          userAgent,
        },
      })

      return updated
    })

    return updatedItem
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN"] },
  async (req, { user, searchParams }) => {
    const id = searchParams.get("id")
    if (!id) throw new Error("Falta el ID del procedimiento a eliminar.")

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const deletedProcedure = await tx.procedureCatalog.findUnique({ where: { id } })
      if (!deletedProcedure) throw new Error("NOT_FOUND")

      await tx.procedureCatalog.delete({ where: { id } })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_CATALOG_ITEM",
          entity: "PROCEDURE_CATALOG",
          entityId: id,
          details: `Prestación eliminada del catálogo: "${deletedProcedure.name}" (${deletedProcedure.category})`,
          oldData: {
            id: deletedProcedure.id,
            code: deletedProcedure.code,
            name: deletedProcedure.name,
            category: deletedProcedure.category,
            basePrice: deletedProcedure.basePrice,
          },
          ipAddress,
          userAgent,
        },
      })
    })

    return {
      success: true,
      message: "Prestación eliminada correctamente del catálogo.",
    }
  }
)