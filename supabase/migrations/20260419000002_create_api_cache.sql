-- =====================================================
-- MIGRATION: API Cache System
-- =====================================================
-- Description: Sistema de cache para edge functions e APIs externas
-- Author: Kiro AI
-- Date: 2026-04-19
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- API CACHE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS api_cache (
  -- Primary key
  key TEXT PRIMARY KEY,
  
  -- Cache data
  value JSONB NOT NULL,
  
  -- Metadata
  cache_type TEXT NOT NULL DEFAULT 'api', -- 'api', 'geocoding', 'external'
  ttl_seconds INTEGER NOT NULL DEFAULT 3600, -- TTL em segundos
  
  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Stats
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index para buscar cache expirado (cleanup)
CREATE INDEX idx_api_cache_expires 
ON api_cache(expires_at);

-- Index para buscar por tipo
CREATE INDEX idx_api_cache_type 
ON api_cache(cache_type);

-- Index para buscar cache mais acessado
CREATE INDEX idx_api_cache_hits 
ON api_cache(hit_count DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Função para buscar cache
CREATE OR REPLACE FUNCTION get_cache(
  p_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_value JSONB;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Busca cache
  SELECT value, expires_at
  INTO v_value, v_expires_at
  FROM api_cache
  WHERE key = p_key;
  
  -- Se não encontrou, retorna null
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Se expirou, deleta e retorna null
  IF v_expires_at < NOW() THEN
    DELETE FROM api_cache WHERE key = p_key;
    RETURN NULL;
  END IF;
  
  -- Atualiza estatísticas
  UPDATE api_cache
  SET 
    hit_count = hit_count + 1,
    last_hit_at = NOW()
  WHERE key = p_key;
  
  -- Retorna valor
  RETURN v_value;
END;
$$;

-- Função para salvar cache
CREATE OR REPLACE FUNCTION set_cache(
  p_key TEXT,
  p_value JSONB,
  p_ttl_seconds INTEGER DEFAULT 3600,
  p_cache_type TEXT DEFAULT 'api'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO api_cache (
    key,
    value,
    cache_type,
    ttl_seconds,
    expires_at
  )
  VALUES (
    p_key,
    p_value,
    p_cache_type,
    p_ttl_seconds,
    NOW() + (p_ttl_seconds || ' seconds')::INTERVAL
  )
  ON CONFLICT (key) DO UPDATE
  SET
    value = EXCLUDED.value,
    cache_type = EXCLUDED.cache_type,
    ttl_seconds = EXCLUDED.ttl_seconds,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();
END;
$$;

-- Função para deletar cache
CREATE OR REPLACE FUNCTION delete_cache(
  p_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM api_cache WHERE key = p_key;
END;
$$;

-- Função para deletar cache por padrão
CREATE OR REPLACE FUNCTION delete_cache_pattern(
  p_pattern TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM api_cache 
  WHERE key LIKE p_pattern;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM api_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Função para obter estatísticas de cache
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS TABLE (
  total_entries BIGINT,
  total_size_mb NUMERIC,
  by_type JSONB,
  top_keys JSONB,
  expired_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_entries,
    ROUND(pg_total_relation_size('api_cache')::NUMERIC / 1024 / 1024, 2) as total_size_mb,
    (
      SELECT jsonb_object_agg(cache_type, count)
      FROM (
        SELECT cache_type, COUNT(*) as count
        FROM api_cache
        GROUP BY cache_type
      ) t
    ) as by_type,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'key', key,
          'hits', hit_count,
          'last_hit', last_hit_at
        )
      )
      FROM (
        SELECT key, hit_count, last_hit_at
        FROM api_cache
        ORDER BY hit_count DESC
        LIMIT 10
      ) t
    ) as top_keys,
    (
      SELECT COUNT(*)::BIGINT
      FROM api_cache
      WHERE expires_at < NOW()
    ) as expired_count
  FROM api_cache;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_api_cache_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_api_cache_updated_at
  BEFORE UPDATE ON api_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_api_cache_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilita RLS
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas edge functions podem acessar (via service_role)
-- Usuários normais não têm acesso direto ao cache
CREATE POLICY api_cache_service_role_all
  ON api_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- SCHEDULED JOB (via pg_cron se disponível)
-- =====================================================

-- Nota: pg_cron precisa ser habilitado no Supabase Dashboard
-- Este é apenas um exemplo de como configurar

-- SELECT cron.schedule(
--   'cleanup-expired-cache',
--   '0 * * * *', -- A cada hora
--   $$SELECT cleanup_expired_cache()$$
-- );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE api_cache IS 'Cache para respostas de edge functions e APIs externas';
COMMENT ON COLUMN api_cache.key IS 'Chave única do cache (ex: geocoding:lat,lng)';
COMMENT ON COLUMN api_cache.value IS 'Valor em cache (JSON)';
COMMENT ON COLUMN api_cache.cache_type IS 'Tipo de cache (api, geocoding, external)';
COMMENT ON COLUMN api_cache.ttl_seconds IS 'Time to live em segundos';
COMMENT ON COLUMN api_cache.expires_at IS 'Data/hora de expiração';
COMMENT ON COLUMN api_cache.hit_count IS 'Número de vezes que o cache foi acessado';
COMMENT ON COLUMN api_cache.last_hit_at IS 'Última vez que o cache foi acessado';

COMMENT ON FUNCTION get_cache(TEXT) IS 'Busca valor no cache, retorna NULL se expirado';
COMMENT ON FUNCTION set_cache(TEXT, JSONB, INTEGER, TEXT) IS 'Salva valor no cache com TTL';
COMMENT ON FUNCTION delete_cache(TEXT) IS 'Deleta cache por chave';
COMMENT ON FUNCTION delete_cache_pattern(TEXT) IS 'Deleta cache por padrão (LIKE)';
COMMENT ON FUNCTION cleanup_expired_cache() IS 'Remove todos os caches expirados';
COMMENT ON FUNCTION get_cache_stats() IS 'Retorna estatísticas do cache';

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Nenhum dado inicial necessário

-- =====================================================
-- GRANTS
-- =====================================================

-- Garante que service_role pode executar as funções
GRANT EXECUTE ON FUNCTION get_cache(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION set_cache(TEXT, JSONB, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION delete_cache(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION delete_cache_pattern(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache() TO service_role;
GRANT EXECUTE ON FUNCTION get_cache_stats() TO service_role;
