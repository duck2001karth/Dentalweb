import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { headers } from "next/headers"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        doctor: true,
        patient: true,
        items: true,
        payments: true,
        agreement: true 
      }
    })

    if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    const effectiveDiscount = plan.agreement ? Number(plan.agreement.discountValue) : 0
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id

    if (!currentUserId) {
      return NextResponse.json({ error: "No autorizado. Sesión requerida para auditoría." }, { status: 401 })
    }

    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const body = await request.json()
    const { action, input, collaborators, agreementId, agreementName, ...restBody } = body

    const result = await prisma.$transaction(async (tx) => {
      const previousPlan = await tx.treatmentPlan.findUnique({
        where: { id },
        include: { agreement: true, patient: true }
      })

      if (!previousPlan) {
        throw new Error("NOT_FOUND")
      }
      if (action === "RESTORE") {
        const restoredPlan = await tx.treatmentPlan.update({
          where: { id },
          data: { status: "DRAFT" }
        })

        await tx.auditLog.create({
          data: {
            userId: currentUserId,
            action: "RESTORE_PLAN",
            entity: "TreatmentPlan",
            entityId: id,
            patientId: previousPlan.patientId,
            details: `Plan "${previousPlan.name}" restaurado a DRAFT`,
            oldData: { status: previousPlan.status },
            newData: { status: "DRAFT" },
            ipAddress,
            userAgent
          }
        })

        return { plan: restoredPlan }
      }
      if (collaborators !== undefined) {
        let finalCollaboratorNames: string[] = []

        if (Array.isArray(collaborators) && collaborators.length > 0) {
          const rawValues = collaborators.map((c: any) => (typeof c === "string" ? c : c.id || c.name)).filter(Boolean)
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
            patient: true,
            agreement: true
          }
        })

        await tx.auditLog.create({
          data: {
            userId: currentUserId,
            action: "UPDATE_COLLABORATORS",
            entity: "TreatmentPlan",
            entityId: id,
            patientId: previousPlan.patientId,
            details: `Actualización de especialistas colaboradores en "${previousPlan.name}"`,
            oldData: { collaborators: previousPlan.collaborators },
            newData: { collaborators: finalCollaboratorNames },
            ipAddress,
            userAgent
          }
        })

        return {
          plan: {
            ...updatedPlan,
            discount: updatedPlan.agreement ? Number(updatedPlan.agreement.discountValue) : 0,
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

      if (rawData.status !== undefined) planData.status = rawData.status
      if (rawData.commentsToPatient !== undefined) planData.commentsToPatient = rawData.commentsToPatient
      if (rawData.comments !== undefined) planData.commentsToPatient = rawData.comments
      if (rawData.totalCost !== undefined) planData.totalCost = Number(rawData.totalCost)
      if (rawData.doctorId !== undefined) planData.doctorId = rawData.doctorId

      const updatedPlan = await tx.treatmentPlan.update({
        where: { id },
        data: planData,
        include: {
          doctor: true,
          patient: true,
          items: true,
          agreement: true
        }
      })

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: "UPDATE_PLAN_DATA",
          entity: "TreatmentPlan",
          entityId: id,
          patientId: previousPlan.patientId,
          details: `Modificación en plan "${updatedPlan.name}": Costo: $${updatedPlan.totalCost}, Estado: ${updatedPlan.status}`,
          oldData: {
            status: previousPlan.status,
            totalCost: previousPlan.totalCost,
            doctorId: previousPlan.doctorId,
            agreementId: previousPlan.agreementId,
            commentsToPatient: previousPlan.commentsToPatient
          },
          newData: {
            status: updatedPlan.status,
            totalCost: updatedPlan.totalCost,
            doctorId: updatedPlan.doctorId,
            agreementId: updatedPlan.agreementId,
            commentsToPatient: updatedPlan.commentsToPatient
          },
          ipAddress,
          userAgent
        }
      })

      return {
        plan: {
          ...updatedPlan,
          discount: updatedPlan.agreement ? Number(updatedPlan.agreement.discountValue) : 0,
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
    return NextResponse.json({ error: error.message || "Error al actualizar el plan" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id

    if (!currentUserId) {
      return NextResponse.json({ error: "No autorizado. Sesión requerida para registrar auditoría." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get("force") === "true"

    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const responseData = await prisma.$transaction(async (tx) => {
      const planToDelete = await tx.treatmentPlan.findUnique({
        where: { id },
        include: { items: true }
      })

      if (!planToDelete) {
        throw new Error("NOT_FOUND")
      }

      if (forceDelete) {
        await tx.treatmentItem.deleteMany({ where: { treatmentPlanId: id } })
        await tx.odontogramRecord.deleteMany({ where: { planId: id } })
        await tx.treatmentPlan.delete({ where: { id } })

        await tx.auditLog.create({
          data: {
            userId: currentUserId,
            action: "PERMANENT_DELETE_PLAN",
            entity: "TreatmentPlan",
            entityId: id,
            patientId: planToDelete.patientId,
            details: `Eliminación permanente del plan "${planToDelete.name}" y sus prestaciones asociadas`,
            oldData: {
              name: planToDelete.name,
              totalCost: planToDelete.totalCost,
              totalPaid: planToDelete.totalPaid,
              status: planToDelete.status,
              itemsCount: planToDelete.items.length
            },
            newData: undefined,
            ipAddress,
            userAgent
          }
        })

        return { success: true, message: "Plan destruido permanentemente de la base de datos" }
      }


      await tx.treatmentPlan.update({
        where: { id },
        data: { status: "CANCELLED" }
      })

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: "MOVE_TO_TRASH_PLAN",
          entity: "TreatmentPlan",
          entityId: id,
          patientId: planToDelete.patientId,
          details: `Plan "${planToDelete.name}" enviado a papelera (CANCELLED)`,
          oldData: { status: planToDelete.status },
          newData: { status: "CANCELLED" },
          ipAddress,
          userAgent
        }
      })

      return { success: true, message: "Plan movido a la papelera (Anulado)" }
    })

    return NextResponse.json(responseData)
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }
    console.error("Error en DELETE /api/treatments/[id]:", error)
    return NextResponse.json({ error: "Error al procesar la eliminación" }, { status: 500 })
  }
}