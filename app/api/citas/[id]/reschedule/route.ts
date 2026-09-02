import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";

async function createAuditEntry(
  tx: any,
  data: {
    userId: string;
    action: "UPDATE" | "DELETE";
    entityId: string;
    patientId?: string | null;
    details?: string;
    oldData?: any;
    newData?: any;
  }
) {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Desconocido";

    await tx.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: "APPOINTMENT",
        entityId: data.entityId,
        patientId: data.patientId || null,
        details: data.details || null,
        oldData: data.oldData || null,
        newData: data.newData || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("Error al registrar auditoría en Reprogramación de Cita [id]:", err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { newDate, newTime, endTime, reason, status, box } = body;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID de la cita" }, { status: 400 });
    }

    if (!newDate || !newTime) {
      return NextResponse.json(
        { error: "La fecha y hora son obligatorias" },
        { status: 400 }
      );
    }

    const cleanDateStr = newDate.includes("T")
      ? newDate.split("T")[0]
      : newDate;
    const combinedDateTime = new Date(`${cleanDateStr}T${newTime}:00`);

    if (isNaN(combinedDateTime.getTime())) {
      return NextResponse.json(
        { error: "La fecha enviada es inválida" },
        { status: 400 }
      );
    }

    const currentUserId = (session.user as any)?.id;

    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.appointment.findUnique({
        where: { id },
        include: {
          doctor: { select: { id: true, name: true } },
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!previous) throw new Error("NOT_FOUND");

      const prevDateStr = previous.date.toISOString().split("T")[0];

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          date: combinedDateTime,
          startTime: newTime,
          endTime: endTime || newTime,
          reason: reason !== undefined ? reason : previous.reason,
          status: status || "SCHEDULED",
          ...(box && { box }),
        },
        include: {
          doctor: { select: { id: true, name: true } },
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await createAuditEntry(tx, {
        userId: currentUserId,
        action: "UPDATE",
        entityId: id,
        patientId: previous.patientId,
        details: `Cita reprogramada del ${prevDateStr} (${previous.startTime}) al ${cleanDateStr} (${newTime})`,
        oldData: {
          date: prevDateStr,
          startTime: previous.startTime,
          endTime: previous.endTime,
          reason: previous.reason,
          status: previous.status,
          box: previous.box,
        },
        newData: {
          date: cleanDateStr,
          startTime: updated.startTime,
          endTime: updated.endTime,
          reason: updated.reason,
          status: updated.status,
          box: updated.box,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: "Cita reprogramada y auditada correctamente",
      cita: result,
    });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }
    console.error("Error en PATCH /api/citas/[id]:", error);
    return NextResponse.json(
      { error: "Error al procesar la reprogramación" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Falta el ID de la cita" }, { status: 400 });
    }

    const currentUser = session.user as any;
    const userRole = String(currentUser?.role || "").toUpperCase().trim();

    const isAuthorized =
      userRole === "ADMIN" ||
      userRole === "ADMINISTRADOR" ||
      userRole === "DOCTOR" ||
      userRole === "RECEPTIONIST" ||
      userRole === "RECEPCIONISTA";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "No tiene permisos para cancelar o eliminar citas" },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const previous = await tx.appointment.findUnique({
        where: { id },
        include: {
          doctor: { select: { id: true, name: true } },
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!previous) throw new Error("NOT_FOUND");

      const citaDateStr = previous.date.toISOString().split("T")[0];

      await tx.appointment.delete({
        where: { id },
      });

      await createAuditEntry(tx, {
        userId: currentUser.id,
        action: "DELETE",
        entityId: id,
        patientId: previous.patientId,
        details: `Cancelación/eliminación de cita del ${citaDateStr} (${previous.startTime} - ${previous.endTime})`,
        oldData: {
          date: citaDateStr,
          startTime: previous.startTime,
          endTime: previous.endTime,
          box: previous.box,
          reason: previous.reason,
          status: previous.status,
          doctorId: previous.doctorId,
          doctorName: previous.doctor?.name,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Cita cancelada y auditada correctamente",
    });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }
    console.error("Error en DELETE /api/citas/[id]:", error);
    return NextResponse.json(
      { error: "Error al eliminar la cita de la agenda" },
      { status: 500 }
    );
  }
}