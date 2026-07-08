BEGIN;

-- security-authority: public-rpc public.count_lost_found_posts_by_type
-- Public lost-and-found counters are derived from public RLS-visible posts.
ALTER FUNCTION public.count_lost_found_posts_by_type()
SECURITY INVOKER;

ALTER FUNCTION public.count_lost_found_posts_by_type()
SET search_path = public, pg_temp;

REVOKE ALL
ON FUNCTION public.count_lost_found_posts_by_type()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.count_lost_found_posts_by_type()
TO anon, authenticated;

COMMENT ON FUNCTION public.count_lost_found_posts_by_type() IS
  'Counts public lost-and-found posts by type using invoker permissions and public RLS.';

-- security-authority: public-rpc public.find_similar_lost_found_posts
-- Similarity search only compares posts visible through the caller's RLS scope.
CREATE OR REPLACE FUNCTION public.find_similar_lost_found_posts(
  p_post_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  titulo text,
  descricao text,
  categoria text,
  similarity_score numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH current_post AS (
    SELECT tipo, categoria
    FROM public.lost_found_posts
    WHERE lost_found_posts.id = p_post_id
  )
  SELECT
    p.id,
    p.titulo,
    p.descricao,
    p.categoria,
    (
      CASE WHEN p.categoria = cp.categoria THEN 0.5 ELSE 0 END +
      CASE WHEN p.tipo <> cp.tipo THEN 0.5 ELSE 0 END
    )::numeric AS similarity_score
  FROM public.lost_found_posts p
  CROSS JOIN current_post cp
  WHERE p.id <> p_post_id
    AND p.resolvido = false
    AND p.tipo <> cp.tipo
  ORDER BY similarity_score DESC, p.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 5), 1), 20);
$$;

REVOKE ALL
ON FUNCTION public.find_similar_lost_found_posts(uuid, integer)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.find_similar_lost_found_posts(uuid, integer)
TO anon, authenticated;

COMMENT ON FUNCTION public.find_similar_lost_found_posts(uuid, integer) IS
  'Finds similar public lost-and-found posts using invoker permissions, public RLS, and a bounded result limit.';

COMMIT;
