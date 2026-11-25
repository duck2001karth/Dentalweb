import { createHash } from "node:crypto"
import { prisma } from "@/lib/db"
const MAX_FAILURES = 8
function keyFor(email: string) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("AuthUnavailable")
  // Mantener el hash anterior para no reiniciar los bloqueos existentes.
  return createHash("sha256").update(secret).update("\u0000").update(email.trim().toLowerCase()).digest("hex") as string
}
export async function isLoginBlocked(email: string) {
  const rows = await prisma.$queryRaw<Array<{ blocked: boolean }>>`SELECT COALESCE("blockedUntil" > NOW(), false) AS blocked FROM public."LoginRateLimit" WHERE "keyHash" = ${keyFor(email)}`
  return rows[0]?.blocked ?? false
}
export async function claimLoginAttempt(email: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ attempts: number }>>`INSERT INTO public."LoginRateLimit" ("keyHash", "attempts", "windowStart", "blockedUntil", "updatedAt") VALUES (${keyFor(email)}, 1, NOW(), NULL, NOW())
  ON CONFLICT ("keyHash") DO UPDATE SET
  "attempts" = CASE WHEN "LoginRateLimit"."blockedUntil" > NOW() THEN "LoginRateLimit"."attempts" WHEN "LoginRateLimit"."blockedUntil" IS NOT NULL OR "LoginRateLimit"."windowStart" <= NOW() - INTERVAL '15 minutes' THEN 1 ELSE "LoginRateLimit"."attempts" + 1 END,
  "windowStart" = CASE WHEN "LoginRateLimit"."blockedUntil" > NOW() THEN "LoginRateLimit"."windowStart" WHEN "LoginRateLimit"."blockedUntil" IS NOT NULL OR "LoginRateLimit"."windowStart" <= NOW() - INTERVAL '15 minutes' THEN NOW() ELSE "LoginRateLimit"."windowStart" END,
  "blockedUntil" = CASE WHEN "LoginRateLimit"."blockedUntil" > NOW() THEN "LoginRateLimit"."blockedUntil" WHEN "LoginRateLimit"."blockedUntil" IS NOT NULL OR "LoginRateLimit"."windowStart" <= NOW() - INTERVAL '15 minutes' THEN NULL WHEN "LoginRateLimit"."attempts" + 1 >= ${MAX_FAILURES} THEN NOW() + INTERVAL '15 minutes' ELSE NULL END,
  "updatedAt" = NOW()
  WHERE "LoginRateLimit"."blockedUntil" IS NULL OR "LoginRateLimit"."blockedUntil" <= NOW()
  RETURNING "attempts"`
  return rows.length === 1
}
export async function recordLoginFailure(email: string) { await claimLoginAttempt(email) }
export async function resetLoginFailures(email: string) { await prisma.$executeRaw`DELETE FROM public."LoginRateLimit" WHERE "keyHash" = ${keyFor(email)}` }
export const loginLimitPolicy = { windowMinutes: 15, blockMinutes: 15, maxFailures: MAX_FAILURES } as const
