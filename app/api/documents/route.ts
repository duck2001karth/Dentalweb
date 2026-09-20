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
    console.error("Error al registrar auditoría en PatientDocument:", err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Falta el ID del paciente" }, { status: 400 });
    }

    const docs = await prisma.patientDocument.findMany({
      where: { patientId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            specialty: true,
            professionalCard: true,
            signatureBase64: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(docs);
  } catch (error) {
    console.error("Error al obtener documentos del paciente:", error);
    return NextResponse.json({ error: "Error al obtener documentos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { patientId, name, type, size, url, authorId } = body;

    if (!patientId || !name || !url) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (patientId, name o url)" },
        { status: 400 }
      );
    }

    const currentAuthorId = authorId || (session.user as any)?.id;

    if (!currentAuthorId) {
      return NextResponse.json(
        { error: "No se identificó al autor del documento" },
        { status: 400 }
      );
    }

    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.patientDocument.create({
        data: {
          patientId,
          name,
          type: type || "Desconocido",
          size: String(size || "0 KB"),
          url,
          authorId: currentAuthorId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              specialty: true,
              professionalCard: true,
              signatureBase64: true,
            },
          },
        },
      });

      await createAuditEntry(tx, {
        userId: currentAuthorId,
        action: "CREATE",
        entityId: created.id,
        patientId,
        details: `Subida de documento/archivo: "${created.name}"`,
        newData: {
          name: created.name,
          type: created.type,
          size: created.size,
          hasUrl: Boolean(created.url),
        },
      });

      return created;
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Error al guardar documento del paciente:", error);
    return NextResponse.json(
      { error: "Error interno al guardar el documento" },
      { status: 500 }
    );
  }
}