import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"
import crypto from "crypto"
import { NextResponse } from "next/server"

// Función original intacta
const normalizePrismaPaymentMethod = (method?: string): string => {
  if (!method) return "CASH"
  const m = method.toUpperCase().trim()
  switch (m) {
    case "EFECTIVO": case "CASH": return "CASH"
    case "TARJETA_CREDITO": case "TARJETA_DE_CREDITO": case "CREDIT_CARD": case "TARJETA": return "CREDIT_CARD"
    case "TARJETA_DEBITO": case "TARJETA_DE_DEBITO": case "DEBIT_CARD": return "DEBIT_CARD"
    case "TRANSFERENCIA": case "TRANSFERENCIA_BANCARIA": case "TRANSFER": case "DEUNA": case "DE_UNA": case "BANCO_PICHINCHA": case "BANCO_GUAYAQUIL": case "PRODUBANCO": case "QR": return "TRANSFER"
    case "CHEQUE": case "CHECK": return "CHECK"
    default: throw new Error("Método de pago no reconocido")
  }
}

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { searchParams }) => {
    const patientId = searchParams.get("patientId")
    const dateParam = searchParams.get("date")
    const currentShift = searchParams.get("currentShift") === "true"

    const lastClose = await prisma.cashRegisterClose.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, countedCash: true, status: true },
    })

    const whereClause: any = {}
    if (patientId) whereClause.patientId = patientId

    if (dateParam) {
      const targetDate = new Date(dateParam)
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
      whereClause.createdAt = { gte: startOfDay, lte: endOfDay }
    } else if (currentShift && lastClose) {
      whereClause.createdAt = { gt: lastClose.createdAt }
    }

    const rawPayments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, ci: true, convenio: true } },
        treatmentPlan: { select: { id: true, name: true, totalPaid: true, totalCost: true, agreement: true, items: true } },
        processedBy: { select: { id: true, name: true, specialty: true, role: true } },
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

        const matchesId = ref.paymentId === payment.id || ref.originalPaymentId === payment.id || refRaw.toLowerCase().includes(pId)
        const matchesReceipt = pReceipt && pReceipt !== "S/N" && refRaw.includes(pReceipt)
        const refReceipt = String(ref.receiptNumber || ref.refundNumber || "").toUpperCase()
        const matchesGeneratedReceipt = pId.length >= 6 && refReceipt.toLowerCase().includes(pId.slice(-6))
        
        const hasFiscalDoc = Boolean((payment.taxDocuments && payment.taxDocuments.length > 0) || payment.invoiceNumber)
        const matchesPlanAndInvoice = hasFiscalDoc && payment.treatmentPlanId && ref.treatmentPlanId === payment.treatmentPlanId && refAmount === pAmount

        return matchesId || matchesReceipt || matchesGeneratedReceipt || matchesPlanAndInvoice
      })

      return { ...payment, hasCreditNote: Boolean(hasTaxNC || matchingRefund) }
    })

    return { payments, lastClose: lastClose || null }
  }
)

