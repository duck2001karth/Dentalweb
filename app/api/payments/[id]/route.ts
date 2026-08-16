import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        treatmentPlan: true,
        processedBy: {
          select: { id: true, name: true }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error("Error al obtener pago individual:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params
    const body = await request.json()
    const { method, reference, notes, receiptNumber } = body

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        method: method || undefined,
        reference: reference !== undefined ? reference : undefined,
        notes: notes !== undefined ? notes : undefined,
        receiptNumber: receiptNumber !== undefined ? receiptNumber : undefined,
      }
    })

    return NextResponse.json({ success: true, payment: updatedPayment })
  } catch (error) {
    console.error("Error al actualizar pago:", error)
    return NextResponse.json({ error: "Error interno al actualizar el pago" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    const { id: paymentId } = await params
    
    let deletionReason = "Sin motivo especificado"
    let isPermanent = false

    try {
      const body = await request.json()
      if (body?.reason) deletionReason = body.reason
      if (body?.permanent) isPermanent = true
    } catch (e) {}

    // 1. Verificar si existe antes de actuar
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { treatmentPlan: { include: { items: true } } }
    })

    if (!payment) {
      return NextResponse.json({ success: true, message: "El registro ya no existe o fue purgado" }, { status: 200 })
    }
    if (isPermanent) {
      await prisma.payment.deleteMany({
        where: { id: paymentId }
      })
      return NextResponse.json({ 
        success: true, 
        message: "Registro purgado definitivamente de la base de datos" 
      })
    }

    // 3. SI ES ANULACIÓN REGULAR (Soft Delete con reversión contable)
    if (payment.treatmentPlanId && payment.treatmentPlan) {
      const refundAmount = payment.amount
      const plan = payment.treatmentPlan
      const newTotalPaid = Math.max(0, (plan.totalPaid || 0) - refundAmount)
      let remainingToRevert = refundAmount

      for (const item of plan.items) {
        if (remainingToRevert <= 0) break
        if ((item.paidAmount || 0) > 0) {
          const deduct = Math.min(item.paidAmount, remainingToRevert)
          await prisma.treatmentItem.update({
            where: { id: item.id },
            data: {
              paidAmount: item.paidAmount - deduct,
              isPaid: false,
            }
          })
          remainingToRevert -= deduct
        }
      }

      await prisma.treatmentPlan.update({
        where: { id: payment.treatmentPlanId },
        data: {
          totalPaid: newTotalPaid,
          status: "ACTIVE",
        }
      })
    }

    const userName = (session?.user as any)?.name || "Administrador"

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        notes: `[PAGO ELIMINADO/ANULADO por ${userName}]: ${deletionReason} | Historial previo: ${payment.notes || 'N/A'}`,
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Pago anulado y archivado en auditoría con éxito" 
    })
  } catch (error) {
    console.error("Error al eliminar/anular el pago:", error)
    return NextResponse.json({ error: "Error interno al procesar la anulación" }, { status: 500 })
  }
}