-- Route privileged pricing mutations through the authenticated admin-pricing-rpc
-- Edge Function. The browser keeps JWT/admin checks at the Edge boundary; the
-- privileged database functions are callable only by service_role.

REVOKE ALL ON FUNCTION public.activate_pricing_rule(UUID, UUID)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.activate_pricing_rule(UUID, UUID)
TO service_role;

REVOKE ALL ON FUNCTION public.create_active_pricing_rule(
  TEXT,
  TEXT,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  BOOLEAN,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  JSONB,
  UUID
)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_active_pricing_rule(
  TEXT,
  TEXT,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  BOOLEAN,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  JSONB,
  UUID
)
TO service_role;

NOTIFY pgrst, 'reload schema';
