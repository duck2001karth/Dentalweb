import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const { isSigned, content, fileUrl, status } = body;

    const note = await prisma.clinicalNote.update({
      where: { id: params.id },
      data: { 
        ...(isSigned !== undefined && { isSigned }),
        ...(content !== undefined && { content }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(status !== undefined && { status }), 
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ELIMINAR 
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await prisma.clinicalNote.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}