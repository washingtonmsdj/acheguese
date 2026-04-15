# Core Governance Module

**Status**: ✅ FUNDAÇÃO COMPLETA  
**Versão**: 1.0.0  
**Data**: 2026-03-28

---

## Visão Geral

Módulo responsável por **governança territorial e postal** (versionamento, aliases, redirects, eventos de mudança).

**NÃO confundir com**:
- `core/location`: Hierarquia territorial oficial (estado atual)
- `core/territorial`: Grupos territoriais (agrupamentos)
- `core/address`: Endereços postais (SSOT de endereços)

---

## Responsabilidades

### O que este módulo faz ✅

- Versionamento de locations (histórico de mudanças oficiais)
- Aliases históricos e populares (nomes antigos, abreviações)
- Redirects de slugs (slug antigo → slug novo)
- Registro de eventos de mudança territorial
- Histórico postal (CEPs e logradouros por período)

### O que este módulo NÃO faz ❌

- Gerenciar hierarquia territorial atual (use `core/location`)
- Criar grupos territoriais (use `core/territorial`)
- Gerenciar endereços postais (use `core/address`)
- Sincronizar automaticamente com fontes externas (etapa futura)
- Governança de logradouros (`streets`, `street_versions` - etapa futura)

---

## Estrutura

```
src/core/governance/
├── services/
│   ├── TerritoryGovernanceService.ts
│   └── __tests__/
│       └── TerritoryGovernanceService.test.ts
├── repositories/
│   ├── IGovernanceRepository.ts
│   ├── GovernanceRepositoryMock.ts
│   ├── GovernanceRepositorySupabase.ts
│   └── createGovernanceRepository.ts
├── types/
│   └── index.ts
├── index.ts
└── README.md
```

---

## Uso Básico

### 1. Criar Versão de Location

```typescript
import { territoryGovernanceService } from '@/core/governance';

const version = await territoryGovernanceService.createLocationVersion({
  location_id: 'loc-nordeste-de-amaralina',
  name: 'Nordeste de Amaralina',
  full_name: 'Nordeste de Amaralina, Salvador',
  slug: 'nordeste-de-amaralina',
  geographic_path: '/br/ba/salvador/nordeste-de-amaralina',
  change_type: 'creation',
  change_reason: 'Criação inicial',
  official_source: 'IBGE',
  valid_from: '2020-01-01T00:00:00Z',
});
```

### 2. Obter Versão Ativa

```typescript
const activeVersion = await territoryGovernanceService.getActiveVersionForLocation('loc-nordeste-de-amaralina');

// activeVersion.valid_until === null (versão atual)
```

### 3. Adicionar Alias

```typescript
// Nome popular
await territoryGovernanceService.addLocationAlias({
  location_id: 'loc-nordeste-de-amaralina',
  alias_type: 'popular_name',
  alias_value: 'Nordeste',
});

// Nome histórico
await territoryGovernanceService.addLocationAlias({
  location_id: 'loc-nordeste-de-amaralina',
  alias_type: 'historical_name',
  alias_value: 'Nordeste de Amaralina (antigo)',
});

// Slug antigo
await territoryGovernanceService.addLocationAlias({
  location_id: 'loc-nordeste-de-amaralina',
  alias_type: 'old_slug',
  alias_value: 'nordeste-amaralina',
});
```

### 4. Resolver Location por Alias

```typescript
const locationId = await territoryGovernanceService.resolveLocationByAliasOrCurrentSlug('Nordeste');

// Retorna: 'loc-nordeste-de-amaralina'
```

### 5. Criar Redirect de Slug

```typescript
await territoryGovernanceService.createSlugRedirect({
  location_id: 'loc-nordeste-de-amaralina',
  old_slug: 'nordeste-amaralina',
  new_slug: 'nordeste-de-amaralina',
  redirect_type: 'permanent',
  reason: 'Padronização de nomenclatura',
});
```

### 6. Resolver Redirect

```typescript
const redirect = await territoryGovernanceService.resolveRedirectByOldSlug('nordeste-amaralina');

// redirect.new_slug === 'nordeste-de-amaralina'
```

### 7. Registrar Evento de Mudança

```typescript
await territoryGovernanceService.registerTerritoryChangeEvent({
  location_id: 'loc-nordeste-de-amaralina',
  event_type: 'name_change',
  old_value: 'Nordeste',
  new_value: 'Nordeste de Amaralina',
  official_source: 'Prefeitura de Salvador',
  official_document_url: 'https://example.com/decreto-123',
  effective_date: '2024-01-01',
});
```

### 8. Registrar Histórico Postal

