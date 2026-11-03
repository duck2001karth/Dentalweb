import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
    schema: z.any(),
  },
  async (req, { user, params, data }) => {
    const paymentId = params.id as string
    const { reason, amount, notes } = data
    const refundAmount = parseFloat(amount || 0)

    if (!paymentId || refundAmount <= 0) {
      throw new Error("Monto o parámetro no válido para la nota de crédito")
    }

    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    // A04: Transacción atómica para que el descuento del plan y la nota de crédito no se desincronicen
    const creditNoteRecord = await prisma.$transaction(async (tx) => {
      const originalPayment = await tx.payment.findUnique({
        where: { id: paymentId },
      })

      if (!originalPayment) throw new Error("NOT_FOUND")
      if (!Number.isFinite(refundAmount) || refundAmount <= 0 ||
          refundAmount > Number(originalPayment.amount)) {
        return { blocked: true, error: "El reembolso supera el importe del pago original" } as const
      }
      // Sin tabla de asignaciones, las devoluciones parciales no pueden
      // reconstruirse con certeza en planes con múltiples prestaciones.
      if (originalPayment.treatmentPlanId) {
        const existingItems = await tx.treatmentItem.count({
          where: { treatmentPlanId: originalPayment.treatmentPlanId },
        })
        if (existingItems !== 1) {
          return { blocked: true, error: "Devolución bloqueada: se requiere historial de asignación por prestación" } as const
        }
      }

      if (originalPayment.treatmentPlanId) {
        const plan = await tx.treatmentPlan.findUnique({
          where: { id: originalPayment.treatmentPlanId },
          include: { items: true },
        })

        if (plan) {
          const newTotalPaid = Math.max(0, Number(plan.totalPaid || 0) - refundAmount)
          let remainingRefundToDistribute = refundAmount

          for (const item of plan.items) {
            if (remainingRefundToDistribute <= 0) break
            const currentItemPaid = Number(item.paidAmount || 0)
            if (currentItemPaid > 0) {
              const deduct = Math.min(currentItemPaid, remainingRefundToDistribute)
              const updatedPaidAmount = currentItemPaid - deduct

              await tx.treatmentItem.update({
                where: { id: item.id },
                data: {
                  paidAmount: updatedPaidAmount,
                  isPaid: false,
                },
              })
              remainingRefundToDistribute -= deduct
            }
          }

          await tx.treatmentPlan.update({
            where: { id: originalPayment.treatmentPlanId },
            data: {
              totalPaid: newTotalPaid,
              status: "ACTIVE",
            },
          })
        }
      }

      const createdNC = await tx.payment.create({
        data: {
          patientId: originalPayment.patientId,
          amount: -refundAmount,
          method: originalPayment.method,
          reference: `NC-${originalPayment.receiptNumber || originalPayment.id.slice(-6)}`,
          treatmentPlanId: originalPayment.treatmentPlanId || undefined,
          processedById: user.id || undefined,
          notes: ` [${reason}]: ${notes || "Sin observaciones"}`,
        },
        include: {
          treatmentPlan: { select: { id: true, name: true } },
          processedBy: { select: { id: true, name: true, specialty: true, role: true } },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_CREDIT_NOTE",
          entity: "PAYMENT",
          entityId: createdNC.id,
          patientId: originalPayment.patientId,
          details: `Nota de crédito emitida por $${refundAmount.toFixed(2)} sobre recibo #${originalPayment.receiptNumber || paymentId}. Motivo: ${reason}`,
          oldData: {
            originalPaymentId: originalPayment.id,
            originalAmount: originalPayment.amount,
          },
          newData: {
            refundAmount: -refundAmount,
            reference: createdNC.reference,
            reason,
          },
          ipAddress,
          userAgent,
        },
      })

      return createdNC
    })

    if ("blocked" in creditNoteRecord) {
      return NextResponse.json({ error: creditNoteRecord.error }, { status: 409 })
    }
    return {
      success: true,
      message: "Nota de crédito emitida correctamente",
      creditNote: creditNoteRecord,
    }
  }
)