# REGRAS DE GOVERNANÇA TERRITORIAL E POSTAL

**Data**: 2026-03-28  
**Versão**: 1.0.0  
**Status**: ✅ OFICIAL

---

## 1. VERSIONAMENTO DE LOCATIONS

### Regra Fundamental

```
locations              → Estado atual (SSOT)
location_versions      → Histórico de mudanças oficiais
```

### Quando Criar Versão?

Criar nova versão quando houver mudança oficial relevante:
- ✅ Mudança de nome oficial
- ✅ Mudança de slug
- ✅ Mudança de limites territoriais
- ✅ Criação de território
- ✅ Merge de territórios
- ✅ Split de territórios

### Versão Ativa

```sql
-- Versão ativa: valid_until IS NULL ou ainda vigente
SELECT * FROM location_versions
WHERE location_id = 'loc-nordeste-de-amaralina'
  AND (valid_until IS NULL OR valid_until > NOW())
ORDER BY version_number DESC
LIMIT 1;
```

### version_number

- Incrementa automaticamente por location
- Primeira versão: 1
- Segunda versão: 2
- etc.

---

## 2. ALIASES HISTÓRICOS E POPULARES

### Tipos de Alias

```typescript
type LocationAliasType = 
  | 'historical_name'   // Nome oficial antigo
  | 'popular_name'      // Nome popular/informal
  | 'abbreviation'      // Abreviação
  | 'old_slug'          // Slug antigo
  | 'other';            // Outros
```

### Regras

- ✅ Alias único por (location_id, alias_type, alias_value)
- ✅ Alias pode ter vigência (valid_from, valid_until)
- ✅ Alias ativo: valid_until IS NULL ou ainda vigente
- ❌ Alias não pode ser ambíguo sem contexto

### Exemplo

```typescript
// Nordeste de Amaralina teve nome popular "Nordeste"
await territoryGovernanceService.addLocationAlias({
  location_id: 'loc-nordeste-de-amaralina',
  alias_type: 'popular_name',
  alias_value: 'Nordeste',
});

// Resolver busca
const locationId = await territoryGovernanceService.resolveLocationByAliasOrCurrentSlug('Nordeste');
// Retorna: 'loc-nordeste-de-amaralina'
```

---

## 3. REDIRECTS DE SLUG

### Regra Fundamental

Quando slug de location muda oficialmente:
1. Atualizar `locations.slug` (estado atual)
2. Criar redirect em `slug_redirects` (old → new)
3. Criar alias em `location_aliases` (old_slug)

### Tipos de Redirect

```typescript
type SlugRedirectType = 
  | 'permanent'   // 301 - mudança definitiva
  | 'temporary';  // 302 - mudança temporária
```

### Regras

- ✅ old_slug único (não pode ter redirect duplicado)
- ✅ old_slug != new_slug
- ✅ Redirect pode expirar (expires_at)
- ✅ Redirect ativo: expires_at IS NULL ou ainda vigente

### Exemplo

```typescript
// Slug mudou de 'nordeste-amaralina' para 'nordeste-de-amaralina'
await territoryGovernanceService.createSlugRedirect({
  location_id: 'loc-nordeste-de-amaralina',
  old_slug: 'nordeste-amaralina',
  new_slug: 'nordeste-de-amaralina',
  redirect_type: 'permanent',
  reason: 'Padronização de nomenclatura',
});

// Resolver redirect
const redirect = await territoryGovernanceService.resolveRedirectByOldSlug('nordeste-amaralina');
// redirect.new_slug === 'nordeste-de-amaralina'
```

---

## 4. EVENTOS DE MUDANÇA TERRITORIAL

### Tipos de Evento

```typescript
type TerritoryChangeEventType = 
  | 'name_change'       // Mudança de nome
  | 'slug_change'       // Mudança de slug
  | 'boundary_change'   // Mudança de limites
  | 'parent_change'     // Mudança de hierarquia
  | 'status_change'     // Mudança de status
  | 'merge'             // Fusão de territórios
  | 'split'             // Divisão de território
  | 'creation'          // Criação
  | 'deactivation'      // Desativação
  | 'other';            // Outros
```

### Regras

- ✅ Fonte oficial obrigatória
- ✅ effective_date marca quando mudança entra em vigor
- ✅ processed_at marca quando foi processada no sistema
- ✅ Eventos são imutáveis (não podem ser editados)

### Exemplo

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

---

## 5. HISTÓRICO POSTAL

### Fontes

```typescript
type PostalCodeSource = 
  | 'correios'    // Correios (oficial)
  | 'ibge'        // IBGE
  | 'prefeitura'  // Prefeitura
  | 'manual'      // Entrada manual
  | 'other';      // Outras fontes
```

