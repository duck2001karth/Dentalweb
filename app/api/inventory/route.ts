import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { isActive: true }, 
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(inventoryItems)
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// CREAR NUEVO PRODUCTO
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const newItem = await prisma.inventoryItem.create({
      data: {
        name: body.name,
        sku: body.sku || null,
        marca: body.marca || null,
        presentacion: body.presentacion || null,
        minStock: body.minStock || 5,
        unitCost: body.unitCost || 0,
        stock: body.stock || 0,
        isActive: true,
      }
    })
    return NextResponse.json(newItem)
  } catch (error) {
    console.error("Error creando item:", error)
    return NextResponse.json({ error: "Error al crear el producto" }, { status: 500 })
  }
}

// ACTUALIZAR PRODUCTO (Editar)
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku || null,
        marca: data.marca || null,
        presentacion: data.presentacion || null,
        minStock: data.minStock,
        unitCost: data.unitCost,
      }
    })
    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("Error actualizando item:", error)
    return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 })
  }
}

// ELIMINAR PRODUCTO
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    await prisma.inventoryItem.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando item:", error)
    return NextResponse.json({ error: "Error al eliminar el producto" }, { status: 500 })
  }
}