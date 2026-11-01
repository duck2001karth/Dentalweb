import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { user }) => {
    const isDoctor = user.role === "DOCTOR"
    const canSeeFinancialDebts = ["ADMIN", "RECEPTIONIST", "DOCTOR"].includes(user.role)

    const whereClause: any = {}
    if (user.role !== "ADMIN") {
      whereClause.OR = [
        { targetRole: user.role },
        { targetRole: "ALL" },
        { userId: user.id },
      ]
    }

    const standardNotifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 15,
    })

    const debtNotifications: any[] = []
    
    if (canSeeFinancialDebts) {
      const planWhere: any = {
        status: { in: ["ACTIVE", "DRAFT"] },
        ...(isDoctor && { doctorId: user.id }),
      }

      const activePlans = await prisma.treatmentPlan.findMany({
        where: planWhere,
        select: {
          id: true,
          name: true,
          totalCost: true,
          totalPaid: true,
          commercialDiscount: true,
          updatedAt: true,
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          doctor: { select: { id: true, name: true } },
          agreement: { select: { discountValue: true } },
          items: {
            select: { cost: true, discount: true, paidAmount: true, progress: true, isCompleted: true },
          },
        },
        take: 30,
        orderBy: { updatedAt: "desc" },
      })

      for (const plan of activePlans) {
        const agreementDisc = plan.agreement ? Number(plan.agreement.discountValue || 0) : 0
        const commercialDisc = Number(plan.commercialDiscount || 0)
        const effectiveGlobalDiscount = commercialDisc > 0 ? commercialDisc : agreementDisc
        
        let calculatedCost = 0
        let totalPaidItems = 0
        let completedCount = 0

        if (plan.items && plan.items.length > 0) {
          for (const itm of plan.items) {
            const cost = Number(itm.cost || 0)
            const itmDisc = Number(itm.discount || 0)
            const effDisc = itmDisc > 0 ? itmDisc : effectiveGlobalDiscount
            calculatedCost += Math.max(0, cost - cost * (effDisc / 100))
            totalPaidItems += Number(itm.paidAmount || 0)
            if (itm.isCompleted || Number(itm.progress || 0) === 100) {
              completedCount++
            }
          }
        } else {
          const rawCost = Number(plan.totalCost || 0)
          calculatedCost = Math.max(0, rawCost - rawCost * (effectiveGlobalDiscount / 100))
        }

        const totalPaid = Math.max(Number(plan.totalPaid || 0), totalPaidItems)
        const debt = Math.max(0, calculatedCost - totalPaid)

        if (debt > 0.05) {
          const patientName = `${plan.patient?.firstName || ""} ${plan.patient?.lastName || ""}`.trim() || "Paciente"
          
          debtNotifications.push({
            id: `debt-${plan.id}`,
            isVirtual: true,
            title: isDoctor ? `Saldo pendiente: ${patientName}` : `Cobro pendiente: $${debt.toFixed(2)}`,
            message: isDoctor
              ? `${patientName} adeuda $${debt.toFixed(2)} en "${plan.name}" (${completedCount} prestaciones ejecutadas).`
              : `${patientName} tiene saldo de $${debt.toFixed(2)} en "${plan.name}" (Dr. ${plan.doctor?.name || "Asignado"}).`,
            type: "DEBT_ALERT",
            isRead: false,
            link: `/paciente/${plan.patient?.id}?tab=planes&planId=${plan.id}`,
            patientId: plan.patient?.id,
            patientPhone: plan.patient?.phone || null,
            pendingAmount: debt,
            createdAt: plan.updatedAt,
          })
        }
      }
    }

    const combined = [...debtNotifications, ...standardNotifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return combined
  }
)

export const PATCH = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
    schema: z.object({
      ids: z.array(z.string()),
    }),
  },
  async (req, { data }) => {
    if (data.ids.length === 0) return { success: true }
    const realDbIds = data.ids.filter((id) => !id.startsWith("debt-"))

    if (realDbIds.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: realDbIds } },
        data: { isRead: true },
      })
    }

    return { success: true }
  }
)