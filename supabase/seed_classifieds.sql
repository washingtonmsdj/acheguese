-- ============================================================================
-- SEED: Classificados de Teste
-- ============================================================================
-- Este script insere dados de teste completos para classificados
-- Inclui: categorias, subcategorias, localidades e anúncios

-- ============================================================================
-- 1. LIMPAR DADOS EXISTENTES (CUIDADO EM PRODUÇÃO!)
-- ============================================================================

-- DELETE FROM classifieds WHERE title LIKE '%[TESTE]%';

-- ============================================================================
-- 2. BUSCAR IDS NECESSÁRIOS
-- ============================================================================

-- Buscar ID de uma localidade existente (ajuste conforme seu banco)
-- SELECT id, name, geographic_path FROM locations WHERE type = 'neighborhood' LIMIT 5;

-- Buscar ID de um usuário existente (ajuste conforme seu banco)
-- SELECT id, name FROM profiles LIMIT 1;

-- ============================================================================
-- 3. INSERIR CLASSIFICADOS DE TESTE
-- ============================================================================

-- IMPORTANTE: Substitua os valores abaixo pelos IDs reais do seu banco:
-- - {LOCATION_ID_PITUBA}: ID da localidade Pituba
-- - {LOCATION_ID_BARRA}: ID da localidade Barra
-- - {SELLER_ID}: ID de um usuário vendedor válido

-- Exemplo de INSERT (ajuste os IDs):

INSERT INTO classifieds (
  title,
  description,
  price,
  category,
  condition,
  photos,
  seller_id,
  location_id,
  status,
  created_at
) VALUES
(
  '[TESTE] iPhone 14 Pro Max 256GB - Seminovo',
  'iPhone 14 Pro Max 256GB na cor Deep Purple. Aparelho em perfeito estado, sem arranhões, com caixa original, carregador e nota fiscal. Bateria com 98% de saúde. Aceito propostas.',
  4500.00,
  'eletrônicos',
  'usado',
  ARRAY[
    'https://images.unsplash.com/photo-1678652197950-91e3f0a0f0a8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1678652197950-91e3f0a0f0a8?w=800&h=600&fit=crop&sat=-100'
  ],
  '{SELLER_ID}',
  '{LOCATION_ID_PITUBA}',
  'active',
  NOW() - INTERVAL '1 day'
),
(
  '[TESTE] Sofá 3 Lugares Retrátil e Reclinável',
  'Sofá 3 lugares retrátil e reclinável, cor cinza, tecido suede. Muito confortável e em ótimo estado de conservação. Apenas 1 ano de uso. Medidas: 2,20m x 1,05m.',
  1200.00,
  'móveis',
  'usado',
  ARRAY['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop'],
  '{SELLER_ID}',
  '{LOCATION_ID_BARRA}',
  'active',
  NOW() - INTERVAL '2 days'
);

