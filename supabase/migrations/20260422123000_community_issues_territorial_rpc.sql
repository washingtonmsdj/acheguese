-- ============================================================================
-- COMMUNITY ISSUES - Integracao territorial do RPC create_community_issue
-- ----------------------------------------------------------------------------
-- Objetivo:
-- 1) Tornar location_id obrigatorio no payload
-- 2) Derivar city/neighborhood a partir de locations (SSOT)
-- 3) Deduplicar por category + location_id nas ultimas 24h
-- ============================================================================

CREATE OR REPLACE FUNCTION create_community_issue(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user_id             UUID := auth.uid();
  v_profile_id          UUID;
  v_location_id         UUID;
  v_location            RECORD;
  v_issue_count         INTEGER;
  v_duplicate_count     INTEGER;
  v_issue_id            UUID;
  v_category            TEXT;
  v_title               TEXT;
  v_description         TEXT;
  v_address_ref         TEXT;
  v_priority            TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT id
  INTO v_profile_id
  FROM profiles
  WHERE user_id = v_user_id
    AND is_active = TRUE
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  v_location_id := (payload->>'location_id')::UUID;
  IF v_location_id IS NULL THEN
    RETURN jsonb_build_object('error', 'location_id_required');
  END IF;

  SELECT
    l.id,
    l.name,
    l.type,
    l.status,
    parent.id AS parent_id,
    parent.name AS parent_name
  INTO v_location
  FROM locations l
  LEFT JOIN locations parent ON parent.id = l.parent_id
  WHERE l.id = v_location_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'location_not_found');
  END IF;

  IF v_location.type <> 'district' THEN
    RETURN jsonb_build_object('error', 'location_must_be_district');
  END IF;

  v_category := payload->>'category';
  v_title := payload->>'title';
  v_description := payload->>'description';
  v_address_ref := payload->>'address_reference';
  v_priority := COALESCE(payload->>'priority', 'media');

  IF v_category IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_category');
  END IF;

  IF char_length(COALESCE(v_title, '')) < 10 OR char_length(v_title) > 100 THEN
    RETURN jsonb_build_object('error', 'invalid_title_length');
  END IF;

  IF char_length(COALESCE(v_description, '')) < 20 OR char_length(v_description) > 500 THEN
    RETURN jsonb_build_object('error', 'invalid_description_length');
  END IF;

  SELECT COUNT(*)
  INTO v_issue_count
  FROM community_issues
  WHERE author_profile_id = v_profile_id
    AND created_at > NOW() - INTERVAL '24 hours';

  IF v_issue_count >= 5 THEN
    RETURN jsonb_build_object('error', 'rate_limit_exceeded');
  END IF;

  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM community_issues
  WHERE author_profile_id = v_profile_id
    AND category = v_category
    AND location_id = v_location_id
    AND created_at > NOW() - INTERVAL '24 hours'
    AND removed_at IS NULL;

  IF v_duplicate_count > 0 THEN
    RETURN jsonb_build_object('error', 'duplicate_issue');
  END IF;

  INSERT INTO community_issues (
    author_profile_id,
    profile_id,
    location_id,
    category,
    title,
    description,
    neighborhood,
    neighborhood_display,
    city,
    address_reference,
    priority
  ) VALUES (
    v_profile_id,
    v_profile_id,
    v_location_id,
    v_category,
    v_title,
    v_description,
    lower(trim(v_location.name)),
    v_location.name,
    lower(trim(COALESCE(v_location.parent_name, v_location.name))),
    v_address_ref,
    v_priority
  )
  RETURNING id INTO v_issue_id;

  INSERT INTO community_issue_audit (issue_id, actor_id, action_type, metadata)
  VALUES (
    v_issue_id,
    v_user_id,
    'created',
    jsonb_build_object(
      'category', v_category,
      'location_id', v_location_id,
      'city', COALESCE(v_location.parent_name, v_location.name),
      'neighborhood', v_location.name
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'issue_id', v_issue_id,
    'location_id', v_location_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', 'internal_error', 'detail', SQLERRM);
END;
$func$;
