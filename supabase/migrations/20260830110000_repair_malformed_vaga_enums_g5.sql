BEGIN;

DO $preflight$
DECLARE
  application_labels text[];
  salary_labels text[];
  highlight_labels text[];
BEGIN
  IF to_regclass('public.vagas') IS NULL THEN
    RAISE EXCEPTION 'G5 preflight failed: public.vagas is missing';
  END IF;

  IF to_regtype('public.vaga_application_channel') IS NULL
     OR to_regtype('public.vaga_salary_mode') IS NULL
     OR to_regtype('public.vaga_highlight_type') IS NULL THEN
    RAISE EXCEPTION 'G5 preflight failed: one or more canonical vaga enum types are missing';
  END IF;

  IF to_regtype('public.vaga_application_channel_g5_legacy') IS NOT NULL
     OR to_regtype('public.vaga_salary_mode_g5_legacy') IS NOT NULL
     OR to_regtype('public.vaga_highlight_type_g5_legacy') IS NOT NULL THEN
    RAISE EXCEPTION 'G5 preflight failed: legacy repair enum names already exist';
  END IF;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
  INTO application_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_application_channel'::regtype;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
  INTO salary_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_salary_mode'::regtype;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
  INTO highlight_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_highlight_type'::regtype;

  IF application_labels IS DISTINCT FROM ARRAY[
    'internal' || chr(39) || ',' || chr(39) || 'whatsapp' || chr(39) || ',' || chr(39) || 'email' || chr(39) || ',' || chr(39) || 'external_url' || chr(39) || ',' || chr(39) || 'phone'
  ]::text[] THEN
    RAISE EXCEPTION 'G5 preflight failed: unexpected vaga_application_channel labels: %', application_labels;
  END IF;

  IF salary_labels IS DISTINCT FROM ARRAY[
    'fixed' || chr(39) || ',' || chr(39) || 'range' || chr(39) || ',' || chr(39) || 'a_combinar'
  ]::text[] THEN
    RAISE EXCEPTION 'G5 preflight failed: unexpected vaga_salary_mode labels: %', salary_labels;
  END IF;

  IF highlight_labels IS DISTINCT FROM ARRAY[
    'none' || chr(39) || ',' || chr(39) || 'premium' || chr(39) || ',' || chr(39) || 'sponsored' || chr(39) || ',' || chr(39) || 'featured',
    'none',
    'premium',
    'sponsored',
    'featured'
  ]::text[] THEN
    RAISE EXCEPTION 'G5 preflight failed: unexpected vaga_highlight_type labels: %', highlight_labels;
  END IF;

  IF EXISTS (SELECT 1 FROM public.vagas WHERE application_channel IS NOT NULL) THEN
    RAISE EXCEPTION 'G5 preflight failed: application_channel contains data; lossless mapping must be reviewed first';
  END IF;

  IF EXISTS (SELECT 1 FROM public.vagas WHERE salary_mode IS NOT NULL) THEN
    RAISE EXCEPTION 'G5 preflight failed: salary_mode contains data; lossless mapping must be reviewed first';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.vagas
    WHERE highlight_type IS NOT NULL
      AND highlight_type::text NOT IN ('none', 'premium', 'sponsored', 'featured')
  ) THEN
    RAISE EXCEPTION 'G5 preflight failed: highlight_type contains a noncanonical value';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND (
        p.prorettype IN (
          'public.vaga_application_channel'::regtype,
          'public.vaga_salary_mode'::regtype,
          'public.vaga_highlight_type'::regtype
        )
        OR EXISTS (
          SELECT 1
          FROM unnest(p.proargtypes::oid[]) AS arg_oid
          WHERE arg_oid IN (
            'public.vaga_application_channel'::regtype::oid,
            'public.vaga_salary_mode'::regtype::oid,
            'public.vaga_highlight_type'::regtype::oid
          )
        )
      )
  ) THEN
    RAISE EXCEPTION 'G5 preflight failed: a function signature depends on a vaga enum being rebuilt';
  END IF;
END
$preflight$;

ALTER TYPE public.vaga_application_channel
  RENAME TO vaga_application_channel_g5_legacy;
CREATE TYPE public.vaga_application_channel AS ENUM (
  'internal',
  'whatsapp',
  'email',
  'external_url',
  'phone'
);
ALTER TABLE public.vagas
  ALTER COLUMN application_channel TYPE public.vaga_application_channel
  USING application_channel::text::public.vaga_application_channel;

ALTER TYPE public.vaga_salary_mode
  RENAME TO vaga_salary_mode_g5_legacy;
