import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newDate, newTime, endTime, reason } = body;

    if (!newDate || !newTime) {
      return NextResponse.json(
        { error: "La nueva fecha y hora de inicio son obligatorias" },
        { status: 400 }
      );
    }
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });

    if (!currentAppointment) {
      return NextResponse.json(
        { error: "La cita seleccionada no existe" },
        { status: 404 }
      );
    }

    const combinedDateTime = new Date(`${newDate}T${newTime}:00`);
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: combinedDateTime,
        startTime: newTime,
        ...(endTime && { endTime }), 
        status: "SCHEDULED",
        ...(reason && { reason }),
      },
    });

    return NextResponse.json({
      message: "Cita reprogramada exitosamente",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error al reprogramar la cita:", error);
    return NextResponse.json(
      { error: "Error al procesar la reprogramación" },
      { status: 500 }
    );
  }
}