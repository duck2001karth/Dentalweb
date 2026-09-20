import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params; 
    const tasks = await prisma.patientTask.findMany({
      where: { patientId: params.id },
      include: { assignedTo: { select: { name: true } }, creator: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const { title, creatorId, assignedToId, dueDate } = body;

    if (!title || !creatorId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const task = await prisma.patientTask.create({
      data: {
        title, 
        creatorId, 
        patientId: params.id,
        assignedToId: assignedToId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: { assignedTo: { select: { name: true } } }
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}