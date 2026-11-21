import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { AppointmentStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"
import { headers } from "next/headers"
import {
  clinicDate, conflictMessage, dateRange, lockAppointmentDay, minutes, storedDate, validInterval,
} from "@/lib/server/appointment-scheduling"

const createAppointmentSchema = z.object({
  date: z.string().min(10),
  startTime: z.string(),
  endTime: z.string(),
  patientId: z.string().min(1),
  doctorId: z.string().optional().nullable(),
  box: z.string().optional(),
  reason: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
})

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { user, searchParams }) => {
    const dayParam = searchParams.get("fecha")
    const doctorIdParam = searchParams.get("doctorId")
    const patientIdParam = searchParams.get("patientId")
    const whereClause: any = {}
    if (patientIdParam) whereClause.patientId = patientIdParam
    else if (user.role === "DOCTOR") whereClause.doctorId = user.id
    else if (doctorIdParam && doctorIdParam.toLowerCase() !== "all") whereClause.doctorId = doctorIdParam
    if (dayParam) {
      const day = clinicDate(dayParam)
      if (!day) return NextResponse.json({ error: "Fecha inválida" }, { status: 422 })
      whereClause.date = dateRange(day)
    }
    const citas = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, ci: true, phone: true } },
        doctor: { select: { id: true, name: true, specialty: true, calendarColor: true } },
      },
      orderBy: patientIdParam ? { date: "desc" } : { startTime: "asc" },
    })
    return { citas }
  },
)

export const POST = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.union([createAppointmentSchema, z.object({ input: createAppointmentSchema })]).transform((value) => "input" in value ? value.input : value) },
  async (_req, { user, data }) => {
    const day = clinicDate(data.date)
    if (!day) return NextResponse.json({ error: "Fecha inválida" }, { status: 422 })
    if (!validInterval(data.startTime, data.endTime) || minutes(data.endTime) - minutes(data.startTime) > 720) {
      return NextResponse.json({ error: "Horario inválido: use HH:mm y una duración de hasta 12 horas" }, { status: 422 })
    }
    if (data.status && data.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Una cita nueva debe empezar como SCHEDULED" }, { status: 422 })
    }
    // Un rol de recepción no puede ser asignado como especialista clínico.
    const doctorId = user.role === "DOCTOR" ? user.id : data.doctorId
    if (!doctorId) return NextResponse.json({ error: "Seleccione un especialista" }, { status: 422 })
    const doctor = await prisma.user.findFirst({ where: { id: doctorId, role: "DOCTOR", isActive: true }, select: { id: true } })
    if (!doctor) return NextResponse.json({ error: "Especialista clínico inválido o inactivo" }, { status: 422 })
    const box = data.box?.trim() || "Box 1"
    const h = await headers()
    const ipAddress = (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "Desconocido").slice(0, 128)
    const userAgent = (h.get("user-agent") || "Desconocido").slice(0, 512)

    const result = await prisma.$transaction(async tx => {
      await lockAppointmentDay(tx, day)
      const existing = await tx.appointment.findMany({
        where: { date: dateRange(day), status: { not: "CANCELLED" } },
        select: { id: true, patientId: true, doctorId: true, box: true, startTime: true, endTime: true },
      })
      const conflict = conflictMessage(existing, {
        patientId: data.patientId, doctorId: doctor.id, box, startTime: data.startTime, endTime: data.endTime,
      })
      if (conflict) return { error: conflict, code: 409 } as const
      const patient = await tx.patient.findFirst({ where: { id: data.patientId, isDeleted: false }, select: { id: true } })
      if (!patient) return { error: "Paciente no encontrado", code: 404 } as const
      const created = await tx.appointment.create({
        data: {
          date: storedDate(day), startTime: data.startTime, endTime: data.endTime,
          box, reason: data.reason || "Consulta general",
          patient: { connect: { id: data.patientId } },
          doctor: { connect: { id: doctor.id } },
          status: "SCHEDULED", payment: "UP_TO_DATE",
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, name: true, calendarColor: true } },
        },
      })
      await tx.auditLog.create({
        data: {
          userId: user.id, action: "CREATE_APPOINTMENT", entity: "APPOINTMENT",
          entityId: created.id, patientId: data.patientId,
          details: `Cita agendada ${day} ${data.startTime}-${data.endTime}`,
          newData: { date: day, startTime: data.startTime, endTime: data.endTime, box, doctorId: doctor.id, status: "SCHEDULED" },
          ipAddress, userAgent,
        },
      })
      return { cita: created } as const
    })
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.code })
    return { success: true, cita: result.cita }
  },
)
