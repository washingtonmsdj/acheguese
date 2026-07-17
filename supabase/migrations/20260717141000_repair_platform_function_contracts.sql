-- Remove application functions with no callers and repair active functions
-- against the current schema. PostGIS extension-owned functions are excluded.

-- Proven obsolete by runtime and pg_depend audits. No CASCADE is intentional.
DROP FUNCTION IF EXISTS public.create_business_data_with_canonical(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
);
DROP FUNCTION IF EXISTS public.create_professional_data_with_canonical(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
);
DROP FUNCTION IF EXISTS public.create_ride_request_with_canonical(
  UUID, UUID, UUID, UUID, UUID, TIMESTAMPTZ, NUMERIC, TEXT, TEXT, TEXT, INTEGER, NUMERIC
);
DROP FUNCTION IF EXISTS public.create_user_residence_with_canonical(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.delivery_assert_actor_profile(UUID, UUID);
DROP FUNCTION IF EXISTS public.exec_sql(TEXT);
DROP FUNCTION IF EXISTS public.revoke_all_user_sessions(UUID, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.get_location_ancestors(UUID);
DROP FUNCTION IF EXISTS public.get_location_by_path(TEXT);
DROP FUNCTION IF EXISTS public.get_location_descendants(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_location_descendants(UUID);

CREATE OR REPLACE FUNCTION public.generate_unique_handle(base_handle TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_candidate TEXT;
  v_clean TEXT;
  v_counter INTEGER;
BEGIN
  v_clean := lower(regexp_replace(
    public.unaccent(COALESCE(base_handle, '')),
    '[^a-z0-9_]',
    '_',
    'g'
  ));
  v_clean := regexp_replace(v_clean, '_+', '_', 'g');
  v_clean := trim(BOTH '_' FROM v_clean);

  IF length(v_clean) < 3 THEN
    v_clean := COALESCE(NULLIF(v_clean, ''), 'user') || '_user';
  END IF;

  v_clean := left(v_clean, 27);
  FOR v_counter IN 0..999 LOOP
    v_candidate := CASE
      WHEN v_counter = 0 THEN v_clean
      ELSE left(v_clean, 24) || '_' || lpad(v_counter::TEXT, 3, '0')
    END;

    IF NOT EXISTS (
      SELECT 1 FROM public.profiles profile WHERE profile.handle = v_candidate
    ) THEN
      RETURN v_candidate;
    END IF;
  END LOOP;

  RAISE EXCEPTION 'Unable to generate a unique profile handle'
    USING ERRCODE = '23505';
END;
$$;

REVOKE ALL ON FUNCTION public.generate_unique_handle(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_handle(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.fn_generate_classified_public_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_chars CONSTANT TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  v_id TEXT;
  v_attempt INTEGER;
  v_index INTEGER;
BEGIN
  FOR v_attempt IN 1..64 LOOP
    v_id := '';
    FOR v_index IN 1..8 LOOP
      v_id := v_id || substr(
        v_chars,
        floor(random() * length(v_chars) + 1)::INTEGER,
        1
      );
    END LOOP;

    IF NOT EXISTS (
      SELECT 1 FROM public.classifieds classified WHERE classified.public_id = v_id
    ) THEN
      RETURN v_id;
    END IF;
  END LOOP;

  RAISE EXCEPTION 'Unable to generate a unique classified public id'
    USING ERRCODE = '23505';
END;
$$;

REVOKE ALL ON FUNCTION public.fn_generate_classified_public_id()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_generate_classified_public_id() TO service_role;

-- security-authority: public-rpc public.get_next_opening_time
CREATE OR REPLACE FUNCTION public.get_next_opening_time(p_business_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_day INTEGER;
  v_hours RECORD;
  v_exception RECORD;
  v_check_date DATE;
  v_offset INTEGER;
BEGIN
  FOR v_offset IN 0..7 LOOP
    v_check_date := (v_now + make_interval(days => v_offset))::DATE;
    v_day := extract(DOW FROM v_check_date)::INTEGER;

    SELECT exception.*
    INTO v_exception
    FROM public.business_hours_exceptions exception
    WHERE exception.business_id = p_business_id
      AND exception.date = v_check_date;

    IF FOUND THEN
      IF NOT v_exception.is_closed AND v_exception.opens_at IS NOT NULL THEN
        RETURN jsonb_build_object(
          'date', v_check_date,
          'opens_at', v_exception.opens_at,
          'closes_at', v_exception.closes_at,
          'is_exception', TRUE,
          'reason', v_exception.reason
        );
      END IF;
      CONTINUE;
    END IF;

    SELECT hours.*
    INTO v_hours
    FROM public.business_hours hours
    WHERE hours.business_id = p_business_id
      AND hours.day_of_week = v_day
      AND NOT hours.is_closed;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'date', v_check_date,
        'opens_at', v_hours.opens_at,
        'closes_at', v_hours.closes_at,
        'is_exception', FALSE
      );
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.get_next_opening_time(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_opening_time(UUID)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.expire_stale_work_opportunities(
  p_now TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(expired_count INTEGER, expired_ids UUID[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_ids UUID[] := ARRAY[]::UUID[];
  v_effective_now TIMESTAMPTZ := now();
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    v_effective_now := COALESCE(p_now, now());
  END IF;

  WITH target AS (
    SELECT opportunity.id
    FROM public.work_opportunities opportunity
    WHERE opportunity.status = 'active'
      AND opportunity.published_at IS NOT NULL
      AND opportunity.published_at + make_interval(
        hours => public.work_opportunity_expiration_hours(opportunity.opportunity_type)
      ) <= v_effective_now
    ORDER BY opportunity.published_at, opportunity.id
    FOR UPDATE SKIP LOCKED
    LIMIT 500
  ), updated AS (
    UPDATE public.work_opportunities opportunity
    SET
      status = 'expired',
      closed_at = COALESCE(opportunity.closed_at, v_effective_now),
      updated_at = v_effective_now
    FROM target
    WHERE opportunity.id = target.id
    RETURNING opportunity.id
  )
  SELECT COALESCE(array_agg(updated.id), ARRAY[]::UUID[])
  INTO v_ids
  FROM updated;

  RETURN QUERY
  SELECT cardinality(v_ids), v_ids;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_work_opportunities(TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_work_opportunities(TIMESTAMPTZ)
  TO service_role;

CREATE OR REPLACE FUNCTION public.log_pii_access(
  p_subject_user_id UUID,
  p_table_name VARCHAR,
  p_record_id UUID,
  p_operation VARCHAR,
  p_reason TEXT,
  p_reason_category VARCHAR,
  p_data_sample TEXT DEFAULT NULL,
  p_source VARCHAR DEFAULT 'manual'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_log_id UUID;
  v_actor_role TEXT;
  v_headers JSONB := COALESCE(
    NULLIF(current_setting('request.headers', TRUE), '')::JSONB,
    '{}'::JSONB
  );
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service_role is required'
      USING ERRCODE = '42501';
  END IF;

  SELECT role.role
  INTO v_actor_role
  FROM public.user_roles role
  WHERE role.user_id = auth.uid()
    AND role.is_active = TRUE
    AND role.revoked_at IS NULL
    AND (role.expires_at IS NULL OR role.expires_at > now())
  ORDER BY role.granted_at DESC, role.id DESC
  LIMIT 1;

  INSERT INTO public.pii_access_log (
    accessed_by,
    accessed_by_role,
    subject_user_id,
    table_name,
    record_id,
    operation,
    access_reason,
    access_reason_category,
    data_masked_sample,
    ip_address,
    user_agent,
    source
  ) VALUES (
    auth.uid(),
    v_actor_role,
    p_subject_user_id,
    p_table_name,
    p_record_id,
    p_operation,
    p_reason,
    p_reason_category,
    p_data_sample,
    inet_client_addr(),
    v_headers ->> 'user-agent',
    p_source
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_pii_access(
  UUID, VARCHAR, UUID, VARCHAR, TEXT, VARCHAR, TEXT, VARCHAR
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_pii_access(
  UUID, VARCHAR, UUID, VARCHAR, TEXT, VARCHAR, TEXT, VARCHAR
) TO service_role;

CREATE OR REPLACE FUNCTION public.resolve_delivery_order_actor_role(
  p_customer_profile_id UUID,
  p_merchant_profile_id UUID,
  p_courier_profile_id UUID,
  p_actor_profile_id UUID,
  p_allow_customer BOOLEAN DEFAULT FALSE,
  p_allow_merchant BOOLEAN DEFAULT TRUE,
  p_allow_courier BOOLEAN DEFAULT TRUE
)
RETURNS public.order_actor_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_is_service_role BOOLEAN := COALESCE(auth.role(), '') = 'service_role';
  v_is_admin BOOLEAN := COALESCE(public.is_admin_from_roles(auth.uid()), FALSE);
BEGIN
  IF p_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'actor_profile_id is required' USING ERRCODE = '22023';
  END IF;

  IF NOT public.auth_can_access_profile(p_actor_profile_id) THEN
    RAISE EXCEPTION 'actor_profile_id is unavailable for this actor'
      USING ERRCODE = '42501';
  END IF;

  IF p_allow_customer AND p_customer_profile_id = p_actor_profile_id THEN
    RETURN 'customer'::public.order_actor_role;
  END IF;
  IF p_allow_merchant AND p_merchant_profile_id = p_actor_profile_id THEN
    RETURN 'merchant'::public.order_actor_role;
  END IF;
  IF p_allow_courier AND p_courier_profile_id = p_actor_profile_id THEN
    RETURN 'courier'::public.order_actor_role;
  END IF;
  IF v_is_service_role OR v_is_admin THEN
    RETURN 'platform'::public.order_actor_role;
  END IF;

  RAISE EXCEPTION 'actor_profile_id is not authorized for this order'
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_delivery_order_actor_role(
  UUID, UUID, UUID, UUID, BOOLEAN, BOOLEAN, BOOLEAN
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_delivery_order_actor_role(
  UUID, UUID, UUID, UUID, BOOLEAN, BOOLEAN, BOOLEAN
) TO service_role;

CREATE OR REPLACE FUNCTION public.delivery_transition_logistics_status(
  p_order_id UUID,
  p_to_status public.logistics_status,
  p_actor_profile_id UUID,
  p_reason TEXT,
  p_metadata JSONB
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_order public.orders;
  v_previous_status public.logistics_status;
  v_actor_role public.order_actor_role;
  v_trust_actor_role public.trust_actor_role;
  v_cancellation_reason_code TEXT :=
    COALESCE(p_metadata, '{}'::JSONB) ->> 'cancellation_reason_code';
BEGIN
  SELECT order_row.*
  INTO v_order
  FROM public.orders order_row
  WHERE order_row.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;

  v_previous_status := v_order.logistics_status::public.logistics_status;
  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id,
    v_order.merchant_profile_id,
    v_order.courier_profile_id,
    p_actor_profile_id,
    FALSE,
    TRUE,
    TRUE
  );

  UPDATE public.orders order_row
  SET logistics_status = p_to_status
  WHERE order_row.id = p_order_id
  RETURNING order_row.* INTO v_order;

  UPDATE public.order_timeline_events timeline
  SET
    actor_profile_id = p_actor_profile_id,
    actor_role = v_actor_role,
    reason = left(NULLIF(trim(COALESCE(p_reason, '')), ''), 1000),
    metadata = COALESCE(p_metadata, '{}'::JSONB)
  WHERE timeline.order_id = p_order_id
    AND timeline.event_type = 'logistics_status_changed'
    AND timeline.created_at = (
      SELECT max(latest.created_at)
      FROM public.order_timeline_events latest
      WHERE latest.order_id = p_order_id
        AND latest.event_type = 'logistics_status_changed'
    );

  IF p_to_status::TEXT = 'canceled'
    AND v_previous_status::TEXT IN ('preparing', 'ready_for_pickup', 'picked_up')
    AND v_cancellation_reason_code = 'customer_requested_late_cancel'
  THEN
    v_trust_actor_role := CASE v_actor_role
      WHEN 'courier' THEN 'courier'::public.trust_actor_role
      ELSE 'merchant'::public.trust_actor_role
    END;

    PERFORM set_config('achegue.trusted_trust_command', '1', TRUE);
    INSERT INTO public.trust_events (
      actor_profile_id, actor_role, subject_profile_id, subject_role,
      context_type, context_id, event_type, reason_code, severity,
      visibility, description, evidence, status
    ) VALUES (
      p_actor_profile_id,
      v_trust_actor_role,
      v_order.customer_profile_id,
      'customer',
      'order',
      p_order_id,
      'late_cancellation',
      'customer_requested_late_cancel',
      CASE
        WHEN v_previous_status::TEXT = 'picked_up'
          THEN 'high'::public.delivery_occurrence_severity
        ELSE 'medium'::public.delivery_occurrence_severity
      END,
      'admin_only',
      left(NULLIF(trim(COALESCE(p_reason, '')), ''), 600),
      jsonb_build_object(
        'order_id', p_order_id,
        'previous_status', v_previous_status,
        'courier_profile_id', v_order.courier_profile_id,
        'source', 'delivery_transition'
      ),
      CASE
        WHEN v_previous_status::TEXT = 'picked_up'
          THEN 'under_review'::public.trust_event_status
        ELSE 'active'::public.trust_event_status
      END
    );
  END IF;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.delivery_mark_picked_up(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_courier_profile_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_order public.orders;
  v_actor_role public.order_actor_role;
BEGIN
  SELECT order_row.* INTO v_order
  FROM public.orders order_row
  WHERE order_row.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;

  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id, v_order.merchant_profile_id,
    v_order.courier_profile_id, p_actor_profile_id, FALSE, TRUE, TRUE
  );

  IF v_actor_role = 'courier'
    AND p_courier_profile_id IS NOT NULL
    AND p_courier_profile_id <> p_actor_profile_id
  THEN
    RAISE EXCEPTION 'Courier cannot assign another courier profile'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.orders order_row
  SET
    logistics_status = 'picked_up',
    courier_profile_id = COALESCE(p_courier_profile_id, order_row.courier_profile_id)
  WHERE order_row.id = p_order_id
  RETURNING order_row.* INTO v_order;

  UPDATE public.order_timeline_events timeline
  SET
    actor_profile_id = p_actor_profile_id,
    actor_role = v_actor_role,
    reason = left(NULLIF(trim(COALESCE(p_reason, '')), ''), 1000)
  WHERE timeline.order_id = p_order_id
    AND timeline.event_type = 'logistics_status_changed'
    AND timeline.created_at = (
      SELECT max(latest.created_at)
      FROM public.order_timeline_events latest
      WHERE latest.order_id = p_order_id
        AND latest.event_type = 'logistics_status_changed'
    );

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.delivery_mark_delivered(
  p_order_id UUID,
  p_actor_profile_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_proof JSONB DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_order public.orders;
  v_actor_role public.order_actor_role;
BEGIN
  SELECT order_row.* INTO v_order
  FROM public.orders order_row
  WHERE order_row.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;

  v_actor_role := public.resolve_delivery_order_actor_role(
    v_order.customer_profile_id, v_order.merchant_profile_id,
    v_order.courier_profile_id, p_actor_profile_id, FALSE, TRUE, TRUE
  );

  UPDATE public.orders order_row
  SET
    logistics_status = 'delivered',
    proof_of_delivery = COALESCE(p_proof, order_row.proof_of_delivery)
  WHERE order_row.id = p_order_id
  RETURNING order_row.* INTO v_order;

  UPDATE public.order_timeline_events timeline
  SET
    actor_profile_id = p_actor_profile_id,
    actor_role = v_actor_role,
    reason = left(NULLIF(trim(COALESCE(p_reason, '')), ''), 1000),
    metadata = COALESCE(timeline.metadata, '{}'::JSONB)
      || jsonb_strip_nulls(jsonb_build_object('proof', p_proof))
  WHERE timeline.order_id = p_order_id
    AND timeline.event_type = 'logistics_status_changed'
    AND timeline.created_at = (
      SELECT max(latest.created_at)
      FROM public.order_timeline_events latest
      WHERE latest.order_id = p_order_id
        AND latest.event_type = 'logistics_status_changed'
    );

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.delivery_transition_logistics_status(
  UUID, public.logistics_status, UUID, TEXT, JSONB
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delivery_mark_picked_up(UUID, UUID, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delivery_mark_delivered(UUID, UUID, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_transition_logistics_status(
  UUID, public.logistics_status, UUID, TEXT, JSONB
) TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_mark_picked_up(UUID, UUID, UUID, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_mark_delivered(UUID, UUID, TEXT, JSONB)
  TO service_role;

CREATE OR REPLACE FUNCTION public.process_dispatch_timeouts()
RETURNS TABLE(ride_id UUID, action TEXT, details TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET statement_timeout = '10s'
AS $$
DECLARE
  v_timeout_ride RECORD;
  v_origin_lat DOUBLE PRECISION;
  v_origin_lng DOUBLE PRECISION;
  v_next_driver RECORD;
  v_attempt_number INTEGER;
  v_max_attempts CONSTANT INTEGER := 5;
  v_max_total_time CONSTANT INTERVAL := INTERVAL '10 minutes';
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service_role is required' USING ERRCODE = '42501';
  END IF;

  FOR v_timeout_ride IN
    SELECT
      request.id AS ride_id,
      request.pickup_address_id,
      request.created_at,
      audit.attempt_number,
      audit.id AS audit_id
    FROM public.ride_requests request
    JOIN LATERAL (
      SELECT dispatch.id, dispatch.attempt_number
      FROM public.ride_dispatch_audit dispatch
      WHERE dispatch.ride_id = request.id
        AND dispatch.status = 'pending'
        AND dispatch.timeout_at < now()
      ORDER BY dispatch.created_at DESC, dispatch.id DESC
      LIMIT 1
    ) audit ON TRUE
    WHERE request.status = 'driver_assigned'
    ORDER BY request.created_at, request.id
    FOR UPDATE OF request SKIP LOCKED
    LIMIT 100
  LOOP
    UPDATE public.ride_dispatch_audit dispatch
    SET status = 'timeout', updated_at = now()
    WHERE dispatch.id = v_timeout_ride.audit_id
      AND dispatch.status = 'pending';

    v_attempt_number := v_timeout_ride.attempt_number + 1;

    IF v_attempt_number > v_max_attempts
      OR now() - v_timeout_ride.created_at > v_max_total_time
    THEN
      UPDATE public.ride_requests request
      SET status = 'expired', updated_at = now()
      WHERE request.id = v_timeout_ride.ride_id;

      INSERT INTO public.ride_state_audit (
        ride_id, from_state, to_state, changed_by, reason, created_at
      ) VALUES (
        v_timeout_ride.ride_id,
        'driver_assigned',
        'expired',
        'system',
        CASE
          WHEN v_attempt_number > v_max_attempts THEN 'Max dispatch attempts reached'
          ELSE 'Total dispatch timeout exceeded'
        END,
        now()
      );

      ride_id := v_timeout_ride.ride_id;
      action := 'expired';
      details := CASE
        WHEN v_attempt_number > v_max_attempts THEN 'Max attempts reached'
        ELSE 'Total timeout exceeded'
      END;
      RETURN NEXT;
      CONTINUE;
    END IF;

    SELECT address.latitude, address.longitude
    INTO v_origin_lat, v_origin_lng
    FROM public.addresses address
    WHERE address.id = v_timeout_ride.pickup_address_id;

    IF v_origin_lat IS NULL OR v_origin_lng IS NULL THEN
      ride_id := v_timeout_ride.ride_id;
      action := 'error';
      details := 'Origin coordinates not found';
      RETURN NEXT;
      CONTINUE;
    END IF;

    SELECT candidate.*
    INTO v_next_driver
    FROM public.find_eligible_drivers(v_origin_lat, v_origin_lng, 10) candidate
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.ride_dispatch_audit attempted
      WHERE attempted.ride_id = v_timeout_ride.ride_id
        AND attempted.driver_profile_id = candidate.profile_id
    )
    ORDER BY candidate.distance_km, candidate.profile_id
    LIMIT 1;

    IF NOT FOUND THEN
      UPDATE public.ride_requests request
      SET status = 'expired', updated_at = now()
      WHERE request.id = v_timeout_ride.ride_id;

      INSERT INTO public.ride_state_audit (
        ride_id, from_state, to_state, changed_by, reason, created_at
      ) VALUES (
        v_timeout_ride.ride_id, 'driver_assigned', 'expired', 'system',
        'No more drivers available', now()
      );

      ride_id := v_timeout_ride.ride_id;
      action := 'expired';
      details := 'No more drivers';
      RETURN NEXT;
      CONTINUE;
    END IF;

    UPDATE public.ride_requests request
    SET driver_profile_id = v_next_driver.profile_id, updated_at = now()
    WHERE request.id = v_timeout_ride.ride_id;

    INSERT INTO public.ride_dispatch_audit (
      ride_id, driver_profile_id, attempt_number, offered_at,
      timeout_at, status, created_at
    ) VALUES (
      v_timeout_ride.ride_id,
      v_next_driver.profile_id,
      v_attempt_number,
      now(),
      now() + INTERVAL '60 seconds',
      'pending',
      now()
    );

    INSERT INTO public.ride_state_audit (
      ride_id, from_state, to_state, changed_by, reason, created_at
    ) VALUES (
      v_timeout_ride.ride_id,
      'driver_assigned',
      'driver_assigned',
      'system',
      'Retry attempt ' || v_attempt_number,
      now()
    );

    ride_id := v_timeout_ride.ride_id;
    action := 'retry';
    details := 'Attempt ' || v_attempt_number || ' assigned';
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.process_dispatch_timeouts()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_dispatch_timeouts() TO service_role;

NOTIFY pgrst, 'reload schema';
