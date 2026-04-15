-- =============================================================================
-- Migration: Atualizar Classificados Existentes para URLs Canônicas
-- Data: 2026-03-30
--
-- OBJETIVO:
--   Atualizar todos os classificados existentes para atender às novas regras:
--   1. Gerar public_id para classificados sem ele
--   2. Gerar slug a partir do título
--   3. Associar category_id e subcategory_id
--   4. Validar location_id aponta para bairro (district)
--   5. Marcar como inativo classificados que não atendem aos requisitos
--
-- ESTRATÉGIA:
--   - Transação única para garantir consistência
--   - Logs detalhados de cada operação
--   - Rollback automático em caso de erro
--   - Preserva dados originais (não deleta)
-- =============================================================================

DO $$
DECLARE
  v_total_classifieds INTEGER;
  v_without_public_id INTEGER;
  v_without_slug INTEGER;
  v_without_category INTEGER;
  v_without_location INTEGER;
  v_invalid_location INTEGER;
  v_updated INTEGER := 0;
  v_marked_inactive INTEGER := 0;
  v_category_moveis UUID;
  v_subcategory_outros UUID;
BEGIN
  -- ── 1. Contagem inicial ────────────────────────────────────────────────────
  
  SELECT COUNT(*) INTO v_total_classifieds FROM classifieds;
  RAISE NOTICE '📊 Total de classificados: %', v_total_classifieds;
  
  SELECT COUNT(*) INTO v_without_public_id 
    FROM classifieds WHERE public_id IS NULL;
  RAISE NOTICE '⚠️  Sem public_id: %', v_without_public_id;
  
  SELECT COUNT(*) INTO v_without_slug 
    FROM classifieds WHERE slug IS NULL;
  RAISE NOTICE '⚠️  Sem slug: %', v_without_slug;
  
  SELECT COUNT(*) INTO v_without_category 
    FROM classifieds WHERE category_id IS NULL OR subcategory_id IS NULL;
  RAISE NOTICE '⚠️  Sem categoria/subcategoria: %', v_without_category;
  
  SELECT COUNT(*) INTO v_without_location 
    FROM classifieds WHERE location_id IS NULL;
  RAISE NOTICE '⚠️  Sem location_id: %', v_without_location;
  
  SELECT COUNT(*) INTO v_invalid_location
    FROM classifieds c
    LEFT JOIN locations l ON c.location_id = l.id
   WHERE c.location_id IS NOT NULL 
     AND (l.id IS NULL OR l.type != 'district');
  RAISE NOTICE '⚠️  Com location_id inválido (não é bairro): %', v_invalid_location;

  -- ── 2. Buscar categoria/subcategoria padrão ────────────────────────────────
  
  SELECT id INTO v_category_moveis 
    FROM classified_categories 
   WHERE slug = 'outros' 
   LIMIT 1;
  
  IF v_category_moveis IS NULL THEN
    RAISE EXCEPTION 'Categoria padrão "outros" não encontrada. Execute migration de categorias primeiro.';
  END IF;
  
  SELECT s.id INTO v_subcategory_outros 
    FROM classified_subcategories s
    JOIN classified_categories c ON s.category_id = c.id
   WHERE c.slug = 'outros'
     AND s.slug = 'outros' 
   LIMIT 1;
  
  IF v_subcategory_outros IS NULL THEN
    RAISE EXCEPTION 'Subcategoria padrão "outros" não encontrada. Execute migration de categorias primeiro.';
  END IF;
  
  RAISE NOTICE '✅ Categoria/subcategoria padrão: % / %', v_category_moveis, v_subcategory_outros;

  -- ── 3. Atualizar classificados válidos ─────────────────────────────────────
  
  RAISE NOTICE '🔄 Iniciando atualização de classificados válidos...';
  
  -- Atualiza classificados que têm location_id válido (apontando para bairro)
  UPDATE classifieds c
     SET public_id = COALESCE(c.public_id, fn_generate_classified_public_id()),
         slug = COALESCE(
           c.slug,
           lower(
             regexp_replace(
               regexp_replace(
                 regexp_replace(
                   unaccent(COALESCE(c.title, 'sem-titulo')),
                   '[àáâãäåèéêëìíîïòóôõöùúûüýÿñç]',
                   '',
                   'g'
                 ),
                 '[^a-zA-Z0-9\s-]',
                 '',
                 'g'
               ),
               '\s+',
               '-',
               'g'
             )
           )
         ),
         category_id = COALESCE(c.category_id, v_category_moveis),
         subcategory_id = COALESCE(c.subcategory_id, v_subcategory_outros),
         updated_at = NOW()
   WHERE EXISTS (
           SELECT 1 
             FROM locations l 
            WHERE l.id = c.location_id 
              AND l.type = 'district'
         );
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE '✅ Classificados atualizados: %', v_updated;

  -- ── 4. Marcar como inativos classificados inválidos ────────────────────────
  
  RAISE NOTICE '🔄 Marcando classificados inválidos como inativos...';
  
  -- Marca como inativo classificados sem location_id ou com location_id inválido
  UPDATE classifieds c
     SET status = 'inactive',
         updated_at = NOW()
   WHERE status = 'active'
     AND (
       c.location_id IS NULL
       OR NOT EXISTS (
         SELECT 1 
           FROM locations l 
          WHERE l.id = c.location_id 
            AND l.type = 'district'
       )
     );
  
  GET DIAGNOSTICS v_marked_inactive = ROW_COUNT;
  RAISE NOTICE '⚠️  Classificados marcados como inativos: %', v_marked_inactive;

  -- ── 5. Validação final ─────────────────────────────────────────────────────
  
  DECLARE
    v_still_invalid INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_still_invalid
      FROM classifieds
     WHERE status = 'active'
       AND (
         public_id IS NULL
         OR slug IS NULL
         OR category_id IS NULL
         OR subcategory_id IS NULL
         OR location_id IS NULL
         OR NOT EXISTS (
           SELECT 1 
             FROM locations l 
            WHERE l.id = location_id 
              AND l.type = 'district'
         )
       );
    
    IF v_still_invalid > 0 THEN
      RAISE WARNING 'ATENÇÃO: % classificados ativos ainda inválidos após migration', v_still_invalid;
    ELSE
      RAISE NOTICE '✅ Todos os classificados ativos estão válidos';
    END IF;
  END;

  -- ── 6. Resumo final ────────────────────────────────────────────────────────
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION CONCLUÍDA COM SUCESSO';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total de classificados: %', v_total_classifieds;
  RAISE NOTICE 'Classificados atualizados: %', v_updated;
  RAISE NOTICE 'Classificados marcados como inativos: %', v_marked_inactive;
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Revisar classificados inativos e corrigir location_id';
  RAISE NOTICE '2. Validar URLs canônicas no frontend';
  RAISE NOTICE '3. Testar navegação e compartilhamento';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro durante migration: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- ── 7. Criar índices para performance ────────────────────────────────────────

