import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { withProtection, ProtectedRouteContext } from "@/lib/api-wrapper";
import { sanitizeRichHTML, escapeHTML } from "@/lib/sanitize";

export const PUT = withProtection(["ADMIN", "DOCTOR"], async (req: Request, ctx: ProtectedRouteContext) => {
  const { user, params } = ctx;
  const id = params.id as string;
  const body = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Falta el ID del documento" }, { status: 400 });
  }

  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
  const userAgent = headersList.get("user-agent") || "Desconocido";

  const updatedDoc = await prisma.$transaction(async (tx) => {
    const previous = await tx.clinicalDocument.findUnique({ where: { id } });
    
    if (!previous) throw new Error("NOT_FOUND");
    if (previous.isVoided) throw new Error("VOIDED_CANNOT_EDIT");

    const cleanTitle = body.title !== undefined ? escapeHTML(body.title) : previous.title;
    const cleanContent = body.content !== undefined ? sanitizeRichHTML(body.content) : previous.content;
    const cleanSpecialistName = body.specialistName !== undefined ? escapeHTML(body.specialistName) : previous.specialistName;

    const doc = await tx.clinicalDocument.update({
      where: { id },
      data: {
        title: cleanTitle,
        content: cleanContent,
        specialistName: cleanSpecialistName,
        specialistIdDoc: body.specialistIdDoc !== undefined ? body.specialistIdDoc : previous.specialistIdDoc,
        doctorSignature: body.doctorSignature !== undefined ? body.doctorSignature : previous.doctorSignature,
        patientSignature: body.patientSignature !== undefined ? body.patientSignature : previous.patientSignature,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        entity: "CLINICAL_DOCUMENT",
        entityId: id,
        patientId: previous.patientId,
        details: `Actualización de documento clínico: "${doc.title}"`,
        oldData: {
          title: previous.title,
          hasDoctorSignature: Boolean(previous.doctorSignature),
          hasPatientSignature: Boolean(previous.patientSignature),
        },
        newData: {
          title: doc.title,
          hasDoctorSignature: Boolean(doc.doctorSignature),
          hasPatientSignature: Boolean(doc.patientSignature),
        },
        ipAddress,
        userAgent
      },
    });

    return doc;
  });

  return NextResponse.json(updatedDoc);
});

export const DELETE = withProtection(["ADMIN", "DOCTOR"], async (req: Request, ctx: ProtectedRouteContext) => {
  const { user, params } = ctx;
  const id = params.id as string;

  if (!id) {
    return NextResponse.json({ error: "Falta el ID del documento" }, { status: 400 });
  }

  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
  const userAgent = headersList.get("user-agent") || "Desconocido";

  await prisma.$transaction(async (tx) => {
    const previous = await tx.clinicalDocument.findUnique({ where: { id } });
    if (!previous) throw new Error("NOT_FOUND");

    await tx.clinicalDocument.update({
      where: { id },
      data: { isVoided: true },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE",
        entity: "CLINICAL_DOCUMENT",
        entityId: id,
        patientId: previous.patientId,
        details: `Anulación médico-legal del documento: "${previous.title}"`,
        oldData: {
          isVoided: false,
          title: previous.title,
          specialistName: previous.specialistName,
        },
        newData: { isVoided: true },
        ipAddress,
        userAgent
      },
    });
  });

  return NextResponse.json({ success: true, message: "Documento clínico anulado y auditado con éxito" });
});