import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida para registrar auditoría." },
        { status: 401 }
      );
    }

    const currentUserId = (session.user as any).id;
    const { id } = await params; 

    if (!id) {
      return NextResponse.json({ error: "Falta el ID del plan de tratamiento" }, { status: 400 });
    }

    // Metadatos de red
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Desconocido";

    const body = await request.json();
    const procedureName = body.procedureName || body.name || "Prestación sin nombre";
    const rawPrice = body.cost ?? body.price ?? body.basePrice ?? 0;
    const parsedPrice = isNaN(parseFloat(rawPrice)) ? 0 : parseFloat(rawPrice);
    const tooth = body.toothNumber || body.tooth || body.toothNum || null;

    const newItem = await prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({
        where: { id },
        select: { id: true, patientId: true, name: true, totalCost: true }
      });

      if (!plan) {
        throw new Error("PLAN_NOT_FOUND");
      }
      const item = await tx.treatmentItem.create({
        data: {
          treatmentPlanId: id,
          procedureName: String(procedureName),
          cost: parsedPrice,
          tooth: tooth ? String(tooth) : null,
        }
      });
      await tx.treatmentPlan.update({
        where: { id },
        data: {
          totalCost: { increment: parsedPrice }
        }
      });
      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: "CREATE_TREATMENT_ITEM",
          entity: "TreatmentItem",
          entityId: item.id,
          patientId: plan.patientId,
          details: `Se añadió la prestación "${item.procedureName}" (${item.tooth || "General"}) con costo de $${parsedPrice.toFixed(2)} al plan "${plan.name}"`,
          oldData: undefined,
          newData: {
            id: item.id,
            treatmentPlanId: id,
            procedureName: item.procedureName,
            cost: item.cost,
            tooth: item.tooth,
          },
          ipAddress,
          userAgent,
        }
      });

      return item;
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    if (error?.message === "PLAN_NOT_FOUND") {
      return NextResponse.json({ error: "El plan de tratamiento no existe" }, { status: 404 });
    }
    console.error("Error al agregar prestación:", error);
    return NextResponse.json({ error: "Error al agregar prestación" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "No autorizado. Sesión requerida para registrar auditoría." },
        { status: 401 }
      );
    }

    const currentUserId = (session.user as any).id;
    const { id } = await params;

    const body = await request.json();
    const { itemIds } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "No se seleccionaron ítems para eliminar" },
        { status: 400 }
      );
    }
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Desconocido";

    const result = await prisma.$transaction(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({
        where: { id },
        select: { id: true, patientId: true, name: true, totalCost: true }
      });

      if (!plan) {
        throw new Error("PLAN_NOT_FOUND");
      }
      const itemsToDelete = await tx.treatmentItem.findMany({
        where: {
          id: { in: itemIds },
          treatmentPlanId: id,
        },
      });

      if (itemsToDelete.length === 0) {
        throw new Error("ITEMS_NOT_FOUND");
      }
      await tx.treatmentItem.deleteMany({
        where: {
          id: { in: itemIds },
          treatmentPlanId: id,
        },
      });
      const remainingItems = await tx.treatmentItem.findMany({
        where: { treatmentPlanId: id },
      });

      const newTotalCost = remainingItems.reduce((acc, item) => {
        const baseCost = item.cost || 0;
        const dscto = item.discount || 0;
        return acc + (baseCost - (baseCost * (dscto / 100)));
      }, 0);

      await tx.treatmentPlan.update({
        where: { id },
        data: { totalCost: newTotalCost },
      });
      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: "DELETE_TREATMENT_ITEMS",
          entity: "TreatmentPlan",
          entityId: id,
          patientId: plan.patientId,
          details: `Se eliminaron ${itemsToDelete.length} prestación(es) del plan "${plan.name}". Nuevo total: $${newTotalCost.toFixed(2)}`,
          oldData: {
            deletedItems: itemsToDelete.map((item) => ({
              id: item.id,
              procedureName: item.procedureName,
              cost: item.cost,
              discount: item.discount,
              tooth: item.tooth,
              paidAmount: item.paidAmount,
            })),
            previousTotalCost: plan.totalCost,
          },
          newData: undefined,
          ipAddress,
          userAgent,
        }
      });

      return { newTotalCost, deletedCount: itemsToDelete.length };
    });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} ítem(s) eliminado(s) correctamente`,
      newTotalCost: result.newTotalCost,
    });
  } catch (error: any) {
    if (error?.message === "PLAN_NOT_FOUND") {
      return NextResponse.json({ error: "El plan de tratamiento no existe" }, { status: 404 });
    }
    if (error?.message === "ITEMS_NOT_FOUND") {
      return NextResponse.json({ error: "No se encontraron las prestaciones indicadas en este plan" }, { status: 404 });
    }
    console.error("Error al eliminar elementos del presupuesto:", error);
    return NextResponse.json(
      { error: "Error al procesar la eliminación parcial" },
      { status: 500 }
    );
  }
}