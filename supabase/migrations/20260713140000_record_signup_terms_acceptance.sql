BEGIN;

-- The self-service email/password signup sends these values in auth metadata.
-- OAuth accounts are taken to /aceitar-termos after the provider callback, so
-- this trigger records only an explicit, versioned acceptance and never blocks
-- a provider-created account that still needs to complete that screen.
CREATE OR REPLACE FUNCTION public.record_signup_terms_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_terms_version TEXT := NULLIF(trim(NEW.raw_user_meta_data ->> 'terms_version'), '');
  v_terms_accepted BOOLEAN := COALESCE(
    (NEW.raw_user_meta_data -> 'terms_accepted') = 'true'::jsonb,
    false
  );
  v_provider TEXT := lower(COALESCE(NEW.raw_app_meta_data ->> 'provider', ''));
BEGIN
  IF NOT v_terms_accepted THEN
    -- Email and phone are self-service credential flows. Their consent must be
    -- present before the auth row is created, rather than relying only on UI.
    -- OAuth creates the identity first and completes explicit acceptance on
    -- /aceitar-termos after the provider callback.
    IF v_provider IN ('email', 'phone') THEN
      RAISE EXCEPTION 'Terms acceptance is required for self-service signup'
        USING ERRCODE = '22023';
    END IF;

    RETURN NEW;
  END IF;

  IF v_terms_version IS NULL OR v_terms_version !~ '^[A-Za-z0-9_.:-]{1,32}$' THEN
    RAISE EXCEPTION 'Invalid terms acceptance version' USING ERRCODE = '22023';
  END IF;

  IF v_terms_version <> '2026-07-13' THEN
    RAISE EXCEPTION 'Terms acceptance version is not current' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.user_consents (
    user_id,
    consent_type,
    granted,
    granted_at,
    granted_by,
    terms_version
  )
  VALUES (
    NEW.id,
    'terms_of_service',
    true,
    NOW(),
    NEW.id,
    v_terms_version
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.record_signup_terms_acceptance() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_signup_terms_acceptance() FROM anon;
REVOKE ALL ON FUNCTION public.record_signup_terms_acceptance() FROM authenticated;

DROP TRIGGER IF EXISTS record_signup_terms_acceptance_trigger ON auth.users;
CREATE TRIGGER record_signup_terms_acceptance_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.record_signup_terms_acceptance();

COMMENT ON FUNCTION public.record_signup_terms_acceptance() IS
  'Records the current Terms of Service acceptance supplied by self-service signup metadata.';

COMMIT;
