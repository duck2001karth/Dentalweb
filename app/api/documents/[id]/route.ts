import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";

async function createAuditEntry(
  tx: any,
  data: {
    userId: string;
    action: "DELETE";
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
        entity: "PATIENT_DOCUMENT",
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
    console.error("Error al registrar auditoría en PatientDocument [id]:", err);
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const currentUser = session.user as any;
    const userRole = String(currentUser?.role || "").toUpperCase().trim();

    const { id } = await props.params;
    if (!id) {
      return NextResponse.json({ error: "Falta el ID del documento" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const previous = await tx.patientDocument.findUnique({
        where: { id },
      });

      if (!previous) throw new Error("NOT_FOUND");

      const isAdmin =
        userRole === "ADMIN" ||
        userRole === "ADMINISTRADOR" ||
        userRole === "ADMINISTRATION";
      const isAuthor = previous.authorId === currentUser.id;

      if (!isAdmin && !isAuthor) {
        throw new Error("FORBIDDEN");
      }

      await tx.patientDocument.delete({
        where: { id },
      });

      await createAuditEntry(tx, {
        userId: currentUser.id,
        action: "DELETE",
        entityId: id,
        patientId: previous.patientId,
        details: `Eliminación de documento adjunto: "${previous.name}"`,
        oldData: {
          name: previous.name,
          type: previous.type,
          size: previous.size,
          authorId: previous.authorId,
          createdAt: previous.createdAt,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Documento eliminado y auditado correctamente",
    });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "No tiene permisos para eliminar este documento" },
        { status: 403 }
      );
    }
    console.error("Error en DELETE /api/documents/[id]:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar el documento" },
      { status: 500 }
    );
  }
}