import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"

// 1. OBTENER LISTA DEL CATÁLOGO
export async function GET() {
  try {
    const items = await prisma.procedureCatalog.findMany({
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error("Error al obtener catálogo:", error)
    return NextResponse.json(
      { error: "Error al obtener el catálogo de procedimientos" },
      { status: 500 }
    )
  }
}

// 2. CREAR PROCEDIMIENTO EN EL CATÁLOGO
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado. Se requieren permisos de administrador." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { code, name, category, basePrice, isActive } = body

    if (!name || basePrice === undefined) {
      return NextResponse.json(
        { error: "El nombre y el precio base son obligatorios." },
        { status: 400 }
      )
    }

    const parsedPrice = parseFloat(basePrice)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: "El precio base debe ser un valor numérico válido." },
        { status: 400 }
      )
    }

    const newItem = await prisma.procedureCatalog.create({
      data: {
        code: code?.trim() || null,
        name: name.trim(),
        category: category?.trim() || "General",
        basePrice: parsedPrice,
        isActive: isActive ?? true,
      },
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "CREATE",
      entity: "PROCEDURE_CATALOG",
      entityId: newItem.id,
      details: `Nueva prestación creada: "${newItem.name}" (${newItem.category}) - $${newItem.basePrice.toFixed(2)}`,
      newData: {
        id: newItem.id,
        code: newItem.code,
        name: newItem.name,
        category: newItem.category,
        basePrice: newItem.basePrice,
        isActive: newItem.isActive,
      },
    })

    return NextResponse.json(newItem, { status: 201 })
  } catch (error: any) {
    console.error("Error POST Catalog:", error)
    return NextResponse.json(
      { error: error?.message || "Error al crear la prestación en el catálogo" },
      { status: 500 }
    )
  }
}

// 3. ACTUALIZAR PROCEDIMIENTO
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado. Se requieren permisos de administrador." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { id, code, name, category, basePrice, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del procedimiento para actualizar." },
        { status: 400 }
      )
    }

    const previousItem = await prisma.procedureCatalog.findUnique({
      where: { id },
    })

    if (!previousItem) {
      return NextResponse.json(
        { error: "Procedimiento no encontrado en el catálogo." },
        { status: 404 }
      )
    }

    const updateData: Record<string, any> = {}
    if (code !== undefined) updateData.code = code ? code.trim() : null
    if (name !== undefined) updateData.name = name.trim()
    if (category !== undefined) updateData.category = category.trim()
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (basePrice !== undefined) {
      const parsedPrice = parseFloat(basePrice)
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json(
          { error: "El precio base debe ser un valor numérico válido." },
          { status: 400 }
        )
      }
      updateData.basePrice = parsedPrice
    }

    const updatedItem = await prisma.procedureCatalog.update({
      where: { id },
      data: updateData,
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "UPDATE",
      entity: "PROCEDURE_CATALOG",
      entityId: updatedItem.id,
      details: `Prestación modificada: "${updatedItem.name}" (${updatedItem.category}) - $${updatedItem.basePrice.toFixed(2)}`,
      oldData: {
        code: previousItem.code,
        name: previousItem.name,
        category: previousItem.category,
        basePrice: previousItem.basePrice,
        isActive: previousItem.isActive,
      },
      newData: {
        code: updatedItem.code,
        name: updatedItem.name,
        category: updatedItem.category,
        basePrice: updatedItem.basePrice,
        isActive: updatedItem.isActive,
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error: any) {
    console.error("Error PATCH Catalog:", error)
    return NextResponse.json(
      { error: error?.message || "Error al actualizar la prestación" },
      { status: 500 }
    )
  }
}

// 4. ELIMINAR PROCEDIMIENTO
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado. Se requieren permisos de administrador." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del procedimiento a eliminar." },
        { status: 400 }
      )
    }

    const deletedProcedure = await prisma.procedureCatalog.findUnique({
      where: { id },
    })

    if (!deletedProcedure) {
      return NextResponse.json(
        { error: "El procedimiento no existe o ya fue eliminado." },
        { status: 404 }
      )
    }

    await prisma.procedureCatalog.delete({
      where: { id },
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "DELETE",
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
    })

    return NextResponse.json({
      success: true,
      message: "Prestación eliminada correctamente del catálogo.",
    })
  } catch (error: any) {
    console.error("Error DELETE Catalog:", error)
    return NextResponse.json(
      { error: error?.message || "Error al eliminar el procedimiento del catálogo" },
      { status: 500 }
    )
  }
}