BEGIN;

-- G79: every emergency-delivery lifecycle mutation must go through a canonical
-- database command. The worker no longer writes failed directly to the public
-- outbox. Races with terminalization or provider webhooks therefore preserve
-- whichever authoritative state already won the row lock.

CREATE OR REPLACE FUNCTION public.fail_emergency_delivery_attempt(
  p_delivery_id uuid,
  p_expected_status text,
  p_error_message text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.emergency_delivery_log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_delivery public.emergency_delivery_log%ROWTYPE;
  v_message text := NULLIF(pg_catalog.btrim(COALESCE(p_error_message, '')), '');
  v_metadata jsonb := COALESCE(p_metadata, '{}'::jsonb);
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF p_delivery_id IS NULL
     OR p_expected_status NOT IN ('processing', 'dispatching')
     OR v_message IS NULL
     OR pg_catalog.jsonb_typeof(v_metadata) <> 'object'
     OR pg_catalog.pg_column_size(v_metadata) > 16384 THEN
    RAISE EXCEPTION 'invalid_emergency_delivery_failure_request'
      USING ERRCODE = '22023';
  END IF;

  SELECT delivery.*
  INTO v_delivery
  FROM public.emergency_delivery_log delivery
  WHERE delivery.id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Another canonical actor may have won while the provider request or claim
  -- was in flight (terminal cancellation, provider webhook, reconciliation).
  -- Never overwrite that state with a stale worker failure.
  IF v_delivery.status <> p_expected_status THEN
    RETURN v_delivery;
  END IF;

  UPDATE public.emergency_delivery_log delivery
  SET status = 'failed',
      error_message = pg_catalog.left(v_message, 1000),
      delivered_at = NULL,
      reconciliation_required_at = NULL,
      metadata = COALESCE(delivery.metadata, '{}'::jsonb) || v_metadata,
      updated_at = v_now
  WHERE delivery.id = p_delivery_id
    AND delivery.status = p_expected_status
  RETURNING * INTO v_delivery;

  RETURN v_delivery;
END;
$function$;

REVOKE ALL ON FUNCTION public.fail_emergency_delivery_attempt(uuid, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_emergency_delivery_attempt(uuid, text, text, jsonb)
  TO service_role;

COMMENT ON FUNCTION public.fail_emergency_delivery_attempt(uuid, text, text, jsonb) IS
  'G79 service-only failure command. Locks the outbox row and only applies failed when the caller expected the exact still-current processing/dispatching state; concurrent canonical outcomes are preserved.';

NOTIFY pgrst, 'reload schema';

COMMIT;
