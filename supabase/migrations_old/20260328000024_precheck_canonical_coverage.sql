-- ============================================================================
-- PRÉ-CHECK ETAPA 12: Validação de Cobertura Canônica
-- ============================================================================
-- 
-- Objetivo: Validar quantos registros já migraram para modelo canônico
-- antes de endurecer constraints ou remover campos legados.
--
-- Executar este script e analisar resultados antes de prosseguir.
-- ============================================================================

-- ============================================================================
-- 1. USER_RESIDENCES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== USER_RESIDENCES ===';
  RAISE NOTICE 'Total de registros: %', (SELECT COUNT(*) FROM user_residences);
  RAISE NOTICE 'Com address_id: %', (SELECT COUNT(*) FROM user_residences WHERE address_id IS NOT NULL);
  RAISE NOTICE 'Com location_id: %', (SELECT COUNT(*) FROM user_residences WHERE location_id IS NOT NULL);
  RAISE NOTICE 'Com ambos (address_id + location_id): %', (SELECT COUNT(*) FROM user_residences WHERE address_id IS NOT NULL AND location_id IS NOT NULL);
  RAISE NOTICE 'Apenas legado (sem canônico): %', (SELECT COUNT(*) FROM user_residences WHERE address_id IS NULL AND location_id IS NULL);
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 2. BUSINESS_DATA
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== BUSINESS_DATA ===';
  RAISE NOTICE 'Total de registros: %', (SELECT COUNT(*) FROM business_data);
  RAISE NOTICE 'Com location_id: %', (SELECT COUNT(*) FROM business_data WHERE location_id IS NOT NULL);
  RAISE NOTICE 'Com address_id: %', (SELECT COUNT(*) FROM business_data WHERE address_id IS NOT NULL);
  RAISE NOTICE 'Com ambos (address_id + location_id): %', (SELECT COUNT(*) FROM business_data WHERE address_id IS NOT NULL AND location_id IS NOT NULL);
  RAISE NOTICE 'Apenas legado (address/lat/lng): %', (SELECT COUNT(*) FROM business_data WHERE location_id IS NULL AND (address IS NOT NULL OR latitude IS NOT NULL));
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 3. PROFESSIONAL_DATA
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== PROFESSIONAL_DATA ===';
  RAISE NOTICE 'Total de registros: %', (SELECT COUNT(*) FROM professional_data);
  RAISE NOTICE 'Com location_id: %', (SELECT COUNT(*) FROM professional_data WHERE location_id IS NOT NULL);
  RAISE NOTICE 'Com address_id: %', (SELECT COUNT(*) FROM professional_data WHERE address_id IS NOT NULL);
  RAISE NOTICE 'Com ambos (address_id + location_id): %', (SELECT COUNT(*) FROM professional_data WHERE address_id IS NOT NULL AND location_id IS NOT NULL);
  RAISE NOTICE 'Com metadata.location legado: %', (SELECT COUNT(*) FROM professional_data WHERE metadata ? 'location' AND location_id IS NULL);
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 4. RIDE_REQUESTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== RIDE_REQUESTS ===';
  RAISE NOTICE 'Total de registros: %', (SELECT COUNT(*) FROM ride_requests);
  RAISE NOTICE 'Com pickup_address_id: %', (SELECT COUNT(*) FROM ride_requests WHERE pickup_address_id IS NOT NULL);
  RAISE NOTICE 'Com dropoff_address_id: %', (SELECT COUNT(*) FROM ride_requests WHERE dropoff_address_id IS NOT NULL);
  RAISE NOTICE 'Com pickup_location_id: %', (SELECT COUNT(*) FROM ride_requests WHERE pickup_location_id IS NOT NULL);
  RAISE NOTICE 'Com dropoff_location_id: %', (SELECT COUNT(*) FROM ride_requests WHERE dropoff_location_id IS NOT NULL);
  RAISE NOTICE 'Com todos 4 campos canônicos: %', (
    SELECT COUNT(*) FROM ride_requests 
    WHERE pickup_address_id IS NOT NULL 
      AND dropoff_address_id IS NOT NULL 
      AND pickup_location_id IS NOT NULL 
      AND dropoff_location_id IS NOT NULL
  );
  RAISE NOTICE 'Apenas legado (origin/destination): %', (
    SELECT COUNT(*) FROM ride_requests 
    WHERE pickup_address_id IS NULL 
      AND (origin IS NOT NULL OR pickup_location IS NOT NULL)
  );
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- RESUMO FINAL
-- ============================================================================

