import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { progress, isCompleted, discount, paidAmount, isPaid } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Falta el ID del ítem" }, { status: 400 });
    }

    const updatedItem = await prisma.treatmentItem.update({
      where: { id: itemId },
      data: {
        ...(progress !== undefined && { isCompleted: isCompleted ?? (progress === 100) }),
        ...(discount !== undefined && { discount: Number(discount) }),
        ...(paidAmount !== undefined && { paidAmount: Number(paidAmount) }),
        ...(isPaid !== undefined && { isPaid: Boolean(isPaid) }),
      }
    });

    if (updatedItem.treatmentPlanId) {
      const allItems = await prisma.treatmentItem.findMany({
        where: { treatmentPlanId: updatedItem.treatmentPlanId }
      });

      const newTotalPaid = allItems.reduce((acc, item) => acc + (item.paidAmount || 0), 0);

      await prisma.treatmentPlan.update({
        where: { id: updatedItem.treatmentPlanId },
        data: { totalPaid: newTotalPaid }
      });
    }

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar la prestación:", error);
    return NextResponse.json({ error: "Error interno al actualizar" }, { status: 500 });
  }
}