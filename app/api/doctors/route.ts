import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiHandler } from "@/lib/server/api-handler"

export const dynamic = "force-dynamic"
export const GET = createApiHandler({ roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] }, async () => {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR", isActive: true },
    select: { id: true, name: true, specialty: true, calendarColor: true, role: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  })
  return NextResponse.json(doctors, { headers: { "Cache-Control": "private, no-store" } })
})
