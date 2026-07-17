-- Final application-owned function lint repair. Extension-owned PostGIS
-- functions remain under the extension lifecycle and are not modified here.

CREATE OR REPLACE FUNCTION public.generate_unique_handle(base_handle TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_candidate TEXT;
  v_clean TEXT;
  v_counter INTEGER := 0;
BEGIN
  v_clean := lower(regexp_replace(
    public.unaccent(COALESCE(base_handle, '')),
    '[^a-z0-9_]', '_', 'g'
  ));
  v_clean := regexp_replace(v_clean, '_+', '_', 'g');
  v_clean := trim(BOTH '_' FROM v_clean);
  IF length(v_clean) < 3 THEN
    v_clean := COALESCE(NULLIF(v_clean, ''), 'user') || '_user';
  END IF;
  v_clean := left(v_clean, 27);

  WHILE v_counter <= 999 LOOP
    v_candidate := CASE
      WHEN v_counter = 0 THEN v_clean
      ELSE left(v_clean, 24) || '_' || lpad(v_counter::TEXT, 3, '0')
    END;
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles profile WHERE profile.handle = v_candidate
    ) THEN
      RETURN v_candidate;
    END IF;
    v_counter := v_counter + 1;
  END LOOP;

  RAISE EXCEPTION 'Unable to generate a unique profile handle'
    USING ERRCODE = '23505';
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_generate_classified_public_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_chars CONSTANT TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  v_id TEXT;
  v_attempt INTEGER := 1;
  v_index INTEGER;
BEGIN
  WHILE v_attempt <= 64 LOOP
    v_id := '';
    v_index := 1;
    WHILE v_index <= 8 LOOP
      v_id := v_id || substr(
        v_chars,
        floor(random() * length(v_chars) + 1)::INTEGER,
        1
      );
      v_index := v_index + 1;
    END LOOP;

    IF NOT EXISTS (
      SELECT 1 FROM public.classifieds classified WHERE classified.public_id = v_id
    ) THEN
      RETURN v_id;
    END IF;
    v_attempt := v_attempt + 1;
  END LOOP;

  RAISE EXCEPTION 'Unable to generate a unique classified public id'
    USING ERRCODE = '23505';
END;
$$;

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
  v_offset INTEGER := 0;
BEGIN
  WHILE v_offset <= 7 LOOP
    v_check_date := (v_now + make_interval(days => v_offset))::DATE;
    v_day := extract(DOW FROM v_check_date)::INTEGER;

    SELECT exception.* INTO v_exception
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
    ELSE
      SELECT hours.* INTO v_hours
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
    END IF;

    v_offset := v_offset + 1;
  END LOOP;

  RETURN NULL;
