-- Unify Business management authorization around private.can_manage_profile.
-- profile_members.role is constrained to owner/admin/member. Only active
-- owner/admin memberships, plus the direct profiles.user_id owner, can manage.

CREATE OR REPLACE FUNCTION private.can_operate_business_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.can_manage_profile(p_profile_id);
$$;

REVOKE ALL ON FUNCTION private.can_operate_business_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.can_operate_business_profile(uuid)
  TO authenticated, service_role;

DROP POLICY IF EXISTS "Owners manage own gallery" ON public.business_gallery;
CREATE POLICY "Owners manage own gallery"
  ON public.business_gallery
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = business_gallery.business_id
        AND private.can_manage_profile(bd.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = business_gallery.business_id
        AND private.can_manage_profile(bd.profile_id)
    )
  );

DROP POLICY IF EXISTS "Owners manage own products" ON public.business_products;
CREATE POLICY "Owners manage own products"
  ON public.business_products
  FOR ALL
  TO authenticated
  USING (private.can_manage_profile(profile_id))
  WITH CHECK (private.can_manage_profile(profile_id));

DROP POLICY IF EXISTS "Owners manage own services" ON public.business_services;
CREATE POLICY "Owners manage own services"
  ON public.business_services
  FOR ALL
  TO authenticated
  USING (private.can_manage_profile(business_id))
  WITH CHECK (private.can_manage_profile(business_id));

DROP POLICY IF EXISTS "Owners manage own stats" ON public.business_stats;
CREATE POLICY "Owners manage own stats"
  ON public.business_stats
  FOR ALL
  TO authenticated
  USING (private.can_manage_profile(profile_id))
  WITH CHECK (private.can_manage_profile(profile_id));

DO $$
DECLARE
  invalid_role_count bigint;
BEGIN
  SELECT count(*)
    INTO invalid_role_count
  FROM public.profile_members
  WHERE role NOT IN ('owner', 'admin', 'member');

  IF invalid_role_count <> 0 THEN
    RAISE EXCEPTION 'profile_members contains roles outside canonical owner/admin/member contract';
  END IF;

  IF has_function_privilege('public', 'private.can_operate_business_profile(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'PUBLIC must not execute private.can_operate_business_profile(uuid)';
  END IF;

  IF NOT has_function_privilege('authenticated', 'private.can_operate_business_profile(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must execute caller-bound business authority helper';
  END IF;
END;
$$;

COMMENT ON FUNCTION private.can_operate_business_profile(uuid) IS
  'Compatibility authority helper for Business/Education RLS. Delegates to private.can_manage_profile: direct profile owner or active owner/admin membership only.';
