-- LGPD pending-deletion operational boundary.
-- Depends on 20260821011000_create_account_deletion_request_authority.sql.
-- This migration does not purge data or delete Auth users.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.account_deletion_requests') IS NULL THEN
    RAISE EXCEPTION 'account deletion authority foundation is missing';
  END IF;
  IF to_regprocedure('public.request_account_deletion_for_user(uuid,text,boolean)') IS NULL THEN
    RAISE EXCEPTION 'request_account_deletion_for_user foundation is missing';
  END IF;
  IF to_regprocedure('public.cancel_account_deletion_for_user(uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'cancel_account_deletion_for_user foundation is missing';
  END IF;
  IF to_regprocedure('private.auth_account_operational()') IS NOT NULL THEN
    RAISE EXCEPTION 'private.auth_account_operational already exists out-of-band';
  END IF;
  IF to_regprocedure('public.get_account_deletion_status_for_user(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'get_account_deletion_status_for_user already exists out-of-band';
  END IF;
END;
$$;

CREATE FUNCTION private.auth_account_operational()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '2s'
AS $$
  SELECT COALESCE(auth.role(), '') = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.account_deletion_requests request
        WHERE request.user_id = auth.uid()
          AND request.status IN ('scheduled', 'processing', 'failed', 'completed')
      )
    );
$$;

REVOKE ALL ON FUNCTION private.auth_account_operational() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_account_operational() FROM anon;
REVOKE ALL ON FUNCTION private.auth_account_operational() FROM authenticated;
GRANT EXECUTE ON FUNCTION private.auth_account_operational() TO service_role;

CREATE OR REPLACE FUNCTION private.current_active_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '2s'
AS $$
  SELECT profile.id
  FROM public.profiles profile
  LEFT JOIN public.user_active_profiles selection
    ON selection.user_id = auth.uid()
   AND selection.profile_id = profile.id
  WHERE auth.uid() IS NOT NULL
    AND private.auth_account_operational()
    AND profile.is_active = TRUE
    AND NOT (
      (profile.is_suspended = TRUE OR profile.suspended = TRUE)
      AND (profile.suspended_until IS NULL OR profile.suspended_until > now())
    )
    AND (
      profile.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.profile_members member
        WHERE member.profile_id = profile.id
          AND member.user_id = auth.uid()
          AND member.is_active = TRUE
      )
    )
  ORDER BY
    CASE
      WHEN selection.profile_id IS NOT NULL THEN 0
      WHEN profile.profile_type::TEXT = 'personal' THEN 1
      ELSE 2
    END,
    profile.created_at ASC,
    profile.id ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.auth_owns_usable_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '2s'
AS $$
  SELECT private.auth_account_operational()
    AND p_profile_id IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = p_profile_id
        AND profile.is_active = TRUE
        AND NOT (
          (profile.is_suspended = TRUE OR profile.suspended = TRUE)
          AND (profile.suspended_until IS NULL OR profile.suspended_until > now())
        )
        AND (
          profile.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.profile_members member
            WHERE member.profile_id = profile.id
              AND member.user_id = auth.uid()
              AND member.is_active = TRUE
          )
        )
    );
$$;

CREATE OR REPLACE FUNCTION private.auth_can_access_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '2s'
AS $$
  SELECT COALESCE(auth.role(), '') = 'service_role'
    OR (
      private.auth_account_operational()
      AND p_profile_id IS NOT NULL
      AND (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = p_profile_id
            AND (
              p.user_id = auth.uid()
              OR COALESCE(private.is_admin_from_roles(auth.uid()), FALSE)
            )
        )
        OR EXISTS (
          SELECT 1
          FROM public.profile_members pm
          WHERE pm.profile_id = p_profile_id
            AND pm.user_id = auth.uid()
            AND pm.is_active = TRUE
        )
      )
    );
$$;

CREATE OR REPLACE FUNCTION private.can_manage_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '2s'
AS $$
  SELECT private.auth_account_operational()
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = p_profile_id
          AND p.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.profile_members pm
        WHERE pm.profile_id = p_profile_id
          AND pm.user_id = auth.uid()
          AND pm.is_active = TRUE
          AND pm.role IN ('owner', 'admin')
      )
    );
$$;

