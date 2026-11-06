import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { headers } from "next/headers"
import { z } from "zod"


async function syncPlanFinancialsTx(tx: any, planId: string) {
  const activePayments = await tx.payment.findMany({
    where: {
      treatmentPlanId: planId,
      status: "COMPLETED",
      NOT: { notes: { contains: "[PAGO ELIMINADO" } },
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

  const previousPlan = await tx.treatmentPlan.findUnique({ where: { id: planId }, select: { status: true } })
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
      status: finalStatus === "DRAFT" ? (previousPlan?.status || "DRAFT") : finalStatus,
    },
  })
}

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params }) => {
    const paymentId = params.id as string
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, ci: true } },
        treatmentPlan: { include: { items: true } },
        processedBy: { select: { id: true, name: true, specialty: true, role: true } },
      },
    })

    if (!payment) throw new Error("NOT_FOUND")
    return { payment }
  }
)

export const PATCH = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
    schema: z.object({
      method: z.enum(["CASH", "TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "INSURANCE", "OTHER"]).optional(),
      reference: z.string().max(150).nullable().optional(),
      notes: z.string().max(5000).nullable().optional(),
      receiptNumber: z.string().min(1).max(100).nullable().optional(),
    }).strict(),
  },
  async (req, { user, params, data }) => {
    const paymentId = params.id as string
    const { method, reference, notes, receiptNumber } = data

    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const previous = await tx.payment.findUnique({
        where: { id: paymentId },
      })
      if (!previous) throw new Error("NOT_FOUND")

      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          ...(method && { method: method as any }),
          ...(reference !== undefined && { reference }),
          ...(notes !== undefined && { notes }),
          ...(receiptNumber !== undefined && { receiptNumber }),
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_PAYMENT",
          entity: "PAYMENT",
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
          ipAddress,
          userAgent,
        },
      })

      return updated
    })

    return {
      success: true,
      message: "Pago actualizado y auditado correctamente",
      payment: updatedPayment,
    }
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN"] },
  async (req, { user, params }) => {
    const paymentId = params.id as string
    let deletionReason = "Sin motivo especificado"
    let isPermanent = false

    try {
      const body = await req.json()
      if (body?.reason) deletionReason = body.reason
      if (body?.permanent) isPermanent = true
    } catch {}

    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"
    if (isPermanent) {
      return Response.json({ error: "La purga física de pagos está deshabilitada para preservar el historial contable" }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { treatmentPlan: true },
      })
      if (!payment) throw new Error("NOT_FOUND")
      if (payment.notes?.includes("[PAGO ELIMINADO")) {
        throw new Error("El pago ya se encuentra anulado")
      }

      const planId = payment.treatmentPlanId
      const userName = user.name || "Administrador"

      if (isPermanent) {
        await tx.payment.delete({ where: { id: paymentId } })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "DELETE_PAYMENT",
            entity: "PAYMENT",
            entityId: paymentId,
            patientId: payment.patientId,
            details: `PURGA DEFINITIVA de cobro ($${Number(payment.amount).toFixed(2)}) - Recibo #${payment.receiptNumber || "S/N"}. Motivo: ${deletionReason}`,
            oldData: {
              amount: payment.amount,
              method: payment.method,
              receiptNumber: payment.receiptNumber,
              treatmentPlanId: payment.treatmentPlanId,
            },
            ipAddress,
            userAgent,
          },
        })
      } else {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            notes: `[PAGO ELIMINADO/ANULADO por ${userName} el ${new Date().toISOString()}]: ${deletionReason} | Registro original: ${payment.notes || "N/A"}`,
          },
        })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "CANCEL_PAYMENT",
            entity: "PAYMENT",
            entityId: paymentId,
            patientId: payment.patientId,
            details: `ANULACIÓN de cobro ($${Number(payment.amount).toFixed(2)}) - Recibo #${payment.receiptNumber || "S/N"}. Motivo: ${deletionReason}`,
            oldData: {
              amount: payment.amount,
              method: payment.method,
              receiptNumber: payment.receiptNumber,
            },
            ipAddress,
            userAgent,
          },
        })
      }

      if (planId) {
        await syncPlanFinancialsTx(tx, planId)
      }
    })

    return {
      success: true,
      message: isPermanent
        ? "Registro purgado definitivamente y balance sincronizado"
        : "Pago anulado y archivado en auditoría con éxito",
    }
  }
)