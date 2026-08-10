-- Remove indexes that are byte-for-byte equivalent to retained indexes.
-- Constraint-backed indexes and the canonical/observed index in each pair are
-- intentionally preserved.

BEGIN;
DROP INDEX IF EXISTS public.idx_ca_location_dedup;
DROP INDEX IF EXISTS public.idx_driver_locations_driver_profile_unique;
DROP INDEX IF EXISTS public.idx_education_lead_events_lead;
DROP INDEX IF EXISTS public.idx_education_leads_status_created;
DROP INDEX IF EXISTS public.idx_order_items_source_item_id;
DROP INDEX IF EXISTS public.idx_orders_courier_profile_id;
DROP INDEX IF EXISTS public.idx_orders_created_at_desc;
DROP INDEX IF EXISTS public.idx_orders_customer_profile_id;
DROP INDEX IF EXISTS public.idx_orders_merchant_profile_id;
DROP INDEX IF EXISTS public.idx_profile_favorites_new_favorited;
DROP INDEX IF EXISTS public.idx_profile_favorites_new_favoriting;
DROP INDEX IF EXISTS public.idx_profiles_personal_per_user;
DROP INDEX IF EXISTS public.idx_profiles_slug_base;
DROP INDEX IF EXISTS public.idx_service_areas_single_primary;
DROP INDEX IF EXISTS public.idx_tgm_location;
DROP INDEX IF EXISTS public.idx_tourist_points_point_gist;
DROP INDEX IF EXISTS public.idx_user_roles_user_id_base;
DROP INDEX IF EXISTS public.idx_user_subscriptions_status_base;
DROP INDEX IF EXISTS public.idx_user_subscriptions_user_id;
DROP INDEX IF EXISTS public.idx_user_subscriptions_user_id_base;
DROP INDEX IF EXISTS public.verification_profile_type_uidx;
COMMIT;
