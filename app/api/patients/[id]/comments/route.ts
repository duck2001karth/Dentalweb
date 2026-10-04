import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id } = await params;
    const comments = await prisma.patientComment.findMany({
      where: { patientId: id },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id } = await params; 
    const body = await req.json();
    const { text, authorId } = body;

    if (!text) return NextResponse.json({ error: "El texto es obligatorio" }, { status: 400 });

    const currentAuthorId = authorId || (session.user as any).id;

    const comment = await prisma.patientComment.create({
      data: { text, authorId: currentAuthorId, patientId: id },
      include: { author: { select: { name: true } } }
    });

    await logAuditEvent({
      userId: currentAuthorId,
      action: "CREATE",
      entity: "PATIENT_COMMENT",
      entityId: comment.id,
      patientId: id,
      details: `Añadió un comentario en el expediente del paciente.`
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id } = await params;
    const url = new URL(req.url);
    const commentId = url.searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "Falta el ID del comentario" }, { status: 400 });
    }

    const previousComment = await prisma.patientComment.findUnique({ where: { id: commentId } });
    if (!previousComment) return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });

    await prisma.patientComment.delete({
      where: { id: commentId }
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: "DELETE",
      entity: "PATIENT_COMMENT",
      entityId: commentId,
      patientId: id,
      details: `Eliminó un comentario del expediente del paciente.`,
      oldData: { text: previousComment.text }
    });

    return NextResponse.json({ success: true, message: "Comentario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}