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
    console.error("Error registrando auditoría en ClinicalDocument [id]:", err);
  }
}
export async function PUT(
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
    const currentUserId = (session.user as any)?.id;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID del documento" }, { status: 400 });
    }

    const updatedDoc = await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalDocument.findUnique({
        where: { id },
      });

      if (!previous) {
        throw new Error("NOT_FOUND");
      }
      if (previous.isVoided) {
        throw new Error("VOIDED_CANNOT_EDIT");
      }
      const doc = await tx.clinicalDocument.update({
        where: { id },
        data: {
          title: body.title !== undefined ? body.title : previous.title,
          content: body.content !== undefined ? body.content : previous.content,
          specialistName: body.specialistName !== undefined ? body.specialistName : previous.specialistName,
          specialistIdDoc: body.specialistIdDoc !== undefined ? body.specialistIdDoc : previous.specialistIdDoc,
          doctorSignature: body.doctorSignature !== undefined ? body.doctorSignature : previous.doctorSignature,
          patientSignature: body.patientSignature !== undefined ? body.patientSignature : previous.patientSignature,
        },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });

      await createAuditEntry(tx, {
        userId: currentUserId,
        action: "UPDATE",
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
      });

      return doc;
    });

    return NextResponse.json(updatedDoc);
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Documento clínico no encontrado" }, { status: 404 });
    }
    if (error?.message === "VOIDED_CANNOT_EDIT") {
      return NextResponse.json(
        { error: "No se puede editar un documento clínico que ha sido anulado" },
        { status: 400 }
      );
    }
    console.error("Error en PUT /api/clinical-documents/[id]:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar el documento clínico" },
      { status: 500 }
    );
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
    const isAuthorized =
      userRole === "ADMIN" ||
      userRole === "ADMINISTRADOR" ||
      userRole === "DOCTOR";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "No tiene permisos suficientes para anular documentos clínicos" },
        { status: 403 }
      );
    }

    const { id } = await props.params;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID del documento" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const previous = await tx.clinicalDocument.findUnique({
        where: { id },
      });

      if (!previous) {
        throw new Error("NOT_FOUND");
      }

      // Marcado lógico como anulado (preserva la evidencia en base de datos)
      await tx.clinicalDocument.update({
        where: { id },
        data: { isVoided: true },
      });

      await createAuditEntry(tx, {
        userId: currentUser.id,
        action: "DELETE",
        entityId: id,
        patientId: previous.patientId,
        details: `Anulación médico-legal del documento: "${previous.title}"`,
        oldData: {
          isVoided: false,
          title: previous.title,
          specialistName: previous.specialistName,
          createdAt: previous.createdAt,
        },
        newData: {
          isVoided: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Documento clínico anulado y auditado con éxito",
    });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Documento clínico no encontrado" }, { status: 404 });
    }
    console.error("Error en DELETE /api/clinical-documents/[id]:", error);
    return NextResponse.json(
      { error: "Error al procesar la anulación del documento" },
      { status: 500 }
    );
  }
}