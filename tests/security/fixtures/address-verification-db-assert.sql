-- Must run ONLY against ephemeral PostgreSQL, after fixture + exact migration.
-- Assertions throw on any leaked privilege, broken cascading invalidation or
-- inability of an authorized server service to approve a new verification.

-- Simulate an unsafe SECURITY DEFINER RPC. Client identity remains in
-- request.jwt.claim.sub even though current_user becomes postgres.
CREATE FUNCTION public.fixture_rpc_promote_address() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  UPDATE public.addresses
     SET is_verified = true,
         verification_status = 'verified'::public.address_verification_status
   WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
END
$$;
CREATE FUNCTION public.fixture_rpc_promote_residence() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  UPDATE public.user_residences
     SET is_verified = true
   WHERE id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
END
$$;
REVOKE ALL ON FUNCTION public.fixture_rpc_promote_address() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fixture_rpc_promote_residence() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fixture_rpc_promote_address() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fixture_rpc_promote_residence() TO authenticated;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

DO $owner_test$
DECLARE
  v_address record;
  v_residence record;
  v_new_address_id uuid;
  v_new_residence_id uuid;
  v_rows integer;
  v_denied boolean;
BEGIN
  IF has_column_privilege(current_user, 'public.addresses', 'is_verified', 'UPDATE')
     OR has_column_privilege(current_user, 'public.user_residences', 'is_verified', 'UPDATE')
  THEN
    RAISE EXCEPTION 'authenticated retained verified-field write grant';
  END IF;

  UPDATE public.addresses
     SET street = 'Fixture rua alterada'
   WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'owner cannot update own address';
  END IF;

  SELECT is_verified, verification_status, verified_at, verified_by
    INTO v_address
    FROM public.addresses
   WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  IF v_address.is_verified IS DISTINCT FROM FALSE
     OR v_address.verification_status IS DISTINCT FROM 'pending'
     OR v_address.verified_at IS NOT NULL
     OR v_address.verified_by IS NOT NULL
  THEN
    RAISE EXCEPTION 'address verification not atomically invalidated';
  END IF;

  SELECT is_verified, verification_requested_at
    INTO v_residence
    FROM public.user_residences
   WHERE id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
  IF v_residence.is_verified IS DISTINCT FROM FALSE
     OR v_residence.verification_requested_at IS NOT NULL
  THEN
    RAISE EXCEPTION 'linked residence proof/request not atomically invalidated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.addresses
     WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'
  ) OR EXISTS (
    SELECT 1 FROM public.user_residences
     WHERE id = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2'
  ) THEN
    RAISE EXCEPTION 'RLS leaked foreign owner rows';
  END IF;

  UPDATE public.addresses SET street = 'should not change'
   WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 0 THEN
    RAISE EXCEPTION 'RLS allowed mutation of other owner';
  END IF;

  v_denied := false;
  BEGIN
    UPDATE public.addresses SET is_verified = true
     WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;
  IF NOT v_denied THEN
    RAISE EXCEPTION 'direct address self-verification was permitted';
  END IF;

  v_denied := false;
  BEGIN
    UPDATE public.user_residences SET is_verified = true
     WHERE id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;
  IF NOT v_denied THEN
    RAISE EXCEPTION 'direct residence self-verification was permitted';
  END IF;

  v_denied := false;
  BEGIN
    PERFORM public.fixture_rpc_promote_address();
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;
  IF NOT v_denied THEN
    RAISE EXCEPTION 'privileged RPC could self-verify address using user JWT';
  END IF;

  v_denied := false;
  BEGIN
    PERFORM public.fixture_rpc_promote_residence();
  EXCEPTION WHEN insufficient_privilege THEN
    v_denied := true;
  END;
  IF NOT v_denied THEN
    RAISE EXCEPTION 'privileged RPC could self-verify residence using user JWT';
  END IF;

  INSERT INTO public.addresses(
    owner_user_id, location_id, street, address_type
  ) VALUES (
    '11111111-1111-4111-8111-111111111111',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    'Nova rua fixture', 'exact'
  ) RETURNING id INTO v_new_address_id;

  SELECT is_verified, verification_status INTO v_address
    FROM public.addresses WHERE id = v_new_address_id;
  IF v_address.is_verified IS DISTINCT FROM FALSE OR
     v_address.verification_status IS DISTINCT FROM 'pending'
  THEN
    RAISE EXCEPTION 'new owner address was born verified';
  END IF;

  INSERT INTO public.user_residences(
    user_id, address_id, location_id, country, is_primary
  ) VALUES (
    '11111111-1111-4111-8111-111111111111',
    v_new_address_id,
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    'Brasil', false
  ) RETURNING id INTO v_new_residence_id;

  UPDATE public.user_residences
     SET verification_requested_at = '2020-01-01T00:00:00Z'::timestamptz
   WHERE id = v_new_residence_id;
  SELECT is_verified, verification_requested_at INTO v_residence
    FROM public.user_residences WHERE id = v_new_residence_id;
  IF v_residence.is_verified IS DISTINCT FROM FALSE OR
     v_residence.verification_requested_at IS NULL OR
     v_residence.verification_requested_at < clock_timestamp() - interval '60 seconds'
  THEN
    RAISE EXCEPTION 'residence requested timestamp not server-authoritative';
  END IF;

  UPDATE public.user_residences SET verification_requested_at = NULL
   WHERE id = v_new_residence_id;
  SELECT verification_requested_at INTO v_residence
    FROM public.user_residences WHERE id = v_new_residence_id;
  IF v_residence.verification_requested_at IS NULL THEN
    RAISE EXCEPTION 'owner could cancel verification request directly';
  END IF;
END
$owner_test$;
COMMIT;

BEGIN;
SET LOCAL ROLE service_role;
DO $server_test$
DECLARE
  a record;
  r record;
BEGIN
  UPDATE public.addresses
     SET is_verified = true,
         verification_status = 'verified'::public.address_verification_status,
         verified_at = now()
   WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  UPDATE public.user_residences SET is_verified = true
   WHERE id = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2';

  SELECT is_verified, verification_status INTO a
    FROM public.addresses WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  SELECT is_verified INTO r FROM public.user_residences
   WHERE id = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2';
  IF a.is_verified IS DISTINCT FROM TRUE
     OR a.verification_status IS DISTINCT FROM 'verified'
     OR r.is_verified IS DISTINCT FROM TRUE
  THEN
    RAISE EXCEPTION 'server authority could not verify independently';
  END IF;
END
$server_test$;
COMMIT;

-- Legacy postapply probe must also succeed with no JWT.
\ir ../address-verification-authenticated-probe.sql
