-- Reconcile the account-deletion authority with the current production schema.
--
-- The original 2026-08-21 deletion-authority chain was versioned but never
-- applied to production. Re-applying it now is unsafe because later migrations
-- hardened central profile authorization helpers that the old chain would
-- overwrite. This forward-only migration installs the reversible deletion
-- authority and global write hold without redefining those newer helpers.
--
-- No destructive purge is implemented here and no auth.users row is deleted.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.account_deletion_requests') IS NOT NULL THEN
    RAISE EXCEPTION 'account_deletion_requests already exists; reconcile migration requires review';
  END IF;

  IF to_regprocedure('public.request_account_deletion_for_user(uuid,text,boolean)') IS NOT NULL THEN
    RAISE EXCEPTION 'request_account_deletion_for_user already exists; reconcile migration requires review';
  END IF;

  IF to_regprocedure('public.get_account_deletion_status_for_user(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'get_account_deletion_status_for_user already exists; reconcile migration requires review';
  END IF;

  IF to_regprocedure('private.auth_account_operational()') IS NOT NULL
     OR to_regprocedure('private.guard_pending_deletion_write()') IS NOT NULL
     OR to_regprocedure('private.ensure_pending_deletion_write_guards()') IS NOT NULL THEN
    RAISE EXCEPTION 'account-deletion operational helpers already exist; reconcile migration requires review';
  END IF;
END;
$$;

CREATE TABLE public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled', 'processing', 'completed', 'failed')),
  reason TEXT,
  export_requested BOOLEAN NOT NULL DEFAULT FALSE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  scheduled_purge_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_code TEXT,
  profile_state_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  role_state_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT account_deletion_requests_schedule_order_chk CHECK (
    scheduled_purge_at >= requested_at
  )
);

CREATE INDEX account_deletion_requests_due_idx
  ON public.account_deletion_requests (scheduled_purge_at)
  WHERE status = 'scheduled';

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.account_deletion_requests FROM PUBLIC;
REVOKE ALL ON TABLE public.account_deletion_requests FROM anon;
REVOKE ALL ON TABLE public.account_deletion_requests FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_deletion_requests TO service_role;

COMMENT ON TABLE public.account_deletion_requests IS
  'Reversible account-deletion request authority. Browser roles have no direct access; service-role brokers only.';

CREATE FUNCTION private.auth_account_operational()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '2s'
AS $$
  SELECT COALESCE(current_setting('role', true), '') = 'service_role'
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

CREATE FUNCTION public.request_account_deletion_for_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_export_requested BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
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

  IF NOT EXISTS (SELECT 1 FROM auth.users user_row WHERE user_row.id = p_user_id) THEN
    RAISE EXCEPTION 'account deletion user not found' USING ERRCODE = '22023';
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
      FROM public.user_roles role_row
      WHERE role_row.user_id = p_user_id
        AND role_row.role_enum::TEXT IN ('admin', 'super_admin')
        AND role_row.is_active = TRUE
        AND role_row.revoked_at IS NULL
        AND (role_row.expires_at IS NULL OR role_row.expires_at > v_now)
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

CREATE OR REPLACE FUNCTION public.cancel_account_deletion_for_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_request public.account_deletion_requests%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_request
  FROM public.account_deletion_requests
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_request.status = 'cancelled' THEN
    RETURN TRUE;
  END IF;

  IF v_request.status <> 'scheduled'
     OR v_request.scheduled_purge_at <= clock_timestamp() THEN
    RETURN FALSE;
  END IF;

  UPDATE public.account_deletion_requests
  SET
    status = 'cancelled',
    cancelled_at = clock_timestamp(),
    cancellation_reason = LEFT(
      COALESCE(NULLIF(BTRIM(p_reason), ''), 'user_self_service'),
      500
    ),
    updated_at = clock_timestamp()
  WHERE id = v_request.id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.get_account_deletion_status_for_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_account_deletion_status_for_user(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_account_deletion_status_for_user(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_account_deletion_status_for_user(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) FROM anon;
REVOKE ALL ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) TO service_role;

REVOKE ALL ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT) TO service_role;

CREATE FUNCTION private.guard_pending_deletion_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '2s'
AS $$
DECLARE
  v_role TEXT := COALESCE(current_setting('role', true), '');
  v_user_id UUID := auth.uid();
BEGIN
  IF v_role <> 'authenticated' THEN
    RETURN NULL;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATED_USER_CONTEXT_MISSING'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.account_deletion_requests request
    WHERE request.user_id = v_user_id
      AND request.status IN ('scheduled', 'processing', 'failed', 'completed')
  ) THEN
    RAISE EXCEPTION 'ACCOUNT_PENDING_DELETION_READ_ONLY'
      USING ERRCODE = '42501';
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_pending_deletion_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_pending_deletion_write() FROM anon;
REVOKE ALL ON FUNCTION private.guard_pending_deletion_write() FROM authenticated;

