-- Consolidate operational Trust around server-owned commands.
--
-- Security invariants:
-- - trust_events and trust_admin_actions remain the canonical append-only SSOTs;
-- - browser clients cannot read or mutate either table directly;
-- - actor, target, role and context are derived from canonical domain records;
-- - administrative actions and profile restrictions are committed atomically;
-- - operational gates are enforced by database triggers, not by UI checks.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_trust_events_admin_keyset
  ON public.trust_events(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_trust_admin_actions_admin_keyset
  ON public.trust_admin_actions(created_at DESC, id DESC);

-- --------------------------------------------------------------------------
-- Write guards and bounded internal command primitives
-- --------------------------------------------------------------------------

-- security-authority: internal-function private.guard_trust_event_write
CREATE OR REPLACE FUNCTION private.guard_trust_event_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_trusted_command BOOLEAN :=
    COALESCE(current_setting('achegue.trusted_trust_command', TRUE), '') = '1';
  v_trusted_incident BOOLEAN :=
    COALESCE(current_setting('achegue.trusted_incident_command', TRUE), '') = '1';
  v_content_changed BOOLEAN;
  v_status_changed BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.event_type = 'incident' AND NOT v_trusted_incident THEN
      RAISE EXCEPTION 'trust_incident_command_required' USING ERRCODE = '42501';
    END IF;
    IF NEW.event_type <> 'incident' AND NOT v_trusted_command THEN
      RAISE EXCEPTION 'trust_event_command_required' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.actor_profile_id IS DISTINCT FROM OLD.actor_profile_id
     OR NEW.actor_role IS DISTINCT FROM OLD.actor_role
     OR NEW.subject_profile_id IS DISTINCT FROM OLD.subject_profile_id
     OR NEW.subject_role IS DISTINCT FROM OLD.subject_role
     OR NEW.context_type IS DISTINCT FROM OLD.context_type
     OR NEW.context_id IS DISTINCT FROM OLD.context_id
     OR NEW.event_type IS DISTINCT FROM OLD.event_type
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'trust_event_identity_is_immutable' USING ERRCODE = '42501';
  END IF;

  v_content_changed :=
    NEW.rating IS DISTINCT FROM OLD.rating
    OR NEW.reason_code IS DISTINCT FROM OLD.reason_code
    OR NEW.severity IS DISTINCT FROM OLD.severity
    OR NEW.visibility IS DISTINCT FROM OLD.visibility
    OR NEW.description IS DISTINCT FROM OLD.description
    OR NEW.evidence IS DISTINCT FROM OLD.evidence;

  IF v_content_changed AND (
    NOT v_trusted_command
    OR OLD.event_type NOT IN ('review', 'operational_feedback')
  ) THEN
    RAISE EXCEPTION 'trust_event_content_is_immutable' USING ERRCODE = '42501';
  END IF;

  IF NEW.reviewed_by_profile_id IS DISTINCT FROM OLD.reviewed_by_profile_id
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    RAISE EXCEPTION 'trust_event_reviewer_is_server_owned' USING ERRCODE = '42501';
  END IF;

  v_status_changed :=
    NEW.status IS DISTINCT FROM OLD.status
    OR NEW.resolution_notes IS DISTINCT FROM OLD.resolution_notes;

  IF v_status_changed THEN
    IF v_trusted_command
       AND OLD.reviewed_by_profile_id IS NULL
       AND OLD.event_type IN ('review', 'operational_feedback') THEN
      NEW.reviewed_by_profile_id := NULL;
      NEW.reviewed_at := NULL;
      NEW.resolution_notes := NULL;
    ELSIF COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
      NEW.reviewed_by_profile_id := private.current_active_profile_id();
      NEW.reviewed_at := now();
    ELSE
      RAISE EXCEPTION 'trust_event_review_not_authorized' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_trust_event_write()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_trust_incident_write ON public.trust_events;
DROP TRIGGER IF EXISTS trg_guard_trust_event_write ON public.trust_events;
CREATE TRIGGER trg_guard_trust_event_write
  BEFORE INSERT OR UPDATE ON public.trust_events
  FOR EACH ROW EXECUTE FUNCTION private.guard_trust_event_write();

-- security-authority: internal-function private.reject_trust_event_delete
CREATE OR REPLACE FUNCTION private.reject_trust_event_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'trust_event_delete_forbidden' USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION private.reject_trust_event_delete()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_reject_trust_event_delete ON public.trust_events;
CREATE TRIGGER trg_reject_trust_event_delete
  BEFORE DELETE ON public.trust_events
  FOR EACH ROW EXECUTE FUNCTION private.reject_trust_event_delete();

-- security-authority: internal-function private.guard_trust_admin_action_write
CREATE OR REPLACE FUNCTION private.guard_trust_admin_action_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'trust_admin_action_is_append_only' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(
    current_setting('achegue.trusted_trust_admin_action_command', TRUE), ''
  ) <> '1' THEN
    RAISE EXCEPTION 'trust_admin_action_command_required' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_trust_admin_action_write()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_trust_admin_action_write
  ON public.trust_admin_actions;
CREATE TRIGGER trg_guard_trust_admin_action_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.trust_admin_actions
  FOR EACH ROW EXECUTE FUNCTION private.guard_trust_admin_action_write();

-- security-authority: internal-function private.trust_feedback_status
CREATE OR REPLACE FUNCTION private.trust_feedback_status(
  p_severity public.delivery_occurrence_severity,
  p_rating INTEGER
)
RETURNS public.trust_event_status
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
  SELECT CASE
    WHEN p_severity IN ('high', 'critical') OR p_rating <= 2
      THEN 'under_review'::public.trust_event_status
    WHEN p_severity = 'medium' OR p_rating = 3
      THEN 'active'::public.trust_event_status
    ELSE 'confirmed'::public.trust_event_status
  END;
$$;

REVOKE ALL ON FUNCTION private.trust_feedback_status(
  public.delivery_occurrence_severity, INTEGER
) FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.enforce_trust_feedback_rate_limit
CREATE OR REPLACE FUNCTION private.enforce_trust_feedback_rate_limit(
  p_actor_profile_id UUID,
  p_command TEXT,
  p_max_events INTEGER DEFAULT 30
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_recent_count INTEGER;
BEGIN
  IF p_actor_profile_id IS NULL
     OR p_command IS NULL
     OR p_max_events NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'invalid_trust_rate_limit_input' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('trust_feedback_rate'),
    hashtext(p_actor_profile_id::TEXT || ':' || p_command)
  );

  SELECT count(*)::INTEGER
  INTO v_recent_count
  FROM public.trust_events event
  WHERE event.actor_profile_id = p_actor_profile_id
    AND event.event_type IN ('review', 'operational_feedback')
    AND event.created_at >= now() - interval '1 hour';

  IF v_recent_count >= p_max_events THEN
    RAISE EXCEPTION 'trust_feedback_rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_trust_feedback_rate_limit(
  UUID, TEXT, INTEGER
) FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.upsert_trust_feedback
CREATE OR REPLACE FUNCTION private.upsert_trust_feedback(
  p_actor_profile_id UUID,
  p_actor_role public.trust_actor_role,
  p_subject_profile_id UUID,
  p_subject_role public.trust_actor_role,
  p_context_type public.trust_context_type,
  p_context_id UUID,
  p_event_type public.trust_event_type,
  p_rating INTEGER,
  p_reason_code TEXT,
  p_severity public.delivery_occurrence_severity,
  p_visibility public.trust_visibility,
  p_description TEXT,
  p_evidence JSONB
)
RETURNS public.trust_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_description TEXT := NULLIF(trim(COALESCE(p_description, '')), '');
  v_evidence JSONB := COALESCE(p_evidence, '{}'::jsonb);
  v_status public.trust_event_status;
  v_existing public.trust_events;
  v_event public.trust_events;
