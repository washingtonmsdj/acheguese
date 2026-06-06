-- ============================================================================
-- SaaS RPC hardening: exposed SECURITY DEFINER authorization
-- ============================================================================
-- Protect RPCs granted to authenticated users from BOLA-style object mutation.

CREATE OR REPLACE FUNCTION public.accept_ride_atomic(
  p_ride_id UUID,
  p_driver_profile_id UUID,
  p_strategy TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_current_driver_id UUID;
  v_driver_accepted_at TIMESTAMPTZ;
  v_is_service_role BOOLEAN := coalesce(auth.role(), '') = 'service_role';
  v_is_admin BOOLEAN := coalesce(public.is_admin_from_roles(auth.uid()), false);
BEGIN
  IF NOT v_is_service_role
    AND NOT v_is_admin
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.driver_data dd ON dd.profile_id = p.id
      WHERE p.id = p_driver_profile_id
        AND p.user_id = auth.uid()
        AND p.is_suspended = false
        AND dd.is_verified = true
        AND dd.is_online = true
        AND dd.is_available = true
        AND (
          (p_strategy = 'open_board' AND dd.can_do_delivery = true)
          OR (p_strategy <> 'open_board' AND dd.can_do_rides <> false)
        )
    ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'not_authorized',
      'error', 'Driver profile is not authorized or eligible for this user'
    );
  END IF;

  SELECT status, driver_profile_id, driver_accepted_at
  INTO v_current_status, v_current_driver_id, v_driver_accepted_at
  FROM public.ride_requests
  WHERE id = p_ride_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'not_found',
      'error', 'Ride not found'
    );
  END IF;

  IF v_driver_accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_accepted',
      'error', 'Ride already accepted by another driver'
    );
  END IF;

  IF p_strategy = 'exclusive_offer' THEN
    IF v_current_status != 'driver_assigned' THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'invalid_state',
        'error', format('Cannot accept exclusive offer in status: %s', v_current_status)
      );
    END IF;

    IF v_current_driver_id != p_driver_profile_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'not_assigned',
        'error', 'Ride assigned to another driver'
      );
    END IF;
  ELSIF p_strategy IN ('open_board', 'reservation_board') THEN
    IF v_current_status NOT IN ('pending', 'requested', 'searching_driver') THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'invalid_state',
        'error', format('Cannot accept open offer in status: %s', v_current_status)
      );
    END IF;

    IF v_current_driver_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'already_assigned',
        'error', 'Ride already assigned to another driver'
      );
    END IF;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'invalid_strategy',
      'error', format('Unknown strategy: %s', p_strategy)
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.ride_requests
    WHERE driver_profile_id = p_driver_profile_id
      AND status IN (
        'driver_accepted',
        'driver_arriving',
        'driver_on_the_way',
        'driver_arrived',
        'passenger_on_board',
        'passenger_boarded',
        'in_progress'
      )
      AND id != p_ride_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'driver_busy',
      'error', 'Driver already has an active ride'
    );
  END IF;

  UPDATE public.ride_requests
  SET
    driver_profile_id = p_driver_profile_id,
    driver_accepted_at = NOW(),
    status = 'driver_accepted',
    updated_at = NOW()
  WHERE id = p_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id,
    from_state,
    to_state,
    changed_by,
    reason,
    metadata
  ) VALUES (
    p_ride_id,
    v_current_status,
    'driver_accepted',
    p_driver_profile_id,
    format('Driver accepted via %s strategy', p_strategy),
    jsonb_build_object(
      'strategy', p_strategy,
      'accepted_at', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'reason', 'accepted',
    'accepted_at', NOW()
  );

EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'concurrent_access',
      'error', 'Another driver is accepting this ride'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'error',
      'error', SQLERRM
    );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_ride_atomic(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_ride_atomic(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_ride_atomic(UUID, UUID, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_best_answer(_question_id UUID, _answer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role'
    AND NOT coalesce(public.is_admin_from_roles(auth.uid()), false)
    AND NOT EXISTS (
      SELECT 1
      FROM public.community_questions q
      JOIN public.profiles p ON p.id = q.author_profile_id
      WHERE q.id = _question_id
        AND p.user_id = auth.uid()
    ) THEN
    RAISE EXCEPTION 'not_authorized_to_mark_best_answer';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.question_answers qa
    WHERE qa.id = _answer_id
      AND qa.question_id = _question_id
  ) THEN
    RAISE EXCEPTION 'answer_not_found_for_question';
  END IF;

  UPDATE public.question_answers
  SET is_best_answer = false
  WHERE question_id = _question_id;

  UPDATE public.question_answers
  SET is_best_answer = true,
      updated_at = NOW()
  WHERE id = _answer_id
    AND question_id = _question_id;

  UPDATE public.community_questions
  SET resolved = true,
      updated_at = NOW()
  WHERE id = _question_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_best_answer(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_best_answer(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_best_answer(UUID, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.increment_alert_edit_count(p_alert_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role'
    AND NOT coalesce(public.is_admin_from_roles(auth.uid()), false)
    AND NOT EXISTS (
      SELECT 1
      FROM public.community_alerts ca
      JOIN public.profiles p ON p.id = ca.profile_id
      WHERE ca.id = p_alert_id
        AND p.user_id = auth.uid()
    ) THEN
    RAISE EXCEPTION 'not_authorized_to_increment_alert_edit_count';
  END IF;

  UPDATE public.community_alerts
  SET edit_count = edit_count + 1,
      updated_at = NOW()
  WHERE id = p_alert_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_alert_edit_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_alert_edit_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_alert_edit_count(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.expire_stale_work_opportunities(
  p_now timestamptz DEFAULT now()
)
RETURNS TABLE (
  expired_count integer,
  expired_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids uuid[] := '{}';
  v_effective_now timestamptz := now();
BEGIN
  IF auth.role() = 'service_role' THEN
    v_effective_now := coalesce(p_now, now());
  END IF;

  WITH target AS (
    SELECT wo.id
    FROM public.work_opportunities wo
    WHERE wo.status = 'active'
      AND wo.published_at IS NOT NULL
      AND wo.published_at + make_interval(hours => public.work_opportunity_expiration_hours(wo.opportunity_type)) <= v_effective_now
  ),
  updated AS (
    UPDATE public.work_opportunities wo
    SET
      status = 'expired',
      closed_at = COALESCE(wo.closed_at, v_effective_now),
      updated_at = v_effective_now
    FROM target t
    WHERE wo.id = t.id
    RETURNING wo.id
  )
  SELECT COALESCE(array_agg(id), '{}') INTO v_ids
  FROM updated;

  RETURN QUERY
  SELECT COALESCE(array_length(v_ids, 1), 0)::integer, v_ids;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_work_opportunities(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_work_opportunities(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_work_opportunities(timestamptz) TO service_role;

NOTIFY pgrst, 'reload schema';
