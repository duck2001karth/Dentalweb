import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

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

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del plan de tratamiento" },
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
        include: {
          items: true,
        },
      });

      if (!plan) {
        throw new Error("PLAN_NOT_FOUND");
      }

      const deleteResult = await tx.treatmentItem.deleteMany({
        where: { treatmentPlanId: id },
      });

      await tx.treatmentPlan.update({
        where: { id },
        data: { totalCost: 0 },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: "CLEAR_TREATMENT_PLAN",
          entity: "TreatmentPlan",
          entityId: id,
          patientId: plan.patientId,
          details: `Se vació completamente el presupuesto del plan "${plan.name}". Se eliminaron ${plan.items.length} prestación(es). Costo anterior: $${Number(plan.totalCost).toFixed(2)}`,
          oldData: {
            previousTotalCost: plan.totalCost,
            itemsCount: plan.items.length,
            deletedItems: plan.items.map((item) => ({
              id: item.id,
              procedureName: item.procedureName,
              cost: item.cost,
              discount: item.discount,
              tooth: item.tooth,
              paidAmount: item.paidAmount,
              isPaid: item.isPaid,
            })),
          },
          newData: {
            totalCost: 0,
            itemsCount: 0,
          },
          ipAddress,
          userAgent,
        },
      });

      return {
        deletedCount: deleteResult.count,
        planName: plan.name,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Presupuesto vaciado correctamente",
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    if (error?.message === "PLAN_NOT_FOUND") {
      return NextResponse.json(
        { error: "El plan de tratamiento no existe" },
        { status: 404 }
      );
    }

    console.error("Error al vaciar presupuesto:", error);
    return NextResponse.json(
      { error: "Error al vaciar el presupuesto" },
      { status: 500 }
    );
  }
}