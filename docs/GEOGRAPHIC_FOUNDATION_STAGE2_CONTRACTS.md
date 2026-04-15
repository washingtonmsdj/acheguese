# FUNDAÇÃO GEOGRÁFICA - ETAPA 2: CONTRATOS PÚBLICOS

**Status**: ✅ CONCLUÍDO  
**Data**: 2026-03-24  
**Versão**: 2.0.0

---

## PARTE 1: CONTRATOS DE `core/location`

### Tipos Principais

```typescript
enum LocationType {
  COUNTRY = 'country',
  STATE = 'state',
  CITY = 'city',
  DISTRICT = 'district',
}

enum LocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMING_SOON = 'coming_soon',
}

interface Location {
  id: string;
  parent_id: string | null;
  type: LocationType;
  slug: string;
  name: string;
  full_name: string;
  geographic_path: string;
  status: LocationStatus;
  metadata: LocationMetadata;
  created_at: string;
  updated_at: string;
}
```

### Interfaces Públicas

**ILocationService** com 11 métodos:
1. `getLocationById(input)` → `GetLocationOutput`
2. `getLocationByPath(input)` → `GetLocationOutput`
3. `getLocationBySlug(input)` → `GetLocationOutput`
4. `getAncestors(input)` → `GetAncestorsOutput`
5. `getDescendants(input)` → `GetDescendantsOutput` (paginado)
6. `getChildren(input)` → `GetChildrenOutput` (paginado)
7. `validateLocation(input)` → `ValidateLocationOutput`
8. `getLocationTree(input)` → `GetLocationTreeOutput`
9. `getActiveLocation()` → `Location | null`
10. `setActiveLocation(location)` → `void`
11. `clearActiveLocation()` → `void`

### Inputs/Outputs

**Inputs**:
- `GetLocationByIdInput`: `{ id: string }`
- `GetLocationByPathInput`: `{ path: string }`
- `GetLocationBySlugInput`: `{ slug: string; parent_id: string | null }`
- `GetAncestorsInput`: `{ location_id: string; include_self?: boolean }`
- `GetDescendantsInput`: `{ location_id: string; include_self?: boolean; max_depth?: number; page?: number; page_size?: number }`
- `GetChildrenInput`: `{ location_id: string; type?: LocationType; status?: LocationStatus; page?: number; page_size?: number }`

**Outputs**:
- `GetLocationOutput`: `{ location: Location }`
- `GetAncestorsOutput`: `{ ancestors: Location[]; count: number }`
- `GetDescendantsOutput`: `{ descendants: Location[]; total_count: number; page: number; page_size: number; has_more: boolean }`
- `GetChildrenOutput`: `{ children: Location[]; total_count: number; page: number; page_size: number; has_more: boolean }`

### Tipos de Erro

```typescript
enum LocationErrorCode {
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  INVALID_LOCATION_ID = 'INVALID_LOCATION_ID',
  INVALID_PATH = 'INVALID_PATH',
  INVALID_SLUG = 'INVALID_SLUG',
  LOCATION_INACTIVE = 'LOCATION_INACTIVE',
  INVALID_TYPE = 'INVALID_TYPE',
  PARENT_NOT_FOUND = 'PARENT_NOT_FOUND',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  INVALID_HIERARCHY = 'INVALID_HIERARCHY',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

### Regras de Paginação

```typescript
const LOCATION_PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  DEFAULT_PAGE: 1,
  MAX_DEPTH: 10,
} as const;
```

### Contrato de LocationContext

```typescript
interface LocationContextValue {
  activeLocation: Location | null;
  setActiveLocation: (location: Location | null) => void;
  isLoading: boolean;
  error: LocationError | null;
}
```

---

## PARTE 2: CONTRATOS DE `core/coverage`

### Tipos Principais

```typescript
enum CoverageType {
  DISTRICT = 'district',
  CITY = 'city',
  RADIUS = 'radius',
}

enum CoverageStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

type EntityType = 
  | 'business'
  | 'professional'
  | 'service'
  | 'classified'
  | 'ad';

