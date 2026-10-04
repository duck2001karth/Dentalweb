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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = String((session?.user as any)?.role || "").toUpperCase()

    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR" && userRole !== "DOCTOR") {
      return NextResponse.json({ error: "Permisos insuficientes para crear insumos." }, { status: 403 })
    }

    const currentUserId = (session!.user as any).id
    const body = await req.json()
    const stockInitial = Number(body.stock) || 0
    const cost = Number(body.unitCost) || 0

    const newItem = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          name: body.name,
          sku: body.sku || null,
          marca: body.marca || null,
          presentacion: body.presentacion || null,
          category: body.category || null,
          registroSanitario: body.registroSanitario || null,
          concentracion: body.concentracion || null,
          unidadMedida: body.unidadMedida || null,
          lote: body.lote || null,
          fechaExpiracion: body.fechaExpiracion ? new Date(body.fechaExpiracion) : null,
          minStock: body.minStock !== undefined ? Number(body.minStock) : 5,
          unitCost: cost,
          stock: stockInitial,
          supplier: body.supplier || null,
          isActive: true,
        }
      })

      if (stockInitial > 0) {
        await tx.inventoryMovement.create({
          data: {
            itemId: item.id,
            quantity: stockInitial,
            type: "INCOMING",
            reason: "Inventario Inicial",
          }
        })
      }
      return item
    })

    await logAuditEvent({
      userId: currentUserId,
      action: "CREATE",
      entity: "INVENTORY_ITEM",
      entityId: newItem.id,
      details: `Creación de producto "${newItem.name}" (SKU: ${newItem.sku || "N/A"}) con stock inicial de ${stockInitial} unid. a $${cost.toFixed(2)} c/u`,
      newData: newItem,
    })

    return NextResponse.json(newItem, { status: 201 })
  } catch (error: any) {
    console.error("Error creando item:", error)
    return NextResponse.json({ error: error.message || "Error al crear el producto" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = String((session?.user as any)?.role || "").toUpperCase()

    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR" && userRole !== "DOCTOR") {
      return NextResponse.json({ error: "Permisos insuficientes para editar inventario." }, { status: 403 })
    }

    const currentUserId = (session!.user as any).id
    const body = await req.json()
    const { id, ...data } = body

    if (!id) return NextResponse.json({ error: "ID de producto requerido" }, { status: 400 })

    const previousItem = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!previousItem) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: String(data.name) }),
        ...(data.sku !== undefined && { sku: data.sku || null }),
        ...(data.marca !== undefined && { marca: data.marca || null }),
        ...(data.presentacion !== undefined && { presentacion: data.presentacion || null }),
        ...(data.category !== undefined && { category: data.category || null }),
        ...(data.registroSanitario !== undefined && { registroSanitario: data.registroSanitario || null }),
        ...(data.concentracion !== undefined && { concentracion: data.concentracion || null }),
        ...(data.unidadMedida !== undefined && { unidadMedida: data.unidadMedida || null }),
        ...(data.lote !== undefined && { lote: data.lote || null }),
        ...(data.fechaExpiracion !== undefined && { fechaExpiracion: data.fechaExpiracion ? new Date(data.fechaExpiracion) : null }),
        ...(data.minStock !== undefined && { minStock: Number(data.minStock) }),
        ...(data.unitCost !== undefined && { unitCost: Number(data.unitCost) }),
        ...(data.supplier !== undefined && { supplier: data.supplier || null }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      }
    })

    await logAuditEvent({
      userId: currentUserId,
      action: "UPDATE",
      entity: "INVENTORY_ITEM",
      entityId: id,
      details: `Modificación de insumo "${updatedItem.name}". Costo: $${updatedItem.unitCost}, Stock Mínimo: ${updatedItem.minStock}`,
      oldData: previousItem,
      newData: updatedItem,
    })

    return NextResponse.json(updatedItem)
  } catch (error: any) {
    console.error("Error actualizando item:", error)
    return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = String((session?.user as any)?.role || "").toUpperCase()

    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Solo administradores pueden eliminar insumos." }, { status: 403 })
    }

    const currentUserId = (session!.user as any).id
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const permanent = searchParams.get("permanent") === "true"

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    const itemToDelete = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!itemToDelete) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

    if (permanent) {
      await prisma.inventoryItem.delete({ where: { id } })
      await logAuditEvent({
        userId: currentUserId,
        action: "DELETE",
        entity: "INVENTORY_ITEM",
        entityId: id,
        details: `Eliminación FÍSICA del insumo "${itemToDelete.name}" (SKU: ${itemToDelete.sku || "N/A"})`,
        oldData: itemToDelete,
      })
    } else {
      await prisma.inventoryItem.update({ where: { id }, data: { isActive: false } })
      await logAuditEvent({
        userId: currentUserId,
        action: "UPDATE",
        entity: "INVENTORY_ITEM",
        entityId: id,
        details: `Desactivación/Archivo del insumo "${itemToDelete.name}"`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error eliminando item:", error)
    return NextResponse.json({ error: "Error al eliminar el producto" }, { status: 500 })
  }
}