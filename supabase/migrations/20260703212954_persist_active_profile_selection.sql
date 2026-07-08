-- ============================================================================
-- Persist active profile selection
-- ============================================================================
-- The frontend depends on get_active_profile/switch_active_profile to keep the
-- business profile selected while merchants configure and operate modules such
-- as Gastronomia. These RPCs existed in generated types/live environments but
-- were missing from local migrations, and the observed live behavior could
-- acknowledge a switch while resolving the personal profile again.
--
-- This migration makes the contract canonical and keeps the session profile as
-- an authenticated user preference, not as a public Data API table.
-- ============================================================================

ALTER TABLE public.profile_members
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
CREATE TABLE IF NOT EXISTS public.user_active_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_active_profiles_profile_id
  ON public.user_active_profiles(profile_id);
DROP TRIGGER IF EXISTS update_user_active_profiles_updated_at
  ON public.user_active_profiles;
CREATE TRIGGER update_user_active_profiles_updated_at
  BEFORE UPDATE ON public.user_active_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.user_active_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_active_profiles FROM PUBLIC;
REVOKE ALL ON TABLE public.user_active_profiles FROM anon;
REVOKE ALL ON TABLE public.user_active_profiles FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_active_profiles TO service_role;
CREATE OR REPLACE FUNCTION public.switch_active_profile(
  p_user_id UUID,
  p_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_is_service_role BOOLEAN := coalesce(auth.role(), '') = 'service_role';
  v_target_user_id UUID := coalesce(p_user_id, v_auth_user_id);
  v_can_use_profile BOOLEAN := false;
BEGIN
  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated user is required to switch active profile'
      USING ERRCODE = '42501';
  END IF;

  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile id is required to switch active profile'
      USING ERRCODE = '22023';
  END IF;

  IF NOT v_is_service_role AND v_auth_user_id IS DISTINCT FROM v_target_user_id THEN
    RAISE EXCEPTION 'Cannot switch active profile for another user'
      USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.is_active = true
      AND p.is_suspended = false
      AND (
        p.user_id = v_target_user_id
        OR EXISTS (
          SELECT 1
          FROM public.profile_members pm
          WHERE pm.profile_id = p.id
            AND pm.user_id = v_target_user_id
            AND pm.is_active = true
        )
      )
  )
  INTO v_can_use_profile;

  IF NOT v_can_use_profile THEN
    RAISE EXCEPTION 'User cannot use the requested active profile'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.user_active_profiles (user_id, profile_id)
  VALUES (v_target_user_id, p_profile_id)
  ON CONFLICT (user_id)
  DO UPDATE SET
    profile_id = EXCLUDED.profile_id,
    updated_at = NOW();

  RETURN true;
END;
$$;
CREATE OR REPLACE FUNCTION public.get_active_profile(
  p_user_id UUID DEFAULT NULL
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_is_service_role BOOLEAN := coalesce(auth.role(), '') = 'service_role';
  v_target_user_id UUID := coalesce(p_user_id, v_auth_user_id);
BEGIN
  IF v_target_user_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT v_is_service_role AND v_auth_user_id IS DISTINCT FROM v_target_user_id THEN
    RAISE EXCEPTION 'Cannot resolve active profile for another user'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  LEFT JOIN public.user_active_profiles uap
    ON uap.user_id = v_target_user_id
   AND uap.profile_id = p.id
  WHERE p.is_active = true
    AND p.is_suspended = false
    AND (
      p.user_id = v_target_user_id
      OR EXISTS (
        SELECT 1
        FROM public.profile_members pm
        WHERE pm.profile_id = p.id
          AND pm.user_id = v_target_user_id
          AND pm.is_active = true
      )
    )
  ORDER BY
    CASE
      WHEN uap.profile_id IS NOT NULL THEN 0
      WHEN p.profile_type = 'personal' THEN 1
      ELSE 2
    END,
    p.created_at ASC
  LIMIT 1;
END;
$$;
REVOKE ALL ON FUNCTION public.switch_active_profile(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.switch_active_profile(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.switch_active_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.switch_active_profile(UUID, UUID) TO service_role;
REVOKE ALL ON FUNCTION public.get_active_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_active_profile(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_active_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_profile(UUID) TO service_role;
COMMENT ON TABLE public.user_active_profiles IS
  'Per-user active profile preference used by multi-profile sessions. Access is through RPCs only.';
COMMENT ON FUNCTION public.switch_active_profile(UUID, UUID) IS
  'Persists the active profile for the authenticated user after verifying owner/member access.';
COMMENT ON FUNCTION public.get_active_profile(UUID) IS
  'Returns the persisted active profile for a user, falling back to personal then oldest accessible profile.';
