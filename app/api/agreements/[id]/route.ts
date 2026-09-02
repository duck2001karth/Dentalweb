import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { headers } from "next/headers"

async function createAuditEntry(
  tx: any,
  data: {
    userId: string
    action: "UPDATE" | "DELETE"
    entityId: string
    details?: string
    oldData?: any
    newData?: any
  }
) {
  try {
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await tx.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: "AGREEMENT",
        entityId: data.entityId,
        details: data.details || null,
        oldData: data.oldData || null,
        newData: data.newData || null,
        ipAddress,
        userAgent,
      },
    })
  } catch (err) {
    console.error("Error al registrar auditoría en Convenio [id]:", err)
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const currentUser = session.user as any
    const userRole = String(currentUser?.role || "").toUpperCase().trim()

    const isAuthorized =
      userRole === "ADMIN" ||
      userRole === "ADMINISTRADOR" ||
      userRole === "ADMINISTRATION"

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Solo administradores pueden modificar convenios" },
        { status: 403 }
      )
    }

    const { id } = await props.params
    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }

    const body = await req.json()

    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.agreement.findUnique({
        where: { id },
      })

      if (!previous) throw new Error("NOT_FOUND")

      const res = await tx.agreement.update({
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
          ...(body.notes !== undefined && { notes: body.notes || null }),
        },
      })

      await createAuditEntry(tx, {
        userId: currentUser.id,
        action: "UPDATE",
        entityId: id,
        details: `Convenio modificado: "${res.name}" (${res.institutionName})`,
        oldData: {
          name: previous.name,
          institutionName: previous.institutionName,
          discountType: previous.discountType,
          discountValue: Number(previous.discountValue),
          isActive: previous.isActive,
        },
        newData: {
          name: res.name,
          institutionName: res.institutionName,
          discountType: res.discountType,
          discountValue: Number(res.discountValue),
          isActive: res.isActive,
        },
      })

      return res
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Convenio no encontrado" }, { status: 404 })
    }
    console.error("Error en PATCH /api/agreements/[id]:", error)
    return NextResponse.json({ error: "Error al actualizar el convenio" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const currentUser = session.user as any
    const userRole = String(currentUser?.role || "").toUpperCase().trim()

    const isAuthorized =
      userRole === "ADMIN" ||
      userRole === "ADMINISTRADOR" ||
      userRole === "ADMINISTRATION"

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Solo administradores pueden eliminar convenios institucionales" },
        { status: 403 }
      )
    }

    const { id } = await props.params
    if (!id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      const agreement = await tx.agreement.findUnique({
        where: { id },
      })

      if (!agreement) throw new Error("NOT_FOUND")

      // Desvincular planes de tratamiento antes de la supresión
      await tx.treatmentPlan.updateMany({
        where: { agreementId: id },
        data: { agreementId: null },
      })

      await tx.agreement.delete({
        where: { id },
      })

      await createAuditEntry(tx, {
        userId: currentUser.id,
        action: "DELETE",
        entityId: id,
        details: `Se eliminó el convenio institucional: "${agreement.name}" (${agreement.institutionName})`,
        oldData: {
          name: agreement.name,
          institutionName: agreement.institutionName,
          discountType: agreement.discountType,
          discountValue: Number(agreement.discountValue),
          isActive: agreement.isActive,
          createdAt: agreement.createdAt,
        },
      })
    })

    return NextResponse.json({ success: true, message: "Convenio eliminado y auditado correctamente" })
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Convenio no encontrado" }, { status: 404 })
    }
    console.error("Error en DELETE /api/agreements/[id]:", error)
    return NextResponse.json({ error: "Error al eliminar el convenio de la base de datos" }, { status: 500 })
  }
}