import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status })

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (_req, { user, params }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""
    if (!id || id.length > 128) {
      return errorResponse("ID de documento inválido", 400)
    }

    const requestHeaders = await headers()
    // Estos encabezados son informativos: nunca se usan para autorizar al usuario.
    const ipAddress = (
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      requestHeaders.get("x-real-ip") ||
      "Desconocido"
    ).slice(0, 128)
    const userAgent = (requestHeaders.get("user-agent") || "Desconocido").slice(0, 512)

    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.patientDocument.findUnique({
        where: { id },
        select: {
          id: true,
          patientId: true,
          authorId: true,
          name: true,
          type: true,
          size: true,
          createdAt: true,
          patient: { select: { isDeleted: true } },
        },
      })

      if (!previous || previous.patient.isDeleted) {
        return { kind: "not_found" as const }
      }

      const isAdmin = user.role === "ADMIN"
      const isAuthor = previous.authorId === user.id

      if (!isAdmin && !isAuthor) {
        return { kind: "forbidden" as const }
      }

      // La condición preserva la autoría verificada al ejecutar la escritura.
      // No se devuelve ni se registra el contenido almacenado en `url`.
      const deleted = await tx.patientDocument.deleteMany({
        where: {
          id,
          ...(isAdmin ? {} : { authorId: user.id }),
        },
      })

      if (deleted.count !== 1) {
        return { kind: "not_found" as const }
      }

      // Si la auditoría falla, la transacción revierte también la eliminación.
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE_PATIENT_DOCUMENT",
          entity: "PATIENT_DOCUMENT",
          entityId: id,
          patientId: previous.patientId,
          details: "Eliminación de documento adjunto de paciente",
          oldData: {
            documentId: previous.id,
            type: previous.type,
            size: previous.size,
            authorId: previous.authorId,
            createdAt: previous.createdAt.toISOString(),
          },
          ipAddress,
          userAgent,
        },
      })

      return { kind: "deleted" as const }
    })

    if (result.kind === "not_found") {
      return errorResponse("Documento no encontrado", 404)
    }
    if (result.kind === "forbidden") {
      return errorResponse("No tiene permisos para eliminar este documento", 403)
    }

    return {
      success: true,
      message: "Documento eliminado y auditado correctamente",
    }
  }
)
