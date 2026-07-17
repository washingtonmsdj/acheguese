# FUNDAÇÃO GEOGRÁFICA - ESTRUTURA CANÔNICA

**Status**: ✅ Etapa 1 Aprovada e Congelada  
**Data**: 2026-03-24  
**Versão**: 1.0.0

---

## 📋 VISÃO GERAL

A fundação geográfica é composta por 3 sistemas transversais em `core/` e 1 camada de integração:

1. **core/location** - SSOT territorial (hierarquia, árvore, contexto)
2. **core/coverage** - Cobertura de entidades (quem atende onde)
3. **core/rollout** - Ativação de módulos (o que está disponível onde)
4. **integrations/maps** - Serviços geoespaciais externos (GPS, geocoding, distância)

---

## 1. RESPONSABILIDADES DE `core/location`

### Propósito
SSOT (Single Source of Truth) territorial do produto. Gerencia a hierarquia geográfica canônica e contexto de localização da aplicação.

### Responsabilidades ✅
- Entidade `Location` (country → state → city → district)
- Hierarquia geográfica: `location_id`, `parent_id`, `type`, `slug`
- Caminho geográfico: `geographic_path` (ex: `/br/sp/sao-paulo/vila-mariana`)
- Resolução por ID: `getLocationById(id)`
- Resolução por path: `getLocationByPath('/br/sp/sao-paulo')`
- Resolução por slug dentro do parent: `getLocationBySlug('sao-paulo', parentId)`
- Navegação de árvore: `getAncestors(id)`, `getDescendants(id)`, `getChildren(id)`
- Contexto geográfico do app: localização ativa do usuário/sessão
- Validação de localização ativa (is_active)
- Integridade da árvore geográfica
- Metadados territoriais (nome, nome_completo, timezone, idioma)

### NÃO É RESPONSABILIDADE ❌
- Geocoding/reverse geocoding (integrations/maps)
- Obter GPS do browser (integrations/maps)
- Cálculos geoespaciais (distância, raio) (integrations/maps)
- Renderizar mapas (integrations/maps)
- Definir áreas de cobertura de serviços (coverage)
- Controlar rollout de módulos (rollout)
- Coordenadas lat/lng (integrations/maps)

---

## 2. RESPONSABILIDADES DE `core/coverage`

### Propósito
Sistema transversal que gerencia áreas de cobertura/atuação de entidades do produto (businesses, services, professionals).

### Responsabilidades ✅
- Entidade `ServiceArea` (cobertura de uma entidade)
- Cobertura por district: entidade cobre district específico
- Cobertura por city: entidade cobre cidade inteira
- Cobertura por radius: entidade cobre raio a partir de ponto
- Verificar se entidade cobre uma localização: `doesCover(entityId, locationId)`
- Listar entidades que cobrem localização: `getEntitiesCovering(locationId)`
- Área primária de cobertura: `primary_location_id`
- Validação de cobertura

### NÃO É RESPONSABILIDADE ❌
- Definir hierarquia geográfica (location)
- Gerenciar entidade Location (location)
- Controlar rollout de módulos (rollout)
- Cálculos de distância (integrations/maps)
- Geocoding (integrations/maps)

---

## 3. RESPONSABILIDADES DE `core/rollout`

### Propósito
Sistema transversal que controla a ativação de módulos do produto por localização geográfica.

### Responsabilidades ✅
- Entidade `ModuleRollout` (module_key + location_id)
- Ativação de módulo por localização: `isModuleActive(moduleKey, locationId)`
- Herança de ativação: filho herda do pai se não tiver override
- Override local: localização específica pode sobrescrever herança
- Default false: módulo desativado por padrão
- Config opcional: metadados de configuração por módulo/localização
- Listar módulos ativos em localização: `getActiveModules(locationId)`
- Listar localizações onde módulo está ativo: `getLocationsForModule(moduleKey)`

### NÃO É RESPONSABILIDADE ❌
- Definir hierarquia geográfica (location)
- Gerenciar cobertura de entidades (coverage)
- A/B testing (fora do escopo desta etapa)
- Percentual de rollout (fora do escopo desta etapa)
- Feature flags genéricos (apenas rollout geográfico)

