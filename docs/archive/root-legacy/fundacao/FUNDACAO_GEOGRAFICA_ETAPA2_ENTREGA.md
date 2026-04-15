# FUNDAÇÃO GEOGRÁFICA - ETAPA 2 ENTREGUE

**Data**: 2026-03-24  
**Status**: ✅ CONCLUÍDO

---

## PARTE 1: CONTRATOS DE `core/location`

### Tipos Principais
- `Location` (9 campos)
- `LocationType` (4 valores: country, state, city, district)
- `LocationStatus` (3 valores: active, inactive, coming_soon)
- `LocationTree` (navegação hierárquica)
- `LocationContextValue` (contexto React)

### Interface Pública: `ILocationService`
**11 métodos**:
1. `getLocationById` → `GetLocationOutput`
2. `getLocationByPath` → `GetLocationOutput`
3. `getLocationBySlug` → `GetLocationOutput`
4. `getAncestors` → `GetAncestorsOutput`
5. `getDescendants` → `GetDescendantsOutput` (paginado)
6. `getChildren` → `GetChildrenOutput` (paginado)
7. `validateLocation` → `ValidateLocationOutput`
8. `getLocationTree` → `GetLocationTreeOutput`
9. `getActiveLocation` → `Location | null`
10. `setActiveLocation` → `void`
11. `clearActiveLocation` → `void`

### Erros Canônicos
**10 códigos**: `LOCATION_NOT_FOUND`, `INVALID_LOCATION_ID`, `INVALID_PATH`, `INVALID_SLUG`, `LOCATION_INACTIVE`, `INVALID_TYPE`, `PARENT_NOT_FOUND`, `CIRCULAR_REFERENCE`, `INVALID_HIERARCHY`, `DATABASE_ERROR`

### Paginação
- Default: 50 itens
- Max: 200 itens
- Max depth: 10 níveis

---

## PARTE 2: CONTRATOS DE `core/coverage`

### Tipos Principais
- `ServiceArea` (10 campos)
- `CoverageType` (3 valores: district, city, radius)
- `EntityType` (5 valores: business, professional, service, classified, ad)
- `CoverageStatus` (2 valores: active, inactive)

### Interface Pública: `ICoverageService`
**8 métodos**:
1. `setCoverage` → `SetCoverageOutput`
2. `getCoverage` → `GetCoverageOutput`
3. `doesCover` → `DoesCoverOutput`
4. `getEntitiesCovering` → `GetEntitiesCoveringOutput` (paginado)
5. `removeCoverage` → `RemoveCoverageOutput`
6. `updateCoverageStatus` → `void`
7. `getPrimaryCoverage` → `GetPrimaryCoverageOutput`
8. `validateCoverage` → `ValidateCoverageOutput`

### Erros Canônicos
**14 códigos**: `COVERAGE_NOT_FOUND`, `INVALID_ENTITY_TYPE`, `INVALID_ENTITY_ID`, `INVALID_COVERAGE_TYPE`, `INVALID_LOCATION_ID`, `INVALID_RADIUS`, `LOCATION_NOT_FOUND`, `LOCATION_INACTIVE`, `DUPLICATE_COVERAGE`, `PRIMARY_COVERAGE_REQUIRED`, `MULTIPLE_PRIMARY_COVERAGE`, `RADIUS_REQUIRED`, `RADIUS_NOT_ALLOWED`, `DATABASE_ERROR`

### Validações Obrigatórias
1. `entity_type` válido
2. `location_id` existe e ativo
3. `radius_km` obrigatório se RADIUS
4. `radius_km` proibido se não RADIUS
5. `radius_km` entre 1-100 km
6. Apenas 1 cobertura primary
7. Máximo 50 coberturas por entidade

### Ownership Canônico
**DECISÃO FECHADA**: `entity_type` + `entity_id`

---

## PARTE 3: CONTRATOS DE `core/rollout`

### Tipos Principais
- `ModuleRollout` (7 campos)
- `EffectiveRollout` (6 campos com source e inherited_from)
- `ModuleKey` (6 valores: community, business, services, mobility, classifieds, ads)
- `RolloutStatus` (2 valores: active, inactive)
- `RolloutSource` (3 valores: local, inherited, default)

### Interface Pública: `IRolloutService`
**7 métodos**:
1. `isModuleActive` → `IsModuleActiveOutput`
2. `getEffectiveRollout` → `GetEffectiveRolloutOutput`
3. `getActiveModules` → `GetActiveModulesOutput`
4. `getLocationsForModule` → `GetLocationsForModuleOutput` (paginado)
5. `setModuleRollout` → `SetModuleRolloutOutput`
6. `removeModuleRollout` → `void`
7. `getModuleConfig` → `GetModuleConfigOutput`

### Erros Canônicos
**7 códigos**: `ROLLOUT_NOT_FOUND`, `INVALID_MODULE_KEY`, `INVALID_LOCATION_ID`, `LOCATION_NOT_FOUND`, `LOCATION_INACTIVE`, `INVALID_CONFIG`, `DATABASE_ERROR`

### Contrato de Herança
1. Busca rollout explícito (LOCAL)
2. Se não, busca recursivamente nos ancestors (INHERITED)
3. Se nenhum, retorna false (DEFAULT)

