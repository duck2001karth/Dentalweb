import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logAuditEvent } from "@/lib/audit"

// Resolución segura de parámetros para App Router (Soporta Next 14 y 15)
async function getSafeId(params: any): Promise<string> {
  const resolvedParams = await Promise.resolve(params)
  return String(resolvedParams?.id || params?.id).trim()
}

export async function GET(request: Request, { params }: any) {
  try {
    const id = await getSafeId(params)
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        doctor: {
          select: { id: true, name: true, email: true, specialty: true }
        },
        patient: {
          select: { id: true, firstName: true, lastName: true, ci: true, convenio: true }
        },
        items: true,
        sections: {
          orderBy: { createdAt: "asc" }
        },
        payments: true,
        agreement: true
      }
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan de tratamiento no encontrado" }, { status: 404 })
    }

    const agreementDisc = plan.agreement ? Number(plan.agreement.discountValue || 0) : 0
    const commercialDisc = Number(plan.commercialDiscount || 0)
    const effectiveDiscount = commercialDisc > 0 ? commercialDisc : agreementDisc
    const agreementName = plan.agreement?.name || plan.patient?.convenio || null

    return NextResponse.json({
      plan: {
        ...plan,
        discount: effectiveDiscount,
        convenio: agreementName
      }
    })
  } catch (error) {
    console.error("Error en GET /api/treatments/[id]:", error)
    return NextResponse.json({ error: "Error al obtener el plan" }, { status: 500 })
  }
}

