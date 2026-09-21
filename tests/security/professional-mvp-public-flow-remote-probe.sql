BEGIN;

DO $select_probe_target$
DECLARE
  v_id uuid;
BEGIN
  SELECT id
  INTO v_id
  FROM public.public_professional_search
  ORDER BY id
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    PERFORM set_config('app.professional_probe_id', v_id::text, true);
  END IF;
END
$select_probe_target$;

DO $constraint_probe$
DECLARE
  v_id uuid;
BEGIN
  v_id := NULLIF(current_setting('app.professional_probe_id', true), '')::uuid;
  IF v_id IS NULL THEN
    RETURN;
  END IF;

  BEGIN
    UPDATE public.professional_data
    SET slug = NULL
    WHERE id = v_id;

    RAISE EXCEPTION 'professional_public_slug_constraint_not_enforced';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;
END
$constraint_probe$;

SET LOCAL ROLE anon;

DO $public_read_model_probe$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.public_professional_search
    WHERE slug IS NULL OR NULLIF(btrim(slug), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'public_professional_search_exposes_unroutable_row';
  END IF;
END
$public_read_model_probe$;

RESET ROLE;

DO $make_probe_target_private$
DECLARE
  v_id uuid;
BEGIN
  v_id := NULLIF(current_setting('app.professional_probe_id', true), '')::uuid;
  IF v_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.professional_data
  SET visibility = 'private'::public.professional_profile_visibility
  WHERE id = v_id;
END
$make_probe_target_private$;

SET LOCAL ROLE anon;

DO $negative_private_read$
DECLARE
  v_id uuid;
BEGIN
  v_id := NULLIF(current_setting('app.professional_probe_id', true), '')::uuid;
  IF v_id IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.professional_data
    WHERE id = v_id
  ) THEN
    RAISE EXCEPTION 'private_professional_visible_to_anon';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.public_professional_search
    WHERE id = v_id
  ) THEN
    RAISE EXCEPTION 'private_professional_visible_in_public_read_model';
  END IF;
END
$negative_private_read$;

RESET ROLE;

ROLLBACK;
