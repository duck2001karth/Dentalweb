import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { headers } from "next/headers"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.documentTemplate.findUnique({ where: { id } })
      if (!existing) throw new Error("NOT_FOUND")

      if (body.isDefault) {
        await tx.documentTemplate.updateMany({
          where: { type: body.type || existing.type, id: { not: id } },
          data: { isDefault: false },
        })
      }

      return await tx.documentTemplate.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title.trim() }),
          ...(body.type !== undefined && { type: body.type }),
          ...(body.category !== undefined && { category: body.category.trim() }),
          ...(body.content !== undefined && { content: body.content.trim() }),
          ...(body.requiresPatientSignature !== undefined && {
            requiresPatientSignature: Boolean(body.requiresPatientSignature),
          }),
          ...(body.requiresDoctorSignature !== undefined && {
            requiresDoctorSignature: Boolean(body.requiresDoctorSignature),
          }),
          ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
          ...(body.isDefault !== undefined && { isDefault: Boolean(body.isDefault) }),
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 })
    }
    console.error("Error en PATCH /api/configuration/templates/[id]:", error)
    return NextResponse.json({ error: "Error al actualizar la plantilla" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    await prisma.documentTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Plantilla eliminada" })
  } catch (error: any) {
    console.error("Error en DELETE /api/configuration/templates/[id]:", error)
    return NextResponse.json({ error: "Error al eliminar plantilla" }, { status: 500 })
  }
}