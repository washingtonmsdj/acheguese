-- Preserve the current public/owner read contract while preventing future
-- columns from becoming browser-readable automatically through table-level SELECT.

REVOKE SELECT ON TABLE public.business_operation_config
FROM anon, authenticated;

GRANT SELECT (
  id,
  business_id,
  accepts_pickup,
  accepts_delivery,
  accepts_dine_in,
  uses_own_delivery,
  uses_platform_delivery,
  preparation_time_min,
  advance_order_hours,
  is_temporarily_closed,
  temporarily_closed_reason,
  temporarily_closed_until,
  created_at,
  updated_at
) ON TABLE public.business_operation_config
TO anon, authenticated;

COMMENT ON TABLE public.business_operation_config IS
  'Business operation state with explicit browser SELECT columns. New columns are private by default until deliberately granted.';
