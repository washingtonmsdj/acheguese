# Correção Foreign Key - Gastronomy Migration

**Data**: 2026-04-01  
**Status**: ✅ Corrigido

## Erro Original

```
ERROR: 42830: there is no unique constraint matching given keys for referenced table "business_data"
```

## Causa Raiz

A migration tentava criar foreign keys referenciando `business_data(profile_id)`, mas essa coluna não tem constraint UNIQUE:

```sql
-- ❌ ERRO: profile_id não é UNIQUE
business_id UUID NOT NULL REFERENCES business_data(profile_id) ON DELETE CASCADE UNIQUE
```

### Estrutura de business_data

```sql
CREATE TABLE business_data (
  id             UUID PRIMARY KEY,        -- ✅ UNIQUE (PK)
  profile_id     UUID NOT NULL,           -- ❌ NÃO É UNIQUE
  business_name  TEXT NOT NULL,
  ...
);
```

## Solução Aplicada

Alteradas as foreign keys para referenciar `business_data(id)` (Primary Key) em vez de `profile_id`:

### 1. gastronomy_profiles
```sql
-- ✅ CORRIGIDO
business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE UNIQUE
```

### 2. menus
```sql
-- ✅ CORRIGIDO
business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE
```

### 3. menu_promotions
```sql
-- ✅ CORRIGIDO
business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE
```

## Impacto da Mudança

### Antes (Incorreto)
- `gastronomy_profiles.business_id` → `business_data.profile_id`
- `menus.business_id` → `business_data.profile_id`
- `menu_promotions.business_id` → `business_data.profile_id`

### Depois (Correto)
- `gastronomy_profiles.business_id` → `business_data.id`
- `menus.business_id` → `business_data.id`
- `menu_promotions.business_id` → `business_data.id`

## Ajustes Necessários no Código

O código TypeScript precisa ser atualizado para usar `business_data.id` em vez de `profile_id`:

### GastronomyQueryService.ts

```typescript
// ❌ ANTES
const { data: profiles } = await supabase
  .from('gastronomy_profiles')
  .select('business_id')
  .eq('status', 'active');

const businessIds = profiles.map(p => p.business_id); // profile_id

// ✅ DEPOIS
const { data: profiles } = await supabase
  .from('gastronomy_profiles')
  .select('business_id')
  .eq('status', 'active');

const businessIds = profiles.map(p => p.business_id); // business_data.id

// Depois buscar business_data:
const { data: businesses } = await supabase
  .from('business_data')
  .select('*, profiles!inner(*)')
  .in('id', businessIds); // ✅ Usar id, não profile_id
```

## Validação

Após aplicar a migration corrigida:

```sql
-- Verificar que as FKs foram criadas corretamente
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE 'gastronomy%' OR tc.table_name LIKE 'menu%';
```

Resultado esperado:
```
table_name           | column_name | foreign_table_name | foreign_column_name
---------------------|-------------|--------------------|-----------------
gastronomy_profiles  | business_id | business_data      | id
menus                | business_id | business_data      | id
menu_promotions      | business_id | business_data      | id
```

## Próximos Passos

1. ✅ Migration corrigida em `20260331000002_create_gastronomy_module.sql`
2. ⏳ Aplicar migration no Supabase Dashboard
3. ⏳ Atualizar `GastronomyQueryService.ts` se necessário
4. ⏳ Testar queries de gastronomia

## Arquivo Atualizado

- `supabase/migrations/20260331000002_create_gastronomy_module.sql`
