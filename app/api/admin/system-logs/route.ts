import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const privateHeaders = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
}

// Se mantiene el contrato del frontend: array de { id, level, message, createdAt }.
// Son diagnósticos del instante de la consulta, NO logs históricos ni un escaneo de seguridad.
export const GET = createApiHandler(
  { roles: ["ADMIN"] },
  async () => {
    const checkedAt = new Date()
    const measuredHeap = process.memoryUsage()
    const start = performance.now()

    try {
      await prisma.$queryRaw`SELECT 1`
      const dbLatency = Math.round(performance.now() - start)
      const usedHeapMB = Math.round(measuredHeap.heapUsed / 1024 / 1024)
      const totalHeapMB = Math.round(measuredHeap.heapTotal / 1024 / 1024)

      const measurements = [
        {
          id: `db-${checkedAt.getTime()}`,
          level: dbLatency > 500 ? "WARN" : "INFO",
          message: `PostgreSQL respondió a una consulta de comprobación en ${dbLatency} ms.`,
          createdAt: checkedAt,
        },
        {
          id: `node-${checkedAt.getTime()}`,
          level: "INFO",
          message: `Memoria heap del proceso Node.js: ${usedHeapMB} MB usados de ${totalHeapMB} MB asignados.`,
          createdAt: checkedAt,
        },
      ]

      return NextResponse.json(measurements, { status: 200, headers: privateHeaders })
    } catch (error) {
      console.error("No fue posible comprobar la conectividad con PostgreSQL", error)
      return NextResponse.json([
        {
          id: `db-error-${checkedAt.getTime()}`,
          level: "ERROR",
          message: "No se pudo verificar la conexión a PostgreSQL en esta consulta.",
          createdAt: checkedAt,
        },
      ], { status: 503, headers: privateHeaders })
    }
  }
)