CREATE TYPE public.vaga_salary_mode AS ENUM (
  'fixed',
  'range',
  'a_combinar'
);
ALTER TABLE public.vagas
  ALTER COLUMN salary_mode TYPE public.vaga_salary_mode
  USING salary_mode::text::public.vaga_salary_mode;

ALTER TABLE public.vagas
  ALTER COLUMN highlight_type DROP DEFAULT;
ALTER TYPE public.vaga_highlight_type
  RENAME TO vaga_highlight_type_g5_legacy;
CREATE TYPE public.vaga_highlight_type AS ENUM (
  'none',
  'premium',
  'sponsored',
  'featured'
);
ALTER TABLE public.vagas
  ALTER COLUMN highlight_type TYPE public.vaga_highlight_type
  USING highlight_type::text::public.vaga_highlight_type;
ALTER TABLE public.vagas
  ALTER COLUMN highlight_type SET DEFAULT 'none'::public.vaga_highlight_type;

DROP TYPE public.vaga_application_channel_g5_legacy RESTRICT;
DROP TYPE public.vaga_salary_mode_g5_legacy RESTRICT;
DROP TYPE public.vaga_highlight_type_g5_legacy RESTRICT;

DO $postcondition$
DECLARE
  application_labels text[];
  salary_labels text[];
  highlight_labels text[];
  application_column_type text;
  salary_column_type text;
  highlight_column_type text;
  highlight_default text;
BEGIN
  IF to_regtype('public.vaga_application_channel_g5_legacy') IS NOT NULL
     OR to_regtype('public.vaga_salary_mode_g5_legacy') IS NOT NULL
     OR to_regtype('public.vaga_highlight_type_g5_legacy') IS NOT NULL THEN
    RAISE EXCEPTION 'G5 postcondition failed: a legacy repair enum remains';
  END IF;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
  INTO application_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_application_channel'::regtype;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
  INTO salary_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_salary_mode'::regtype;

  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
  INTO highlight_labels
  FROM pg_enum e
  WHERE e.enumtypid = 'public.vaga_highlight_type'::regtype;

  IF application_labels IS DISTINCT FROM ARRAY['internal', 'whatsapp', 'email', 'external_url', 'phone']::text[] THEN
    RAISE EXCEPTION 'G5 postcondition failed: vaga_application_channel labels are not canonical: %', application_labels;
  END IF;

  IF salary_labels IS DISTINCT FROM ARRAY['fixed', 'range', 'a_combinar']::text[] THEN
    RAISE EXCEPTION 'G5 postcondition failed: vaga_salary_mode labels are not canonical: %', salary_labels;
  END IF;

  IF highlight_labels IS DISTINCT FROM ARRAY['none', 'premium', 'sponsored', 'featured']::text[] THEN
    RAISE EXCEPTION 'G5 postcondition failed: vaga_highlight_type labels are not canonical: %', highlight_labels;
  END IF;

  SELECT c.udt_name
  INTO application_column_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'vagas' AND c.column_name = 'application_channel';

  SELECT c.udt_name
  INTO salary_column_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'vagas' AND c.column_name = 'salary_mode';

  SELECT c.udt_name, c.column_default
  INTO highlight_column_type, highlight_default
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'vagas' AND c.column_name = 'highlight_type';

  IF application_column_type IS DISTINCT FROM 'vaga_application_channel'
     OR salary_column_type IS DISTINCT FROM 'vaga_salary_mode'
     OR highlight_column_type IS DISTINCT FROM 'vaga_highlight_type' THEN
    RAISE EXCEPTION 'G5 postcondition failed: vagas columns are not bound to canonical enum types';
  END IF;

  IF highlight_default IS NULL OR highlight_default NOT LIKE '%none%vaga_highlight_type%' THEN
    RAISE EXCEPTION 'G5 postcondition failed: highlight_type default was not restored: %', highlight_default;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.vagas
    WHERE highlight_type IS NOT NULL
      AND highlight_type::text NOT IN ('none', 'premium', 'sponsored', 'featured')
  ) THEN
    RAISE EXCEPTION 'G5 postcondition failed: noncanonical highlight_type data remains';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname IN ('vaga_application_channel', 'vaga_salary_mode', 'vaga_highlight_type')
      AND position(chr(39) || ',' || chr(39) IN e.enumlabel) > 0
  ) THEN
    RAISE EXCEPTION 'G5 postcondition failed: malformed enum label remains';
  END IF;
END
$postcondition$;

COMMIT;