---

## 4. RESPONSABILIDADES DE `integrations/maps`

### Propósito
Camada de integração com serviços geoespaciais externos (Google Maps, OpenStreetMap, etc).

### Responsabilidades ✅
- Geocoding: endereço → coordenadas
- Reverse geocoding: coordenadas → endereço
- GPS do browser: `getCurrentPosition()`, `watchPosition()`
- Cálculos geoespaciais: distância, raio, bounding box
- Renderização de mapas
- Tipos: `Coordinates`, `Address`, `GeocodingResult`

### NÃO É RESPONSABILIDADE ❌
- Gerenciar hierarquia territorial (location)
- Definir cobertura de entidades (coverage)
- Controlar rollout de módulos (rollout)

---

## 🔄 FLUXO DE DEPENDÊNCIAS

```
core/location
    ↓ depende de
shared/* (types, utils)

core/coverage
    ↓ depende de
core/location + shared/*

core/rollout
    ↓ depende de
core/location + shared/*

integrations/maps
    ↓ depende de
shared/* (types, utils)
```

### Separação de Conceitos

| Conceito | Responsável | Exemplo |
|----------|-------------|---------|
| "Qual a hierarquia territorial?" | `location` | Brasil > BA > Salvador > Pituba |
| "Onde estou no app?" | `location` | Contexto: Salvador (location_id: 123) |
| "Entidade X cobre localização Y?" | `coverage` | Business#456 cobre Pituba |
| "Módulo X está ativo em Y?" | `rollout` | mobility ativo em Salvador |
| "Onde fica este endereço?" | `integrations/maps` | Rua X → lat/lng |
| "Qual a distância?" | `integrations/maps` | 5.2 km |

---

## 📦 REGRAS DE DEPENDÊNCIA

### `core/location`

#### ✅ Pode importar
```typescript
import { slugify } from '@/shared/utils';
import type { UUID } from '@/shared/types';
```

#### ❌ NÃO pode importar
```typescript
import { CoverageService } from '@/core/coverage';     // ❌
import { RolloutService } from '@/core/rollout';       // ❌
import { mapsClient } from '@/integrations/maps';      // ❌
```

### `core/coverage`

#### ✅ Pode importar
```typescript
import { LocationService } from '@/core/location';
import type { LocationId } from '@/core/location';
import { validateUUID } from '@/shared/utils';
```

#### ❌ NÃO pode importar
```typescript
import { RolloutService } from '@/core/rollout';       // ❌
import { mapsClient } from '@/integrations/maps';      // ❌
import { BusinessService } from '@/modules/business';  // ❌
```

### `core/rollout`

#### ✅ Pode importar
```typescript
import { LocationService } from '@/core/location';
import type { LocationId } from '@/core/location';
import { validateString } from '@/shared/utils';
```

#### ❌ NÃO pode importar
```typescript
import { CoverageService } from '@/core/coverage';     // ❌
import { mapsClient } from '@/integrations/maps';      // ❌
import { MobilityService } from '@/modules/mobility';  // ❌
```

### `integrations/maps`

#### ✅ Pode importar
```typescript
import { formatCoordinates } from '@/shared/utils';
import type { UUID } from '@/shared/types';
```

#### ❌ NÃO pode importar
```typescript
import { LocationService } from '@/core/location';     // ❌
import { CoverageService } from '@/core/coverage';     // ❌
import { RolloutService } from '@/core/rollout';       // ❌
```

---

## 🚫 O QUE MÓDULOS DE DOMÍNIO NÃO PODEM FAZER

### ❌ PROIBIDO para `modules/*`

#### 1. Acesso Direto a Integrações de Mapas
```typescript
// ❌ ERRADO
import { mapsClient } from '@/integrations/maps';
const coords = await mapsClient.geocode(address);

// ✅ CORRETO
import { GeocodingService } from '@/integrations/maps';
const coords = await GeocodingService.geocode(address);
```

