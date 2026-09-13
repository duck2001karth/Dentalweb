import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth"

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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida para registrar auditoría." },
        { status: 401 }
      )
    }

    const currentUserId = (session.user as any).id

    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

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

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: "CREATE_INVENTORY_ITEM",
          entity: "InventoryItem",
          entityId: item.id,
          details: `Creación de producto "${item.name}" (SKU: ${item.sku || "N/A"}) con stock inicial de ${stockInitial} unid. a $${cost.toFixed(2)} c/u`,
          oldData: undefined,
          newData: {
            id: item.id,
            name: item.name,
            sku: item.sku,
            marca: item.marca,
            stock: item.stock,
            unitCost: item.unitCost,
            minStock: item.minStock,
          },
          ipAddress,
          userAgent,
        }
      })

      return item
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
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida para registrar auditoría." },
        { status: 401 }
      )
    }

    const currentUserId = (session.user as any).id

    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "ID de producto requerido" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const previousItem = await tx.inventoryItem.findUnique({
        where: { id }
      })

      if (!previousItem) {
        throw new Error("ITEM_NOT_FOUND")
      }

      const updatedItem = await tx.inventoryItem.update({
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
          ...(data.fechaExpiracion !== undefined && { 
            fechaExpiracion: data.fechaExpiracion ? new Date(data.fechaExpiracion) : null 
          }),
          ...(data.minStock !== undefined && { minStock: Number(data.minStock) }),
          ...(data.unitCost !== undefined && { unitCost: Number(data.unitCost) }),
          ...(data.supplier !== undefined && { supplier: data.supplier || null }),
          ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        }
      })

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: "UPDATE_INVENTORY_ITEM",
          entity: "InventoryItem",
          entityId: id,
          details: `Modificación de insumo "${updatedItem.name}". Costo: $${updatedItem.unitCost}, Stock Mínimo: ${updatedItem.minStock}`,
          oldData: {
            name: previousItem.name,
            sku: previousItem.sku,
            marca: previousItem.marca,
            presentacion: previousItem.presentacion,
            unitCost: previousItem.unitCost,
            minStock: previousItem.minStock,
            isActive: previousItem.isActive,
          },
          newData: {
            name: updatedItem.name,
            sku: updatedItem.sku,
            marca: updatedItem.marca,
            presentacion: updatedItem.presentacion,
            unitCost: updatedItem.unitCost,
            minStock: updatedItem.minStock,
            isActive: updatedItem.isActive,
          },
          ipAddress,
          userAgent,
        }
      })

      return updatedItem
    })

    return NextResponse.json(result)
  } catch (error: any) {
    if (error?.message === "ITEM_NOT_FOUND") {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }
    console.error("Error actualizando item:", error)
    return NextResponse.json({ error: error.message || "Error al actualizar el producto" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida para registrar auditoría." },
        { status: 401 }
      )
    }

    const currentUserId = (session.user as any).id
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const permanent = searchParams.get("permanent") === "true"

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const itemToDelete = await tx.inventoryItem.findUnique({
        where: { id }
      })

      if (!itemToDelete) {
        throw new Error("ITEM_NOT_FOUND")
      }

      if (permanent) {
        await tx.inventoryItem.delete({
          where: { id }
        })

        await tx.auditLog.create({
          data: {
            userId: currentUserId,
            action: "PURGE_INVENTORY_ITEM",
            entity: "InventoryItem",
            entityId: id,
            details: `Eliminación física del insumo "${itemToDelete.name}" (SKU: ${itemToDelete.sku || "N/A"}) con ${itemToDelete.stock} unidades en existencia`,
            oldData: {
              id: itemToDelete.id,
              name: itemToDelete.name,
              sku: itemToDelete.sku,
              stock: itemToDelete.stock,
              unitCost: itemToDelete.unitCost,
              marca: itemToDelete.marca,
            },
            newData: undefined,
            ipAddress,
            userAgent,
          }
        })
      } else {
        await tx.inventoryItem.update({
          where: { id },
          data: { isActive: false }
        })

        await tx.auditLog.create({
          data: {
            userId: currentUserId,
            action: "DEACTIVATE_INVENTORY_ITEM",
            entity: "InventoryItem",
            entityId: id,
            details: `Desactivación/Archivo del insumo "${itemToDelete.name}"`,
            oldData: { isActive: true },
            newData: { isActive: false },
            ipAddress,
            userAgent,
          }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === "ITEM_NOT_FOUND") {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }
    console.error("Error eliminando item:", error)
    return NextResponse.json({ error: error.message || "Error al eliminar el producto" }, { status: 500 })
  }
}