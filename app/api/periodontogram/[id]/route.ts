import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Eliminar
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await prisma.periodontogram.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

// Editar
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    
    const record = await prisma.periodontogram.update({
      where: { id: params.id },
      data: { data: body.data },
    });
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}