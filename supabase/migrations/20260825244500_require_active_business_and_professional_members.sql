-- Consolidate business/professional authorization around active memberships.
--
-- Several permissive policies treated the presence of an owner/admin/manager
-- row in profile_members as sufficient even after that membership was disabled.
-- Because permissive RLS policies OR together, every legacy path must be removed
-- for revocation to be effective.

CREATE OR REPLACE FUNCTION private.can_operate_business_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_profile_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = p_profile_id
          AND p.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.profile_members pm
        WHERE pm.profile_id = p_profile_id
          AND pm.user_id = auth.uid()
          AND pm.is_active = TRUE
          AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
      )
    );
$$;

REVOKE ALL ON FUNCTION private.can_operate_business_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_operate_business_profile(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION private.can_operate_business_profile(uuid) TO authenticated, service_role;

-- business_data: replace three overlapping mutation policies with one active
-- membership contract. Column-level grants continue to protect system-managed
-- fields independently of RLS.
DROP POLICY IF EXISTS "Managers can modify business data" ON public.business_data;
DROP POLICY IF EXISTS "Owners manage own business" ON public.business_data;
DROP POLICY IF EXISTS "Profile members manage business" ON public.business_data;

CREATE POLICY "Active business managers modify business data"
ON public.business_data
FOR ALL TO authenticated
USING (private.can_operate_business_profile(profile_id))
WITH CHECK (private.can_operate_business_profile(profile_id));

DROP POLICY IF EXISTS "Users can view business data" ON public.business_data;
CREATE POLICY "Active profile members view business data"
ON public.business_data
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = business_data.profile_id
      AND p.user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profile_members pm
    WHERE pm.profile_id = business_data.profile_id
      AND pm.user_id = (SELECT auth.uid())
      AND pm.is_active = TRUE
  )
);

-- professional_data: only structural owner or active delegated owner/admin may
-- mutate. Any active member may inspect the non-public version for their profile.
DROP POLICY IF EXISTS "Managers can modify professional data" ON public.professional_data;
DROP POLICY IF EXISTS "Owners manage own professional data" ON public.professional_data;
DROP POLICY IF EXISTS "prof_data_owner_update" ON public.professional_data;

CREATE POLICY "Active professional managers modify professional data"
ON public.professional_data
FOR ALL TO authenticated
USING (private.can_manage_profile(profile_id))
WITH CHECK (private.can_manage_profile(profile_id));

DROP POLICY IF EXISTS "Users can view professional data" ON public.professional_data;
CREATE POLICY "Active profile members view professional data"
ON public.professional_data
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = professional_data.profile_id
      AND p.user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profile_members pm
    WHERE pm.profile_id = professional_data.profile_id
      AND pm.user_id = (SELECT auth.uid())
      AND pm.is_active = TRUE
  )
);

REVOKE UPDATE ON TABLE public.professional_data FROM anon;
