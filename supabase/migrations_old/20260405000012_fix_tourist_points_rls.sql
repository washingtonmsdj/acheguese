-- Migração: Corrigir RLS de tourist_points para SSOT
-- Data: 2026-04-05
-- Objetivo: Atualizar política RLS para aceitar status='published' ao invés de 'active'

-- ============================================================================
-- PARTE 1: Remover política antiga
-- ============================================================================

DROP POLICY IF EXISTS "Tourist points public read" ON tourist_points;

-- ============================================================================
-- PARTE 2: Criar nova política com status SSOT
-- ============================================================================

CREATE POLICY "Tourist points public read"
  ON tourist_points
  FOR SELECT
  TO public
  USING (status = 'published');

-- ============================================================================
-- PARTE 3: Verificação
-- ============================================================================

-- Verificar políticas
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'tourist_points';

-- Testar query pública
SELECT COUNT(*) as total_published
FROM tourist_points
WHERE status = 'published';
