-- Harden the existing Local Community membership lifecycle.
-- Private-community invitations remain outside the launch contract; this
-- migration secures current self-requests and manager transitions.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_community_memberships_user_requested
  ON public.community_memberships (user_id, requested_at DESC);

CREATE OR REPLACE FUNCTION private.enforce_community_membership_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_user_id UUID := auth.uid();
  v_actor_profile_id UUID;
  v_actor_role TEXT;
  v_is_platform_admin BOOLEAN := FALSE;
  v_is_privileged_backend BOOLEAN :=
    COALESCE(auth.role(), '') = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin');
  v_owner_count INTEGER;
  v_request_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF v_is_privileged_backend THEN
      RETURN OLD;
    END IF;

    v_is_platform_admin := COALESCE(
      private.is_admin_user(v_actor_user_id),
      FALSE
    );

    SELECT cm.profile_id, cm.role
    INTO v_actor_profile_id, v_actor_role
    FROM public.community_memberships cm
    WHERE cm.community_id = OLD.community_id
      AND cm.user_id = v_actor_user_id
      AND cm.status = 'active'
      AND cm.role IN ('owner', 'admin')
    ORDER BY CASE cm.role WHEN 'owner' THEN 0 ELSE 1 END, cm.created_at
    LIMIT 1;

    IF OLD.role = 'owner' THEN
      IF NOT v_is_platform_admin THEN
        RAISE EXCEPTION 'community_owner_cannot_be_deleted'
          USING ERRCODE = '42501';
      END IF;

      SELECT count(*)::INTEGER
      INTO v_owner_count
      FROM public.community_memberships cm
      WHERE cm.community_id = OLD.community_id
        AND cm.status = 'active'
        AND cm.role = 'owner';

      IF v_owner_count <= 1 THEN
        RAISE EXCEPTION 'community_must_keep_an_owner'
          USING ERRCODE = '23514';
      END IF;
    END IF;

    IF NOT v_is_platform_admin
       AND OLD.user_id <> v_actor_user_id
       AND v_actor_role IS NULL THEN
      RAISE EXCEPTION 'community_membership_delete_not_authorized'
        USING ERRCODE = '42501';
    END IF;

    IF NOT v_is_platform_admin
       AND v_actor_role = 'admin'
       AND OLD.role IN ('owner', 'admin') THEN
      RAISE EXCEPTION 'community_admin_cannot_delete_privileged_member'
        USING ERRCODE = '42501';
    END IF;

    RETURN OLD;
  END IF;

  IF NOT v_is_privileged_backend AND TG_OP = 'INSERT' THEN
    IF v_actor_user_id IS NULL THEN
      RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
    END IF;

    NEW.user_id := v_actor_user_id;
    NEW.role := 'member';
    NEW.status := 'pending';
    NEW.join_method := 'open';
    NEW.verified_by_residence := FALSE;
    NEW.invited_by_profile_id := NULL;
    NEW.approved_by_profile_id := NULL;
    NEW.approved_at := NULL;
    NEW.joined_at := NULL;
    NEW.last_seen_at := NULL;
    NEW.metadata := '{}'::jsonb;

    PERFORM pg_advisory_xact_lock(
      hashtextextended('community-membership-request:' || v_actor_user_id::TEXT, 0)
    );

    SELECT count(*)::INTEGER
    INTO v_request_count
    FROM public.community_social_audit_log audit
    WHERE audit.actor_user_id = v_actor_user_id
      AND audit.target_type = 'community_membership'
      AND audit.action = 'insert'
      AND audit.created_at >= now() - interval '1 day';

    IF v_request_count >= 10 THEN
      RAISE EXCEPTION 'community_membership_request_rate_limit_exceeded'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.profile_id
      AND p.user_id = NEW.user_id
      AND p.is_active = TRUE
      AND p.is_suspended = FALSE
      AND p.suspended = FALSE
      AND (p.suspended_until IS NULL OR p.suspended_until <= now())
  ) THEN
    RAISE EXCEPTION 'community_membership_profile_user_mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF jsonb_typeof(NEW.metadata) <> 'object'
     OR pg_column_size(NEW.metadata) > 8192 THEN
    RAISE EXCEPTION 'invalid_community_membership_metadata'
      USING ERRCODE = '22023';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.community_id IS DISTINCT FROM OLD.community_id
       OR NEW.profile_id IS DISTINCT FROM OLD.profile_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.requested_at IS DISTINCT FROM OLD.requested_at
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'community_membership_identity_fields_are_immutable'
        USING ERRCODE = '23514';
    END IF;

    IF NOT v_is_privileged_backend THEN
      v_is_platform_admin := COALESCE(
        private.is_admin_user(v_actor_user_id),
        FALSE
      );

      SELECT cm.profile_id, cm.role
      INTO v_actor_profile_id, v_actor_role
      FROM public.community_memberships cm
      WHERE cm.community_id = OLD.community_id
        AND cm.user_id = v_actor_user_id
        AND cm.status = 'active'
        AND cm.role IN ('owner', 'admin')
      ORDER BY CASE cm.role WHEN 'owner' THEN 0 ELSE 1 END, cm.created_at
      LIMIT 1;

      IF NOT v_is_platform_admin AND v_actor_role IS NULL THEN
        RAISE EXCEPTION 'community_membership_update_not_authorized'
          USING ERRCODE = '42501';
      END IF;

      IF NOT v_is_platform_admin
         AND OLD.user_id = v_actor_user_id
         AND (
           NEW.role IS DISTINCT FROM OLD.role
           OR NEW.status IS DISTINCT FROM OLD.status
         ) THEN
        RAISE EXCEPTION 'community_manager_cannot_change_own_membership'
          USING ERRCODE = '42501';
      END IF;

      IF NOT v_is_platform_admin
         AND (OLD.role = 'owner' OR NEW.role = 'owner') THEN
        RAISE EXCEPTION 'community_owner_transition_requires_backend'
          USING ERRCODE = '42501';
      END IF;

      IF NOT v_is_platform_admin
         AND v_actor_role = 'admin'
         AND (OLD.role IN ('owner', 'admin') OR NEW.role IN ('owner', 'admin')) THEN
        RAISE EXCEPTION 'community_admin_privilege_boundary'
          USING ERRCODE = '42501';
      END IF;

      IF NEW.join_method IS DISTINCT FROM OLD.join_method
         OR NEW.verified_by_residence IS DISTINCT FROM OLD.verified_by_residence
         OR NEW.invited_by_profile_id IS DISTINCT FROM OLD.invited_by_profile_id
         OR NEW.metadata IS DISTINCT FROM OLD.metadata
         OR NEW.last_seen_at IS DISTINCT FROM OLD.last_seen_at THEN
        RAISE EXCEPTION 'community_membership_managed_fields_are_immutable'
          USING ERRCODE = '42501';
      END IF;

      IF NEW.status = 'active' THEN
        NEW.approved_by_profile_id := v_actor_profile_id;
        NEW.approved_at := COALESCE(OLD.approved_at, now());
        NEW.joined_at := COALESCE(OLD.joined_at, now());
      ELSIF NEW.status = 'pending' THEN
        NEW.approved_by_profile_id := NULL;
        NEW.approved_at := NULL;
        NEW.joined_at := NULL;
      ELSE
        NEW.approved_by_profile_id := NULL;
        NEW.approved_at := NULL;
        NEW.joined_at := OLD.joined_at;
      END IF;
    END IF;
  END IF;

  IF NEW.status = 'active' AND NEW.joined_at IS NULL THEN
    NEW.joined_at := now();
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_community_membership_contract()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.enforce_community_membership_contract()
  TO service_role;