#### 2. Definir Cobertura Inline
```typescript
// ❌ ERRADO - em modules/business
const isCovered = coordinates.lat > -24 && coordinates.lat < -23;

// ✅ CORRETO
import { CoverageService } from '@/core/coverage';
const isCovered = await CoverageService.doesCover(businessId, locationId);
```

#### 3. Controlar Rollout Inline
```typescript
// ❌ ERRADO - em modules/mobility
const isActive = process.env.VITE_MOBILITY_ENABLED === 'true';

// ✅ CORRETO
import { RolloutService } from '@/core/rollout';
const isActive = await RolloutService.isModuleActive('mobility', locationId);
```

#### 4. Lógica Geográfica Inline
```typescript
// ❌ ERRADO
const distance = Math.sqrt(
  Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)
);

// ✅ CORRETO
import { DistanceService } from '@/integrations/maps';
const distance = DistanceService.calculateDistance(point1, point2);
```

#### 5. Manipular Hierarquia Geográfica
```typescript
// ❌ ERRADO - em modules/business
const cityId = await supabase
  .from('locations')
  .select('id')
  .eq('slug', 'sao-paulo')
  .single();

// ✅ CORRETO
import { LocationService } from '@/core/location';
const city = await LocationService.getLocationByPath('/br/sp/sao-paulo');
```

#### 6. Criar Localizações
```typescript
// ❌ ERRADO - em modules/admin
await supabase.from('locations').insert({ name: 'Nova Cidade' });

// ✅ CORRETO
// Apenas core/location pode criar/modificar localizações
// Módulos devem usar LocationService para consultas apenas
```

### ✅ PERMITIDO para `modules/*`

```typescript
// Consumir serviços de core
import { LocationService } from '@/core/location';
import { CoverageService } from '@/core/coverage';
import { RolloutService } from '@/core/rollout';

// Consumir serviços de integrations
import { GeocodingService } from '@/integrations/maps';
import { DistanceService } from '@/integrations/maps';

// Usar tipos compartilhados
import type { LocationId, Location } from '@/core/location';
import type { Coordinates, Address } from '@/integrations/maps';

// Implementar lógica de negócio específica
const nearbyBusinesses = await BusinessService.findNearby(
  userLocation,  // obtido via LocationService
  radius
);
```

---

## 📁 ESTRUTURA DE PASTAS

```
src/core/
├── location/                         # SSOT territorial
│   ├── services/
│   │   └── LocationService.ts        # Serviço principal
│   ├── hooks/
│   │   ├── useLocation.ts            # Hook de localização por ID
│   │   ├── useLocationByPath.ts      # Hook por path
│   │   ├── useLocationContext.ts     # Hook de contexto ativo
│   │   └── useLocationTree.ts        # Hook de navegação (ancestors/descendants)
│   ├── providers/
│   │   └── LocationContextProvider.tsx # Provider de contexto geográfico
│   ├── types/
│   │   └── index.ts                  # Location, LocationType, LocationTree
│   ├── utils/
│   │   ├── path.ts                   # Manipulação de geographic_path
│   │   ├── tree.ts                   # Navegação de árvore
│   │   └── validation.ts             # Validação de integridade
│   └── index.ts                      # Barrel export
│
├── coverage/                         # SSOT de cobertura de entidades
│   ├── services/
│   │   ├── CoverageService.ts        # Regras e orquestração canônicas
│   │   └── ICoverageService.ts       # Contrato do domínio
│   ├── repositories/
│   │   ├── ICoverageRepository.ts    # Porta de persistência
│   │   └── CoverageRepositorySupabase.ts # RPCs transacionais autorizados
│   ├── ports/                        # Integração espacial sem duplicar domínio
│   ├── types/
│   │   └── index.ts                  # ServiceArea, CoverageType
│   └── index.ts                      # API pública do domínio
│
├── geospatial/                       # Busca, limites e cálculos espaciais
│   ├── services/                     # SpatialSearch e BoundaryService
│   ├── repositories/                 # Consultas geoespaciais
│   ├── hooks/                        # useSpatialSearch e useGeocoding
│   └── components/                   # UI espacial genérica
│
└── rollout/                          # Rollout de módulos
    ├── services/
    │   └── RolloutService.ts         # Serviço principal
    ├── hooks/
    │   ├── useModuleRollout.ts       # Hook de status de módulo
    │   └── useActiveModules.ts       # Hook de módulos ativos
    ├── types/
    │   └── index.ts                  # ModuleRollout, ModuleKey
    ├── utils/
    │   ├── inheritance.ts            # Lógica de herança
    │   └── validation.ts             # Validação de rollout
    └── index.ts                      # Barrel export
```