BEGIN
  IF p_actor_profile_id IS NULL
     OR p_subject_profile_id IS NULL
     OR p_context_id IS NULL
     OR p_actor_profile_id = p_subject_profile_id THEN
    RAISE EXCEPTION 'valid_trust_feedback_participants_required'
      USING ERRCODE = '22023';
  END IF;
  IF p_event_type NOT IN ('review', 'operational_feedback') THEN
    RAISE EXCEPTION 'invalid_trust_feedback_event_type' USING ERRCODE = '22023';
  END IF;
  IF p_rating NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'trust_feedback_rating_out_of_range' USING ERRCODE = '22023';
  END IF;
  IF p_reason_code IS NULL
     OR p_reason_code !~ '^[a-z0-9_]{3,80}$' THEN
    RAISE EXCEPTION 'invalid_trust_feedback_reason' USING ERRCODE = '22023';
  END IF;
  IF v_description IS NOT NULL AND char_length(v_description) > 600 THEN
    RAISE EXCEPTION 'trust_feedback_description_too_long' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(v_evidence) <> 'object'
     OR pg_column_size(v_evidence) > 4096 THEN
    RAISE EXCEPTION 'invalid_trust_feedback_evidence' USING ERRCODE = '22023';
  END IF;

  v_status := private.trust_feedback_status(p_severity, p_rating);

  PERFORM pg_advisory_xact_lock(
    hashtext('trust_feedback_upsert'),
    hashtext(
      p_actor_profile_id::TEXT || ':' || p_subject_profile_id::TEXT || ':' ||
      p_context_type::TEXT || ':' || p_context_id::TEXT || ':' || p_event_type::TEXT
    )
  );

  SELECT event.*
  INTO v_existing
  FROM public.trust_events event
  WHERE event.actor_profile_id = p_actor_profile_id
    AND event.subject_profile_id = p_subject_profile_id
    AND event.actor_role = p_actor_role
    AND event.subject_role = p_subject_role
    AND event.context_type = p_context_type
    AND event.context_id = p_context_id
    AND event.event_type = p_event_type
  FOR UPDATE;

  IF FOUND AND v_existing.reviewed_by_profile_id IS NOT NULL THEN
    RAISE EXCEPTION 'trust_feedback_locked_after_review' USING ERRCODE = '55000';
  END IF;

  PERFORM set_config('achegue.trusted_trust_command', '1', TRUE);

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.trust_events event
    SET
      rating = p_rating,
      reason_code = p_reason_code,
      severity = p_severity,
      visibility = p_visibility,
      description = v_description,
      evidence = v_evidence,
      status = v_status,
      resolution_notes = NULL,
      updated_at = now()
    WHERE event.id = v_existing.id
    RETURNING event.* INTO v_event;
  ELSE
    INSERT INTO public.trust_events (
      actor_profile_id,
      actor_role,
      subject_profile_id,
      subject_role,
      context_type,
      context_id,
      event_type,
      rating,
      reason_code,
      severity,
      visibility,
      description,
      evidence,
      status
    ) VALUES (
      p_actor_profile_id,
      p_actor_role,
      p_subject_profile_id,
      p_subject_role,
      p_context_type,
      p_context_id,
      p_event_type,
      p_rating,
      p_reason_code,
      p_severity,
      p_visibility,
      v_description,
      v_evidence,
      v_status
    ) RETURNING * INTO v_event;
  END IF;

  RETURN v_event;
END;
$$;

REVOKE ALL ON FUNCTION private.upsert_trust_feedback(
  UUID, public.trust_actor_role, UUID, public.trust_actor_role,
  public.trust_context_type, UUID, public.trust_event_type, INTEGER, TEXT,
  public.delivery_occurrence_severity, public.trust_visibility, TEXT, JSONB
) FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------------
-- Domain commands: Classifieds, Orders, Mobility and Work Opportunities
-- --------------------------------------------------------------------------

