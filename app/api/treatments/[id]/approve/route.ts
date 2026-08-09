import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updatedPlan = await prisma.treatmentPlan.update({
      where: { id },
      data: {
        status: "ACTIVE"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Plan activado correctamente",
      plan: updatedPlan
    });
  } catch (error) {
    console.error("Error al activar el plan:", error);
    return NextResponse.json({ error: "Error interno al activar el plan" }, { status: 500 });
  }
}