import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) return NextResponse.json({ error: "patientId requerido" }, { status: 400 });

    const notes = await prisma.clinicalNote.findMany({
      where: { patientId: patientId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ clinicalNotes: notes });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, content, authorId, patientId, fileUrl, professionalSignature, patientSignature } = body.input;

    if (!content || !authorId || !patientId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const note = await prisma.clinicalNote.create({
      data: {
        type, 
        content,
        authorId,
        patientId,
        fileUrl,                 
        professionalSignature,   
        patientSignature         
      },
      include: { author: { select: { name: true } } }
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error creating clinical note:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}