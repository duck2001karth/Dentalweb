import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function PATCH(
  req: Request, 
  props: { params: Promise<{ id: string, taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = await props.params;
    const body = await req.json();
    const { isCompleted } = body;

    const task = await prisma.patientTask.update({
      where: { id: params.taskId },
      data: { isCompleted: Boolean(isCompleted) },
      include: { assignedTo: { select: { name: true } } }
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: "UPDATE",
      entity: "PATIENT_TASK",
      entityId: params.taskId,
      patientId: params.id,
      details: `Tarea "${task.title}" marcada como ${isCompleted ? "completada" : "pendiente"}.`,
    });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Error interno al actualizar tarea" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request, 
  props: { params: Promise<{ id: string, taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = await props.params;
    const existingTask = await prisma.patientTask.findUnique({
      where: { id: params.taskId }
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    await prisma.patientTask.delete({
      where: { id: params.taskId }
    });

    await logAuditEvent({
      userId: (session.user as any).id,
      action: "DELETE",
      entity: "PATIENT_TASK",
      entityId: params.taskId,
      patientId: params.id,
      details: `Tarea eliminada: "${existingTask.title}".`,
      oldData: { title: existingTask.title }
    });

    return NextResponse.json({ success: true, message: "Tarea eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    return NextResponse.json({ error: "Error interno al eliminar tarea" }, { status: 500 });
  }
}