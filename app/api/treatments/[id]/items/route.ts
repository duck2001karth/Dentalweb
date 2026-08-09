import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params; 
    const body = await request.json();

    // 📍 1. Extraemos con tolerancia a distintos nombres de variables
    const procedureName = body.procedureName || body.name || "Prestación sin nombre";
    const rawPrice = body.cost ?? body.price ?? body.basePrice ?? 0;
    const parsedPrice = isNaN(parseFloat(rawPrice)) ? 0 : parseFloat(rawPrice);
    const tooth = body.toothNumber || body.tooth || body.toothNum || null;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID del plan de tratamiento" }, { status: 400 });
    }

    // 📍 2. Creamos la prestación en la base de datos
    const newItem = await prisma.treatmentItem.create({
      data: {
        treatmentPlanId: id,
        procedureName: String(procedureName),
        cost: parsedPrice,
        tooth: tooth ? String(tooth) : null,
      }
    });

    // 📍 3. Incrementamos el costo total del plan usando el valor procesado
    await prisma.treatmentPlan.update({
      where: { id },
      data: {
        totalCost: { increment: parsedPrice }
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