END;
$$;

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
SET search_path = pg_catalog, public, private, pg_temp
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
    SELECT conversation.id INTO v_conversation_id
    FROM public.conversations conversation
    WHERE conversation.classified_id = p_classified_id
      AND conversation.seller_id = v_actor_profile_id
      AND conversation.buyer_id = p_subject_profile_id
    ORDER BY conversation.created_at DESC
    LIMIT 1;
    v_actor_role := 'merchant';
    v_subject_role := 'customer';
  ELSIF p_subject_profile_id = v_seller_profile_id THEN
    SELECT conversation.id INTO v_conversation_id
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

  v_severity := (CASE p_reason_code
    WHEN 'smooth_negotiation' THEN 'low'
    WHEN 'no_show' THEN 'medium'
    WHEN 'other_negotiation_issue' THEN 'medium'
    WHEN 'abusive_behavior' THEN 'critical'
    ELSE 'high'
  END)::public.delivery_occurrence_severity;

  PERFORM private.enforce_trust_feedback_rate_limit(
    v_actor_profile_id, 'classified_feedback', 30
  );
  v_event := private.upsert_trust_feedback(
    v_actor_profile_id, v_actor_role, p_subject_profile_id, v_subject_role,
    'classified', p_classified_id, 'operational_feedback', p_rating,
    p_reason_code, v_severity, 'private', p_description,
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
SET search_path = pg_catalog, public, private, pg_temp
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

  SELECT order_row.* INTO v_order
  FROM public.orders order_row
  WHERE order_row.id = p_order_id;

  IF NOT FOUND
    OR v_order.merchant_profile_id <> v_actor_profile_id
    OR v_order.logistics_status::TEXT NOT IN ('delivered', 'canceled', 'failed')
  THEN
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
    AND v_subject_role <> 'courier'
  THEN
    RAISE EXCEPTION 'courier_feedback_target_required' USING ERRCODE = '22023';
  END IF;
  IF p_reason_code IN ('customer_late_cancel', 'customer_no_show', 'invalid_address')
    AND v_subject_role <> 'customer'
  THEN
    RAISE EXCEPTION 'customer_feedback_target_required' USING ERRCODE = '22023';
  END IF;

  v_severity := (CASE p_reason_code
    WHEN 'smooth_operation' THEN 'low'
    WHEN 'customer_no_show' THEN 'medium'
    WHEN 'invalid_address' THEN 'medium'
    WHEN 'courier_delay' THEN 'medium'
    WHEN 'other_operational_issue' THEN 'medium'
    WHEN 'abusive_behavior' THEN 'critical'
    ELSE 'high'
  END)::public.delivery_occurrence_severity;

  PERFORM private.enforce_trust_feedback_rate_limit(
    v_actor_profile_id, 'order_feedback', 40
  );
  v_event := private.upsert_trust_feedback(
    v_actor_profile_id, 'merchant', p_subject_profile_id, v_subject_role,
    'order', p_order_id, 'operational_feedback', p_rating, p_reason_code,
    v_severity, 'private', p_description,
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
SET search_path = pg_catalog, public, private, pg_temp
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

  SELECT ride.* INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id;

  IF NOT FOUND OR v_ride.status::TEXT NOT IN (
    'completed', 'delivered', 'failed',
    'cancelled_by_passenger', 'cancelled_by_driver', 'cancelled'
  ) THEN
    RAISE EXCEPTION 'final_ride_required' USING ERRCODE = '42501';
  END IF;

  IF v_ride.source_type = 'gastronomy' AND v_ride.source_id IS NOT NULL THEN
    SELECT order_row.merchant_profile_id INTO v_merchant_profile_id
    FROM public.orders order_row
    WHERE order_row.id = v_ride.source_id
    LIMIT 1;
  END IF;

  IF v_actor_profile_id = v_ride.passenger_profile_id
    AND p_subject_profile_id = v_ride.driver_profile_id
  THEN
    v_actor_role := 'customer';
    v_subject_role := CASE
      WHEN v_ride.ride_mode = 'motoboy' THEN 'courier'::public.trust_actor_role
      ELSE 'driver'::public.trust_actor_role
    END;
  ELSIF v_actor_profile_id = v_ride.driver_profile_id
    AND p_subject_profile_id = v_ride.passenger_profile_id
  THEN
    v_actor_role := CASE
      WHEN v_ride.ride_mode = 'motoboy' THEN 'courier'::public.trust_actor_role
      ELSE 'driver'::public.trust_actor_role
    END;
    v_subject_role := 'customer';
  ELSIF v_actor_profile_id = v_ride.driver_profile_id
    AND p_subject_profile_id = v_merchant_profile_id
    AND v_ride.ride_mode = 'motoboy'
  THEN
    v_actor_role := 'courier';
    v_subject_role := 'merchant';
  ELSE
    RAISE EXCEPTION 'ride_feedback_target_not_authorized' USING ERRCODE = '42501';
  END IF;

  IF v_actor_role = 'customer' AND p_reason_code IN (
    'passenger_no_show', 'invalid_address', 'pickup_delay',
    'package_issue', 'payment_or_handoff_issue'
  ) THEN
    RAISE EXCEPTION 'driver_feedback_reason_not_allowed_for_customer'
      USING ERRCODE = '22023';
  END IF;
  IF v_actor_role IN ('driver', 'courier') AND p_reason_code IN (
    'driver_delay', 'unsafe_behavior', 'route_or_delivery_issue',
    'package_or_vehicle_issue'
  ) THEN
    RAISE EXCEPTION 'customer_feedback_reason_not_allowed_for_driver'
      USING ERRCODE = '22023';
  END IF;
  IF p_reason_code IN ('pickup_delay', 'package_issue')
    AND v_subject_role <> 'merchant'
  THEN
    RAISE EXCEPTION 'merchant_feedback_target_required' USING ERRCODE = '22023';
  END IF;

  v_severity := (CASE p_reason_code
    WHEN 'smooth_operation' THEN 'low'
    WHEN 'passenger_no_show' THEN 'medium'
    WHEN 'invalid_address' THEN 'medium'
    WHEN 'pickup_delay' THEN 'medium'
    WHEN 'other_operational_issue' THEN 'medium'
    WHEN 'abusive_behavior' THEN 'critical'
    ELSE 'high'
  END)::public.delivery_occurrence_severity;

  PERFORM private.enforce_trust_feedback_rate_limit(
    v_actor_profile_id, 'ride_feedback', 40
  );
  v_event := private.upsert_trust_feedback(
    v_actor_profile_id, v_actor_role, p_subject_profile_id, v_subject_role,
    'ride', p_ride_id, 'operational_feedback', p_rating, p_reason_code,
    v_severity, 'private', p_description,
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
SET search_path = pg_catalog, public, private, pg_temp
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

  SELECT opportunity.* INTO v_opportunity
  FROM public.work_opportunities opportunity
  WHERE opportunity.id = p_opportunity_id;

  IF NOT FOUND
    OR v_opportunity.status::TEXT = 'cancelled'
    OR v_opportunity.author_profile_id = v_actor_profile_id
  THEN
    RAISE EXCEPTION 'eligible_work_opportunity_required' USING ERRCODE = '42501';
  END IF;

  v_rating := CASE p_answer
    WHEN 'service_done' THEN 5
    WHEN 'found_someone' THEN 4
    WHEN 'helped' THEN 4
    ELSE 2
  END;
  v_severity := (CASE
    WHEN p_answer = 'no_help' THEN 'medium'
    ELSE 'low'
  END)::public.delivery_occurrence_severity;
  v_subject_role := CASE
    WHEN v_opportunity.professional_id IS NOT NULL
      THEN 'professional'::public.trust_actor_role
    ELSE 'customer'::public.trust_actor_role
  END;

  PERFORM private.enforce_trust_feedback_rate_limit(
    v_actor_profile_id, 'work_opportunity_feedback', 30
  );
  v_event := private.upsert_trust_feedback(
    v_actor_profile_id, 'customer', v_opportunity.author_profile_id,
    v_subject_role, 'service', p_opportunity_id, 'operational_feedback',
    v_rating, 'work_opportunity_' || p_answer, v_severity, 'private',
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
SET search_path = pg_catalog, public, private, pg_temp
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
    OR (p_payment_rating IS NOT NULL AND p_payment_rating NOT BETWEEN 1 AND 5)
  THEN
    RAISE EXCEPTION 'ride_rating_out_of_range' USING ERRCODE = '22023';
  END IF;
  IF v_comment IS NOT NULL AND char_length(v_comment) > 600 THEN
    RAISE EXCEPTION 'ride_rating_comment_too_long' USING ERRCODE = '22023';
  END IF;

  SELECT ride.* INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND
    OR v_ride.status::TEXT NOT IN ('completed', 'delivered')
    OR v_ride.driver_profile_id IS NULL
  THEN
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

  INSERT INTO public.ride_ratings (ride_id, rater_id, rated_id, rating, comment)
  VALUES (p_ride_id, v_actor_profile_id, v_subject_profile_id, p_rating, v_comment)
  ON CONFLICT (ride_id, rater_id)
  DO UPDATE SET
    rated_id = EXCLUDED.rated_id,
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment
  RETURNING * INTO v_rating_row;

  v_severity := (CASE
    WHEN p_rating <= 1 THEN 'high'
    WHEN p_rating <= 2 THEN 'medium'
    ELSE 'low'
  END)::public.delivery_occurrence_severity;

  v_event := private.upsert_trust_feedback(
    v_actor_profile_id, v_actor_role, v_subject_profile_id, v_subject_role,
    'ride', p_ride_id, 'review', p_rating, 'ride_rating', v_severity,
    'private', v_comment,
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

-- security-authority: public-rpc public.get_ride_offer_trust_decisions
CREATE OR REPLACE FUNCTION public.get_ride_offer_trust_decisions(p_ride_ids UUID[])
RETURNS TABLE(
  ride_id UUID,
  subject_profile_id UUID,
  risk_level TEXT,
  dispatch_policy TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_driver_profile_id UUID := private.current_active_profile_id();
  v_ride_ids UUID[];
BEGIN
  SELECT array_agg(DISTINCT value) INTO v_ride_ids
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
    JOIN public.profiles profile ON profile.id = driver.profile_id
    WHERE driver.profile_id = v_driver_profile_id
      AND driver.is_verified = TRUE
      AND profile.is_active = TRUE
      AND NOT (
        (profile.is_suspended = TRUE OR profile.suspended = TRUE)
        AND (profile.suspended_until IS NULL OR profile.suspended_until > now())
      )
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

REVOKE ALL ON FUNCTION public.generate_unique_handle(TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_generate_classified_public_id()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_next_opening_time(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_unique_handle(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_generate_classified_public_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_next_opening_time(UUID)
  TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.submit_classified_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_order_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_ride_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_work_opportunity_feedback(UUID, TEXT, TEXT)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_ride_rating(
  UUID, INTEGER, TEXT, INTEGER, INTEGER, INTEGER
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_ride_offer_trust_decisions(UUID[])
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.submit_classified_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_order_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_ride_trust_feedback(
  UUID, UUID, INTEGER, TEXT, TEXT
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_work_opportunity_feedback(UUID, TEXT, TEXT)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_ride_rating(
  UUID, INTEGER, TEXT, INTEGER, INTEGER, INTEGER
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ride_offer_trust_decisions(UUID[])
  TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
