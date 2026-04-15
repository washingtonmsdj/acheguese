# Correção Final: MODULE_SLUGS Faltando

## Problema Identificado

Mesmo após adicionar os rollouts no banco, o seletor ainda mudava para Salvador porque **faltavam os slugs dos módulos** em `MODULE_SLUGS`.

### Logs do Problema

```
[useTerritoryFilter] GROUP: {activeMemberIds: undefined, finalIds: Array(4), scope: 'group'}
[useTerritoryFilter] LOCATION: {locationName: 'Salvador'}
```

`activeMemberIds: undefined` → Seletor muda para cidade

## Causa Raiz

### Arquivo: `src/core/routing/utils/territoryUrls.ts`

**ANTES** (incompleto):
```typescript
export const MODULE_SLUGS = {
  community:    'comunidade',
  business:     'empresas',
  services:     'servicos',
  classifieds:  'classificados',
  mobility:     'mobilidade',
  events:       'eventos',      // ✅ Tinha
  alerts:       'alertas',
  map:          'mapa',
  guide:        'guia',
  // ❌ FALTANDO: gastronomy, jobs
} as const;
```

**DEPOIS** (completo):
```typescript
export const MODULE_SLUGS = {
  community:    'comunidade',
  business:     'empresas',
  services:     'servicos',
  classifieds:  'classificados',
  mobility:     'mobilidade',
  gastronomy:   'gastronomia',  // ✅ ADICIONADO
  events:       'eventos',
  jobs:         'vagas',         // ✅ ADICIONADO
  alerts:       'alertas',
  map:          'mapa',
  guide:        'guia',
} as const;
```

## Fluxo do Bug

### 1. Usuário Acessa Gastronomia

```
URL: /gastronomia/ba/salvador/complexo-do-nordeste-de-amaralina
```

### 2. TerritorialLayout Tenta Resolver Módulo

```typescript
// src/core/routing/components/TerritorialLayout.tsx
const currentModuleSlug = pathname.split('/').filter(Boolean)[0]; // 'gastronomia'
const currentModuleKey = SLUG_TO_MODULE_KEY[currentModuleSlug];  // undefined ❌
```

### 3. useGroupAvailability Recebe null

```typescript
const { availability, active_member_ids } = useGroupAvailability(
  groupId,
  null  // ❌ currentModuleKey é null porque slug não existe
);
```

### 4. Hook Retorna undefined

```typescript
// src/core/territorial/hooks/useGroupAvailability.ts
const enabled = Boolean(groupId && moduleKey); // false (moduleKey é null)

return {
  active_member_ids: query.data?.active_member_ids ?? [], // undefined (query não roda)
};
```

### 5. Filtro Territorial Falha

```typescript
// src/core/location/hooks/useTerritoryFilter.ts
if (resolved.kind === 'group') {
  if (activeMemberIds === undefined) {
    // ❌ Cai aqui! Usa todos os membros
    finalIds = allMemberIds;
  }
}
```

### 6. Mas Depois Muda para Location

Por algum motivo, o filtro muda de GROUP para LOCATION, fazendo o seletor mudar para Salvador.

## Correção Aplicada

### Arquivo Modificado

✅ `src/core/routing/utils/territoryUrls.ts`

Adicionados:
- `gastronomy: 'gastronomia'`
- `jobs: 'vagas'`

## Resultado Esperado

Após a correção:

```
URL: /gastronomia/ba/salvador/complexo-do-nordeste-de-amaralina
↓
currentModuleSlug = 'gastronomia'
↓
currentModuleKey = ModuleKey.GASTRONOMY ✅
↓
useGroupAvailability(groupId, ModuleKey.GASTRONOMY) → enabled = true ✅
↓
active_member_ids = [id1, id2, id3, id4] ✅
↓
useTerritoryFilter → scope: 'group' ✅
↓
Seletor permanece no Complexo ✅
```

## Correções Completas Aplicadas

### 1. Enum ModuleKey
✅ `src/core/rollout/types/index.ts`
- Adicionado `GASTRONOMY`, `EVENTS`, `JOBS`

### 2. Mapeamento SLUG_TO_MODULE_KEY
✅ `src/core/routing/components/TerritorialLayout.tsx`
- Adicionado mapeamento para os 3 módulos

### 3. MODULE_SLUGS
✅ `src/core/routing/utils/territoryUrls.ts`
- Adicionado `gastronomy: 'gastronomia'`
- Adicionado `jobs: 'vagas'`

### 4. Rollouts no Banco
✅ Banco de dados remoto
- Inseridos rollouts para `gastronomy`, `events`, `jobs` em Salvador

## Status

✅ **TODAS as correções aplicadas**  
✅ **Teste agora**: Navegue para gastronomia e veja se o seletor permanece estável

---

**Data**: 2026-04-02  
**Arquivo**: `src/core/routing/utils/territoryUrls.ts`  
**Mudança**: Adicionado `gastronomy` e `jobs` ao `MODULE_SLUGS`
