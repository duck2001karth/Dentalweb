import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/db"

const normalizePrismaPaymentMethod = (method?: string): any => {
  if (!method) return "CASH"
  const m = method.toUpperCase().trim()

  switch (m) {
    case "EFECTIVO":
    case "CASH":
      return "CASH"
    case "TARJETA_CREDITO":
    case "TARJETA_DE_CREDITO":
    case "CREDIT_CARD":
    case "TARJETA":
      return "CREDIT_CARD"
    case "TARJETA_DEBITO":
    case "TARJETA_DE_DEBITO":
    case "DEBIT_CARD":
      return "DEBIT_CARD"
    case "TRANSFERENCIA":
    case "TRANSFERENCIA_BANCARIA":
    case "TRANSFER":
    case "DEUNA":
    case "DE_UNA":
    case "BANCO_PICHINCHA":
    case "BANCO_GUAYAQUIL":
    case "PRODUBANCO":
    case "QR":
      return "TRANSFER"
    case "CHEQUE":
    case "CHECK":
      return "CHECK"
    default:
      return "CASH"
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const dateParam = searchParams.get("date") 

    // Filtro base: Excluir pagos anulados para el conteo real
    const whereClause: any = {
      NOT: {
        notes: { contains: "[PAGO ELIMINADO" }
      }
    }
    if (patientId) {
      whereClause.patientId = patientId
    }

    // Filtro de fecha para el Arqueo Diario
    if (dateParam) {
      const targetDate = new Date(dateParam)
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, ci: true }
        },
        treatmentPlan: {
          select: { 
            id: true, 
            name: true,
            totalPaid: true,
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
    const { 
      patientId, 
      amount, 
      paymentMethod, 
      reference, 
      itemIds, 
      receiptImage, 
      treatmentPlanId 
    } = body

    const parsedAmount = parseFloat(amount || 0)

    if (!patientId || parsedAmount <= 0) {
      return NextResponse.json({ error: "Monto o paciente no válido" }, { status: 400 })
    }

    let targetItemIds: string[] = itemIds || []
    
    // LÓGICA DE DISTRIBUCIÓN AUTOMÁTICA EN PRESTACIONES
    if (targetItemIds.length === 0) {
      if (treatmentPlanId) {
        const planItems = await prisma.treatmentItem.findMany({
          where: { treatmentPlanId },
        })

        for (const item of planItems) {
          const cost = Number(item.cost || 0)
          const dscto = Number(item.discount || 0)
          const finalCost = cost - (cost * (dscto / 100))
          const paid = Number(item.paidAmount || 0)

          if (finalCost - paid > 0 && !item.isPaid) {
            targetItemIds.push(item.id)
          }
        }
      } else {
        const activePlans = await prisma.treatmentPlan.findMany({
          where: { patientId, status: { not: "CANCELLED" } },
          include: { items: true },
        })

        for (const p of activePlans) {
          if (p.items && Array.isArray(p.items)) {
            for (const item of p.items) {
              const cost = Number(item.cost || 0)
              const dscto = Number(item.discount || 0)
              const finalCost = cost - (cost * (dscto / 100))
              const paid = Number(item.paidAmount || 0)

              if (finalCost - paid > 0 && !item.isPaid) {
                targetItemIds.push(item.id)
              }
            }
          }
        }
      }
    }

    // DISTRIBUIR EL DINERO
    const itemsToPay = await prisma.treatmentItem.findMany({
      where: { id: { in: targetItemIds } },
    })

    let remainingMoneyToDistribute = parsedAmount
    const planIdsToUpdate = new Set<string>()
    const paidSnapshotItems: any[] = []

    if (treatmentPlanId) {
      planIdsToUpdate.add(treatmentPlanId)
    }

    for (const item of itemsToPay) {
      if (remainingMoneyToDistribute <= 0) break

      planIdsToUpdate.add(item.treatmentPlanId)

      const cost = Number(item.cost || 0)
      const dscto = Number(item.discount || 0)
      const itemFinalPrice = cost - (cost * (dscto / 100))
      const currentPaid = Number(item.paidAmount || 0)
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

    //ACTUALIZAR ESTADO DEL PLAN (Total pagado)
    for (const planId of Array.from(planIdsToUpdate)) {
      const allPlanItems = await prisma.treatmentItem.findMany({
        where: { treatmentPlanId: planId },
      })

      let totalPaidForPlan = 0
      let allItemsPaid = false

      if (allPlanItems.length > 0) {
        totalPaidForPlan = allPlanItems.reduce((acc, i) => acc + (Number(i.paidAmount) || 0), 0)
        allItemsPaid = allPlanItems.every(
          (i) => i.isPaid || (Number(i.paidAmount) || 0) >= (Number(i.cost) || 0) - ((Number(i.cost) || 0) * ((Number(i.discount) || 0) / 100)) - 0.01
        )
      } else {
        const currentPlan = await prisma.treatmentPlan.findUnique({ where: { id: planId } })
        totalPaidForPlan = (Number(currentPlan?.totalPaid) || 0) + parsedAmount
      }

      await prisma.treatmentPlan.update({
        where: { id: planId },
        data: {
          totalPaid: totalPaidForPlan,
          status: allItemsPaid ? "COMPLETED" : "ACTIVE",
        },
      })
    }

    //CREAR EL REGISTRO FINAL DE CAJA
    const validMethod = normalizePrismaPaymentMethod(paymentMethod)
    const primaryPlanId = treatmentPlanId || (planIdsToUpdate.size > 0 ? Array.from(planIdsToUpdate)[0] : null)
    const currentUserId = (session?.user as any)?.id || null

    const newPaymentRecord = await prisma.payment.create({
      data: {
        patientId,
        amount: parsedAmount,
        method: validMethod,
        reference: reference || null,
        receiptImage: receiptImage || null,
        treatmentPlanId: primaryPlanId || undefined,
        processedById: currentUserId || undefined,
        notes: paidSnapshotItems.length > 0 
          ? JSON.stringify(paidSnapshotItems) 
          : `Abono directo al tratamiento: $${parsedAmount.toFixed(2)}`,
        receiptNumber: body.receiptNumber || `#REC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, ci: true } },
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