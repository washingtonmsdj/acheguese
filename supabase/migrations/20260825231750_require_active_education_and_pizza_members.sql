-- Require active delegated memberships throughout Education and Pizza domains.

CREATE OR REPLACE FUNCTION private.can_manage_business_data_id(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT p_business_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = p_business_id
        AND (
          COALESCE(private.is_admin_from_roles(auth.uid()), FALSE)
          OR private.can_operate_business_profile(bd.profile_id)
        )
    );
$$;

REVOKE ALL ON FUNCTION private.can_manage_business_data_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_manage_business_data_id(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION private.can_manage_business_data_id(uuid) TO authenticated, service_role;

-- Education root profile is tied directly to profiles(id).
DROP POLICY IF EXISTS "education_profiles_owner_all" ON public.education_profiles;
CREATE POLICY "education_profiles_owner_all"
ON public.education_profiles
FOR ALL TO authenticated
USING (private.can_operate_business_profile(business_id))
WITH CHECK (private.can_operate_business_profile(business_id));

DROP POLICY IF EXISTS "education_programs_owner_all" ON public.education_programs;
CREATE POLICY "education_programs_owner_all"
ON public.education_programs
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.education_profiles ep
    WHERE ep.id = education_programs.education_profile_id
      AND private.can_operate_business_profile(ep.business_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.education_profiles ep
    WHERE ep.id = education_programs.education_profile_id
      AND private.can_operate_business_profile(ep.business_id)
  )
);

DROP POLICY IF EXISTS "education_events_owner_all" ON public.education_events;
CREATE POLICY "education_events_owner_all"
ON public.education_events
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.education_profiles ep
    WHERE ep.id = education_events.education_profile_id
      AND private.can_operate_business_profile(ep.business_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.education_profiles ep
    WHERE ep.id = education_events.education_profile_id
      AND private.can_operate_business_profile(ep.business_id)
  )
);

DROP POLICY IF EXISTS "education_leads_owner_all" ON public.education_leads;
CREATE POLICY "education_leads_owner_all"
ON public.education_leads
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.education_profiles ep
    WHERE ep.id = education_leads.education_profile_id
      AND private.can_operate_business_profile(ep.business_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.education_profiles ep
    WHERE ep.id = education_leads.education_profile_id
      AND private.can_operate_business_profile(ep.business_id)
  )
);

DROP POLICY IF EXISTS "education_lead_events_owner_all" ON public.education_lead_events;
CREATE POLICY "education_lead_events_owner_all"
ON public.education_lead_events
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.education_leads el
    JOIN public.education_profiles ep ON ep.id = el.education_profile_id
    WHERE el.id = education_lead_events.lead_id
      AND private.can_operate_business_profile(ep.business_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.education_leads el
    JOIN public.education_profiles ep ON ep.id = el.education_profile_id
    WHERE el.id = education_lead_events.lead_id
      AND private.can_operate_business_profile(ep.business_id)
  )
);

DROP POLICY IF EXISTS "allow_owner_read_analytics" ON public.education_analytics_events;
CREATE POLICY "allow_owner_read_analytics"
ON public.education_analytics_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.education_profiles ep
    WHERE ep.id = education_analytics_events.education_profile_id
      AND private.can_operate_business_profile(ep.business_id)
  )
);

DROP POLICY IF EXISTS "allow_owner_delete_analytics" ON public.education_analytics_events;
CREATE POLICY "allow_owner_delete_analytics"
ON public.education_analytics_events
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.education_profiles ep
    WHERE ep.id = education_analytics_events.education_profile_id
      AND private.can_operate_business_profile(ep.business_id)
  )
);

-- Preserve public SELECT policies on published education data and the explicit
-- anonymous analytics INSERT, but remove anonymous mutation authority inherited
-- only from the old owner-all policies.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.education_profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.education_programs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.education_events FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.education_leads FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.education_lead_events FROM anon;

-- Pizza tables all reference business_data(id). Keep platform-admin authority
-- and local business manager roles, now with active membership enforced.
DROP POLICY IF EXISTS "pizza_niche_configs_owner_admin_all" ON public.pizza_niche_configs;
CREATE POLICY "pizza_niche_configs_owner_admin_all" ON public.pizza_niche_configs
FOR ALL TO authenticated
USING (private.can_manage_business_data_id(business_id))
WITH CHECK (private.can_manage_business_data_id(business_id));

DROP POLICY IF EXISTS "pizza_sizes_owner_admin_all" ON public.pizza_sizes;
CREATE POLICY "pizza_sizes_owner_admin_all" ON public.pizza_sizes
FOR ALL TO authenticated
USING (private.can_manage_business_data_id(business_id))
WITH CHECK (private.can_manage_business_data_id(business_id));

DROP POLICY IF EXISTS "pizza_doughs_owner_admin_all" ON public.pizza_doughs;
CREATE POLICY "pizza_doughs_owner_admin_all" ON public.pizza_doughs
FOR ALL TO authenticated
USING (private.can_manage_business_data_id(business_id))
WITH CHECK (private.can_manage_business_data_id(business_id));

DROP POLICY IF EXISTS "pizza_edges_owner_admin_all" ON public.pizza_edges;
CREATE POLICY "pizza_edges_owner_admin_all" ON public.pizza_edges
FOR ALL TO authenticated
USING (private.can_manage_business_data_id(business_id))
WITH CHECK (private.can_manage_business_data_id(business_id));

DROP POLICY IF EXISTS "pizza_flavors_owner_admin_all" ON public.pizza_flavors;
CREATE POLICY "pizza_flavors_owner_admin_all" ON public.pizza_flavors
FOR ALL TO authenticated
USING (private.can_manage_business_data_id(business_id))
WITH CHECK (private.can_manage_business_data_id(business_id));

DROP POLICY IF EXISTS "pizza_menu_items_owner_admin_all" ON public.pizza_menu_items;
CREATE POLICY "pizza_menu_items_owner_admin_all" ON public.pizza_menu_items
FOR ALL TO authenticated
USING (private.can_manage_business_data_id(business_id))
WITH CHECK (private.can_manage_business_data_id(business_id));
