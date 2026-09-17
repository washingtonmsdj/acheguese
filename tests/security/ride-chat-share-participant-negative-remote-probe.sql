-- Rollback-only remote probe: an unrelated authenticated profile must not cross ride chat/share/PIN boundaries.
-- Synthetic ride fixtures are created inside the transaction and removed by ROLLBACK.

BEGIN;

DO $setup$
DECLARE
  v_passenger_profile_id uuid;
  v_passenger_user_id uuid;
  v_driver_profile_id uuid;
  v_driver_user_id uuid;
  v_outsider_profile_id uuid;
  v_outsider_user_id uuid;
  v_address_id uuid;
  v_location_id uuid;
  v_active_ride_id uuid;
BEGIN
  SELECT p.id, p.user_id
  INTO v_passenger_profile_id, v_passenger_user_id
  FROM public.profiles p
  WHERE p.profile_type::text = 'personal'
    AND p.is_active IS TRUE
    AND p.user_id IS NOT NULL
    AND NOT COALESCE(private.is_admin_user(p.user_id), false)
    AND NOT EXISTS (
      SELECT 1
      FROM public.account_deletion_requests request
      WHERE request.user_id = p.user_id
        AND request.status IN ('scheduled', 'processing', 'failed', 'completed')
    )
  ORDER BY p.created_at, p.id
  LIMIT 1;

  SELECT p.id, p.user_id
  INTO v_driver_profile_id, v_driver_user_id
  FROM public.profiles p
  WHERE p.profile_type::text = 'driver'
    AND p.is_active IS TRUE
    AND p.user_id IS NOT NULL
    AND p.user_id <> v_passenger_user_id
    AND NOT COALESCE(private.is_admin_user(p.user_id), false)
    AND NOT EXISTS (
      SELECT 1
      FROM public.account_deletion_requests request
      WHERE request.user_id = p.user_id
        AND request.status IN ('scheduled', 'processing', 'failed', 'completed')
    )
  ORDER BY p.created_at, p.id
  LIMIT 1;

  SELECT p.id, p.user_id
  INTO v_outsider_profile_id, v_outsider_user_id
  FROM public.profiles p
  WHERE p.profile_type::text = 'personal'
    AND p.is_active IS TRUE
    AND p.user_id IS NOT NULL
    AND p.user_id <> v_passenger_user_id
    AND p.user_id <> v_driver_user_id
    AND NOT COALESCE(private.is_admin_user(p.user_id), false)
    AND NOT EXISTS (
      SELECT 1
      FROM public.account_deletion_requests request
      WHERE request.user_id = p.user_id
        AND request.status IN ('scheduled', 'processing', 'failed', 'completed')
    )
  ORDER BY p.created_at, p.id
  LIMIT 1;

  SELECT address.id, address.location_id
  INTO v_address_id, v_location_id
  FROM public.addresses address
  WHERE address.location_id IS NOT NULL
  ORDER BY address.created_at NULLS LAST, address.id
  LIMIT 1;

  IF v_passenger_profile_id IS NULL
     OR v_driver_profile_id IS NULL
     OR v_outsider_profile_id IS NULL
     OR v_address_id IS NULL
     OR v_location_id IS NULL THEN
    RAISE EXCEPTION 'ride_chat_share_probe_requires_three_non_admin_identities_and_address';
  END IF;

  INSERT INTO public.user_active_profiles(user_id, profile_id)
  VALUES
    (v_passenger_user_id, v_passenger_profile_id),
    (v_driver_user_id, v_driver_profile_id),
    (v_outsider_user_id, v_outsider_profile_id)
  ON CONFLICT (user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id;

  INSERT INTO public.ride_requests(
    passenger_profile_id,
    driver_profile_id,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    status,
    ride_mode,
    origin,
    destination
  ) VALUES (
    v_passenger_profile_id,
    v_driver_profile_id,
    v_address_id,
    v_address_id,
    v_location_id,
    v_location_id,
    'in_progress',
    'ride',
    'Security probe origin',
    'Security probe destination'
  ) RETURNING id INTO v_active_ride_id;

  INSERT INTO public.operational_verifications(
    ride_id,
    verification_type,
    is_required,
    required_by,
    status
  ) VALUES (
    v_active_ride_id,
    'pin',
    true,
    'passenger',
    'pending'
  );

  PERFORM set_config('app.mobility_chat_probe.outsider_user_id', v_outsider_user_id::text, true);
  PERFORM set_config('app.mobility_chat_probe.outsider_profile_id', v_outsider_profile_id::text, true);
  PERFORM set_config('app.mobility_chat_probe.active_ride_id', v_active_ride_id::text, true);
END;
$setup$;

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('app.mobility_chat_probe.outsider_user_id'),
  true
);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.mobility_chat_probe.outsider_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $negative_authorization$
DECLARE
  v_blocked integer := 0;
  v_ride_id uuid := current_setting('app.mobility_chat_probe.active_ride_id')::uuid;
  v_outsider_profile_id uuid := current_setting('app.mobility_chat_probe.outsider_profile_id')::uuid;
BEGIN
  BEGIN
    PERFORM public.ensure_ride_chat(v_ride_id);
    RAISE EXCEPTION 'unrelated_user_ensured_ride_chat';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.send_ride_chat_message(v_ride_id, 'probe');
    RAISE EXCEPTION 'unrelated_user_sent_ride_chat_message';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.mark_ride_chat_messages_read(v_ride_id);
    RAISE EXCEPTION 'unrelated_user_marked_ride_chat_read';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.create_safety_ride_share(v_ride_id, v_outsider_profile_id, 24);
    RAISE EXCEPTION 'unrelated_user_created_ride_share';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.get_operational_verification_status(v_ride_id);
    RAISE EXCEPTION 'unrelated_user_read_verification_status';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.verify_operational_pin(v_ride_id, '0000');
    RAISE EXCEPTION 'unrelated_user_reached_pin_verification';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  IF v_blocked <> 6 THEN
    RAISE EXCEPTION 'expected 6 participant denials, got %', v_blocked;
  END IF;
END;
$negative_authorization$;

RESET ROLE;
ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'ride_chat_share_participant_negative',
  'passed', true,
  'blocked_rpc_count', 6,
  'rolled_back', true
) AS result;