-- security-authority: public-rpc public.submit_classified_trust_feedback
CREATE OR REPLACE FUNCTION public.submit_classified_trust_feedback(
  p_classified_id UUID,
  p_subject_profile_id UUID,
  p_rating INTEGER,
  p_reason_code TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_seller_profile_id UUID;
  v_classified_status TEXT;
  v_conversation_id UUID;
  v_actor_role public.trust_actor_role;
  v_subject_role public.trust_actor_role;
  v_severity public.delivery_occurrence_severity;
  v_event public.trust_events;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_reason_code NOT IN (
    'smooth_negotiation', 'late_cancellation', 'no_show',
    'abusive_behavior', 'payment_issue', 'mismatch_item_state',
    'other_negotiation_issue'
  ) THEN
    RAISE EXCEPTION 'invalid_classified_feedback_reason' USING ERRCODE = '22023';
  END IF;

  SELECT classified.seller_id, classified.status::TEXT
  INTO v_seller_profile_id, v_classified_status
  FROM public.classifieds classified
  WHERE classified.id = p_classified_id;

  IF NOT FOUND OR v_classified_status <> 'sold' THEN
    RAISE EXCEPTION 'sold_classified_required' USING ERRCODE = '42501';
  END IF;

  IF v_actor_profile_id = v_seller_profile_id THEN
    SELECT conversation.id
    INTO v_conversation_id
    FROM public.conversations conversation
    WHERE conversation.classified_id = p_classified_id
      AND conversation.seller_id = v_actor_profile_id
      AND conversation.buyer_id = p_subject_profile_id
    ORDER BY conversation.created_at DESC
    LIMIT 1;
    v_actor_role := 'merchant';
    v_subject_role := 'customer';
  ELSIF p_subject_profile_id = v_seller_profile_id THEN
    SELECT conversation.id
    INTO v_conversation_id
    FROM public.conversations conversation
    WHERE conversation.classified_id = p_classified_id
      AND conversation.seller_id = p_subject_profile_id
      AND conversation.buyer_id = v_actor_profile_id
    ORDER BY conversation.created_at DESC
    LIMIT 1;
    v_actor_role := 'customer';
    v_subject_role := 'merchant';
  ELSE
    RAISE EXCEPTION 'classified_feedback_target_not_authorized'
      USING ERRCODE = '42501';
  END IF;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'classified_conversation_required' USING ERRCODE = '42501';
  END IF;

  v_severity := CASE p_reason_code
    WHEN 'smooth_negotiation' THEN 'low'
    WHEN 'no_show' THEN 'medium'
    WHEN 'other_negotiation_issue' THEN 'medium'
    WHEN 'abusive_behavior' THEN 'critical'
    ELSE 'high'
  END;

  PERFORM private.enforce_trust_feedback_rate_limit(
    v_actor_profile_id, 'classified_feedback', 30
  );

  v_event := private.upsert_trust_feedback(
    v_actor_profile_id,
    v_actor_role,
    p_subject_profile_id,
    v_subject_role,
    'classified',
    p_classified_id,
    'operational_feedback',
    p_rating,
    p_reason_code,
    v_severity,
    'private',
    p_description,
    jsonb_build_object(
      'classified_id', p_classified_id,
      'conversation_id', v_conversation_id
    )
  );

  RETURN jsonb_build_object('eventId', v_event.id, 'status', v_event.status);
END;
$$;

-- security-authority: public-rpc public.submit_order_trust_feedback
CREATE OR REPLACE FUNCTION public.submit_order_trust_feedback(
  p_order_id UUID,
  p_subject_profile_id UUID,
  p_rating INTEGER,
  p_reason_code TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_order public.orders;
  v_subject_role public.trust_actor_role;
  v_severity public.delivery_occurrence_severity;
  v_event public.trust_events;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_reason_code NOT IN (
    'smooth_operation', 'customer_late_cancel', 'customer_no_show',
    'invalid_address', 'abusive_behavior', 'courier_delay',
    'courier_package_issue', 'other_operational_issue'
  ) THEN
    RAISE EXCEPTION 'invalid_order_feedback_reason' USING ERRCODE = '22023';
  END IF;

  SELECT order_row.*
  INTO v_order
  FROM public.orders order_row
  WHERE order_row.id = p_order_id;

  IF NOT FOUND
     OR v_order.merchant_profile_id <> v_actor_profile_id
     OR v_order.logistics_status::TEXT NOT IN ('delivered', 'canceled', 'failed') THEN
    RAISE EXCEPTION 'final_merchant_order_required' USING ERRCODE = '42501';
  END IF;

  IF p_subject_profile_id = v_order.customer_profile_id THEN
    v_subject_role := 'customer';
  ELSIF p_subject_profile_id = v_order.courier_profile_id THEN
    v_subject_role := 'courier';
  ELSE
    RAISE EXCEPTION 'order_feedback_target_not_authorized' USING ERRCODE = '42501';
  END IF;

  IF p_reason_code IN ('courier_delay', 'courier_package_issue')
     AND v_subject_role <> 'courier' THEN
    RAISE EXCEPTION 'courier_feedback_target_required' USING ERRCODE = '22023';
  END IF;
  IF p_reason_code IN ('customer_late_cancel', 'customer_no_show', 'invalid_address')
     AND v_subject_role <> 'customer' THEN
    RAISE EXCEPTION 'customer_feedback_target_required' USING ERRCODE = '22023';
  END IF;

  v_severity := CASE p_reason_code
    WHEN 'smooth_operation' THEN 'low'
    WHEN 'customer_no_show' THEN 'medium'
    WHEN 'invalid_address' THEN 'medium'
    WHEN 'courier_delay' THEN 'medium'
    WHEN 'other_operational_issue' THEN 'medium'
    WHEN 'abusive_behavior' THEN 'critical'
    ELSE 'high'
  END;

  PERFORM private.enforce_trust_feedback_rate_limit(
    v_actor_profile_id, 'order_feedback', 40
  );

  v_event := private.upsert_trust_feedback(
    v_actor_profile_id,
    'merchant',
    p_subject_profile_id,
    v_subject_role,
    'order',
    p_order_id,
    'operational_feedback',
    p_rating,
    p_reason_code,
    v_severity,
    'private',
    p_description,
    jsonb_build_object(
      'order_id', p_order_id,
      'order_status', v_order.logistics_status,
      'source_type', v_order.source_type
    )
  );

  RETURN jsonb_build_object('eventId', v_event.id, 'status', v_event.status);
END;
$$;

-- security-authority: public-rpc public.submit_ride_trust_feedback
CREATE OR REPLACE FUNCTION public.submit_ride_trust_feedback(
  p_ride_id UUID,
  p_subject_profile_id UUID,
  p_rating INTEGER,
  p_reason_code TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_ride public.ride_requests;
  v_merchant_profile_id UUID;
  v_actor_role public.trust_actor_role;
  v_subject_role public.trust_actor_role;
  v_severity public.delivery_occurrence_severity;
  v_event public.trust_events;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_reason_code NOT IN (
    'smooth_operation', 'passenger_no_show', 'invalid_address',
    'pickup_delay', 'package_issue', 'abusive_behavior',
    'payment_or_handoff_issue', 'other_operational_issue',
    'driver_delay', 'unsafe_behavior', 'route_or_delivery_issue',
    'package_or_vehicle_issue'
  ) THEN
    RAISE EXCEPTION 'invalid_ride_feedback_reason' USING ERRCODE = '22023';
  END IF;

  SELECT ride.*
  INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id;

  IF NOT FOUND OR v_ride.status::TEXT NOT IN (
    'completed', 'delivered', 'failed',
    'cancelled_by_passenger', 'cancelled_by_driver', 'cancelled'
  ) THEN
    RAISE EXCEPTION 'final_ride_required' USING ERRCODE = '42501';
  END IF;

  IF v_ride.source_type = 'gastronomy' AND v_ride.source_id IS NOT NULL THEN
    SELECT order_row.merchant_profile_id
    INTO v_merchant_profile_id
    FROM public.orders order_row
    WHERE order_row.id::TEXT = v_ride.source_id
    LIMIT 1;
  END IF;

  IF v_actor_profile_id = v_ride.passenger_profile_id
     AND p_subject_profile_id = v_ride.driver_profile_id THEN
    v_actor_role := 'customer';
    v_subject_role := CASE
      WHEN v_ride.ride_mode = 'motoboy' THEN 'courier'::public.trust_actor_role
      ELSE 'driver'::public.trust_actor_role
    END;
  ELSIF v_actor_profile_id = v_ride.driver_profile_id
        AND p_subject_profile_id = v_ride.passenger_profile_id THEN
    v_actor_role := CASE
      WHEN v_ride.ride_mode = 'motoboy' THEN 'courier'::public.trust_actor_role
      ELSE 'driver'::public.trust_actor_role
    END;
    v_subject_role := 'customer';
  ELSIF v_actor_profile_id = v_ride.driver_profile_id
        AND p_subject_profile_id = v_merchant_profile_id
        AND v_ride.ride_mode = 'motoboy' THEN
    v_actor_role := 'courier';
    v_subject_role := 'merchant';
  ELSE
    RAISE EXCEPTION 'ride_feedback_target_not_authorized' USING ERRCODE = '42501';
  END IF;

  IF v_actor_role = 'customer'
     AND p_reason_code IN (
       'passenger_no_show', 'invalid_address', 'pickup_delay',
       'package_issue', 'payment_or_handoff_issue'
     ) THEN
    RAISE EXCEPTION 'driver_feedback_reason_not_allowed_for_customer'
      USING ERRCODE = '22023';
  END IF;

  IF v_actor_role IN ('driver', 'courier')
     AND p_reason_code IN (
       'driver_delay', 'unsafe_behavior', 'route_or_delivery_issue',
       'package_or_vehicle_issue'
     ) THEN
    RAISE EXCEPTION 'customer_feedback_reason_not_allowed_for_driver'
      USING ERRCODE = '22023';
  END IF;

  IF p_reason_code IN ('pickup_delay', 'package_issue')
     AND v_subject_role <> 'merchant' THEN
    RAISE EXCEPTION 'merchant_feedback_target_required' USING ERRCODE = '22023';
  END IF;

  v_severity := CASE p_reason_code
    WHEN 'smooth_operation' THEN 'low'
    WHEN 'passenger_no_show' THEN 'medium'
    WHEN 'invalid_address' THEN 'medium'
    WHEN 'pickup_delay' THEN 'medium'
    WHEN 'other_operational_issue' THEN 'medium'
    WHEN 'abusive_behavior' THEN 'critical'
    ELSE 'high'
  END;

  PERFORM private.enforce_trust_feedback_rate_limit(
    v_actor_profile_id, 'ride_feedback', 40
  );

  v_event := private.upsert_trust_feedback(
    v_actor_profile_id,
    v_actor_role,
    p_subject_profile_id,
    v_subject_role,
    'ride',
    p_ride_id,
    'operational_feedback',
    p_rating,
    p_reason_code,
    v_severity,
    'private',
    p_description,
    jsonb_build_object(
      'ride_id', p_ride_id,
      'ride_mode', v_ride.ride_mode,
      'source_type', v_ride.source_type,
      'source_id', v_ride.source_id
    )
  );

  RETURN jsonb_build_object('eventId', v_event.id, 'status', v_event.status);
END;
$$;

-- security-authority: public-rpc public.submit_work_opportunity_feedback
CREATE OR REPLACE FUNCTION public.submit_work_opportunity_feedback(
  p_opportunity_id UUID,
  p_answer TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_opportunity public.work_opportunities;
  v_rating INTEGER;
  v_severity public.delivery_occurrence_severity;
  v_subject_role public.trust_actor_role;
  v_event public.trust_events;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_answer NOT IN ('helped', 'found_someone', 'service_done', 'no_help') THEN
    RAISE EXCEPTION 'invalid_work_opportunity_feedback_answer'
      USING ERRCODE = '22023';
  END IF;

  SELECT opportunity.*
  INTO v_opportunity
  FROM public.work_opportunities opportunity
  WHERE opportunity.id = p_opportunity_id;

  IF NOT FOUND
     OR v_opportunity.status::TEXT = 'cancelled'
     OR v_opportunity.author_profile_id = v_actor_profile_id THEN
    RAISE EXCEPTION 'eligible_work_opportunity_required' USING ERRCODE = '42501';
  END IF;

  v_rating := CASE p_answer
    WHEN 'service_done' THEN 5
    WHEN 'found_someone' THEN 4
    WHEN 'helped' THEN 4
    ELSE 2
  END;
  v_severity := CASE WHEN p_answer = 'no_help' THEN 'medium' ELSE 'low' END;
  v_subject_role := CASE
    WHEN v_opportunity.professional_id IS NOT NULL
      THEN 'professional'::public.trust_actor_role
    ELSE 'customer'::public.trust_actor_role
  END;

  PERFORM private.enforce_trust_feedback_rate_limit(
    v_actor_profile_id, 'work_opportunity_feedback', 30
  );

  v_event := private.upsert_trust_feedback(
    v_actor_profile_id,
    'customer',
    v_opportunity.author_profile_id,
    v_subject_role,
    'service',
    p_opportunity_id,
    'operational_feedback',
    v_rating,
    'work_opportunity_' || p_answer,
    v_severity,
    'private',
    p_description,
    jsonb_build_object(
      'opportunity_id', p_opportunity_id,
      'professional_id', v_opportunity.professional_id,
      'answer', p_answer
    )
  );

  RETURN jsonb_build_object('eventId', v_event.id, 'status', v_event.status);
END;
$$;

-- security-authority: public-rpc public.get_professional_trust_reputation
CREATE OR REPLACE FUNCTION public.get_professional_trust_reputation(
  p_professional_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.professional_data professional
    WHERE professional.id = p_professional_id
      AND professional.visibility::TEXT IN ('public_listed', 'public_unlisted')
  ) THEN
    RAISE EXCEPTION 'public_professional_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT jsonb_build_object(
    'professional_id', p_professional_id,
    'total_feedback', count(event.id)::INTEGER,
    'avg_rating', COALESCE(round(avg(event.rating)::NUMERIC, 2), 0),
    'positive_feedback', count(*) FILTER (WHERE event.rating >= 4)::INTEGER,
    'neutral_feedback', count(*) FILTER (WHERE event.rating = 3)::INTEGER,
    'negative_feedback', count(*) FILTER (
      WHERE event.rating BETWEEN 1 AND 2
    )::INTEGER
  )
  INTO v_result
  FROM public.work_opportunities opportunity
  LEFT JOIN public.trust_events event
    ON event.context_type = 'service'
   AND event.context_id = opportunity.id
   AND event.event_type = 'operational_feedback'
   AND event.reason_code LIKE 'work_opportunity_%'
   AND event.status <> 'dismissed'
  WHERE opportunity.professional_id = p_professional_id;

  RETURN COALESCE(v_result, jsonb_build_object(
    'professional_id', p_professional_id,
    'total_feedback', 0,
    'avg_rating', 0,
    'positive_feedback', 0,
    'neutral_feedback', 0,
    'negative_feedback', 0
  ));
END;
$$;

-- --------------------------------------------------------------------------
-- Ride ratings: one canonical command and aggregate-only public reads
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ride_ratings
  ALTER COLUMN ride_id SET NOT NULL,
  ALTER COLUMN rater_id SET NOT NULL,
  ALTER COLUMN rated_id SET NOT NULL,
  ALTER COLUMN rating SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ride_ratings_rating_range_chk'
      AND conrelid = 'public.ride_ratings'::regclass
  ) THEN
    ALTER TABLE public.ride_ratings
      ADD CONSTRAINT ride_ratings_rating_range_chk
      CHECK (rating BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ride_ratings_distinct_profiles_chk'
      AND conrelid = 'public.ride_ratings'::regclass
  ) THEN
    ALTER TABLE public.ride_ratings
      ADD CONSTRAINT ride_ratings_distinct_profiles_chk
      CHECK (rater_id <> rated_id);
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ride_ratings_one_per_rater
  ON public.ride_ratings(ride_id, rater_id);
CREATE INDEX IF NOT EXISTS idx_ride_ratings_rated_created
  ON public.ride_ratings(rated_id, created_at DESC);

ALTER TABLE public.ride_ratings ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ride_ratings'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.ride_ratings',
      v_policy.policyname
    );
  END LOOP;
END;
$$;

CREATE POLICY ride_ratings_select_participant_or_admin
  ON public.ride_ratings
  FOR SELECT
  TO authenticated
  USING (
    private.current_active_profile_id() IN (rater_id, rated_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

REVOKE ALL ON TABLE public.ride_ratings FROM anon, authenticated;
GRANT SELECT ON TABLE public.ride_ratings TO authenticated;
GRANT ALL ON TABLE public.ride_ratings TO service_role;

-- security-authority: public-rpc public.submit_ride_rating
CREATE OR REPLACE FUNCTION public.submit_ride_rating(
  p_ride_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL,
  p_behavior_rating INTEGER DEFAULT NULL,
  p_punctuality_rating INTEGER DEFAULT NULL,
  p_payment_rating INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_ride public.ride_requests;
  v_subject_profile_id UUID;
  v_actor_role public.trust_actor_role;
  v_subject_role public.trust_actor_role;
  v_comment TEXT := NULLIF(trim(COALESCE(p_comment, '')), '');
  v_severity public.delivery_occurrence_severity;
  v_rating_row public.ride_ratings;
  v_event public.trust_events;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_rating NOT BETWEEN 1 AND 5
     OR (p_behavior_rating IS NOT NULL AND p_behavior_rating NOT BETWEEN 1 AND 5)
     OR (p_punctuality_rating IS NOT NULL AND p_punctuality_rating NOT BETWEEN 1 AND 5)
     OR (p_payment_rating IS NOT NULL AND p_payment_rating NOT BETWEEN 1 AND 5) THEN
    RAISE EXCEPTION 'ride_rating_out_of_range' USING ERRCODE = '22023';
  END IF;
  IF v_comment IS NOT NULL AND char_length(v_comment) > 600 THEN
    RAISE EXCEPTION 'ride_rating_comment_too_long' USING ERRCODE = '22023';
  END IF;

  SELECT ride.*
  INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_ride.status::TEXT NOT IN ('completed', 'delivered')
     OR v_ride.driver_profile_id IS NULL THEN
    RAISE EXCEPTION 'completed_ride_required' USING ERRCODE = '42501';
  END IF;

  IF v_actor_profile_id = v_ride.passenger_profile_id THEN
    v_subject_profile_id := v_ride.driver_profile_id;
    v_actor_role := 'customer';
    v_subject_role := CASE
      WHEN v_ride.ride_mode = 'motoboy' THEN 'courier'::public.trust_actor_role
      ELSE 'driver'::public.trust_actor_role
    END;
  ELSIF v_actor_profile_id = v_ride.driver_profile_id THEN
    v_subject_profile_id := v_ride.passenger_profile_id;
    v_actor_role := CASE
      WHEN v_ride.ride_mode = 'motoboy' THEN 'courier'::public.trust_actor_role
      ELSE 'driver'::public.trust_actor_role
    END;
    v_subject_role := 'customer';
  ELSE
    RAISE EXCEPTION 'ride_rating_participant_required' USING ERRCODE = '42501';
  END IF;

  PERFORM private.enforce_trust_feedback_rate_limit(
    v_actor_profile_id, 'ride_rating', 40
  );

  INSERT INTO public.ride_ratings (
    ride_id, rater_id, rated_id, rating, comment
  ) VALUES (
    p_ride_id, v_actor_profile_id, v_subject_profile_id, p_rating, v_comment
  )
  ON CONFLICT (ride_id, rater_id)
  DO UPDATE SET
    rated_id = EXCLUDED.rated_id,
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment
  RETURNING * INTO v_rating_row;

  v_severity := CASE
    WHEN p_rating <= 1 THEN 'high'
    WHEN p_rating <= 2 THEN 'medium'
    ELSE 'low'
  END;

  v_event := private.upsert_trust_feedback(
    v_actor_profile_id,
    v_actor_role,
    v_subject_profile_id,
    v_subject_role,
    'ride',
    p_ride_id,
    'review',
    p_rating,
    'ride_rating',
    v_severity,
    'private',
    v_comment,
    jsonb_strip_nulls(jsonb_build_object(
      'ride_rating_id', v_rating_row.id,
      'ride_mode', v_ride.ride_mode,
      'behavior_rating', p_behavior_rating,
      'punctuality_rating', p_punctuality_rating,
      'payment_rating', p_payment_rating
    ))
  );

  RETURN jsonb_build_object(
    'ratingId', v_rating_row.id,
    'trustEventId', v_event.id
  );
END;
$$;

-- security-authority: public-rpc public.get_ride_rating_summary
CREATE OR REPLACE FUNCTION public.get_ride_rating_summary(
  p_profile_id UUID
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
SET statement_timeout = '3s'
AS $$
  SELECT jsonb_build_object(
    'profile_id', p_profile_id,
    'average_rating', COALESCE(round(avg(rating)::NUMERIC, 2), 0),
    'total_ratings', count(*)::INTEGER
  )
  FROM public.ride_ratings
  WHERE rated_id = p_profile_id;
$$;

-- --------------------------------------------------------------------------
-- Public business reviews project into Trust without a second browser write
-- --------------------------------------------------------------------------

-- security-authority: internal-function private.sync_order_review_trust_event
CREATE OR REPLACE FUNCTION private.sync_order_review_trust_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_review public.reviews;
  v_order public.orders;
  v_severity public.delivery_occurrence_severity;
BEGIN
  v_review := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;

  IF v_review.review_type::TEXT <> 'business'
     OR v_review.order_id IS NULL THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  SELECT order_row.*
  INTO v_order
  FROM public.orders order_row
  WHERE order_row.id = v_review.order_id
    AND order_row.customer_profile_id = v_review.reviewer_profile_id
    AND order_row.merchant_profile_id = v_review.reviewed_profile_id
    AND order_row.logistics_status::TEXT = 'delivered';

  IF NOT FOUND THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP = 'DELETE' OR v_review.status <> 'active' THEN
    PERFORM set_config('achegue.trusted_trust_command', '1', TRUE);
    UPDATE public.trust_events event
    SET
      status = 'dismissed',
      resolution_notes = NULL,
      updated_at = now()
    WHERE event.actor_profile_id = v_review.reviewer_profile_id
      AND event.subject_profile_id = v_review.reviewed_profile_id
      AND event.context_type = 'order'
      AND event.context_id = v_review.order_id
      AND event.event_type = 'review'
      AND event.reason_code = 'customer_public_review'
      AND event.reviewed_by_profile_id IS NULL;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  v_severity := CASE
    WHEN v_review.rating <= 1 THEN 'high'
    WHEN v_review.rating <= 2 THEN 'medium'
    ELSE 'low'
  END;

  PERFORM private.upsert_trust_feedback(
    v_review.reviewer_profile_id,
    'customer',
    v_review.reviewed_profile_id,
    'merchant',
    'order',
    v_review.order_id,
    'review',
    v_review.rating,
    'customer_public_review',
    v_severity,
    'private',
    left(v_review.comment, 600),
    jsonb_build_object('review_id', v_review.id, 'order_id', v_review.order_id)
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_order_review_trust_event()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_order_review_trust_event ON public.reviews;
CREATE TRIGGER trg_sync_order_review_trust_event
  AFTER INSERT OR UPDATE OF rating, comment, status, order_id OR DELETE
  ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION private.sync_order_review_trust_event();

-- --------------------------------------------------------------------------
-- Authoritative Trust policy read model and operational gates
-- --------------------------------------------------------------------------

-- security-authority: internal-function private.is_actionable_trust_event
CREATE OR REPLACE FUNCTION private.is_actionable_trust_event(
  p_status public.trust_event_status,
  p_event_type public.trust_event_type,
  p_severity public.delivery_occurrence_severity,
  p_rating INTEGER
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
  SELECT p_status IN ('active', 'under_review', 'confirmed', 'penalized')
    AND CASE
      WHEN p_event_type = 'review' THEN COALESCE(p_rating, 5) <= 2
      ELSE p_event_type IN ('incident', 'late_cancellation', 'no_show')
        OR p_severity IN ('high', 'critical')
        OR COALESCE(p_rating, 5) <= 2
    END;
$$;

REVOKE ALL ON FUNCTION private.is_actionable_trust_event(
  public.trust_event_status, public.trust_event_type,
  public.delivery_occurrence_severity, INTEGER
) FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.trust_event_penalty
CREATE OR REPLACE FUNCTION private.trust_event_penalty(
  p_status public.trust_event_status,
  p_event_type public.trust_event_type,
  p_severity public.delivery_occurrence_severity,
  p_rating INTEGER
)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
  SELECT CASE
    WHEN p_status NOT IN ('active', 'under_review', 'confirmed', 'penalized') THEN 0
    ELSE
      CASE p_severity
        WHEN 'critical' THEN 25
        WHEN 'high' THEN 16
        WHEN 'medium' THEN 8
        ELSE 3
      END
      + CASE WHEN p_event_type = 'late_cancellation' THEN 8 ELSE 0 END
      + CASE WHEN p_event_type = 'incident' THEN 10 ELSE 0 END
      + CASE WHEN p_event_type = 'no_show' THEN 10 ELSE 0 END
      + CASE WHEN COALESCE(p_rating, 5) <= 2 THEN 8 ELSE 0 END
      + CASE WHEN p_status = 'confirmed' THEN 5 ELSE 0 END
      + CASE WHEN p_status = 'penalized' THEN 15 ELSE 0 END
  END;
$$;

REVOKE ALL ON FUNCTION private.trust_event_penalty(
  public.trust_event_status, public.trust_event_type,
  public.delivery_occurrence_severity, INTEGER
) FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.build_trust_policy_decision
CREATE OR REPLACE FUNCTION private.build_trust_policy_decision(
  p_profile_id UUID,
  p_role public.trust_actor_role
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_average_rating NUMERIC;
  v_total_events INTEGER := 0;
  v_incident_count INTEGER := 0;
  v_late_cancellation_count INTEGER := 0;
  v_high_severity_count INTEGER := 0;
  v_penalty INTEGER := 0;
  v_recurrence_30d INTEGER := 0;
  v_recurrence_90d INTEGER := 0;
  v_has_critical BOOLEAN := FALSE;
  v_has_penalized BOOLEAN := FALSE;
  v_reliability_score INTEGER;
  v_risk_level TEXT;
  v_dispatch_policy TEXT;
  v_recommended_action TEXT;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  SELECT
    count(*)::INTEGER,
    avg(event.rating) FILTER (
      WHERE event.status IN ('active', 'under_review', 'confirmed', 'penalized')
        AND event.rating IS NOT NULL
    ),
    count(*) FILTER (
      WHERE event.status IN ('active', 'under_review', 'confirmed', 'penalized')
        AND event.event_type = 'incident'
    )::INTEGER,
    count(*) FILTER (
      WHERE event.status IN ('active', 'under_review', 'confirmed', 'penalized')
        AND event.event_type = 'late_cancellation'
    )::INTEGER,
    count(*) FILTER (
      WHERE event.status IN ('active', 'under_review', 'confirmed', 'penalized')
        AND event.severity IN ('high', 'critical')
    )::INTEGER,
    COALESCE(sum(private.trust_event_penalty(
      event.status, event.event_type, event.severity, event.rating
    )), 0)::INTEGER,
    count(*) FILTER (
      WHERE event.created_at >= now() - interval '30 days'
        AND private.is_actionable_trust_event(
          event.status, event.event_type, event.severity, event.rating
        )
    )::INTEGER,
    count(*) FILTER (
      WHERE event.created_at >= now() - interval '90 days'
        AND private.is_actionable_trust_event(
          event.status, event.event_type, event.severity, event.rating
        )
    )::INTEGER,
    COALESCE(bool_or(
      event.status IN ('active', 'under_review', 'confirmed', 'penalized')
      AND event.severity = 'critical'
    ), FALSE),
    COALESCE(bool_or(event.status = 'penalized'), FALSE)
  INTO
    v_total_events,
    v_average_rating,
    v_incident_count,
    v_late_cancellation_count,
    v_high_severity_count,
    v_penalty,
    v_recurrence_30d,
    v_recurrence_90d,
    v_has_critical,
    v_has_penalized
  FROM public.trust_events event
  WHERE event.subject_profile_id = p_profile_id
    AND event.subject_role = p_role;

  v_reliability_score := greatest(
    0,
    least(
      100,
      100 - v_penalty + CASE
        WHEN v_average_rating IS NULL THEN 0
        ELSE round((v_average_rating - 3) * 8)::INTEGER
      END
    )
  );

  IF v_reliability_score < 50 THEN
    v_reasons := array_append(v_reasons, 'score abaixo de 50');
  END IF;
  IF v_recurrence_30d >= 3 THEN
    v_reasons := array_append(v_reasons, '3 ou mais ocorrencias em 30 dias');
  END IF;
  IF v_recurrence_90d >= 5 THEN
    v_reasons := array_append(v_reasons, '5 ou mais ocorrencias em 90 dias');
  END IF;
  IF v_has_critical THEN
    v_reasons := array_append(v_reasons, 'ocorrencia critica');
  END IF;
  IF v_has_penalized THEN
    v_reasons := array_append(v_reasons, 'evento ja penalizado');
  END IF;

  IF v_has_critical OR v_has_penalized OR v_reliability_score < 35 THEN
    v_risk_level := 'critical';
    v_dispatch_policy := 'block_until_admin_review';
    v_recommended_action := 'temporary_restriction';
  ELSIF v_recurrence_30d >= 3
        OR v_recurrence_90d >= 5
        OR v_reliability_score < 60 THEN
    v_risk_level := 'restricted';
    v_dispatch_policy := 'review_before_assignment';
    v_recommended_action := 'manual_review';
  ELSIF v_recurrence_30d >= 1 OR v_reliability_score < 80 THEN
    v_risk_level := 'watchlist';
    v_dispatch_policy := 'limited_priority';
    v_recommended_action := 'warn';
    IF cardinality(v_reasons) = 0 THEN
      v_reasons := ARRAY['monitoramento preventivo'];
    END IF;
  ELSE
    v_risk_level := 'trusted';
    v_dispatch_policy := 'normal';
    v_recommended_action := 'none';
  END IF;

  RETURN jsonb_build_object(
    'profile_id', p_profile_id,
    'role', p_role,
    'summary', jsonb_build_object(
      'profile_id', p_profile_id,
      'role', p_role,
      'average_rating', CASE
        WHEN v_average_rating IS NULL THEN NULL
        ELSE round(v_average_rating, 2)
      END,
      'total_events', v_total_events,
      'incident_count', v_incident_count,
      'late_cancellation_count', v_late_cancellation_count,
      'high_severity_count', v_high_severity_count,
      'reliability_score', v_reliability_score
    ),
    'risk_level', v_risk_level,
    'dispatch_policy', v_dispatch_policy,
    'recommended_action', v_recommended_action,
    'recurrence_30d', v_recurrence_30d,
    'recurrence_90d', v_recurrence_90d,
    'reasons', to_jsonb(v_reasons)
  );
END;
$$;

REVOKE ALL ON FUNCTION private.build_trust_policy_decision(
  UUID, public.trust_actor_role
) FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.trust_profile_is_blocked
CREATE OR REPLACE FUNCTION private.trust_profile_is_blocked(
  p_profile_id UUID,
  p_role public.trust_actor_role
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, pg_temp
AS $$
  SELECT private.build_trust_policy_decision(p_profile_id, p_role)
    ->> 'dispatch_policy' = 'block_until_admin_review';
$$;

REVOKE ALL ON FUNCTION private.trust_profile_is_blocked(
  UUID, public.trust_actor_role
) FROM PUBLIC, anon, authenticated;

-- security-authority: public-rpc public.get_current_trust_policy_decision
CREATE OR REPLACE FUNCTION public.get_current_trust_policy_decision(
  p_role public.trust_actor_role
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_profile_id UUID := private.current_active_profile_id();
BEGIN
  IF auth.uid() IS NULL OR v_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  RETURN private.build_trust_policy_decision(v_profile_id, p_role);
END;
$$;

-- security-authority: public-rpc public.get_ride_offer_trust_decisions
CREATE OR REPLACE FUNCTION public.get_ride_offer_trust_decisions(
  p_ride_ids UUID[]
)
RETURNS TABLE (
  ride_id UUID,
  subject_profile_id UUID,
  risk_level TEXT,
  dispatch_policy TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_driver_profile_id UUID := private.current_active_profile_id();
  v_ride_ids UUID[];
BEGIN
  SELECT array_agg(DISTINCT value)
  INTO v_ride_ids
  FROM unnest(COALESCE(p_ride_ids, ARRAY[]::UUID[])) value
  WHERE value IS NOT NULL;

  IF auth.uid() IS NULL OR v_driver_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(cardinality(v_ride_ids), 0) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'ride_offer_batch_out_of_range' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.driver_data driver
    WHERE driver.profile_id = v_driver_profile_id
      AND driver.is_verified = TRUE
      AND COALESCE(driver.is_suspended, FALSE) = FALSE
  ) THEN
    RAISE EXCEPTION 'eligible_driver_profile_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    ride.id,
    ride.passenger_profile_id,
    decision.value ->> 'risk_level',
    decision.value ->> 'dispatch_policy'
  FROM public.ride_requests ride
  CROSS JOIN LATERAL (
    SELECT private.build_trust_policy_decision(
      ride.passenger_profile_id,
      'customer'::public.trust_actor_role
    ) AS value
  ) decision
  WHERE ride.id = ANY(v_ride_ids)
    AND (
      ride.driver_profile_id = v_driver_profile_id
      OR (
        ride.driver_profile_id IS NULL
        AND ride.status::TEXT IN (
          'pending', 'requested', 'searching_driver', 'driver_assigned'
        )
      )
    );
END;
$$;

-- security-authority: internal-function private.enforce_ride_trust_gate
CREATE OR REPLACE FUNCTION private.enforce_ride_trust_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_driver_role public.trust_actor_role;
BEGIN
  IF TG_OP = 'INSERT'
     AND private.trust_profile_is_blocked(NEW.passenger_profile_id, 'customer') THEN
    RAISE EXCEPTION 'passenger_blocked_by_trust_policy' USING ERRCODE = '42501';
  END IF;

  IF NEW.driver_profile_id IS NOT NULL
     AND (
       TG_OP = 'INSERT'
       OR NEW.driver_profile_id IS DISTINCT FROM OLD.driver_profile_id
     ) THEN
    v_driver_role := CASE
      WHEN NEW.ride_mode = 'motoboy' THEN 'courier'::public.trust_actor_role
      ELSE 'driver'::public.trust_actor_role
    END;
    IF private.trust_profile_is_blocked(NEW.driver_profile_id, v_driver_role) THEN
      RAISE EXCEPTION 'driver_blocked_by_trust_policy' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_ride_trust_gate()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_ride_trust_gate ON public.ride_requests;
CREATE TRIGGER trg_enforce_ride_trust_gate
  BEFORE INSERT OR UPDATE OF driver_profile_id ON public.ride_requests
  FOR EACH ROW EXECUTE FUNCTION private.enforce_ride_trust_gate();

-- security-authority: internal-function private.enforce_order_courier_trust_gate
CREATE OR REPLACE FUNCTION private.enforce_order_courier_trust_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF NEW.courier_profile_id IS NOT NULL
     AND (
       TG_OP = 'INSERT'
       OR NEW.courier_profile_id IS DISTINCT FROM OLD.courier_profile_id
     )
     AND private.trust_profile_is_blocked(NEW.courier_profile_id, 'courier') THEN
    RAISE EXCEPTION 'courier_blocked_by_trust_policy' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_order_courier_trust_gate()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_order_courier_trust_gate ON public.orders;
CREATE TRIGGER trg_enforce_order_courier_trust_gate
  BEFORE INSERT OR UPDATE OF courier_profile_id ON public.orders
  FOR EACH ROW EXECUTE FUNCTION private.enforce_order_courier_trust_gate();

-- Late cancellation is part of the canonical order transition transaction.
-- The edge broker authorizes the actor; this function derives roles and facts.
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
SET search_path = public, private, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_order public.orders;
  v_previous_status public.logistics_status;
  v_actor_role public.order_actor_role;
  v_trust_actor_role public.trust_actor_role;
  v_cancellation_reason_code TEXT :=
    COALESCE(p_metadata, '{}'::jsonb) ->> 'cancellation_reason_code';
BEGIN
  SELECT order_row.*
  INTO v_order
  FROM public.orders order_row
  WHERE order_row.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido nao encontrado: %', p_order_id;
  END IF;

  v_previous_status := v_order.logistics_status;
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
    metadata = COALESCE(p_metadata, '{}'::jsonb)
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
     AND v_cancellation_reason_code = 'customer_requested_late_cancel' THEN
    v_trust_actor_role := CASE v_actor_role
      WHEN 'courier' THEN 'courier'::public.trust_actor_role
      ELSE 'merchant'::public.trust_actor_role
    END;

    PERFORM set_config('achegue.trusted_trust_command', '1', TRUE);
    INSERT INTO public.trust_events (
      actor_profile_id,
      actor_role,
      subject_profile_id,
      subject_role,
      context_type,
      context_id,
      event_type,
      reason_code,
      severity,
      visibility,
      description,
      evidence,
      status
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

REVOKE ALL ON FUNCTION public.delivery_transition_logistics_status(
  UUID, public.logistics_status, UUID, TEXT, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_transition_logistics_status(
  UUID, public.logistics_status, UUID, TEXT, JSONB
) TO service_role;

-- --------------------------------------------------------------------------
-- Administrative read models and atomic commands
-- --------------------------------------------------------------------------

-- security-authority: public-rpc public.list_trust_events_admin
CREATE OR REPLACE FUNCTION public.list_trust_events_admin(
  p_limit INTEGER DEFAULT 50,
  p_before_created_at TIMESTAMPTZ DEFAULT NULL,
  p_before_id UUID DEFAULT NULL,
  p_context_type public.trust_context_type DEFAULT NULL,
  p_status public.trust_event_status DEFAULT NULL
)
RETURNS SETOF public.trust_events
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '5s'
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;
  IF p_limit NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'trust_event_limit_out_of_range' USING ERRCODE = '22023';
  END IF;
  IF (p_before_created_at IS NULL) <> (p_before_id IS NULL) THEN
    RAISE EXCEPTION 'complete_trust_event_cursor_required' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT event.*
  FROM public.trust_events event
  WHERE (p_context_type IS NULL OR event.context_type = p_context_type)
    AND (p_status IS NULL OR event.status = p_status)
    AND (
      p_before_created_at IS NULL
      OR (event.created_at, event.id) < (p_before_created_at, p_before_id)
    )
  ORDER BY event.created_at DESC, event.id DESC
  LIMIT p_limit;
END;
$$;

-- security-authority: public-rpc public.review_trust_events_admin
CREATE OR REPLACE FUNCTION public.review_trust_events_admin(
  p_event_ids UUID[],
  p_status public.trust_event_status,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_event_ids UUID[];
  v_notes TEXT := NULLIF(trim(COALESCE(p_resolution_notes, '')), '');
  v_updated INTEGER;
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), FALSE)
     OR private.current_active_profile_id() IS NULL THEN
    RAISE EXCEPTION 'active_admin_profile_required' USING ERRCODE = '42501';
  END IF;
  IF v_notes IS NOT NULL AND char_length(v_notes) > 2000 THEN
    RAISE EXCEPTION 'trust_resolution_notes_too_long' USING ERRCODE = '22023';
  END IF;

  SELECT array_agg(DISTINCT value)
  INTO v_event_ids
  FROM unnest(COALESCE(p_event_ids, ARRAY[]::UUID[])) value
  WHERE value IS NOT NULL;

  IF COALESCE(cardinality(v_event_ids), 0) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'trust_review_batch_out_of_range' USING ERRCODE = '22023';
  END IF;

  PERFORM 1
  FROM public.trust_events event
  WHERE event.id = ANY(v_event_ids)
  FOR UPDATE;

  UPDATE public.trust_events event
  SET
    status = p_status,
    resolution_notes = v_notes,
    updated_at = now()
  WHERE event.id = ANY(v_event_ids);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> cardinality(v_event_ids) THEN
    RAISE EXCEPTION 'trust_event_not_found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_updated;
END;
$$;

-- security-authority: public-rpc public.apply_trust_admin_actions
CREATE OR REPLACE FUNCTION public.apply_trust_admin_actions(
  p_event_ids UUID[],
  p_action_type TEXT,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL,
  p_duration_days INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_admin_profile_id UUID := private.current_active_profile_id();
  v_event_ids UUID[];
  v_reason TEXT := NULLIF(trim(COALESCE(p_reason, '')), '');
  v_notes TEXT := NULLIF(trim(COALESCE(p_notes, '')), '');
  v_ends_at TIMESTAMPTZ;
  v_status public.trust_event_status;
  v_inserted INTEGER;
BEGIN
  IF auth.uid() IS NULL
     OR v_admin_profile_id IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'active_admin_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_action_type NOT IN (
    'warning', 'temporary_restriction', 'clear_restriction', 'note_only'
  ) THEN
    RAISE EXCEPTION 'invalid_trust_admin_action' USING ERRCODE = '22023';
  END IF;
  IF v_reason IS NULL OR char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'valid_trust_admin_reason_required' USING ERRCODE = '22023';
  END IF;
  IF v_notes IS NOT NULL AND char_length(v_notes) > 2000 THEN
    RAISE EXCEPTION 'trust_admin_notes_too_long' USING ERRCODE = '22023';
  END IF;
  IF p_action_type = 'temporary_restriction'
     AND COALESCE(p_duration_days, 7) NOT BETWEEN 1 AND 365 THEN
    RAISE EXCEPTION 'trust_restriction_duration_out_of_range'
      USING ERRCODE = '22023';
  END IF;

  SELECT array_agg(DISTINCT value)
  INTO v_event_ids
  FROM unnest(COALESCE(p_event_ids, ARRAY[]::UUID[])) value
  WHERE value IS NOT NULL;

  IF COALESCE(cardinality(v_event_ids), 0) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'trust_admin_batch_out_of_range' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.trust_events event
    WHERE event.id = ANY(v_event_ids)
      AND event.subject_profile_id = v_admin_profile_id
  ) THEN
    RAISE EXCEPTION 'admin_cannot_apply_trust_action_to_self'
      USING ERRCODE = '42501';
  END IF;

  PERFORM 1
  FROM public.trust_events event
  WHERE event.id = ANY(v_event_ids)
  FOR UPDATE;

  IF (SELECT count(*) FROM public.trust_events event WHERE event.id = ANY(v_event_ids))
     <> cardinality(v_event_ids) THEN
    RAISE EXCEPTION 'trust_event_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_ends_at := CASE
    WHEN p_action_type = 'temporary_restriction'
      THEN now() + make_interval(days => COALESCE(p_duration_days, 7))
    ELSE NULL
  END;
  v_status := CASE p_action_type
    WHEN 'temporary_restriction' THEN 'penalized'::public.trust_event_status
    WHEN 'clear_restriction' THEN 'dismissed'::public.trust_event_status
    ELSE 'confirmed'::public.trust_event_status
  END;

  PERFORM set_config(
    'achegue.trusted_trust_admin_action_command', '1', TRUE
  );

  INSERT INTO public.trust_admin_actions (
    trust_event_id,
    subject_profile_id,
    subject_role,
    action_type,
    applied_by_profile_id,
    reason,
    notes,
    starts_at,
    ends_at,
    metadata
  )
  SELECT
    event.id,
    event.subject_profile_id,
    event.subject_role,
    p_action_type,
    v_admin_profile_id,
    v_reason,
    v_notes,
    now(),
    v_ends_at,
    jsonb_build_object(
      'event_type', event.event_type,
      'severity', event.severity,
      'context_type', event.context_type,
      'context_id', event.context_id
    )
  FROM public.trust_events event
  WHERE event.id = ANY(v_event_ids);

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF p_action_type = 'temporary_restriction' THEN
    UPDATE public.profiles profile
    SET
      is_suspended = TRUE,
      suspended = TRUE,
      suspended_at = now(),
      suspended_until = v_ends_at,
      suspension_reason = v_reason,
      updated_at = now()
    WHERE profile.id IN (
      SELECT DISTINCT event.subject_profile_id
      FROM public.trust_events event
      WHERE event.id = ANY(v_event_ids)
    );
  ELSIF p_action_type = 'clear_restriction' THEN
    UPDATE public.profiles profile
    SET
      is_suspended = FALSE,
      suspended = FALSE,
      suspended_at = NULL,
      suspended_until = NULL,
      suspension_reason = NULL,
      updated_at = now()
    WHERE profile.id IN (
      SELECT DISTINCT event.subject_profile_id
      FROM public.trust_events event
      WHERE event.id = ANY(v_event_ids)
    );
  END IF;

  UPDATE public.trust_events event
  SET
    status = v_status,
    resolution_notes = COALESCE(v_notes, v_reason),
    updated_at = now()
  WHERE event.id = ANY(v_event_ids);

  RETURN v_inserted;
END;
$$;

-- security-authority: public-rpc public.list_trust_admin_actions_admin
CREATE OR REPLACE FUNCTION public.list_trust_admin_actions_admin(
  p_limit INTEGER DEFAULT 50,
  p_before_created_at TIMESTAMPTZ DEFAULT NULL,
  p_before_id UUID DEFAULT NULL
)
RETURNS SETOF public.trust_admin_actions
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '5s'
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;
  IF p_limit NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'trust_admin_action_limit_out_of_range'
      USING ERRCODE = '22023';
  END IF;
  IF (p_before_created_at IS NULL) <> (p_before_id IS NULL) THEN
    RAISE EXCEPTION 'complete_trust_admin_cursor_required'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT action.*
  FROM public.trust_admin_actions action
  WHERE p_before_created_at IS NULL
     OR (action.created_at, action.id) < (p_before_created_at, p_before_id)
  ORDER BY action.created_at DESC, action.id DESC
  LIMIT p_limit;
END;
$$;

-- --------------------------------------------------------------------------
-- Final grants: no browser table access, only bounded commands/read models
-- --------------------------------------------------------------------------

ALTER TABLE public.trust_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_admin_actions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('trust_events', 'trust_admin_actions')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      v_policy.policyname,
      v_policy.tablename
    );
  END LOOP;
END;
$$;

REVOKE ALL ON TABLE public.trust_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.trust_admin_actions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.trust_events TO service_role;
GRANT ALL ON TABLE public.trust_admin_actions TO service_role;

REVOKE ALL ON FUNCTION public.submit_classified_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_order_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_ride_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_work_opportunity_feedback(
  UUID, TEXT, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_ride_rating(
  UUID, INTEGER, TEXT, INTEGER, INTEGER, INTEGER
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_current_trust_policy_decision(
  public.trust_actor_role
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_ride_offer_trust_decisions(UUID[])
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_trust_events_admin(
  INTEGER, TIMESTAMPTZ, UUID, public.trust_context_type,
  public.trust_event_status
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_trust_events_admin(
  UUID[], public.trust_event_status, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.apply_trust_admin_actions(
  UUID[], TEXT, TEXT, TEXT, INTEGER
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_trust_admin_actions_admin(
  INTEGER, TIMESTAMPTZ, UUID
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.submit_classified_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_order_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_ride_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_work_opportunity_feedback(
  UUID, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_ride_rating(
  UUID, INTEGER, TEXT, INTEGER, INTEGER, INTEGER
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_trust_policy_decision(
  public.trust_actor_role
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ride_offer_trust_decisions(UUID[])
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_trust_events_admin(
  INTEGER, TIMESTAMPTZ, UUID, public.trust_context_type,
  public.trust_event_status
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_trust_events_admin(
  UUID[], public.trust_event_status, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_trust_admin_actions(
  UUID[], TEXT, TEXT, TEXT, INTEGER
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_trust_admin_actions_admin(
  INTEGER, TIMESTAMPTZ, UUID
) TO authenticated;

REVOKE ALL ON FUNCTION public.get_professional_trust_reputation(UUID)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_ride_rating_summary(UUID)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_professional_trust_reputation(UUID)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ride_rating_summary(UUID)
  TO anon, authenticated;

DROP FUNCTION IF EXISTS private.guard_trust_incident_write();

COMMENT ON TABLE public.trust_events IS
  'Append-only SSOT de confianca operacional; escrita e leitura somente por comandos server-owned.';
COMMENT ON TABLE public.trust_admin_actions IS
  'Append-only SSOT de acoes administrativas de Trust, aplicado atomicamente com restricoes de Profile.';
COMMENT ON FUNCTION public.submit_classified_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) IS 'Registra feedback bilateral de Classificado derivando ator, alvo e papeis da conversa canonica.';
COMMENT ON FUNCTION public.submit_order_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) IS 'Registra feedback operacional da loja apenas para participantes do pedido finalizado.';
COMMENT ON FUNCTION public.submit_ride_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) IS 'Registra feedback operacional de corrida/entrega apenas entre participantes canonicos.';
COMMENT ON FUNCTION public.submit_work_opportunity_feedback(
  UUID, TEXT, TEXT
) IS 'Registra feedback de oportunidade derivando o profissional e o ator autenticado.';
COMMENT ON FUNCTION public.submit_ride_rating(
  UUID, INTEGER, TEXT, INTEGER, INTEGER, INTEGER
) IS 'Persiste avaliacao de corrida e sua projecao Trust na mesma transacao.';
COMMENT ON FUNCTION public.get_current_trust_policy_decision(
  public.trust_actor_role
) IS 'Retorna a decisao Trust do perfil ativo sem expor eventos privados.';
COMMENT ON FUNCTION public.get_ride_offer_trust_decisions(UUID[]) IS
  'Retorna somente risco/politica de passageiros em ofertas autorizadas, em lote limitado.';
COMMENT ON FUNCTION public.list_trust_events_admin(
  INTEGER, TIMESTAMPTZ, UUID, public.trust_context_type,
  public.trust_event_status
) IS 'Read model administrativo de Trust com limite e cursor keyset.';
COMMENT ON FUNCTION public.apply_trust_admin_actions(
  UUID[], TEXT, TEXT, TEXT, INTEGER
) IS 'Aplica acao, restricao de Profile, revisao e audit log em uma unica transacao.';
