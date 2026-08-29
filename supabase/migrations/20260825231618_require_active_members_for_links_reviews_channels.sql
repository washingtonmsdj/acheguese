-- Close remaining owner/admin authorization paths that ignored membership state.

DROP POLICY IF EXISTS "communication_channels_member_select" ON public.communication_channels;
CREATE POLICY "communication_channels_member_select"
ON public.communication_channels
FOR SELECT TO authenticated
USING (private.can_manage_profile(profile_id));

DROP POLICY IF EXISTS "Users can manage links of their profiles" ON public.profile_links;
CREATE POLICY "Users can manage links of their profiles"
ON public.profile_links
FOR ALL TO authenticated
USING (private.can_manage_profile(from_profile_id))
WITH CHECK (private.can_manage_profile(from_profile_id));

DROP POLICY IF EXISTS "Business can respond to reviews" ON public.reviews;
CREATE POLICY "Business can respond to reviews"
ON public.reviews
FOR UPDATE TO authenticated
USING (private.can_manage_profile(reviewed_profile_id))
WITH CHECK (private.can_manage_profile(reviewed_profile_id));

CREATE OR REPLACE FUNCTION public.validate_profile_link_same_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_from_user_id uuid;
  v_to_user_id uuid;
  v_current_user_id uuid;
BEGIN
  v_current_user_id := auth.uid();

  SELECT user_id INTO v_from_user_id
  FROM public.profiles
  WHERE id = NEW.from_profile_id;

  SELECT user_id INTO v_to_user_id
  FROM public.profiles
  WHERE id = NEW.to_profile_id;

  -- Structural ownership by the same auth account remains valid.
  IF v_from_user_id IS NOT NULL
     AND v_from_user_id = v_to_user_id THEN
    RETURN NEW;
  END IF;

  -- Delegated management requires an active owner/admin membership on BOTH
  -- profiles. A disabled membership must not keep link authority.
  IF EXISTS (
    SELECT 1
    FROM public.profile_members pm1
    WHERE pm1.profile_id = NEW.from_profile_id
      AND pm1.user_id = v_current_user_id
      AND pm1.is_active = TRUE
      AND pm1.role IN ('owner', 'admin')
  )
  AND EXISTS (
    SELECT 1
    FROM public.profile_members pm2
    WHERE pm2.profile_id = NEW.to_profile_id
      AND pm2.user_id = v_current_user_id
      AND pm2.is_active = TRUE
      AND pm2.role IN ('owner', 'admin')
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Profile links must be between profiles of the same account or managed by the same active owner/admin'
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.validate_profile_link_same_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_profile_link_same_account() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_profile_link_same_account() TO service_role;
