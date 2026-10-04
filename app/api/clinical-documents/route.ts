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

    const userRole = String((session.user as any).role || "").toUpperCase();

    if (userRole !== "DOCTOR" && userRole !== "ADMIN" && userRole !== "ADMINISTRADOR") {
      return NextResponse.json(
        { error: "Solo el personal médico autorizado o administración pueden crear documentos clínicos legales." },
        { status: 403 }
      );
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

      await logAuditEvent({
        userId: currentAuthorId,
        action: "CREATE",
        entity: "CLINICAL_DOCUMENT",
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