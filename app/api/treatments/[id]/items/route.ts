import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params; 
    
    const body = await request.json();
    const { procedureId, name, price, toothNumber } = body;

    const newItem = await prisma.treatmentItem.create({
      data: {
        treatmentPlanId: id,
        procedureName: name,
        cost: parseFloat(price),
        tooth: toothNumber ? String(toothNumber) : null,
      }
    });

    await prisma.treatmentPlan.update({
      where: { id },
      data: {
        totalCost: { increment: parseFloat(price) }
      }
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error al agregar prestación:", error);
    return NextResponse.json({ error: "Error al agregar prestación" }, { status: 500 });
  }
}