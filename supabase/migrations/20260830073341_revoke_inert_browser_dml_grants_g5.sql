DO $$
DECLARE
  relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
    'ai_image_generations',
    'billing_audit_log',
    'catalog_eligibility_rule',
    'catalog_entitlement_policy',
    'catalog_item',
    'commercial_catalog_version',
    'email_logs',
    'neighborhood_boundaries',
    'professional_slug_history',
    'push_subscriptions',
    'stripe_webhook_events',
    'tryon_generations'
  ] LOOP
    IF to_regclass('public.' || relation_name) IS NULL THEN
      RAISE EXCEPTION 'G5 inert grant cleanup blocked: public.% is missing', relation_name;
    END IF;
  END LOOP;
END
$$;

-- Anonymous callers cannot satisfy these self/admin policies and have no
-- intentional anonymous mutation contract.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.ai_image_generations FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.neighborhood_boundaries FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.push_subscriptions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.tryon_generations FROM anon;

-- These relations are server-owned for mutation. Browser roles retain only
-- the read privileges that their existing RLS policies intentionally allow.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.billing_audit_log FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.catalog_eligibility_rule FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.catalog_entitlement_policy FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.catalog_item FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.commercial_catalog_version FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.email_logs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.professional_slug_history FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.stripe_webhook_events FROM anon, authenticated;

DO $$
DECLARE
  relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
    'ai_image_generations',
    'billing_audit_log',
    'catalog_eligibility_rule',
    'catalog_entitlement_policy',
    'catalog_item',
    'commercial_catalog_version',
    'email_logs',
    'neighborhood_boundaries',
    'professional_slug_history',
    'push_subscriptions',
    'stripe_webhook_events',
    'tryon_generations'
  ] LOOP
    IF has_table_privilege('anon', 'public.' || relation_name, 'INSERT')
       OR has_table_privilege('anon', 'public.' || relation_name, 'UPDATE')
       OR has_table_privilege('anon', 'public.' || relation_name, 'DELETE') THEN
      RAISE EXCEPTION 'G5 inert grant cleanup failed: anon DML remains on public.%', relation_name;
    END IF;
  END LOOP;

  FOREACH relation_name IN ARRAY ARRAY[
    'billing_audit_log',
    'catalog_eligibility_rule',
    'catalog_entitlement_policy',
    'catalog_item',
    'commercial_catalog_version',
    'email_logs',
    'professional_slug_history',
    'stripe_webhook_events'
  ] LOOP
    IF has_table_privilege('authenticated', 'public.' || relation_name, 'INSERT')
       OR has_table_privilege('authenticated', 'public.' || relation_name, 'UPDATE')
       OR has_table_privilege('authenticated', 'public.' || relation_name, 'DELETE') THEN
      RAISE EXCEPTION 'G5 inert grant cleanup failed: authenticated DML remains on server-owned public.%', relation_name;
    END IF;
  END LOOP;
END
$$;
