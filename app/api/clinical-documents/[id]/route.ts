import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const doc = await prisma.clinicalDocument.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// BORRADO LÓGICO (Anulación)
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await prisma.clinicalDocument.update({
      where: { id: params.id },
      data: { isVoided: true } // Solo lo marcamos como anulado
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}