```
src/integrations/
└── maps/                             # Integração com mapas externos
    ├── services/
    │   ├── GeocodingService.ts       # Geocoding/reverse geocoding
    │   ├── GeolocationService.ts     # GPS do browser
    │   └── DistanceService.ts        # Cálculos geoespaciais
    ├── hooks/
    │   ├── useGeocoding.ts           # Hook de geocoding
    │   ├── useGeolocation.ts         # Hook de GPS
    │   └── useDistance.ts            # Hook de distância
    ├── types/
    │   └── index.ts                  # Coordinates, GeocodingResult
    ├── utils/
    │   ├── distance.ts               # Haversine, etc
    │   └── formatting.ts             # Formatação de coordenadas
    └── index.ts                      # Barrel export
```

---

## 🔐 PADRÃO CANÔNICO DE `geographic_path`

### Formato Oficial ✅
```
/{country_code}/{state_code}/{city_slug}/{district_slug}
```

### Regras
- **country**: código ISO 3166-1 alpha-2 (2 letras minúsculas)
- **state**: código de estado (2 letras minúsculas)
- **city**: slug da cidade (kebab-case)
- **district**: slug do bairro (kebab-case)

### Exemplos Válidos
```
/br                           # País: Brasil
/br/ba                        # Estado: Bahia
/br/ba/salvador               # Cidade: Salvador
/br/ba/salvador/pituba        # Bairro: Pituba
/br/sp/sao-paulo              # Cidade: São Paulo
/br/sp/sao-paulo/vila-mariana # Bairro: Vila Mariana
/br/rj/rio-de-janeiro         # Cidade: Rio de Janeiro
/br/rj/rio-de-janeiro/ipanema # Bairro: Ipanema
```

### Justificativa
- **Consistência**: códigos para níveis administrativos (country, state)
- **Legibilidade**: slugs para níveis urbanos (city, district)
- **SEO-friendly**: URLs amigáveis para cidades e bairros
- **Internacionalização**: códigos ISO padrão para países
- **Escalabilidade**: suporta múltiplos países facilmente

---

## 📊 EXEMPLOS DE USO

### Exemplo 1: Criar Business com Validação Geográfica

```typescript
// modules/business/services/BusinessService.ts
import { LocationService } from '@/core/location';
import { CoverageService } from '@/core/coverage';
import { RolloutService } from '@/core/rollout';

async function createBusiness(data: CreateBusinessData) {
  // 1. Validar localização existe e está ativa
  const location = await LocationService.getLocationById(data.locationId);
  if (!location.is_active) {
    throw new Error('Location not active');
  }
  
  // 2. Verificar se módulo business está ativo nesta localização
  const isActive = await RolloutService.isModuleActive('business', data.locationId);
  if (!isActive) {
    throw new Error('Business module not active in this location');
  }
  
  // 3. Criar business
  const business = await createBusinessRecord(data);
  
  // 4. Definir cobertura
  await CoverageService.setCoverage(business.id, data.coverageLocationIds);
  
  return business;
}
```

### Exemplo 2: Buscar Businesses em Localização

```typescript
// modules/business/services/BusinessService.ts
import { CoverageService } from '@/core/coverage';

async function findBusinessesInLocation(locationId: string) {
  // Coverage resolve quais businesses cobrem esta localização
  const businessIds = await CoverageService.getEntitiesCovering(locationId);
  
  // Buscar detalhes dos businesses
  return await getBusinessesByIds(businessIds);
}
```

