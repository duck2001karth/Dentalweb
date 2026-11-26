-- Carmo Dental: aplicar primero en una copia de pruebas. Compatible con PostgreSQL y Supabase.
BEGIN;
ALTER TABLE public."AuditLog" ADD COLUMN IF NOT EXISTS "archivedPatientId" text;
-- Solo se cambia la FK de paciente de auditoría. No se borran filas durante la instalación.
ALTER TABLE public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_patientId_fkey";
ALTER TABLE public."AuditLog" ADD CONSTRAINT "AuditLog_patientId_fkey"
 FOREIGN KEY ("patientId") REFERENCES public."Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Conserva el identificador histórico cuando PostgreSQL ejecuta la acción referencial.
-- No permite cambios directos, ni borrados, ni modificaciones de los demás campos.
CREATE OR REPLACE FUNCTION public.dentalweb_audit_append_only() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF pg_trigger_depth()>1 AND OLD."patientId" IS NOT NULL AND NEW."patientId" IS NULL
     AND (to_jsonb(NEW)-'patientId')=(to_jsonb(OLD)-'patientId')
     AND (OLD."archivedPatientId" IS NULL OR OLD."archivedPatientId"=OLD."patientId")
     AND NOT EXISTS (SELECT 1 FROM public."Patient" WHERE id=OLD."patientId") THEN
   NEW."archivedPatientId" := OLD."patientId";
   RETURN NEW;
  END IF;
 END IF;
 RAISE EXCEPTION 'AuditLog es de solo anexado: no se permite %', TG_OP USING ERRCODE='42501';
END $$;
DROP TRIGGER IF EXISTS dentalweb_audit_append_only_trigger ON public."AuditLog";
CREATE TRIGGER dentalweb_audit_append_only_trigger BEFORE UPDATE OR DELETE ON public."AuditLog"
 FOR EACH ROW EXECUTE FUNCTION public.dentalweb_audit_append_only();
-- Detecta dependencias reales mediante las restricciones del catálogo, incluso tablas de unión.
-- Una relación desconocida o compuesta se bloquea por precaución.
CREATE OR REPLACE FUNCTION public.carmo_patient_trash_blockers(p_id text) RETURNS text[]
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp SET row_security=off AS $$
DECLARE f record; table_name text; found_row boolean; blockers text[] := ARRAY[]::text[];
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."AuditLog"'::regclass AND confrelid='public."Patient"'::regclass AND conname='AuditLog_patientId_fkey' AND contype='f' AND confdeltype='n')
 OR NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public."AuditLog"'::regclass AND tgname='dentalweb_audit_append_only_trigger' AND tgenabled IN ('O','A')) THEN
  RAISE EXCEPTION 'Migración de papelera incompleta';
 END IF;
 FOR f IN SELECT c.conname,c.conrelid,c.conkey,c.confkey,n.nspname,r.relname,a.attname,pa.attname AS parent_col
  FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid JOIN pg_namespace n ON n.oid=r.relnamespace
  LEFT JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
  LEFT JOIN pg_attribute pa ON pa.attrelid=c.confrelid AND pa.attnum=c.confkey[1]
  WHERE c.contype='f' AND c.confrelid='public."Patient"'::regclass
 LOOP
  IF f.conrelid='public."AuditLog"'::regclass AND f.conname='AuditLog_patientId_fkey' THEN CONTINUE; END IF;
  IF cardinality(f.conkey)<>1 OR cardinality(f.confkey)<>1 OR f.parent_col<>'id' OR f.attname IS NULL THEN
   blockers:=array_append(blockers,f.relname||' (relación no verificada)'); CONTINUE;
  END IF;
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I.%I WHERE %I = $1)',f.nspname,f.relname,f.attname) INTO found_row USING p_id;
  IF found_row THEN blockers:=array_append(blockers,f.relname); END IF;
 END LOOP;
 -- Comprueba también modelos conocidos aunque una instalación antigua carezca de FK.
 FOREACH table_name IN ARRAY ARRAY['Appointment','ClinicalNote','Anamnesis','OdontogramRecord','Periodontogram','PatientDocument','Prescription','ClinicalDocument','TreatmentPlan','PatientComment','PatientTask','Payment','TaxDocument','TreatmentApproval'] LOOP
  IF to_regclass(format('public.%I',table_name)) IS NOT NULL AND NOT table_name=ANY(blockers) THEN
   EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE "patientId"=$1)',table_name) INTO found_row USING p_id;
   IF found_row THEN blockers:=array_append(blockers,table_name); END IF;
  END IF;
 END LOOP;
 RETURN blockers;
END $$;
-- La función solo inspecciona datos y no eleva privilegios. Restringir acceso API de Supabase.
REVOKE ALL ON FUNCTION public.carmo_patient_trash_blockers(text) FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  EXECUTE 'REVOKE ALL ON FUNCTION public.carmo_patient_trash_blockers(text) FROM anon';
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  EXECUTE 'REVOKE ALL ON FUNCTION public.carmo_patient_trash_blockers(text) FROM authenticated';
 END IF;
END $$;
-- Si Prisma utiliza un rol distinto al propietario, conceder EXECUTE solo a ese rol de backend.
COMMIT;
