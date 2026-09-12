import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { headers } from "next/headers"

const normalizePrismaPaymentMethod = (method?: string): string => {
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
    const currentShift = searchParams.get("currentShift") === "true"

    const lastClose = await prisma.cashRegisterClose.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, countedCash: true, status: true },
    })

    const whereClause: any = {
    }

    if (patientId) {
      whereClause.patientId = patientId
    }

    if (dateParam) {
      const targetDate = new Date(dateParam)
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      }
    } else if (currentShift && lastClose) {
      whereClause.createdAt = {
        gt: lastClose.createdAt,
      }
    }

    const rawPayments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, ci: true },
        },
        treatmentPlan: {
          select: {
            id: true,
            name: true,
            totalPaid: true,
            items: true,
          },
        },
        processedBy: {
          select: { id: true, name: true, specialty: true, role: true },
        },
        taxDocuments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const refundTransactions = rawPayments.filter((p: any) => {
      const amt = Number(p.amount || p.paidAmount || 0)
      const notes = typeof p.notes === "string" ? p.notes.toUpperCase() : ""
      return amt < 0 || notes.includes("DEVOLUCION") || notes.includes("DEVOLUCIÓN") || notes.includes("NOTA")
    })
    const payments = rawPayments.map((payment: any) => {
      const pId = String(payment.id).toLowerCase()
      const pReceipt = String(payment.receiptNumber || "").trim().toUpperCase()
      const pAmount = Math.abs(Number(payment.amount || payment.paidAmount || 0))
      const hasTaxNC = payment.taxDocuments?.some((d: any) => d.docType === "NOTA_CREDITO")
      const matchingRefund = refundTransactions.find((ref: any) => {
        if (ref.id === payment.id) return false

        const refNotes = typeof ref.notes === "string" ? ref.notes.toUpperCase() : ""
        const refRef = typeof ref.reference === "string" ? ref.reference.toUpperCase() : ""
        const refRaw = `${refNotes} ${refRef}`
        const refAmount = Math.abs(Number(ref.amount || ref.paidAmount || 0))
        const matchesId =
          ref.paymentId === payment.id ||
          ref.originalPaymentId === payment.id ||
          refRaw.toLowerCase().includes(pId)
        const matchesReceipt = pReceipt && pReceipt !== "S/N" && refRaw.includes(pReceipt)
        const refReceipt = String(ref.receiptNumber || ref.refundNumber || "").toUpperCase()
        const matchesGeneratedReceipt = pId.length >= 6 && refReceipt.toLowerCase().includes(pId.slice(-6))
        const hasFiscalDoc = Boolean(
          (payment.taxDocuments && payment.taxDocuments.length > 0) ||
          payment.invoiceNumber
        )
        const matchesPlanAndInvoice =
          hasFiscalDoc &&
          payment.treatmentPlanId &&
          ref.treatmentPlanId === payment.treatmentPlanId &&
          refAmount === pAmount

        return matchesId || matchesReceipt || matchesGeneratedReceipt || matchesPlanAndInvoice
      })

      const hasCreditNote = Boolean(hasTaxNC || matchingRefund)

      return {
        ...payment,
        hasCreditNote,
      }
    })

    return NextResponse.json({
      payments,
      lastClose: lastClose || null,
    })
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    return NextResponse.json({ error: "Error al obtener historial de pagos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const {
      patientId,
      amount,
      paymentMethod,
      reference,
      itemIds,
      receiptImage,
      treatmentPlanId,
      receiptNumber,
    } = body

    const parsedAmount = parseFloat(amount || 0)

    if (!patientId || parsedAmount <= 0) {
      return NextResponse.json({ error: "Monto o paciente no válido" }, { status: 400 })
    }
    const patientExists = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    })
    if (!patientExists) {
      return NextResponse.json({ error: "El paciente indicado no existe" }, { status: 404 })
    }
    const sessionUserId = (session?.user as any)?.id
    let validProcessorId: string | null = null

    if (sessionUserId) {
      const userExists = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { id: true },
      })
      if (userExists) validProcessorId = userExists.id
    }

    if (!validProcessorId && session?.user?.email) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      })
      if (userByEmail) validProcessorId = userByEmail.id
    }

    // 3. Resolver prestaciones objetivo
    let targetItemIds: string[] = Array.isArray(itemIds) ? [...itemIds] : []

    if (targetItemIds.length === 0) {
      if (treatmentPlanId) {
        const planItems = await prisma.treatmentItem.findMany({
          where: { treatmentPlanId },
        })

        for (const item of planItems) {
          const cost = Number(item.cost || 0)
          const dscto = Number(item.discount || 0)
          const finalCost = cost - cost * (dscto / 100)
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
              const finalCost = cost - cost * (dscto / 100)
              const paid = Number(item.paidAmount || 0)

              if (finalCost - paid > 0 && !item.isPaid) {
                targetItemIds.push(item.id)
              }
            }
          }
        }
      }
    }
    const result = await prisma.$transaction(async (tx) => {
      const itemsToPay = await tx.treatmentItem.findMany({
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
        const itemFinalPrice = cost - cost * (dscto / 100)
        const currentPaid = Number(item.paidAmount || 0)
        const pendingDebt = Math.max(0, itemFinalPrice - currentPaid)

        const moneyForThisItem = Math.min(remainingMoneyToDistribute, pendingDebt)
        const newPaidAmount = currentPaid + moneyForThisItem
        const isFullyPaid = newPaidAmount >= itemFinalPrice - 0.01

        await tx.treatmentItem.update({
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
        const allPlanItems = await tx.treatmentItem.findMany({
          where: { treatmentPlanId: planId },
        })

        let totalPaidForPlan = 0
        let allItemsPaid = false

        if (allPlanItems.length > 0) {
          totalPaidForPlan = allPlanItems.reduce((acc, i) => acc + (Number(i.paidAmount) || 0), 0)
          allItemsPaid = allPlanItems.every(
            (i) =>
              i.isPaid ||
              (Number(i.paidAmount) || 0) >=
                Number(i.cost || 0) - Number(i.cost || 0) * (Number(i.discount || 0) / 100) - 0.01
          )
        } else {
          const currentPlan = await tx.treatmentPlan.findUnique({ where: { id: planId } })
          totalPaidForPlan = (Number(currentPlan?.totalPaid) || 0) + parsedAmount
        }

        await tx.treatmentPlan.update({
          where: { id: planId },
          data: {
            totalPaid: totalPaidForPlan,
            status: allItemsPaid ? "COMPLETED" : "ACTIVE",
          },
        })
      }
      let finalReceiptNumber = receiptNumber?.trim()
      if (!finalReceiptNumber) {
        const totalPaymentsCount = await tx.payment.count()
        const nextSequence = totalPaymentsCount + 1
        finalReceiptNumber = `REC-${nextSequence.toString().padStart(5, "0")}`
      }

      const validMethod = normalizePrismaPaymentMethod(paymentMethod)
      const primaryPlanId =
        treatmentPlanId || (planIdsToUpdate.size > 0 ? Array.from(planIdsToUpdate)[0] : null)

      const newPayment = await tx.payment.create({
        data: {
          patientId,
          amount: parsedAmount,
          method: validMethod as any,
          reference: reference?.trim() || null,
          receiptImage: receiptImage || null,
          treatmentPlanId: primaryPlanId || null,
          processedById: validProcessorId || null,
          notes:
            paidSnapshotItems.length > 0
              ? JSON.stringify(paidSnapshotItems)
              : `Abono directo al tratamiento: $${parsedAmount.toFixed(2)}`,
          receiptNumber: finalReceiptNumber,
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, ci: true } },
          treatmentPlan: { select: { id: true, name: true } },
          processedBy: { select: { id: true, name: true, specialty: true, role: true } },
        },
      })

      // Registro en auditoría
      if (validProcessorId) {
        try {
          const headersList = await headers()
          const forwardedFor = headersList.get("x-forwarded-for")
          const ipAddress = forwardedFor
            ? forwardedFor.split(",")[0].trim()
            : headersList.get("x-real-ip") || "127.0.0.1"
          const userAgent = headersList.get("user-agent") || "Desconocido"

          await tx.auditLog.create({
            data: {
              userId: validProcessorId,
              action: "CREATE",
              entity: "PAYMENT",
              entityId: newPayment.id,
              patientId,
              details: `Cobro registrado: $${parsedAmount.toFixed(2)} [${validMethod}] - Recibo #${finalReceiptNumber}`,
              newData: {
                amount: parsedAmount,
                method: validMethod,
                reference: reference || null,
                receiptNumber: finalReceiptNumber,
              },
              ipAddress,
              userAgent,
            },
          })
        } catch (auditErr) {
          console.error("Error al registrar auditoría de pago:", auditErr)
        }
      }

      return newPayment
    })

    return NextResponse.json({
      success: true,
      message: "Pago registrado y aplicado correctamente",
      payment: result,
    })
  } catch (error: any) {
    console.error("Error al procesar el pago:", error)
    return NextResponse.json(
      { error: error?.message || "Error interno al procesar el pago" },
      { status: 500 }
    )
  }
}
export async function PATCH(request: Request) {
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

    const body = await request.json()
    const paymentId = body.id || body.paymentId

    if (!paymentId) {
      return NextResponse.json(
        { error: "Se requiere el ID del pago para actualizar" },
        { status: 400 }
      )
    }

    const { method, reference, notes, receiptNumber, amount } = body

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const previous = await tx.payment.findUnique({
        where: { id: paymentId },
      })

      if (!previous) {
        throw new Error("NOT_FOUND")
      }

      const parsedAmount = amount !== undefined ? parseFloat(amount) : undefined
      const validMethod = method ? normalizePrismaPaymentMethod(method) : undefined

      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          ...(validMethod && { method: validMethod as any }),
          ...(reference !== undefined && { reference }),
          ...(notes !== undefined && { notes }),
          ...(receiptNumber !== undefined && { receiptNumber }),
          ...(parsedAmount !== undefined && !isNaN(parsedAmount) && { amount: parsedAmount }),
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, ci: true } },
          treatmentPlan: { select: { id: true, name: true } },
          processedBy: { select: { id: true, name: true, role: true } },
        },
      })

      try {
        const headersList = await headers()
        const forwardedFor = headersList.get("x-forwarded-for")
        const ipAddress = forwardedFor
          ? forwardedFor.split(",")[0].trim()
          : headersList.get("x-real-ip") || "127.0.0.1"
        const userAgent = headersList.get("user-agent") || "Desconocido"

        await tx.auditLog.create({
          data: {
            userId: currentUser.id,
            action: "UPDATE",
            entity: "PAYMENT",
            entityId: paymentId,
            patientId: previous.patientId,
            details: `Edición de pago #${updated.receiptNumber || paymentId}: método actualizado a ${updated.method}`,
            oldData: {
              method: previous.method,
              reference: previous.reference,
              amount: previous.amount,
              receiptNumber: previous.receiptNumber,
            },
            newData: {
              method: updated.method,
              reference: updated.reference,
              amount: updated.amount,
              receiptNumber: updated.receiptNumber,
            },
            ipAddress,
            userAgent,
          },
        })
      } catch (auditErr) {
        console.error("Error al registrar auditoría en PATCH /api/payments:", auditErr)
      }

      return updated
    })

    return NextResponse.json({
      success: true,
      message: "Pago actualizado correctamente",
      payment: updatedPayment,
    })
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "El pago no existe" }, { status: 404 })
    }
    console.error("Error en PATCH /api/payments:", error)
    return NextResponse.json(
      { error: error?.message || "Error interno al actualizar el pago" },
      { status: 500 }
    )
  }
}