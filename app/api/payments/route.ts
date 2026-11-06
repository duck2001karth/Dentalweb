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
  if (m.startsWith("TARJETA_CREDITO_") || m.startsWith("TARJETA_DE_CREDITO_")) return "CREDIT_CARD"
  if (m.startsWith("TARJETA_DEBITO")) return "DEBIT_CARD"
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

const createPaymentSchema = z.object({
  destination: z.enum(["COUNTER", "PLAN"]).optional(),
  patientId: z.string().min(1),
  amount: z.coerce.number().finite().positive().max(1_000_000),
  method: z.string().min(1).optional(),
  paymentMethod: z.string().min(1).optional(),
  itemIds: z.array(z.string().min(1)).optional(),
  status: z.enum(["COMPLETED", "PENDING"]).default("COMPLETED"),
  treatmentPlanId: z.string().min(1).nullish(),
  reference: z.string().trim().max(150).nullish(),
  receiptNumber: z.string().trim().max(100).nullish(),
  receiptImage: z.string().max(2_000_000).nullish(),
  notes: z.string().trim().max(5000).nullish(),
}).strict().refine(
  (data) => Boolean(data.method || data.paymentMethod),
  {
    message: "Selecciona un método de cobro",
    path: ["method"],
  }
)

// Compatibilidad B2: el endpoint /approve firma JSON.stringify(snapshot) antes de
// guardarlo. PostgreSQL jsonb puede devolver las propiedades en otro orden.
// Reconstruimos exclusivamente el orden ORIGINAL de ese endpoint y comparamos
// contra el SHA-256 almacenado. No se omite ni se reemplaza la verificación.
const ORIGINAL_SNAPSHOT_KEYS = [
  "planId", "patientId", "name", "agreementId", "commercialDiscount",
  "globalDiscount", "commentsToPatient", "items", "amount",
] as const
const ORIGINAL_ITEM_KEYS = ["id", "name", "tooth", "cost", "discount", "net"] as const

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function restoreOriginalSnapshotOrder(snapshot: unknown): Record<string, unknown> | null {
  if (!isPlainRecord(snapshot)) return null
  // No se ignoran propiedades inesperadas: cualquier cambio en la evidencia
  // sigue invalidando la aprobación.
  const allowedSnapshotKeys = new Set<string>(ORIGINAL_SNAPSHOT_KEYS)
  if (Object.keys(snapshot).some((key) => !allowedSnapshotKeys.has(key))) return null
  if (!Array.isArray(snapshot.items) || snapshot.items.length === 0) return null

  const originalItems: Record<string, unknown>[] = []
  const allowedItemKeys = new Set<string>(ORIGINAL_ITEM_KEYS)
  for (const item of snapshot.items) {
    if (!isPlainRecord(item) || Object.keys(item).some((key) => !allowedItemKeys.has(key))) return null
    const orderedItem: Record<string, unknown> = {}
    for (const key of ORIGINAL_ITEM_KEYS) {
      if (Object.prototype.hasOwnProperty.call(item, key)) orderedItem[key] = item[key]
    }
    originalItems.push(orderedItem)
  }

  const orderedSnapshot: Record<string, unknown> = {}
  for (const key of ORIGINAL_SNAPSHOT_KEYS) {
    if (key === "items") {
      orderedSnapshot.items = originalItems
    } else if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
      orderedSnapshot[key] = snapshot[key]
    }
  }
  return orderedSnapshot
}

function hasValidApprovalHash(snapshot: unknown, expectedHash: string): boolean {
  if (typeof expectedHash !== "string" || !/^[0-9a-f]{64}$/i.test(expectedHash)) return false
  if (!isPlainRecord(snapshot) || !Array.isArray(snapshot.items) || snapshot.items.length === 0) return false
  const hash = (value: unknown) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex")

  // Compatible con el orden directo si la base de datos lo preserva.
  if (hash(snapshot) === expectedHash.toLowerCase()) return true
  // Para jsonb, verificar la serialización EXACTA usada al crear B2.
  const restored = restoreOriginalSnapshotOrder(snapshot)
  return restored !== null && hash(restored) === expectedHash.toLowerCase()
}

const money = (v: number) => Math.round(v * 100)

