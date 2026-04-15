# ETAPA 1 - COMANDOS SQL PARA APLICAR

**Data**: 04/04/2026  
**Objetivo**: Aplicar migrations da ETAPA 1 no banco de dados

---

## 📋 ORDEM DE EXECUÇÃO

Execute as migrations nesta ordem exata:

1. `20260404000001_add_spatial_search_foundation.sql`
2. `20260404000002_add_spatial_search_functions.sql`
3. `20260404000003_add_coverage_system.sql`

---

## 🚀 COMO APLICAR

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# Aplicar todas as migrations pendentes
supabase db push

# Ou aplicar manualmente cada migration
supabase db execute --file supabase/migrations/20260404000001_add_spatial_search_foundation.sql
supabase db execute --file supabase/migrations/20260404000002_add_spatial_search_functions.sql
supabase db execute --file supabase/migrations/20260404000003_add_coverage_system.sql
```

### Opção 2: Via Dashboard do Supabase

1. Acesse o Dashboard do Supabase
2. Vá em "SQL Editor"
3. Cole o conteúdo de cada migration na ordem
4. Execute uma por vez

### Opção 3: Via psql

```bash
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260404000001_add_spatial_search_foundation.sql
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260404000002_add_spatial_search_functions.sql
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260404000003_add_coverage_system.sql
```

---

## ✅ VERIFICAÇÃO

Após aplicar as migrations, execute estas queries para verificar:

### 1. Verificar Colunas Adicionadas

```sql
-- Verificar coluna point em business_data
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'business_data' 
  AND column_name = 'point';

-- Verificar coluna point em classifieds
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'classifieds' 
  AND column_name = 'point';

-- Verificar coluna point em events
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name = 'point';

-- Verificar coluna point em community_alerts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'community_alerts' 
  AND column_name = 'point';

-- Verificar coluna point em tourist_points
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tourist_points' 
  AND column_name = 'point';
```

### 2. Verificar Índices Espaciais

```sql
-- Listar índices GiST criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE '%_point_gist'
ORDER BY tablename;
```

### 3. Verificar Funções RPC

```sql
-- Listar funções criadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'search_entities_by_radius',
    'search_entities_by_bounds',
    'search_entities_hybrid',
    'calculate_distance_meters',
    'check_coverage',
    'get_coverage_areas',
    'add_coverage_by_radius',
    'add_coverage_by_location',
    'remove_coverage',
    'find_entities_with_coverage'
  )
ORDER BY routine_name;
```

### 4. Verificar Triggers

```sql
-- Listar triggers de sincronização
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_sync_%_point'
ORDER BY event_object_table;
```

### 5. Verificar Dados Sincronizados

```sql
-- Contar registros com point sincronizado em business_data
SELECT 
  COUNT(*) as total,
  COUNT(point) as with_point,
  COUNT(*) - COUNT(point) as without_point
FROM business_data
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Contar registros com point sincronizado em classifieds
SELECT 
  COUNT(*) as total,
  COUNT(point) as with_point,
  COUNT(*) - COUNT(point) as without_point
FROM classifieds
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

### 6. Testar Busca Espacial

```sql
-- Testar busca por raio (empresas em Salvador)
SELECT * FROM search_entities_by_radius(
  -12.9714,  -- latitude
  -38.5014,  -- longitude
  2.0,       -- raio em km
  'business', -- tipo de entidade
  NULL,      -- location_id (opcional)
  10,        -- limit
  0          -- offset
);

-- Testar busca por bounds
SELECT * FROM search_entities_by_bounds(
  -38.52,    -- west
  -12.98,    -- south
  -38.48,    -- east
  -12.96,    -- north
  'business', -- tipo de entidade
  NULL,      -- location_id (opcional)
  10         -- limit
);

-- Testar cálculo de distância
SELECT calculate_distance_meters(
  -12.9714, -38.5014,  -- ponto 1
  -12.9800, -38.5100   -- ponto 2
) as distance_meters;
```

### 7. Testar Sistema de Cobertura

```sql
-- Adicionar cobertura por raio (exemplo)
SELECT add_coverage_by_radius(
  'business',           -- entity_type
  'biz-123',           -- entity_id (substitua por ID real)
  -12.9714,            -- center_latitude
  -38.5014,            -- center_longitude
  5.0                  -- radius_km
);

-- Listar áreas de cobertura
SELECT * FROM get_coverage_areas(
  'business',          -- entity_type
  'biz-123'           -- entity_id (substitua por ID real)
);

-- Verificar cobertura
SELECT * FROM check_coverage(
  'business',          -- entity_type
  'biz-123',          -- entity_id (substitua por ID real)
  -12.9714,           -- user_latitude
  -38.5014            -- user_longitude
);
```

---

## 🔄 ROLLBACK (Se Necessário)

Se precisar reverter as migrations:

