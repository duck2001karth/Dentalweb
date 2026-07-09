import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const comments = await prisma.patientComment.findMany({
      where: { patientId: params.id },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params; 
    const body = await req.json();
    const { text, authorId } = body;

    if (!text || !authorId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const comment = await prisma.patientComment.create({
      data: { text, authorId, patientId: params.id },
      include: { author: { select: { name: true } } }
    });
    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}