CREATE OR REPLACE FUNCTION private.auth_participates_community_direct_thread(p_thread_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '2s'
AS $$
  SELECT private.auth_account_operational()
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.community_direct_thread_participants participant
      JOIN public.profiles profile ON profile.id = participant.profile_id
      WHERE participant.thread_id = p_thread_id
        AND profile.user_id = auth.uid()
        AND profile.is_active = TRUE
        AND NOT (
          (profile.is_suspended = TRUE OR profile.suspended = TRUE)
          AND (
            profile.suspended_until IS NULL
            OR profile.suspended_until > now()
          )
        )
    );
$$;

CREATE FUNCTION public.get_account_deletion_status_for_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_request public.account_deletion_requests%ROWTYPE;
  v_days INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_request
  FROM public.account_deletion_requests
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_days := GREATEST(
    0,
    CEIL(EXTRACT(EPOCH FROM (v_request.scheduled_purge_at - clock_timestamp())) / 86400.0)::INTEGER
  );

  RETURN jsonb_build_object(
    'requestId', v_request.id,
    'status', v_request.status,
    'requestedAt', v_request.requested_at,
    'scheduledPurgeAt', v_request.scheduled_purge_at,
    'daysRemaining', v_days,
    'exportRequested', v_request.export_requested
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_account_deletion_status_for_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_account_deletion_status_for_user(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_account_deletion_status_for_user(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_account_deletion_status_for_user(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.request_account_deletion_for_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_export_requested BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_request public.account_deletion_requests%ROWTYPE;
  v_request_exists BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_owned_profile_ids UUID[];
  v_days INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_request
  FROM public.account_deletion_requests
  WHERE user_id = p_user_id
  FOR UPDATE;
  v_request_exists := FOUND;

  IF v_request_exists AND v_request.status = 'scheduled' THEN
    UPDATE public.account_deletion_requests
    SET
      reason = LEFT(COALESCE(NULLIF(BTRIM(p_reason), ''), reason), 1000),
      export_requested = export_requested OR COALESCE(p_export_requested, FALSE),
      updated_at = v_now
    WHERE id = v_request.id
    RETURNING * INTO v_request;
  ELSE
    IF v_request_exists AND v_request.status IN ('processing', 'completed') THEN
      RAISE EXCEPTION 'deletion request cannot be restarted from status %', v_request.status
        USING ERRCODE = '55000';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.user_roles role
      WHERE role.user_id = p_user_id
        AND role.role_enum::TEXT IN ('admin', 'super_admin')
        AND role.is_active = TRUE
        AND role.revoked_at IS NULL
        AND (role.expires_at IS NULL OR role.expires_at > v_now)
    ) THEN
      RAISE EXCEPTION 'ACCOUNT_DELETION_ADMIN_REQUIRES_DPO' USING ERRCODE = '42501';
    END IF;

    SELECT COALESCE(array_agg(profile.id), ARRAY[]::UUID[])
    INTO v_owned_profile_ids
    FROM public.profiles profile
    WHERE profile.user_id = p_user_id;

    IF EXISTS (
      SELECT 1
      FROM public.businesses business
      JOIN public.profiles profile ON profile.id = business.profile_id
      WHERE profile.user_id = p_user_id
        AND business.status IN ('active', 'pending', 'suspended')
    ) THEN
      RAISE EXCEPTION 'ACCOUNT_DELETION_ACTIVE_BUSINESS' USING ERRCODE = '55000';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.ride_requests ride
      WHERE (
        ride.passenger_profile_id = ANY(v_owned_profile_ids)
        OR ride.driver_profile_id = ANY(v_owned_profile_ids)
      )
        AND ride.status NOT IN (
          'delivered', 'completed', 'cancelled_by_passenger',
          'cancelled_by_driver', 'expired', 'failed', 'cancelled'
        )
    ) THEN
      RAISE EXCEPTION 'ACCOUNT_DELETION_ACTIVE_RIDE' USING ERRCODE = '55000';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.orders order_row
      WHERE (
        order_row.customer_profile_id = ANY(v_owned_profile_ids)
        OR order_row.merchant_profile_id = ANY(v_owned_profile_ids)
        OR order_row.courier_profile_id = ANY(v_owned_profile_ids)
      )
        AND (
          order_row.logistics_status NOT IN ('delivered', 'canceled', 'failed')
          OR order_row.financial_status IN ('pending_payment', 'payout_pending', 'payout_failed')
        )
    ) THEN
      RAISE EXCEPTION 'ACCOUNT_DELETION_ACTIVE_ORDER' USING ERRCODE = '55000';
    END IF;

    IF v_request_exists THEN
      UPDATE public.account_deletion_requests
      SET
        status = 'scheduled',
        reason = LEFT(NULLIF(BTRIM(p_reason), ''), 1000),
        export_requested = COALESCE(p_export_requested, FALSE),
        requested_at = v_now,
        scheduled_purge_at = v_now + INTERVAL '30 days',
        cancelled_at = NULL,
        cancellation_reason = NULL,
        processing_started_at = NULL,
        completed_at = NULL,
        failure_code = NULL,
        profile_state_snapshot = '{}'::JSONB,
        role_state_snapshot = '{}'::JSONB,
        updated_at = v_now
      WHERE id = v_request.id
      RETURNING * INTO v_request;
    ELSE
      INSERT INTO public.account_deletion_requests (
        user_id,
        status,
        reason,
        export_requested,
        requested_at,
        scheduled_purge_at,
        created_at,
        updated_at
      ) VALUES (
        p_user_id,
        'scheduled',
        LEFT(NULLIF(BTRIM(p_reason), ''), 1000),
        COALESCE(p_export_requested, FALSE),
        v_now,
        v_now + INTERVAL '30 days',
        v_now,
        v_now
      )
      RETURNING * INTO v_request;
    END IF;
  END IF;

  v_days := GREATEST(
    0,
    CEIL(EXTRACT(EPOCH FROM (v_request.scheduled_purge_at - clock_timestamp())) / 86400.0)::INTEGER
  );

  RETURN jsonb_build_object(
    'requestId', v_request.id,
    'status', v_request.status,
    'requestedAt', v_request.requested_at,
    'scheduledPurgeAt', v_request.scheduled_purge_at,
    'daysRemaining', v_days,
    'daysUntilPurge', v_days,
    'recoveryPossibleUntil', v_request.scheduled_purge_at,
    'exportRequested', v_request.export_requested
  );
END;
$$;

REVOKE ALL ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) FROM anon;
REVOKE ALL ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) TO service_role;