### Regras

- ✅ Registra CEP e logradouro por período
- ✅ Vigência: valid_from, valid_until
- ✅ Fonte obrigatória
- ❌ NÃO sincroniza automaticamente ainda (etapa futura)

### Exemplo

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

## 6. WORKFLOW DE MUDANÇA OFICIAL

### Cenário: Nome de Bairro Mudou

**Exemplo**: "Nordeste" → "Nordeste de Amaralina"

**Passos**:

1. Registrar evento de mudança
```typescript
await territoryGovernanceService.registerTerritoryChangeEvent({
  location_id: 'loc-nordeste-de-amaralina',
  event_type: 'name_change',
  old_value: 'Nordeste',
  new_value: 'Nordeste de Amaralina',
  official_source: 'Prefeitura de Salvador',
  effective_date: '2024-01-01',
});
```

2. Criar versão histórica
```typescript
await territoryGovernanceService.createLocationVersion({
  location_id: 'loc-nordeste-de-amaralina',
  name: 'Nordeste de Amaralina',
  full_name: 'Nordeste de Amaralina, Salvador',
  slug: 'nordeste-de-amaralina',
  geographic_path: '/br/ba/salvador/nordeste-de-amaralina',
  change_type: 'name_change',
  official_source: 'Prefeitura de Salvador',
  valid_from: '2024-01-01T00:00:00Z',
});
```

3. Adicionar alias do nome antigo
```typescript
await territoryGovernanceService.addLocationAlias({
  location_id: 'loc-nordeste-de-amaralina',
  alias_type: 'historical_name',
  alias_value: 'Nordeste',
  valid_from: '2020-01-01T00:00:00Z',
  valid_until: '2023-12-31T23:59:59Z',
});
```

4. Atualizar `locations` (estado atual)
```sql
UPDATE locations
SET name = 'Nordeste de Amaralina',
    full_name = 'Nordeste de Amaralina, Salvador',
    updated_at = NOW()
WHERE id = 'loc-nordeste-de-amaralina';
```

---

### Cenário: Slug de Bairro Mudou

**Exemplo**: "nordeste-amaralina" → "nordeste-de-amaralina"

**Passos**:

1. Registrar evento
```typescript
await territoryGovernanceService.registerTerritoryChangeEvent({
  location_id: 'loc-nordeste-de-amaralina',
  event_type: 'slug_change',
  old_value: 'nordeste-amaralina',
  new_value: 'nordeste-de-amaralina',
  official_source: 'Sistema Interno',
  effective_date: '2024-01-01',
});
```

2. Criar redirect
```typescript
await territoryGovernanceService.createSlugRedirect({
  location_id: 'loc-nordeste-de-amaralina',
  old_slug: 'nordeste-amaralina',
  new_slug: 'nordeste-de-amaralina',
  redirect_type: 'permanent',
  reason: 'Padronização',
});
```

3. Criar alias do slug antigo
```typescript
await territoryGovernanceService.addLocationAlias({
  location_id: 'loc-nordeste-de-amaralina',
  alias_type: 'old_slug',
  alias_value: 'nordeste-amaralina',
});
```

4. Criar versão
```typescript
await territoryGovernanceService.createLocationVersion({
  location_id: 'loc-nordeste-de-amaralina',
  name: 'Nordeste de Amaralina',
  full_name: 'Nordeste de Amaralina, Salvador',
  slug: 'nordeste-de-amaralina',
  geographic_path: '/br/ba/salvador/nordeste-de-amaralina',
  change_type: 'slug_change',
  valid_from: '2024-01-01T00:00:00Z',
});
```

5. Atualizar `locations`
```sql
UPDATE locations
SET slug = 'nordeste-de-amaralina',
    geographic_path = '/br/ba/salvador/nordeste-de-amaralina',
    updated_at = NOW()
WHERE id = 'loc-nordeste-de-amaralina';
```

---

## 7. PREPARAÇÃO PARA GOVERNANÇA DE LOGRADOUROS (FUTURO)

### Estruturas Futuras (NÃO implementadas ainda)

```
streets              → Logradouros oficiais (SSOT)
street_versions      → Histórico de mudanças de logradouros
street_aliases       → Aliases de logradouros
```

### Design Atual Permite

- ✅ `postal_code_history` já registra street
- ✅ Padrão de versionamento pode ser replicado
- ✅ Padrão de aliases pode ser replicado
- ✅ Nada impede futura implementação

---

**Versão**: 1.0.0  
**Status**: ✅ FUNDAÇÃO COMPLETA
