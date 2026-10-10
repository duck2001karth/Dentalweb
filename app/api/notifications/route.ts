import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userRole = String(session.user.role || "").toUpperCase().trim()
    const userId = session.user.id as string
    const isDoctor = userRole === "DOCTOR"
    const canSeeFinancialDebts = userRole === "ADMIN" || userRole === "RECEPCION" || userRole === "RECEPCIONISTA" || isDoctor

    let whereClause: any = {}
    if (userRole !== "ADMIN") {
      whereClause.OR = [
        { targetRole: userRole },
        { targetRole: "ALL" },
        { userId: userId },
      ]
    }

    const standardNotifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 15,
    })

    // 2. Consulta y cálculo de deudas en tiempo real
    let debtNotifications: any[] = []

    if (canSeeFinancialDebts) {
      const planWhere: any = {
        status: { in: ["ACTIVE", "DRAFT"] },
      }

      // Si es doctor, restringir a los planes donde es titular
      if (isDoctor) {
        planWhere.doctorId = userId
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
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
          agreement: {
            select: {
              discountValue: true,
            },
          },
          items: {
            select: {
              cost: true,
              discount: true,
              paidAmount: true,
              progress: true,
              isCompleted: true,
            },
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

    return NextResponse.json(combined)
  } catch (error) {
    console.error("Error en GET /api/notifications:", error)
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { ids } = await request.json()
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: true })
    }

    const realDbIds = ids.filter((id: string) => !String(id).startsWith("debt-"))

    if (realDbIds.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: realDbIds } },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en PATCH /api/notifications:", error)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}