### Exemplo 3: Verificar Módulo Disponível

```typescript
// modules/mobility/pages/MobilityPage.tsx
import { RolloutService } from '@/core/rollout';
import { useLocationContext } from '@/core/location';

function MobilityPage() {
  const { activeLocation } = useLocationContext();
  const [isAvailable, setIsAvailable] = useState(false);
  
  useEffect(() => {
    if (activeLocation) {
      RolloutService.isModuleActive('mobility', activeLocation.id)
        .then(setIsAvailable);
    }
  }, [activeLocation]);
  
  if (!isAvailable) {
    return <ModuleNotAvailableMessage />;
  }
  
  return <MobilityContent />;
}
```

---

## ✅ CHECKLIST DE CONGELAMENTO - ETAPA 1

### Conceitos Fundamentais ✅
- [x] `core/location` é SSOT territorial (não wrapper de GPS)
- [x] Hierarquia geográfica pertence a `location` (não coverage)
- [x] Separação clara: location vs coverage vs rollout vs maps
- [x] Coordenadas lat/lng pertencem a `integrations/maps`
- [x] Geocoding pertence a `integrations/maps`

### Responsabilidades Definidas ✅
- [x] `core/location`: hierarquia, árvore, contexto
- [x] `core/coverage`: cobertura de entidades
- [x] `core/rollout`: ativação de módulos
- [x] `integrations/maps`: GPS, geocoding, distância

### Limites e Dependências ✅
- [x] `location` → shared apenas
- [x] `coverage` → location + shared
- [x] `rollout` → location + shared (NÃO usa coverage)
- [x] `maps` → shared apenas (sem dependência de core)
- [x] Módulos → core/* + integrations/maps

### Padrão `geographic_path` ✅
- [x] Formato: `/{country_code}/{state_code}/{city_slug}/{district_slug}`
- [x] Exemplos: `/br/ba/salvador/pituba`, `/br/sp/sao-paulo/vila-mariana`
- [x] Códigos ISO para country/state
- [x] Slugs kebab-case para city/district

### Estrutura de Pastas ✅
- [x] Estrutura de `core/location` definida
- [x] Estrutura de `core/coverage` definida
- [x] Estrutura de `core/rollout` definida
- [x] Estrutura de `integrations/maps` definida
- [x] Padrão consistente: services/hooks/types/utils

### Regras para Módulos ✅
- [x] Proibições documentadas (6 regras)
- [x] Permissões documentadas
- [x] Exemplos de uso correto
- [x] Exemplos de uso incorreto

### Documentação ✅
- [x] Documento oficial criado
- [x] Responsabilidades claras
- [x] Fluxo de dependências
- [x] Exemplos práticos
- [x] Checklist de congelamento

---

## 🔄 PRÓXIMAS ETAPAS

### Etapa 2: Contratos Públicos (PRÓXIMA)
- Definir interfaces TypeScript
- Definir tipos compartilhados
- Definir assinaturas de métodos
- Definir tipos de retorno
- Definir tipos de erro

### Etapa 3: Schema de Dados
- Definir tabelas
- Definir relacionamentos
- Definir índices
- Definir constraints

### Etapa 4: Migrations
- Criar migrations
- Popular dados iniciais
- Validar integridade

### Etapa 5: Implementação
- Implementar services
- Implementar hooks
- Implementar providers
- Implementar utils

### Etapa 6: Integração
- Integrar com módulos
- Migrar código existente
- Validar funcionamento

---

## 📚 REFERÊNCIAS

### Documentos Relacionados
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura geral do projeto
- [CURRENT_RULES.md](./CURRENT_RULES.md) - Regras vigentes
- [DATA_MODELING.md](./DATA_MODELING.md) - Modelagem de dados

### Padrões Seguidos
- Feature-first architecture
- SSOT (Single Source of Truth)
- Separation of concerns
- Dependency inversion

---

**Versão**: 1.0.0  
**Status**: ✅ CONGELADO  
**Última Atualização**: 2026-03-24  
**Próxima Etapa**: Contratos Públicos

