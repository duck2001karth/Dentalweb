import { NextResponse } from "next/server"
import { createApiHandler } from "@/lib/server/api-handler"
import { prisma } from "@/lib/db"
import { can } from "@/lib/security/permissions"

export const dynamic = "force-dynamic"

/** API interna para panel futuro: no expone datos clínicos ni identidades. */
export const GET = createApiHandler({ roles: ["ADMIN"] }, async (_req, { user }) => {
  if (!can(user.role, "security.alerts")) {
    return NextResponse.json({ error: "Permiso insuficiente" }, { status: 403 })
  }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [unauthorizedAccess, rateLimited] = await Promise.all([
    prisma.auditLog.count({ where: { action: "UNAUTHORIZED_ACCESS_ATTEMPT", createdAt: { gte: since } } }),
    prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total FROM public."LoginRateLimit"
      WHERE "blockedUntil" > NOW()
    `,
  ])
  return NextResponse.json({
    windowHours: 24,
    unauthorizedAccessAttempts: unauthorizedAccess,
    temporarilyBlockedLoginKeys: Number(rateLimited[0]?.total ?? 0),
    level: unauthorizedAccess >= 20 || Number(rateLimited[0]?.total ?? 0) >= 5 ? "REVIEW" : "NORMAL",
    generatedAt: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } })
})
