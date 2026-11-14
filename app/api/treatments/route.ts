import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

const planPatientSelect = {
  id: true,
  firstName: true,
  lastName: true,
  ci: true,
  convenio: true,
} satisfies Prisma.PatientSelect


const cashierItemSelect = {
  id: true,
  treatmentPlanId: true,
  sectionId: true,
  procedureName: true,
  cost: true,
  discount: true,
  paidAmount: true,
  isPaid: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TreatmentItemSelect

const cashierAgreementSelect = {
  id: true,
  name: true,
  institutionName: true,
  discountType: true,
  discountValue: true,
} satisfies Prisma.AgreementSelect

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { user, searchParams }) => {
    const patientId = searchParams.get("patientId")?.trim() || null
    const search = searchParams.get("search")?.trim().slice(0, 120) || null
    const status = searchParams.get("status")?.trim().slice(0, 40) || null
    const isReceptionist = user.role === "RECEPTIONIST"

    const where: Prisma.TreatmentPlanWhereInput = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
        { patient: { ci: { contains: search, mode: "insensitive" } } },
      ]
    }

    const plans = await prisma.treatmentPlan.findMany({
      where,
      include: {
        patient: { select: planPatientSelect },
        doctor: {
          select: isReceptionist
            ? { id: true, name: true }
            : { id: true, name: true, email: true },
        },
        items: isReceptionist ? { select: cashierItemSelect } : true,
        sections: { orderBy: { createdAt: "asc" } },
        agreement: isReceptionist
          ? { select: cashierAgreementSelect }
          : true,
      },
      orderBy: { createdAt: "desc" },
    })

    const computedPlans = plans.map((plan: any) => {
      const agreementDiscount = plan.agreement ? Number(plan.agreement.discountValue) : 0
      const commercialDiscount = Number(plan.commercialDiscount || 0)
      const effectiveGlobalDiscount = commercialDiscount > 0 ? commercialDiscount : agreementDiscount

      let calculatedSubtotal = 0
      if (plan.items && plan.items.length > 0) {
        calculatedSubtotal = plan.items.reduce((acc: number, item: any) => {
          const cost = Number(item.cost || 0)
          const itemDisc = Number(item.discount || 0)
          const effectiveDisc = itemDisc > 0 ? itemDisc : effectiveGlobalDiscount
          return acc + (cost - cost * (effectiveDisc / 100))
        }, 0)
      } else {
        const rawCost = Number(plan.totalCost || 0)
        calculatedSubtotal = Math.max(0, rawCost - rawCost * (effectiveGlobalDiscount / 100))
      }

      const totalPaid = Number(plan.totalPaid || 0)
      const pendingBalance = Math.max(0, calculatedSubtotal - totalPaid)

      const computed = {
        ...plan,
        discount: effectiveGlobalDiscount,
        totalCost: calculatedSubtotal,
        pendingBalance,
      }

      if (!isReceptionist) return computed

      const { commentsToPatient: _privateComments, ...cashierPlan } = computed
      return cashierPlan
    })

    return computedPlans
  }
)

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"], schema: z.any() },
  async (_req, { user, data }) => {
    const input = data?.input && typeof data.input === "object" && !Array.isArray(data.input)
      ? data.input
      : data

    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json({ error: "Datos de plan inválidos" }, { status: 400 })
    }

    const patientId = typeof input.patientId === "string" ? input.patientId.trim() : ""
    const name = typeof input.name === "string" ? input.name.trim() : ""

    if (!patientId || !name) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios (Paciente o Nombre)" },
        { status: 400 }
      )
    }
    if (patientId.length > 100 || name.length > 200) {
      return NextResponse.json({ error: "Datos del plan fuera de los límites permitidos" }, { status: 400 })
    }

    const percentage = Number(input.commercialDiscount ?? 0)
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      return NextResponse.json({ error: "Descuento comercial fuera de rango (0-100)" }, { status: 400 })
    }

    const optionalId = (value: unknown) =>
      value === undefined || value === null || value === "" ||
      (typeof value === "string" && value.trim().length > 0 && value.trim().length <= 100)

    if (!optionalId(input.doctorId) || !optionalId(input.agreementId)) {
      return NextResponse.json({ error: "Identificador de profesional o convenio inválido" }, { status: 400 })
    }

    const collaborators = input.collaborators ?? []
    if (
      !Array.isArray(collaborators) ||
      collaborators.length > 100 ||
      !collaborators.every((value: unknown) =>
        typeof value === "string" && value.trim().length > 0 && value.length <= 200
      )
    ) {
      return NextResponse.json({ error: "Lista de colaboradores inválida" }, { status: 400 })
    }

    const patientExists = await prisma.patient.findFirst({
      where: { id: patientId, isDeleted: false },
      select: { id: true },
    })
    if (!patientExists) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }
    const headersList = await headers()
    const ipAddress = (
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1"
    ).slice(0, 128)
    const userAgent = (headersList.get("user-agent") || "Desconocido").slice(0, 512)

    const result = await prisma.$transaction(async (tx) => {
      const newPlan = await tx.treatmentPlan.create({
        data: {
          name,
          patientId,
          doctorId: typeof input.doctorId === "string" ? input.doctorId.trim() || null : null,
          agreementId: typeof input.agreementId === "string" ? input.agreementId.trim() || null : null,
          commercialDiscount: percentage,
          collaborators,
          status: "DRAFT",
          totalCost: 0,
          totalPaid: 0,
        },
        include: {
          agreement: true,
          patient: { select: planPatientSelect },
          doctor: { select: { id: true, name: true, email: true } },
          items: true,
          sections: { orderBy: { createdAt: "asc" } },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE_TREATMENT_PLAN",
          entity: "TreatmentPlan",
          entityId: newPlan.id,
          patientId: newPlan.patientId,
          details: `Creación de plan de tratamiento: "${newPlan.name}" con costo inicial de $${Number(newPlan.totalCost).toFixed(2)}`,
          newData: {
            id: newPlan.id,
            name: newPlan.name,
            status: newPlan.status,
            totalCost: newPlan.totalCost,
            doctorId: newPlan.doctorId,
            agreementId: newPlan.agreementId,
            commercialDiscount: newPlan.commercialDiscount,
          },
          ipAddress,
          userAgent,
        },
      })
      return newPlan
    })
    return { message: "Plan creado exitosamente", plan: result }
  }
)
