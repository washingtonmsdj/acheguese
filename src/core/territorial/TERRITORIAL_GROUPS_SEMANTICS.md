# SEMÂNTICA FORMAL - GRUPOS TERRITORIAIS

**Data**: 2026-03-28  
**Versão**: 1.0.0  
**Status**: ✅ OFICIAL

---

## 1. DEFINIÇÃO

### O que é um Grupo Territorial?

Um **grupo territorial** é um agrupamento funcional/comunitário/comercial de bairros oficiais.

**NÃO É**:
- ❌ Território oficial (country/state/city/district)
- ❌ Bairro fake em `locations`
- ❌ Hierarquia administrativa
- ❌ Substituição de bairros oficiais

**É**:
- ✅ Agrupamento de múltiplos bairros (districts)
- ✅ Entidade separada em `territorial_groups`
- ✅ Slug próprio para URLs
- ✅ Status independente (active/inactive)
- ✅ Pertence a uma cidade âncora

---

## 2. REGRAS FUNDAMENTAIS

### Regra 1: Separação Absoluta

```
locations                    → Territórios oficiais (IBGE, Prefeitura)
territorial_groups           → Agrupamentos funcionais
territorial_group_members    → Vínculo entre grupo e bairros
```

**Proibido**:
- Criar bairro fake em `locations` para representar grupo
- Misturar hierarquia oficial com agrupamento funcional
- Usar `parent_id` para representar grupo

### Regra 2: Membros São Sempre Districts

```sql
-- ✅ CORRETO
INSERT INTO territorial_group_members (group_id, location_id)
VALUES ('tg-complexo', 'loc-nordeste-de-amaralina');  -- district

-- ❌ ERRADO
INSERT INTO territorial_group_members (group_id, location_id)
VALUES ('tg-complexo', 'loc-salvador');  -- city (não permitido)
```

**Constraint**: Trigger `check_territorial_group_member` valida que `location_id` é district.

### Regra 3: Cidade Âncora

Todos os membros de um grupo devem pertencer à mesma cidade âncora.

```sql
-- ✅ CORRETO
territorial_groups.anchor_city_id = 'loc-salvador'
members: nordeste-de-amaralina (parent=salvador), santa-cruz (parent=salvador)

-- ❌ ERRADO
territorial_groups.anchor_city_id = 'loc-salvador'
members: nordeste-de-amaralina (parent=salvador), copacabana (parent=rio-de-janeiro)
```

**Constraint**: Trigger valida que `location.parent_id = group.anchor_city_id`.

### Regra 4: Slug Único por Cidade

```sql
CONSTRAINT territorial_groups_slug_city_unique UNIQUE (slug, anchor_city_id)
```

**Permite**:
- Grupo "centro" em Salvador
- Grupo "centro" em São Paulo

**Proíbe**:
- Dois grupos "centro" em Salvador

---

## 3. ESTRUTURA DE DADOS

### Tabela `territorial_groups`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `slug` | TEXT | Slug para URLs (ex: complexo-do-nordeste-de-amaralina) |
| `name` | TEXT | Nome público (ex: Complexo do Nordeste de Amaralina) |
| `description` | TEXT | Descrição opcional |
| `anchor_city_id` | UUID | FK para `locations` (cidade âncora) |
| `status` | TEXT | active / inactive |
| `metadata` | JSONB | Metadados opcionais |

### Tabela `territorial_group_members`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `group_id` | UUID | FK para `territorial_groups` |
| `location_id` | UUID | FK para `locations` (district) |
| `created_at` | TIMESTAMPTZ | Data de adição ao grupo |

**Constraint**: `UNIQUE (group_id, location_id)` (bairro não pode estar duplicado no mesmo grupo).

---

## 4. SEMÂNTICA DE USO

### Caso 1: Filtro Territorial por Grupo

**Cenário**: Usuário acessa `/br/ba/salvador/area/complexo-do-nordeste-de-amaralina`

