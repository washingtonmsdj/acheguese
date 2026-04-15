-- ============================================================================
-- Migration: Create user_blocks table
-- Description: Tabela para gerenciar bloqueios entre usuários
-- Date: 2026-03-27
-- ============================================================================

-- Criar tabela de bloqueios
CREATE TABLE IF NOT EXISTS public.user_blocks (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  blocker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados
  reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT user_blocks_unique UNIQUE(blocker_user_id, blocked_user_id),
  CONSTRAINT user_blocks_no_self_block CHECK (blocker_user_id != blocked_user_id)
);

-- Comentários
COMMENT ON TABLE public.user_blocks IS 
  '✅ SSOT: Bloqueios entre usuários';

COMMENT ON COLUMN public.user_blocks.blocker_user_id IS 
  '✅ SSOT: user_id de quem bloqueou (contexto admin/segurança)';

COMMENT ON COLUMN public.user_blocks.blocked_user_id IS 
  '✅ SSOT: user_id de quem foi bloqueado (contexto admin/segurança)';

COMMENT ON COLUMN public.user_blocks.reason IS 
  'Motivo opcional do bloqueio';

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker 
  ON public.user_blocks(blocker_user_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked 
  ON public.user_blocks(blocked_user_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_created_at 
  ON public.user_blocks(created_at DESC);

-- Índice composto para verificações rápidas de bloqueio mútuo
CREATE INDEX IF NOT EXISTS idx_user_blocks_mutual 
  ON public.user_blocks(blocker_user_id, blocked_user_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver bloqueios que fizeram
CREATE POLICY "Users can view own blocks"
  ON public.user_blocks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_user_id);

-- Política: Usuários podem criar bloqueios
CREATE POLICY "Users can create blocks"
  ON public.user_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_user_id);

-- Política: Usuários podem deletar seus próprios bloqueios (desbloquear)
CREATE POLICY "Users can delete own blocks"
  ON public.user_blocks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_user_id);

-- Política: Admins podem ver todos os bloqueios
CREATE POLICY "Admins can view all blocks"
  ON public.user_blocks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- ============================================================================
-- Functions
-- ============================================================================

-- Função para verificar se um usuário está bloqueado
CREATE OR REPLACE FUNCTION public.is_user_blocked(
  p_blocker_user_id UUID,
  p_blocked_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE blocker_user_id = p_blocker_user_id
    AND blocked_user_id = p_blocked_user_id
  );
END;
$$;

COMMENT ON FUNCTION public.is_user_blocked IS 
  'Verifica se um usuário bloqueou outro';

-- Função para verificar bloqueio mútuo
CREATE OR REPLACE FUNCTION public.is_mutually_blocked(
  p_user_id_1 UUID,
  p_user_id_2 UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_user_id = p_user_id_1 AND blocked_user_id = p_user_id_2)
    OR (blocker_user_id = p_user_id_2 AND blocked_user_id = p_user_id_1)
  );
END;
$$;

COMMENT ON FUNCTION public.is_mutually_blocked IS 
  'Verifica se dois usuários têm bloqueio mútuo (A bloqueou B ou B bloqueou A)';

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_mutually_blocked TO authenticated;