CREATE FUNCTION private.ensure_pending_deletion_write_guards()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
SET statement_timeout = '30s'
AS $$
DECLARE
  v_table RECORD;
  v_created INTEGER := 0;
BEGIN
  FOR v_table IN
    SELECT c.oid, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend dependency
        JOIN pg_extension extension_row
          ON extension_row.oid = dependency.refobjid
        WHERE dependency.classid = 'pg_class'::regclass
          AND dependency.objid = c.oid
          AND dependency.deptype = 'e'
      )
    ORDER BY c.relname
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger trigger_row
      WHERE trigger_row.tgrelid = v_table.oid
        AND trigger_row.tgname = 'account_operational_write_guard'
        AND NOT trigger_row.tgisinternal
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER account_operational_write_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION private.guard_pending_deletion_write()',
        v_table.relname
      );
      v_created := v_created + 1;
    END IF;
  END LOOP;

  RETURN v_created;
END;
$$;

REVOKE ALL ON FUNCTION private.ensure_pending_deletion_write_guards() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.ensure_pending_deletion_write_guards() FROM anon;
REVOKE ALL ON FUNCTION private.ensure_pending_deletion_write_guards() FROM authenticated;

SELECT private.ensure_pending_deletion_write_guards();

DO $$
DECLARE
  v_request_table OID := to_regclass('public.account_deletion_requests');
  v_status_oid OID := to_regprocedure('public.get_account_deletion_status_for_user(uuid)');
  v_request_oid OID := to_regprocedure('public.request_account_deletion_for_user(uuid,text,boolean)');
  v_cancel_oid OID := to_regprocedure('public.cancel_account_deletion_for_user(uuid,text)');
  v_guard_oid OID := to_regprocedure('private.guard_pending_deletion_write()');
  v_expected_tables INTEGER;
  v_guarded_tables INTEGER;
BEGIN
  IF v_request_table IS NULL OR v_status_oid IS NULL OR v_request_oid IS NULL
     OR v_cancel_oid IS NULL OR v_guard_oid IS NULL THEN
    RAISE EXCEPTION 'account-deletion reconcile object missing after creation';
  END IF;

  IF has_table_privilege('anon', 'public.account_deletion_requests', 'SELECT')
     OR has_table_privilege('authenticated', 'public.account_deletion_requests', 'SELECT')
     OR has_table_privilege('authenticated', 'public.account_deletion_requests', 'INSERT')
     OR has_table_privilege('authenticated', 'public.account_deletion_requests', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.account_deletion_requests', 'DELETE') THEN
    RAISE EXCEPTION 'browser role has direct account_deletion_requests authority';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.account_deletion_requests', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.account_deletion_requests', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.account_deletion_requests', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.account_deletion_requests', 'DELETE') THEN
    RAISE EXCEPTION 'service_role account_deletion_requests CRUD grant missing';
  END IF;

  IF has_function_privilege('anon', v_status_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', v_status_oid, 'EXECUTE')
     OR has_function_privilege('anon', v_request_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', v_request_oid, 'EXECUTE')
     OR has_function_privilege('anon', v_cancel_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', v_cancel_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'browser role can execute account-deletion authority directly';
  END IF;

  IF NOT has_function_privilege('service_role', v_status_oid, 'EXECUTE')
     OR NOT has_function_privilege('service_role', v_request_oid, 'EXECUTE')
     OR NOT has_function_privilege('service_role', v_cancel_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role account-deletion authority execute grant missing';
  END IF;

  SELECT COUNT(*)
  INTO v_expected_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_depend dependency
      JOIN pg_extension extension_row
        ON extension_row.oid = dependency.refobjid
      WHERE dependency.classid = 'pg_class'::regclass
        AND dependency.objid = c.oid
        AND dependency.deptype = 'e'
    );

  SELECT COUNT(DISTINCT trigger_row.tgrelid)
  INTO v_guarded_tables
  FROM pg_trigger trigger_row
  JOIN pg_class c ON c.oid = trigger_row.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND trigger_row.tgname = 'account_operational_write_guard'
    AND NOT trigger_row.tgisinternal;

  IF v_guarded_tables <> v_expected_tables THEN
    RAISE EXCEPTION
      'pending deletion DML guard coverage mismatch: expected %, guarded %',
      v_expected_tables,
      v_guarded_tables;
  END IF;
END;
$$;

COMMENT ON FUNCTION private.auth_account_operational() IS
  'Returns whether the current authenticated account may perform application operations while account deletion is pending.';

COMMIT;
