-- Remove the unused remote-only professional report aggregate.
-- Profile reports already belong to public.community_reports. The precondition
-- and RESTRICT make this migration fail closed if data or dependencies appear.

DO $$
DECLARE
  v_row_count BIGINT;
BEGIN
  IF to_regclass('public.professional_reports') IS NULL THEN
    RETURN;
  END IF;

  SELECT count(*) INTO v_row_count
  FROM public.professional_reports;

  IF v_row_count <> 0 THEN
    RAISE EXCEPTION 'professional_reports_not_empty:%', v_row_count
      USING ERRCODE = 'P0001';
  END IF;

  DROP TABLE public.professional_reports RESTRICT;
END;
$$;