### Formato de Retorno Efetivo
```typescript
{
  module_key: ModuleKey,
  location_id: string,
  status: RolloutStatus,
  config: ModuleConfig | null,
  source: 'local' | 'inherited' | 'default',
  inherited_from: string | null
}
```

---

## PARTE 4: DECISÕES FINAIS FECHADAS

### 1. Ownership Canônico de Coverage
**DECISÃO**: `entity_type` + `entity_id`

**PROIBIDO**: `owner_id`, `profile_id`, `user_id`

### 2. Estratégia para `radius_km`
**DECISÃO**: Armazenado em `coverage`, cálculo delegado a `maps`

**VALIDAÇÃO**: 1-100 km (coverage)  
**CÁLCULO**: `maps.calculateDistance()` (maps)

### 3. Naming Final
**26 métodos nomeados**:
- location: 11 métodos
- coverage: 8 métodos
- rollout: 7 métodos

### 4. Erros Canônicos
**31 códigos definidos**:
- location: 10 códigos
- coverage: 14 códigos
- rollout: 7 códigos

---

## REGRAS DE CONSUMO POR MÓDULO

### `modules/community`
✅ `location`: getLocationById, getActiveLocation  
✅ `rollout`: isModuleActive  
❌ `coverage`: não precisa

### `modules/business`
✅ `location`: getLocationById, getChildren  
✅ `coverage`: setCoverage, getCoverage, doesCover, getEntitiesCovering  
✅ `rollout`: isModuleActive

### `modules/services`
✅ `location`: getLocationById  
✅ `coverage`: setCoverage, getCoverage, doesCover, getEntitiesCovering  
✅ `rollout`: isModuleActive

### `modules/mobility`
✅ `location`: getLocationById, getActiveLocation  
✅ `rollout`: isModuleActive  
❌ `coverage`: não precisa

### `modules/classifieds`
✅ `location`: getLocationById  
✅ `coverage`: setCoverage (opcional), getCoverage  
✅ `rollout`: isModuleActive

### `modules/ads`
✅ `location`: getLocationById  
✅ `coverage`: setCoverage, getCoverage, getEntitiesCovering  
✅ `rollout`: isModuleActive

---

## ARQUIVOS CRIADOS

### Contratos TypeScript
1. `src/core/location/types/index.ts` (200+ linhas)
2. `src/core/location/services/ILocationService.ts` (80+ linhas)
3. `src/core/coverage/types/index.ts` (200+ linhas)
4. `src/core/coverage/services/ICoverageService.ts` (90+ linhas)
5. `src/core/rollout/types/index.ts` (150+ linhas)
6. `src/core/rollout/services/IRolloutService.ts` (80+ linhas)

### Documentação
7. `docs/GEOGRAPHIC_FOUNDATION_STAGE2_CONTRACTS.md` (documento completo)
8. `FUNDACAO_GEOGRAFICA_ETAPA2_ENTREGA.md` (este arquivo)

### Index Atualizados
9. `src/core/location/index.ts` (exports públicos)
10. `src/core/coverage/index.ts` (exports públicos)
11. `src/core/rollout/index.ts` (exports públicos)

**Total**: 11 arquivos

---

## NÚMEROS DA ENTREGA

- **Interfaces**: 3 (ILocationService, ICoverageService, IRolloutService)
- **Métodos públicos**: 26 (11 + 8 + 7)
- **Tipos principais**: 15+
- **Códigos de erro**: 31 (10 + 14 + 7)
- **Inputs**: 20+
- **Outputs**: 20+
- **Enums**: 10+
- **Constantes**: 3 (paginação + validação)

---

## CHECKLIST DE CONGELAMENTO

### Contratos de location ✅
- [x] 11 métodos definidos
- [x] Tipos completos
- [x] 10 erros
- [x] Paginação definida
- [x] LocationContext definido

### Contratos de coverage ✅
- [x] 8 métodos definidos
- [x] Tipos completos
- [x] 14 erros
- [x] 7 validações
- [x] Ownership: entity_type + entity_id

### Contratos de rollout ✅
- [x] 7 métodos definidos
- [x] Tipos completos
- [x] 7 erros
- [x] Herança definida
- [x] EffectiveRollout definido

### Decisões Fechadas ✅
- [x] Ownership canônico
- [x] Estratégia radius_km
- [x] Naming de métodos
- [x] Erros canônicos

### Regras de Consumo ✅
- [x] community
- [x] business
- [x] services
- [x] mobility
- [x] classifieds
- [x] ads

---

## O QUE NÃO FOI FEITO (CONFORME SOLICITADO)

- ❌ Implementação de classes
- ❌ Schema de dados
- ❌ Migrations
- ❌ Lógica de negócio
- ❌ Testes

---

## PRÓXIMA ETAPA

**Etapa 3: Schema de Dados**

Definir estrutura de tabelas:
- Schema de `locations`
- Schema de `service_areas`
- Schema de `module_rollouts`
- Relacionamentos
- Índices
- Constraints

---

**Versão**: 2.0.0  
**Status**: ✅ CONCLUÍDO  
**Data**: 2026-03-24

