import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
export const GET = createApiHandler({ roles: ["ADMIN"] }, async () => {
  const start = performance.now()
  await prisma.$queryRaw`SELECT 1`
  return NextResponse.json({ database: "ok", latencyMs: Math.round(performance.now() - start), checkedAt: new Date().toISOString(), storage: null }, { headers: { "Cache-Control": "private, no-store" } })
})
