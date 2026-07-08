BEGIN;

-- security-authority: public-rpc public.get_recent_gastronomy_activities
-- Public activity must be derived only from data that is already public through
-- RLS. Private saved-business and purchase signals are intentionally excluded
-- until they have an explicit public opt-in artifact and matching RLS model.
CREATE OR REPLACE FUNCTION public.get_recent_gastronomy_activities(
  p_geographic_path_pattern text DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  type text,
  user_name text,
  user_avatar text,
  business_id uuid,
  business_name text,
  business_slug text,
  action_label text,
  emoji text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);
  v_include_reviews boolean :=
    p_types IS NULL
    OR COALESCE(array_length(p_types, 1), 0) = 0
    OR 'review' = ANY(p_types);
BEGIN
  IF NOT v_include_reviews THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    'review'::text AS type,
    COALESCE(p.display_name, p.name, 'Usuario') AS user_name,
    p.avatar_url AS user_avatar,
    bd.id AS business_id,
    bd.business_name,
    bd.slug AS business_slug,
    ('avaliou com ' || r.rating::text || ' estrelas')::text AS action_label,
    'review'::text AS emoji,
    r.created_at
  FROM public.reviews r
  INNER JOIN public.profiles p
    ON p.id = r.reviewer_profile_id
  INNER JOIN public.business_data bd
    ON bd.profile_id = r.reviewed_profile_id
  INNER JOIN public.gastronomy_profiles gp
    ON gp.business_id = bd.id
  WHERE COALESCE(r.status, 'active') = 'active'
    AND r.review_type = 'business'
    AND bd.status = 'active'
    AND gp.status = 'active'
    AND (
      p_geographic_path_pattern IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.locations l
        WHERE l.id = bd.location_id
          AND l.geographic_path ~ p_geographic_path_pattern
      )
    )
  ORDER BY r.created_at DESC
  LIMIT v_limit;
END;
$$;

REVOKE ALL
ON FUNCTION public.get_recent_gastronomy_activities(text, integer, text[])
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.get_recent_gastronomy_activities(text, integer, text[])
TO anon, authenticated;

COMMENT ON FUNCTION public.get_recent_gastronomy_activities(text, integer, text[]) IS
  'Returns recent public gastronomy review activity using invoker permissions and public RLS.';

COMMIT;
