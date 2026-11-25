-- Solo lectura. No devuelve datos de pacientes ni contraseñas.
SELECT to_regclass('public."LoginRateLimit"') AS tabla_limite;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'lastSeenAt';
