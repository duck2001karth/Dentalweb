import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

// Esquemas de validación
const createItemSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  sku: z.string().optional().nullable(),
  marca: z.string().optional().nullable(),
  presentacion: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  registroSanitario: z.string().optional().nullable(),
  concentracion: z.string().optional().nullable(),
  unidadMedida: z.string().optional().nullable(),
  lote: z.string().optional().nullable(),
  fechaExpiracion: z.string().datetime().optional().nullable(),
  minStock: z.number().optional().default(5),
  unitCost: z.number().optional().default(0),
  stock: z.number().optional().default(0),
  supplier: z.string().optional().nullable(),
})

const updateItemSchema = createItemSchema.partial().extend({
  id: z.string().min(1, "El ID es obligatorio"),
  isActive: z.boolean().optional(),
})

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async () => {
    return await prisma.inventoryItem.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    })
  }
)

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: createItemSchema,
  },
  async (req, { user, data }) => {
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const newItem = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          name: data.name,
          sku: data.sku || null,
          marca: data.marca || null,
          presentacion: data.presentacion || null,
          category: data.category || null,
          registroSanitario: data.registroSanitario || null,
          concentracion: data.concentracion || null,
          unidadMedida: data.unidadMedida || null,
          lote: data.lote || null,
          fechaExpiracion: data.fechaExpiracion ? new Date(data.fechaExpiracion) : null,
          minStock: data.minStock,
          unitCost: data.unitCost,
          stock: data.stock,
          supplier: data.supplier || null,
          isActive: true,
        },
      })

      if (data.stock > 0) {
        await tx.inventoryMovement.create({
          data: {
            itemId: item.id,
            quantity: data.stock,
            type: "INCOMING",
            reason: "Inventario Inicial",
          },
        })
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_INVENTORY_ITEM",
          entity: "INVENTORY_ITEM",
          entityId: item.id,
          details: `Creación de producto "${item.name}" (SKU: ${item.sku || "N/A"}) con stock inicial de ${data.stock} unid. a $${data.unitCost.toFixed(2)} c/u`,
          newData: item,
          ipAddress,
          userAgent,
        },
      })

      return item
    })

    return newItem
  }
)

export const PATCH = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: updateItemSchema,
  },
  async (req, { user, data }) => {
    const { id, ...updateData } = data

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedItem = await prisma.$transaction(async (tx) => {
      const previousItem = await tx.inventoryItem.findUnique({ where: { id } })
      if (!previousItem) throw new Error("NOT_FOUND")

      const updated = await tx.inventoryItem.update({
        where: { id },
        data: {
          ...updateData,
          ...(updateData.fechaExpiracion && { fechaExpiracion: new Date(updateData.fechaExpiracion) }),
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_INVENTORY_ITEM",
          entity: "INVENTORY_ITEM",
          entityId: id,
          details: `Modificación de insumo "${updated.name}". Costo: $${updated.unitCost}, Stock Mínimo: ${updated.minStock}`,
          oldData: previousItem,
          newData: updated,
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
    const permanent = searchParams.get("permanent") === "true"

    if (!id) throw new Error("Falta el ID del producto") // El wrapper atrapa esto

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const itemToDelete = await tx.inventoryItem.findUnique({ where: { id } })
      if (!itemToDelete) throw new Error("NOT_FOUND")

      if (permanent) {
        await tx.inventoryItem.delete({ where: { id } })
        
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "DELETE_INVENTORY_ITEM",
            entity: "INVENTORY_ITEM",
            entityId: id,
            details: `Eliminación FÍSICA del insumo "${itemToDelete.name}" (SKU: ${itemToDelete.sku || "N/A"})`,
            oldData: itemToDelete,
            ipAddress,
            userAgent,
          },
        })
      } else {
        await tx.inventoryItem.update({ where: { id }, data: { isActive: false } })
        
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "ARCHIVE_INVENTORY_ITEM",
            entity: "INVENTORY_ITEM",
            entityId: id,
            details: `Desactivación/Archivo del insumo "${itemToDelete.name}"`,
            ipAddress,
            userAgent,
          },
        })
      }
    })

    return { success: true, message: "Producto eliminado correctamente" }
  }
)