import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

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
    const body = await req.json()
    const { itemId, quantity, type, reason } = body

    if (!itemId || !quantity || !type) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const parsedQty = parseInt(quantity)
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.inventoryItem.findUnique({ where: { id: itemId } })
      if (!product) throw new Error("Producto no encontrado")
      const newStock = type === "INCOMING" 
        ? product.stock + parsedQty 
        : product.stock - parsedQty

      if (newStock < 0) throw new Error("Stock insuficiente para realizar esta salida")
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { stock: newStock }
      })
      const movement = await tx.inventoryMovement.create({
        data: {
          itemId,
          quantity: parsedQty,
          type, 
          reason: reason || null
        }
      })

      return movement
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error procesando movimiento:", error)
    return NextResponse.json({ error: error.message || "Error al registrar movimiento" }, { status: 500 })
  }
}