import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth" 

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
    const session = await getServerSession(authOptions)
    const { id: paymentId } = await params
    
    let deletionReason = "Sin motivo especificado"
    let isPermanent = false

    try {
      const body = await request.json()
      if (body?.reason) deletionReason = body.reason
      if (body?.permanent) isPermanent = true
    } catch (e) {}
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { 
        treatmentPlan: { 
          include: { items: true } 
        } 
      }
    })

    if (!payment) {
      return NextResponse.json({ success: true, message: "El registro ya no existe o fue purgado" }, { status: 200 })
    }

    const planId = payment.treatmentPlanId
    const plan = payment.treatmentPlan
    if (isPermanent) {
      // Purgar de la tabla Payment
      await prisma.payment.deleteMany({
        where: { id: paymentId }
      })
      if (planId && plan) {
        await syncPlanFinancials(planId, plan.items)
      }

      return NextResponse.json({ 
        success: true, 
        message: "Registro purgado definitivamente y saldo sincronizado" 
      })
    }
    const userName = (session?.user as any)?.name || "Administrador"

    // Marcar como anulado en notas
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        notes: `[PAGO ELIMINADO/ANULADO por ${userName}]: ${deletionReason} | Historial previo: ${payment.notes || 'N/A'}`,
      }
    })
    if (planId && plan) {
      await syncPlanFinancials(planId, plan.items)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Pago anulado y archivado en auditoría con éxito" 
    })
  } catch (error) {
    console.error("Error al eliminar/anular el pago:", error)
    return NextResponse.json({ error: "Error interno al procesar la anulación" }, { status: 500 })
  }
}

async function syncPlanFinancials(planId: string, items: any[] = []) {
  const activePayments = await prisma.payment.findMany({
    where: {
      treatmentPlanId: planId,
      NOT: {
        notes: { contains: "[PAGO ELIMINADO" }
      }
    }
  })

  const realTotalPaid = activePayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)

  let remainingPaidToDistribute = realTotalPaid

  for (const item of items) {
    const itemCost = Number(item.cost || item.price || 0)
    const discount = Number(item.discount || 0)
    const itemFinalPrice = itemCost - (itemCost * (discount / 100))

    let itemPaid = 0
    if (remainingPaidToDistribute > 0) {
      itemPaid = Math.min(itemFinalPrice, remainingPaidToDistribute)
      remainingPaidToDistribute -= itemPaid
    }

    await prisma.treatmentItem.update({
      where: { id: item.id },
      data: {
        paidAmount: itemPaid,
        isPaid: itemPaid >= itemFinalPrice && itemFinalPrice > 0
      }
    })
  }

  await prisma.treatmentPlan.update({
    where: { id: planId },
    data: {
      totalPaid: realTotalPaid,
      status: "ACTIVE"
    }
  })
}