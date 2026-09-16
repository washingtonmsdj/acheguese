-- Negative authorization proof for mobility participant-bound commands.
-- Uses existing active profiles only as identities, creates synthetic rides inside
-- this transaction, impersonates an unrelated authenticated user, and rolls back.

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
  v_final_ride_id uuid;
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
    RAISE EXCEPTION 'mobility_participant_probe_requires_three_non_admin_identities_and_address';
  END IF;

  INSERT INTO public.user_active_profiles(user_id, profile_id)
  VALUES
    (v_passenger_user_id, v_passenger_profile_id),
    (v_driver_user_id, v_driver_profile_id),
    (v_outsider_user_id, v_outsider_profile_id)
  ON CONFLICT (user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id;

  -- Never use searching_driver here: that state owns dispatch side effects.
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
    'completed',
    'ride',
    'Security probe origin',
    'Security probe destination'
  ) RETURNING id INTO v_final_ride_id;

  PERFORM set_config('app.mobility_probe.outsider_user_id', v_outsider_user_id::text, true);
  PERFORM set_config('app.mobility_probe.driver_profile_id', v_driver_profile_id::text, true);
  PERFORM set_config('app.mobility_probe.active_ride_id', v_active_ride_id::text, true);
  PERFORM set_config('app.mobility_probe.final_ride_id', v_final_ride_id::text, true);
END;
$setup$;

SET LOCAL ROLE authenticated;

SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('app.mobility_probe.outsider_user_id'),
  true
);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.mobility_probe.outsider_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $negative_authorization$
DECLARE
  v_pin_blocked boolean := false;
  v_trust_blocked boolean := false;
  v_report_blocked boolean := false;
BEGIN
  BEGIN
    PERFORM public.refresh_operational_pin_for_requester(
      current_setting('app.mobility_probe.active_ride_id')::uuid
    );
  EXCEPTION WHEN insufficient_privilege THEN
    v_pin_blocked := true;
  END;

  IF NOT v_pin_blocked THEN
    RAISE EXCEPTION 'unrelated_user_refreshed_operational_pin';
  END IF;

  BEGIN
    PERFORM public.submit_ride_trust_feedback(
      current_setting('app.mobility_probe.final_ride_id')::uuid,
      current_setting('app.mobility_probe.driver_profile_id')::uuid,
      5,
      'smooth_operation',
      'Security probe feedback that must be rejected.'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    v_trust_blocked := true;
  END;

  IF NOT v_trust_blocked THEN
    RAISE EXCEPTION 'unrelated_user_submitted_ride_trust_feedback';
  END IF;

  BEGIN
    PERFORM public.create_ride_report(
      current_setting('app.mobility_probe.final_ride_id')::uuid,
      'safety_concern',
      'medium',
      'Security probe report',
      'This report must be rejected because the actor is not a participant.',
      NULL,
      NULL,
      NULL
    );
  EXCEPTION WHEN insufficient_privilege THEN
    v_report_blocked := true;
  END;

  IF NOT v_report_blocked THEN
    RAISE EXCEPTION 'unrelated_user_created_ride_report';
  END IF;

  RAISE NOTICE 'mobility_participant_authorization_remote_probe_passed';
END;
$negative_authorization$;

RESET ROLE;
ROLLBACK;
