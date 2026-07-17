-- Keep profile-review deletion compatible with the canonical reviews status
-- constraint. Related reports, votes and MediaAsset links already cascade.

-- security-authority: public-rpc public.delete_profile_review
CREATE OR REPLACE FUNCTION public.delete_profile_review(
  p_review_id UUID,
  p_reviewer_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_actor_profile_id UUID;
  v_deleted_id UUID;
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT v_is_admin
     AND NOT private.auth_owns_active_profile(p_reviewer_profile_id) THEN
    RAISE EXCEPTION 'active_reviewer_profile_required'
      USING ERRCODE = '42501';
  END IF;

  v_actor_profile_id := CASE
    WHEN v_is_admin THEN private.current_active_profile_id()
    ELSE p_reviewer_profile_id
  END;
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_actor_profile_required'
      USING ERRCODE = '42501';
  END IF;

  PERFORM private.enforce_review_command_rate_limit(
    v_actor_profile_id,
    'delete_profile_review',
    20,
    interval '1 hour'
  );

  DELETE FROM public.reviews review
  WHERE review.id = p_review_id
    AND review.review_type::TEXT = 'professional'
    AND (
      v_is_admin
      OR review.reviewer_profile_id = p_reviewer_profile_id
    )
  RETURNING review.id INTO v_deleted_id;

  RETURN v_deleted_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_profile_review(UUID, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_profile_review(UUID, UUID)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.delete_profile_review(UUID, UUID) IS
  'Deletes an owned professional review, or an admin-selected review, through a server-owned command.';
