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
    console.error("Error al registrar auditoría en Recetas:", err);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Falta patientId" }, { status: 400 });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            specialty: true,
            signatureBase64: true,
            professionalCard: true, // Campo exacto del modelo User
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedPrescriptions = prescriptions.map((p: any) => {
      const authorCard = p.author?.professionalCard || "";
      const authorSig = p.author?.signatureBase64 || null;

      return {
        ...p,
        doctorSignature: p.doctorSignature || authorSig,
        doctorLicense: (p as any).doctorLicense || authorCard,
      };
    });

    return NextResponse.json(formattedPrescriptions);
  } catch (error) {
    console.error("Error GET prescriptions:", error);
    return NextResponse.json({ error: "Error interno al consultar recetas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const data = body.input || body;
    const { patientId, medications, indications, observations, authorId, doctorSignature } = data;

    if (!patientId) {
      return NextResponse.json({ error: "patientId es requerido" }, { status: 400 });
    }

    const patientExists = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patientExists) {
      return NextResponse.json(
        { error: "El paciente especificado no existe en la base de datos." },
        { status: 404 }
      );
    }

    let resolvedAuthorId = authorId || (session.user as any)?.id;
    let validUser = resolvedAuthorId
      ? await prisma.user.findUnique({
          where: { id: resolvedAuthorId },
          select: {
            id: true,
            signatureBase64: true,
            professionalCard: true,
          },
        })
      : null;

    if (!validUser) {
      if (session.user.email) {
        validUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            signatureBase64: true,
            professionalCard: true,
          },
        });
      }

      if (!validUser) {
        validUser = await prisma.user.findFirst({
          where: { role: { in: ["DOCTOR", "ADMIN"] } },
          select: {
            id: true,
            signatureBase64: true,
            professionalCard: true,
          },
        });
      }
    }

    resolvedAuthorId = validUser ? validUser.id : null;
    const finalDoctorSignature = doctorSignature || validUser?.signatureBase64 || null;

    const newPrescription = await prisma.$transaction(async (tx) => {
      const created = await tx.prescription.create({
        data: {
          patientId,
          medications: medications || "",
          indications: indications || "",
          observations: observations || null,
          authorId: resolvedAuthorId,
          doctorSignature: finalDoctorSignature,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              specialty: true,
              signatureBase64: true,
              professionalCard: true,
            },
          },
        },
      });

      if (resolvedAuthorId) {
        await createAuditEntry(tx, {
          userId: resolvedAuthorId,
          action: "CREATE",
          entityId: created.id,
          patientId,
          details: "Emisión de receta médica/odontológica",
          newData: {
            medications: created.medications,
            indications: created.indications,
            observations: created.observations,
            hasDoctorSignature: Boolean(created.doctorSignature),
          },
        });
      }

      return created;
    });

    const authorCard = newPrescription.author?.professionalCard || "";

    return NextResponse.json(
      {
        ...newPrescription,
        doctorSignature: newPrescription.doctorSignature || newPrescription.author?.signatureBase64 || null,
        doctorLicense: authorCard,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error POST prescription:", error);
    return NextResponse.json(
      { error: error.message || "Error al guardar receta" },
      { status: 500 }
    );
  }
}