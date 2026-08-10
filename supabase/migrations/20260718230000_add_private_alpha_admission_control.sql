-- Give operators a fail-closed kill switch for new private-alpha identities.
-- Pausing admissions also revokes every outstanding invite atomically.

BEGIN;

CREATE TABLE IF NOT EXISTS private.alpha_access_control (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  admissions_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by_user_id UUID NULL
);

INSERT INTO private.alpha_access_control (singleton, admissions_enabled)
VALUES (TRUE, TRUE)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE private.alpha_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.alpha_access_control FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.alpha_access_control FROM PUBLIC, anon, authenticated;

ALTER TABLE private.alpha_access_audit_log
  DROP CONSTRAINT IF EXISTS alpha_access_audit_log_action_check;

ALTER TABLE private.alpha_access_audit_log
  ADD CONSTRAINT alpha_access_audit_log_action_check
  CHECK (
    action IN (
      'issued',
      'consumed',
      'revoked',
      'admissions_paused',
      'admissions_resumed'
    )
  );

CREATE OR REPLACE FUNCTION private.enforce_alpha_invite_issuance_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, auth, pg_temp
AS $$
BEGIN
  IF NEW.status = 'active'
     AND NOT COALESCE((
       SELECT control.admissions_enabled
       FROM private.alpha_access_control AS control
       WHERE control.singleton = TRUE
     ), FALSE) THEN
    RAISE EXCEPTION 'private_alpha_admissions_paused' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_alpha_invite_issuance_state_trigger
  ON private.alpha_access_invites;
CREATE TRIGGER enforce_alpha_invite_issuance_state_trigger
  BEFORE INSERT OR UPDATE OF status ON private.alpha_access_invites
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_alpha_invite_issuance_state();

CREATE OR REPLACE FUNCTION private.enforce_private_alpha_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, auth, pg_temp
AS $$
DECLARE
  v_email TEXT := lower(btrim(COALESCE(NEW.email, '')));
  v_invite_id UUID;
BEGIN
  IF NOT COALESCE((
    SELECT control.admissions_enabled
    FROM private.alpha_access_control AS control
    WHERE control.singleton = TRUE
  ), FALSE) THEN
    RAISE EXCEPTION 'private_alpha_admissions_paused' USING ERRCODE = '42501';
  END IF;

  UPDATE private.alpha_access_invites
  SET use_count = use_count + 1,
      status = CASE
        WHEN use_count + 1 >= max_uses THEN 'consumed'
        ELSE 'active'
      END,
      last_consumed_by_user_id = NEW.id,
      last_consumed_at = now(),
      updated_at = now()
  WHERE email_normalized = v_email
    AND status = 'active'
    AND expires_at > now()
    AND use_count < max_uses
  RETURNING id INTO v_invite_id;

  IF v_invite_id IS NULL THEN
    RAISE EXCEPTION 'private_alpha_invite_required' USING ERRCODE = '42501';
  END IF;

  NEW.raw_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::JSONB)
    || jsonb_build_object(
      'private_alpha_access', true,
      'private_alpha_invite_id', v_invite_id
    );

  INSERT INTO private.alpha_access_audit_log (
    invite_id,
    action,
    subject_user_id
  )
  VALUES (v_invite_id, 'consumed', NEW.id);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.alpha_access_set_admissions(p_enabled BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, auth, pg_temp
AS $$
DECLARE
  v_revoked_count INTEGER := 0;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;
  IF p_enabled IS NULL THEN
    RAISE EXCEPTION 'alpha_admission_state_required' USING ERRCODE = '22023';
  END IF;

  UPDATE private.alpha_access_control
  SET admissions_enabled = p_enabled,
      updated_at = now(),
      updated_by_user_id = auth.uid()
  WHERE singleton = TRUE;

  IF NOT p_enabled THEN
    UPDATE private.alpha_access_invites
    SET status = 'revoked',
        updated_at = now()
    WHERE status = 'active';
    GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
  END IF;

  INSERT INTO private.alpha_access_audit_log (action, actor_user_id)
  VALUES (
    CASE WHEN p_enabled THEN 'admissions_resumed' ELSE 'admissions_paused' END,
    auth.uid()
  );

  RETURN jsonb_build_object(
    'admissions_enabled', p_enabled,
    'revoked_invites', v_revoked_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.alpha_access_get_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, private, auth, pg_temp
AS $$
DECLARE
  v_enabled BOOLEAN;
  v_active_invites BIGINT;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;

  SELECT control.admissions_enabled
  INTO v_enabled
  FROM private.alpha_access_control AS control
  WHERE control.singleton = TRUE;

  SELECT count(*)
  INTO v_active_invites
  FROM private.alpha_access_invites AS invite
  WHERE invite.status = 'active'
    AND invite.expires_at > now()
    AND invite.use_count < invite.max_uses;

  RETURN jsonb_build_object(
    'admissions_enabled', COALESCE(v_enabled, FALSE),
    'active_invites', v_active_invites
  );
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_alpha_invite_issuance_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.enforce_private_alpha_access() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.alpha_access_set_admissions(BOOLEAN)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.alpha_access_get_status()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.alpha_access_set_admissions(BOOLEAN)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.alpha_access_get_status()
  TO service_role;

COMMENT ON TABLE private.alpha_access_control IS
  'Singleton fail-closed admission state for the private alpha.';
COMMENT ON FUNCTION public.alpha_access_set_admissions(BOOLEAN) IS
  'Service-role kill switch for new identities; pausing revokes active invites.';
COMMENT ON FUNCTION public.alpha_access_get_status() IS
  'Service-role alpha admission status without email or identity disclosure.';

COMMIT;
