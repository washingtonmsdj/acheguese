DO $$
DECLARE
  v_attnotnull boolean;
  v_fk_count integer;
BEGIN
  SELECT a.attnotnull
  INTO v_attnotnull
  FROM pg_attribute a
  JOIN pg_class t ON t.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'function_audit'
    AND a.attname = 'user_id'
    AND NOT a.attisdropped;

  IF v_attnotnull IS NULL THEN
    RAISE EXCEPTION 'function_audit.user_id not found';
  END IF;

  SELECT count(*)
  INTO v_fk_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'function_audit'
    AND c.contype = 'f'
    AND pg_get_constraintdef(c.oid) = 'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';

  IF v_fk_count <> 1 THEN
    RAISE EXCEPTION 'expected function_audit user_id FK contract not found';
  END IF;
END
$$;

ALTER TABLE public.function_audit
  ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN public.function_audit.user_id IS
  'ID do usuário associado ao evento; NULL representa evento de sistema/service/cron sem usuário final.';

DO $$
DECLARE
  v_attnotnull boolean;
  v_fk_count integer;
BEGIN
  SELECT a.attnotnull
  INTO v_attnotnull
  FROM pg_attribute a
  JOIN pg_class t ON t.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'function_audit'
    AND a.attname = 'user_id'
    AND NOT a.attisdropped;

  IF v_attnotnull IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'function_audit.user_id is still NOT NULL';
  END IF;

  SELECT count(*)
  INTO v_fk_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'function_audit'
    AND c.contype = 'f'
    AND pg_get_constraintdef(c.oid) = 'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';

  IF v_fk_count <> 1 THEN
    RAISE EXCEPTION 'function_audit user_id FK changed unexpectedly';
  END IF;
END
$$;
