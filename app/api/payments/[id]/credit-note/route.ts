import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    const { id: paymentId } = await params
    const body = await request.json()
    const { reason, amount, notes } = body

    const refundAmount = parseFloat(amount || 0)

    if (!paymentId || refundAmount <= 0) {
      return NextResponse.json({ error: "Monto o parámetro no válido para la nota de crédito" }, { status: 400 })
    }
    const originalPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!originalPayment) {
      return NextResponse.json({ error: "Pago original no encontrado" }, { status: 404 })
    }

    if (originalPayment.treatmentPlanId) {
      const plan = await prisma.treatmentPlan.findUnique({
        where: { id: originalPayment.treatmentPlanId },
        include: { items: true }
      })

      if (plan) {
        const newTotalPaid = Math.max(0, (plan.totalPaid || 0) - refundAmount)
        let remainingRefundToDistribute = refundAmount
        for (const item of plan.items) {
          if (remainingRefundToDistribute <= 0) break
          if ((item.paidAmount || 0) > 0) {
            const deduct = Math.min(item.paidAmount, remainingRefundToDistribute)
            const updatedPaidAmount = item.paidAmount - deduct
            
            await prisma.treatmentItem.update({
              where: { id: item.id },
              data: {
                paidAmount: updatedPaidAmount,
                isPaid: false, 
              }
            })

            remainingRefundToDistribute -= deduct
          }
        }
        await prisma.treatmentPlan.update({
          where: { id: originalPayment.treatmentPlanId },
          data: {
            totalPaid: newTotalPaid,
            status: "ACTIVE", 
          }
        })
      }
    }
    const currentUserId = (session?.user as any)?.id || null

    const creditNoteRecord = await prisma.payment.create({
      data: {
        patientId: originalPayment.patientId,
        amount: -refundAmount,
        method: originalPayment.method,
        reference: `NC-${originalPayment.receiptNumber || originalPayment.id.slice(-6)}`,
        treatmentPlanId: originalPayment.treatmentPlanId || undefined,
        processedById: currentUserId || undefined,
        notes: ` [${reason}]: ${notes || 'Sin observaciones'}`,
      },
      include: {
        treatmentPlan: { select: { id: true, name: true } },
        processedBy: { select: { id: true, name: true, specialty: true, role: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Nota de crédito emitida correctamente",
      creditNote: creditNoteRecord,
    })

  } catch (error) {
    console.error("Error al emitir nota de crédito:", error)
    return NextResponse.json({ error: "Error interno al procesar la nota de crédito" }, { status: 500 })
  }
}