**Resolução**:
```typescript
// 1. Resolver grupo
const group = await territorialGroupService.getGroupBySlugAndCity(
  'complexo-do-nordeste-de-amaralina',
  'loc-salvador'
);

// 2. Resolver membros ativos
const locationIds = await territorialGroupService.resolveGroupToLocationIds(group.id);
// Retorna: ['loc-nordeste-de-amaralina', 'loc-santa-cruz', 'loc-chapada', 'loc-vale']

// 3. Aplicar filtro
const filter: TerritoryFilter = {
  scope: 'group',
  location_ids: locationIds
};

// 4. Query
const businesses = await supabase
  .from('business_data')
  .select('*')
  .in('location_id', filter.location_ids);
```

### Caso 2: Verificar Disponibilidade de Módulo

**Cenário**: Verificar se módulo "community" está disponível no grupo.

**Resolução**:
```typescript
const availability = await groupAvailabilityService.getGroupModuleAvailability(
  'tg-complexo-nordeste',
  ModuleKey.COMMUNITY
);

// availability.availability: 'full' | 'partial' | 'none'
// availability.active_member_ids: ['loc-nordeste', 'loc-santa-cruz']  (apenas com rollout ativo)
```

### Caso 3: Ativar Módulo para Grupo Inteiro

**Cenário**: Admin ativa módulo "mobility" para todo o Complexo do Nordeste.

**Resolução**:
```typescript
const result = await territorialRolloutService.activateRolloutForGroup({
  group_id: 'tg-complexo-nordeste',
  module_key: ModuleKey.MOBILITY,
  status: RolloutStatus.ACTIVE
});

// result.applied_to: ['loc-nordeste', 'loc-santa-cruz', 'loc-chapada', 'loc-vale']
// result.skipped: []  (membros inativos ou com erro)
```

---

## 5. DIFERENÇA ENTRE LOCATION E GROUP

| Aspecto | Location (Território Oficial) | Territorial Group (Agrupamento) |
|---------|-------------------------------|--------------------------------|
| **Fonte** | IBGE, Prefeitura (oficial) | Funcional/comunitário (interno) |
| **Hierarquia** | Sim (parent_id) | Não (membership) |
| **Tipo** | country/state/city/district | Sempre agrupamento de districts |
| **Slug** | Único globalmente | Único por cidade |
| **URL** | `/br/ba/salvador/pituba` | `/br/ba/salvador/area/complexo-do-nordeste` |
| **Tabela** | `locations` | `territorial_groups` |
| **Vínculo** | `parent_id` (hierarquia) | `territorial_group_members` (membership) |
| **Mudança** | Governança oficial (IBGE) | Admin interno |

---

## 6. CASOS DE USO

### Quando Usar Location?

- Filtrar por bairro oficial
- Filtrar por cidade
- Hierarquia administrativa
- URLs canônicas de território
- Rollout por hierarquia (herança)

### Quando Usar Territorial Group?

- Agrupamento comunitário (ex: Complexo do Nordeste)
- Agrupamento comercial (ex: Orla de Salvador)
- Agrupamento funcional (ex: Zona Turística)
- Filtro por múltiplos bairros relacionados
- Rollout por grupo (ativar módulo em vários bairros de uma vez)

---

## 7. GOVERNANÇA MÍNIMA

### Status de Grupo

```typescript
status: 'active' | 'inactive'
```

- `active`: Grupo visível e utilizável
- `inactive`: Grupo oculto (não aparece em listagens, URLs retornam 404)

### Integridade de Membership

**Validações Automáticas** (triggers):
1. Membro deve ser district (não city, state, country)
2. Membro deve pertencer à cidade âncora
3. Membro não pode estar duplicado no mesmo grupo

**Validações Manuais** (service):
1. Grupo não pode ficar vazio após remoção de membros
2. Slug deve ser único por cidade

---

## 8. ADMINISTRAÇÃO DE GRUPOS

### Criar Grupo

```typescript
import { territorialGroupService } from '@/core/territorial';

const group = await territorialGroupService.createGroup({
  slug: 'orla-de-salvador',
  name: 'Orla de Salvador',
  description: 'Bairros da orla marítima',
  anchor_city_id: 'loc-salvador',
  member_location_ids: ['loc-barra', 'loc-rio-vermelho'], // Opcional
});

// Grupo criado como 'inactive' por padrão
```

