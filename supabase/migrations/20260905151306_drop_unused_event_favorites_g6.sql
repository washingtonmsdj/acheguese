DO $pre$
DECLARE
  v_rows bigint;
  v_fk_count integer;
BEGIN
  IF to_regclass('public.event_favorites') IS NULL THEN
    RAISE EXCEPTION 'event_favorites expected before G6 retirement';
  END IF;

  EXECUTE 'SELECT count(*) FROM public.event_favorites' INTO v_rows;
  IF v_rows <> 0 THEN
    RAISE EXCEPTION 'event_favorites is not empty: % rows', v_rows;
  END IF;

  SELECT count(*)
    INTO v_fk_count
    FROM pg_constraint
   WHERE contype = 'f'
     AND confrelid = 'public.event_favorites'::regclass;

  IF v_fk_count <> 0 THEN
    RAISE EXCEPTION 'event_favorites has % external foreign keys', v_fk_count;
  END IF;
END
$pre$;

DROP TABLE public.event_favorites RESTRICT;
