-- Security Authority: profile score, moderation state and structural identity
-- must never be writable by ordinary browser sessions.

CREATE OR REPLACE FUNCTION private.guard_profile_server_owned_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_actor_user_id UUID := auth.uid();
  v_actor_is_admin BOOLEAN := COALESCE(private.is_admin_user(v_actor_user_id), FALSE);
  v_score_changed BOOLEAN;
  v_moderation_changed BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF v_actor_user_id IS NOT NULL
      AND (
        NEW.pontos <> 0
        OR NEW.reputation <> 0
        OR COALESCE(NEW.reputation_score, 0) <> 0
        OR COALESCE(NEW.trust_score, 0) <> 0
        OR NEW.community_reputation_score <> 0
      ) THEN
      RAISE EXCEPTION 'profile_score_is_server_owned'
        USING ERRCODE = '42501';
    END IF;

    IF v_actor_user_id IS NOT NULL
      AND NOT v_actor_is_admin
      AND (
        NEW.is_suspended
        OR NEW.suspended
        OR NEW.suspended_at IS NOT NULL
        OR NEW.suspended_until IS NOT NULL
        OR NEW.suspension_reason IS NOT NULL
        OR NEW.verified
        OR NEW.verified_at IS NOT NULL
      ) THEN
      RAISE EXCEPTION 'profile_moderation_state_is_admin_owned'
        USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  IF v_actor_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.profile_type IS DISTINCT FROM OLD.profile_type THEN
    RAISE EXCEPTION 'profile_structural_identity_is_immutable'
      USING ERRCODE = '42501';
  END IF;

  v_score_changed :=
    NEW.pontos IS DISTINCT FROM OLD.pontos
    OR NEW.reputation IS DISTINCT FROM OLD.reputation
    OR NEW.reputation_score IS DISTINCT FROM OLD.reputation_score
    OR NEW.trust_score IS DISTINCT FROM OLD.trust_score
    OR NEW.community_reputation_score IS DISTINCT FROM OLD.community_reputation_score;

  IF v_score_changed THEN
    RAISE EXCEPTION 'profile_score_is_server_owned'
      USING ERRCODE = '42501';
  END IF;

  v_moderation_changed :=
    NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
    OR NEW.suspended IS DISTINCT FROM OLD.suspended
    OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
    OR NEW.suspended_until IS DISTINCT FROM OLD.suspended_until
    OR NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason
    OR NEW.verified IS DISTINCT FROM OLD.verified
    OR NEW.verified_at IS DISTINCT FROM OLD.verified_at;

  IF v_moderation_changed AND NOT v_actor_is_admin THEN
    RAISE EXCEPTION 'profile_moderation_state_is_admin_owned'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_profile_server_owned_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_profile_server_owned_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_server_owned_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_profile_server_owned_fields();

COMMENT ON FUNCTION private.guard_profile_server_owned_fields() IS
  'security-authority: prevents browser-controlled profile scores, moderation state and structural identity changes.';
