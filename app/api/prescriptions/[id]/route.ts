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
        entity: "PRESCRIPTION",
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
    console.error("Error al registrar auditoría en Prescription [id]:", err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = body.input || body;
    const { medications, indications, observations, doctorSignature } = data;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID de la receta" }, { status: 400 });
    }

    const currentUser = session.user as any;
    const userRole = String(currentUser?.role || "").toUpperCase().trim();

    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.prescription.findUnique({
        where: { id },
      });

      if (!previous) throw new Error("NOT_FOUND");
      const isAdmin = userRole === "ADMIN" || userRole === "ADMINISTRADOR" || userRole === "ADMINISTRATION";
      const isAuthor = previous.authorId === currentUser.id;

      if (!isAdmin && !isAuthor) {
        throw new Error("FORBIDDEN");
      }

      const res = await tx.prescription.update({
        where: { id },
        data: {
          ...(medications !== undefined && { medications }),
          ...(indications !== undefined && { indications }),
          observations: observations !== undefined ? observations : previous.observations,
          ...(doctorSignature !== undefined && { doctorSignature }),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              specialty: true,
              signatureBase64: true, 
              professionalCard: true, 
              licenseNumber: true,
            },
          },
        },
      });

      await createAuditEntry(tx, {
        userId: currentUser.id,
        action: "UPDATE",
        entityId: id,
        patientId: previous.patientId,
        details: "Modificación de fármacos o posología en receta médica",
        oldData: {
          medications: previous.medications,
          indications: previous.indications,
          observations: previous.observations,
          hasDoctorSignature: Boolean(previous.doctorSignature),
        },
        newData: {
          medications: res.medications,
          indications: res.indications,
          observations: res.observations,
          hasDoctorSignature: Boolean(res.doctorSignature),
        },
      });

      return res;
    });

    const authorLicense =
      updated.author?.professionalCard ||
      updated.author?.licenseNumber ||
      "";

    return NextResponse.json({
      ...updated,
      doctorSignature: updated.doctorSignature || updated.author?.signatureBase64 || null,
      doctorLicense: authorLicense,
    });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Receta médica no encontrada" }, { status: 404 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "No tiene permisos para modificar recetas emitidas por otro profesional" },
        { status: 403 }
      );
    }
    console.error("Error PUT prescription:", error);
    return NextResponse.json({ error: "Error al actualizar la receta" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const currentUser = session.user as any;
    const userRole = String(currentUser?.role || "").toUpperCase().trim();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID de la receta" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const previous = await tx.prescription.findUnique({
        where: { id },
      });

      if (!previous) throw new Error("NOT_FOUND");
      const isAdmin = userRole === "ADMIN" || userRole === "ADMINISTRADOR" || userRole === "ADMINISTRATION";
      const isAuthor = previous.authorId === currentUser.id;

      if (!isAdmin && !isAuthor) {
        throw new Error("FORBIDDEN");
      }

      await tx.prescription.delete({
        where: { id },
      });

      await createAuditEntry(tx, {
        userId: currentUser.id,
        action: "DELETE",
        entityId: id,
        patientId: previous.patientId,
        details: "Eliminación de receta médica del expediente",
        oldData: {
          medications: previous.medications,
          indications: previous.indications,
          observations: previous.observations,
          authorId: previous.authorId,
          createdAt: previous.createdAt,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Receta eliminada y auditada correctamente" });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "La receta no existe o ya fue eliminada" }, { status: 404 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "No tiene permisos para eliminar recetas clínicas de otro doctor" },
        { status: 403 }
      );
    }
    console.error("Error DELETE prescription:", error);
    return NextResponse.json({ error: "Error al eliminar la receta" }, { status: 500 });
  }
}