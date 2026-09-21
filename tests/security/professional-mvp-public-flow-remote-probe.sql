BEGIN;

DO $constraint_probe$
BEGIN
  BEGIN
    UPDATE public.professional_data
    SET slug = NULL
    WHERE id = '9299019a-0af0-4892-8226-7d1e3d9f0c36'::uuid;

    RAISE EXCEPTION 'professional_public_slug_constraint_not_enforced';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;
END
$constraint_probe$;

SET LOCAL ROLE anon;

DO $positive_public_read$
DECLARE
  v_count integer;
  v_path text;
BEGIN
  SELECT count(*)::integer, max(geographic_path)
  INTO v_count, v_path
  FROM public.public_professional_search
  WHERE slug = 'antonio-costa';

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'professional_public_probe_expected_one_row:%', v_count;
  END IF;

  IF v_path IS DISTINCT FROM '/br/ba/salvador/nordeste-de-amaralina' THEN
    RAISE EXCEPTION 'professional_public_probe_wrong_territory:%', v_path;
  END IF;
END
$positive_public_read$;

RESET ROLE;

UPDATE public.professional_data
SET visibility = 'private'::public.professional_profile_visibility
WHERE id = 'bfaf9921-07ed-4fc5-8d2d-f152ca1d62a7'::uuid;

SET LOCAL ROLE anon;

DO $negative_private_read$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.professional_data
    WHERE id = 'bfaf9921-07ed-4fc5-8d2d-f152ca1d62a7'::uuid
  ) THEN
    RAISE EXCEPTION 'private_professional_visible_to_anon';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.public_professional_search
    WHERE id = 'bfaf9921-07ed-4fc5-8d2d-f152ca1d62a7'::uuid
  ) THEN
    RAISE EXCEPTION 'private_professional_visible_in_public_read_model';
  END IF;
END
$negative_private_read$;

RESET ROLE;

ROLLBACK;
