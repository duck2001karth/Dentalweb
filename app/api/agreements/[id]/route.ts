import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAudit } from "@/lib/log"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const ip = req.headers.get("x-forwarded-for") || "Local"
    const resolvedParams = await params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }

    const body = await req.json()

    const updated = await prisma.agreement.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.institutionName !== undefined && { institutionName: body.institutionName }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson || null }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone || null }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail || null }),
        ...(body.discountType !== undefined && { discountType: body.discountType }),
        ...(body.discountValue !== undefined && { discountValue: Number(body.discountValue) }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.notes !== undefined && { notes: body.notes || null })
      }
    })

    await logAudit({
      action: "UPDATE",
      target: "Convenios",
      details: `Convenio modificado: "${updated.name}" (${updated.institutionName})`,
      userId: session?.user?.id,
      ipAddress: ip
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error en PATCH /api/agreements/[id]:", error)
    return NextResponse.json({ error: "Error al actualizar el convenio" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const ip = req.headers.get("x-forwarded-for") || "Local"
    const resolvedParams = await params
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }
    const agreement = await prisma.agreement.findUnique({
      where: { id }
    })

    if (!agreement) {
      return NextResponse.json({ error: "Convenio no encontrado" }, { status: 404 })
    }
    await prisma.$transaction([
      prisma.treatmentPlan.updateMany({
        where: { agreementId: id },
        data: { agreementId: null }
      }),
      prisma.agreement.delete({
        where: { id }
      })
    ])

    await logAudit({
      action: "DELETE",
      target: "Convenios",
      details: `Se eliminó el convenio institucional: "${agreement.name}" (${agreement.institutionName})`,
      userId: session?.user?.id,
      ipAddress: ip
    })

    return NextResponse.json({ success: true, message: "Convenio eliminado correctamente" })
  } catch (error) {
    console.error("Error en DELETE /api/agreements/[id]:", error)
    return NextResponse.json({ error: "Error al eliminar el convenio de la base de datos" }, { status: 500 })
  }
}