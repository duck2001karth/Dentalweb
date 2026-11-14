import { NextResponse } from "next/server"
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"

// Contadores agregados: no devuelve expedientes ni datos personales.
export const GET = createApiHandler(
  { roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  async () => {
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [totalPatients, newPatientsThisWeek] = await Promise.all([
      prisma.patient.count({ where: { isDeleted: false } }),
      prisma.patient.count({
        where: { isDeleted: false, createdAt: { gte: weekStart } },
      }),
    ])

    return NextResponse.json(
      { totalPatients, newPatientsThisWeek },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  },
)
