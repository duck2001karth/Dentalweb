import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { withProtection, ProtectedRouteContext } from "@/lib/api-wrapper";
import { sanitizeRichHTML, escapeHTML } from "@/lib/sanitize";

// GET: Lectura de documentos para personal clínico y recepción
export const GET = withProtection(["ADMIN", "DOCTOR", "RECEPTIONIST"], async (req: Request) => {
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
});

// POST: Creación de documentos (Solo personal médico y admin)
export const POST = withProtection(["ADMIN", "DOCTOR"], async (req: Request, ctx: ProtectedRouteContext) => {
  const { user } = ctx;
  const body = await req.json();
  const { patientId, title, content, specialistName, specialistIdDoc, doctorSignature, patientSignature, isVoided, authorId } = body;

  if (!patientId || !title || !content) {
    return NextResponse.json({ error: "Faltan datos obligatorios (paciente, título o contenido)" }, { status: 400 });
  }

  // PREVENCIÓN XSS (A03): Sanitización estricta antes de la base de datos
  const cleanTitle = escapeHTML(title);
  const cleanContent = sanitizeRichHTML(content);
  const cleanSpecialistName = specialistName ? escapeHTML(specialistName) : null;
  const currentAuthorId = authorId || user.id;

  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
  const userAgent = headersList.get("user-agent") || "Desconocido";

  const document = await prisma.$transaction(async (tx) => {
    const created = await tx.clinicalDocument.create({
      data: {
        patientId,
        title: cleanTitle,
        content: cleanContent,
        specialistName: cleanSpecialistName,
        specialistIdDoc: specialistIdDoc || null,
        doctorSignature: doctorSignature || null,
        patientSignature: patientSignature || null,
        isVoided: isVoided || false,
        authorId: currentAuthorId,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    await tx.auditLog.create({
      data: {
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
        ipAddress,
        userAgent
      },
    });

    return created;
  });

  return NextResponse.json(document, { status: 201 });
});