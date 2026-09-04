-- G6 Gastronomy: align profile/menu management with canonical Business authority.
--
-- Business management is not limited to profiles.user_id = auth.uid().
-- The canonical helper also permits active owner/admin memberships.
-- Public read policies and column-level grants remain unchanged.

BEGIN;

ALTER POLICY "Owners manage own gastronomy profile"
  ON public.gastronomy_profiles
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = gastronomy_profiles.business_id
        AND private.can_manage_profile(bd.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = gastronomy_profiles.business_id
        AND private.can_manage_profile(bd.profile_id)
    )
  );

ALTER POLICY "Owners manage own menus"
  ON public.menus
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = menus.business_id
        AND private.can_manage_profile(bd.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = menus.business_id
        AND private.can_manage_profile(bd.profile_id)
    )
  );

ALTER POLICY "Owners manage own categories"
  ON public.menu_categories
  USING (
    EXISTS (
      SELECT 1
      FROM public.menus m
      JOIN public.business_data bd ON bd.id = m.business_id
      WHERE m.id = menu_categories.menu_id
        AND private.can_manage_profile(bd.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.menus m
      JOIN public.business_data bd ON bd.id = m.business_id
      WHERE m.id = menu_categories.menu_id
        AND private.can_manage_profile(bd.profile_id)
    )
  );

ALTER POLICY "Owners manage own items"
  ON public.menu_items
  USING (
    EXISTS (
      SELECT 1
      FROM public.menu_categories mc
      JOIN public.menus m ON m.id = mc.menu_id
      JOIN public.business_data bd ON bd.id = m.business_id
      WHERE mc.id = menu_items.category_id
        AND private.can_manage_profile(bd.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.menu_categories mc
      JOIN public.menus m ON m.id = mc.menu_id
      JOIN public.business_data bd ON bd.id = m.business_id
      WHERE mc.id = menu_items.category_id
        AND private.can_manage_profile(bd.profile_id)
    )
  );

ALTER POLICY "Owners manage own variants"
  ON public.menu_item_variants
  USING (
    EXISTS (
      SELECT 1
      FROM public.menu_items mi
      JOIN public.menu_categories mc ON mc.id = mi.category_id
      JOIN public.menus m ON m.id = mc.menu_id
      JOIN public.business_data bd ON bd.id = m.business_id
      WHERE mi.id = menu_item_variants.item_id
        AND private.can_manage_profile(bd.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.menu_items mi
      JOIN public.menu_categories mc ON mc.id = mi.category_id
      JOIN public.menus m ON m.id = mc.menu_id
      JOIN public.business_data bd ON bd.id = m.business_id
      WHERE mi.id = menu_item_variants.item_id
        AND private.can_manage_profile(bd.profile_id)
    )
  );

ALTER POLICY "Owners manage own addons"
  ON public.menu_item_addons
  USING (
    EXISTS (
      SELECT 1
      FROM public.menu_items mi
      JOIN public.menu_categories mc ON mc.id = mi.category_id
      JOIN public.menus m ON m.id = mc.menu_id
      JOIN public.business_data bd ON bd.id = m.business_id
      WHERE mi.id = menu_item_addons.item_id
        AND private.can_manage_profile(bd.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.menu_items mi
      JOIN public.menu_categories mc ON mc.id = mi.category_id
      JOIN public.menus m ON m.id = mc.menu_id
      JOIN public.business_data bd ON bd.id = m.business_id
      WHERE mi.id = menu_item_addons.item_id
        AND private.can_manage_profile(bd.profile_id)
    )
  );

ALTER POLICY "Owners manage own availability"
  ON public.menu_item_availability
  USING (
    EXISTS (
      SELECT 1
      FROM public.menu_items mi
      JOIN public.menu_categories mc ON mc.id = mi.category_id
      JOIN public.menus m ON m.id = mc.menu_id
      JOIN public.business_data bd ON bd.id = m.business_id
      WHERE mi.id = menu_item_availability.item_id
        AND private.can_manage_profile(bd.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.menu_items mi
      JOIN public.menu_categories mc ON mc.id = mi.category_id
      JOIN public.menus m ON m.id = mc.menu_id
      JOIN public.business_data bd ON bd.id = m.business_id
      WHERE mi.id = menu_item_availability.item_id
        AND private.can_manage_profile(bd.profile_id)
    )
  );

ALTER POLICY "Owners manage own promotions"
  ON public.menu_promotions
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = menu_promotions.business_id
        AND private.can_manage_profile(bd.profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = menu_promotions.business_id
        AND private.can_manage_profile(bd.profile_id)
    )
  );

ALTER POLICY "Owners view own upgrade history"
  ON public.gastronomy_niche_upgrade_history
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.id = gastronomy_niche_upgrade_history.business_id
        AND private.can_manage_profile(bd.profile_id)
    )
  );

COMMIT;
