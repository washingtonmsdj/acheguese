-- Keep the private alpha closed at the database boundary. Public discovery may
-- remain available, but creating an Auth identity requires a server-issued
-- marker or a single-purpose invite for the normalized email address.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.alpha_access_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'consumed', 'revoked')),
  max_uses SMALLINT NOT NULL DEFAULT 1 CHECK (max_uses BETWEEN 1 AND 10),
  use_count SMALLINT NOT NULL DEFAULT 0 CHECK (use_count BETWEEN 0 AND max_uses),
  expires_at TIMESTAMPTZ NOT NULL,
  note TEXT NULL CHECK (note IS NULL OR char_length(note) <= 500),
  issued_by_user_id UUID NULL,
  last_consumed_by_user_id UUID NULL,
  last_consumed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    email_normalized = lower(btrim(email_normalized))
    AND char_length(email_normalized) BETWEEN 3 AND 254
    AND email_normalized ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

CREATE INDEX IF NOT EXISTS idx_alpha_access_invites_active_expiry
  ON private.alpha_access_invites (expires_at, email_normalized)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS private.alpha_access_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invite_id UUID NULL,
  action TEXT NOT NULL CHECK (action IN ('issued', 'consumed', 'revoked')),
  actor_user_id UUID NULL,
  subject_user_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE private.alpha_access_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.alpha_access_invites FORCE ROW LEVEL SECURITY;
ALTER TABLE private.alpha_access_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.alpha_access_audit_log FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.alpha_access_invites FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.alpha_access_audit_log FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE private.alpha_access_audit_log_id_seq
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.alpha_access_issue_invite(
  p_email TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT now() + interval '14 days',
  p_max_uses INTEGER DEFAULT 1,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, auth, pg_temp
AS $$
DECLARE
  v_email TEXT := lower(btrim(COALESCE(p_email, '')));
  v_invite_id UUID;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;
  IF char_length(v_email) NOT BETWEEN 3 AND 254
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'invalid_alpha_invite_email' USING ERRCODE = '22023';
  END IF;
  IF p_expires_at IS NULL
     OR p_expires_at <= now()
     OR p_expires_at > now() + interval '180 days' THEN
    RAISE EXCEPTION 'invalid_alpha_invite_expiry' USING ERRCODE = '22023';
  END IF;
  IF p_max_uses NOT BETWEEN 1 AND 10 THEN
    RAISE EXCEPTION 'invalid_alpha_invite_max_uses' USING ERRCODE = '22023';
  END IF;
  IF p_note IS NOT NULL AND char_length(p_note) > 500 THEN
    RAISE EXCEPTION 'invalid_alpha_invite_note' USING ERRCODE = '22023';
  END IF;

  INSERT INTO private.alpha_access_invites (
    email_normalized,
    status,
    max_uses,
    use_count,
    expires_at,
    note,
    issued_by_user_id,
    last_consumed_by_user_id,
    last_consumed_at
  )
  VALUES (
    v_email,
    'active',
    p_max_uses,
    0,
    p_expires_at,
    NULLIF(btrim(p_note), ''),
    auth.uid(),
    NULL,
    NULL
  )
  ON CONFLICT (email_normalized) DO UPDATE
  SET status = 'active',
      max_uses = EXCLUDED.max_uses,
      use_count = 0,
      expires_at = EXCLUDED.expires_at,
      note = EXCLUDED.note,
      issued_by_user_id = EXCLUDED.issued_by_user_id,
      last_consumed_by_user_id = NULL,
      last_consumed_at = NULL,
      updated_at = now()
  RETURNING id INTO v_invite_id;

  INSERT INTO private.alpha_access_audit_log (
    invite_id,
    action,
    actor_user_id
  )
  VALUES (v_invite_id, 'issued', auth.uid());

  RETURN v_invite_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.alpha_access_revoke_invite(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, auth, pg_temp
AS $$
DECLARE
  v_invite_id UUID;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;

  UPDATE private.alpha_access_invites
  SET status = 'revoked',
      updated_at = now()
  WHERE email_normalized = lower(btrim(COALESCE(p_email, '')))
    AND status <> 'revoked'
  RETURNING id INTO v_invite_id;

  IF v_invite_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO private.alpha_access_audit_log (
    invite_id,
    action,
    actor_user_id
  )
  VALUES (v_invite_id, 'revoked', auth.uid());

  RETURN TRUE;
END;
$$;

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
  -- raw_app_meta_data is server-controlled. Signup user_metadata is never
  -- trusted as an alpha bypass.
  IF COALESCE(NEW.raw_app_meta_data ->> 'private_alpha_access', '') = 'true' THEN
    RETURN NEW;
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

REVOKE ALL ON FUNCTION public.alpha_access_issue_invite(TEXT, TIMESTAMPTZ, INTEGER, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.alpha_access_revoke_invite(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alpha_access_issue_invite(TEXT, TIMESTAMPTZ, INTEGER, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.alpha_access_revoke_invite(TEXT)
  TO service_role;

REVOKE ALL ON FUNCTION private.enforce_private_alpha_access() FROM PUBLIC;

DROP TRIGGER IF EXISTS enforce_private_alpha_access_trigger ON auth.users;
CREATE TRIGGER enforce_private_alpha_access_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_private_alpha_access();

COMMENT ON TABLE private.alpha_access_invites IS
  'Private-alpha email admission records. Never expose this table to browser roles.';
COMMENT ON FUNCTION private.enforce_private_alpha_access() IS
  'Fails closed for Auth identity creation unless a server marker or consumable email invite is present.';

COMMIT;
