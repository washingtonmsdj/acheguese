-- The Auth Admin API does not guarantee that requested app_metadata is present
-- in the initial auth.users BEFORE INSERT row. Require the same consumable
-- invite for every identity creation path, including service-role automation.

BEGIN;

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

REVOKE ALL ON FUNCTION private.enforce_private_alpha_access() FROM PUBLIC;

COMMENT ON FUNCTION private.enforce_private_alpha_access() IS
  'Fails closed for every Auth identity creation unless a consumable email invite is present.';

COMMIT;
