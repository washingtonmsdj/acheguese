-- ============================================================================
-- Harden Gastronomia public views and engagement RPCs
-- ============================================================================
-- Keep public restaurant discovery readable, but remove broad inherited anon
-- write grants and prevent public RPC execution for user-bound actions.
-- ============================================================================

ALTER VIEW public.gastronomy_profiles_with_niche_info
  SET (security_invoker = true);
REVOKE ALL ON TABLE public.gastronomy_profiles_with_niche_info FROM PUBLIC;
REVOKE ALL ON TABLE public.gastronomy_profiles_with_niche_info FROM anon;
REVOKE ALL ON TABLE public.gastronomy_profiles_with_niche_info FROM authenticated;
GRANT SELECT ON TABLE public.gastronomy_profiles_with_niche_info TO anon;
GRANT SELECT ON TABLE public.gastronomy_profiles_with_niche_info TO authenticated;
GRANT ALL ON TABLE public.gastronomy_profiles_with_niche_info TO service_role;
REVOKE ALL ON TABLE public.gastronomy_profiles FROM anon;
REVOKE ALL ON TABLE public.gastronomy_profiles FROM authenticated;
GRANT SELECT ON TABLE public.gastronomy_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.gastronomy_profiles TO authenticated;
GRANT ALL ON TABLE public.gastronomy_profiles TO service_role;
REVOKE ALL ON TABLE public.user_favorite_businesses FROM anon;
REVOKE ALL ON TABLE public.user_favorite_businesses FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_favorite_businesses TO authenticated;
GRANT ALL ON TABLE public.user_favorite_businesses TO service_role;
REVOKE ALL ON TABLE public.user_recommended_businesses FROM anon;
REVOKE ALL ON TABLE public.user_recommended_businesses FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_recommended_businesses TO authenticated;
GRANT ALL ON TABLE public.user_recommended_businesses TO service_role;
REVOKE ALL ON TABLE public.review_helpfulness FROM anon;
REVOKE ALL ON TABLE public.review_helpfulness FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.review_helpfulness TO authenticated;
GRANT ALL ON TABLE public.review_helpfulness TO service_role;
ALTER FUNCTION public.is_business_favorited(UUID, UUID)
  SECURITY INVOKER;
ALTER FUNCTION public.is_business_favorited(UUID, UUID)
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.is_business_favorited(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_business_favorited(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_business_favorited(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_favorited(UUID, UUID) TO service_role;
ALTER FUNCTION public.toggle_business_favorite(UUID, UUID)
  SECURITY INVOKER;
ALTER FUNCTION public.toggle_business_favorite(UUID, UUID)
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.toggle_business_favorite(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_business_favorite(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.toggle_business_favorite(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_business_favorite(UUID, UUID) TO service_role;
ALTER FUNCTION public.is_business_recommended(UUID, UUID)
  SECURITY INVOKER;
ALTER FUNCTION public.is_business_recommended(UUID, UUID)
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.is_business_recommended(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_business_recommended(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_business_recommended(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_recommended(UUID, UUID) TO service_role;
ALTER FUNCTION public.toggle_business_recommendation(UUID, UUID)
  SECURITY INVOKER;
ALTER FUNCTION public.toggle_business_recommendation(UUID, UUID)
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.toggle_business_recommendation(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_business_recommendation(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.toggle_business_recommendation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_business_recommendation(UUID, UUID) TO service_role;
ALTER FUNCTION public.get_business_favorites_count(UUID)
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.get_business_favorites_count(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_business_favorites_count(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_business_favorites_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_favorites_count(UUID) TO service_role;
ALTER FUNCTION public.get_business_recommendations_count(UUID)
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.get_business_recommendations_count(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_business_recommendations_count(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_business_recommendations_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_recommendations_count(UUID) TO service_role;
ALTER FUNCTION public.sync_gastronomy_plan_tier()
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.sync_gastronomy_plan_tier() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_gastronomy_plan_tier() FROM anon;
REVOKE ALL ON FUNCTION public.sync_gastronomy_plan_tier() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_gastronomy_plan_tier() TO service_role;
ALTER FUNCTION public.update_review_helpfulness_counts()
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.update_review_helpfulness_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_review_helpfulness_counts() FROM anon;
REVOKE ALL ON FUNCTION public.update_review_helpfulness_counts() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_review_helpfulness_counts() TO service_role;
NOTIFY pgrst, 'reload schema';
