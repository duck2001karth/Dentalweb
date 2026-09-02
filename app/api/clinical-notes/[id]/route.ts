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
        entity: "CLINICAL_NOTE",
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
    console.error("Error al registrar auditoría en ClinicalNote [id]:", err);
  }
}
export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await props.params;
    const body = await req.json();
    const { isSigned, content, fileUrl, status } = body;
    const currentUserId = (session.user as any)?.id;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID del registro" }, { status: 400 });
    }

    const updatedNote = await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalNote.findUnique({
        where: { id },
      });

      if (!previous) throw new Error("NOT_FOUND");

      const note = await tx.clinicalNote.update({
        where: { id },
        data: {
          ...(isSigned !== undefined && { isSigned }),
          ...(content !== undefined && { content }),
          ...(fileUrl !== undefined && { fileUrl }),
          ...(status !== undefined && { status }),
        },
        include: {
          author: {
            select: { name: true, specialty: true },
          },
        },
      });

      const isFile = note.type === "GENERAL" && Boolean(note.fileUrl);

      await createAuditEntry(tx, {
        userId: currentUserId,
        action: "UPDATE",
        entityId: id,
        patientId: previous.patientId,
        details: isFile
          ? `Modificación de documento/estudio: "${note.content}"`
          : `Actualización de nota clínica (${note.type})`,
        oldData: {
          content: previous.content,
          status: previous.status,
          isSigned: previous.isSigned,
          hasFile: Boolean(previous.fileUrl),
        },
        newData: {
          content: note.content,
          status: note.status,
          isSigned: note.isSigned,
          hasFile: Boolean(note.fileUrl),
        },
      });

      return note;
    });

    return NextResponse.json(updatedNote);
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    console.error("Error en PATCH /api/clinical-notes/[id]:", error);
    return NextResponse.json({ error: "Error interno al actualizar la nota" }, { status: 500 });
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
      return NextResponse.json({ error: "Falta el ID del registro" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalNote.findUnique({
        where: { id },
      });

      if (!previous) throw new Error("NOT_FOUND");
      const isAdmin = userRole === "ADMIN" || userRole === "ADMINISTRADOR" || userRole === "ADMINISTRATION";
      const isAuthor = previous.authorId === currentUser.id;

      if (!isAdmin && !isAuthor) {
        throw new Error("FORBIDDEN");
      }

      await tx.clinicalNote.delete({
        where: { id },
      });

      const isFile = previous.type === "GENERAL" && Boolean(previous.fileUrl);

      await createAuditEntry(tx, {
        userId: currentUser.id,
        action: "DELETE",
        entityId: id,
        patientId: previous.patientId,
        details: isFile
          ? `Eliminación permanente de archivo adjunto: "${previous.content}"`
          : `Eliminación de nota clínica (${previous.type})`,
        oldData: {
          type: previous.type,
          content: previous.content,
          status: previous.status,
          hasFile: Boolean(previous.fileUrl),
          authorId: previous.authorId,
          createdAt: previous.createdAt,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Registro eliminado y auditado correctamente" });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "El registro no existe o ya fue eliminado" }, { status: 404 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "No tiene permisos para eliminar este registro del expediente" },
        { status: 403 }
      );
    }
    console.error("Error en DELETE /api/clinical-notes/[id]:", error);
    return NextResponse.json({ error: "Error interno al eliminar el registro" }, { status: 500 });
  }
}