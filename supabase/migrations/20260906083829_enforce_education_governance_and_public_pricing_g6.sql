-- G6 Education governance: public/private share the same institution model,
-- but network authority and commercial pricing have different invariants.

ALTER TABLE public.education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_school_type_network_consistency;

ALTER TABLE public.education_profiles
  ADD CONSTRAINT chk_education_school_type_network_consistency
  CHECK (
    school_type IS NULL
    OR school_network IS NULL
    OR (
      school_type = 'public'
      AND school_network IN ('municipal', 'state', 'federal')
    )
    OR (
      school_type = 'private'
      AND school_network = 'private'
    )
    OR school_type IN ('community', 'charter')
  );

CREATE OR REPLACE FUNCTION private.guard_public_education_program_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
DECLARE
  v_school_type text;
BEGIN
  IF NEW.price_from IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT ep.school_type
  INTO v_school_type
  FROM public.education_profiles ep
  WHERE ep.id = NEW.education_profile_id;

  IF v_school_type = 'public' THEN
    RAISE EXCEPTION 'public_education_program_price_forbidden'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_public_education_program_pricing()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_public_education_program_pricing
ON public.education_programs;

CREATE TRIGGER trg_guard_public_education_program_pricing
BEFORE INSERT OR UPDATE OF education_profile_id, price_from
ON public.education_programs
FOR EACH ROW
EXECUTE FUNCTION private.guard_public_education_program_pricing();

CREATE OR REPLACE FUNCTION private.guard_public_education_profile_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
BEGIN
  IF NEW.school_type = 'public'
     AND OLD.school_type IS DISTINCT FROM NEW.school_type
     AND EXISTS (
       SELECT 1
       FROM public.education_programs pr
       WHERE pr.education_profile_id = NEW.id
         AND pr.price_from IS NOT NULL
     ) THEN
    RAISE EXCEPTION 'public_education_profile_has_commercial_prices'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_public_education_profile_transition()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_public_education_profile_transition
ON public.education_profiles;

CREATE TRIGGER trg_guard_public_education_profile_transition
BEFORE UPDATE OF school_type
ON public.education_profiles
FOR EACH ROW
EXECUTE FUNCTION private.guard_public_education_profile_transition();

COMMENT ON CONSTRAINT chk_education_school_type_network_consistency
ON public.education_profiles IS
  'Public schools use municipal/state/federal networks; private schools use the private network. Community/charter models remain explicitly flexible.';
