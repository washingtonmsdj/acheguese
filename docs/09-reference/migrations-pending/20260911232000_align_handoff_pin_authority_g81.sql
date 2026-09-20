BEGIN;

-- G81 follow-up: keep handoff PIN reconciliation byte-for-byte aligned in
-- semantics with the current G7 acceptance authority. In particular, requester-
-- owned pending PIN material keeps its hash, expiry, attempt count and last
-- attempt while the receiving driver requirement is reconciled.
CREATE OR REPLACE FUNCTION private.mobility_reconcile_handoff_pin_g81(
  p_ride_id uuid,
  p_driver_profile_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_requires_pin boolean := false;
  v_existing public.operational_verifications%ROWTYPE;
BEGIN
  SELECT COALESCE(profile.requires_pin_for_deliveries, false)
  INTO v_requires_pin
  FROM public.profiles profile
  WHERE profile.id = p_driver_profile_id;

  SELECT verification.*
  INTO v_existing
  FROM public.operational_verifications verification
  WHERE verification.ride_id = p_ride_id
    AND verification.verification_type = 'pin'
  FOR UPDATE;

  IF v_requires_pin THEN
    INSERT INTO public.operational_verifications (
      ride_id,
      verification_type,
      is_required,
      required_by,
      required_at,
      status,
      pin_hash,
      pin_generated_at,
      pin_expires_at,
      verified_at,
      verified_by,
      verification_attempts,
      last_attempt_at,
      created_at,
      updated_at
    )
    VALUES (
      p_ride_id,
      'pin',
      true,
      'driver',
      v_now,
      'pending',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      0,
      NULL,
      v_now,
      v_now
    )
    ON CONFLICT (ride_id, verification_type)
    DO UPDATE SET
      is_required = true,
      required_by = CASE
        WHEN operational_verifications.is_required = true
         AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
          THEN operational_verifications.required_by
        ELSE 'driver'
      END,
      required_at = COALESCE(operational_verifications.required_at, v_now),
      status = CASE
        WHEN operational_verifications.status = 'verified'
         AND operational_verifications.verified_by = p_driver_profile_id
          THEN 'verified'
        ELSE 'pending'
      END,
      pin_hash = CASE
        WHEN (
          operational_verifications.is_required = true
          AND operational_verifications.status = 'pending'
          AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
        )
        OR (
          operational_verifications.status = 'verified'
          AND operational_verifications.verified_by = p_driver_profile_id
        )
          THEN operational_verifications.pin_hash
        ELSE NULL
      END,
      pin_generated_at = CASE
        WHEN (
          operational_verifications.is_required = true
          AND operational_verifications.status = 'pending'
          AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
        )
        OR (
          operational_verifications.status = 'verified'
          AND operational_verifications.verified_by = p_driver_profile_id
        )
          THEN operational_verifications.pin_generated_at
        ELSE NULL
      END,
      pin_expires_at = CASE
        WHEN (
          operational_verifications.is_required = true
          AND operational_verifications.status = 'pending'
          AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
        )
        OR (
          operational_verifications.status = 'verified'
          AND operational_verifications.verified_by = p_driver_profile_id
        )
          THEN operational_verifications.pin_expires_at
        ELSE NULL
      END,
      verified_at = CASE
        WHEN operational_verifications.status = 'verified'
         AND operational_verifications.verified_by = p_driver_profile_id
          THEN operational_verifications.verified_at
        ELSE NULL
      END,
      verified_by = CASE
        WHEN operational_verifications.status = 'verified'
         AND operational_verifications.verified_by = p_driver_profile_id
          THEN operational_verifications.verified_by
        ELSE NULL
      END,
      verification_attempts = CASE
        WHEN (
          operational_verifications.is_required = true
          AND operational_verifications.status = 'pending'
          AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
        )
        OR (
          operational_verifications.status = 'verified'
          AND operational_verifications.verified_by = p_driver_profile_id
        )
          THEN operational_verifications.verification_attempts
        ELSE 0
      END,
      last_attempt_at = CASE
        WHEN (
          operational_verifications.is_required = true
          AND operational_verifications.status = 'pending'
          AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
        )
        OR (
          operational_verifications.status = 'verified'
          AND operational_verifications.verified_by = p_driver_profile_id
        )
          THEN operational_verifications.last_attempt_at
        ELSE NULL
      END,
      updated_at = v_now;
    RETURN;
  END IF;

  IF FOUND AND v_existing.is_required = true
     AND v_existing.required_by IN ('passenger','sender','admin','operation') THEN
    IF v_existing.status = 'verified'
       AND v_existing.verified_by IS DISTINCT FROM p_driver_profile_id THEN
      UPDATE public.operational_verifications verification
      SET status = 'pending',
          pin_hash = NULL,
          pin_generated_at = NULL,
          pin_expires_at = NULL,
          verified_at = NULL,
          verified_by = NULL,
          verification_attempts = 0,
          last_attempt_at = NULL,
          updated_at = v_now
      WHERE verification.id = v_existing.id;
    END IF;
    RETURN;
  END IF;

  IF FOUND AND v_existing.required_by = 'driver' THEN
    UPDATE public.operational_verifications verification
    SET is_required = false,
        required_by = NULL,
        required_at = NULL,
        status = 'not_required',
        pin_hash = NULL,
        pin_generated_at = NULL,
        pin_expires_at = NULL,
        verified_at = NULL,
        verified_by = NULL,
        verification_attempts = 0,
        last_attempt_at = NULL,
        updated_at = v_now
    WHERE verification.id = v_existing.id;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION private.mobility_reconcile_handoff_pin_g81(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
