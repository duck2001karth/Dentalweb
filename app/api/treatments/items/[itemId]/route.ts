import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    
    const { 
      progress, 
      isCompleted, 
      discount, 
      paidAmount, 
      isPaid, 
      tooth, 
      region,
      note,
      isPrivate,
      fileUrl,
      hasIncident,
      hasAdverseEvent,
      doctorId
    } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Falta el ID del ítem" }, { status: 400 });
    }

    const finalIsCompleted = isCompleted ?? (progress === 100);

    const updatedItem = await prisma.treatmentItem.update({
      where: { id: itemId },
      data: {
        ...(progress !== undefined && { progress: Number(progress) }),
        ...(finalIsCompleted !== undefined && { isCompleted: Boolean(finalIsCompleted) }),
        ...(discount !== undefined && { discount: Number(discount) }),
        ...(paidAmount !== undefined && { paidAmount: Number(paidAmount) }),
        ...(isPaid !== undefined && { isPaid: Boolean(isPaid) }),
        ...(tooth !== undefined && { tooth: String(tooth) }),
        ...(region !== undefined && { tooth: String(region) }),
        ...(note !== undefined && { evolutionNote: String(note) }),
        ...(isPrivate !== undefined && { isPrivate: Boolean(isPrivate) }),
        ...(fileUrl !== undefined && { fileUrl: String(fileUrl) }),
        ...(hasIncident !== undefined && { hasIncident: Boolean(hasIncident) }),
        ...(hasAdverseEvent !== undefined && { hasAdverseEvent: Boolean(hasAdverseEvent) }),
        ...(doctorId !== undefined && { performedById: String(doctorId) })
      }
    });

    if (updatedItem.treatmentPlanId) {
      const allItems = await prisma.treatmentItem.findMany({
        where: { treatmentPlanId: updatedItem.treatmentPlanId }
      });

      const newTotalPaid = allItems.reduce((acc, item) => acc + (item.paidAmount || 0), 0);

      await prisma.treatmentPlan.update({
        where: { id: updatedItem.treatmentPlanId },
        data: { 
          totalPaid: newTotalPaid
        }
      });
    }

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar la prestación:", error);
    return NextResponse.json({ error: "Error interno al actualizar" }, { status: 500 });
  }
}