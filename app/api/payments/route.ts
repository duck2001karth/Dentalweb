import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, ci: true }
        },
        processedBy: {
          select: { name: true }
        }
      }
    });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, amount, method, status, receiptNumber, notes, processedById } = body;

    const newPayment = await prisma.payment.create({
      data: {
        patientId,
        amount: parseFloat(amount),
        method,
        status,
        receiptNumber: receiptNumber || null,
        notes,
        processedById
      }
    });

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al registrar pago" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, amount, method, status, receiptNumber, notes } = body;

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        ...(amount && { amount: parseFloat(amount) }),
        ...(method && { method }),
        ...(status && { status }),
        receiptNumber: receiptNumber || null,
        notes
      }
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar pago" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await prisma.payment.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar pago" }, { status: 500 });
  }
}