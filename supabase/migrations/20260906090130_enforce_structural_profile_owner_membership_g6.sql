-- G6 structural ownership invariant.
-- profile_members.owner mirrors profiles.user_id only. Normal membership CRUD
-- cannot create a second owner, demote the structural owner or remove its row.

CREATE OR REPLACE FUNCTION private.guard_profile_member_structural_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
DECLARE
  v_structural_owner uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT p.user_id
    INTO v_structural_owner
    FROM public.profiles p
    WHERE p.id = OLD.profile_id;

    IF OLD.user_id = v_structural_owner THEN
      RAISE EXCEPTION 'structural_owner_membership_cannot_be_deleted'
        USING ERRCODE = '23514';
    END IF;

    RETURN OLD;
  END IF;

  SELECT p.user_id
  INTO v_structural_owner
  FROM public.profiles p
  WHERE p.id = NEW.profile_id;

  IF v_structural_owner IS NULL THEN
    RAISE EXCEPTION 'profile_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF NEW.role = 'owner' AND NEW.user_id <> v_structural_owner THEN
    RAISE EXCEPTION 'owner_role_requires_structural_ownership_transfer'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.user_id = v_structural_owner THEN
    IF NEW.role <> 'owner' OR NOT COALESCE(NEW.is_active, false) THEN
      RAISE EXCEPTION 'structural_owner_membership_must_remain_active_owner'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_profile_member_structural_owner()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_profile_member_structural_owner
ON public.profile_members;

CREATE TRIGGER trg_guard_profile_member_structural_owner
BEFORE INSERT OR UPDATE OR DELETE
ON public.profile_members
FOR EACH ROW
EXECUTE FUNCTION private.guard_profile_member_structural_owner();

COMMENT ON FUNCTION private.guard_profile_member_structural_owner() IS
  'Keeps profile_members.owner as a mirror of profiles.user_id. Ownership changes must use the canonical transfer command.';
