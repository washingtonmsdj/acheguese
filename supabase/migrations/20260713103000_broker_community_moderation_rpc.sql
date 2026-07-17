-- Keep the privileged implementation outside the PostgREST-exposed schema.
-- The public function is an invoker-only contract and contains no privileged
-- logic; authorization remains inside the private SECURITY DEFINER function.

ALTER FUNCTION public.apply_community_user_moderation_action(UUID, TEXT, TEXT)
  SET SCHEMA private;

REVOKE ALL ON FUNCTION private.apply_community_user_moderation_action(UUID, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.apply_community_user_moderation_action(UUID, TEXT, TEXT)
  TO authenticated;

CREATE FUNCTION public.apply_community_user_moderation_action(
  p_target_profile_id UUID,
  p_action TEXT,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.apply_community_user_moderation_action(
    p_target_profile_id,
    p_action,
    p_reason
  );
$$;

REVOKE ALL ON FUNCTION public.apply_community_user_moderation_action(UUID, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_community_user_moderation_action(UUID, TEXT, TEXT)
  TO authenticated;

COMMENT ON FUNCTION private.apply_community_user_moderation_action(UUID, TEXT, TEXT) IS
  'Private privileged implementation for atomic community user moderation.';
COMMENT ON FUNCTION public.apply_community_user_moderation_action(UUID, TEXT, TEXT) IS
  'Authenticated SECURITY INVOKER broker for the private moderation implementation.';