```sql
-- ATENÇÃO: Isso vai remover todas as alterações da ETAPA 1

-- 1. Remover triggers
DROP TRIGGER IF EXISTS trigger_sync_business_data_point ON business_data;
DROP TRIGGER IF EXISTS trigger_sync_classifieds_point ON classifieds;
DROP TRIGGER IF EXISTS trigger_sync_events_point ON events;
DROP TRIGGER IF EXISTS trigger_sync_community_alerts_point ON community_alerts;
DROP TRIGGER IF EXISTS trigger_sync_tourist_points_point ON tourist_points;
DROP TRIGGER IF EXISTS trigger_sync_gastronomy_places_point ON gastronomy_places;

-- 2. Remover funções
DROP FUNCTION IF EXISTS sync_business_data_point();
DROP FUNCTION IF EXISTS sync_classifieds_point();
DROP FUNCTION IF EXISTS sync_events_point();
DROP FUNCTION IF EXISTS sync_community_alerts_point();
DROP FUNCTION IF EXISTS sync_tourist_points_point();
DROP FUNCTION IF EXISTS sync_gastronomy_places_point();
DROP FUNCTION IF EXISTS search_entities_by_radius(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS search_entities_by_bounds(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS search_entities_hybrid(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, UUID[], INTEGER);
DROP FUNCTION IF EXISTS calculate_distance_meters(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS check_coverage(TEXT, UUID, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS get_coverage_areas(TEXT, UUID);
DROP FUNCTION IF EXISTS add_coverage_by_radius(TEXT, UUID, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS add_coverage_by_location(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS remove_coverage(UUID);
DROP FUNCTION IF EXISTS find_entities_with_coverage(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);

-- 3. Remover colunas
ALTER TABLE business_data DROP COLUMN IF EXISTS point;
ALTER TABLE classifieds DROP COLUMN IF EXISTS point;
ALTER TABLE events DROP COLUMN IF EXISTS point;
ALTER TABLE community_alerts DROP COLUMN IF EXISTS point;
ALTER TABLE tourist_points DROP COLUMN IF EXISTS point;
ALTER TABLE gastronomy_places DROP COLUMN IF EXISTS point;

ALTER TABLE service_areas DROP COLUMN IF EXISTS coverage_type;
ALTER TABLE service_areas DROP COLUMN IF EXISTS center_latitude;
ALTER TABLE service_areas DROP COLUMN IF EXISTS center_longitude;
ALTER TABLE service_areas DROP COLUMN IF EXISTS radius_km;
ALTER TABLE service_areas DROP COLUMN IF EXISTS coverage_polygon;
```

---

## 📊 IMPACTO ESPERADO

### Performance

- ✅ Queries espaciais 10-100x mais rápidas com índices GiST
- ✅ Busca por raio em <100ms para até 10.000 registros
- ✅ Busca por bounds em <50ms para viewport típico

### Armazenamento

- Aumento de ~8 bytes por registro (coluna point)
- Aumento de ~10-20% no tamanho dos índices
- Total: ~5-10 MB para 100.000 registros

### Compatibilidade

- ✅ 100% compatível com dados existentes
- ✅ Sincronização automática de coordenadas
- ✅ Sem quebra de funcionalidades existentes

---

## 🆘 TROUBLESHOOTING

### Erro: "extension postgis does not exist"

```sql
-- Habilitar PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Erro: "column point already exists"

As migrations usam `IF NOT EXISTS`, então são idempotentes. Se o erro persistir:

```sql
-- Verificar se coluna existe
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'business_data' AND column_name = 'point';

-- Se existir, pular a migration ou remover a coluna primeiro
```

### Erro: "function already exists"

```sql
-- Remover função existente
DROP FUNCTION IF EXISTS search_entities_by_radius;

-- Reexecutar migration
```

### Performance Lenta Após Migrations

```sql
-- Reindexar tabelas
REINDEX TABLE business_data;
REINDEX TABLE classifieds;
REINDEX TABLE events;
REINDEX TABLE community_alerts;
REINDEX TABLE tourist_points;

-- Atualizar estatísticas
ANALYZE business_data;
ANALYZE classifieds;
ANALYZE events;
ANALYZE community_alerts;
ANALYZE tourist_points;
```

---

## ✅ CHECKLIST FINAL

Após aplicar as migrations, verifique:

- [ ] Todas as 3 migrations executadas sem erro
- [ ] Colunas `point` criadas em 6 tabelas
- [ ] Índices espaciais GiST criados
- [ ] Triggers de sincronização criados
- [ ] 10 funções RPC criadas
- [ ] Dados existentes sincronizados
- [ ] Testes de busca espacial funcionando
- [ ] Testes de cobertura funcionando
- [ ] Performance aceitável (<100ms para queries típicas)

---

**Documento elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Versão**: 1.0
