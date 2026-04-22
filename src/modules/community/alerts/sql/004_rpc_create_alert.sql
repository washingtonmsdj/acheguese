-- ============================================================================
-- COMMUNITY ALERTS — Fase 1: RPC de criação
-- INSERT direto na tabela é bloqueado por RLS (ver 005_rls.sql)
-- Toda criação passa obrigatoriamente por esta função
-- ============================================================================

CREATE OR REPLACE FUNCTION create_community_alert(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- executa com permissões do owner, não do caller
AS $$
DECLARE
  v_user_id             uuid := auth.uid();
  v_profile_id          uuid;
  v_account_age_days    integer;
  v_phone_verified      boolean;
  v_alert_count_24h     integer;
  v_duplicate_count     integer;
  v_category            text;
  v_neighborhood        text;
  v_neighborhood_display text;
  v_city                text;
  v_description         text;
  v_expires_at          timestamptz;
  v_expiry_minutes      integer;
  v_alert_id            uuid;
  v_trust_snapshot      jsonb;
  v_active_strikes      integer := 0;
BEGIN
  -- 0. Usuário autenticado
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  -- 1. Verificar telefone verificado
  SELECT (phone_confirmed_at IS NOT NULL)
  INTO v_phone_verified
  FROM auth.users
  WHERE id = v_user_id;

  IF NOT v_phone_verified THEN
    RETURN jsonb_build_object('error', 'phone_not_verified');
  END IF;

  -- 2. Verificar idade da conta (>= 7 dias)
  SELECT EXTRACT(DAY FROM now() - created_at)::integer
  INTO v_account_age_days
  FROM auth.users
  WHERE id = v_user_id;

  IF v_account_age_days < 7 THEN
    RETURN jsonb_build_object('error', 'account_too_new', 'days', v_account_age_days);
  END IF;

  -- 3. Derivar author_profile_id do usuário autenticado (nunca do payload)
  SELECT id
  INTO v_profile_id
  FROM profiles
  WHERE user_id = v_user_id
    AND is_active = true
  ORDER BY created_at ASC  -- perfil mais antigo = perfil principal
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  -- 4. Rate limit: máx 3 alertas em 24h (conta todos os status)
  SELECT COUNT(*)
  INTO v_alert_count_24h
  FROM community_alerts
  WHERE author_user_id = v_user_id
    AND created_at > now() - interval '24 hours';

  IF v_alert_count_24h >= 3 THEN
    RETURN jsonb_build_object('error', 'rate_limit_exceeded', 'count', v_alert_count_24h);
  END IF;

  -- 5. Extrair e normalizar campos de localização
  v_neighborhood_display := trim(payload->>'neighborhood');
  v_city                 := normalize_location_text(payload->>'city');
  v_neighborhood         := normalize_location_text(payload->>'neighborhood');
  v_category             := payload->>'category';
  v_description          := trim(payload->>'description');

  -- 6. Validar categoria (defesa em profundidade — constraint do banco também valida)
  IF v_category NOT IN (
    'tiroteio_disparos', 'assalto_em_andamento', 'tentativa_de_invasao',
    'incendio_explosao', 'acidente_grave', 'alagamento_deslizamento',
    'risco_na_via', 'pessoa_vulneravel_em_risco'
  ) THEN
    RETURN jsonb_build_object('error', 'invalid_category');
  END IF;

  -- 7. Validar tamanho da descrição
  IF char_length(v_description) < 20 OR char_length(v_description) > 280 THEN
    RETURN jsonb_build_object('error', 'invalid_description_length',
      'length', char_length(v_description));
  END IF;

  -- 8. Validar termos proibidos (server-side, via tabela alert_blocked_terms)
  IF EXISTS (
    SELECT 1
    FROM alert_blocked_terms
    WHERE active = true
      AND lower(v_description) ~ lower(pattern)
  ) THEN
    RETURN jsonb_build_object('error', 'blocked_content');
  END IF;

  -- 9. Deduplicação: mesma categoria + bairro + cidade nos últimos 30min
  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM community_alerts
  WHERE category    = v_category
    AND neighborhood = v_neighborhood
    AND city         = v_city
    AND status       = 'ativo'
    AND created_at   > now() - interval '30 minutes';

  IF v_duplicate_count > 0 THEN
    RETURN jsonb_build_object('error', 'duplicate_alert');
  END IF;

  -- 10. Calcular expires_at por categoria
  v_expiry_minutes := CASE v_category
    WHEN 'tiroteio_disparos'        THEN 60
    WHEN 'assalto_em_andamento'     THEN 60
    WHEN 'tentativa_de_invasao'     THEN 60
    WHEN 'incendio_explosao'        THEN 90
    WHEN 'acidente_grave'           THEN 90
    WHEN 'alagamento_deslizamento'  THEN 180
    WHEN 'risco_na_via'             THEN 180
    WHEN 'pessoa_vulneravel_em_risco' THEN 120
    ELSE 60
  END;

  v_expires_at := now() + (v_expiry_minutes || ' minutes')::interval;

  -- 11. Montar trust_snapshot imutável
  v_trust_snapshot := jsonb_build_object(
    'phone_verified',     v_phone_verified,
    'account_age_days',   v_account_age_days,
    'active_strikes',     v_active_strikes,
    'eligibility_passed', true,
    'checked_at',         now()
  );

  -- 12. INSERT
  INSERT INTO community_alerts (
    author_user_id,
    author_profile_id,
    category,
    status,
    neighborhood,
    neighborhood_display,
    city,
    description,
    seen_personally,
    started_at_approx,
    is_happening_now,
    still_risky,
    expires_at,
    trust_snapshot
  ) VALUES (
    v_user_id,
    v_profile_id,
    v_category,
    'ativo',
    v_neighborhood,
    v_neighborhood_display,
    v_city,
    v_description,
    (payload->>'seen_personally')::boolean,
    payload->>'started_at_approx',
    (payload->>'is_happening_now')::boolean,
    (payload->>'still_risky')::boolean,
    v_expires_at,
    v_trust_snapshot
  )
  RETURNING id INTO v_alert_id;

  -- 13. Audit log
  INSERT INTO community_alert_audit (alert_id, actor_id, action_type, metadata)
  VALUES (
    v_alert_id,
    v_user_id,
    'created',
    jsonb_build_object(
      'category',   v_category,
      'city',       v_city,
      'neighborhood', v_neighborhood,
      'expires_at', v_expires_at
    )
  );

  -- 14. Enfileirar notificação (assíncrona)
  INSERT INTO alert_notification_queue (alert_id, neighborhood, city)
  VALUES (v_alert_id, v_neighborhood, v_city)
  ON CONFLICT (alert_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'alert_id', v_alert_id);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', 'internal_error', 'detail', SQLERRM);
END;
$$;
