import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/db"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ error: "patientId es requerido" }, { status: 400 })
    }

    const payments = await prisma.payment.findMany({
      where: { patientId },
      include: {
        treatmentPlan: {
          select: { 
            id: true, 
            name: true,
            items: {
              select: {
                id: true,
                procedureName: true,
                tooth: true,
                cost: true,
                paidAmount: true,
                isPaid: true
              }
            }
          }
        },
        processedBy: {
          select: { id: true, name: true, specialty: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    return NextResponse.json({ error: "Error al obtener historial de pagos" }, { status: 500 })
  }
}
export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    const body = await request.json()
    const { patientId, amount, paymentMethod, reference, itemIds, receiptImage, treatmentPlanId } = body

    const parsedAmount = parseFloat(amount || 0)

    if (!patientId || parsedAmount <= 0) {
      return NextResponse.json({ error: "Monto o paciente no válido" }, { status: 400 })
    }

    let targetItemIds = itemIds || []

    if (targetItemIds.length === 0) {
      const activePlans = await prisma.treatmentPlan.findMany({
        where: { patientId, status: { not: "CANCELLED" } },
        include: { items: true },
      })

      for (const p of activePlans) {
        for (const item of p.items) {
          const cost = item.cost || 0
          const dscto = item.discount || 0
          const finalCost = cost - (cost * (dscto / 100))
          const paid = item.paidAmount || 0

          if (finalCost - paid > 0 && !item.isPaid) {
            targetItemIds.push(item.id)
          }
        }
      }
    }

    const itemsToPay = await prisma.treatmentItem.findMany({
      where: { id: { in: targetItemIds } },
    })

    let remainingMoneyToDistribute = parsedAmount
    const planIdsToUpdate = new Set<string>()
    const paidSnapshotItems: any[] = []

    for (const item of itemsToPay) {
      if (remainingMoneyToDistribute <= 0) break

      planIdsToUpdate.add(item.treatmentPlanId)

      const cost = item.cost || 0
      const dscto = item.discount || 0
      const itemFinalPrice = cost - (cost * (dscto / 100))
      const currentPaid = item.paidAmount || 0
      const pendingDebt = Math.max(0, itemFinalPrice - currentPaid)

      const moneyForThisItem = Math.min(remainingMoneyToDistribute, pendingDebt)
      const newPaidAmount = currentPaid + moneyForThisItem
      const isFullyPaid = newPaidAmount >= itemFinalPrice - 0.01

      await prisma.treatmentItem.update({
        where: { id: item.id },
        data: {
          paidAmount: newPaidAmount,
          isPaid: isFullyPaid,
        },
      })
      paidSnapshotItems.push({
        procedureName: item.procedureName || "Procedimiento Odontológico",
        tooth: item.tooth || "General",
        appliedAmount: moneyForThisItem,
      })

      remainingMoneyToDistribute -= moneyForThisItem
    }

    for (const planId of Array.from(planIdsToUpdate)) {
      const allPlanItems = await prisma.treatmentItem.findMany({
        where: { treatmentPlanId: planId },
      })

      const totalPaidForPlan = allPlanItems.reduce((acc, i) => acc + (i.paidAmount || 0), 0)
      const allItemsPaid = allPlanItems.every(
        (i) => i.isPaid || (i.paidAmount || 0) >= (i.cost || 0) - ((i.cost || 0) * ((i.discount || 0) / 100)) - 0.01
      )

      await prisma.treatmentPlan.update({
        where: { id: planId },
        data: {
          totalPaid: totalPaidForPlan,
          status: allItemsPaid ? "COMPLETED" : undefined,
        },
      })
    }

    const primaryPlanId = treatmentPlanId || (planIdsToUpdate.size > 0 ? Array.from(planIdsToUpdate)[0] : null)
    const currentUserId = (session?.user as any)?.id || null

    const newPaymentRecord = await prisma.payment.create({
      data: {
        patientId,
        amount: parsedAmount,
        method: paymentMethod || "CASH",
        reference: reference || null,
        receiptImage: receiptImage || null,
        treatmentPlanId: primaryPlanId || undefined,
        processedById: currentUserId || undefined,
        notes: JSON.stringify(paidSnapshotItems),
      },
      include: {
        treatmentPlan: { select: { id: true, name: true } },
        processedBy: { select: { id: true, name: true, specialty: true, role: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Pago registrado y aplicado correctamente",
      payment: newPaymentRecord,
    })
  } catch (error) {
    console.error("Error al procesar el pago:", error)
    return NextResponse.json({ error: "Error interno al procesar el pago" }, { status: 500 })
  }
}