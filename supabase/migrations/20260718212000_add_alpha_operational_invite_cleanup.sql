-- Operational identities are ephemeral. Permit service-role test tooling to
-- remove only invites explicitly labelled as synthetic, without weakening
-- retention for real tester invitations.

BEGIN;

CREATE OR REPLACE FUNCTION public.alpha_access_delete_operational_invite(
  p_email TEXT
)
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

  SELECT invite.id INTO v_invite_id
  FROM private.alpha_access_invites invite
  WHERE invite.email_normalized = lower(btrim(COALESCE(p_email, '')))
    AND invite.note IN ('operational_test', 'security_probe', 'e2e_seed')
  FOR UPDATE;

  IF v_invite_id IS NULL THEN
    RETURN FALSE;
  END IF;

  DELETE FROM private.alpha_access_audit_log
  WHERE invite_id = v_invite_id;

  DELETE FROM private.alpha_access_invites
  WHERE id = v_invite_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.alpha_access_delete_operational_invite(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alpha_access_delete_operational_invite(TEXT)
  TO service_role;

COMMENT ON FUNCTION public.alpha_access_delete_operational_invite(TEXT) IS
  'Deletes only explicitly labelled synthetic alpha invites; service_role only.';

COMMIT;
