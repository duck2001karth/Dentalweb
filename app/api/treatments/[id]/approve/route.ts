import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { headers } from "next/headers"
import { createHash } from "crypto"
import { z } from "zod"

const schema = z.object({ confirmed: z.literal(true), signatureBase64: z.string().optional() }).strict()

const handler = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema },
  async (req, { user, params, data }) => {
    const id = params.id as string
    const h = await headers()
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null
    const userAgent = h.get("user-agent") || null

    return prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({
        where: { id }, include: { patient: { select: { id: true, signatureBase64: true } }, items: true, agreement: true }
      })
      if (!plan) throw new Error("PLAN_NOT_FOUND")
      if (plan.status !== "DRAFT") throw new Error("PLAN_NOT_DRAFT")
      if (plan.items.length === 0) throw new Error("PLAN_EMPTY")
      if (plan.items.some(i => !Number.isFinite(i.cost) || i.cost < 0 || i.discount < 0 || i.discount > 100)) throw new Error("INVALID_ITEM_AMOUNT")
      if (plan.commercialDiscount < 0 || plan.commercialDiscount > 100) throw new Error("INVALID_DISCOUNT")
      const signature = data.signatureBase64 || plan.patient.signatureBase64
      if (!signature || !signature.startsWith("data:image/")) throw new Error("PATIENT_SIGNATURE_REQUIRED")
      const globalDiscount = Number(plan.commercialDiscount) > 0 ? Number(plan.commercialDiscount) :
        (plan.agreement?.discountType === "PERCENTAGE" ? Number(plan.agreement.discountValue) : 0)
      if (!Number.isFinite(globalDiscount) || globalDiscount < 0 || globalDiscount > 100) throw new Error("INVALID_GLOBAL_DISCOUNT")
      const items = [...plan.items].sort((a,b) => a.id.localeCompare(b.id)).map(i => ({
        id: i.id, name: i.procedureName, tooth: i.tooth, cost: i.cost, discount: i.discount,
        net: Math.round(i.cost * (1 - (i.discount > 0 ? i.discount : globalDiscount)/100) * 100) / 100
      }))
      const amount = Math.round(items.reduce((sum,i) => sum + i.net, 0) * 100) / 100
      const snapshot = { planId: plan.id, patientId: plan.patientId, name: plan.name,
        agreementId: plan.agreementId, commercialDiscount: plan.commercialDiscount,
        globalDiscount, commentsToPatient: plan.commentsToPatient, items, amount }
      const snapshotHash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex")

      // La transición condicionada impide registrar aprobaciones duplicadas concurrentes.
      const updated = await tx.treatmentPlan.updateMany({ where: { id, status: "DRAFT" }, data: { status: "ACTIVE", totalCost: amount } })
      if (updated.count !== 1) throw new Error("PLAN_ALREADY_APPROVED")
      const approval = await tx.treatmentApproval.create({ data: {
        treatmentPlanId: id, patientId: plan.patientId, approvedById: user.id, approvedAmount: amount,
        snapshotHash, snapshot, signatureBase64: signature,
        evidence: { confirmation: "Autorización explícita registrada en interfaz", signatureSource: data.signatureBase64 ? "new" : "patient_profile", ipAddress, userAgent }
      } })
      // Solo al aprobar con firma nueva se actualiza la firma de perfil.
      if (data.signatureBase64) await tx.patient.update({ where: { id: plan.patientId }, data: { signatureBase64: data.signatureBase64 } })
      await tx.auditLog.create({ data: { userId: user.id, action: "APPROVE_TREATMENT_PLAN", entity: "TreatmentPlan",
        entityId: id, patientId: plan.patientId, details: `Aprobación ${approval.id}, total ${amount}`,
        newData: { approvalId: approval.id, snapshotHash, approvedAmount: amount, status: "ACTIVE" },
        ipAddress, userAgent } })
      return { success: true, message: "Presupuesto aprobado", approvalId: approval.id, approvedAmount: amount }
    })
  }
)

export const POST = handler
