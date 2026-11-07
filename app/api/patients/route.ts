import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { patientAdministrativeSelect } from "./patient-select"

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async (_req, { searchParams }) => {
    const search = (searchParams.get("search") || "").trim().slice(0, 120)
    const terms = search.split(/\s+/).filter(Boolean)

    const whereClause = {
      isDeleted: false,
      ...(terms.length > 0
        ? {
            AND: terms.map((term) => ({
              OR: [
                { firstName: { contains: term, mode: "insensitive" as const } },
                { lastName: { contains: term, mode: "insensitive" as const } },
                { ci: { contains: term, mode: "insensitive" as const } },
              ],
            })),
          }
        : {}),
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: search ? 20 : 50,
      select: patientAdministrativeSelect,
    })

    return { patients }
  }
)
export const POST = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
    schema: z.any(),
  },
  async (req, { data }) => {
    const input = data.input || data

    if (!input.ci && !input.rut) {
      throw new Error("El campo Cédula de Identidad (CI) es obligatorio.")
    }

    const patientDataToSave = {
      firstName: input.firstName,
      lastName: input.lastName,
      ci: input.ci || input.rut,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,

      tipoRegistro: input.tipoRegistro || undefined,
      cedulaAcudiente: input.cedulaAcudiente || undefined,
      tipoIdentificacion: input.tipoIdentificacion || undefined,
      nombreSocial: input.nombreSocial || undefined,
      sexo: input.sexo || undefined,
      grupoSanguineo: input.grupoSanguineo || undefined,
      pertenenciaEtnica: input.pertenenciaEtnica || undefined,
      estadoCivil: input.estadoCivil || undefined,
      nivelEducativo: input.nivelEducativo || undefined,
      profesion: input.profesion || undefined,
      tipoPaciente: input.tipoPaciente || undefined,
      eps: input.eps || undefined,
      email: input.email || undefined,
      address: input.address || undefined,
      ciudad: input.ciudad || undefined,
      departamento: input.departamento || undefined,
      zonaResidencia: input.zonaResidencia || undefined,
      telefonoFijo: input.telefonoFijo || undefined,
      phone: input.phone || undefined,
      nombreAcompanante: input.nombreAcompanante || undefined,
      telefonoAcompanante: input.telefonoAcompanante || undefined,
      nombreResponsable: input.nombreResponsable || undefined,
      convenio: input.convenio || undefined,
      gestante: input.gestante === true,
      observaciones: input.observaciones || undefined,

      medicalAlerts: input.medicalAlerts || undefined,
    }

    try {
      const newPatient = await prisma.patient.create({
        data: patientDataToSave,
      })

      const { medicalAlerts, observaciones, ...patientForResponse } = newPatient
      return { patient: patientForResponse }
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("Ya existe un paciente registrado con ese CI/Identificación.")
      }
      throw error
    }
  }
)
