import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function logAuditAction({
  userId,
  action,
  entity = "TreatmentPlan",
  entityId,
  details
}: {
  userId?: string | null
  action: string
  entity?: string
  entityId: string
  details?: any
}) {
  try {
    if (!userId) return
    const auditModel = (prisma as any).auditLog || (prisma as any).audit
    if (auditModel) {
      await auditModel.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          details: details ? JSON.stringify(details) : null
        }
      })
    }
  } catch (err) {
    console.error("No se pudo registrar la auditoría:", err)
  }
}

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
    const currentUserId = (session?.user as any)?.id || null

    const body = await request.json()
    const { action, input, collaborators, agreementId, agreementName, ...restBody } = body

    // 1. RESTAURAR PLAN DESDE LA PAPELERA
    if (action === "RESTORE") {
      const restoredPlan = await prisma.treatmentPlan.update({
        where: { id },
        data: { status: "DRAFT" }
      })

      await logAuditAction({
        userId: currentUserId,
        action: "RESTORE_PLAN",
        entityId: id,
        details: { status: "DRAFT" }
      })

      return NextResponse.json({ plan: restoredPlan })
    }

    // 2. ACTUALIZAR COLABORADORES
    if (collaborators !== undefined) {
      let finalCollaboratorNames: string[] = []

      if (Array.isArray(collaborators) && collaborators.length > 0) {
        const rawValues = collaborators.map((c: any) => (typeof c === "string" ? c : c.id || c.name)).filter(Boolean)
        const matchedUsers = await prisma.user.findMany({
          where: { id: { in: rawValues } },
          select: { name: true }
        })

        if (matchedUsers.length > 0) {
          finalCollaboratorNames = matchedUsers.map((u) => u.name || "Dr. Colaborador")
        } else {
          finalCollaboratorNames = rawValues
        }
      }

      const updatedPlan = await prisma.treatmentPlan.update({
        where: { id },
        data: { collaborators: finalCollaboratorNames },
        include: {
          doctor: true,
          items: true,
          patient: true,
          agreement: true
        }
      })

      await logAuditAction({
        userId: currentUserId,
        action: "UPDATE_COLLABORATORS",
        entityId: id,
        details: { collaborators: finalCollaboratorNames }
      })

      return NextResponse.json({
        plan: {
          ...updatedPlan,
          discount: updatedPlan.agreement ? Number(updatedPlan.agreement.discountValue) : 0,
          convenio: updatedPlan.agreement?.name || updatedPlan.patient?.convenio || null
        },
        message: "Colaboradores actualizados con éxito"
      })
    }

    const currentPlan = await prisma.treatmentPlan.findUnique({
      where: { id },
      select: { patientId: true }
    })

    const rawData = input ? { ...input } : { ...restBody }

    // 3. PERSISTIR FIRMA Y CONVENIO EN EL MODELO PATIENT
    const targetConvenio = rawData.convenio || agreementName
    if (currentPlan?.patientId && (rawData.signatureBase64 !== undefined || targetConvenio !== undefined)) {
      const patientData: Record<string, any> = {}
      if (rawData.signatureBase64 !== undefined) patientData.signatureBase64 = rawData.signatureBase64
      if (targetConvenio !== undefined) patientData.convenio = targetConvenio

      await prisma.patient.update({
        where: { id: currentPlan.patientId },
        data: patientData
      })
    }

    // 4. CAMPOS DEL MODELO TREATMENT PLAN
    const planData: Record<string, any> = {}
    if (agreementId !== undefined) {
      planData.agreementId = agreementId || null
    } else if (targetConvenio) {
      const agreementRecord = await prisma.agreement.findFirst({
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

    const updatedPlan = await prisma.treatmentPlan.update({
      where: { id },
      data: planData,
      include: {
        doctor: true,
        patient: true,
        items: true,
        agreement: true
      }
    })

    await logAuditAction({
      userId: currentUserId,
      action: "UPDATE_PLAN_DATA",
      entityId: id,
      details: { ...planData, convenio: targetConvenio }
    })

    return NextResponse.json({
      plan: {
        ...updatedPlan,
        discount: updatedPlan.agreement ? Number(updatedPlan.agreement.discountValue) : 0,
        convenio: updatedPlan.agreement?.name || updatedPlan.patient?.convenio || null
      }
    })
  } catch (error: any) {
    console.error("Error PATCH /api/treatments/[id]:", error)
    return NextResponse.json({ error: error.message || "Error al actualizar el plan" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id || null

    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get("force") === "true"

    if (forceDelete) {
      await prisma.treatmentItem.deleteMany({ where: { treatmentPlanId: id } })

      const odontogramModel = (prisma as any).odontogramRecord
      if (odontogramModel) {
        await odontogramModel.deleteMany({ where: { planId: id } })
      }

      await prisma.treatmentPlan.delete({ where: { id } })

      await logAuditAction({
        userId: currentUserId,
        action: "PERMANENT_DELETE_PLAN",
        entityId: id,
        details: { force: true }
      })

      return NextResponse.json({ success: true, message: "Plan destruido permanentemente de la base de datos" })
    }

    await prisma.treatmentPlan.update({
      where: { id },
      data: { status: "CANCELLED" }
    })

    await logAuditAction({
      userId: currentUserId,
      action: "MOVE_TO_TRASH_PLAN",
      entityId: id,
      details: { status: "CANCELLED" }
    })

    return NextResponse.json({ success: true, message: "Plan movido a la papelera (Anulado)" })
  } catch (error) {
    console.error("Error en DELETE /api/treatments/[id]:", error)
    return NextResponse.json({ error: "Error al procesar la eliminación" }, { status: 500 })
  }
}