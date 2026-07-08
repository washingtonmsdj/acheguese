BEGIN;

-- Public gastronomy menu surfaces are read-only for anonymous users. Menu
-- management remains authenticated and RLS-owner scoped through the existing
-- policies and services.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE
  public.menus,
  public.menu_categories,
  public.menu_items,
  public.menu_promotions
FROM anon;

GRANT SELECT
ON TABLE
  public.menus,
  public.menu_categories,
  public.menu_items,
  public.menu_promotions
TO anon, authenticated;

-- security-authority: public-rpc public.get_featured_menu_items
-- The RPC only reads active menus, available categories, and available featured
-- items. These reads are already enforced by table RLS and do not require
-- SECURITY DEFINER.
ALTER FUNCTION public.get_featured_menu_items(uuid)
SECURITY INVOKER;

ALTER FUNCTION public.get_featured_menu_items(uuid)
SET search_path = public, pg_temp;

REVOKE ALL
ON FUNCTION public.get_featured_menu_items(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.get_featured_menu_items(uuid)
TO anon, authenticated;

COMMENT ON FUNCTION public.get_featured_menu_items(uuid) IS
  'Returns public featured menu items using invoker permissions and menu RLS.';

-- security-authority: public-rpc public.get_active_promotions
-- The RPC only reads active promotions. The public read predicate already
-- exists in the menu_promotions RLS policy.
ALTER FUNCTION public.get_active_promotions(uuid)
SECURITY INVOKER;

ALTER FUNCTION public.get_active_promotions(uuid)
SET search_path = public, pg_temp;

REVOKE ALL
ON FUNCTION public.get_active_promotions(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.get_active_promotions(uuid)
TO anon, authenticated;

COMMENT ON FUNCTION public.get_active_promotions(uuid) IS
  'Returns public active menu promotions using invoker permissions and promotion RLS.';

COMMIT;
