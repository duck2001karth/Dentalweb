import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; 
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";

interface PaymentData {
  amount: number;
  createdAt: Date;
}

export async function GET() {
  try {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));

    const [
      catalogCount,
      totalPatients,
      newPatientsThisMonth,
      activePlans,
      recentLogs,
      paymentsLast6Months,
      paymentsLastMonth
    ] = await Promise.all([
      prisma.procedureCatalog.count({ where: { isActive: true } }),
      prisma.patient.count(), 
      prisma.patient.count({
        where: { createdAt: { gte: currentMonthStart, lte: currentMonthEnd } }
      }),
      prisma.treatmentPlan.count({
        where: { status: 'ACTIVE' } 
      }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      }),
      prisma.payment.findMany({
        where: {
          createdAt: { gte: sixMonthsAgo },
          status: 'COMPLETED'
        },
        select: { amount: true, createdAt: true }
      }),
      prisma.payment.aggregate({
        where: {
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      })
    ]);

    const currentMonthPayments = paymentsLast6Months.filter(
      (p: PaymentData) => p.createdAt >= currentMonthStart && p.createdAt <= currentMonthEnd
    );
    
    const currentMonthIncome = currentMonthPayments.reduce(
      (sum: number, p: PaymentData) => sum + Number(p.amount), 0
    );
    
    const lastMonthIncome = Number(paymentsLastMonth._sum.amount || 0);

    let incomeGrowth = 0;
    if (lastMonthIncome > 0) {
      incomeGrowth = ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
    } else if (currentMonthIncome > 0) {
      incomeGrowth = 100; 
    }

    const revenueDataMap = new Map<string, number>();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthName = format(monthDate, 'MMM', { locale: es });
      revenueDataMap.set(monthName.charAt(0).toUpperCase() + monthName.slice(1), 0);
    }
    paymentsLast6Months.forEach((payment: PaymentData) => {
      const monthName = format(payment.createdAt, 'MMM', { locale: es });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      
      if (revenueDataMap.has(capitalizedMonth)) {
        const currentTotal = revenueDataMap.get(capitalizedMonth) || 0;
        revenueDataMap.set(capitalizedMonth, currentTotal + Number(payment.amount));
      }
    });

    const revenueData = Array.from(revenueDataMap, ([name, total]) => ({ name, total }));
    const recentActivity = recentLogs.map((log: any) => ({
      id: log.id,
      action: log.action, 
      user: log.user?.name || 'Sistema',
      details: log.details || `Modificación en registro`,
      time: log.createdAt.toISOString()
    }));

    const payload = {
      stats: {
        income: currentMonthIncome,
        incomeGrowth: Number(incomeGrowth.toFixed(1)),
        patients: totalPatients,
        patientsGrowth: newPatientsThisMonth,
        activePlans: activePlans,
        catalogItems: catalogCount,
      },
      revenueData,
      recentActivity
    };

    return NextResponse.json(payload);
    
  } catch (error) {
    console.error("Error fetching real dashboard data:", error);
    return NextResponse.json({ error: "Error interno del servidor al cargar las métricas" }, { status: 500 });
  }
}