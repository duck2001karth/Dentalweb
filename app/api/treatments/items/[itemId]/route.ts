import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
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
    const { itemId } = await params;

    if (!itemId) {
      return NextResponse.json({ error: "Falta el ID del ítem" }, { status: 400 });
    }

    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Desconocido";

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
      doctorId,
    } = body;

    const finalIsCompleted = isCompleted ?? (progress === 100 ? true : undefined);

    const updatedItem = await prisma.$transaction(async (tx) => {
      const previousItem = await tx.treatmentItem.findUnique({
        where: { id: itemId },
        include: {
          plan: {
            include: {
              agreement: true,
            },
          },
        },
      });

      if (!previousItem) {
        throw new Error("ITEM_NOT_FOUND");
      }

      const updated = await tx.treatmentItem.update({
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
          ...(doctorId !== undefined && { performedById: String(doctorId) }),
        },
      });

      if (updated.treatmentPlanId) {
        const allItems = await tx.treatmentItem.findMany({
          where: { treatmentPlanId: updated.treatmentPlanId },
        });

        const newTotalPaid = allItems.reduce(
          (acc, item) => acc + (Number(item.paidAmount) || 0),
          0
        );

        let commercialDisc = 0;
        if (previousItem.plan?.commentsToPatient) {
          const match = previousItem.plan.commentsToPatient.match(/\[COMMERCIAL_DISCOUNT:([\d.]+)\]/);
          if (match) {
            commercialDisc = parseFloat(match[1]) || 0;
          }
        }

        const agreementDisc = previousItem.plan?.agreement
          ? Number(previousItem.plan.agreement.discountValue || 0)
          : 0;

        const globalDiscount = commercialDisc > 0 ? commercialDisc : agreementDisc;

        const newTotalCost = allItems.reduce((acc, itm) => {
          const baseCost = Number(itm.cost || 0);
          const itmDisc = Number(itm.discount || 0);
          const effectiveDisc = itmDisc > 0 ? itmDisc : globalDiscount;
          return acc + Math.max(0, baseCost - baseCost * (effectiveDisc / 100));
        }, 0);

        await tx.treatmentPlan.update({
          where: { id: updated.treatmentPlanId },
          data: {
            totalCost: newTotalCost,
            totalPaid: newTotalPaid,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: "UPDATE_TREATMENT_ITEM",
          entity: "TreatmentItem",
          entityId: updated.id,
          patientId: previousItem.plan?.patientId || null,
          details: `Actualización de prestación "${updated.procedureName || 'Tratamiento'}" (Diente: ${updated.tooth || 'General'}). Descuento: ${updated.discount ?? 0}%, Progreso: ${updated.progress ?? 0}%, Pagado: $${Number(updated.paidAmount || 0).toFixed(2)}`,
          oldData: {
            progress: previousItem.progress,
            isCompleted: previousItem.isCompleted,
            discount: previousItem.discount,
            paidAmount: previousItem.paidAmount,
            isPaid: previousItem.isPaid,
            tooth: previousItem.tooth,
            evolutionNote: previousItem.evolutionNote,
            hasIncident: previousItem.hasIncident,
            hasAdverseEvent: previousItem.hasAdverseEvent,
            performedById: previousItem.performedById,
          },
          newData: {
            progress: updated.progress,
            isCompleted: updated.isCompleted,
            discount: updated.discount,
            paidAmount: updated.paidAmount,
            isPaid: updated.isPaid,
            tooth: updated.tooth,
            evolutionNote: updated.evolutionNote,
            hasIncident: updated.hasIncident,
            hasAdverseEvent: updated.hasAdverseEvent,
            performedById: updated.performedById,
          },
          ipAddress,
          userAgent,
        },
      });

      return updated;
    });

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error: any) {
    if (error?.message === "ITEM_NOT_FOUND") {
      return NextResponse.json({ error: "La prestación no existe" }, { status: 404 });
    }
    console.error("Error al actualizar la prestación:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno al actualizar" },
      { status: 500 }
    );
  }
}