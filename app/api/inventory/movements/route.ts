import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

const createMovementSchema = z.object({
  itemId: z.string().min(1, "ID del insumo obligatorio"),
  quantity: z.union([z.string(), z.number()]),
  type: z.enum(["INCOMING", "OUTGOING"]),
  reason: z.string().optional().nullable(),
})

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async () => {
    return await prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        item: {
          select: { name: true, sku: true, marca: true },
        },
      },
    })
  }
)

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: createMovementSchema,
  },
  async (req, { user, data }) => {
    const parsedQty = Math.abs(Number(data.quantity))
    if (isNaN(parsedQty) || parsedQty <= 0) {
      throw new Error("La cantidad debe ser un número entero mayor a 0")
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const { movement, product, previousStock, newStock } = await prisma.$transaction(async (tx) => {
      const prod = await tx.inventoryItem.findUnique({ where: { id: data.itemId } })
      if (!prod) throw new Error("NOT_FOUND")

      const pStock = prod.stock
      const nStock = data.type === "INCOMING" ? pStock + parsedQty : pStock - parsedQty

      if (nStock < 0) {
        throw new Error("Stock insuficiente para realizar esta salida de inventario")
      }

      await tx.inventoryItem.update({
        where: { id: data.itemId },
        data: { stock: nStock },
      })

      const mov = await tx.inventoryMovement.create({
        data: {
          itemId: data.itemId,
          quantity: parsedQty,
          type: data.type as any, 
          reason: data.reason ? String(data.reason).trim() : null,
        },
      })

      return { movement: mov, product: prod, previousStock: pStock, newStock: nStock }
    })

    const actionLabel = data.type === "INCOMING" ? "ENTRADA" : "SALIDA"

    // Auditoría separada para registrar quién hizo la operación general (A09)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: data.type === "INCOMING" ? "INVENTORY_INCOMING" : "INVENTORY_OUTGOING",
        entity: "INVENTORY_MOVEMENT",
        entityId: movement.id,
        details: `${actionLabel} de inventario: ${parsedQty} unid. en "${product.name}" (SKU: ${product.sku || "N/A"}). Stock: ${previousStock} -> ${newStock}. Motivo: ${movement.reason || "Sin especificar"}`,
        ipAddress,
        userAgent,
      },
    })

    return movement // Retorna HTTP 200/201 automáticamente
  }
)