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
        { error: "La fecha y hora son obligatorias" },
        { status: 400 }
      );
    }

    const cleanDateStr = newDate.includes("T") 
      ? newDate.split("T")[0] 
      : newDate;
    const combinedDateTime = new Date(`${cleanDateStr}T${newTime}:00`);

    if (isNaN(combinedDateTime.getTime())) {
      return NextResponse.json(
        { error: "La fecha enviada es inválida" },
        { status: 400 }
      );
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: combinedDateTime,
        startTime: newTime,
        endTime: endTime || newTime,
        reason: reason || "Reprogramación de turno",
        status: "SCHEDULED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cita reprogramada correctamente",
      cita: updatedAppointment,
    });
  } catch (error: any) {
    console.error("Error en reschedule API:", error);
    return NextResponse.json(
      { error: "Error al procesar la reprogramación" },
      { status: 500 }
    );
  }
}