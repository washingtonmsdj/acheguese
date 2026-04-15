# 🔧 Correções SSOT - Erros do Console

## Problemas Identificados

### 1. IDs Mock Rejeitados (Desenvolvimento)
**Erro**: `Invalid business ID provided: mock-biz-sushi`
**Causa**: Validação muito restritiva rejeitando IDs de desenvolvimento
**Impacto**: Impossível testar em desenvolvimento

### 2. Erro MapLibre
**Erro**: `Expected value to be of type number, but found null`
**Causa**: Dados de coordenadas nulos no banco
**Impacto**: Mapa não renderiza corretamente

### 3. Erro 400 nas Reviews
**Erro**: `POST /rest/v1/rpc/get_business_reviews 400`
**Causa**: RPC function não existe ou tem assinatura incorreta
**Impacto**: Reviews não carregam

### 4. Location Not Found
**Erro**: `Location not found for path: ba/salvador/itaigara`
**Causa**: Dados de localização não existem no banco
**Impacto**: Busca por território falha

## Soluções SSOT

### Solução 1: Permitir IDs Mock em Desenvolvimento

```typescript
// src/shared/validation/id.validation.ts
export function isValidId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!value.trim()) return false;
  
  // Permitir IDs mock em desenvolvimento
  if (import.meta.env.DEV && value.startsWith('mock-')) {
    return true;
  }
  
  // UUID válido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
```

### Solução 2: Validar Coordenadas Antes de Usar

```typescript
// src/modules/gastronomy/services/menu.queries.ts
function mapToPublicFoodItem(params: {
  item: MenuItem;
  category: MenuCategory;
  menu: Menu;
  business: GastronomyBusiness;
}): PublicGastronomyFoodItem {
  const { item, category, menu, business } = params;
  const metadata = item.metadata || {};
  
  // Validar coordenadas antes de usar
  const businessLatitude = 
    typeof business.address?.latitude === 'number' && 
    !isNaN(business.address.latitude) && 
    isFinite(business.address.latitude)
      ? business.address.latitude 
      : undefined;
      
  const businessLongitude = 
    typeof business.address?.longitude === 'number' && 
    !isNaN(business.address.longitude) && 
    isFinite(business.address.longitude)
      ? business.address.longitude 
      : undefined;

  return {
    // ... resto do código
    business_latitude: businessLatitude,
    business_longitude: businessLongitude,
    // ...
  };
}
```

### Solução 3: Criar RPC Functions Faltantes

```sql
-- supabase/migrations/20260413000001_fix_review_rpc_functions.sql

-- Function: get_business_reviews
CREATE OR REPLACE FUNCTION get_business_reviews(
  p_business_profile_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  reviewer_profile_id UUID,
  reviewer_name TEXT,
  reviewer_avatar TEXT,
  rating INTEGER,
  comment TEXT,
  photos TEXT[],
  business_response TEXT,
  business_response_at TIMESTAMPTZ,
  order_id UUID,
  helpful_count INTEGER,
  not_helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  is_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.reviewer_profile_id,
    COALESCE(p.name, 'Usuário') as reviewer_name,
    p.avatar_url as reviewer_avatar,
    r.rating,
    r.comment,
    COALESCE(r.photos, ARRAY[]::TEXT[]) as photos,
    r.business_response,
    r.business_response_at,
    r.order_id,
    COALESCE(r.helpful_count, 0) as helpful_count,
    COALESCE(r.not_helpful_count, 0) as not_helpful_count,
    r.created_at,
    COALESCE(r.is_verified, false) as is_verified
  FROM reviews r
  LEFT JOIN profiles p ON p.id = r.reviewer_profile_id
  WHERE r.reviewed_profile_id = p_business_profile_id
    AND r.status = 'active'
    AND r.review_type = 'business'
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function: can_user_review_business
CREATE OR REPLACE FUNCTION can_user_review_business(
  p_user_id UUID,
  p_business_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_existing_review BOOLEAN;
  v_has_completed_order BOOLEAN;
BEGIN
  -- Verificar se já tem review
  SELECT EXISTS(
    SELECT 1 FROM reviews
    WHERE reviewer_profile_id = p_user_id
      AND reviewed_profile_id = p_business_profile_id
      AND status = 'active'
  ) INTO v_has_existing_review;
  
  IF v_has_existing_review THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se tem pedido completo (opcional - pode remover se não tiver orders)
  -- Por enquanto, permitir sempre
  RETURN TRUE;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION get_business_reviews TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_user_review_business TO authenticated, anon;
```

### Solução 4: Seed de Dados de Localização

```sql
-- supabase/migrations/20260413000002_seed_locations.sql

-- Inserir localizações de teste
INSERT INTO locations (id, name, type, geographic_path, parent_id, metadata)
VALUES
  -- Bahia
  (
    gen_random_uuid(),
    'Bahia',
    'state',
    'ba',
    NULL,
    '{"code": "BA", "region": "Nordeste"}'::jsonb
  ),
  -- Salvador
  (
    gen_random_uuid(),
    'Salvador',
    'city',
    'ba/salvador',
    (SELECT id FROM locations WHERE geographic_path = 'ba'),
    '{"population": 2900000}'::jsonb
  ),
  -- Itaigara
  (
    gen_random_uuid(),
    'Itaigara',
    'district',
    'ba/salvador/itaigara',
    (SELECT id FROM locations WHERE geographic_path = 'ba/salvador'),
    '{"zone": "Orla"}'::jsonb
  ),
  -- Pelourinho
  (
    gen_random_uuid(),
    'Pelourinho',
    'district',
    'ba/salvador/pelourinho',
    (SELECT id FROM locations WHERE geographic_path = 'ba/salvador'),
    '{"zone": "Centro Histórico", "unesco_heritage": true}'::jsonb
  )
ON CONFLICT (geographic_path) DO NOTHING;
```

## Ordem de Aplicação

1. ✅ Atualizar validação de IDs (código TypeScript)
2. ✅ Corrigir validação de coordenadas (código TypeScript)
3. ✅ Criar RPC functions (SQL)
4. ✅ Seed de localizações (SQL)

## Arquivos a Modificar

### TypeScript
- `src/shared/validation/id.validation.ts`
- `src/modules/gastronomy/services/menu.queries.ts`

### SQL
- `supabase/migrations/20260413000001_fix_review_rpc_functions.sql`
- `supabase/migrations/20260413000002_seed_locations.sql`

## Próximos Passos

1. Aplicar correções de código TypeScript
2. Criar e aplicar migrations SQL
3. Testar em desenvolvimento
4. Verificar console limpo
