import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function PATCH(
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
      const previousPlan = await tx.treatmentPlan.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          status: true,
          totalCost: true,
          patientId: true,
          doctorId: true,
        },
      });

      if (!previousPlan) {
        throw new Error("PLAN_NOT_FOUND");
      }
      const updatedPlan = await tx.treatmentPlan.update({
        where: { id },
        data: {
          status: "ACTIVE",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: "APPROVE_TREATMENT_PLAN",
          entity: "TreatmentPlan",
          entityId: id,
          patientId: previousPlan.patientId,
          details: `Plan de tratamiento "${previousPlan.name}" aprobado y activado. Presupuesto: $${Number(previousPlan.totalCost).toFixed(2)}`,
          oldData: {
            status: previousPlan.status,
          },
          newData: {
            status: "ACTIVE",
          },
          ipAddress,
          userAgent,
        },
      });

      return updatedPlan;
    });

    return NextResponse.json({
      success: true,
      message: "Plan activado correctamente",
      plan: result,
    });
  } catch (error: any) {
    if (error?.message === "PLAN_NOT_FOUND") {
      return NextResponse.json(
        { error: "El plan de tratamiento no existe" },
        { status: 404 }
      );
    }

    console.error("Error al activar el plan:", error);
    return NextResponse.json(
      { error: "Error interno al activar el plan" },
      { status: 500 }
    );
  }
}