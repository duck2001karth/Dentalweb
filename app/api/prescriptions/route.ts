import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) return NextResponse.json({ error: "Falta ID" }, { status: 400 });

    const records = await prisma.prescription.findMany({
      where: { patientId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientId, medications, indications, authorId } = body;

    const record = await prisma.prescription.create({
      data: { patientId, medications, indications, authorId },
    });
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}