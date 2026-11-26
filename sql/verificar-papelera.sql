SELECT current_database() AS base;
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='AuditLog' AND column_name='archivedPatientId';
SELECT conname, confdeltype, pg_get_constraintdef(oid) AS definicion FROM pg_constraint WHERE conrelid='public."AuditLog"'::regclass AND conname='AuditLog_patientId_fkey';
SELECT tgname,tgenabled FROM pg_trigger WHERE tgrelid='public."AuditLog"'::regclass AND tgname='dentalweb_audit_append_only_trigger';
SELECT to_regprocedure('public.carmo_patient_trash_blockers(text)') AS funcion;
SELECT COUNT(*) AS registrados, COUNT(*) FILTER (WHERE NOT "isDeleted") AS activos, COUNT(*) FILTER (WHERE "isDeleted") AS archivados FROM public."Patient";
