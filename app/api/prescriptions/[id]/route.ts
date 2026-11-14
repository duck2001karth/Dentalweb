
import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
const editableFields = z.object({
  medications: z.string().trim().min(1).max(10000).optional(),
  indications: z.string().trim().min(1).max(10000).optional(),
  observations: z.string().max(10000).nullable().optional(),
}).passthrough()
const updateSchema = z.union([
  editableFields,
  z.object({ input: editableFields }).passthrough(),
])

async function requestMetadata() {
  const h = await headers()

  return {
    ipAddress: (
      h.get("x-forwarded-for")?.split(",")[0].trim() ||
      h.get("x-real-ip") ||
      "Desconocido"
    ).slice(0, 128),

    userAgent: (
      h.get("user-agent") || "Desconocido"
    ).slice(0, 512),
  }
}

const notFound = () =>
  NextResponse.json(
    { error: "Receta no encontrada" },
    { status: 404 }
  )

const forbidden = () =>
  NextResponse.json(
    { error: "No tiene permisos para modificar esta receta" },
    { status: 403 }
  )

const locked = () =>
  NextResponse.json(
    {
      error:
        "La receta ya está firmada y no se puede modificar ni eliminar. Emita una nueva receta si necesita corregirla.",
    },
    { status: 409 }
  )

export const PUT = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
    schema: updateSchema,
  },
  async (_req, { user, params, data }) => {
    const id =
      typeof params.id === "string" ? params.id.trim() : ""

    if (!id || id.length > 128) {
      return NextResponse.json(
        { error: "ID de receta inválido" },
        { status: 400 }
      )
    }
    const parsed = updateSchema.parse(data)

    const payload =
      "input" in parsed ? parsed.input : parsed

    const input = editableFields.parse(payload)

    const {
      medications,
      indications,
      observations,
    } = input

    if (
      medications === undefined &&
      indications === undefined &&
      observations === undefined
    ) {
      return NextResponse.json(
        { error: "No hay campos editables para actualizar" },
        { status: 400 }
      )
    }

    const metadata = await requestMetadata()

    const result = await prisma.$transaction(
      async (tx) => {
        const previous = await tx.prescription.findUnique({
          where: { id },
          select: {
            id: true,
            patientId: true,
            authorId: true,
            doctorSignature: true,
            medications: true,
            indications: true,
            observations: true,
            patient: {
              select: {
                isDeleted: true,
              },
            },
          },
        })

        if (!previous || previous.patient.isDeleted) {
          return { kind: "not-found" as const }
        }

        const isAdmin = user.role === "ADMIN"
        const isAuthor = previous.authorId === user.id

        if (!isAdmin && !isAuthor) {
          return { kind: "forbidden" as const }
        }
        if (previous.doctorSignature !== null) {
          return { kind: "locked" as const }
        }
        const changed = await tx.prescription.updateMany({
          where: {
            id,
            doctorSignature: null,
          },
          data: {
            ...(medications !== undefined
              ? { medications }
              : {}),

            ...(indications !== undefined
              ? { indications }
              : {}),

            ...(observations !== undefined
              ? { observations }
              : {}),
          },
        })

        if (changed.count !== 1) {
          return { kind: "locked" as const }
        }

        const updated =
          await tx.prescription.findUniqueOrThrow({
            where: { id },
            select: {
              id: true,
              patientId: true,
              authorId: true,
              medications: true,
              indications: true,
              observations: true,
              doctorSignature: true,
              createdAt: true,
              updatedAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  specialty: true,
                  professionalCard: true,
                },
              },
            },
          })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "UPDATE_PRESCRIPTION",
            entity: "PRESCRIPTION",
            entityId: id,
            patientId: previous.patientId,
            details: "Edición de receta sin firma",

            oldData: {
              authorId: previous.authorId,
              hasDoctorSignature: false,
            },

            newData: {
              changedFields: [
                ...(medications !== undefined
                  ? ["medications"]
                  : []),

                ...(indications !== undefined
                  ? ["indications"]
                  : []),

                ...(observations !== undefined
                  ? ["observations"]
                  : []),
              ],
              hasDoctorSignature: false,
            },

            ...metadata,
          },
        })

        return {
          kind: "ok" as const,
          prescription: updated,
        }
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    )

    if (result.kind === "not-found") return notFound()
    if (result.kind === "forbidden") return forbidden()
    if (result.kind === "locked") return locked()

    return {
      ...result.prescription,
      doctorLicense:
        result.prescription.author?.professionalCard || "",
    }
  }
)

export const DELETE = createApiHandler(
  {
    roles: ["ADMIN", "DOCTOR"],
  },
  async (_req, { user, params }) => {
    const id =
      typeof params.id === "string" ? params.id.trim() : ""

    if (!id || id.length > 128) {
      return NextResponse.json(
        { error: "ID de receta inválido" },
        { status: 400 }
      )
    }

    const metadata = await requestMetadata()

    const result = await prisma.$transaction(
      async (tx) => {
        const previous = await tx.prescription.findUnique({
          where: { id },
          select: {
            id: true,
            patientId: true,
            authorId: true,
            doctorSignature: true,
            patient: {
              select: {
                isDeleted: true,
              },
            },
          },
        })

        if (!previous || previous.patient.isDeleted) {
          return { kind: "not-found" as const }
        }

        const isAdmin = user.role === "ADMIN"
        const isAuthor = previous.authorId === user.id

        if (!isAdmin && !isAuthor) {
          return { kind: "forbidden" as const }
        }
        if (previous.doctorSignature !== null) {
          return { kind: "locked" as const }
        }

        const deleted = await tx.prescription.deleteMany({
          where: {
            id,
            doctorSignature: null,
          },
        })

        if (deleted.count !== 1) {
          return { kind: "locked" as const }
        }

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "DELETE_PRESCRIPTION",
            entity: "PRESCRIPTION",
            entityId: id,
            patientId: previous.patientId,
            details: "Eliminación de receta sin firma",

            oldData: {
              authorId: previous.authorId,
              hasDoctorSignature: false,
            },

            ...metadata,
          },
        })

        return { kind: "ok" as const }
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    )

    if (result.kind === "not-found") return notFound()
    if (result.kind === "forbidden") return forbidden()
    if (result.kind === "locked") return locked()

    return {
      success: true,
      message:
        "Receta sin firma eliminada y auditada correctamente",
    }
  }
)
