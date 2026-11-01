import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params }) => {
    const id = params.id as string
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        doctor: { select: { id: true, name: true, email: true, specialty: true } },
        patient: { select: { id: true, firstName: true, lastName: true, ci: true, convenio: true } },
        items: true,
        sections: { orderBy: { createdAt: "asc" } },
        payments: true,
        agreement: true
      }
    })

    if (!plan) throw new Error("NOT_FOUND")

    const agreementDisc = plan.agreement ? Number(plan.agreement.discountValue || 0) : 0
    const commercialDisc = Number(plan.commercialDiscount || 0)
    const effectiveDiscount = commercialDisc > 0 ? commercialDisc : agreementDisc
    const agreementName = plan.agreement?.name || plan.patient?.convenio || null

    return {
      plan: { ...plan, discount: effectiveDiscount, convenio: agreementName }
    }
  }
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.any() },
  async (req, { user, params, data }) => {
    const id = params.id as string
    const { action, input, collaborators, agreementId, agreementName, discount, ...restBody } = data

    const result = await prisma.$transaction(async (tx) => {
      const previousPlan = await tx.treatmentPlan.findUnique({
        where: { id },
        include: { agreement: true, patient: true, items: true }
      })
      if (!previousPlan) throw new Error("NOT_FOUND")

      if (action === "RESTORE") {
        const restoredPlan = await tx.treatmentPlan.update({
          where: { id }, data: { status: "DRAFT" },
          include: { doctor: true, patient: true, items: true, sections: true, agreement: true }
        })
        await tx.auditLog.create({
          data: {
            userId: user.id, action: "RESTORE_PLAN", entity: "TreatmentPlan", entityId: id, patientId: previousPlan.patientId,
            details: `Plan "${previousPlan.name}" restaurado a estado DRAFT`,
            oldData: { status: previousPlan.status }, newData: { status: "DRAFT" }
          }
        })
        return { plan: restoredPlan }
      }

      if (collaborators !== undefined) {
        let finalCollaboratorNames: string[] = []
        if (Array.isArray(collaborators) && collaborators.length > 0) {
          const rawValues = collaborators.map((c: any) => (typeof c === "string" ? c : c.id || c.name)).filter(Boolean)
          const matchedUsers = await tx.user.findMany({ where: { id: { in: rawValues } }, select: { name: true } })
          finalCollaboratorNames = matchedUsers.length > 0 ? matchedUsers.map((u) => u.name || "Dr. Colaborador") : rawValues
        }
        
        const updatedPlan = await tx.treatmentPlan.update({
          where: { id }, data: { collaborators: finalCollaboratorNames },
          include: { doctor: true, items: true, sections: true, patient: true, agreement: true }
        })
        await tx.auditLog.create({
          data: {
            userId: user.id, action: "UPDATE_COLLABORATORS", entity: "TreatmentPlan", entityId: id, patientId: previousPlan.patientId,
            details: `Actualización de especialistas colaboradores en "${previousPlan.name}"`,
            oldData: { collaborators: previousPlan.collaborators }, newData: { collaborators: finalCollaboratorNames }
          }
        })
        
        const agreementDisc = updatedPlan.agreement ? Number(updatedPlan.agreement.discountValue || 0) : 0
        const commercialDisc = Number(updatedPlan.commercialDiscount || 0)
        return {
          plan: { ...updatedPlan, discount: commercialDisc > 0 ? commercialDisc : agreementDisc, convenio: updatedPlan.agreement?.name || updatedPlan.patient?.convenio || null },
          message: "Colaboradores actualizados con éxito"
        }
      }

      const rawData = input ? { ...input } : { ...restBody }
      const targetConvenio = rawData.convenio || agreementName

      if (previousPlan.patientId && (rawData.signatureBase64 !== undefined || targetConvenio !== undefined)) {
        const patientData: Record<string, any> = {}
        if (rawData.signatureBase64 !== undefined) patientData.signatureBase64 = rawData.signatureBase64
        if (targetConvenio !== undefined) patientData.convenio = targetConvenio
        await tx.patient.update({ where: { id: previousPlan.patientId }, data: patientData })
      }

      const planData: Record<string, any> = {}
      if (agreementId !== undefined) {
        planData.agreementId = agreementId || null
      } else if (targetConvenio) {
        const agreementRecord = await tx.agreement.findFirst({ where: { name: { equals: targetConvenio, mode: "insensitive" } } })
        if (agreementRecord) planData.agreementId = agreementRecord.id
      }

      const targetDiscount = discount !== undefined ? Number(discount) : undefined
      if (targetDiscount !== undefined) planData.commercialDiscount = Math.max(0, targetDiscount)
      if (rawData.commentsToPatient !== undefined) planData.commentsToPatient = rawData.commentsToPatient
      if (rawData.comments !== undefined) planData.commentsToPatient = rawData.comments
      if (rawData.status !== undefined) planData.status = rawData.status
      if (rawData.doctorId !== undefined) planData.doctorId = rawData.doctorId

      const allItems = previousPlan.items || []
      const effectiveGlobalDisc = targetDiscount !== undefined ? targetDiscount : (Number(previousPlan.commercialDiscount || 0) > 0 ? Number(previousPlan.commercialDiscount) : Number(previousPlan.agreement?.discountValue || 0))
      
      const recalculatedTotalCost = allItems.reduce((acc, itm) => {
        const baseCost = Number(itm.cost || 0)
        const itmDisc = Number(itm.discount || 0)
        const effectiveDisc = itmDisc > 0 ? itmDisc : effectiveGlobalDisc
        return acc + Math.max(0, baseCost - baseCost * (effectiveDisc / 100))
      }, 0)
      planData.totalCost = recalculatedTotalCost

      const updatedPlan = await tx.treatmentPlan.update({
        where: { id }, data: planData,
        include: { doctor: true, patient: true, items: true, sections: true, agreement: true }
      })

      await tx.auditLog.create({
        data: {
          userId: user.id, action: "UPDATE_PLAN_DATA", entity: "TreatmentPlan", entityId: id, patientId: previousPlan.patientId,
          details: `Modificación en plan "${updatedPlan.name}": Costo: $${Number(updatedPlan.totalCost).toFixed(2)}, Estado: ${updatedPlan.status}`,
          oldData: { status: previousPlan.status, totalCost: previousPlan.totalCost, doctorId: previousPlan.doctorId, agreementId: previousPlan.agreementId, commercialDiscount: previousPlan.commercialDiscount },
          newData: { status: updatedPlan.status, totalCost: updatedPlan.totalCost, doctorId: updatedPlan.doctorId, agreementId: updatedPlan.agreementId, commercialDiscount: updatedPlan.commercialDiscount }
        }
      })

      const agreementDisc = updatedPlan.agreement ? Number(updatedPlan.agreement.discountValue || 0) : 0
      const commercialDisc = Number(updatedPlan.commercialDiscount || 0)
      return {
        plan: { ...updatedPlan, discount: commercialDisc > 0 ? commercialDisc : agreementDisc, convenio: updatedPlan.agreement?.name || updatedPlan.patient?.convenio || null }
      }
    })

    return result
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN"] },
  async (req, { user, params, searchParams }) => {
    const id = params.id as string
    const forceDelete = searchParams.get("force") === "true"

    const responseData = await prisma.$transaction(async (tx) => {
      const planToDelete = await tx.treatmentPlan.findUnique({
        where: { id },
        include: { items: true, sections: true }
      })
      if (!planToDelete) throw new Error("NOT_FOUND")

      if (forceDelete) {
        await tx.treatmentItem.deleteMany({ where: { treatmentPlanId: id } })
        await tx.treatmentSection.deleteMany({ where: { treatmentPlanId: id } })
        await tx.odontogramRecord.deleteMany({ where: { planId: id } })
        await tx.treatmentPlan.delete({ where: { id } })
        
        await tx.auditLog.create({
          data: {
            userId: user.id, action: "PERMANENT_DELETE_PLAN", entity: "TreatmentPlan", entityId: id, patientId: planToDelete.patientId,
            details: `Eliminación permanente del plan "${planToDelete.name}", sus fases y prestaciones asociadas`,
            oldData: { name: planToDelete.name, totalCost: planToDelete.totalCost, totalPaid: planToDelete.totalPaid, status: planToDelete.status, itemsCount: planToDelete.items.length, sectionsCount: planToDelete.sections.length }
          }
        })
        return { success: true, message: "Plan destruido permanentemente de la base de datos" }
      }

      await tx.treatmentPlan.update({ where: { id }, data: { status: "CANCELLED" } })
      await tx.auditLog.create({
        data: {
          userId: user.id, action: "MOVE_TO_TRASH_PLAN", entity: "TreatmentPlan", entityId: id, patientId: planToDelete.patientId,
          details: `Plan "${planToDelete.name}" enviado a papelera (CANCELLED)`,
          oldData: { status: planToDelete.status }, newData: { status: "CANCELLED" }
        }
      })
      return { success: true, message: "Plan movido a la papelera (Anulado)" }
    })

    return responseData
  }
)