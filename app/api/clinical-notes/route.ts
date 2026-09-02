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
    console.error("Error al registrar auditoría en ClinicalNote:", err);
  }
}
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "patientId requerido" }, { status: 400 });
    }

    const notes = await prisma.clinicalNote.findMany({
      where: { patientId },
      include: {
        author: {
          select: {
            name: true,
            id: true,
            specialty: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ clinicalNotes: notes });
  } catch (error) {
    console.error("Error al obtener notas clínicas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const input = body.input || body;
    const {
      type,
      content,
      authorId,
      patientId,
      fileUrl,
      professionalSignature,
      patientSignature,
      status,
    } = input;

    const currentAuthorId = authorId || (session.user as any)?.id;

    if (!content || !currentAuthorId || !patientId) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (content, authorId o patientId)" },
        { status: 400 }
      );
    }

    const noteType = type || "EVOLUTION";
    const noteStatus = status || "IN_PROGRESS";

    const note = await prisma.$transaction(async (tx) => {
      const created = await tx.clinicalNote.create({
        data: {
          type: noteType,
          content,
          status: noteStatus,
          authorId: currentAuthorId,
          patientId,
          fileUrl: fileUrl || null,
          professionalSignature: professionalSignature || null,
          patientSignature: patientSignature || null,
        },
        include: {
          author: {
            select: {
              name: true,
              specialty: true,
            },
          },
        },
      });
      const isFileDoc = noteType === "GENERAL" && Boolean(fileUrl);
      const detailMsg = isFileDoc
        ? `Carga de archivo/radiografía: "${content}"`
        : `Registro de nota clínica (${noteType})`;

      await createAuditEntry(tx, {
        userId: currentAuthorId,
        action: "CREATE",
        entityId: created.id,
        patientId,
        details: detailMsg,
        newData: {
          type: created.type,
          content: created.content,
          status: created.status,
          hasFile: Boolean(created.fileUrl),
          hasProfessionalSignature: Boolean(created.professionalSignature),
          hasPatientSignature: Boolean(created.patientSignature),
        },
      });

      return created;
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating clinical note:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al crear la nota" },
      { status: 500 }
    );
  }
}
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const input = body.input || body;
    const {
      id,
      content,
      status,
      fileUrl,
      professionalSignature,
      patientSignature,
      isSigned,
    } = input;

    if (!id) {
      return NextResponse.json({ error: "ID de la nota requerido" }, { status: 400 });
    }

    const currentUserId = (session.user as any)?.id;

    const updatedNote = await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalNote.findUnique({
        where: { id },
      });

      if (!previous) throw new Error("NOT_FOUND");

      const updated = await tx.clinicalNote.update({
        where: { id },
        data: {
          ...(content !== undefined && { content }),
          ...(status !== undefined && { status }),
          ...(fileUrl !== undefined && { fileUrl }),
          ...(professionalSignature !== undefined && { professionalSignature }),
          ...(patientSignature !== undefined && { patientSignature }),
          ...(isSigned !== undefined && { isSigned }),
        },
        include: {
          author: {
            select: { name: true, specialty: true },
          },
        },
      });

      await createAuditEntry(tx, {
        userId: currentUserId,
        action: "UPDATE",
        entityId: id,
        patientId: previous.patientId,
        details: `Actualización de nota clínica (${updated.type})`,
        oldData: {
          content: previous.content,
          status: previous.status,
          isSigned: previous.isSigned,
          hasProfessionalSignature: Boolean(previous.professionalSignature),
        },
        newData: {
          content: updated.content,
          status: updated.status,
          isSigned: updated.isSigned,
          hasProfessionalSignature: Boolean(updated.professionalSignature),
        },
      });

      return updated;
    });

    return NextResponse.json(updatedNote);
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Nota clínica no encontrada" }, { status: 404 });
    }
    console.error("Error updating clinical note:", error);
    return NextResponse.json({ error: "Error al actualizar la nota" }, { status: 500 });
  }
}