-- Índice composto para queries de listagem com filtro territorial
CREATE INDEX IF NOT EXISTS idx_classifieds_active_location_created 
  ON classifieds(status, location_id, created_at DESC) 
  WHERE status = 'active';

-- Índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_classifieds_active_category 
  ON classifieds(status, category_id, subcategory_id, created_at DESC) 
  WHERE status = 'active';

COMMENT ON INDEX idx_classifieds_active_location_created IS
  'Otimiza listagem de classificados ativos por território';

COMMENT ON INDEX idx_classifieds_active_category IS
  'Otimiza listagem de classificados ativos por categoria';

-- ── 8. Estatísticas finais ───────────────────────────────────────────────────

DO $$
DECLARE
  v_active INTEGER;
  v_inactive INTEGER;
  v_with_urls INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_active FROM classifieds WHERE status = 'active';
  SELECT COUNT(*) INTO v_inactive FROM classifieds WHERE status = 'inactive';
  SELECT COUNT(*) INTO v_with_urls 
    FROM classifieds 
   WHERE public_id IS NOT NULL 
     AND slug IS NOT NULL 
     AND category_id IS NOT NULL 
     AND subcategory_id IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTATÍSTICAS FINAIS:';
  RAISE NOTICE '  Ativos: %', v_active;
  RAISE NOTICE '  Inativos: %', v_inactive;
  RAISE NOTICE '  Com dados completos para URL: %', v_with_urls;
END $$;
