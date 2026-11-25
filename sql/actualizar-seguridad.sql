BEGIN;
CREATE TABLE IF NOT EXISTS public."LoginRateLimit" (
 "keyHash" VARCHAR(64) PRIMARY KEY, "attempts" INTEGER NOT NULL DEFAULT 0,
 "windowStart" TIMESTAMPTZ NOT NULL DEFAULT now(), "blockedUntil" TIMESTAMPTZ NULL,
 "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS "LoginRateLimit_updatedAt_idx" ON public."LoginRateLimit" ("updatedAt");
ALTER TABLE public."LoginRateLimit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."LoginRateLimit" FROM anon, authenticated;
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);
COMMIT;
