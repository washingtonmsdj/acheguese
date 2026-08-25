-- The canonical lost-and-found runtime neither reads nor writes direct contact
-- phone/email fields. The write guard already forced both values to NULL, and
-- the table is empty in development. Remove the dead PII surface entirely.

DO $rewrite$
DECLARE
  v_def text;
  v_new text;
BEGIN
  SELECT pg_get_functiondef('private.guard_lost_found_post_write()'::regprocedure)
  INTO v_def;

  v_new := replace(
    v_def,
    E'      NEW.contato_telefone := NULL;\n      NEW.contato_email := NULL;',
    ''
  );

  v_new := replace(
    v_new,
    E'           OR NEW.contato_telefone IS DISTINCT FROM OLD.contato_telefone\n           OR NEW.contato_email IS DISTINCT FROM OLD.contato_email',
    ''
  );

  IF v_new = v_def OR v_new ILIKE '%contato_telefone%' OR v_new ILIKE '%contato_email%' THEN
    RAISE EXCEPTION 'lost-found guard contact-field cleanup did not converge';
  END IF;

  EXECUTE v_new;
END
$rewrite$;

ALTER TABLE public.lost_found_posts
  DROP COLUMN IF EXISTS contato_telefone,
  DROP COLUMN IF EXISTS contato_email;

DO $verify$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lost_found_posts'
      AND column_name IN ('contato_telefone', 'contato_email')
  ) THEN
    RAISE EXCEPTION 'unused lost-found contact PII columns still exist';
  END IF;

  IF pg_get_functiondef('private.guard_lost_found_post_write()'::regprocedure)
       ILIKE '%contato_%' THEN
    RAISE EXCEPTION 'lost-found write guard still references removed contact fields';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
