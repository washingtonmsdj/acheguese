-- LGPD account deletion authority foundation.
--
-- This migration intentionally does NOT purge user data and does NOT delete
-- auth.users. It establishes a reversible, service-role-only request state
-- that the Edge/Auth orchestration can use before the destructive purge phase
-- is implemented and certified.

BEGIN;

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
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

CREATE INDEX IF NOT EXISTS account_deletion_requests_due_idx
  ON public.account_deletion_requests (scheduled_purge_at)
  WHERE status = 'scheduled';

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.account_deletion_requests FROM PUBLIC;
REVOKE ALL ON TABLE public.account_deletion_requests FROM anon;
REVOKE ALL ON TABLE public.account_deletion_requests FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_deletion_requests TO service_role;

COMMENT ON TABLE public.account_deletion_requests IS
  'Authoritative reversible account-deletion request state. Browser roles have no direct access; service_role brokers only.';

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
  v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_request
  FROM public.account_deletion_requests
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_request.status = 'scheduled' THEN
      UPDATE public.account_deletion_requests
      SET
        reason = LEFT(COALESCE(NULLIF(BTRIM(p_reason), ''), reason), 1000),
        export_requested = export_requested OR COALESCE(p_export_requested, FALSE),
        updated_at = v_now
      WHERE id = v_request.id
      RETURNING * INTO v_request;
    ELSIF v_request.status IN ('cancelled', 'failed') THEN
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
      RAISE EXCEPTION 'deletion request cannot be restarted from status %', v_request.status
        USING ERRCODE = '55000';
    END IF;
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

  RETURN jsonb_build_object(
    'requestId', v_request.id,
    'status', v_request.status,
    'requestedAt', v_request.requested_at,
    'scheduledPurgeAt', v_request.scheduled_purge_at,
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

REVOKE ALL ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) FROM anon;
REVOKE ALL ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) TO service_role;

REVOKE ALL ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT) TO service_role;

DO $$
DECLARE
  v_privilege TEXT;
BEGIN
  IF to_regclass('public.account_deletion_requests') IS NULL THEN
    RAISE EXCEPTION 'account_deletion_requests was not created';
  END IF;

  FOREACH v_privilege IN ARRAY ARRAY[
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
  ] LOOP
    IF has_table_privilege('anon', 'public.account_deletion_requests', v_privilege) THEN
      RAISE EXCEPTION 'anon unexpectedly has % on account_deletion_requests', v_privilege;
    END IF;
    IF has_table_privilege('authenticated', 'public.account_deletion_requests', v_privilege) THEN
      RAISE EXCEPTION 'authenticated unexpectedly has % on account_deletion_requests', v_privilege;
    END IF;
  END LOOP;

  IF NOT has_table_privilege('service_role', 'public.account_deletion_requests', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.account_deletion_requests', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.account_deletion_requests', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.account_deletion_requests', 'DELETE') THEN
    RAISE EXCEPTION 'service_role CRUD grant missing on account_deletion_requests';
  END IF;

  IF has_function_privilege(
      'anon',
      'public.request_account_deletion_for_user(uuid,text,boolean)',
      'EXECUTE'
    ) OR has_function_privilege(
      'authenticated',
      'public.request_account_deletion_for_user(uuid,text,boolean)',
      'EXECUTE'
    ) THEN
    RAISE EXCEPTION 'browser role can execute request_account_deletion_for_user';
  END IF;

  IF has_function_privilege(
      'anon',
      'public.cancel_account_deletion_for_user(uuid,text)',
      'EXECUTE'
    ) OR has_function_privilege(
      'authenticated',
      'public.cancel_account_deletion_for_user(uuid,text)',
      'EXECUTE'
    ) THEN
    RAISE EXCEPTION 'browser role can execute cancel_account_deletion_for_user';
  END IF;

  IF NOT has_function_privilege(
      'service_role',
      'public.request_account_deletion_for_user(uuid,text,boolean)',
      'EXECUTE'
    ) OR NOT has_function_privilege(
      'service_role',
      'public.cancel_account_deletion_for_user(uuid,text)',
      'EXECUTE'
    ) THEN
    RAISE EXCEPTION 'service_role execute grant missing for deletion request authority';
  END IF;
END;
$$;

COMMIT;