DO $$
DECLARE
  v_helper_oid OID := to_regprocedure('private.auth_account_operational()');
  v_status_oid OID := to_regprocedure('public.get_account_deletion_status_for_user(uuid)');
  v_request_oid OID := to_regprocedure('public.request_account_deletion_for_user(uuid,text,boolean)');
BEGIN
  IF v_helper_oid IS NULL OR v_status_oid IS NULL OR v_request_oid IS NULL THEN
    RAISE EXCEPTION 'account deletion operational boundary object missing';
  END IF;

  IF has_function_privilege('anon', v_helper_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', v_helper_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'browser role can execute auth_account_operational directly';
  END IF;

  IF has_function_privilege('anon', v_status_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', v_status_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'browser role can execute deletion status authority';
  END IF;

  IF has_function_privilege('anon', v_request_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', v_request_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'browser role can execute deletion request authority';
  END IF;

  IF NOT has_function_privilege('service_role', v_status_oid, 'EXECUTE')
     OR NOT has_function_privilege('service_role', v_request_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role deletion authority grant missing';
  END IF;

  IF pg_get_functiondef(to_regprocedure('private.current_active_profile_id()'))
       NOT LIKE '%private.auth_account_operational()%'
     OR pg_get_functiondef(to_regprocedure('private.auth_owns_usable_profile(uuid)'))
       NOT LIKE '%private.auth_account_operational()%'
     OR pg_get_functiondef(to_regprocedure('private.auth_can_access_profile(uuid)'))
       NOT LIKE '%private.auth_account_operational()%'
     OR pg_get_functiondef(to_regprocedure('private.can_manage_profile(uuid)'))
       NOT LIKE '%private.auth_account_operational()%'
     OR pg_get_functiondef(to_regprocedure('private.auth_participates_community_direct_thread(uuid)'))
       NOT LIKE '%private.auth_account_operational()%'
  THEN
    RAISE EXCEPTION 'operational account helper is not wired into all required authorization choke points';
  END IF;
END;
$$;

COMMIT;