export const POST = createApiHandler(
  { roles: ["ADMIN", "RECEPTIONIST", "DOCTOR"], schema: createPaymentSchema },
  async (_req, { user, data }) => {
    const {
      patientId, amount, method, paymentMethod, itemIds, status, treatmentPlanId,
      reference, receiptNumber, receiptImage, notes,
    } = data
    // La ficha de paciente sigue usando paymentMethod y itemIds: compatibilidad controlada.
    const destination = data.destination ?? (treatmentPlanId ? "PLAN" : "COUNTER")
    if (!method && !paymentMethod) {
      return NextResponse.json({ error: "Selecciona un método de cobro" }, { status: 400 })
    }
    const validMethod = normalizePrismaPaymentMethod(method || paymentMethod)
    const amountCents = money(amount)
    if (amountCents <= 0 || Math.abs(amount - amountCents / 100) > 0.00001) {
      return NextResponse.json({ error: "Introduce un importe válido con máximo dos decimales" }, { status: 400 })
    }
    if ((validMethod === "TRANSFER" || validMethod === "CREDIT_CARD" || validMethod === "DEBIT_CARD") && !reference?.trim()) {
      return NextResponse.json({ error: "Indica la referencia o número de comprobante" }, { status: 400 })
    }
    if (receiptImage) {
      const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(receiptImage)
      if (!match || receiptImage.length > 2_000_000) {
        return NextResponse.json({ error: "El comprobante debe ser PNG, JPG o WEBP y menor de 1 MB" }, { status: 400 })
      }
      const binary = Buffer.from(match[2], "base64")
      const png = binary.length >= 8 && binary.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      const jpeg = binary.length >= 3 && binary[0] === 255 && binary[1] === 216 && binary[2] === 255
      const webp = binary.length >= 12 && binary.toString("ascii",0,4)==="RIFF" && binary.toString("ascii",8,12)==="WEBP"
      if (binary.length > 900 * 1024 || !((match[1] === "png" && png) || (match[1] === "jpeg" && jpeg) || (match[1] === "webp" && webp))) {
        return NextResponse.json({ error: "El comprobante no tiene un formato de imagen permitido o supera 900 KB" }, { status: 400 })
      }
    }
    if (destination === "COUNTER" && treatmentPlanId) {
      return NextResponse.json({ error: "Los cobros de Mostrador no deben incluir un plan" }, { status: 400 })
    }
    if (destination === "PLAN" && (!treatmentPlanId || status !== "COMPLETED")) {
      return NextResponse.json({ error: "Selecciona un plan aprobado; los abonos a plan deben estar completados" }, { status: 400 })
    }
    if (destination === "COUNTER" && !notes?.trim()) {
      return NextResponse.json({ error: "Indica el concepto del cobro de Mostrador" }, { status: 400 })
    }

    const h = await headers()
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null
    const userAgent = h.get("user-agent") || null
    const finalReceiptNumber = receiptNumber?.trim() ||
      `REC-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`

    try {
      const result = await prisma.$transaction(async (tx) => {
        const patient = await tx.patient.findUnique({ where: { id: patientId }, select: { id: true } })
        if (!patient) return { error: "Paciente no encontrado", status: 404 } as const

        let allocations: { id: string; procedureName: string; appliedAmount: number }[] = []
        if (destination === "PLAN") {
          const planId = treatmentPlanId!
          const plan = await tx.treatmentPlan.findUnique({
            where: { id: planId },
            include: {
              items: { orderBy: { id: "asc" } },
              approvals: { orderBy: { approvedAt: "desc" }, take: 1 },
            },
          })
          if (!plan || plan.patientId !== patientId) {
            return { error: "El plan no pertenece al paciente", status: 400 } as const
          }
          if (plan.status !== "ACTIVE") {
            return { error: "El plan debe estar ACTIVE y aprobado para registrar abonos", status: 409 } as const
          }
          const approval = plan.approvals[0]
          if (!approval) {
            return { error: "Este plan no tiene aprobación B2. No se puede cobrar hasta regularizar su autorización", status: 409 } as const
          }
          const snapshot = approval.snapshot as any
          const approvedItems = Array.isArray(snapshot?.items) ? snapshot.items : []
          if (!hasValidApprovalHash(snapshot, approval.snapshotHash)) {
            return { error: "La evidencia del presupuesto aprobado es inválida", status: 409 } as const
          }
          if (plan.items.length !== approvedItems.length) {
            return { error: "Las prestaciones cambiaron después de aprobar el presupuesto", status: 409 } as const
          }
          const currentById = new Map(plan.items.map(item => [item.id, item]))
          let remaining = amountCents
          let approvedTotalCents = 0
          const chosenIds = itemIds?.length ? new Set(itemIds) : null
          if (chosenIds && chosenIds.size !== itemIds?.length) {
            return { error: "Hay prestaciones repetidas", status: 400 } as const
          }
          const entries: { item: (typeof plan.items)[number]; dueCents: number }[] = []
          for (const saved of approvedItems) {
            const item = currentById.get(String(saved.id))
            const net = Number(saved.net)
            if (!item || !Number.isFinite(net) || net < 0 ||
                Number(item.cost) !== Number(saved.cost) || Number(item.discount) !== Number(saved.discount) ||
                item.procedureName !== saved.name || (item.tooth ?? null) !== (saved.tooth ?? null)) {
              return { error: "El plan difiere del presupuesto firmado; requiere revisión", status: 409 } as const
            }
            const netCents = money(net)
            const paidCents = money(Number(item.paidAmount || 0))
            if (paidCents < 0 || paidCents > netCents) {
              return { error: "Saldo de prestación inconsistente", status: 409 } as const
            }
            approvedTotalCents += netCents
            if (!chosenIds || chosenIds.has(item.id)) entries.push({ item, dueCents: netCents - paidCents })
          }
          if (approvedTotalCents !== money(Number(approval.approvedAmount)) ||
              approvedTotalCents !== money(Number(plan.totalCost))) {
            return { error: "El total actual no coincide con el presupuesto aprobado", status: 409 } as const
          }
          if (chosenIds && (entries.length !== chosenIds.size || entries.length === 0)) {
            return { error: "Selecciona prestaciones válidas del plan aprobado", status: 400 } as const
          }
          const totalDue = entries.reduce((sum, e) => sum + e.dueCents, 0)
          if (amountCents > totalDue || totalDue <= 0) {
            return { error: "El cobro supera el saldo disponible del plan", status: 409 } as const
          }
          for (const { item, dueCents } of entries) {
            const used = Math.min(remaining, dueCents)
            if (used <= 0) continue
            const newPaidCents = money(Number(item.paidAmount || 0)) + used
            await tx.treatmentItem.update({
              where: { id: item.id },
              data: { paidAmount: newPaidCents / 100, isPaid: newPaidCents === money(Number(approvedItems.find((i: any) => i.id === item.id).net)) },
            })
            allocations.push({ id: item.id, procedureName: item.procedureName, appliedAmount: used / 100 })
            remaining -= used
          }
          if (remaining !== 0) throw new Error("Asignación de pagos incompleta")
          const paidAfter = plan.items.reduce((sum, item) => sum + money(Number(item.paidAmount || 0)), 0) + amountCents
          await tx.treatmentPlan.update({
            where: { id: planId },
            data: { totalPaid: paidAfter / 100, status: paidAfter >= approvedTotalCents ? "COMPLETED" : "ACTIVE" },
          })
        }

        const payment = await tx.payment.create({
          data: {
            patientId, amount: amountCents / 100, method: validMethod as any,
            status, reference: reference?.trim() || null,
            receiptImage: receiptImage || null,
            treatmentPlanId: destination === "PLAN" ? treatmentPlanId : null,
            processedById: user.id, receiptNumber: finalReceiptNumber, notes: notes?.trim() || null,
          },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, ci: true } },
            treatmentPlan: { select: { id: true, name: true } },
            processedBy: { select: { id: true, name: true, specialty: true, role: true } },
          },
        })
        await tx.auditLog.create({ data: {
          userId: user.id, action: "CREATE_PAYMENT", entity: "PAYMENT", entityId: payment.id,
          patientId, details: `Cobro ${destination} ${status} $${payment.amount} [${validMethod}] - ${finalReceiptNumber}`,
          newData: { amount: payment.amount, method: validMethod, status, destination,
            receiptNumber: finalReceiptNumber, treatmentPlanId: payment.treatmentPlanId, allocations },
          ipAddress, userAgent,
        } })
        return { payment } as const
      }, { isolationLevel: "Serializable", timeout: 15000 })

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }
      return { success: true, message: "Cobro registrado correctamente", payment: result.payment }
    } catch (error: any) {
      if (error?.code === "P2002") {
        return NextResponse.json({ error: "El número de recibo ya existe. Comprueba si se registró el cobro antes de reintentar." }, { status: 409 })
      }
      if (error?.code === "P2034") {
        return NextResponse.json({ error: "Otro movimiento se procesó al mismo tiempo. Revisa los cobros registrados antes de reintentar." }, { status: 409 })
      }
      throw error
    }
  }
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "RECEPTIONIST", "DOCTOR"], schema: z.object({
    id: z.string().min(1).optional(), paymentId: z.string().min(1).optional(),
    method: z.string().optional(), paymentMethod: z.string().optional(),
    reference: z.string().max(150).nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
    receiptNumber: z.string().min(1).max(100).nullable().optional(),
  }).strict() },
  async (req, { user, data }) => {
    const paymentId = data.id || data.paymentId
    if (!paymentId) throw new Error("Se requiere el ID del pago para actualizar")

    const { method, paymentMethod, reference, notes, receiptNumber } = data

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