-- ============================================================================
-- SaaS access-control hardening: pizzaria catalog RLS and public view invoker
-- ============================================================================
-- OWASP API1/BOLA: object IDs in SaaS tables must be protected server-side.
-- Supabase: public-schema tables exposed to the client need RLS, and views
-- granted to anon/authenticated should run as security_invoker where possible.

-- ============================================================================
-- 1) Pizzaria niche tables: enable RLS
-- ============================================================================

ALTER TABLE public.pizza_niche_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_doughs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizza_menu_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2) Tenant integrity for linked pizza menu item defaults
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_pizza_menu_item_business_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.menu_items mi
    JOIN public.menu_categories mc ON mc.id = mi.category_id
    JOIN public.menus m ON m.id = mc.menu_id
    WHERE mi.id = NEW.menu_item_id
      AND m.business_id = NEW.business_id
  ) THEN
    RAISE EXCEPTION 'pizza_menu_items.menu_item_id must belong to the same business';
  END IF;

  IF NEW.default_size_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.pizza_sizes ps
    WHERE ps.id = NEW.default_size_id
      AND ps.business_id = NEW.business_id
  ) THEN
    RAISE EXCEPTION 'pizza_menu_items.default_size_id must belong to the same business';
  END IF;

  IF NEW.default_edge_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.pizza_edges pe
    WHERE pe.id = NEW.default_edge_id
      AND pe.business_id = NEW.business_id
  ) THEN
    RAISE EXCEPTION 'pizza_menu_items.default_edge_id must belong to the same business';
  END IF;

  IF NEW.default_dough_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.pizza_doughs pd
    WHERE pd.id = NEW.default_dough_id
      AND pd.business_id = NEW.business_id
  ) THEN
    RAISE EXCEPTION 'pizza_menu_items.default_dough_id must belong to the same business';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_pizza_menu_item_business_consistency() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enforce_pizza_menu_item_business_consistency() TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_enforce_pizza_menu_item_business_consistency ON public.pizza_menu_items;
CREATE TRIGGER trg_enforce_pizza_menu_item_business_consistency
  BEFORE INSERT OR UPDATE OF business_id, menu_item_id, default_size_id, default_edge_id, default_dough_id
  ON public.pizza_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pizza_menu_item_business_consistency();

-- ============================================================================
-- 3) Public read policies for safe catalog data
-- ============================================================================

DROP POLICY IF EXISTS pizza_niche_configs_public_read ON public.pizza_niche_configs;
CREATE POLICY pizza_niche_configs_public_read
  ON public.pizza_niche_configs
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS pizza_sizes_public_read ON public.pizza_sizes;
CREATE POLICY pizza_sizes_public_read
  ON public.pizza_sizes
  FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

DROP POLICY IF EXISTS pizza_flavors_public_read ON public.pizza_flavors;
CREATE POLICY pizza_flavors_public_read
  ON public.pizza_flavors
  FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

DROP POLICY IF EXISTS pizza_edges_public_read ON public.pizza_edges;
CREATE POLICY pizza_edges_public_read
  ON public.pizza_edges
  FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

DROP POLICY IF EXISTS pizza_doughs_public_read ON public.pizza_doughs;
CREATE POLICY pizza_doughs_public_read
  ON public.pizza_doughs
  FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

DROP POLICY IF EXISTS pizza_menu_items_public_read ON public.pizza_menu_items;
CREATE POLICY pizza_menu_items_public_read
  ON public.pizza_menu_items
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.menu_items mi
      JOIN public.menu_categories mc ON mc.id = mi.category_id
      JOIN public.menus m ON m.id = mc.menu_id
      WHERE mi.id = pizza_menu_items.menu_item_id
        AND mi.is_available = true
        AND mc.is_available = true
        AND m.is_active = true
    )
  );

-- ============================================================================
-- 4) Owner/admin management policies
-- ============================================================================

DROP POLICY IF EXISTS pizza_niche_configs_owner_admin_all ON public.pizza_niche_configs;
CREATE POLICY pizza_niche_configs_owner_admin_all
  ON public.pizza_niche_configs
  FOR ALL
  TO authenticated
  USING (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_niche_configs.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_niche_configs.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_niche_configs.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_niche_configs.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS pizza_sizes_owner_admin_all ON public.pizza_sizes;
CREATE POLICY pizza_sizes_owner_admin_all
  ON public.pizza_sizes
  FOR ALL
  TO authenticated
  USING (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_sizes.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_sizes.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_sizes.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_sizes.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS pizza_flavors_owner_admin_all ON public.pizza_flavors;
CREATE POLICY pizza_flavors_owner_admin_all
  ON public.pizza_flavors
  FOR ALL
  TO authenticated
  USING (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_flavors.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_flavors.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_flavors.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_flavors.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS pizza_edges_owner_admin_all ON public.pizza_edges;
CREATE POLICY pizza_edges_owner_admin_all
  ON public.pizza_edges
  FOR ALL
  TO authenticated
  USING (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_edges.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_edges.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_edges.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_edges.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS pizza_doughs_owner_admin_all ON public.pizza_doughs;
CREATE POLICY pizza_doughs_owner_admin_all
  ON public.pizza_doughs
  FOR ALL
  TO authenticated
  USING (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_doughs.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_doughs.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_doughs.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_doughs.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

DROP POLICY IF EXISTS pizza_menu_items_owner_admin_all ON public.pizza_menu_items;
CREATE POLICY pizza_menu_items_owner_admin_all
  ON public.pizza_menu_items
  FOR ALL
  TO authenticated
  USING (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_menu_items.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_menu_items.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  )
  WITH CHECK (
    coalesce(public.is_admin_from_roles(auth.uid()), false)
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profiles p ON p.id = bd.profile_id
      WHERE bd.id = pizza_menu_items.business_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_data bd
      JOIN public.profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = pizza_menu_items.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager', 'moderator')
    )
  );

-- ============================================================================
-- 5) Public/authenticated views: make view execution respect caller RLS
-- ============================================================================

ALTER VIEW IF EXISTS public.addresses_public SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_profiles SET (security_invoker = true);
ALTER VIEW IF EXISTS public.analytics_kpis SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_business_search SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_professional_search SET (security_invoker = true);
ALTER VIEW IF EXISTS public.personal_social_profiles SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_professional_profiles SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_companies SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_organizations SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_work_opportunity_search SET (security_invoker = true);
ALTER VIEW IF EXISTS public.work_opportunity_match_candidates SET (security_invoker = true);
