-- =====================================================
-- MIGRATION: User Sessions Management
-- =====================================================
-- Descrição: Sistema de gerenciamento de sessões com rastreamento e detecção de anomalias
-- Data: 2026-04-18
-- Autor: Kiro AI
-- Fase: Pré-Lançamento - Autenticação & Segurança
-- =====================================================

-- =====================================================
-- 1. TABELA: user_sessions
-- =====================================================
-- Rastreia todas as sessões ativas dos usuários

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  refresh_token_hash text,
  
  -- Informações do dispositivo
  device_type text, -- 'desktop', 'mobile', 'tablet'
  device_name text,
  browser text,
  browser_version text,
  os text,
  os_version text,
  user_agent text,
  
  -- Informações de localização
  ip_address inet,
  country text,
  region text,
  city text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  
  -- Status da sessão
  is_active boolean NOT NULL DEFAULT true,
  is_trusted boolean NOT NULL DEFAULT false,
  is_suspicious boolean NOT NULL DEFAULT false,
  suspicion_reason text,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id),
  revoked_reason text,
  
  -- Metadados
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
  ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token 
  ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active 
  ON user_sessions(is_active) 
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_suspicious 
  ON user_sessions(is_suspicious) 
  WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at 
  ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity 
  ON user_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_address 
  ON user_sessions(ip_address);

-- RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver suas próprias sessões
CREATE POLICY user_sessions_own_read 
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Usuário pode revogar suas próprias sessões
CREATE POLICY user_sessions_own_revoke 
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() 
    AND is_active = false 
    AND revoked_at IS NOT NULL
  );

-- Policy: Admin pode ver todas as sessões
CREATE POLICY user_sessions_admin_read 
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_enum IN ('super_admin'::app_role, 'admin'::app_role)
      AND user_roles.is_active = true
    )
  );

-- Policy: Admin pode revogar qualquer sessão
CREATE POLICY user_sessions_admin_revoke 
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_enum IN ('super_admin'::app_role, 'admin'::app_role)
      AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_enum IN ('super_admin'::app_role, 'admin'::app_role)
      AND user_roles.is_active = true
    )
  );

-- =====================================================
-- 2. TABELA: session_anomalies
-- =====================================================
-- Registra anomalias detectadas nas sessões

CREATE TABLE IF NOT EXISTS session_anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de anomalia
  anomaly_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  
  -- Detalhes
  description text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  
  -- Ação tomada
  action_taken text,
  auto_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  
  -- Timestamps
  detected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_anomaly_type CHECK (
    anomaly_type IN (
      'impossible_travel',
      'new_device',
      'new_location',
      'suspicious_ip',
      'multiple_locations',
      'unusual_activity',
      'brute_force_attempt',
      'session_hijacking'
    )
  ),
  CONSTRAINT valid_severity CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_session_anomalies_session_id 
  ON session_anomalies(session_id);
CREATE INDEX IF NOT EXISTS idx_session_anomalies_user_id 
  ON session_anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_session_anomalies_type 
  ON session_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_session_anomalies_severity 
  ON session_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_session_anomalies_detected_at 
  ON session_anomalies(detected_at);

-- RLS
ALTER TABLE session_anomalies ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver suas próprias anomalias
CREATE POLICY session_anomalies_own_read 
  ON session_anomalies
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admin pode ver todas as anomalias
CREATE POLICY session_anomalies_admin_read 
  ON session_anomalies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_enum IN ('super_admin'::app_role, 'admin'::app_role)
      AND user_roles.is_active = true
    )
  );

-- =====================================================
-- 3. FUNÇÃO: detect_impossible_travel
-- =====================================================
-- Detecta viagem impossível (login em locais muito distantes em pouco tempo)

