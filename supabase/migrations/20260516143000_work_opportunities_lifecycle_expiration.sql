-- ============================================================================
-- MIGRATION: Work opportunities lifecycle expiration
-- Date: 2026-05-16
--
-- Goal:
-- - Persist lifecycle expiration for quick/short opportunities
-- - Keep listing clean without relying only on client-side decay
-- ============================================================================

CREATE OR REPLACE FUNCTION public.work_opportunity_expiration_hours(
  p_type public.work_opportunity_type
)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_type
    WHEN 'quick_job' THEN 24
    WHEN 'freelance' THEN 72
    WHEN 'service_availability' THEN 96
    WHEN 'offering_work' THEN 168
    WHEN 'looking_for_work' THEN 336
    ELSE 72
  END;
$$;

COMMENT ON FUNCTION public.work_opportunity_expiration_hours(public.work_opportunity_type) IS
'Returns default expiration window in hours by work opportunity type.';

CREATE OR REPLACE FUNCTION public.expire_stale_work_opportunities(
  p_now timestamptz DEFAULT now()
)
RETURNS TABLE (
  expired_count integer,
  expired_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids uuid[] := '{}';
BEGIN
  WITH target AS (
    SELECT wo.id
    FROM public.work_opportunities wo
    WHERE wo.status = 'active'
      AND wo.published_at IS NOT NULL
      AND wo.published_at + make_interval(hours => public.work_opportunity_expiration_hours(wo.opportunity_type)) <= p_now
  ),
  updated AS (
    UPDATE public.work_opportunities wo
    SET
      status = 'expired',
      closed_at = COALESCE(wo.closed_at, p_now),
      updated_at = p_now
    FROM target t
    WHERE wo.id = t.id
    RETURNING wo.id
  )
  SELECT COALESCE(array_agg(id), '{}') INTO v_ids
  FROM updated;

  RETURN QUERY
  SELECT COALESCE(array_length(v_ids, 1), 0)::integer, v_ids;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_work_opportunities(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_work_opportunities(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_work_opportunities(timestamptz) TO service_role;

COMMENT ON FUNCTION public.expire_stale_work_opportunities(timestamptz) IS
'Expires stale active work opportunities according to type-specific lifecycle windows.';

NOTIFY pgrst, 'reload schema';
