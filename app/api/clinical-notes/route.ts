import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "patientId requerido" }, { status: 400 });
    }

    const notes = await prisma.clinicalNote.findMany({
      where: { patientId: patientId },
      include: { 
        author: { 
          select: { 
            name: true,
            id: true,
            specialty: true 
          } 
        } 
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ clinicalNotes: notes });
  } catch (error) {
    console.error("Error al obtener notas clínicas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body.input || body;
    const { 
      type, 
      content, 
      authorId, 
      patientId, 
      fileUrl, 
      professionalSignature, 
      patientSignature, 
      status 
    } = input;

    if (!content || !authorId || !patientId) {
      return NextResponse.json({ error: "Faltan datos requeridos (content, authorId o patientId)" }, { status: 400 });
    }

    const note = await prisma.clinicalNote.create({
      data: {
        type: type || "EVOLUTION",
        content,
        status: status || "IN_PROGRESS",
        authorId,
        patientId,
        fileUrl: fileUrl || null,
        professionalSignature: professionalSignature || null,
        patientSignature: patientSignature || null
      },
      include: { 
        author: { 
          select: { 
            name: true,
            specialty: true 
          } 
        } 
      }
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating clinical note:", error);
    return NextResponse.json({ error: "Error interno del servidor al crear la nota" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const input = body.input || body;
    const { id, content, status, fileUrl, professionalSignature, patientSignature, isSigned } = input;

    if (!id) {
      return NextResponse.json({ error: "ID de la nota requerido" }, { status: 400 });
    }

    const updatedNote = await prisma.clinicalNote.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(professionalSignature !== undefined && { professionalSignature }),
        ...(patientSignature !== undefined && { patientSignature }),
        ...(isSigned !== undefined && { isSigned }),
      },
      include: { 
        author: { 
          select: { name: true, specialty: true } 
        } 
      }
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error updating clinical note:", error);
    return NextResponse.json({ error: "Error al actualizar la nota" }, { status: 500 });
  }
}