DO $$
DECLARE
  ur_canonical_pct NUMERIC;
  bd_canonical_pct NUMERIC;
  pd_canonical_pct NUMERIC;
  rr_canonical_pct NUMERIC;
BEGIN
  -- Calcular percentuais
  SELECT 
    CASE WHEN COUNT(*) > 0 
    THEN ROUND(100.0 * COUNT(*) FILTER (WHERE address_id IS NOT NULL AND location_id IS NOT NULL) / COUNT(*), 2)
    ELSE 0 
    END INTO ur_canonical_pct
  FROM user_residences;

  SELECT 
    CASE WHEN COUNT(*) > 0 
    THEN ROUND(100.0 * COUNT(*) FILTER (WHERE location_id IS NOT NULL) / COUNT(*), 2)
    ELSE 0 
    END INTO bd_canonical_pct
  FROM business_data;

  SELECT 
    CASE WHEN COUNT(*) > 0 
    THEN ROUND(100.0 * COUNT(*) FILTER (WHERE location_id IS NOT NULL) / COUNT(*), 2)
    ELSE 0 
    END INTO pd_canonical_pct
  FROM professional_data;

  SELECT 
    CASE WHEN COUNT(*) > 0 
    THEN ROUND(100.0 * COUNT(*) FILTER (
      WHERE pickup_address_id IS NOT NULL 
        AND dropoff_address_id IS NOT NULL 
        AND pickup_location_id IS NOT NULL 
        AND dropoff_location_id IS NOT NULL
    ) / COUNT(*), 2)
    ELSE 0 
    END INTO rr_canonical_pct
  FROM ride_requests;

  RAISE NOTICE '=== RESUMO DE COBERTURA CANÔNICA ===';
  RAISE NOTICE 'user_residences: % canônico', ur_canonical_pct;
  RAISE NOTICE 'business_data: % canônico', bd_canonical_pct;
  RAISE NOTICE 'professional_data: % canônico', pd_canonical_pct;
  RAISE NOTICE 'ride_requests: % canônico', rr_canonical_pct;
  RAISE NOTICE '';
  
  IF ur_canonical_pct = 100 THEN
    RAISE NOTICE '✅ user_residences: SEGURO para hardening (address_id + location_id NOT NULL)';
  ELSE
    RAISE NOTICE '⚠️  user_residences: NÃO SEGURO para hardening (ainda há registros legados)';
  END IF;

  IF rr_canonical_pct = 100 THEN
    RAISE NOTICE '✅ ride_requests: SEGURO para hardening (4 campos NOT NULL)';
  ELSE
    RAISE NOTICE '⚠️  ride_requests: NÃO SEGURO para hardening (ainda há registros legados)';
  END IF;

  IF bd_canonical_pct >= 95 THEN
    RAISE NOTICE '✅ business_data: location_id bem coberto (address_id continua opcional)';
  ELSE
    RAISE NOTICE '⚠️  business_data: location_id ainda precisa de atenção';
  END IF;

  IF pd_canonical_pct >= 95 THEN
    RAISE NOTICE '✅ professional_data: location_id bem coberto (address_id continua opcional)';
  ELSE
    RAISE NOTICE '⚠️  professional_data: location_id ainda precisa de atenção';
  END IF;
END $$;
