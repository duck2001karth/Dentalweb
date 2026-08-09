import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, amount, paymentMethod, reference, itemIds, receiptImage } = body;

    const parsedAmount = parseFloat(amount || 0);

    if (!patientId || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Monto o paciente no válido" },
        { status: 400 }
      );
    }

    let targetItemIds = itemIds || [];

    if (targetItemIds.length === 0) {
      const activePlans = await prisma.treatmentPlan.findMany({
        where: { patientId, status: { not: "CANCELLED" } },
        include: { items: true },
      });

      for (const p of activePlans) {
        for (const item of p.items) {
          const cost = item.cost || 0;
          const dscto = item.discount || 0;
          const finalCost = cost - (cost * (dscto / 100));
          const paid = item.paidAmount || 0;

          if (finalCost - paid > 0 && !item.isPaid) {
            targetItemIds.push(item.id);
          }
        }
      }
    }

    const itemsToPay = await prisma.treatmentItem.findMany({
      where: { id: { in: targetItemIds } },
    });

    let remainingMoneyToDistribute = parsedAmount;
    const planIdsToUpdate = new Set<string>();

    for (const item of itemsToPay) {
      if (remainingMoneyToDistribute <= 0) break;

      planIdsToUpdate.add(item.treatmentPlanId);

      const cost = item.cost || 0;
      const dscto = item.discount || 0;
      const itemFinalPrice = cost - (cost * (dscto / 100));
      const currentPaid = item.paidAmount || 0;
      const pendingDebt = Math.max(0, itemFinalPrice - currentPaid);

      const moneyForThisItem = Math.min(remainingMoneyToDistribute, pendingDebt);
      const newPaidAmount = currentPaid + moneyForThisItem;
      const isFullyPaid = newPaidAmount >= itemFinalPrice - 0.01;

      await prisma.treatmentItem.update({
        where: { id: item.id },
        data: {
          paidAmount: newPaidAmount,
          isPaid: isFullyPaid,
        },
      });

      remainingMoneyToDistribute -= moneyForThisItem;
    }
    for (const planId of Array.from(planIdsToUpdate)) {
      const allPlanItems = await prisma.treatmentItem.findMany({
        where: { treatmentPlanId: planId },
      });

      const totalPaidForPlan = allPlanItems.reduce(
        (acc, i) => acc + (i.paidAmount || 0),
        0
      );

      const allItemsPaid = allPlanItems.every(
        (i) => i.isPaid || (i.paidAmount || 0) >= (i.cost || 0) - ((i.cost || 0) * ((i.discount || 0) / 100)) - 0.01
      );

      await prisma.treatmentPlan.update({
        where: { id: planId },
        data: {
          totalPaid: totalPaidForPlan,
          // Opcional: si todo está saldado, podemos marcar el estado como COMPLETED
          status: allItemsPaid ? "COMPLETED" : undefined,
        },
      });
    }

    // 📍 5. Registramos la transacción de cobro en el historial financiero
    const newPaymentRecord = await prisma.payment.create({
      data: {
        patientId,
        amount: parsedAmount,
        method: paymentMethod,
        reference: reference || null,
        receiptImage: receiptImage || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pago registrado y aplicado correctamente",
      payment: newPaymentRecord,
    });
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el pago" },
      { status: 500 }
    );
  }
}