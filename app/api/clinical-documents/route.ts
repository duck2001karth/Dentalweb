import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    if (!patientId) return NextResponse.json({ error: "Falta ID" }, { status: 400 });

    const docs = await prisma.clinicalDocument.findMany({
      where: { patientId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const doc = await prisma.clinicalDocument.create({ data: body });
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}