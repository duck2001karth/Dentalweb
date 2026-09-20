import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, props: { params: Promise<{ id: string, taskId: string }> }) {
  try {
    const params = await props.params; 
    const body = await req.json();
    const { isCompleted } = body;

    const task = await prisma.patientTask.update({
      where: { id: params.taskId },
      data: { isCompleted },
      include: { assignedTo: { select: { name: true } } }
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string, taskId: string }> }) {
  try {
    const params = await props.params;

    await prisma.patientTask.delete({
      where: { id: params.taskId }
    });

    return NextResponse.json({ success: true, message: "Tarea eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}