export const POST = createApiHandler(
  { roles: ["ADMIN", "RECEPTIONIST", "DOCTOR"], schema: z.object({
    patientId: z.string().min(1),
    amount: z.coerce.number().finite().positive(),
    paymentMethod: z.string().optional(),
    method: z.string().optional(),
    reference: z.string().nullable().optional(),
    itemIds: z.array(z.string().min(1)).optional(),
    receiptImage: z.string().nullable().optional(),
    treatmentPlanId: z.string().min(1),
    receiptNumber: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  }) },
  async (_req, { user, data }) => {
    const { patientId, amount, paymentMethod, method, reference, itemIds,
      receiptImage, treatmentPlanId, receiptNumber, notes } = data
    const validMethod = normalizePrismaPaymentMethod(paymentMethod || method)
    const ids = [...new Set(itemIds ?? [])]

    if (!ids.length) {
      return NextResponse.json({ error: "Selecciona las prestaciones que se abonarán" }, { status: 400 })
    }
    if (!Number.isInteger(Math.round(amount * 100)) || Math.round(amount * 100) <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    // SERIALIZABLE permite reintentar la operación completa si hay conflicto.
    // Para idempotencia fuerte se requiere una clave única persistida por intento.
    const result = await prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({
        where: { id: treatmentPlanId },
        select: { id: true, patientId: true, commercialDiscount: true,
          agreement: { select: { discountValue: true } } },
      })
      if (!plan || plan.patientId !== patientId) {
        return { error: "El plan no pertenece al paciente", status: 400 } as const
      }
      const selectedItems = await tx.treatmentItem.findMany({
        where: { treatmentPlanId, id: { in: ids } },
        orderBy: { id: "asc" },
      })
      if (selectedItems.length !== ids.length) {
        return { error: "Una o más prestaciones no pertenecen al plan", status: 400 } as const
      }
      const globalDiscount = Number(plan.commercialDiscount || 0) > 0
        ? Number(plan.commercialDiscount)
        : Number(plan.agreement?.discountValue || 0)
      if (!Number.isFinite(globalDiscount) || globalDiscount < 0 || globalDiscount > 100) {
        return { error: "Descuento global inválido", status: 400 } as const
      }
      const allocations = selectedItems.map(item => {
        const cost = Number(item.cost ?? 0)
        const individual = Number(item.discount ?? 0)
        const discount = individual > 0 ? individual : globalDiscount
        if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(discount) || discount < 0 || discount > 100) {
          throw new Error("Costo o descuento de prestación inválido")
        }
        const dueCents = Math.max(0, Math.round(cost * (100 - discount)) -
          Math.round(Number(item.paidAmount ?? 0) * 100))
        return { item, dueCents }
      })
      const amountCents = Math.round(amount * 100)
      const totalDue = allocations.reduce((a, b) => a + b.dueCents, 0)
      if (amountCents > totalDue) {
        return { error: "El pago supera el saldo de las prestaciones seleccionadas", status: 400 } as const
      }
      if (totalDue <= 0) {
        return { error: "Las prestaciones seleccionadas no tienen saldo", status: 400 } as const
      }

      let remaining = amountCents
      const applied: Array<{ id: string; procedureName: string; tooth: string; appliedAmount: number }> = []
      for (const { item, dueCents } of allocations) {
        const cents = Math.min(remaining, dueCents)
        if (!cents) continue
        const newPaid = (Math.round(Number(item.paidAmount ?? 0) * 100) + cents) / 100
        await tx.treatmentItem.update({
          where: { id: item.id },
          data: { paidAmount: newPaid, isPaid: cents === dueCents },
        })
        applied.push({ id: item.id, procedureName: item.procedureName || "Prestación",
          tooth: item.tooth || "General", appliedAmount: cents / 100 })
        remaining -= cents
      }
      if (remaining !== 0) throw new Error("El pago no pudo asignarse por completo")

      const allItems = await tx.treatmentItem.findMany({ where: { treatmentPlanId } })
      const totalPaid = allItems.reduce((sum, item) => sum + Number(item.paidAmount ?? 0), 0)
      const completed = allItems.length > 0 && allItems.every(item => {
        const discount = Number(item.discount ?? 0) > 0 ? Number(item.discount) : globalDiscount
        const net = Math.round(Number(item.cost ?? 0) * (100 - discount)) / 100
        return Number(item.paidAmount ?? 0) >= net - 0.005
      })
      await tx.treatmentPlan.update({ where: { id: treatmentPlanId },
        data: { totalPaid, status: completed ? "COMPLETED" : "ACTIVE" } })

      const finalReceiptNumber = receiptNumber?.trim() ||
        `REC-${new Date().toISOString().slice(2,10).replace(/-/g, "")}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
      const payment = await tx.payment.create({
        data: { patientId, amount: amountCents / 100, method: validMethod as any,
          reference: reference?.trim() || null, receiptImage: receiptImage || null,
          treatmentPlanId, processedById: user.id, receiptNumber: finalReceiptNumber,
          notes: notes?.trim() || JSON.stringify(applied) },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, ci: true } },
          treatmentPlan: { select: { id: true, name: true } },
          processedBy: { select: { id: true, name: true, specialty: true, role: true } },
        },
      })
      await tx.auditLog.create({ data: {
        userId: user.id, action: "CREATE_PAYMENT", entity: "PAYMENT",
        entityId: payment.id, patientId,
        details: `Cobro registrado: $${amount.toFixed(2)} [${validMethod}] - Recibo #${finalReceiptNumber}`,
        newData: { amount: amountCents / 100, method: validMethod,
          receiptNumber: finalReceiptNumber, treatmentPlanId, allocations: applied },
        ipAddress, userAgent,
      } })
      return { payment } as const
    }, { isolationLevel: "Serializable", timeout: 15000 })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return { success: true, message: "Pago registrado correctamente", payment: result.payment }
  }
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.any() },
  async (req, { user, data }) => {
    const paymentId = data.id || data.paymentId
    if (!paymentId) throw new Error("Se requiere el ID del pago para actualizar")

    const { method, paymentMethod, reference, notes, receiptNumber, amount } = data
    if (amount !== undefined) {
      return NextResponse.json({ error: "No se permite editar el importe de un pago confirmado. Utiliza el procedimiento contable de ajuste." }, { status: 409 })
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const previous = await tx.payment.findUnique({ where: { id: paymentId } })
      if (!previous) throw new Error("NOT_FOUND")

      const rawMethod = method || paymentMethod
      const validMethod = rawMethod ? normalizePrismaPaymentMethod(rawMethod) : undefined

      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          ...(validMethod && { method: validMethod as any }),
          ...(reference !== undefined && { reference }),
          ...(notes !== undefined && { notes }),
          ...(receiptNumber !== undefined && { receiptNumber }),
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, ci: true } },
          treatmentPlan: { select: { id: true, name: true } },
          processedBy: { select: { id: true, name: true, role: true } },
        },
      })


      const headersList = await headers()
      const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_PAYMENT",
          entity: "PAYMENT",
          entityId: paymentId,
          patientId: previous.patientId,
          details: `Edición de pago #${updated.receiptNumber || paymentId}: monto ${previous.amount} -> ${updated.amount}`,
          oldData: { 
            method: previous.method, 
            reference: previous.reference, 
            amount: previous.amount, 
            receiptNumber: previous.receiptNumber 
          },          newData: { method: updated.method, reference: updated.reference, amount: updated.amount, receiptNumber: updated.receiptNumber },
          ipAddress,
          userAgent: headersList.get("user-agent") || "Desconocido",
        },
      })

      return updated
    })

    return { success: true, message: "Pago actualizado correctamente", payment: updatedPayment }
  }
)