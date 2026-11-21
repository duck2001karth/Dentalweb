-- Protege la trazabilidad: NO eliminar usuarios/pacientes que tengan auditorías.
-- Ejecutar mediante Prisma Migrate después de respaldar PostgreSQL.
-- En caso de existir relaciones adicionales restrictivas, la eliminación física
-- seguirá bloqueada; la baja administrativa debe usar isActive/isDeleted.
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_patientId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
