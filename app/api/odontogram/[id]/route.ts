import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { headers } from "next/headers"
import { Prisma } from "@prisma/client"

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (req, { user, params }) => {
    const id = params.id as string

    if (!id) throw new Error("Falta el identificador del registro")

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const previous = await tx.odontogramRecord.findUnique({
        where: { id },
      })
      
      if (!previous) throw new Error("NOT_FOUND")

      await tx.odontogramRecord.delete({
        where: { id },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_ODONTOGRAM_RECORD",
          entity: "ODONTOGRAM",
          entityId: id,
          patientId: previous.patientId,
          details: `Eliminación de hallazgo clínico (${previous.status}) en pieza #${previous.toothNumber}`,
          oldData: {
            toothNumber: previous.toothNumber,
            surfaces: previous.surfaces,
            status: previous.status,
            notes: previous.notes,
            isEvolution: previous.isEvolution,
            authorId: previous.authorId,
          },
          newData: Prisma.JsonNull,
          ipAddress,
          userAgent,
        },
      })
    })

    return { success: true, message: "Registro eliminado y auditado correctamente" }
  }
)