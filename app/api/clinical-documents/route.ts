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
        entity: "CLINICAL_DOCUMENT",
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
    console.error("Error registrando auditoría en ClinicalDocument:", err);
  }
}
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Falta el ID del paciente" }, { status: 400 });
    }

    const docs = await prisma.clinicalDocument.findMany({
      where: { patientId },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(docs);
  } catch (error) {
    console.error("Error al obtener documentos clínicos:", error);
    return NextResponse.json(
      { error: "Error al consultar los documentos clínicos" },
      { status: 500 }
    );
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
      title,
      content,
      specialistName,
      specialistIdDoc,
      doctorSignature,
      patientSignature,
      isVoided,
      authorId,
    } = body;

    if (!patientId || !title || !content) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios (paciente, título o contenido)" },
        { status: 400 }
      );
    }

    const currentAuthorId = authorId || (session.user as any)?.id;

    if (!currentAuthorId) {
      return NextResponse.json(
        { error: "No se identificó al profesional responsable" },
        { status: 400 }
      );
    }
    const document = await prisma.$transaction(async (tx) => {
      const created = await tx.clinicalDocument.create({
        data: {
          patientId,
          title,
          content,
          specialistName: specialistName || null,
          specialistIdDoc: specialistIdDoc || null,
          doctorSignature: doctorSignature || null,
          patientSignature: patientSignature || null,
          isVoided: isVoided || false,
          authorId: currentAuthorId,
        },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });

      await createAuditEntry(tx, {
        userId: currentAuthorId,
        action: "CREATE",
        entityId: created.id,
        patientId,
        details: `Creación de documento legal/clínico: "${created.title}"`,
        newData: {
          title: created.title,
          specialistName: created.specialistName,
          hasDoctorSignature: Boolean(created.doctorSignature),
          hasPatientSignature: Boolean(created.patientSignature),
          isVoided: created.isVoided,
        },
      });

      return created;
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error al registrar documento clínico:", error);
    return NextResponse.json(
      { error: "Error interno al guardar el documento legal" },
      { status: 500 }
    );
  }
}