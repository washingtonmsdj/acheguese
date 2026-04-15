# Core Territorial Module

**Status**: ✅ FUNDAÇÃO COMPLETA  
**Versão**: 1.0.0  
**Data**: 2026-03-28

---

## Visão Geral

Módulo responsável por **grupos territoriais** (agrupamentos funcionais de bairros).

**NÃO confundir com**:
- `core/location`: Hierarquia territorial oficial (SSOT)
- `core/coverage`: Cobertura de entidades (quem atende onde)
- `core/rollout`: Ativação de módulos por território

---

## Responsabilidades

### O que este módulo faz ✅

- Gerenciar grupos territoriais (agrupamentos de bairros)
- Resolver membros de um grupo (bairros que compõem o grupo)
- Verificar disponibilidade de módulo por grupo
- Ativar/desativar módulo para grupo inteiro
- Reconciliar rollout após mudança de membros
- Verificar se bairro pertence a grupo
- Listar grupos que contêm um bairro

### O que este módulo NÃO faz ❌

- Gerenciar hierarquia territorial oficial (use `core/location`)
- Criar bairros fake em `locations` (grupos são entidade separada)
- Definir cobertura de entidades (use `core/coverage`)
- Controlar rollout individual de bairros (use `core/rollout`)
- Geocoding ou coordenadas (use `integrations/maps`)

---

## Estrutura

```
src/core/territorial/
├── services/
│   ├── TerritorialGroupService.ts          # CRUD e queries de grupos
│   └── __tests__/
│       └── TerritorialGroupService.test.ts
├── GroupAvailabilityService.ts             # Disponibilidade de módulo por grupo
├── TerritorialRolloutService.ts            # Operações administrativas de rollout
├── types.ts                                # Tipos públicos
├── index.ts                                # Barrel export
├── TERRITORIAL_GROUPS_SEMANTICS.md         # Documentação de semântica
└── README.md                               # Este arquivo
```

---

## Uso Básico

### 1. Criar Grupo

```typescript
import { territorialGroupService } from '@/core/territorial';

// Criar grupo vazio (inativo)
const group = await territorialGroupService.createGroup({
  slug: 'orla-de-salvador',
  name: 'Orla de Salvador',
  description: 'Bairros da orla marítima',
  anchor_city_id: 'loc-salvador',
});

// Criar grupo com membros iniciais
const groupWithMembers = await territorialGroupService.createGroup({
  slug: 'zona-turistica',
  name: 'Zona Turística',
  anchor_city_id: 'loc-salvador',
  member_location_ids: ['loc-barra', 'loc-rio-vermelho'],
});
```

### 2. Gerenciar Membros

```typescript
// Adicionar membros
await territorialGroupService.addMembers('tg-orla', ['loc-ondina', 'loc-amaralina']);

// Remover membros
await territorialGroupService.removeMembers('tg-orla', ['loc-amaralina']);

// Substituir todos os membros (transacional)
await territorialGroupService.replaceMembers('tg-orla', ['loc-barra', 'loc-rio-vermelho']);
```

### 3. Atualizar Grupo

```typescript
// Atualizar nome
await territorialGroupService.updateGroup('tg-orla', {
  name: 'Orla Marítima de Salvador',
});

// Atualizar slug
await territorialGroupService.updateGroup('tg-orla', {
  slug: 'orla-maritima',
});

// Ativar grupo (requer pelo menos 1 membro)
await territorialGroupService.activateGroup('tg-orla');

// Desativar grupo
await territorialGroupService.deactivateGroup('tg-orla');
```

### 4. Buscar Grupo

```typescript
// Por ID
const group = await territorialGroupService.getGroupById('tg-complexo-nordeste');

// Por slug e cidade
const group = await territorialGroupService.getGroupBySlugAndCity(
  'complexo-do-nordeste-de-amaralina',
  'loc-salvador'
);

// Com membros
const groupWithMembers = await territorialGroupService.getGroupWithMembers('tg-complexo-nordeste');
```

### 5. Resolver Membros

```typescript
// Apenas membros ativos
const activeMembers = await territorialGroupService.listActiveMembers('tg-complexo-nordeste');

// Todos os membros (incluindo inativos)
const allMembers = await territorialGroupService.listAllMembers('tg-complexo-nordeste');

// Apenas IDs (para filtro)
const locationIds = await territorialGroupService.resolveGroupToLocationIds('tg-complexo-nordeste');
// Retorna: ['loc-nordeste-de-amaralina', 'loc-santa-cruz', ...]
```

### 6. Verificar Membership

```typescript
// Verificar se bairro pertence a grupo
const isMember = await territorialGroupService.isMemberOfGroup(
  'loc-nordeste-de-amaralina',
  'tg-complexo-nordeste'
);

// Buscar grupos que contêm um bairro
const groups = await territorialGroupService.findGroupsContainingLocation('loc-nordeste-de-amaralina');
```

### 7. Verificar Disponibilidade de Módulo

