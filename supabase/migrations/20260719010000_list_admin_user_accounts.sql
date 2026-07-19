-- Paginate administrative user lists by account instead of by profile.
-- The broker receives only account identifiers and a total; Auth PII remains
-- inside the service-role Edge Function.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_list_user_account_contexts(
  p_page INTEGER DEFAULT 0,
  p_page_size INTEGER DEFAULT 20,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  total_count BIGINT,
  profiles JSONB,
  roles TEXT[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_search TEXT := NULLIF(lower(btrim(COALESCE(p_search, ''))), '');
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;
  IF p_page IS NULL OR p_page < 0 OR p_page > 10000 THEN
    RAISE EXCEPTION 'invalid_page' USING ERRCODE = '22023';
  END IF;
  IF p_page_size IS NULL OR p_page_size < 1 OR p_page_size > 100 THEN
    RAISE EXCEPTION 'invalid_page_size' USING ERRCODE = '22023';
  END IF;
  IF v_search IS NOT NULL AND char_length(v_search) > 64 THEN
    RAISE EXCEPTION 'search_too_long' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH candidate_accounts AS MATERIALIZED (
    SELECT account.id AS user_id, account.created_at
    FROM auth.users AS account
    WHERE EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.user_id = account.id
    )
      AND (
        v_search IS NULL
        OR strpos(lower(COALESCE(account.email, '')), v_search) > 0
        OR EXISTS (
          SELECT 1
          FROM public.profiles AS profile
          WHERE profile.user_id = account.id
            AND (
              strpos(lower(COALESCE(profile.username, '')), v_search) > 0
              OR strpos(lower(COALESCE(profile.name, '')), v_search) > 0
              OR strpos(lower(COALESCE(profile.display_name, '')), v_search) > 0
            )
        )
      )
  ),
  totals AS (
    SELECT count(*)::BIGINT AS total_count
    FROM candidate_accounts
  ),
  page_rows AS (
    SELECT candidate.user_id, candidate.created_at
    FROM candidate_accounts AS candidate
    ORDER BY candidate.created_at DESC NULLS LAST, candidate.user_id DESC
    LIMIT p_page_size
    OFFSET p_page * p_page_size
  )
  SELECT
    page_row.user_id,
    totals.total_count,
    CASE
      WHEN page_row.user_id IS NULL THEN '[]'::JSONB
      ELSE COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', profile.id,
            'profile_type', COALESCE(profile.profile_type, 'personal'),
            'name', COALESCE(
              NULLIF(profile.display_name, ''),
              NULLIF(profile.name, ''),
              NULLIF(profile.username, ''),
              'Usuario'
            ),
            'username', COALESCE(profile.username, ''),
            'avatar_url', profile.avatar_url,
            'public_city', COALESCE(public_profile.public_city, public_profile.city),
            'public_neighborhood', COALESCE(
              public_profile.public_neighborhood,
              public_profile.neighborhood
            ),
            'verified', profile.verified IS TRUE,
            'is_active', profile.is_active IS DISTINCT FROM FALSE,
            'is_suspended', profile.is_suspended IS TRUE,
            'suspended_until', profile.suspended_until,
            'suspension_reason', profile.suspension_reason,
            'reputation', COALESCE(profile.reputation, 0),
            'created_at', profile.created_at
          )
          ORDER BY profile.created_at DESC NULLS LAST, profile.id
        )
        FROM public.profiles AS profile
        LEFT JOIN public.public_profiles AS public_profile
          ON public_profile.id = profile.id
        WHERE profile.user_id = page_row.user_id
      ), '[]'::JSONB)
    END AS profiles,
    CASE
      WHEN page_row.user_id IS NULL THEN ARRAY[]::TEXT[]
      ELSE COALESCE((
        SELECT array_agg(role_record.role_enum::TEXT ORDER BY role_record.granted_at DESC)
        FROM public.user_roles AS role_record
        WHERE role_record.user_id = page_row.user_id
          AND role_record.revoked_at IS NULL
          AND role_record.role_enum IS NOT NULL
      ), ARRAY[]::TEXT[])
    END AS roles
  FROM totals
  LEFT JOIN page_rows AS page_row ON TRUE
  ORDER BY page_row.created_at DESC NULLS LAST, page_row.user_id DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_user_account_contexts(INTEGER, INTEGER, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_user_account_contexts(INTEGER, INTEGER, TEXT)
  TO service_role;

COMMIT;