interface ServiceArea {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  coverage_type: CoverageType;
  location_id: string;
  radius_km: number | null;
  is_primary: boolean;
  status: CoverageStatus;
  created_at: string;
  updated_at: string;
}
```

### Interfaces Públicas

**ICoverageService** com 8 métodos:
1. `setCoverage(input)` → `SetCoverageOutput`
2. `getCoverage(input)` → `GetCoverageOutput`
3. `doesCover(input)` → `DoesCoverOutput`
4. `getEntitiesCovering(input)` → `GetEntitiesCoveringOutput` (paginado)
5. `removeCoverage(input)` → `RemoveCoverageOutput`
6. `updateCoverageStatus(input)` → `void`
7. `getPrimaryCoverage(input)` → `GetPrimaryCoverageOutput`
8. `validateCoverage(input)` → `ValidateCoverageOutput`

### Inputs/Outputs

**Inputs**:
- `SetCoverageInput`: `{ entity_type: EntityType; entity_id: string; coverages: CoverageDefinition[] }`
- `CoverageDefinition`: `{ coverage_type: CoverageType; location_id: string; radius_km?: number; is_primary?: boolean }`
- `GetCoverageInput`: `{ entity_type: EntityType; entity_id: string; status?: CoverageStatus }`
- `DoesCoverInput`: `{ entity_type: EntityType; entity_id: string; location_id: string }`
- `GetEntitiesCoveringInput`: `{ entity_type: EntityType; location_id: string; status?: CoverageStatus; page?: number; page_size?: number }`

**Outputs**:
- `SetCoverageOutput`: `{ coverages: ServiceArea[]; count: number }`
- `GetCoverageOutput`: `{ coverages: CoverageWithLocation[]; count: number }`
- `DoesCoverOutput`: `{ covers: boolean; coverage: ServiceArea | null; reason: string | null }`
- `GetEntitiesCoveringOutput`: `{ entity_ids: string[]; total_count: number; page: number; page_size: number; has_more: boolean }`

### Tipos de Erro

```typescript
enum CoverageErrorCode {
  COVERAGE_NOT_FOUND = 'COVERAGE_NOT_FOUND',
  INVALID_ENTITY_TYPE = 'INVALID_ENTITY_TYPE',
  INVALID_ENTITY_ID = 'INVALID_ENTITY_ID',
  INVALID_COVERAGE_TYPE = 'INVALID_COVERAGE_TYPE',
  INVALID_LOCATION_ID = 'INVALID_LOCATION_ID',
  INVALID_RADIUS = 'INVALID_RADIUS',
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  LOCATION_INACTIVE = 'LOCATION_INACTIVE',
  DUPLICATE_COVERAGE = 'DUPLICATE_COVERAGE',
  PRIMARY_COVERAGE_REQUIRED = 'PRIMARY_COVERAGE_REQUIRED',
  MULTIPLE_PRIMARY_COVERAGE = 'MULTIPLE_PRIMARY_COVERAGE',
  RADIUS_REQUIRED = 'RADIUS_REQUIRED',
  RADIUS_NOT_ALLOWED = 'RADIUS_NOT_ALLOWED',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

### Validações Obrigatórias

1. `entity_type` deve ser válido (business, professional, service, classified, ad)
2. `location_id` deve existir e estar ativo
3. `radius_km` obrigatório se `coverage_type = RADIUS`
4. `radius_km` proibido se `coverage_type != RADIUS`
5. `radius_km` entre 1 e 100 km
6. Apenas 1 cobertura pode ser `is_primary = true`
7. Máximo 50 coberturas por entidade

### Definição Canônica de Ownership

**DECISÃO FECHADA**:
- Ownership via `entity_type` + `entity_id`
- Não usar colunas genéricas (`owner_id`, `profile_id`)
- Cada módulo passa seu tipo + ID específico

---

## PARTE 3: CONTRATOS DE `core/rollout`

### Tipos Principais

```typescript
enum ModuleKey {
  COMMUNITY = 'community',
  BUSINESS = 'business',
  SERVICES = 'services',
  MOBILITY = 'mobility',
  CLASSIFIEDS = 'classifieds',
  ADS = 'ads',
}

enum RolloutStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

enum RolloutSource {
  LOCAL = 'local',
  INHERITED = 'inherited',
  DEFAULT = 'default',
}

interface ModuleRollout {
  id: string;
  module_key: ModuleKey;
  location_id: string;
  status: RolloutStatus;
  config: ModuleConfig | null;
  created_at: string;
  updated_at: string;
}

interface EffectiveRollout {
  module_key: ModuleKey;
  location_id: string;
  status: RolloutStatus;
  config: ModuleConfig | null;
  source: RolloutSource;
  inherited_from: string | null;
}
```

### Interfaces Públicas

**IRolloutService** com 7 métodos:
1. `isModuleActive(input)` → `IsModuleActiveOutput`
2. `getEffectiveRollout(input)` → `GetEffectiveRolloutOutput`
3. `getActiveModules(input)` → `GetActiveModulesOutput`
4. `getLocationsForModule(input)` → `GetLocationsForModuleOutput` (paginado)
5. `setModuleRollout(input)` → `SetModuleRolloutOutput`
6. `removeModuleRollout(input)` → `void`
7. `getModuleConfig(input)` → `GetModuleConfigOutput`

### Inputs/Outputs

**Inputs**:
- `IsModuleActiveInput`: `{ module_key: ModuleKey; location_id: string }`
- `GetEffectiveRolloutInput`: `{ module_key: ModuleKey; location_id: string }`
- `GetActiveModulesInput`: `{ location_id: string }`
- `GetLocationsForModuleInput`: `{ module_key: ModuleKey; status?: RolloutStatus; page?: number; page_size?: number }`
- `SetModuleRolloutInput`: `{ module_key: ModuleKey; location_id: string; status: RolloutStatus; config?: ModuleConfig }`

**Outputs**:
- `IsModuleActiveOutput`: `{ is_active: boolean; effective_rollout: EffectiveRollout }`
- `GetEffectiveRolloutOutput`: `{ effective_rollout: EffectiveRollout }`
- `GetActiveModulesOutput`: `{ modules: EffectiveRollout[]; count: number }`
- `GetLocationsForModuleOutput`: `{ location_ids: string[]; total_count: number; page: number; page_size: number; has_more: boolean }`

### Tipos de Erro

```typescript
enum RolloutErrorCode {
  ROLLOUT_NOT_FOUND = 'ROLLOUT_NOT_FOUND',
  INVALID_MODULE_KEY = 'INVALID_MODULE_KEY',
  INVALID_LOCATION_ID = 'INVALID_LOCATION_ID',
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  LOCATION_INACTIVE = 'LOCATION_INACTIVE',
  INVALID_CONFIG = 'INVALID_CONFIG',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

### Contrato de Herança e Override

**LÓGICA DE HERANÇA**:
1. Se localização tem rollout explícito: usa ele (LOCAL)
2. Se não, busca recursivamente nos ancestors (INHERITED)
3. Se nenhum ancestor tem: usa default false (DEFAULT)

**OVERRIDE LOCAL**:
- Localização pode sobrescrever herança criando rollout explícito
- Override afeta apenas a localização, não os filhos
- Filhos continuam herdando do parent mais próximo

**EXEMPLO**:
```
Brasil (active)
  └─ Bahia (sem override) → herda active
      └─ Salvador (inactive override) → inactive
          └─ Pituba (sem override) → herda inactive de Salvador
```

### Formato do Retorno Efetivo

```typescript
interface EffectiveRollout {
  module_key: ModuleKey;
  location_id: string;
  status: RolloutStatus;
  config: ModuleConfig | null;
  source: RolloutSource;        // LOCAL, INHERITED, DEFAULT
  inherited_from: string | null; // location_id do ancestor (se INHERITED)
}
```

---

## PARTE 4: DECISÕES FINAIS FECHADAS

### 1. Ownership Canônico de Coverage

**DECISÃO**: Ownership via `entity_type` + `entity_id`

```typescript
interface ServiceArea {
  entity_type: EntityType; // 'business', 'professional', 'service', etc
  entity_id: string;       // ID específico da entidade
  // ...
}
```

**JUSTIFICATIVA**:
- Flexível para múltiplos tipos de entidade
- Não acopla a profile_id ou user_id
- Cada módulo passa seu próprio tipo + ID
- Permite queries eficientes por tipo

**PROIBIDO**:
- Colunas genéricas: `owner_id`, `profile_id`, `user_id`
- Ownership implícito

### 2. Estratégia para `radius_km` sem Acoplamento

**DECISÃO**: `radius_km` armazenado em `service_areas`, cálculo delegado a `integrations/maps`

**CONTRATO**:
```typescript
// coverage armazena radius_km
interface ServiceArea {
  radius_km: number | null; // 1-100 km
}

// coverage valida radius_km
const COVERAGE_VALIDATION = {
  MIN_RADIUS_KM: 1,
  MAX_RADIUS_KM: 100,
};

// coverage delega cálculo para maps
// (implementação na Etapa 5)
```

**JUSTIFICATIVA**:
- `coverage` não precisa saber como calcular distância
- `coverage` apenas valida range (1-100 km)
- `integrations/maps` faz cálculo geoespacial
- Desacoplamento mantido

**FLUXO**:
1. `coverage` valida `radius_km` (1-100)
2. `coverage` armazena `radius_km`
3. `coverage.doesCover()` chama `maps.calculateDistance()` se `coverage_type = RADIUS`
4. `coverage` compara distância com `radius_km`

### 3. Naming Final dos Métodos Públicos

**core/location**:
- `getLocationById`
- `getLocationByPath`
- `getLocationBySlug`
- `getAncestors`
- `getDescendants`
- `getChildren`
- `validateLocation`
- `getLocationTree`
- `getActiveLocation`
- `setActiveLocation`
- `clearActiveLocation`

**core/coverage**:
- `setCoverage`
- `getCoverage`
- `doesCover`
- `getEntitiesCovering`
- `removeCoverage`
- `updateCoverageStatus`
- `getPrimaryCoverage`
- `validateCoverage`

**core/rollout**:
- `isModuleActive`
- `getEffectiveRollout`
- `getActiveModules`
- `getLocationsForModule`
- `setModuleRollout`
- `removeModuleRollout`
- `getModuleConfig`

### 4. Erros Canônicos por Módulo

**location** (10 códigos):
- `LOCATION_NOT_FOUND`
- `INVALID_LOCATION_ID`
- `INVALID_PATH`
- `INVALID_SLUG`
- `LOCATION_INACTIVE`
- `INVALID_TYPE`
- `PARENT_NOT_FOUND`
- `CIRCULAR_REFERENCE`
- `INVALID_HIERARCHY`
- `DATABASE_ERROR`

**coverage** (14 códigos):
- `COVERAGE_NOT_FOUND`
- `INVALID_ENTITY_TYPE`
- `INVALID_ENTITY_ID`
- `INVALID_COVERAGE_TYPE`
- `INVALID_LOCATION_ID`
- `INVALID_RADIUS`
- `LOCATION_NOT_FOUND`
- `LOCATION_INACTIVE`
- `DUPLICATE_COVERAGE`
- `PRIMARY_COVERAGE_REQUIRED`
- `MULTIPLE_PRIMARY_COVERAGE`
- `RADIUS_REQUIRED`
- `RADIUS_NOT_ALLOWED`
- `DATABASE_ERROR`

**rollout** (7 códigos):
- `ROLLOUT_NOT_FOUND`
- `INVALID_MODULE_KEY`
- `INVALID_LOCATION_ID`
- `LOCATION_NOT_FOUND`
- `LOCATION_INACTIVE`
- `INVALID_CONFIG`
- `DATABASE_ERROR`

---

## REGRAS DE CONSUMO POR MÓDULOS DE DOMÍNIO

### `modules/community`

**Pode usar**:
- `location.getLocationById()` - obter localização de posts
- `location.getActiveLocation()` - contexto do feed
- `rollout.isModuleActive('community', locationId)` - verificar disponibilidade

**Não precisa**:
- `coverage` - posts não têm cobertura geográfica

### `modules/business`

**Pode usar**:
- `location.getLocationById()` - obter localização do business
- `location.getChildren()` - listar bairros de uma cidade
- `coverage.setCoverage()` - definir área de atuação
- `coverage.getCoverage()` - obter área de atuação
- `coverage.doesCover()` - verificar se cobre localização
- `coverage.getEntitiesCovering()` - buscar businesses em localização
- `rollout.isModuleActive('business', locationId)` - verificar disponibilidade

### `modules/services`

**Pode usar**:
- `location.getLocationById()` - obter localização do serviço
- `coverage.setCoverage()` - definir área de atuação
- `coverage.getCoverage()` - obter área de atuação
- `coverage.doesCover()` - verificar se cobre localização
- `coverage.getEntitiesCovering()` - buscar serviços em localização
- `rollout.isModuleActive('services', locationId)` - verificar disponibilidade

### `modules/mobility`

**Pode usar**:
- `location.getLocationById()` - obter localização de rotas
- `location.getActiveLocation()` - contexto de mobilidade
- `rollout.isModuleActive('mobility', locationId)` - verificar disponibilidade

**Não precisa**:
- `coverage` - rotas não têm cobertura geográfica

### `modules/classifieds`

**Pode usar**:
- `location.getLocationById()` - obter localização do classificado
- `coverage.setCoverage()` - definir área de entrega (opcional)
- `coverage.getCoverage()` - obter área de entrega
- `rollout.isModuleActive('classifieds', locationId)` - verificar disponibilidade

### `modules/ads`

**Pode usar**:
- `location.getLocationById()` - obter localização do anúncio
- `coverage.setCoverage()` - definir segmentação geográfica
- `coverage.getCoverage()` - obter segmentação
- `coverage.getEntitiesCovering()` - buscar anúncios para localização
- `rollout.isModuleActive('ads', locationId)` - verificar disponibilidade

---

## CHECKLIST DE CONGELAMENTO - ETAPA 2

### Contratos de location ✅
- [x] 11 métodos públicos definidos
- [x] Tipos principais: Location, LocationType, LocationStatus
- [x] Inputs/outputs completos
- [x] 10 códigos de erro
- [x] Regras de paginação (50/200, max_depth 10)
- [x] Contrato de LocationContext

### Contratos de coverage ✅
- [x] 8 métodos públicos definidos
- [x] Tipos principais: ServiceArea, CoverageType, EntityType
- [x] Inputs/outputs completos
- [x] 14 códigos de erro
- [x] 7 validações obrigatórias
- [x] Ownership canônico: entity_type + entity_id

### Contratos de rollout ✅
- [x] 7 métodos públicos definidos
- [x] Tipos principais: ModuleRollout, EffectiveRollout, RolloutSource
- [x] Inputs/outputs completos
- [x] 7 códigos de erro
- [x] Contrato de herança e override
- [x] Formato de retorno efetivo

### Decisões Fechadas ✅
- [x] Ownership: entity_type + entity_id
- [x] radius_km: armazenado em coverage, cálculo em maps
- [x] Naming: 26 métodos nomeados
- [x] Erros: 31 códigos definidos

### Regras de Consumo ✅
- [x] community: location + rollout
- [x] business: location + coverage + rollout
- [x] services: location + coverage + rollout
- [x] mobility: location + rollout
- [x] classifieds: location + coverage + rollout
- [x] ads: location + coverage + rollout

---

**Versão**: 2.0.0  
**Status**: ✅ CONGELADO  
**Última Atualização**: 2026-03-24  
**Próxima Etapa**: Schema de Dados

