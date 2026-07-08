-- ============================================================================
-- Harden Gastronomia profile column grants
-- ============================================================================
-- RLS limits rows, but broad table-level INSERT/UPDATE still let signed-in
-- owners mutate sensitive columns such as plan_tier and niche capabilities.
-- Keep browser writes limited to operational profile fields.
-- ============================================================================

REVOKE INSERT, UPDATE, DELETE ON TABLE public.gastronomy_profiles FROM authenticated;

GRANT INSERT (
  business_id,
  niche_key,
  cuisine_type,
  cuisine_subtypes,
  price_range,
  delivery_enabled,
  takeout_enabled,
  dine_in_enabled,
  delivery_fee,
  delivery_time_min,
  delivery_time_max,
  minimum_order,
  accepts_reservations,
  has_parking,
  has_wifi,
  has_accessibility,
  has_kids_area,
  has_live_music,
  seating_capacity,
  status,
  metadata
) ON TABLE public.gastronomy_profiles TO authenticated;

GRANT UPDATE (
  niche_key,
  cuisine_type,
  cuisine_subtypes,
  price_range,
  delivery_enabled,
  takeout_enabled,
  dine_in_enabled,
  delivery_fee,
  delivery_time_min,
  delivery_time_max,
  minimum_order,
  accepts_reservations,
  has_parking,
  has_wifi,
  has_accessibility,
  has_kids_area,
  has_live_music,
  seating_capacity,
  status,
  metadata,
  updated_at
) ON TABLE public.gastronomy_profiles TO authenticated;

GRANT SELECT ON TABLE public.gastronomy_profiles TO authenticated;
GRANT ALL ON TABLE public.gastronomy_profiles TO service_role;

NOTIFY pgrst, 'reload schema';
