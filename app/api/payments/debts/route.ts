import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { user }) => {
    const isDoctor = user.role === "DOCTOR"
    const whereCondition: any = { status: { in: ["ACTIVE", "DRAFT", "COMPLETED"] } }
    
    if (isDoctor) whereCondition.doctorId = user.id

    const plans = await prisma.treatmentPlan.findMany({
      where: whereCondition,
      select: {
        id: true, name: true, totalCost: true, totalPaid: true, commercialDiscount: true,
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        doctor: { select: { id: true, name: true } },
        agreement: { select: { discountValue: true } },
        items: { select: { cost: true, discount: true, paidAmount: true, progress: true, isCompleted: true } },
      },
    })

    const debtorList = []
    for (const plan of plans) {
      const agreementDisc = plan.agreement ? Number(plan.agreement.discountValue || 0) : 0
      const commercialDisc = Number(plan.commercialDiscount || 0)
      const effectiveGlobalDiscount = commercialDisc > 0 ? commercialDisc : agreementDisc
      
      let calculatedCost = 0
      let totalPaidFromItems = 0
      let completedCount = 0

      if (plan.items && plan.items.length > 0) {
        for (const itm of plan.items) {
          const cost = Number(itm.cost || 0)
          const itmDisc = Number(itm.discount || 0)
          const effDisc = itmDisc > 0 ? itmDisc : effectiveGlobalDiscount
          calculatedCost += Math.max(0, cost - cost * (effDisc / 100))
          totalPaidFromItems += Number(itm.paidAmount || 0)
          if (itm.isCompleted || Number(itm.progress || 0) === 100) completedCount++
        }
      } else {
        const rawCost = Number(plan.totalCost || 0)
        calculatedCost = Math.max(0, rawCost - rawCost * (effectiveGlobalDiscount / 100))
      }

      const totalPaid = Math.max(Number(plan.totalPaid || 0), totalPaidFromItems)
      const pendingBalance = Math.max(0, calculatedCost - totalPaid)

      if (pendingBalance > 0.05) {
        debtorList.push({
          planId: plan.id, planName: plan.name, patientId: plan.patient?.id,
          patientName: `${plan.patient?.firstName || ""} ${plan.patient?.lastName || ""}`.trim(),
          phone: plan.patient?.phone || null, doctorName: plan.doctor?.name || "Dr. Asignado",
          totalCost: calculatedCost, totalPaid, pendingBalance, completedProcedures: completedCount,
        })
      }
    }

    debtorList.sort((a, b) => b.pendingBalance - a.pendingBalance)
    return { totalCount: debtorList.length, debts: debtorList }
  }
)