CREATE OR REPLACE FUNCTION private.audit_community_membership_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_new JSONB := CASE WHEN TG_OP = 'DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
  v_old JSONB := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
  v_community_id UUID := COALESCE(v_new->>'community_id', v_old->>'community_id')::UUID;
  v_actor_profile_id UUID;
  v_location_id UUID;
BEGIN
  SELECT cm.profile_id
  INTO v_actor_profile_id
  FROM public.community_memberships cm
  WHERE cm.community_id = v_community_id
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  ORDER BY CASE cm.role
    WHEN 'owner' THEN 0
    WHEN 'admin' THEN 1
    WHEN 'moderator' THEN 2
    ELSE 3
  END, cm.created_at
  LIMIT 1;

  v_actor_profile_id := COALESCE(
    v_actor_profile_id,
    private.current_active_profile_id()
  );

  SELECT CASE
    WHEN tc.territory_type IN ('district', 'neighborhood') THEN tc.territory_id
    ELSE tc.city_id
  END
  INTO v_location_id
  FROM public.territory_communities tc
  WHERE tc.id = v_community_id;

  INSERT INTO public.community_social_audit_log (
    actor_user_id,
    actor_profile_id,
    action,
    target_type,
    target_id,
    location_id,
    metadata
  ) VALUES (
    auth.uid(),
    v_actor_profile_id,
    lower(TG_OP),
    'community_membership',
    COALESCE(v_new->>'id', v_old->>'id')::UUID,
    v_location_id,
    jsonb_strip_nulls(jsonb_build_object(
      'community_id', v_community_id,
      'profile_id', COALESCE(v_new->>'profile_id', v_old->>'profile_id'),
      'role', v_new->>'role',
      'previous_role', v_old->>'role',
      'status', v_new->>'status',
      'previous_status', v_old->>'status'
    ))
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.audit_community_membership_change()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.audit_community_membership_change()
  TO service_role;

DROP TRIGGER IF EXISTS enforce_community_membership_contract
  ON public.community_memberships;
CREATE TRIGGER enforce_community_membership_contract
  BEFORE INSERT OR UPDATE OR DELETE ON public.community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_community_membership_contract();

DROP TRIGGER IF EXISTS trg_audit_community_membership_change
  ON public.community_memberships;
CREATE TRIGGER trg_audit_community_membership_change
  AFTER INSERT OR UPDATE OR DELETE ON public.community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION private.audit_community_membership_change();

COMMENT ON FUNCTION private.enforce_community_membership_contract() IS
  'Derives self-request identity, rate-limits requests, protects role transitions and preserves the community owner boundary.';
COMMENT ON FUNCTION private.audit_community_membership_change() IS
  'Appends content-free Local Community membership lifecycle evidence for future administration.';

COMMIT;
