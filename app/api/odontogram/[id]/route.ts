import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

export const DELETE = createApiHandler(
  { roles: ["ADMIN", "DOCTOR"] },
  async (_req, { user, params }) => {
    const id = typeof params.id === "string" ? params.id.trim() : ""

    if (!id || id.length > 128) {
      return NextResponse.json(
        { error: "Identificador de registro inválido" },
        { status: 400 }
      )
    }

    const requestHeaders = await headers()
    const ipAddress = (
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      requestHeaders.get("x-real-ip") ||
      "Desconocido"
    ).slice(0, 128)
    const userAgent = (requestHeaders.get("user-agent") || "Desconocido").slice(0, 512)

    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const previous = await tx.odontogramRecord.findUnique({
            where: { id },
            select: {
              id: true,
              patientId: true,
              planId: true,
              authorId: true,
              toothNumber: true,
              status: true,
              isEvolution: true,
              patient: { select: { isDeleted: true } },
            },
          })

          if (!previous || previous.patient.isDeleted) {
            return { kind: "not-found" as const }
          }

          if (user.role !== "ADMIN" && previous.authorId !== user.id) {
            return { kind: "forbidden" as const }
          }

          // Las evoluciones clínicas forman parte del historial del paciente.
          if (previous.isEvolution) {
            return { kind: "protected" as const }
          }

          if (previous.planId) {
            const plan = await tx.treatmentPlan.findUnique({
              where: { id: previous.planId },
              select: {
                status: true,
                approvals: { select: { id: true }, take: 1 },
                payments: { select: { id: true }, take: 1 },
              },
            })

            // No borrar hallazgos asociados a presupuestos aprobados o cobrados.
            if (
              !plan ||
              plan.status === "ACTIVE" ||
              plan.status === "COMPLETED" ||
              plan.approvals.length > 0 ||
              plan.payments.length > 0
            ) {
              return { kind: "protected" as const }
            }
          }

          const deleted = await tx.odontogramRecord.deleteMany({
            where: {
              id,
              authorId: user.role === "ADMIN" ? undefined : user.id,
              planId: previous.planId,
              isEvolution: false,
            },
          })

          if (deleted.count !== 1) {
            return { kind: "conflict" as const }
          }

          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: "DELETE_ODONTOGRAM_RECORD",
              entity: "ODONTOGRAM",
              entityId: previous.id,
              patientId: previous.patientId,
              details: `Eliminación de hallazgo en pieza #${previous.toothNumber}`,
              oldData: {
                toothNumber: previous.toothNumber,
                status: previous.status,
                isEvolution: previous.isEvolution,
                authorId: previous.authorId,
                planId: previous.planId,
              },
              ipAddress,
              userAgent,
            },
          })

          return { kind: "ok" as const }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )

      if (result.kind === "not-found") {
        return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
      }
      if (result.kind === "forbidden") {
        return NextResponse.json(
          { error: "No tiene permisos para eliminar este hallazgo" },
          { status: 403 }
        )
      }
      if (result.kind === "protected") {
        return NextResponse.json(
          { error: "Este hallazgo forma parte del historial clínico o de un plan protegido y no se puede eliminar" },
          { status: 409 }
        )
      }
      if (result.kind === "conflict") {
        return NextResponse.json(
          { error: "El registro cambió durante la operación. Actualiza la página antes de intentarlo nuevamente" },
          { status: 409 }
        )
      }

      return { success: true, message: "Registro eliminado y auditado correctamente" }
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2034") {
          return NextResponse.json(
            { error: "Se modificó información simultáneamente. Actualiza antes de reintentar" },
            { status: 409 }
          )
        }
        if (error.code === "P2025") {
          return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
        }
      }
      throw error
    }
  }
)
