import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  if (!patientId) return NextResponse.json({ error: "Falta ID" }, { status: 400 });

  const records = await prisma.periodontogram.findMany({
    where: { patientId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { patientId, data, authorId } = body;

  const record = await prisma.periodontogram.create({
    data: { patientId, data, authorId },
  });
  return NextResponse.json(record);
}