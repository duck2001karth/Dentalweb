
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

function readBoundedInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number
): number | null {
  if (value === null || value.trim() === "") return fallback

  const text = value.trim()
  if (!/^\d+$/.test(text)) return null

  const parsed = Number(text)

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    return null
  }

  return parsed
}

export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (_req, { searchParams }) => {
    const days = readBoundedInteger(
      searchParams.get("days"), 7, 1, 365
    )

    const limit = readBoundedInteger(
      searchParams.get("limit"), 100, 1, 200
    )

    const doctorId =
      searchParams.get("doctorId")?.trim() || null

    if (
      days === null ||
      limit === null ||
      (doctorId && doctorId.length > 128)
    ) {
      return NextResponse.json(
        { error: "Parámetros de búsqueda inválidos" },
        { status: 400 }
      )
    }

    const fromDate = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    )

    const evolutions = await prisma.clinicalNote.findMany({
      where: {
        type: "EVOLUTION",
        createdAt: {
          gte: fromDate,
        },
        patient: {
          is: {
            isDeleted: false,
          },
        },
        ...(doctorId ? { authorId: doctorId } : {}),
      },

      select: {
        id: true,
        patientId: true,
        authorId: true,
        type: true,
        status: true,
        content: true,
        isSigned: true,
        professionalSignature: true,

        createdAt: true,
        updatedAt: true,

        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            ci: true,
          },
        },

        author: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: limit,
    })

    return evolutions.map(
      ({ professionalSignature, ...evolution }) => ({
        ...evolution,
        content: evolution.content.slice(0, 300),
        isSigned: Boolean(
          evolution.isSigned || professionalSignature
        ),
      })
    )
  }
)
