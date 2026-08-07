import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.treatmentItem.deleteMany({
      where: { treatmentPlanId: id },
    });

    await prisma.treatmentPlan.update({
      where: { id },
      data: { totalCost: 0 },
    });

    return NextResponse.json({
      success: true,
      message: "Presupuesto vaciado correctamente",
    });
  } catch (error) {
    console.error("Error al vaciar presupuesto:", error);
    return NextResponse.json(
      { error: "Error al vaciar el presupuesto" },
      { status: 500 }
    );
  }
}