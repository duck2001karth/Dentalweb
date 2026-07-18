import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        targetRole: { in: ['ADMIN', 'ALL'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar notificaciones" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    await prisma.notification.updateMany({
      where: { 
        targetRole: { in: ['ADMIN', 'ALL'] },
        isRead: false 
      },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar notificaciones" }, { status: 500 });
  }
}