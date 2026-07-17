-- Transactional proof for Business Favorites commands. All changes roll back.

BEGIN;

CREATE TEMP TABLE business_favorite_probe_fixture ON COMMIT DROP AS
SELECT
  account.id AS user_id,
  business.id AS business_id
FROM auth.users AS account
CROSS JOIN LATERAL (
  SELECT candidate.id
  FROM public.business_data AS candidate
  WHERE candidate.status = 'active'
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_favorite_businesses AS favorite
      WHERE favorite.user_id = account.id
        AND favorite.business_id = candidate.id
    )
  ORDER BY candidate.created_at, candidate.id
  LIMIT 1
) AS business
ORDER BY account.created_at, account.id
LIMIT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM business_favorite_probe_fixture) THEN
    RAISE EXCEPTION 'business_favorite_probe_fixture_unavailable';
  END IF;
END;
$$;

SELECT set_config(
  'request.jwt.claim.sub',
  (SELECT fixture.user_id::TEXT FROM business_favorite_probe_fixture AS fixture),
  TRUE
);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (SELECT fixture.user_id FROM business_favorite_probe_fixture AS fixture),
    'role', 'authenticated'
  )::TEXT,
  TRUE
);
SELECT set_config(
  'app.business_favorite_probe_business_id',
  (SELECT fixture.business_id::TEXT FROM business_favorite_probe_fixture AS fixture),
  TRUE
);

SET LOCAL ROLE authenticated;

DO $$
DECLARE
  target_business_id UUID := current_setting(
    'app.business_favorite_probe_business_id'
  )::UUID;
  favorite public.user_favorite_businesses;
  direct_read_blocked BOOLEAN := FALSE;
  direct_write_blocked BOOLEAN := FALSE;
BEGIN
  IF public.is_current_user_business_favorite(target_business_id) THEN
    RAISE EXCEPTION 'business_favorite_fixture_was_not_empty';
  END IF;

  PERFORM public.set_current_user_business_favorite(target_business_id, TRUE);
  PERFORM public.set_current_user_business_favorite(target_business_id, TRUE);

  SELECT listed.*
  INTO favorite
  FROM public.get_current_user_business_favorites(100, 0, NULL) AS listed
  WHERE listed.business_id = target_business_id;

  IF favorite.id IS NULL
     OR NOT public.is_current_user_business_favorite(target_business_id) THEN
    RAISE EXCEPTION 'business_favorite_idempotent_create_failed';
  END IF;
  IF NOT target_business_id = ANY(
    public.get_current_user_business_favorite_ids(ARRAY[target_business_id])
  ) THEN
    RAISE EXCEPTION 'business_favorite_batch_read_failed';
  END IF;

  favorite := public.patch_current_user_business_favorite(
    p_favorite_id => favorite.id,
    p_notify_on_promotions => FALSE,
    p_notes_set => TRUE,
    p_notes => 'probe note',
    p_tags_set => TRUE,
    p_tags => ARRAY['Local', 'local', 'Almoco']
  );

  IF favorite.notify_on_promotions IS NOT FALSE
     OR favorite.notify_on_new_items IS NOT FALSE
     OR favorite.notes <> 'probe note'
     OR favorite.tags <> ARRAY['almoco', 'local'] THEN
    RAISE EXCEPTION 'business_favorite_patch_or_normalization_failed';
  END IF;

  favorite := public.patch_current_user_business_favorite(
    p_favorite_id => favorite.id,
    p_notify_on_new_items => TRUE,
    p_notes_set => TRUE
  );

  IF favorite.notify_on_promotions IS NOT FALSE
     OR favorite.notify_on_new_items IS NOT TRUE
     OR favorite.notes IS NOT NULL
     OR favorite.tags <> ARRAY['almoco', 'local'] THEN
    RAISE EXCEPTION 'business_favorite_partial_patch_clobbered_fields';
  END IF;

  BEGIN
    PERFORM 1 FROM public.user_favorite_businesses LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN
    direct_read_blocked := TRUE;
  END;
  IF NOT direct_read_blocked THEN
    RAISE EXCEPTION 'direct_business_favorite_read_was_not_blocked';
  END IF;

  BEGIN
    UPDATE public.user_favorite_businesses
    SET notify_on_promotions = TRUE
    WHERE id = favorite.id;
  EXCEPTION WHEN insufficient_privilege THEN
    direct_write_blocked := TRUE;
  END;
  IF NOT direct_write_blocked THEN
    RAISE EXCEPTION 'direct_business_favorite_write_was_not_blocked';
  END IF;

  PERFORM public.set_current_user_business_favorite(target_business_id, FALSE);
  PERFORM public.set_current_user_business_favorite(target_business_id, FALSE);

  IF public.is_current_user_business_favorite(target_business_id) THEN
    RAISE EXCEPTION 'business_favorite_idempotent_remove_failed';
  END IF;
  IF cardinality(
    public.get_current_user_business_favorite_ids(ARRAY[target_business_id])
  ) <> 0 THEN
    RAISE EXCEPTION 'business_favorite_batch_remove_state_failed';
  END IF;
END;
$$;

RESET ROLE;

DO $$
DECLARE
  target_user_id UUID := (
    SELECT fixture.user_id FROM business_favorite_probe_fixture AS fixture
  );
  target_business_id UUID := (
    SELECT fixture.business_id FROM business_favorite_probe_fixture AS fixture
  );
  audit_count INTEGER;
BEGIN
  SELECT count(*)
  INTO audit_count
  FROM private.business_favorites_audit_log AS audit
  WHERE audit.owner_user_id = target_user_id
    AND audit.business_id = target_business_id
    AND audit.created_at >= transaction_timestamp();

  IF audit_count <> 4 THEN
    RAISE EXCEPTION 'business_favorite_audit_count_%', audit_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM private.business_favorites_audit_log AS audit
    WHERE audit.owner_user_id = target_user_id
      AND audit.business_id = target_business_id
      AND audit.created_at >= transaction_timestamp()
      AND audit.changed_fields::TEXT ~ '(probe note|almoco|local|false|true)'
  ) THEN
    RAISE EXCEPTION 'business_favorite_audit_contains_values';
  END IF;

  RAISE NOTICE 'business_favorites_remote_probe_passed';
END;
$$;

ROLLBACK;
