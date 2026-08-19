DO $$
DECLARE
  v_rows_with_token bigint;
  v_dependency_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='ride_requests'
      AND column_name='share_token'
  ) THEN
    RAISE EXCEPTION 'public.ride_requests.share_token is already absent';
  END IF;

  SELECT count(*) FILTER (WHERE share_token IS NOT NULL)
  INTO v_rows_with_token
  FROM public.ride_requests;

  IF v_rows_with_token <> 0 THEN
    RAISE EXCEPTION 'ride_requests.share_token still has % populated rows; migrate before drop', v_rows_with_token;
  END IF;

  WITH col AS (
    SELECT attrelid, attnum
    FROM pg_attribute
    WHERE attrelid='public.ride_requests'::regclass
      AND attname='share_token'
      AND NOT attisdropped
  )
  SELECT count(*)
  INTO v_dependency_count
  FROM pg_depend d
  JOIN col c ON d.refobjid=c.attrelid AND d.refobjsubid=c.attnum
  WHERE pg_describe_object(d.classid, d.objid, d.objsubid) NOT IN (
    'constraint ride_requests_share_token_key on table ride_requests',
    'index idx_ride_requests_share_token'
  );

  IF v_dependency_count <> 0 THEN
    RAISE EXCEPTION 'ride_requests.share_token has % unexpected dependencies', v_dependency_count;
  END IF;
END
$$;

ALTER TABLE public.ride_requests
  DROP COLUMN share_token;

COMMENT ON TABLE public.ride_requests IS
  'Canonical ride request state. Public safety sharing is modeled separately by public.ride_shares; legacy ride_requests.share_token was removed.';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='ride_requests'
      AND column_name='share_token'
  ) THEN
    RAISE EXCEPTION 'ride_requests.share_token still exists after drop';
  END IF;

  IF to_regclass('public.ride_shares') IS NULL THEN
    RAISE EXCEPTION 'canonical public.ride_shares table is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='ride_shares'
      AND column_name='share_token'
  ) THEN
    RAISE EXCEPTION 'canonical ride_shares.share_token is missing';
  END IF;
END
$$;
