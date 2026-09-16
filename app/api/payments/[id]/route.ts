import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { headers } from "next/headers"
import { Prisma } from "@prisma/client"

async function createPaymentAudit(
  tx: any,
  data: {
    userId: string
    action: "UPDATE" | "DELETE"
    entityId: string
    patientId: string
    details: string
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
        entity: "PAYMENT",
        entityId: data.entityId,
        patientId: data.patientId,
        details: data.details,
        oldData: data.oldData || Prisma.JsonNull,
        newData: data.newData || Prisma.JsonNull,
        ipAddress,
        userAgent,
      },
    })
  } catch (err) {
    console.error("Error al registrar auditoría en pagos [id]:", err)
  }
}

async function syncPlanFinancialsTx(tx: any, planId: string) {
  const activePayments = await tx.payment.findMany({
    where: {
      treatmentPlanId: planId,
      status: "COMPLETED",
      NOT: {
        notes: { contains: "[PAGO ELIMINADO" },
      },
    },
  })

  const realTotalPaid = activePayments.reduce(
    (acc: number, p: any) => acc + Number(p.amount || 0),
    0
  )

  const items = await tx.treatmentItem.findMany({
    where: { treatmentPlanId: planId },
    orderBy: { id: "asc" },
  })

  let remainingPaidToDistribute = realTotalPaid
  let allItemsCovered = items.length > 0

  for (const item of items) {
    const itemCost = Number(item.cost || item.price || 0)
    const discount = Number(item.discount || 0)
    const itemFinalPrice = itemCost - itemCost * (discount / 100)

    let itemPaid = 0
    if (remainingPaidToDistribute > 0 && itemFinalPrice > 0) {
      itemPaid = Math.min(itemFinalPrice, remainingPaidToDistribute)
      remainingPaidToDistribute -= itemPaid
    }

    const isFullyPaid = itemPaid >= itemFinalPrice - 0.01 && itemFinalPrice > 0
    if (!isFullyPaid && itemFinalPrice > 0) {
      allItemsCovered = false
    }

    await tx.treatmentItem.update({
      where: { id: item.id },
      data: {
        paidAmount: itemPaid,
        isPaid: isFullyPaid,
      },
    })
  }

  const finalStatus =
    items.length > 0
      ? allItemsCovered
        ? "COMPLETED"
        : "ACTIVE"
      : realTotalPaid > 0
      ? "ACTIVE"
      : "DRAFT"

  await tx.treatmentPlan.update({
    where: { id: planId },
    data: {
      totalPaid: realTotalPaid,
      status: finalStatus,
    },
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id: paymentId } = await params

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, ci: true },
        },
        treatmentPlan: {
          include: { items: true },
        },
        processedBy: {
          select: { id: true, name: true, specialty: true, role: true },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error("Error al obtener pago individual:", error)
    return NextResponse.json({ error: "Error interno al consultar el cobro" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
      userRole === "DOCTOR" ||
      userRole === "RECEPTIONIST" ||
      userRole === "RECEPCIONISTA"

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "No tiene permisos para modificar cobros" },
        { status: 403 }
      )
    }

    const { id: paymentId } = await params
    const body = await request.json()
    const { method, reference, notes, receiptNumber } = body

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const previous = await tx.payment.findUnique({
        where: { id: paymentId },
      })

      if (!previous) throw new Error("NOT_FOUND")

      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          ...(method && { method }),
          ...(reference !== undefined && { reference }),
          ...(notes !== undefined && { notes }),
          ...(receiptNumber !== undefined && { receiptNumber }),
        },
      })

      await createPaymentAudit(tx, {
        userId: currentUser.id,
        action: "UPDATE",
        entityId: paymentId,
        patientId: previous.patientId,
        details: `Actualización de metadatos de pago #${updated.receiptNumber || paymentId}`,
        oldData: {
          method: previous.method,
          reference: previous.reference,
          receiptNumber: previous.receiptNumber,
          notes: previous.notes,
        },
        newData: {
          method: updated.method,
          reference: updated.reference,
          receiptNumber: updated.receiptNumber,
          notes: updated.notes,
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      message: "Pago actualizado y auditado correctamente",
      payment: updatedPayment,
    })
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "El pago no existe" }, { status: 404 })
    }
    console.error("Error al actualizar pago:", error)
    return NextResponse.json({ error: "Error interno al actualizar el pago" }, { status: 500 })
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

    const currentUser = session.user as any
    const userRole = String(currentUser?.role || "").toUpperCase().trim()

    const isAdmin =
      userRole === "ADMIN" ||
      userRole === "ADMINISTRADOR" ||
      userRole === "ADMINISTRATION"

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Solo los administradores pueden anular o eliminar registros contables" },
        { status: 403 }
      )
    }

    const { id: paymentId } = await params

    let deletionReason = "Sin motivo especificado"
    let isPermanent = false

    try {
      const body = await request.json()
      if (body?.reason) deletionReason = body.reason
      if (body?.permanent) isPermanent = true
    } catch {
    }

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          treatmentPlan: true,
        },
      })

      if (!payment) throw new Error("NOT_FOUND")

      const planId = payment.treatmentPlanId
      const userName = currentUser.name || "Administrador"

      if (isPermanent) {
        await tx.payment.delete({
          where: { id: paymentId },
        })

        await createPaymentAudit(tx, {
          userId: currentUser.id,
          action: "DELETE",
          entityId: paymentId,
          patientId: payment.patientId,
          details: `PURGA DEFINITIVA de cobro ($${Number(payment.amount).toFixed(2)}) - Recibo #${payment.receiptNumber || 'S/N'}. Motivo: ${deletionReason}`,
          oldData: {
            amount: payment.amount,
            method: payment.method,
            receiptNumber: payment.receiptNumber,
            treatmentPlanId: payment.treatmentPlanId,
          },
        })
      } else {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            notes: `[PAGO ELIMINADO/ANULADO por ${userName} el ${new Date().toISOString()}]: ${deletionReason} | Registro original: ${payment.notes || "N/A"}`,
          },
        })

        await createPaymentAudit(tx, {
          userId: currentUser.id,
          action: "DELETE",
          entityId: paymentId,
          patientId: payment.patientId,
          details: `ANULACIÓN de cobro ($${Number(payment.amount).toFixed(2)}) - Recibo #${payment.receiptNumber || 'S/N'}. Motivo: ${deletionReason}`,
          oldData: {
            amount: payment.amount,
            method: payment.method,
            receiptNumber: payment.receiptNumber,
          },
        })
      }

      if (planId) {
        await syncPlanFinancialsTx(tx, planId)
      }
    })

    return NextResponse.json({
      success: true,
      message: isPermanent
        ? "Registro purgado definitivamente y balance sincronizado"
        : "Pago anulado y archivado en auditoría con éxito",
    })
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "El registro ya no existe o fue purgado" },
        { status: 404 }
      )
    }
    console.error("Error al anular el pago:", error)
    return NextResponse.json(
      { error: "Error interno al procesar la anulación contable" },
      { status: 500 }
    )
  }
}