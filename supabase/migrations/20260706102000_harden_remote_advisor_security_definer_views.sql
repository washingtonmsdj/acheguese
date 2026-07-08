-- Remote security advisor hardening: public views should execute with the
-- querying user's permissions/RLS instead of the view owner's permissions.

ALTER VIEW IF EXISTS public.active_user_consents SET (security_invoker = true);
ALTER VIEW IF EXISTS public.addresses_public SET (security_invoker = true);
ALTER VIEW IF EXISTS public.analytics_kpis SET (security_invoker = true);
ALTER VIEW IF EXISTS public.community_alerts_public SET (security_invoker = true);
ALTER VIEW IF EXISTS public.community_issues_public SET (security_invoker = true);
ALTER VIEW IF EXISTS public.driver_complete_profile SET (security_invoker = true);
ALTER VIEW IF EXISTS public.locations_coordinates_status SET (security_invoker = true);
ALTER VIEW IF EXISTS public.personal_social_profiles SET (security_invoker = true);
ALTER VIEW IF EXISTS public.pii_access_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_business_search SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_professional_search SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_profile_links SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_profiles SET (security_invoker = true);
ALTER VIEW IF EXISTS public.public_work_opportunity_search SET (security_invoker = true);
ALTER VIEW IF EXISTS public.territory_aliases SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_companies SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_organizations SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_professional_profiles SET (security_invoker = true);
ALTER VIEW IF EXISTS public.work_opportunity_match_candidates SET (security_invoker = true);