```typescript
await territoryGovernanceService.registerPostalCodeHistory({
  location_id: 'loc-nordeste-de-amaralina',
  postal_code: '40000-000',
  street: 'Rua Principal',
  valid_from: '2020-01-01',
  valid_until: '2024-12-31',
  source: 'correios',
});
```

---

## Regras de Negócio

### 1. Versionamento

- Versão ativa: `valid_until IS NULL` ou ainda vigente
- `version_number` incrementa automaticamente
- `locations` representa estado atual
- `location_versions` preserva histórico

### 2. Aliases

- Alias único por (location_id, alias_type, alias_value)
- Alias pode ter vigência (valid_from, valid_until)
- Tipos: historical_name, popular_name, abbreviation, old_slug, other

### 3. Redirects

- old_slug único (não pode ter redirect duplicado)
- old_slug != new_slug
- Tipos: permanent, temporary
- Redirect pode expirar (expires_at)

### 4. Eventos de Mudança

- Registram mudanças oficiais
- Fonte oficial obrigatória
- Effective_date marca quando mudança entra em vigor

### 5. Histórico Postal

- Registra CEPs e logradouros por período
- Fonte: correios, ibge, prefeitura, manual, other
- Vigência: valid_from, valid_until

---

## Testes

**Arquivo**: `services/__tests__/TerritoryGovernanceService.test.ts`

**Cobertura**: 26 testes

**Location Versions** (7 testes):
- createLocationVersion: 4 testes
- getActiveVersionForLocation: 2 testes
- listVersionsForLocation: 1 teste

**Location Aliases** (5 testes):
- addLocationAlias: 3 testes
- resolveLocationByAliasOrCurrentSlug: 2 testes

**Slug Redirects** (6 testes):
- createSlugRedirect: 4 testes
- resolveRedirectByOldSlug: 2 testes

**Territory Change Events** (4 testes):
- registerTerritoryChangeEvent: 3 testes
- listEventsForLocation: 1 teste

**Postal Code History** (4 testes):
- registerPostalCodeHistory: 3 testes
- listPostalCodeHistoryForLocation: 1 teste

**Status**: ✅ 26/26 passed

---

## Validações Implementadas

### Location Versions
- ✅ location_id, name, slug, valid_from obrigatórios
- ✅ Location deve existir
- ✅ version_number incrementa automaticamente

### Location Aliases
- ✅ location_id, alias_type, alias_value obrigatórios
- ✅ Location deve existir
- ✅ Alias único por (location_id, alias_type, alias_value)

### Slug Redirects
- ✅ location_id, old_slug, new_slug obrigatórios
- ✅ Location deve existir
- ✅ old_slug único
- ✅ old_slug != new_slug

### Territory Change Events
- ✅ location_id, event_type, official_source, effective_date obrigatórios
- ✅ Location deve existir

### Postal Code History
- ✅ location_id, postal_code, valid_from obrigatórios
- ✅ Location deve existir

---

## Integração Futura

### Roteamento com Redirect

```typescript
// Exemplo conceitual (não implementado ainda)
const redirect = await territoryGovernanceService.resolveRedirectByOldSlug(slugFromUrl);

if (redirect) {
  // Redirecionar para novo slug
  navigate(redirect.new_slug, { status: redirect.redirect_type === 'permanent' ? 301 : 302 });
}
```

### Busca com Alias

```typescript
// Exemplo conceitual (não implementado ainda)
const locationId = await territoryGovernanceService.resolveLocationByAliasOrCurrentSlug(searchTerm);

if (locationId) {
  const location = await locationService.getLocationById(locationId);
  // Exibir resultado
}
```

---

## Pendências Fora do Escopo (ETAPA 3)

**NÃO implementado ainda**:
- ❌ Governança de logradouros (streets, street_versions, street_aliases)
- ❌ Sincronização automática multi-fonte
- ❌ UI administrativa de governança
- ❌ Integração com roteamento (redirects)
- ❌ Integração com busca (aliases)
- ❌ PostGIS
- ❌ ViaCEP/Google Geocoding
- ❌ Migração de dados legados

**Implementado**:
- ✅ Tabelas de governança (5 migrations)
- ✅ Versionamento de locations
- ✅ Aliases históricos e populares
- ✅ Redirects de slugs
- ✅ Eventos de mudança territorial
- ✅ Histórico postal
- ✅ Serviço central (TerritoryGovernanceService)
- ✅ Repositórios (Mock + Supabase)
- ✅ Testes (26 testes passando)

---

**Versão**: 1.0.0  
**Status**: ✅ FUNDAÇÃO COMPLETA
