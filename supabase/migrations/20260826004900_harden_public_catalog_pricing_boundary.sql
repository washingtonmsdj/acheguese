-- Keep the public commercial price surface small and make provider identifiers
-- server-only. Checkout resolves Stripe pricing with service_role in the Edge
-- Function; browser clients only need displayable commercial pricing.

DROP POLICY IF EXISTS "Anyone can view pricing policies"
ON public.catalog_pricing_policy;
DROP POLICY IF EXISTS "Service role can manage pricing"
ON public.catalog_pricing_policy;
DROP POLICY IF EXISTS catalog_pricing_policy_published_read
ON public.catalog_pricing_policy;

CREATE POLICY catalog_pricing_policy_published_read
ON public.catalog_pricing_policy
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.catalog_item item
    JOIN public.commercial_catalog_version version
      ON version.id = item.catalog_version_id
    WHERE item.id = catalog_pricing_policy.catalog_item_id
      AND version.status = 'published'::public.catalog_status
  )
);

-- Browser roles get only displayable commercial fields. In particular,
-- stripe_price_id, stripe_lookup_key and metadata remain unavailable through
-- the Data API even when the pricing row is public.
REVOKE ALL PRIVILEGES ON TABLE public.catalog_pricing_policy
FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  catalog_item_id,
  price_cents,
  setup_fee_cents,
  billing_period,
  trial_period_days,
  currency
)
ON public.catalog_pricing_policy
TO anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE public.catalog_pricing_policy TO service_role;

DO $verify$
DECLARE
  v_broad_public integer;
  v_hidden_column_leaks integer;
  v_browser_dml integer;
BEGIN
  SELECT count(*)
  INTO v_broad_public
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'catalog_pricing_policy'
    AND p.cmd = 'SELECT'
    AND (p.roles && ARRAY['anon', 'authenticated', 'public']::name[])
    AND lower(regexp_replace(COALESCE(p.qual, ''), '[()[:space:]]', '', 'g')) = 'true';

  IF v_broad_public <> 0 THEN
    RAISE EXCEPTION 'broad public catalog pricing policy remains';
  END IF;

  SELECT count(*)
  INTO v_hidden_column_leaks
  FROM (VALUES ('anon'), ('authenticated')) AS role_name(role_name)
  CROSS JOIN (VALUES
    ('stripe_price_id'),
    ('stripe_lookup_key'),
    ('metadata')
  ) AS hidden(column_name)
  WHERE has_column_privilege(
    role_name.role_name,
    'public.catalog_pricing_policy',
    hidden.column_name,
    'SELECT'
  );

  IF v_hidden_column_leaks <> 0 THEN
    RAISE EXCEPTION 'provider/private pricing columns still readable by browser roles: %',
      v_hidden_column_leaks;
  END IF;

  SELECT count(*)
  INTO v_browser_dml
  FROM (VALUES ('anon'), ('authenticated')) AS role_name(role_name)
  WHERE has_table_privilege(role_name.role_name, 'public.catalog_pricing_policy', 'INSERT')
     OR has_table_privilege(role_name.role_name, 'public.catalog_pricing_policy', 'UPDATE')
     OR has_table_privilege(role_name.role_name, 'public.catalog_pricing_policy', 'DELETE')
     OR has_table_privilege(role_name.role_name, 'public.catalog_pricing_policy', 'TRUNCATE');

  IF v_browser_dml <> 0 THEN
    RAISE EXCEPTION 'browser DML grants remain on catalog_pricing_policy';
  END IF;

  IF NOT has_column_privilege(
    'anon',
    'public.catalog_pricing_policy',
    'price_cents',
    'SELECT'
  ) OR NOT has_column_privilege(
    'authenticated',
    'public.catalog_pricing_policy',
    'price_cents',
    'SELECT'
  ) THEN
    RAISE EXCEPTION 'public price display column grant missing';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
