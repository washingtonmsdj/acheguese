# ✅ Correção Final: Locations com Todos os Campos Obrigatórios

## Problema Identificado

A tabela `locations` possui os seguintes campos NOT NULL obrigatórios:
- `type` ✅
- `slug` ✅ (corrigido anteriormente)
- `geographic_path` ✅
- `name` ✅
- `full_name` ✅ (CORRIGIDO AGORA)
- `status` ✅ (adicionado explicitamente)

## Correções Aplicadas

### 1. Campo `full_name` Adicionado
Formato hierárquico completo:
- Estado: "Bahia"
- Cidade: "Salvador, Bahia"
- Bairro: "Itaigara, Salvador, Bahia"

### 2. Campo `geographic_path` Corrigido
Formato canônico com `/` inicial:
- ❌ Antes: `'ba'`, `'ba/salvador'`
- ✅ Agora: `'/bahia'`, `'/bahia/salvador'`, `'/bahia/salvador/itaigara'`

### 3. Campo `status` Explícito
Adicionado `status = 'active'` em todos os INSERTs

## Arquivos Atualizados

1. **supabase/migrations/20260413000002_seed_locations.sql**
   - Todos os INSERTs com campos completos
   - ON CONFLICT atualizado para incluir `full_name` e `status`

2. **APLICAR_NO_SUPABASE_SQL_EDITOR.sql**
   - Seção de locations completamente atualizada
   - Pronto para aplicação no Supabase SQL Editor

## Próximos Passos

1. ✅ Código TypeScript corrigido (validações mock IDs e coordenadas)
2. ✅ RPC functions criadas (`get_business_reviews`, `can_user_review_business`)
3. ✅ SQL de locations corrigido com TODOS os campos obrigatórios
4. ⏳ **APLICAR no Supabase SQL Editor**: `APLICAR_NO_SUPABASE_SQL_EDITOR.sql`
5. ⏳ Testar aplicação e verificar console limpo

## Comando de Teste Após Aplicação

```sql
-- Verificar se locations foram inseridas
SELECT id, name, full_name, slug, type, geographic_path, status 
FROM locations 
ORDER BY geographic_path;

-- Deve retornar 6 registros:
-- /bahia
-- /bahia/salvador
-- /bahia/salvador/barra
-- /bahia/salvador/itaigara
-- /bahia/salvador/pelourinho
-- /bahia/salvador/rio-vermelho
```

## Estrutura Completa dos INSERTs

```sql
INSERT INTO locations (
  id, 
  name, 
  full_name,           -- ✅ ADICIONADO
  slug, 
  type, 
  geographic_path,     -- ✅ CORRIGIDO (com /)
  parent_id, 
  status,              -- ✅ EXPLÍCITO
  metadata, 
  created_at, 
  updated_at
)
VALUES (...)
ON CONFLICT (geographic_path) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,  -- ✅ ADICIONADO
  slug = EXCLUDED.slug,
  parent_id = EXCLUDED.parent_id,
  status = EXCLUDED.status,        -- ✅ ADICIONADO
  metadata = EXCLUDED.metadata,
  updated_at = NOW();
```
