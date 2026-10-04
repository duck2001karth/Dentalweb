import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

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
    const userRole = String((session?.user as any)?.role || "").toUpperCase()

    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR" && userRole !== "DOCTOR") {
      return NextResponse.json({ error: "Permisos insuficientes para registrar movimientos de inventario." }, { status: 403 })
    }

    const currentUserId = (session!.user as any).id
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

    const { movement, product, previousStock, newStock } = await prisma.$transaction(async (tx) => {
      const prod = await tx.inventoryItem.findUnique({ where: { id: itemId } })
      if (!prod) throw new Error("PRODUCT_NOT_FOUND")

      const pStock = prod.stock
      const nStock = movementType === "INCOMING" ? pStock + parsedQty : pStock - parsedQty
      
      if (nStock < 0) throw new Error("INSUFFICIENT_STOCK")

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { stock: nStock }
      })

      const mov = await tx.inventoryMovement.create({
        data: {
          itemId,
          quantity: parsedQty,
          type: movementType, 
          reason: reason ? String(reason).trim() : null
        }
      })

      return { movement: mov, product: prod, previousStock: pStock, newStock: nStock }
    })

    const actionLabel = movementType === "INCOMING" ? "ENTRADA" : "SALIDA"
    
    await logAuditEvent({
      userId: currentUserId,
      action: movementType === "INCOMING" ? "INVENTORY_INCOMING" : "INVENTORY_OUTGOING",
      entity: "INVENTORY_MOVEMENT",
      entityId: movement.id,
      details: `${actionLabel} de inventario: ${parsedQty} unid. en "${product.name}" (SKU: ${product.sku || "N/A"}). Stock: ${previousStock} -> ${newStock}. Motivo: ${movement.reason || "Sin especificar"}`,
    })

    return NextResponse.json(movement, { status: 201 })
  } catch (error: any) {
    if (error?.message === "PRODUCT_NOT_FOUND") return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    if (error?.message === "INSUFFICIENT_STOCK") return NextResponse.json({ error: "Stock insuficiente para realizar esta salida de inventario" }, { status: 400 })
    
    console.error("Error procesando movimiento de inventario:", error)
    return NextResponse.json({ error: error.message || "Error al registrar movimiento" }, { status: 500 })
  }
}