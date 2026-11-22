-- DENTALWEB: aplicar en una ventana de mantenimiento después de pg_dump.
-- La migración anterior de protección puede ya existir: este paso asegura el estado efectivo.
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_patientId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Bloquea alteraciones/borrados mediante el rol normal de la aplicación.
-- Los propietarios/superusuarios pueden desactivar triggers; requiere controles de cuenta y copias externas.
CREATE OR REPLACE FUNCTION public.dentalweb_audit_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog es de solo anexado: no se permite %', TG_OP
    USING ERRCODE = '42501';
END;
$$;
DROP TRIGGER IF EXISTS dentalweb_audit_append_only_trigger ON "AuditLog";
CREATE TRIGGER dentalweb_audit_append_only_trigger
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION public.dentalweb_audit_append_only();

-- Registro compacto sin identidad explícita; clave = SHA-256 de email normalizado y secreto.
-- La aplicación necesita privilegios de SELECT/INSERT/UPDATE/DELETE sobre esta tabla.
CREATE TABLE IF NOT EXISTS public."LoginRateLimit" (
  "keyHash" VARCHAR(64) PRIMARY KEY,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "blockedUntil" TIMESTAMPTZ NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "LoginRateLimit_updatedAt_idx" ON public."LoginRateLimit" ("updatedAt");
