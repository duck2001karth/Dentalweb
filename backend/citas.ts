import { prisma } from "@/lib/db"
import { AppointmentInput, UpdateAppointmentInput, AppointmentWithDetails } from "@/types/appointments"

export const createCita = async (input: AppointmentInput, userId: string) => {
  return prisma.appointment.create({
    data: {
      date: typeof input.date === "string" ? new Date(input.date) : input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      box: input.box || null,
      reason: input.reason || null,
      status: "SCHEDULED", 
      payment: "UP_TO_DATE", 

      patient: {
        connect: { id: input.patientId },
      },
      doctor: {
        connect: { id: input.doctorId },
      },
    },
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true, ci: true, phone: true }
      },
      doctor: {
        select: { id: true, name: true }
      },
    }
  })
}

export const updateCita = async (id: string, userId: string, input: UpdateAppointmentInput) => {
  // 1. Verificamos que exista y pertenezca a la clínica/doctor actual
  const existingCita = await prisma.appointment.findFirst({
    where: { 
      id,
      // Descomenta si quieres que solo el doctor asignado pueda editarla
      // doctorId: userId 
    },
  })

  if (!existingCita) {
    throw new Error("No autorizado o cita no encontrada")
  }

  // 2. Actualizamos
  return prisma.appointment.update({
    where: {
      id,
    },
    data: {
      status: input.status,
      payment: input.payment,
      box: input.box,
      reason: input.reason,
      date: input.date ? (typeof input.date === "string" ? new Date(input.date) : input.date) : undefined,
      startTime: input.startTime,
      endTime: input.endTime,
    },
    include: {
      patient: true,
      doctor: true,
    }
  })
}

export const getCitas = async (userId: string) => {
  return prisma.appointment.findMany({
    where: {
    },
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true, ci: true }
      },
      doctor: {
        select: { id: true, name: true }
      }
    },
    orderBy: {
      date: 'desc'
    }
  })
}

export const getCitasByDate = async (userId: string, fechaStr: string): Promise<AppointmentWithDetails[]> => {
  if (!fechaStr) {
    throw new Error("La fecha es requerida")
  }

  const inicioDia = new Date(`${fechaStr}T00:00:00.000Z`)
  const finDia = new Date(`${fechaStr}T23:59:59.999Z`)

  const citas = await prisma.appointment.findMany({
    where: {
      date: {
        gte: inicioDia,
        lte: finDia,
      },
    },
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true, ci: true, phone: true }
      }, 
      doctor: {
        select: { id: true, name: true }
      },  
    },
    orderBy: {
      startTime: 'asc', 
    },
  })

  return citas as unknown as AppointmentWithDetails[];
}

export const deleteCita = async (id: string, userId: string) => {
  const existingCita = await prisma.appointment.findFirst({
    where: { 
      id,
    },
  })

  if (!existingCita) {
    throw new Error("No autorizado o cita no encontrada")
  }

  return prisma.appointment.delete({
    where: {
      id,
    },
  })
}

export const getCita = async (id: string, userId: string) => {
  return prisma.appointment.findFirst({
    where: {
      id,
    },
    include: {
      patient: true,
      doctor: true,
    }
  })
}

export const getCitasStatsCount = async (userId: string) => {

  const all = await prisma.appointment.count()

  const completed = await prisma.appointment.count({
    where: { status: "COMPLETED" },
  })

  const waiting = await prisma.appointment.count({
    where: { status: "WAITING" },
  })

  const inProgress = await prisma.appointment.count({
    where: { status: "IN_PROGRESS" },
  })

  const scheduled = await prisma.appointment.count({
    where: { status: "SCHEDULED" },
  })

  return {
    all: all,
    completed: completed,
    waiting: waiting,
    inProgress: inProgress,
    scheduled: scheduled,
  }
}