// 2. ACTUALIZAR PLAN, FASES O COLABORADORES
export async function PATCH(request: Request, { params }: any) {
  try {
    const id = await getSafeId(params)
    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id

    if (!currentUserId) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida para registrar auditoría." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, input, collaborators, agreementId, agreementName, discount, ...restBody } = body

    const result = await prisma.$transaction(async (tx) => {
      const previousPlan = await tx.treatmentPlan.findUnique({
        where: { id },
        include: { agreement: true, patient: true, items: true }
      })

      if (!previousPlan) {
        throw new Error("NOT_FOUND")
      }
      if (action === "RESTORE") {
        const restoredPlan = await tx.treatmentPlan.update({
          where: { id },
          data: { status: "DRAFT" },
          include: {
            doctor: true,
            patient: true,
            items: true,
            sections: true,
            agreement: true
          }
        })
        await logAuditEvent({
          userId: currentUserId,
          action: "RESTORE_PLAN",
          entity: "TreatmentPlan",
          entityId: id,
          patientId: previousPlan.patientId,
          details: `Plan "${previousPlan.name}" restaurado a estado DRAFT`,
          oldData: { status: previousPlan.status },
          newData: { status: "DRAFT" }
        })
        return { plan: restoredPlan }
      }

      // ACCIÓN: ACTUALIZAR COLABORADORES
      if (collaborators !== undefined) {
        let finalCollaboratorNames: string[] = []
        if (Array.isArray(collaborators) && collaborators.length > 0) {
          const rawValues = collaborators
            .map((c: any) => (typeof c === "string" ? c : c.id || c.name))
            .filter(Boolean)
            
          const matchedUsers = await tx.user.findMany({
            where: { id: { in: rawValues } },
            select: { name: true }
          })
          
          if (matchedUsers.length > 0) {
            finalCollaboratorNames = matchedUsers.map((u) => u.name || "Dr. Colaborador")
          } else {
            finalCollaboratorNames = rawValues
          }
        }
        
        const updatedPlan = await tx.treatmentPlan.update({
          where: { id },
          data: { collaborators: finalCollaboratorNames },
          include: {
            doctor: true,
            items: true,
            sections: true,
            patient: true,
            agreement: true
          }
        })
        
        await logAuditEvent({
          userId: currentUserId,
          action: "UPDATE_COLLABORATORS",
          entity: "TreatmentPlan",
          entityId: id,
          patientId: previousPlan.patientId,
          details: `Actualización de especialistas colaboradores en "${previousPlan.name}"`,
          oldData: { collaborators: previousPlan.collaborators },
          newData: { collaborators: finalCollaboratorNames }
        })
        
        const agreementDisc = updatedPlan.agreement ? Number(updatedPlan.agreement.discountValue || 0) : 0
        const commercialDisc = Number(updatedPlan.commercialDiscount || 0)
        const effectiveDiscount = commercialDisc > 0 ? commercialDisc : agreementDisc
        
        return {
          plan: {
            ...updatedPlan,
            discount: effectiveDiscount,
            convenio: updatedPlan.agreement?.name || updatedPlan.patient?.convenio || null
          },
          message: "Colaboradores actualizados con éxito"
        }
      }

      const rawData = input ? { ...input } : { ...restBody }
      const targetConvenio = rawData.convenio || agreementName

      if (previousPlan.patientId && (rawData.signatureBase64 !== undefined || targetConvenio !== undefined)) {
        const patientData: Record<string, any> = {}
        if (rawData.signatureBase64 !== undefined) patientData.signatureBase64 = rawData.signatureBase64
        if (targetConvenio !== undefined) patientData.convenio = targetConvenio
        
        await tx.patient.update({
          where: { id: previousPlan.patientId },
          data: patientData
        })
      }

      const planData: Record<string, any> = {}

      if (agreementId !== undefined) {
        planData.agreementId = agreementId || null
      } else if (targetConvenio) {
        const agreementRecord = await tx.agreement.findFirst({
          where: { name: { equals: targetConvenio, mode: "insensitive" } }
        })
        if (agreementRecord) {
          planData.agreementId = agreementRecord.id
        }
      }

      const targetDiscount = discount !== undefined ? Number(discount) : undefined
      if (targetDiscount !== undefined) {
        planData.commercialDiscount = Math.max(0, targetDiscount)
      }

      if (rawData.commentsToPatient !== undefined) planData.commentsToPatient = rawData.commentsToPatient
      if (rawData.comments !== undefined) planData.commentsToPatient = rawData.comments
      if (rawData.status !== undefined) planData.status = rawData.status
      if (rawData.doctorId !== undefined) planData.doctorId = rawData.doctorId

      const allItems = previousPlan.items || []
      const effectiveGlobalDisc = targetDiscount !== undefined 
        ? targetDiscount 
        : (Number(previousPlan.commercialDiscount || 0) > 0 
            ? Number(previousPlan.commercialDiscount) 
            : Number(previousPlan.agreement?.discountValue || 0))

      const recalculatedTotalCost = allItems.reduce((acc, itm) => {
        const baseCost = Number(itm.cost || 0)
        const itmDisc = Number(itm.discount || 0)
        const effectiveDisc = itmDisc > 0 ? itmDisc : effectiveGlobalDisc
        return acc + Math.max(0, baseCost - baseCost * (effectiveDisc / 100))
      }, 0)

      planData.totalCost = recalculatedTotalCost

      const updatedPlan = await tx.treatmentPlan.update({
        where: { id },
        data: planData,
        include: {
          doctor: true,
          patient: true,
          items: true,
          sections: true,
          agreement: true
        }
      })

      await logAuditEvent({
        userId: currentUserId,
        action: "UPDATE_PLAN_DATA",
        entity: "TreatmentPlan",
        entityId: id,
        patientId: previousPlan.patientId,
        details: `Modificación en plan "${updatedPlan.name}": Costo: $${Number(updatedPlan.totalCost).toFixed(2)}, Estado: ${updatedPlan.status}`,
        oldData: {
          status: previousPlan.status,
          totalCost: previousPlan.totalCost,
          doctorId: previousPlan.doctorId,
          agreementId: previousPlan.agreementId,
          commercialDiscount: previousPlan.commercialDiscount
        },
        newData: {
          status: updatedPlan.status,
          totalCost: updatedPlan.totalCost,
          doctorId: updatedPlan.doctorId,
          agreementId: updatedPlan.agreementId,
          commercialDiscount: updatedPlan.commercialDiscount
        }
      })

      const agreementDisc = updatedPlan.agreement ? Number(updatedPlan.agreement.discountValue || 0) : 0
      const commercialDisc = Number(updatedPlan.commercialDiscount || 0)
      const effectiveDiscount = commercialDisc > 0 ? commercialDisc : agreementDisc

      return {
        plan: {
          ...updatedPlan,
          discount: effectiveDiscount,
          convenio: updatedPlan.agreement?.name || updatedPlan.patient?.convenio || null
        }
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }
    console.error("Error PATCH /api/treatments/[id]:", error)
    return NextResponse.json(
      { error: error.message || "Error al actualizar el plan" },
      { status: 500 }
    )
  }
}

// 3. ANULAR O PURGAR PLAN
export async function DELETE(request: Request, { params }: any) {
  try {
    const id = await getSafeId(params)
    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id

    if (!currentUserId) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida para registrar auditoría." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get("force") === "true"

    const responseData = await prisma.$transaction(async (tx) => {
      const planToDelete = await tx.treatmentPlan.findUnique({
        where: { id },
        include: { items: true, sections: true }
      })

      if (!planToDelete) {
        throw new Error("NOT_FOUND")
      }

      if (forceDelete) {
        await tx.treatmentItem.deleteMany({ where: { treatmentPlanId: id } })
        await tx.treatmentSection.deleteMany({ where: { treatmentPlanId: id } })
        await tx.odontogramRecord.deleteMany({ where: { planId: id } })
        await tx.treatmentPlan.delete({ where: { id } })
        
        await logAuditEvent({
          userId: currentUserId,
          action: "PERMANENT_DELETE_PLAN",
          entity: "TreatmentPlan",
          entityId: id,
          patientId: planToDelete.patientId,
          details: `Eliminación permanente del plan "${planToDelete.name}", sus fases y prestaciones asociadas`,
          oldData: {
            name: planToDelete.name,
            totalCost: planToDelete.totalCost,
            totalPaid: planToDelete.totalPaid,
            status: planToDelete.status,
            itemsCount: planToDelete.items.length,
            sectionsCount: planToDelete.sections.length
          }
        })
        return { success: true, message: "Plan destruido permanentemente de la base de datos" }
      }

      await tx.treatmentPlan.update({
        where: { id },
        data: { status: "CANCELLED" }
      })

      await logAuditEvent({
        userId: currentUserId,
        action: "MOVE_TO_TRASH_PLAN",
        entity: "TreatmentPlan",
        entityId: id,
        patientId: planToDelete.patientId,
        details: `Plan "${planToDelete.name}" enviado a papelera (CANCELLED)`,
        oldData: { status: planToDelete.status },
        newData: { status: "CANCELLED" }
      })

      return { success: true, message: "Plan movido a la papelera (Anulado)" }
    })

    return NextResponse.json(responseData)
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }
    console.error("Error en DELETE /api/treatments/[id]:", error)
    return NextResponse.json(
      { error: "Error al procesar la eliminación" },
      { status: 500 }
    )
  }
}