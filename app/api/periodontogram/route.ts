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
        entity: "PERIODONTOGRAM",
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
    console.error("Error al registrar auditoría en Periodontograma:", err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Falta el ID del paciente" }, { status: 400 });
    }

    const records = await prisma.periodontogram.findMany({
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
    console.error("Error al obtener periodontogramas:", error);
    return NextResponse.json({ error: "Error interno al consultar historial" }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { patientId, data, authorId } = body;

    if (!patientId || !data) {
      return NextResponse.json({ error: "Datos incompletos para el registro" }, { status: 400 });
    }

    const currentUserId = authorId || (session.user as any)?.id;

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.periodontogram.create({
        data: {
          patientId,
          data,
          authorId: currentUserId,
        },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });

      await createAuditEntry(tx, {
        userId: currentUserId,
        action: "CREATE",
        entityId: created.id,
        patientId,
        details: "Registro inicial de evaluación periodontal (sondaje y margen)",
        newData: { data: created.data },
      });

      return created;
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error al registrar periodontograma:", error);
    return NextResponse.json({ error: "Error al guardar la evaluación periodontal" }, { status: 500 });
  }
}
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, data } = body;

    if (!id || !data) {
      return NextResponse.json({ error: "Faltan parámetros requeridos (ID o datos)" }, { status: 400 });
    }

    const currentUserId = (session.user as any)?.id;

    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.periodontogram.findUnique({
        where: { id },
      });

      if (!previous) throw new Error("NOT_FOUND");

      const res = await tx.periodontogram.update({
        where: { id },
        data: { data },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });

      await createAuditEntry(tx, {
        userId: currentUserId,
        action: "UPDATE",
        entityId: id,
        patientId: previous.patientId,
        details: "Actualización de índices periodontales",
        oldData: { data: previous.data },
        newData: { data: res.data },
      });

      return res;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });
    }
    console.error("Error al actualizar periodontograma:", error);
    return NextResponse.json({ error: "Error al actualizar la evaluación" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const currentUser = session.user as any;
    const userRole = String(currentUser?.role || "").toUpperCase().trim();
    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR" && userRole !== "ADMINISTRATION") {
      return NextResponse.json(
        { error: "Solo administradores pueden eliminar evaluaciones periodontales" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de registro requerido" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const previous = await tx.periodontogram.findUnique({
        where: { id },
      });

      if (!previous) throw new Error("NOT_FOUND");

      await tx.periodontogram.delete({
        where: { id },
      });

      await createAuditEntry(tx, {
        userId: currentUser.id,
        action: "DELETE",
        entityId: id,
        patientId: previous.patientId,
        details: "Eliminación de registro periodontal histórico",
        oldData: { data: previous.data },
      });
    });

    return NextResponse.json({ success: true, message: "Evaluación periodontal eliminada correctamente" });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "El registro no existe o ya fue eliminado" }, { status: 404 });
    }
    console.error("Error al eliminar periodontograma:", error);
    return NextResponse.json({ error: "Error al procesar la eliminación" }, { status: 500 });
  }
}