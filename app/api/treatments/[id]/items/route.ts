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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { itemIds } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "No se seleccionaron ítems para eliminar" },
        { status: 400 }
      );
    }

    await prisma.treatmentItem.deleteMany({
      where: {
        id: { in: itemIds },
        treatmentPlanId: id,
      },
    });
    const remainingItems = await prisma.treatmentItem.findMany({
      where: { treatmentPlanId: id },
    });

    const newTotalCost = remainingItems.reduce((acc, item) => {
      const baseCost = item.cost || 0;
      const dscto = item.discount || 0;
      return acc + (baseCost - (baseCost * (dscto / 100)));
    }, 0);
    await prisma.treatmentPlan.update({
      where: { id },
      data: { totalCost: newTotalCost },
    });

    return NextResponse.json({
      success: true,
      message: `${itemIds.length} ítem(s) eliminado(s) correctamente`,
      newTotalCost,
    });
  } catch (error) {
    console.error("Error al eliminar elementos del presupuesto:", error);
    return NextResponse.json(
      { error: "Error al procesar la eliminación parcial" },
      { status: 500 }
    );
  }
}