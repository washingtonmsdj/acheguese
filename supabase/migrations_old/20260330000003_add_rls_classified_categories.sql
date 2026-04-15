-- ============================================================================
-- Migration: Adicionar RLS para Tabelas de Categorias de Classificados
-- Data: 2026-03-30
-- Descrição: Habilita RLS e cria políticas públicas de leitura para
--            classified_categories e classified_subcategories
-- ============================================================================

-- ─── Habilitar RLS ───────────────────────────────────────────────────────────

ALTER TABLE classified_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE classified_subcategories ENABLE ROW LEVEL SECURITY;

-- ─── Políticas de Leitura Pública ────────────────────────────────────────────

-- Categorias são públicas (todos podem ler)
CREATE POLICY "public_read_classified_categories"
  ON classified_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Subcategorias são públicas (todos podem ler)
CREATE POLICY "public_read_classified_subcategories"
  ON classified_subcategories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─── Comentários ─────────────────────────────────────────────────────────────

COMMENT ON POLICY "public_read_classified_categories" ON classified_categories IS
  'Permite leitura pública de categorias de classificados';

COMMENT ON POLICY "public_read_classified_subcategories" ON classified_subcategories IS
  'Permite leitura pública de subcategorias de classificados';