### Atualizar Grupo

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

### Gerenciar Membros

```typescript
// Adicionar membros
await territorialGroupService.addMembers('tg-orla', ['loc-ondina', 'loc-amaralina']);

// Remover membros
await territorialGroupService.removeMembers('tg-orla', ['loc-amaralina']);

// Substituir todos os membros (transacional)
await territorialGroupService.replaceMembers('tg-orla', ['loc-barra', 'loc-rio-vermelho']);
```

### Validações Automáticas

Todas as operações de escrita validam:
- ✅ Slug único por cidade
- ✅ Cidade âncora existe e é do tipo 'city'
- ✅ Membros são do tipo 'district'
- ✅ Membros pertencem à cidade âncora
- ✅ Membros estão ativos
- ✅ Grupo ativo deve ter pelo menos 1 membro
- ✅ Duplicatas de membership são ignoradas

---

## 9. RESOLUÇÃO DE FILTRO TERRITORIAL

### TerritoryFilter Expandido

```typescript
type TerritoryFilter =
  | { scope: 'location'; location_id: string }      // Bairro único
  | { scope: 'group'; location_ids: string[] }      // Grupo de bairros
  | { scope: 'none' };                              // Sem filtro
```

### Aplicação em Queries

```typescript
// Filtro por location
if (filter.scope === 'location') {
  query = query.eq('location_id', filter.location_id);
}

// Filtro por group
if (filter.scope === 'group') {
  query = query.in('location_id', filter.location_ids);
}

// Sem filtro
if (filter.scope === 'none') {
  // Não executar query ou retornar vazio
}
```

---

## 10. EXEMPLOS REAIS

### Exemplo 1: Complexo do Nordeste de Amaralina

**Grupo**:
- ID: `tg-complexo-nordeste`
- Slug: `complexo-do-nordeste-de-amaralina`
- Nome: `Complexo do Nordeste de Amaralina`
- Cidade Âncora: Salvador (`loc-salvador`)

**Membros**:
1. Nordeste de Amaralina (`loc-nordeste-de-amaralina`)
2. Santa Cruz (`loc-santa-cruz`)
3. Chapada do Rio Vermelho (`loc-chapada-do-rio-vermelho`)
4. Vale das Pedrinhas (`loc-vale-das-pedrinhas`)

**URL**: `/br/ba/salvador/area/complexo-do-nordeste-de-amaralina`

**Filtro Resultante**:
```typescript
{
  scope: 'group',
  location_ids: [
    'loc-nordeste-de-amaralina',
    'loc-santa-cruz',
    'loc-chapada-do-rio-vermelho',
    'loc-vale-das-pedrinhas'
  ]
}
```

---

## 11. PENDÊNCIAS FORA DO ESCOPO (ETAPA 2)

**NÃO implementado ainda**:
- ❌ Versionamento de grupos
- ❌ Aliases históricos de grupos
- ❌ Slug redirects de grupos
- ❌ UI administrativa de grupos

**Implementado**:
- ✅ Leitura de grupos (getById, getBySlugAndCity, listAll)
- ✅ Resolução de membros (listMembers, resolveGroupToLocationIds)
- ✅ Verificação de membership (isMemberOfGroup)
- ✅ Verificação de status (isGroupActive)
- ✅ Integração com rollout (GroupAvailabilityService, TerritorialRolloutService)
- ✅ Filtro territorial expandido (TerritoryFilter com scope 'group')
- ✅ CRUD completo de grupos (create, update, activate, deactivate)
- ✅ CRUD completo de membership (addMembers, removeMembers, replaceMembers)
- ✅ Validações de integridade (cidade âncora, tipo district, slug único)
- ✅ Regra de ativação (grupo ativo deve ter membros)

---

**Versão**: 1.0.0  
**Status**: ✅ FUNDAÇÃO COMPLETA (READ + WRITE)
