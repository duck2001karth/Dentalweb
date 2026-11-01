import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { headers } from "next/headers"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (req, { params }) => {
    const id = params.id as string
    const patient = await prisma.patient.findUnique({ where: { id } })
    if (!patient) throw new Error("NOT_FOUND")
    return { patient }
  }
)

export const PATCH = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"], schema: z.any() },
  async (req, { params, user, data }) => {
    const id = params.id as string
    const input = data.input || data

    if (!input || Object.keys(input).length === 0) {
      throw new Error("No se proporcionaron datos para actualizar")
    }

    const safeData: any = {
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.ci !== undefined && { ci: input.ci }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.birthDate !== undefined && { birthDate: input.birthDate ? new Date(input.birthDate) : null }),
      ...(input.convenio !== undefined && { convenio: input.convenio }),
      ...(input.medicalAlerts !== undefined && { medicalAlerts: input.medicalAlerts }),
      ...(input.sexo !== undefined && { sexo: input.sexo }),
      ...(input.profesion !== undefined && { profesion: input.profesion }),
      ...(input.eps !== undefined && { eps: input.eps }),
      ...(input.tipoRegistro !== undefined && { tipoRegistro: input.tipoRegistro }),
      ...(input.cedulaAcudiente !== undefined && { cedulaAcudiente: input.cedulaAcudiente }),
      ...(input.tipoIdentificacion !== undefined && { tipoIdentificacion: input.tipoIdentificacion }),
      ...(input.nombreSocial !== undefined && { nombreSocial: input.nombreSocial }),
      ...(input.grupoSanguineo !== undefined && { grupoSanguineo: input.grupoSanguineo }),
      ...(input.pertenenciaEtnica !== undefined && { pertenenciaEtnica: input.pertenenciaEtnica }),
      ...(input.estadoCivil !== undefined && { estadoCivil: input.estadoCivil }),
      ...(input.nivelEducativo !== undefined && { nivelEducativo: input.nivelEducativo }),
      ...(input.tipoPaciente !== undefined && { tipoPaciente: input.tipoPaciente }),
      ...(input.ciudad !== undefined && { ciudad: input.ciudad }),
      ...(input.departamento !== undefined && { departamento: input.departamento }),
      ...(input.zonaResidencia !== undefined && { zonaResidencia: input.zonaResidencia }),
      ...(input.telefonoFijo !== undefined && { telefonoFijo: input.telefonoFijo }),
      ...(input.nombreAcompanante !== undefined && { nombreAcompanante: input.nombreAcompanante }),
      ...(input.telefonoAcompanante !== undefined && { telefonoAcompanante: input.telefonoAcompanante }),
      ...(input.nombreResponsable !== undefined && { nombreResponsable: input.nombreResponsable }),
      ...(input.gestante !== undefined && { gestante: Boolean(input.gestante) }),
      ...(input.observaciones !== undefined && { observaciones: input.observaciones }),
    }

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    const updatedPatient = await prisma.$transaction(async (tx) => {
      const previousPatient = await tx.patient.findUnique({ where: { id } })
      if (!previousPatient) throw new Error("NOT_FOUND")

      const res = await tx.patient.update({
        where: { id },
        data: safeData,
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_PATIENT",
          entity: "PATIENT",
          entityId: id,
          patientId: id,
          details: `Modificación de datos demográficos del paciente: ${res.firstName} ${res.lastName}`,
          oldData: previousPatient,
          newData: res,
          ipAddress,
          userAgent,
        },
      })
      return res
    })

    return { patient: updatedPatient }
  }
)

export const DELETE = createApiHandler(
  { roles: ["ADMIN"] },
  async (req, { params, user }) => {
    const id = params.id as string

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const previous = await tx.patient.findUnique({ where: { id } })
      if (!previous) throw new Error("NOT_FOUND")

      const deletedPatient = await tx.patient.update({
        where: { id },
        data: { isDeleted: true },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_PATIENT",
          entity: "PATIENT",
          entityId: id,
          patientId: id,
          details: `Eliminación lógica de paciente: ${deletedPatient.firstName} ${deletedPatient.lastName}`,
          oldData: { isDeleted: previous.isDeleted, ci: previous.ci },
          newData: { isDeleted: true },
          ipAddress,
          userAgent,
        },
      })
    })

    return { success: true }
  }
)