-- ============================================
-- CRIAR TABELA compiler_sessions NO SUPABASE CLOUD
-- ============================================
-- Execute este SQL no dashboard do Supabase:
-- https://supabase.com/dashboard/project/qgstwbjaxzrnvgktohsz/editor
-- 
-- Vá em: SQL Editor → New Query → Cole este código → Run
-- ============================================

-- Tabela de sessões do compilador
CREATE TABLE IF NOT EXISTS public.compiler_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT,
  game_id TEXT,
  phase TEXT NOT NULL CHECK (phase IN ('interpretation', 'plan', 'validation', 'confirmation', 'compilation')),
  interpretation_result JSONB,
  game_plan JSONB,
  validation_report JSONB,
  approved_by_user BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_compiler_sessions_user_id ON public.compiler_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_compiler_sessions_game_id ON public.compiler_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_compiler_sessions_updated_at ON public.compiler_sessions(updated_at);

-- Limpar sessões antigas (mais de 7 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_compiler_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.compiler_sessions
  WHERE updated_at < EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days') * 1000;
END;
$$ LANGUAGE plpgsql;

-- Verificar se a tabela foi criada
SELECT 'Tabela compiler_sessions criada com sucesso!' AS status;
SELECT COUNT(*) AS total_sessions FROM public.compiler_sessions;