CREATE OR REPLACE FUNCTION detect_impossible_travel(
  p_user_id uuid,
  p_new_lat numeric,
  p_new_lon numeric,
  p_new_session_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_session record;
  v_distance_km numeric;
  v_time_diff_hours numeric;
  v_speed_kmh numeric;
  v_max_reasonable_speed numeric := 900; -- km/h (velocidade de avião comercial)
BEGIN
  -- Buscar última sessão ativa do usuário
  SELECT 
    latitude,
    longitude,
    last_activity_at,
    id
  INTO v_last_session
  FROM user_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND id != p_new_session_id
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
  ORDER BY last_activity_at DESC
  LIMIT 1;
  
  -- Se não há sessão anterior com localização, não há como detectar
  IF v_last_session IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calcular distância usando fórmula de Haversine (aproximada)
  v_distance_km := (
    6371 * acos(
      cos(radians(v_last_session.latitude)) * 
      cos(radians(p_new_lat)) * 
      cos(radians(p_new_lon) - radians(v_last_session.longitude)) + 
      sin(radians(v_last_session.latitude)) * 
      sin(radians(p_new_lat))
    )
  );
  
  -- Calcular diferença de tempo em horas
  v_time_diff_hours := EXTRACT(EPOCH FROM (now() - v_last_session.last_activity_at)) / 3600;
  
  -- Evitar divisão por zero
  IF v_time_diff_hours < 0.1 THEN
    v_time_diff_hours := 0.1;
  END IF;
  
  -- Calcular velocidade necessária
  v_speed_kmh := v_distance_km / v_time_diff_hours;
  
  -- Se velocidade é maior que o razoável, é viagem impossível
  IF v_speed_kmh > v_max_reasonable_speed THEN
    -- Registrar anomalia
    INSERT INTO session_anomalies (
      session_id,
      user_id,
      anomaly_type,
      severity,
      description,
      details
    ) VALUES (
      p_new_session_id,
      p_user_id,
      'impossible_travel',
      'high',
      format('Viagem impossível detectada: %s km em %s horas (%s km/h)', 
        round(v_distance_km, 2), 
        round(v_time_diff_hours, 2), 
        round(v_speed_kmh, 2)
      ),
      jsonb_build_object(
        'distance_km', v_distance_km,
        'time_diff_hours', v_time_diff_hours,
        'speed_kmh', v_speed_kmh,
        'previous_location', jsonb_build_object(
          'latitude', v_last_session.latitude,
          'longitude', v_last_session.longitude
        ),
        'new_location', jsonb_build_object(
          'latitude', p_new_lat,
          'longitude', p_new_lon
        )
      )
    );
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- =====================================================
-- 4. FUNÇÃO: revoke_user_session
-- =====================================================
-- Revoga uma sessão específica

CREATE OR REPLACE FUNCTION revoke_user_session(
  p_session_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar user_id da sessão
  SELECT user_id INTO v_user_id
  FROM user_sessions
  WHERE id = p_session_id;
  
  -- Verificar se usuário tem permissão (própria sessão ou admin)
  IF v_user_id != auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_enum IN ('super_admin'::app_role, 'admin'::app_role)
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Sem permissão para revogar esta sessão';
    END IF;
  END IF;
  
  -- Revogar sessão
  UPDATE user_sessions
  SET 
    is_active = false,
    revoked_at = now(),
    revoked_by = auth.uid(),
    revoked_reason = p_reason
  WHERE id = p_session_id;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 5. FUNÇÃO: revoke_all_user_sessions
-- =====================================================
-- Revoga todas as sessões de um usuário (exceto a atual)

CREATE OR REPLACE FUNCTION revoke_all_user_sessions(
  p_user_id uuid DEFAULT NULL,
  p_except_current boolean DEFAULT true,
  p_reason text DEFAULT 'Logout em todos os dispositivos'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id uuid;
  v_current_session_token text;
  v_revoked_count integer;
BEGIN
  -- Se não especificou user_id, usar o usuário atual
  v_target_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Verificar permissão
  IF v_target_user_id != auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_enum IN ('super_admin'::app_role, 'admin'::app_role)
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Sem permissão para revogar sessões deste usuário';
    END IF;
  END IF;
  
  -- Buscar token da sessão atual (se aplicável)
  IF p_except_current THEN
    SELECT token INTO v_current_session_token
    FROM auth.sessions
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- Revogar todas as sessões (exceto a atual se especificado)
  UPDATE user_sessions
  SET 
    is_active = false,
    revoked_at = now(),
    revoked_by = auth.uid(),
    revoked_reason = p_reason
  WHERE user_id = v_target_user_id
    AND is_active = true
    AND (
      NOT p_except_current 
      OR session_token != v_current_session_token
      OR v_current_session_token IS NULL
    );
  
  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
  
  RETURN v_revoked_count;
END;
$$;

-- =====================================================
-- 6. FUNÇÃO: cleanup_expired_sessions
-- =====================================================
-- Remove sessões expiradas (executar periodicamente)

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Marcar sessões expiradas como inativas
  UPDATE user_sessions
  SET 
    is_active = false,
    revoked_at = now(),
    revoked_reason = 'Sessão expirada'
  WHERE is_active = true
    AND expires_at < now();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Deletar sessões antigas (mais de 90 dias)
  DELETE FROM user_sessions
  WHERE expires_at < now() - interval '90 days';
  
  RETURN v_deleted_count;
END;
$$;

-- =====================================================
-- 7. FUNÇÃO: update_session_activity
-- =====================================================
-- Atualiza timestamp de última atividade

CREATE OR REPLACE FUNCTION update_session_activity(
  p_session_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_sessions
  SET last_activity_at = now()
  WHERE session_token = p_session_token
    AND is_active = true;
  
  RETURN FOUND;
END;
$$;

-- =====================================================
-- 8. FUNÇÃO: get_active_sessions_count
-- =====================================================
-- Retorna número de sessões ativas do usuário

CREATE OR REPLACE FUNCTION get_active_sessions_count(
  p_user_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM user_sessions
  WHERE user_id = COALESCE(p_user_id, auth.uid())
    AND is_active = true
    AND expires_at > now();
  
  RETURN v_count;
END;
$$;

-- =====================================================
-- 9. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE user_sessions IS 
  'Rastreamento de todas as sessões de usuários com informações de dispositivo e localização';

COMMENT ON TABLE session_anomalies IS 
  'Registro de anomalias detectadas nas sessões para análise de segurança';

COMMENT ON FUNCTION detect_impossible_travel(uuid, numeric, numeric, uuid) IS 
  'Detecta viagem impossível baseado em distância e tempo entre sessões';

COMMENT ON FUNCTION revoke_user_session(uuid, text) IS 
  'Revoga uma sessão específica';

COMMENT ON FUNCTION revoke_all_user_sessions(uuid, boolean, text) IS 
  'Revoga todas as sessões de um usuário (exceto a atual opcionalmente)';

COMMENT ON FUNCTION cleanup_expired_sessions() IS 
  'Remove sessões expiradas - executar periodicamente via cron';

COMMENT ON FUNCTION update_session_activity(text) IS 
  'Atualiza timestamp de última atividade da sessão';

COMMENT ON FUNCTION get_active_sessions_count(uuid) IS 
  'Retorna número de sessões ativas do usuário';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
