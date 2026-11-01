import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { headers } from "next/headers"

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (req, { user, params }) => {
    const id = params.id as string

    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "Desconocido"

    await prisma.$transaction(async (tx) => {
      const previous = await tx.patientDocument.findUnique({
        where: { id },
      })

      if (!previous) throw new Error("NOT_FOUND")

      const isAdmin = user.role === "ADMIN"
      const isAuthor = previous.authorId === user.id

      if (!isAdmin && !isAuthor) {
        throw new Error("UNAUTHORIZED_ROLE")
      }

      await tx.patientDocument.delete({
        where: { id },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_PATIENT_DOCUMENT",
          entity: "PATIENT_DOCUMENT",
          entityId: id,
          patientId: previous.patientId,
          details: `Eliminación de documento adjunto: "${previous.name}"`,
          oldData: {
            name: previous.name,
            type: previous.type,
            size: previous.size,
            authorId: previous.authorId,
            createdAt: previous.createdAt,
          },
          ipAddress,
          userAgent,
        },
      })
    })

    return {
      success: true,
      message: "Documento eliminado y auditado correctamente",
    }
  }
)