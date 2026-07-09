-- ============================================================================
-- Migration: atomic event participation RPCs
-- Date: 2026-07-09
-- Purpose:
--   Move event join/leave/check-in workflows to dedicated atomic database RPCs
--   called only by the authenticated event-rpc Edge Function.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.join_event_participation(
  p_event_id uuid,
  p_profile_id uuid,
  p_actor_user_id uuid,
  p_is_project_admin boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event record;
  v_participant_id uuid;
  v_checkin_code uuid;
  v_joined_at timestamptz;
  v_count integer;
BEGIN
  IF p_event_id IS NULL OR p_profile_id IS NULL OR p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_event_participation_payload';
  END IF;

  IF NOT p_is_project_admin AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.user_id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'not_authorized_for_event_profile';
  END IF;

  SELECT e.id, e.status, e.max_participants
  INTO v_event
  FROM public.events e
  WHERE e.id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  IF v_event.status NOT IN ('upcoming', 'ongoing') THEN
    RAISE EXCEPTION 'event_not_joinable';
  END IF;

  SELECT ep.id, ep.checkin_code, ep.joined_at
  INTO v_participant_id, v_checkin_code, v_joined_at
  FROM public.event_participants ep
  WHERE ep.event_id = p_event_id
    AND ep.profile_id = p_profile_id;

  IF FOUND THEN
    SELECT count(*)::integer
    INTO v_count
    FROM public.event_participants ep
    WHERE ep.event_id = p_event_id;

    UPDATE public.events
    SET current_participants = v_count,
        updated_at = now()
    WHERE id = p_event_id;

    RETURN jsonb_build_object(
      'joined', false,
      'alreadyParticipating', true,
      'participantId', v_participant_id,
      'checkinCode', v_checkin_code,
      'joinedAt', v_joined_at,
      'currentParticipants', v_count
    );
  END IF;

  SELECT count(*)::integer
  INTO v_count
  FROM public.event_participants ep
  WHERE ep.event_id = p_event_id;

  IF v_event.max_participants IS NOT NULL AND v_count >= v_event.max_participants THEN
    RAISE EXCEPTION 'event_full';
  END IF;

  INSERT INTO public.event_participants (event_id, profile_id)
  VALUES (p_event_id, p_profile_id)
  RETURNING id, checkin_code, joined_at
  INTO v_participant_id, v_checkin_code, v_joined_at;

  v_count := v_count + 1;

  UPDATE public.events
  SET current_participants = v_count,
      updated_at = now()
  WHERE id = p_event_id;

  RETURN jsonb_build_object(
    'joined', true,
    'alreadyParticipating', false,
    'participantId', v_participant_id,
    'checkinCode', v_checkin_code,
    'joinedAt', v_joined_at,
    'currentParticipants', v_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_event_participation(
  p_event_id uuid,
  p_profile_id uuid,
  p_actor_user_id uuid,
  p_is_project_admin boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted_id uuid;
  v_count integer;
BEGIN
  IF p_event_id IS NULL OR p_profile_id IS NULL OR p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_event_participation_payload';
  END IF;

  IF NOT p_is_project_admin AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.user_id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'not_authorized_for_event_profile';
  END IF;

  PERFORM 1
  FROM public.events e
  WHERE e.id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  DELETE FROM public.event_participants ep
  WHERE ep.event_id = p_event_id
    AND ep.profile_id = p_profile_id
  RETURNING ep.id INTO v_deleted_id;

  SELECT count(*)::integer
  INTO v_count
  FROM public.event_participants ep
  WHERE ep.event_id = p_event_id;

  UPDATE public.events
  SET current_participants = v_count,
      updated_at = now()
  WHERE id = p_event_id;

  RETURN jsonb_build_object(
    'left', v_deleted_id IS NOT NULL,
    'participantId', v_deleted_id,
    'currentParticipants', v_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_in_event_participation(
  p_event_id uuid,
  p_profile_id uuid,
  p_actor_user_id uuid,
  p_is_project_admin boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_participant_id uuid;
  v_checked_in_at timestamptz;
BEGIN
  IF p_event_id IS NULL OR p_profile_id IS NULL OR p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_event_checkin_payload';
  END IF;

  IF NOT p_is_project_admin
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = p_profile_id
        AND p.user_id = p_actor_user_id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.events e
      JOIN public.profiles organizer
        ON organizer.id = e.organizer_profile_id
      WHERE e.id = p_event_id
        AND organizer.user_id = p_actor_user_id
    )
  THEN
    RAISE EXCEPTION 'not_authorized_for_event_checkin';
  END IF;

  SELECT ep.id, ep.checked_in_at
  INTO v_participant_id, v_checked_in_at
  FROM public.event_participants ep
  WHERE ep.event_id = p_event_id
    AND ep.profile_id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_participation_not_found';
  END IF;

  IF v_checked_in_at IS NULL THEN
    v_checked_in_at := now();

    UPDATE public.event_participants ep
    SET checked_in_at = v_checked_in_at
    WHERE ep.id = v_participant_id;
  END IF;

  RETURN jsonb_build_object(
    'participantId', v_participant_id,
    'profileId', p_profile_id,
    'checkedInAt', v_checked_in_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_in_event_participation_by_code(
  p_event_id uuid,
  p_checkin_code uuid,
  p_actor_user_id uuid,
  p_is_project_admin boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_participant_id uuid;
  v_profile_id uuid;
  v_checked_in_at timestamptz;
BEGIN
  IF p_event_id IS NULL OR p_checkin_code IS NULL OR p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_event_checkin_payload';
  END IF;

  IF NOT p_is_project_admin AND NOT EXISTS (
    SELECT 1
    FROM public.events e
    JOIN public.profiles organizer
      ON organizer.id = e.organizer_profile_id
    WHERE e.id = p_event_id
      AND organizer.user_id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'not_authorized_for_event_checkin';
  END IF;

  SELECT ep.id, ep.profile_id, ep.checked_in_at
  INTO v_participant_id, v_profile_id, v_checked_in_at
  FROM public.event_participants ep
  WHERE ep.event_id = p_event_id
    AND ep.checkin_code = p_checkin_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_checkin_code_not_found';
  END IF;

  IF v_checked_in_at IS NULL THEN
    v_checked_in_at := now();

    UPDATE public.event_participants ep
    SET checked_in_at = v_checked_in_at
    WHERE ep.id = v_participant_id;
  END IF;

  RETURN jsonb_build_object(
    'participantId', v_participant_id,
    'profileId', v_profile_id,
    'checkedInAt', v_checked_in_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.join_event_participation(uuid, uuid, uuid, boolean)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.leave_event_participation(uuid, uuid, uuid, boolean)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_in_event_participation(uuid, uuid, uuid, boolean)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_in_event_participation_by_code(uuid, uuid, uuid, boolean)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.join_event_participation(uuid, uuid, uuid, boolean)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.leave_event_participation(uuid, uuid, uuid, boolean)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.check_in_event_participation(uuid, uuid, uuid, boolean)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.check_in_event_participation_by_code(uuid, uuid, uuid, boolean)
  TO service_role;

REVOKE ALL ON FUNCTION public.increment_event_participants(uuid)
  FROM service_role;
REVOKE ALL ON FUNCTION public.decrement_event_participants(uuid)
  FROM service_role;

COMMENT ON FUNCTION public.join_event_participation(uuid, uuid, uuid, boolean)
  IS 'Atomic event join helper. Not exposed as public RPC; called only by event-rpc after JWT authentication.';
COMMENT ON FUNCTION public.leave_event_participation(uuid, uuid, uuid, boolean)
  IS 'Atomic event leave helper. Not exposed as public RPC; called only by event-rpc after JWT authentication.';
COMMENT ON FUNCTION public.check_in_event_participation(uuid, uuid, uuid, boolean)
  IS 'Atomic event check-in helper by event/profile. Not exposed as public RPC; called only by event-rpc after JWT authentication.';
COMMENT ON FUNCTION public.check_in_event_participation_by_code(uuid, uuid, uuid, boolean)
  IS 'Atomic event check-in helper by secret code. Not exposed as public RPC; called only by event-rpc after JWT authentication.';
COMMENT ON FUNCTION public.increment_event_participants(uuid)
  IS 'Deprecated legacy event counter helper. Replaced by atomic event participation RPCs.';
COMMENT ON FUNCTION public.decrement_event_participants(uuid)
  IS 'Deprecated legacy event counter helper. Replaced by atomic event participation RPCs.';
