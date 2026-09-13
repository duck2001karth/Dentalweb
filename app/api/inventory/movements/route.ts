import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        item: {
          select: { name: true, sku: true, marca: true }
        }
      }
    })
    return NextResponse.json(movements)
  } catch (error) {
    console.error("Error fetching movements:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida para registrar movimientos y auditoría." },
        { status: 401 }
      )
    }

    const currentUserId = (session.user as any).id

    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const body = await req.json()
    const { itemId, quantity, type, reason } = body

    if (!itemId || !quantity || !type) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const parsedQty = Math.abs(parseInt(quantity, 10))
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json({ error: "La cantidad debe ser un número entero mayor a 0" }, { status: 400 })
    }

    const movementType = type === "INCOMING" ? "INCOMING" : "OUTGOING"

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.inventoryItem.findUnique({
        where: { id: itemId }
      })

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND")
      }

      const previousStock = product.stock
      const newStock = movementType === "INCOMING" 
        ? previousStock + parsedQty 
        : previousStock - parsedQty

      if (newStock < 0) {
        throw new Error("INSUFFICIENT_STOCK")
      }

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { stock: newStock }
      })

      const movement = await tx.inventoryMovement.create({
        data: {
          itemId,
          quantity: parsedQty,
          type: movementType, 
          reason: reason ? String(reason).trim() : null
        }
      })
      const actionLabel = movementType === "INCOMING" ? "ENTRADA" : "SALIDA"
      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: movementType === "INCOMING" ? "INVENTORY_INCOMING" : "INVENTORY_OUTGOING",
          entity: "InventoryMovement",
          entityId: movement.id,
          details: `${actionLabel} de inventario: ${parsedQty} unid. en "${product.name}" (SKU: ${product.sku || "N/A"}). Stock: ${previousStock} -> ${newStock}. Motivo: ${movement.reason || "Sin especificar"}`,
          oldData: {
            stock: previousStock,
            itemId: product.id,
            productName: product.name,
          },
          newData: {
            stock: newStock,
            movementId: movement.id,
            type: movementType,
            quantity: parsedQty,
            reason: movement.reason,
          },
          ipAddress,
          userAgent,
        }
      })

      return movement
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error?.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }
    if (error?.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Stock insuficiente para realizar esta salida de inventario" }, { status: 400 })
    }

    console.error("Error procesando movimiento de inventario:", error)
    return NextResponse.json({ error: error.message || "Error al registrar movimiento" }, { status: 500 })
  }
}