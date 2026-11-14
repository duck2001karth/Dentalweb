import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { patientAdministrativeSelect } from "./patient-select"

// Conserva el contrato anterior { patients } y añade metadatos para mostrar
// el total real sin descargar todas las fichas clínicas del servidor.
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

    // El listado sigue limitado a 50 registros (20 cuando hay búsqueda).
    // La página es opcional para conservar el funcionamiento del frontend.
    const pageParam = searchParams.get("page")
    const parsedPage = pageParam === null ? 1 : Number(pageParam)
    if (!Number.isSafeInteger(parsedPage) || parsedPage < 1 || parsedPage > 100_000) {
      return Response.json({ error: "Número de página inválido" }, { status: 400 })
    }

    // Permite al directorio pedir siete filas, pero mantiene los valores anteriores
    // para otros consumidores de la API que no envían `limit`.
    const limitParam = searchParams.get("limit")
    const requestedLimit = limitParam === null ? (search ? 20 : 50) : Number(limitParam)
    if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) {
      return Response.json({ error: "Tamaño de página inválido (1–100)" }, { status: 400 })
    }
    const limit = requestedLimit
    const skip = (parsedPage - 1) * limit

    // count() no está sujeto al 'take' de findMany().
    // totalPatients cuenta a todos los pacientes activos, sin filtro de búsqueda.
    const [patients, total, totalPatients] = await prisma.$transaction([
      prisma.patient.findMany({
        where: whereClause,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: limit,
        select: patientAdministrativeSelect,
      }),
      prisma.patient.count({ where: whereClause }),
      prisma.patient.count({ where: { isDeleted: false } }),
    ])

    return {
      patients,
      total,             // Total que coincide con el filtro actual
      totalPatients,     // Total de pacientes activos para la tarjeta
      pagination: {
        page: parsedPage,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + patients.length < total,
      },
    }
  }
)

// Registro de pacientes sin cambios funcionales.
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
