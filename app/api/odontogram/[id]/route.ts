import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";

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
        { error: "No tiene permisos para eliminar registros clínicos" },
        { status: 403 }
      );
    }

    const { id } = await props.params;

    if (!id) {
      return NextResponse.json({ error: "Falta el identificador del registro" }, { status: 400 });
    }

    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Desconocido";
    await prisma.$transaction(async (tx) => {
      const previous = await tx.odontogramRecord.findUnique({
        where: { id },
      });

      if (!previous) {
        throw new Error("NOT_FOUND");
      }

      await tx.odontogramRecord.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: "DELETE",
          entity: "ODONTOGRAM",
          entityId: id,
          patientId: previous.patientId,
          details: `Eliminación de hallazgo clínico (${previous.status}) en pieza #${previous.toothNumber}`,
          oldData: {
            toothNumber: previous.toothNumber,
            surfaces: previous.surfaces,
            status: previous.status,
            notes: previous.notes,
            isEvolution: previous.isEvolution,
            authorId: previous.authorId,
          },
          newData: null,
          ipAddress,
          userAgent,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Registro eliminado y auditado correctamente" });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "El registro no existe o ya fue eliminado" }, { status: 404 });
    }
    console.error("Error en DELETE /api/odontogram/[id]:", error);
    return NextResponse.json({ error: "Error interno al eliminar el registro" }, { status: 500 });
  }
}