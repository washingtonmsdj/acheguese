# ⚠️ MIGRATION NÃO FOI APLICADA - APLICAR AGORA

## Status Atual
❌ **A migration 20260503000000_fix_spatial_search_hybrid_types.sql NÃO foi aplicada corretamente no banco**

### Erro Persistente
```
code: '42804'
message: 'structure of query does not match function result type'
details: 'Returned type numeric(10,7) does not match expected type double precision in column 3.'
```

## Como Aplicar a Migration Corretamente

### Passo 1: Abrir Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto correto
3. Vá em **SQL Editor**

### Passo 2: Copiar e Executar o SQL Completo

**COPIE TODO O CONTEÚDO ABAIXO E EXECUTE NO SQL EDITOR:**

```sql
-- ============================================================================
-- Migration: Fix search_entities_hybrid RPC type mismatch
-- Description: Corrige mismatch entre DECIMAL(10,7) e DOUBLE PRECISION
-- Date: 2026-05-03
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS search_entities_hybrid(double precision, double precision, double precision, text, uuid[], integer);

-- Recreate with explicit casts to DOUBLE PRECISION
CREATE OR REPLACE FUNCTION search_entities_hybrid(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION,
  p_entity_type TEXT,
  p_location_ids UUID[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION,
  location_id UUID,
  in_territory BOOLEAN,
  slug TEXT
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_center GEOGRAPHY;
BEGIN
  v_center := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY;

  CASE p_entity_type
    
    WHEN 'business' THEN
      RETURN QUERY
      SELECT 
        b.id,
        b.name,
        b.latitude::DOUBLE PRECISION,
        b.longitude::DOUBLE PRECISION,
        ST_Distance(
          v_center, 
          ST_SetSRID(ST_MakePoint(b.longitude, b.latitude), 4326)::GEOGRAPHY
        )::DOUBLE PRECISION AS distance_meters,
        b.location_id,
        (p_location_ids IS NULL OR b.location_id = ANY(p_location_ids)) AS in_territory,
        b.slug
      FROM businesses b
      WHERE b.latitude IS NOT NULL 
        AND b.longitude IS NOT NULL
        AND b.status = 'active'
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(b.longitude, b.latitude), 4326)::GEOGRAPHY,
          p_radius_km * 1000
        )
      ORDER BY 
        in_territory DESC,
        distance_meters
      LIMIT p_limit;

    WHEN 'professional' THEN
      RETURN QUERY
      SELECT 
        pd.profile_id AS id,
        pd.professional_name AS name,
        COALESCE(a.latitude, (pd.metadata->>'latitude')::NUMERIC)::DOUBLE PRECISION AS latitude,
        COALESCE(a.longitude, (pd.metadata->>'longitude')::NUMERIC)::DOUBLE PRECISION AS longitude,
        ST_Distance(
          v_center,
          ST_SetSRID(
            ST_MakePoint(
              COALESCE(a.longitude, (pd.metadata->>'longitude')::NUMERIC),
              COALESCE(a.latitude, (pd.metadata->>'latitude')::NUMERIC)
            ), 
            4326
          )::GEOGRAPHY
        )::DOUBLE PRECISION AS distance_meters,
        pd.location_id,
        (p_location_ids IS NULL OR pd.location_id = ANY(p_location_ids)) AS in_territory,
        pd.slug
      FROM professional_data pd
      LEFT JOIN addresses a ON pd.address_id = a.id
      WHERE (a.latitude IS NOT NULL OR (pd.metadata->>'latitude') IS NOT NULL)
        AND (a.longitude IS NOT NULL OR (pd.metadata->>'longitude') IS NOT NULL)
        AND pd.is_accepting_clients = true
        AND ST_DWithin(
          v_center,
          ST_SetSRID(
            ST_MakePoint(
              COALESCE(a.longitude, (pd.metadata->>'longitude')::NUMERIC),
              COALESCE(a.latitude, (pd.metadata->>'latitude')::NUMERIC)
            ), 
            4326
          )::GEOGRAPHY,
          p_radius_km * 1000
        )
      ORDER BY 
        in_territory DESC,
        distance_meters
      LIMIT p_limit;

    ELSE
      RAISE EXCEPTION 'Hybrid search not implemented for entity type: %', p_entity_type;
  END CASE;
END;
$$;

COMMENT ON FUNCTION search_entities_hybrid IS 
  'Hybrid search combining radius with territorial prioritization. Returns DOUBLE PRECISION for all numeric fields.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_entities_hybrid TO authenticated, anon;
```

### Passo 3: Verificar Aplicação

Após executar o SQL, você deve ver:
- ✅ `DROP FUNCTION` (pode dar aviso se não existia)
- ✅ `CREATE OR REPLACE FUNCTION` (sucesso)
- ✅ `COMMENT ON FUNCTION` (sucesso)
- ✅ `GRANT EXECUTE` (sucesso)

### Passo 4: Confirmar a Função Foi Atualizada

No SQL Editor, execute:

```sql
SELECT 
  proname,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'search_entities_hybrid';
```

**Resultado esperado:**
```
proname: search_entities_hybrid
return_type: TABLE(id uuid, name text, latitude double precision, longitude double precision, distance_meters double precision, location_id uuid, in_territory boolean, slug text)
```

**⚠️ IMPORTANTE:** Confirme que `latitude`, `longitude` e `distance_meters` aparecem como **`double precision`** (NÃO `numeric`).

## Após Aplicar a Migration

Execute no terminal do projeto:

```bash
node scripts/validate-ai-phase1.mjs
```

**Resultado esperado:**
```
✅ RPC Geoespacial: ✅
✅ Busca de Profissionais: ✅
✅ Busca de Empresas: ✅
✅ Perfis Gastronômicos: ✅
```

## Troubleshooting

### Se o erro persistir:

1. **Verifique se está no projeto correto** no Supabase Dashboard
2. **Verifique se o SQL foi executado completamente** (todas as 4 operações)
3. **Tente dropar a função manualmente primeiro:**
   ```sql
   DROP FUNCTION IF EXISTS search_entities_hybrid;
   ```
   Depois execute o CREATE novamente

4. **Verifique permissões:**
   ```sql
   SELECT has_function_privilege('authenticated', 'search_entities_hybrid(double precision, double precision, double precision, text, uuid[], integer)', 'EXECUTE');
   ```
   Deve retornar `true`

## Próximos Passos (Após Migration Aplicada)

1. ✅ Validação automatizada passa
2. Testar 6 queries em `/buscar`
3. Validar URLs gastronômicas
4. Rodar gates: lint, typecheck, build
5. Relatório final: **APROVADA** ou **REPROVADA**

---

**Status:** ⏳ Aguardando aplicação manual da migration no Supabase Dashboard
