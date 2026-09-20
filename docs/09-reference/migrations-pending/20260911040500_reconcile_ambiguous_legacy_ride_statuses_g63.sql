-- G63: reconcile only ambiguous legacy ride states that have deterministic
-- provenance. Rows without proof stay untouched and remain read-compatible.
--
-- This migration intentionally runs after G62's canonical write trigger. Every
-- status written below is canonical, so the write ratchet remains active.

-- ---------------------------------------------------------------------------
-- Legacy `driver_arrived`
-- ---------------------------------------------------------------------------
-- A bare `driver_arrived` has no one-to-one canonical successor. We only move
-- it forward when canonical timestamps prove that a later lifecycle milestone
-- already happened. Priority follows lifecycle progression.

WITH reconciled AS (
  UPDATE public.ride_requests AS ride
  SET status = 'completed',
      updated_at = pg_catalog.clock_timestamp()
  WHERE ride.status::text = 'driver_arrived'
    AND ride.completed_at IS NOT NULL
  RETURNING ride.id
)
INSERT INTO public.ride_state_audit (
  ride_id, from_state, to_state, changed_by, reason, metadata, created_at
)
SELECT
  reconciled.id,
  'driver_arrived',
  'completed',
  'migration:g63',
  'Legacy driver_arrived reconciled from completed_at provenance',
  pg_catalog.jsonb_build_object(
    'gate', 'G63',
    'proof', 'completed_at'
  ),
  pg_catalog.clock_timestamp()
FROM reconciled;

WITH reconciled AS (
  UPDATE public.ride_requests AS ride
  SET status = 'in_progress',
      updated_at = pg_catalog.clock_timestamp()
  WHERE ride.status::text = 'driver_arrived'
    AND ride.ride_mode = 'ride'
    AND ride.completed_at IS NULL
    AND ride.started_at IS NOT NULL
  RETURNING ride.id
)
INSERT INTO public.ride_state_audit (
  ride_id, from_state, to_state, changed_by, reason, metadata, created_at
)
SELECT
  reconciled.id,
  'driver_arrived',
  'in_progress',
  'migration:g63',
  'Legacy driver_arrived reconciled from started_at provenance',
  pg_catalog.jsonb_build_object(
    'gate', 'G63',
    'proof', 'started_at'
  ),
  pg_catalog.clock_timestamp()
FROM reconciled;

WITH reconciled AS (
  UPDATE public.ride_requests AS ride
  SET status = 'passenger_boarded',
      updated_at = pg_catalog.clock_timestamp()
  WHERE ride.status::text = 'driver_arrived'
    AND ride.ride_mode = 'ride'
    AND ride.completed_at IS NULL
    AND ride.started_at IS NULL
    AND ride.passenger_boarded_at IS NOT NULL
  RETURNING ride.id
)
INSERT INTO public.ride_state_audit (
  ride_id, from_state, to_state, changed_by, reason, metadata, created_at
)
SELECT
  reconciled.id,
  'driver_arrived',
  'passenger_boarded',
  'migration:g63',
  'Legacy driver_arrived reconciled from passenger_boarded_at provenance',
  pg_catalog.jsonb_build_object(
    'gate', 'G63',
    'proof', 'passenger_boarded_at'
  ),
  pg_catalog.clock_timestamp()
FROM reconciled;

-- ---------------------------------------------------------------------------
-- Legacy `cancelled`
-- ---------------------------------------------------------------------------
-- `cancelled` is actor-ambiguous. Reconcile only when the latest cancellation
-- audit proves that changed_by is exactly one of the ride participants.

WITH latest_cancel_audit AS (
  SELECT DISTINCT ON (audit.ride_id)
    audit.ride_id,
    audit.changed_by
  FROM public.ride_state_audit AS audit
  JOIN public.ride_requests AS ride
    ON ride.id = audit.ride_id
  WHERE ride.status::text = 'cancelled'
    AND audit.to_state::text IN (
      'cancelled',
      'cancelled_by_passenger',
      'cancelled_by_driver'
    )
  ORDER BY audit.ride_id, audit.created_at DESC
),
reconciled AS (
  UPDATE public.ride_requests AS ride
  SET status = 'cancelled_by_passenger',
      updated_at = pg_catalog.clock_timestamp()
  FROM latest_cancel_audit AS proof
  WHERE ride.id = proof.ride_id
    AND ride.status::text = 'cancelled'
    AND proof.changed_by = ride.passenger_profile_id::text
  RETURNING ride.id
)
INSERT INTO public.ride_state_audit (
  ride_id, from_state, to_state, changed_by, reason, metadata, created_at
)
SELECT
  reconciled.id,
  'cancelled',
  'cancelled_by_passenger',
  'migration:g63',
  'Legacy cancelled reconciled from participant audit provenance',
  pg_catalog.jsonb_build_object(
    'gate', 'G63',
    'proof', 'ride_state_audit.changed_by=passenger_profile_id'
  ),
  pg_catalog.clock_timestamp()
FROM reconciled;

WITH latest_cancel_audit AS (
  SELECT DISTINCT ON (audit.ride_id)
    audit.ride_id,
    audit.changed_by
  FROM public.ride_state_audit AS audit
  JOIN public.ride_requests AS ride
    ON ride.id = audit.ride_id
  WHERE ride.status::text = 'cancelled'
    AND audit.to_state::text IN (
      'cancelled',
      'cancelled_by_passenger',
      'cancelled_by_driver'
    )
  ORDER BY audit.ride_id, audit.created_at DESC
),
reconciled AS (
  UPDATE public.ride_requests AS ride
  SET status = 'cancelled_by_driver',
      updated_at = pg_catalog.clock_timestamp()
  FROM latest_cancel_audit AS proof
  WHERE ride.id = proof.ride_id
    AND ride.status::text = 'cancelled'
    AND ride.driver_profile_id IS NOT NULL
    AND proof.changed_by = ride.driver_profile_id::text
  RETURNING ride.id
)
INSERT INTO public.ride_state_audit (
  ride_id, from_state, to_state, changed_by, reason, metadata, created_at
)
SELECT
  reconciled.id,
  'cancelled',
  'cancelled_by_driver',
  'migration:g63',
  'Legacy cancelled reconciled from participant audit provenance',
  pg_catalog.jsonb_build_object(
    'gate', 'G63',
    'proof', 'ride_state_audit.changed_by=driver_profile_id'
  ),
  pg_catalog.clock_timestamp()
FROM reconciled;

-- No UPDATE is intentionally issued for remaining `driver_arrived` or
-- `cancelled` rows. They are fail-closed historical exceptions until a later
-- gate has stronger provenance or the production audit proves the set empty.
