DO $$
DECLARE
  v_total bigint;
  v_invalid bigint;
BEGIN
  SELECT count(*),
         count(*) FILTER (
           WHERE share_token !~ '^[A-Za-z0-9]{32}$'
              OR status NOT IN ('active', 'expired', 'revoked')
              OR NOT (expires_at > created_at AND expires_at <= created_at + interval '7 days')
         )
  INTO v_total, v_invalid
  FROM public.ride_shares;

  IF v_invalid <> 0 THEN
    RAISE EXCEPTION 'ride_shares contains % rows outside current safety contracts', v_invalid;
  END IF;

  IF to_regprocedure('extensions.gen_random_bytes(integer)') IS NULL THEN
    RAISE EXCEPTION 'extensions.gen_random_bytes(integer) is unavailable';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION private.assign_ride_share_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, extensions
AS $$
BEGIN
  -- The public share token is a bearer credential for live ride safety data.
  -- Never trust a caller-provided value: always replace it server-side.
  NEW.share_token := pg_catalog.encode(extensions.gen_random_bytes(16), 'hex');
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.assign_ride_share_token() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.assign_ride_share_token() TO service_role;

DROP TRIGGER IF EXISTS trg_assign_ride_share_token ON public.ride_shares;
CREATE TRIGGER trg_assign_ride_share_token
BEFORE INSERT ON public.ride_shares
FOR EACH ROW
EXECUTE FUNCTION private.assign_ride_share_token();

ALTER TABLE public.ride_shares
  DROP CONSTRAINT IF EXISTS ride_shares_token_contract;

ALTER TABLE public.ride_shares
  ADD CONSTRAINT ride_shares_token_contract
  CHECK (share_token ~ '^[0-9a-f]{32}$');

ALTER TABLE public.ride_shares
  VALIDATE CONSTRAINT ride_shares_status_check;
ALTER TABLE public.ride_shares
  VALIDATE CONSTRAINT ride_shares_expiration_contract;
ALTER TABLE public.ride_shares
  VALIDATE CONSTRAINT ride_shares_token_contract;

DO $$
DECLARE
  v_trigger_count integer;
  v_not_valid integer;
  v_browser_exec boolean;
BEGIN
  SELECT count(*)
  INTO v_trigger_count
  FROM pg_trigger tg
  WHERE tg.tgrelid = 'public.ride_shares'::regclass
    AND tg.tgname = 'trg_assign_ride_share_token'
    AND NOT tg.tgisinternal;

  IF v_trigger_count <> 1 THEN
    RAISE EXCEPTION 'ride share token trigger was not installed';
  END IF;

  SELECT count(*)
  INTO v_not_valid
  FROM pg_constraint c
  WHERE c.conrelid = 'public.ride_shares'::regclass
    AND c.conname IN (
      'ride_shares_status_check',
      'ride_shares_expiration_contract',
      'ride_shares_token_contract'
    )
    AND NOT c.convalidated;

  IF v_not_valid <> 0 THEN
    RAISE EXCEPTION 'ride share safety constraints remain NOT VALID';
  END IF;

  SELECT has_function_privilege('anon', 'private.assign_ride_share_token()', 'EXECUTE')
      OR has_function_privilege('authenticated', 'private.assign_ride_share_token()', 'EXECUTE')
  INTO v_browser_exec;

  IF v_browser_exec THEN
    RAISE EXCEPTION 'browser roles can execute private.assign_ride_share_token directly';
  END IF;
END
$$;
