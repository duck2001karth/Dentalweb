import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

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

    const userRole = String((session.user as any).role || "").toUpperCase();
    
    if (userRole !== "DOCTOR" && userRole !== "ADMIN" && userRole !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Solo especialistas o administradores pueden emitir documentos." },
        { status: 403 }
      );
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

      await logAuditEvent({
        userId: currentAuthorId,
        action: "CREATE",
        entity: "PATIENT_DOCUMENT",
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