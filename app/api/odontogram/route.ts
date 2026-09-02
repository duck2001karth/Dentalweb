import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";

async function createAuditEntry(
  tx: any,
  data: {
    userId: string;
    action: "CREATE" | "UPDATE" | "DELETE";
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
        entity: "ODONTOGRAM",
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
    console.error("Error al registrar auditoría en Odontograma:", err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Falta el ID del paciente" }, { status: 400 });
    }

    const records = await prisma.odontogramRecord.findMany({
      where: { patientId },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error al obtener registros del odontograma:", error);
    return NextResponse.json({ error: "Error al obtener registros" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      patientId,
      planId,
      toothNumber,
      surfaces,
      status,
      isEvolution,
      authorId,
      notes,
      comments,
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: "Falta el ID del paciente." }, { status: 400 });
    }

    const currentAuthorId = authorId || (session.user as any)?.id;

    if (!currentAuthorId) {
      return NextResponse.json({ error: "No se identificó al autor del registro." }, { status: 400 });
    }
    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.odontogramRecord.create({
        data: {
          patientId,
          planId: planId || null,
          toothNumber: Number(toothNumber),
          surfaces: Array.isArray(surfaces) ? surfaces : [surfaces],
          status,
          notes: notes || comments || null,
          isEvolution: isEvolution || false,
          authorId: currentAuthorId,
        },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      await createAuditEntry(tx, {
        userId: currentAuthorId,
        action: "CREATE",
        entityId: created.id,
        patientId,
        details: `Registro de hallazgo clínico (${status}) en pieza #${toothNumber}`,
        newData: {
          toothNumber: created.toothNumber,
          surfaces: created.surfaces,
          status: created.status,
          notes: created.notes,
          isEvolution: created.isEvolution,
        },
      });

      return created;
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error en Prisma Odontogram POST:", error);
    return NextResponse.json({ error: "Error interno en la base de datos." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID del registro" }, { status: 400 });
    }

    const currentUserId = (session.user as any)?.id;
    const updatedRecord = await prisma.$transaction(async (tx) => {
      const previous = await tx.odontogramRecord.findUnique({
        where: { id },
      });

      if (!previous) {
        throw new Error("NOT_FOUND");
      }

      const updated = await tx.odontogramRecord.update({
        where: { id },
        data: {
          notes: notes !== undefined ? notes : null,
        },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      await createAuditEntry(tx, {
        userId: currentUserId,
        action: "UPDATE",
        entityId: id,
        patientId: previous.patientId,
        details: `Actualización de observación en pieza #${previous.toothNumber}`,
        oldData: { notes: previous.notes },
        newData: { notes: updated.notes },
      });

      return updated;
    });

    return NextResponse.json({ success: true, record: updatedRecord }, { status: 200 });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    console.error("Error actualizando nota de odontograma:", error);
    return NextResponse.json(
      { error: error?.message || "Error al actualizar la observación" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const currentUser = session.user as any;
    const userRole = String(currentUser?.role || "").toUpperCase();
    if (userRole !== "ADMIN" && userRole !== "DOCTOR" && userRole !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Permisos insuficientes para eliminar hallazgos" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const patientId = searchParams.get("patientId");
    const toothNumber = searchParams.get("toothNumber");

    if (id) {
      await prisma.$transaction(async (tx) => {
        const previous = await tx.odontogramRecord.findUnique({ where: { id } });
        if (!previous) throw new Error("NOT_FOUND");

        await tx.odontogramRecord.delete({ where: { id } });

        await createAuditEntry(tx, {
          userId: currentUser.id,
          action: "DELETE",
          entityId: id,
          patientId: previous.patientId,
          details: `Eliminación de hallazgo clínico en pieza #${previous.toothNumber}`,
          oldData: {
            toothNumber: previous.toothNumber,
            surfaces: previous.surfaces,
            status: previous.status,
            notes: previous.notes,
          },
        });
      });

      return NextResponse.json({ success: true, message: "Registro anulado" });
    }

    if (patientId && toothNumber) {
      const toothNumInt = parseInt(toothNumber, 10);

      await prisma.$transaction(async (tx) => {
        const recordsToDelete = await tx.odontogramRecord.findMany({
          where: { patientId, toothNumber: toothNumInt },
        });

        await tx.odontogramRecord.deleteMany({
          where: { patientId, toothNumber: toothNumInt },
        });

        await createAuditEntry(tx, {
          userId: currentUser.id,
          action: "DELETE",
          entityId: `TOOTH-${toothNumInt}`,
          patientId,
          details: `Saneamiento completo de la pieza #${toothNumInt} (${recordsToDelete.length} registros eliminados)`,
          oldData: recordsToDelete.map((r) => ({
            id: r.id,
            status: r.status,
            surfaces: r.surfaces,
          })),
        });
      });

      return NextResponse.json({ success: true, message: "Pieza saneada" });
    }

    return NextResponse.json({ error: "Faltan parámetros de eliminación" }, { status: 400 });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    console.error("Error eliminando registro del odontograma:", error);
    return NextResponse.json({ error: "Error interno al procesar eliminación" }, { status: 500 });
  }
}