-- ============================================================================
-- Community Issues — RPC de criação
--
-- Validações server-side:
-- 1. Autenticação
-- 2. Profile ativo
-- 3. Rate limit (5 por 24h)
-- 4. Deduplicação (mesma categoria + bairro nas últimas 24h)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_community_issue(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         UUID;
  v_profile_id      UUID;
  v_issue_count     INTEGER;
  v_duplicate_count INTEGER;
  v_issue_id        UUID;
  v_category        issue_category;
  v_title           TEXT;
  v_description     TEXT;
  v_neighborhood    TEXT;
  v_city            TEXT;
  v_address_ref     TEXT;
  v_priority        issue_priority;
BEGIN
  -- 1. Autenticação
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  -- 2. Profile ativo
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id = v_user_id AND is_active = TRUE
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  -- 3. Extrair e validar campos
  v_category    := (payload->>'category')::issue_category;
  v_title       := payload->>'title';
  v_description := payload->>'description';
  v_neighborhood := payload->>'neighborhood';
  v_city        := payload->>'city';
  v_address_ref := payload->>'address_reference';
  v_priority    := COALESCE((payload->>'priority')::issue_priority, 'media');

  IF v_category IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_category');
  END IF;

  IF char_length(v_title) < 10 OR char_length(v_title) > 100 THEN
    RETURN jsonb_build_object('error', 'invalid_title_length');
  END IF;

  IF char_length(v_description) < 20 OR char_length(v_description) > 500 THEN
    RETURN jsonb_build_object('error', 'invalid_description_length');
  END IF;

  -- 4. Rate limit: máximo 5 issues em 24h
  SELECT COUNT(*) INTO v_issue_count
  FROM community_issues
  WHERE author_profile_id = v_profile_id
    AND created_at > NOW() - INTERVAL '24 hours';

  IF v_issue_count >= 5 THEN
    RETURN jsonb_build_object('error', 'rate_limit_exceeded');
  END IF;

  -- 5. Deduplicação: mesma categoria + bairro + cidade nas últimas 24h pelo mesmo autor
  SELECT COUNT(*) INTO v_duplicate_count
  FROM community_issues
  WHERE author_profile_id = v_profile_id
    AND category = v_category
    AND neighborhood = lower(trim(v_neighborhood))
    AND city = lower(trim(v_city))
    AND created_at > NOW() - INTERVAL '24 hours'
    AND removed_at IS NULL;

  IF v_duplicate_count > 0 THEN
    RETURN jsonb_build_object('error', 'duplicate_issue');
  END IF;

  -- 6. Inserir
  INSERT INTO community_issues (
    author_profile_id,
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
    v_category,
    v_title,
    v_description,
    lower(trim(v_neighborhood)),
    v_neighborhood,
    lower(trim(v_city)),
    v_address_ref,
    v_priority
  )
  RETURNING id INTO v_issue_id;

  -- 7. Audit log
  INSERT INTO community_issue_audit (issue_id, actor_id, action_type, metadata)
  VALUES (v_issue_id, v_user_id, 'created', jsonb_build_object(
    'category', v_category,
    'city', v_city,
    'neighborhood', v_neighborhood
  ));

  RETURN jsonb_build_object('success', TRUE, 'issue_id', v_issue_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', 'internal_error', 'detail', SQLERRM);
END;
$$;
