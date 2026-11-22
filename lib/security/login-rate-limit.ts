import { createHash } from "node:crypto"
import { prisma } from "@/lib/db"

// Funciona en múltiples instancias de Vercel: contador persistente en PostgreSQL.
// No registrar correos/contraseñas en logs; requiere NEXTAUTH_SECRET de alta entropía.
const WINDOW_MINUTES = 15
const BLOCK_MINUTES = 15
const MAX_FAILURES = 8

function keyFor(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("NEXTAUTH_SECRET no configurado")
  return createHash("sha256")
    .update(secret).update("\u0000").update(email.trim().toLowerCase())
    .digest("hex")
}

export async function isLoginBlocked(email: string): Promise<boolean> {
  const key = keyFor(email)
  const rows = await prisma.$queryRaw<Array<{ blocked: boolean }>>`
    SELECT ("blockedUntil" IS NOT NULL AND "blockedUntil" > NOW()) AS blocked
    FROM public."LoginRateLimit" WHERE "keyHash" = ${key}
  `
  return rows[0]?.blocked ?? false
}

export async function recordLoginFailure(email: string): Promise<void> {
  const key = keyFor(email)
  // UPSERT atómico por cuenta: no hay contador en memoria ni carrera read-modify-write.
  await prisma.$executeRaw`
    INSERT INTO public."LoginRateLimit" ("keyHash", "attempts", "windowStart", "blockedUntil", "updatedAt")
    VALUES (${key}, 1, NOW(), NULL, NOW())
    ON CONFLICT ("keyHash") DO UPDATE SET
      "attempts" = CASE
        WHEN public."LoginRateLimit"."windowStart" < NOW() - INTERVAL '15 minutes' THEN 1
        ELSE public."LoginRateLimit"."attempts" + 1 END,
      "windowStart" = CASE
        WHEN public."LoginRateLimit"."windowStart" < NOW() - INTERVAL '15 minutes' THEN NOW()
        ELSE public."LoginRateLimit"."windowStart" END,
      "blockedUntil" = CASE
        WHEN public."LoginRateLimit"."blockedUntil" > NOW() THEN public."LoginRateLimit"."blockedUntil"
        WHEN public."LoginRateLimit"."windowStart" < NOW() - INTERVAL '15 minutes' THEN NULL
        WHEN public."LoginRateLimit"."attempts" + 1 >= ${MAX_FAILURES} THEN NOW() + INTERVAL '15 minutes'
        ELSE NULL END,
      "updatedAt" = NOW()
  `
}

export async function resetLoginFailures(email: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM public."LoginRateLimit" WHERE "keyHash" = ${keyFor(email)}`
}

// Usado en documentación/alertas. No requiere cron para proteger el login.
export const loginLimitPolicy = { windowMinutes: WINDOW_MINUTES, blockMinutes: BLOCK_MINUTES, maxFailures: MAX_FAILURES } as const
