-- Repair user-id/profile-id drift in business operational RLS.
--
-- business_data.profile_id references profiles(id); auth.uid() is auth.users(id).
-- Historical policies compared those UUID domains directly, denying legitimate
-- business managers while leaving needless anon mutation grants in place.
-- Use the canonical profile-management helper instead.

DROP POLICY IF EXISTS "Business owners can manage hours" ON public.business_hours;
CREATE POLICY "Business owners can manage hours"
ON public.business_hours
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_data bd
    WHERE bd.id = business_hours.business_id
      AND private.can_manage_profile(bd.profile_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_data bd
    WHERE bd.id = business_hours.business_id
      AND private.can_manage_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS "Business owners can manage exceptions" ON public.business_hours_exceptions;
CREATE POLICY "Business owners can manage exceptions"
ON public.business_hours_exceptions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_data bd
    WHERE bd.id = business_hours_exceptions.business_id
      AND private.can_manage_profile(bd.profile_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_data bd
    WHERE bd.id = business_hours_exceptions.business_id
      AND private.can_manage_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS "Business owners can manage operation config" ON public.business_operation_config;
CREATE POLICY "Business owners can manage operation config"
ON public.business_operation_config
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_data bd
    WHERE bd.id = business_operation_config.business_id
      AND private.can_manage_profile(bd.profile_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_data bd
    WHERE bd.id = business_operation_config.business_id
      AND private.can_manage_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS "Empresas podem gerenciar seus links" ON public.business_premium_links;
CREATE POLICY "Empresas podem gerenciar seus links"
ON public.business_premium_links
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_data bd
    WHERE bd.id = business_premium_links.business_id
      AND private.can_manage_profile(bd.profile_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_data bd
    WHERE bd.id = business_premium_links.business_id
      AND private.can_manage_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS "delivery_areas_owner_all" ON public.delivery_areas;
CREATE POLICY "delivery_areas_owner_all"
ON public.delivery_areas
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_data bd
    WHERE bd.id = delivery_areas.business_id
      AND private.can_manage_profile(bd.profile_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_data bd
    WHERE bd.id = delivery_areas.business_id
      AND private.can_manage_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS "delivery_area_polygons_owner_all" ON public.delivery_area_polygons;
CREATE POLICY "delivery_area_polygons_owner_all"
ON public.delivery_area_polygons
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.delivery_areas da
    JOIN public.business_data bd ON bd.id = da.business_id
    WHERE da.id = delivery_area_polygons.delivery_area_id
      AND private.can_manage_profile(bd.profile_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.delivery_areas da
    JOIN public.business_data bd ON bd.id = da.business_id
    WHERE da.id = delivery_area_polygons.delivery_area_id
      AND private.can_manage_profile(bd.profile_id)
  )
);

DROP POLICY IF EXISTS "delivery_neighborhoods_owner_all" ON public.delivery_neighborhoods;
CREATE POLICY "delivery_neighborhoods_owner_all"
ON public.delivery_neighborhoods
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.delivery_areas da
    JOIN public.business_data bd ON bd.id = da.business_id
    WHERE da.id = delivery_neighborhoods.delivery_area_id
      AND private.can_manage_profile(bd.profile_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.delivery_areas da
    JOIN public.business_data bd ON bd.id = da.business_id
    WHERE da.id = delivery_neighborhoods.delivery_area_id
      AND private.can_manage_profile(bd.profile_id)
  )
);

-- These configuration surfaces have public read policies where intended, but
-- no anonymous mutation use case.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.business_hours FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.business_hours_exceptions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.business_operation_config FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.business_premium_links FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.delivery_areas FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.delivery_area_polygons FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.delivery_neighborhoods FROM anon;
