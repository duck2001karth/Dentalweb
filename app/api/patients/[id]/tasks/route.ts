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
    const tasks = await prisma.patientTask.findMany({
      where: { patientId: id },
      include: { assignedTo: { select: { name: true } }, creator: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { title, assignedToId, dueDate } = body;

    if (!title) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });

    const creatorId = (session.user as any).id;

    const task = await prisma.patientTask.create({
      data: {
        title, 
        creatorId, 
        patientId: id,
        assignedToId: assignedToId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: { assignedTo: { select: { name: true } } }
    });

    await logAuditEvent({
      userId: creatorId,
      action: "CREATE",
      entity: "PATIENT_TASK",
      entityId: task.id,
      patientId: id,
      details: `Nueva tarea asignada: "${title}"`
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}