```typescript
import { groupAvailabilityService } from '@/core/territorial';
import { ModuleKey } from '@/core/rollout/types';

const availability = await groupAvailabilityService.getGroupModuleAvailability(
  'tg-complexo-nordeste',
  ModuleKey.COMMUNITY
);

// availability.availability: 'full' | 'partial' | 'none'
// availability.active_member_ids: ['loc-nordeste', 'loc-santa-cruz']
```

### 8. Ativar Módulo para Grupo (Admin)

```typescript
import { territorialRolloutService } from '@/core/territorial';
import { RolloutStatus } from '@/core/rollout/types';

const result = await territorialRolloutService.activateRolloutForGroup({
  group_id: 'tg-complexo-nordeste',
  module_key: ModuleKey.MOBILITY,
  status: RolloutStatus.ACTIVE
});

// result.applied_to: ['loc-nordeste', 'loc-santa-cruz', ...]
// result.skipped: []  (membros inativos)
```

---

## Integração com Filtro Territorial

### TerritoryFilter

```typescript
import { useTerritoryFilter } from '@/core/location';

// Em componente de rota territorial
const { resolved } = useTerritorialContext();
const filter = useTerritoryFilter(resolved);

// filter.scope === 'location' → bairro único
// filter.scope === 'group'    → grupo de bairros
// filter.scope === 'none'     → sem filtro
```

### Aplicação em Queries

```typescript
// Exemplo: buscar businesses
let query = supabase.from('business_data').select('*');

if (filter.scope === 'location') {
  query = query.eq('location_id', filter.location_id);
} else if (filter.scope === 'group') {
  query = query.in('location_id', filter.location_ids);
} else {
  // scope === 'none': não executar query ou retornar vazio
  return [];
}

const { data } = await query;
```

---

## Regras de Negócio

### 1. Grupos NÃO São Locations

```typescript
// ❌ ERRADO
const group = await locationService.getLocationById('tg-complexo-nordeste');

// ✅ CORRETO
const group = await territorialGroupService.getGroupById('tg-complexo-nordeste');
```

### 2. Membros São Sempre Districts

```typescript
// ✅ CORRETO
group.members.every(m => m.type === 'district')

// ❌ ERRADO
group.members.some(m => m.type === 'city')
```

### 3. Membros Inativos São Ignorados

```typescript
// Apenas membros ativos
const activeMembers = await territorialGroupService.listActiveMembers(groupId);

// Todos os membros (incluindo inativos)
const allMembers = await territorialGroupService.listAllMembers(groupId);
```

### 4. Slug Único por Cidade

```sql
CONSTRAINT territorial_groups_slug_city_unique UNIQUE (slug, anchor_city_id)
```

---

## Testes

**Arquivo**: `services/__tests__/TerritorialGroupService.test.ts`

**Cobertura**: 42 testes

**READ Operations** (17 testes):
- getGroupById: 3 testes
- getGroupBySlugAndCity: 2 testes
- getGroupWithMembers: 1 teste
- listActiveMembers: 1 teste
- listAllMembers: 1 teste
- findGroupsContainingLocation: 2 testes
- resolveGroupToLocationIds: 2 testes
- isMemberOfGroup: 2 testes
- isGroupActive: 2 testes
- listAllGroups: 1 teste

**WRITE Operations** (25 testes):
- createGroup: 6 testes (válido, com membros, slug duplicado, cidade inexistente, cidade não-city, campos vazios)
- updateGroup: 5 testes (nome, slug, slug duplicado, ativação vazio, grupo inexistente)
- activateGroup: 2 testes (com membros, grupo vazio)
- deactivateGroup: 1 teste
- addMembers: 5 testes (válido, outra cidade, não-district, inexistente, duplicatas)
- removeMembers: 2 testes (válido, grupo inexistente)
- replaceMembers: 4 testes (válido, grupo ativo vazio, grupo inativo vazio, validação)

**Status**: ✅ 42/42 passed

---

## Validações Implementadas

### Criação de Grupo
- ✅ Slug, name, anchor_city_id obrigatórios
- ✅ Cidade âncora deve existir
- ✅ Cidade âncora deve ser do tipo 'city'
- ✅ Slug único por cidade
- ✅ Grupo criado como 'inactive' por padrão

### Atualização de Grupo
- ✅ Slug único por cidade (se mudando)
- ✅ Grupo ativo deve ter pelo menos 1 membro

### Membership
- ✅ Membro deve existir
- ✅ Membro deve ser do tipo 'district'
- ✅ Membro deve pertencer à cidade âncora
- ✅ Membro deve estar ativo
- ✅ Duplicatas ignoradas silenciosamente
- ✅ Grupo ativo não pode ficar vazio

---

## Referências

- [TERRITORIAL_GROUPS_SEMANTICS.md](./TERRITORIAL_GROUPS_SEMANTICS.md) - Semântica formal
- [TERRITORIAL_FOUNDATION.md](../../docs/TERRITORIAL_FOUNDATION.md) - Fundação territorial
- [GEOGRAPHIC_FOUNDATION.md](../../docs/GEOGRAPHIC_FOUNDATION.md) - Fundação geográfica

---

**Versão**: 1.0.0  
**Status**: ✅ FUNDAÇÃO COMPLETA (READ + WRITE)
