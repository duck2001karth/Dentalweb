import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  subDays, subWeeks, subMonths, subYears, 
  startOfMonth, endOfMonth, startOfDay, endOfDay, 
  format, eachDayOfInterval 
} from "date-fns"
import { es } from "date-fns/locale"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere nivel de administrador." }, { status: 403 })
    }

    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    const validPaymentsFilter: any = {
      status: "COMPLETED",
      NOT: { notes: { contains: "[PAGO ELIMINADO" } }
    }

    const [
      catalogCount, totalPatients, newPatientsThisMonth,
      treatmentPlansAll, recentLogs, allPayments,
      todayPayments, todayAppointmentsCount, activeAgreementsCount
    ] = await Promise.all([
      prisma.procedureCatalog.count({ where: { isActive: true } }).catch(() => 0),
      prisma.patient.count().catch(() => 0),
      prisma.patient.count({
        where: { createdAt: { gte: currentMonthStart, lte: currentMonthEnd } }
      }).catch(() => 0),
      prisma.treatmentPlan.findMany({
        select: {
          id: true, status: true, totalCost: true, createdAt: true, patientId: true,
          payments: {
            where: validPaymentsFilter,
            select: { amount: true, createdAt: true, patientId: true }
          }
        }
      }).catch(() => []),
      prisma.auditLog ? prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, role: true } } }
      }).catch(() => []) : Promise.resolve([]),
      prisma.payment.findMany({
        where: validPaymentsFilter,
        select: { amount: true, createdAt: true, patientId: true }
      }).catch(() => []),
      prisma.payment.aggregate({
        where: { ...validPaymentsFilter, createdAt: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true }
      }).catch(() => ({ _sum: { amount: 0 } })),
      (prisma as any).appointment ? (prisma as any).appointment.count({
        where: { date: { gte: todayStart, lte: todayEnd } }
      }).catch(() => 0) : Promise.resolve(0),
      prisma.agreement.count({ where: { isActive: true } }).catch(() => 0)
    ])

    const currentMonthPayments = allPayments.filter((p) => {
      const d = new Date(p.createdAt)
      return d >= currentMonthStart && d <= currentMonthEnd
    })
    const currentMonthIncome = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

    const lastMonthPayments = allPayments.filter((p) => {
      const d = new Date(p.createdAt)
      return d >= lastMonthStart && d <= lastMonthEnd
    })
    const lastMonthIncome = lastMonthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    
    const incomeGrowth = lastMonthIncome > 0
      ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100
      : currentMonthIncome > 0 ? 100 : 0

    const totalPlans = treatmentPlansAll.length
    const acceptedPlans = treatmentPlansAll.filter((p) => p.status === "ACTIVE" || p.status === "COMPLETED").length
    const acceptanceRate = totalPlans > 0 ? Math.round((acceptedPlans / totalPlans) * 100) : 0

    let totalAccountsReceivable = 0
    treatmentPlansAll.forEach((plan) => {
      const budget = Number(plan.totalCost || 0)
      const paid = plan.payments.reduce((acc: number, pay: any) => acc + Number(pay.amount || 0), 0)
      if (budget > paid && plan.status !== "CANCELLED") {
        totalAccountsReceivable += (budget - paid)
      }
    })

    const uniquePayingPatients = new Set(currentMonthPayments.map((p) => p.patientId).filter(Boolean)).size
    const activePayingCount = uniquePayingPatients > 0 ? uniquePayingPatients : (currentMonthPayments.length > 0 ? currentMonthPayments.length : 1)
    const averageTicket = currentMonthIncome > 0 ? currentMonthIncome / activePayingCount : 0
    
    const last7Days = eachDayOfInterval({ start: subDays(now, 6), end: now })
    const data7D = last7Days.map((d) => {
      const dStart = startOfDay(d)
      const dEnd = endOfDay(d)
      const dLabel = format(d, "EEE", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())
      const real = allPayments
        .filter((p) => { const pd = new Date(p.createdAt); return pd >= dStart && pd <= dEnd })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      const projected = treatmentPlansAll
        .filter((plan) => { const pld = new Date(plan.createdAt); return pld >= dStart && pld <= dEnd })
        .reduce((sum, plan) => sum + Number(plan.totalCost || 0), 0)
      return { name: dLabel, real: Number(real.toFixed(2)), projected: Number(projected.toFixed(2)) }
    })

    const data4W = [3, 2, 1, 0].map((wIdx) => {
      const wStart = startOfDay(subWeeks(now, wIdx))
      const wEnd = endOfDay(wIdx === 0 ? now : subWeeks(now, wIdx - 1))
      const label = wIdx === 0 ? "Esta Sem." : `Sem -${wIdx}`
      const real = allPayments
        .filter((p) => { const pd = new Date(p.createdAt); return pd >= wStart && pd <= wEnd })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      const projected = treatmentPlansAll
        .filter((plan) => { const pld = new Date(plan.createdAt); return pld >= wStart && pld <= wEnd })
        .reduce((sum, plan) => sum + Number(plan.totalCost || 0), 0)
      return { name: label, real: Number(real.toFixed(2)), projected: Number(projected.toFixed(2)) }
    })

    const data6M = [5, 4, 3, 2, 1, 0].map((mIdx) => {
      const mDate = subMonths(now, mIdx)
      const mStart = startOfMonth(mDate)
      const mEnd = endOfMonth(mDate)
      const label = format(mDate, "MMM", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())
      const real = allPayments
        .filter((p) => { const pd = new Date(p.createdAt); return pd >= mStart && pd <= mEnd })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      const projected = treatmentPlansAll
        .filter((plan) => { const pld = new Date(plan.createdAt); return pld >= mStart && pld <= mEnd })
        .reduce((sum, plan) => sum + Number(plan.totalCost || 0), 0)
      return { name: label, real: Number(real.toFixed(2)), projected: Number(projected.toFixed(2)) }
    })

    const data1Y = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((mIdx) => {
      const mDate = subMonths(now, mIdx)
      const mStart = startOfMonth(mDate)
      const mEnd = endOfMonth(mDate)
      const label = format(mDate, "MMM", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())
      const real = allPayments
        .filter((p) => { const pd = new Date(p.createdAt); return pd >= mStart && pd <= mEnd })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      const projected = treatmentPlansAll
        .filter((plan) => { const pld = new Date(plan.createdAt); return pld >= mStart && pld <= mEnd })
        .reduce((sum, plan) => sum + Number(plan.totalCost || 0), 0)
      return { name: label, real: Number(real.toFixed(2)), projected: Number(projected.toFixed(2)) }
    })

    const recentActivity = (recentLogs || []).map((log: any) => ({
      id: log.id,
      action: log.action,
      user: log.user?.name || "Sistema",
      details: log.details || "Movimiento registrado",
      time: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString()
    }))

    return NextResponse.json({
      stats: {
        income: currentMonthIncome,
        incomeGrowth: Number(incomeGrowth.toFixed(1)),
        patients: totalPatients,
        patientsGrowth: newPatientsThisMonth,
        activePlans: acceptedPlans,
        catalogItems: catalogCount,
        acceptanceRate,
        totalAccountsReceivable: Number(totalAccountsReceivable.toFixed(2)),
        averageTicket: Number(averageTicket.toFixed(2)),
        payingPatientsCount: activePayingCount,
        todayIncome: Number(todayPayments._sum.amount || 0),
        todayAppointments: todayAppointmentsCount || 0,
        activeAgreements: activeAgreementsCount
      },
      chartPeriods: {
        "7D": data7D,
        "4W": data4W,
        "6M": data6M,
        "1Y": data1Y
      },
      recentActivity
    })

  } catch (error) {
    console.error("Error en GET /api/admin/dashboard:", error)
    return NextResponse.json({ error: "Error interno al calcular dashboard" }, { status: 500 })
  }
}