-- Align catalog eligibility/entitlement with the already-hardened pricing
-- boundary. Eligibility is server-owned. Public entitlement reads are limited
-- to published catalog items and explicit display/runtime columns.

DROP POLICY IF EXISTS "Anyone can view eligibility rules"
ON public.catalog_eligibility_rule;

REVOKE ALL PRIVILEGES ON TABLE public.catalog_eligibility_rule
FROM PUBLIC, anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE public.catalog_eligibility_rule
TO service_role;

DROP POLICY IF EXISTS "Anyone can view entitlement policies"
ON public.catalog_entitlement_policy;

DROP POLICY IF EXISTS catalog_entitlement_policy_published_read
ON public.catalog_entitlement_policy;

CREATE POLICY catalog_entitlement_policy_published_read
ON public.catalog_entitlement_policy
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.catalog_item item
    JOIN public.commercial_catalog_version version
      ON version.id = item.catalog_version_id
    WHERE item.id = catalog_entitlement_policy.catalog_item_id
      AND version.status = 'published'::public.catalog_status
  )
);

REVOKE ALL PRIVILEGES ON TABLE public.catalog_entitlement_policy
FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  catalog_item_id,
  can_use_premium_public_page,
  can_use_short_premium_link,
  can_use_custom_qr_code,
  can_use_advanced_menu,
  can_receive_internal_orders,
  can_use_motoboy_network,
  can_use_promotions,
  can_use_basic_analytics,
  can_use_advanced_analytics,
  max_menu_items,
  max_promotions,
  max_images,
  max_categories,
  max_orders_per_day,
  additional_entitlements
)
ON public.catalog_entitlement_policy
TO anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE public.catalog_entitlement_policy
TO service_role;

COMMENT ON TABLE public.catalog_eligibility_rule IS
  'Server-owned commercial eligibility rules. Browser reads are retired; checkout/server authorities evaluate eligibility.';

COMMENT ON TABLE public.catalog_entitlement_policy IS
  'Published commercial entitlement projection. Browser reads are limited to explicit columns and published catalog items.';

DO $verify$
DECLARE
  v_eligibility_browser_select integer;
  v_broad_entitlement integer;
  v_entitlement_hidden_leaks integer;
BEGIN
  SELECT count(*)
  INTO v_eligibility_browser_select
  FROM (VALUES ('anon'), ('authenticated')) AS role_name(role_name)
  WHERE has_table_privilege(
    role_name.role_name,
    'public.catalog_eligibility_rule',
    'SELECT'
  )
  OR has_any_column_privilege(
    role_name.role_name,
    'public.catalog_eligibility_rule',
    'SELECT'
  );

  IF v_eligibility_browser_select <> 0 THEN
    RAISE EXCEPTION 'browser eligibility read authority remains';
  END IF;

  SELECT count(*)
  INTO v_broad_entitlement
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'catalog_entitlement_policy'
    AND p.cmd = 'SELECT'
    AND (p.roles && ARRAY['anon', 'authenticated', 'public']::name[])
    AND lower(regexp_replace(COALESCE(p.qual, ''), '[()[:space:]]', '', 'g')) = 'true';

  IF v_broad_entitlement <> 0 THEN
    RAISE EXCEPTION 'broad public catalog entitlement policy remains';
  END IF;

  SELECT count(*)
  INTO v_entitlement_hidden_leaks
  FROM (VALUES ('anon'), ('authenticated')) AS role_name(role_name)
  CROSS JOIN (VALUES
    ('created_at'),
    ('updated_at')
  ) AS hidden(column_name)
  WHERE has_column_privilege(
    role_name.role_name,
    'public.catalog_entitlement_policy',
    hidden.column_name,
    'SELECT'
  );

  IF v_entitlement_hidden_leaks <> 0 THEN
    RAISE EXCEPTION 'non-contract entitlement columns remain browser-readable: %',
      v_entitlement_hidden_leaks;
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
