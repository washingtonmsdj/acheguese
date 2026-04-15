# Correção na Raiz: Rollouts Faltantes

## Problema Identificado

O seletor territorial mudava aleatoriamente entre páginas porque `activeMemberIds` alternava entre `undefined`, `Array(4)` e `Array(0)`.

### Logs do Problema

```
[useTerritoryFilter] GROUP: {activeMemberIds: undefined, finalIds: Array(4), scope: 'group'}
[useTerritoryFilter] GROUP: {activeMemberIds: Array(0), finalIds: Array(0), scope: 'none'}
```

## Causa Raiz

Os módulos `gastronomy`, `events` e `jobs` NÃO tinham rollouts configurados no banco de dados.

### Análise do Seed Original

```sql
-- src/core/rollout/sql/003_rollout_seed.sql
INSERT INTO module_rollouts (module_key, location_id, status, config)
VALUES
  ('community',   '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('business',    '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('services',    '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('mobility',    '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('classifieds', '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('ads',         '00000000-0000-0000-0000-000000000010', 'active', NULL)
  -- ❌ FALTANDO: gastronomy, events, jobs
```

### Fluxo do Bug

1. Usuário navega para `/gastronomia/ba/salvador/nordeste-de-amaralina`
2. `TerritorialLayout` resolve `currentModuleKey = ModuleKey.GASTRONOMY`
3. `useGroupAvailability(groupId, 'gastronomy')` busca rollouts no banco
4. `GroupAvailabilityService.getGroupModuleAvailability()` não encontra rollout para `gastronomy`
5. Retorna `active_member_ids: []` (array vazio)
6. `useTerritoryFilter` recebe `activeMemberIds: []` → `scope: 'none'`
7. Filtro territorial não funciona, queries retornam vazio
8. Banner "Este módulo ainda não está disponível neste território" aparece

## Correção Profissional

### 1. Migration para Adicionar Módulos ao Schema

Criado: `supabase/migrations/20260402000001_add_gastronomy_events_jobs_modules.sql`

```sql
-- Remove o constraint antigo
ALTER TABLE module_rollouts DROP CONSTRAINT IF EXISTS module_rollouts_module_key_check;

-- Adiciona o novo constraint com todos os módulos
ALTER TABLE module_rollouts ADD CONSTRAINT module_rollouts_module_key_check 
  CHECK (module_key IN (
    'community',
    'business',
    'services',
    'mobility',
    'classifieds',
    'ads',
    'gastronomy',
    'events',
    'jobs'
  ));

-- Insere os rollouts para os novos módulos em Salvador
INSERT INTO module_rollouts (module_key, location_id, status, config)
VALUES
  ('gastronomy',  '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('events',      '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('jobs',        '00000000-0000-0000-0000-000000000010', 'active', NULL)
ON CONFLICT (module_key, location_id) DO NOTHING;
```

### 2. Atualização do Seed

Atualizado: `src/core/rollout/sql/003_rollout_seed.sql`

```sql
INSERT INTO module_rollouts (module_key, location_id, status, config)
VALUES
  ('community',   '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('business',    '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('services',    '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('mobility',    '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('classifieds', '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('ads',         '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('gastronomy',  '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('events',      '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('jobs',        '00000000-0000-0000-0000-000000000010', 'active', NULL)
ON CONFLICT (module_key, location_id) DO NOTHING;
```

## Como Aplicar a Correção

### Opção 1: Aplicar Migration (Recomendado)

```bash
# Aplicar a migration no Supabase
supabase db push
```

### Opção 2: SQL Direto no Supabase Studio

Execute no SQL Editor do Supabase:

```sql
-- 1. Atualizar constraint
ALTER TABLE module_rollouts DROP CONSTRAINT IF EXISTS module_rollouts_module_key_check;
ALTER TABLE module_rollouts ADD CONSTRAINT module_rollouts_module_key_check 
  CHECK (module_key IN (
    'community', 'business', 'services', 'mobility', 'classifieds', 'ads',
    'gastronomy', 'events', 'jobs'
  ));

-- 2. Inserir rollouts
INSERT INTO module_rollouts (module_key, location_id, status, config)
VALUES
  ('gastronomy',  '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('events',      '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('jobs',        '00000000-0000-0000-0000-000000000010', 'active', NULL)
ON CONFLICT (module_key, location_id) DO NOTHING;
```

## Resultado Esperado

Após aplicar a correção:

1. ✅ `GroupAvailabilityService` encontrará rollouts para `gastronomy`, `events`, `jobs`
2. ✅ `active_member_ids` será sempre `Array(4)` (todos os membros do grupo)
3. ✅ `scope` será sempre `'group'` (nunca mais `'none'`)
4. ✅ Seletor territorial permanecerá estável ao navegar entre páginas
5. ✅ Banner de "módulo indisponível" não aparecerá mais
6. ✅ Queries retornarão dados corretamente filtrados por território

## Validação

Após aplicar, verificar nos logs:

```javascript
// ANTES (errado)
[useTerritoryFilter] GROUP: {activeMemberIds: Array(0), scope: 'none'}

// DEPOIS (correto)
[useTerritoryFilter] GROUP: {activeMemberIds: Array(4), scope: 'group'}
```

## Por Que Esta é a Correção Profissional

1. **Corrige na raiz**: Adiciona os dados faltantes no banco, não cria workarounds no código
2. **Mantém consistência**: Todos os módulos agora têm rollouts configurados
3. **Segue o SSOT**: O sistema de rollouts é a fonte única de verdade para disponibilidade de módulos
4. **Escalável**: Quando adicionar novos módulos, basta adicionar no enum + migration + seed
5. **Sem gambiarras**: Não adiciona lógica condicional ou fallbacks no código

## Arquivos Modificados

- ✅ `supabase/migrations/20260402000001_add_gastronomy_events_jobs_modules.sql` (criado)
- ✅ `src/core/rollout/sql/003_rollout_seed.sql` (atualizado)
- ✅ `src/core/rollout/types/index.ts` (já tinha os enums - correção anterior)
- ✅ `src/core/routing/components/TerritorialLayout.tsx` (já tinha o mapeamento - correção anterior)

## Status

🔴 **PENDENTE**: Migration precisa ser aplicada no banco de dados

Execute: `supabase db push` ou aplique o SQL manualmente no Supabase Studio
