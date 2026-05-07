# Maps Module - Fundação Geográfica

Sistema de mapas robusto, escalável e preparado para mobilidade.

## Arquitetura

### Princípios

1. **SSOT Obrigatório**: Database → Services → Hooks → Components
2. **Provider Abstraction**: Nenhum provider específico vaza para o domínio
3. **Domínio antes de UI**: Contratos, services e adapters primeiro
4. **Escalabilidade Territorial**: Respeita modelo territorial (país → estado → cidade → bairro)
5. **Preparado para Mobilidade**: Contratos prontos para corridas, rotas, ETA

### Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                        MODULES                              │
│  /modules/map, /modules/mobility, /modules/guide           │
│  (UI, páginas, componentes visuais)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      CORE/MAPS                              │
│  Types, Services, Contratos                                 │
│  - MapLayerRegistryService                                  │
│  - MapEntityProjectionService                               │
│  - MapViewportService                                       │
│  - MapUrlStateService                                       │
│  - ProviderRegistryService                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   INTEGRATIONS/MAPS                         │
│  Providers (OSM, Nominatim, OSRM, etc)                     │
│  - OSMTileProvider                                          │
│  - NominatimGeocodingProvider                               │
│  - MockRoutingProvider (temporário)                         │
└─────────────────────────────────────────────────────────────┘
```

## Tipos Principais

### Core Types (`types/core.ts`)

- `Coordinates`: Coordenadas geográficas WGS84
- `MapViewport`: Estado visual da câmera
- `MapMarker`: Marcador genérico no mapa
- `MapLayerKey`: Camadas disponíveis
- `MapState`: Estado completo serializável
- `GeocodeResult`: Resultado de geocoding
- `ServiceArea`: Área de serviço/cobertura

### Routing Types (`types/routing.ts`)

- `RouteRequest/Response`: Roteamento
- `ETARequest/Response`: Tempo estimado de chegada
- `DistanceMatrixRequest/Response`: Matriz de distâncias
- `IsochroneRequest/Response`: Áreas de alcance
- `MapMatchingRequest/Response`: Snap to roads
- `Trip`: Trajeto com replay

### Provider Types (`types/providers.ts`)

- `MapTileProvider`: Interface para tiles
- `GeocodingProvider`: Interface para geocoding
- `RoutingProvider`: Interface para routing
- `DistanceMatrixProvider`: Interface para matriz
- `IsochroneProvider`: Interface para isócronas
- `MapMatchingProvider`: Interface para map matching

## Services

### MapLayerRegistryService

SSOT para configuração de camadas do mapa.

```typescript
import { mapLayerRegistry } from '@/core/maps';

// Obter camada
const layer = mapLayerRegistry.getLayer('businesses');

// Atualizar visibilidade
mapLayerRegistry.setLayerVisibility('events', true);

// Obter estado
const state = mapLayerRegistry.getLayersState();
```

### MapEntityProjectionService

SSOT para transformação de entidades do domínio em marcadores.

```typescript
import { mapEntityProjection } from '@/core/maps';

// Projetar business
const marker = mapEntityProjection.projectBusiness(business, {
  includeMetadata: true,
  calculateScore: true,
});

// Projetar múltiplas entidades
const markers = mapEntityProjection.projectEntities(
  businesses,
  'business',
  { baseUrl: '/empresas' }
);
```

### MapViewportService

SSOT para cálculos de viewport.

```typescript
import { mapViewportService } from '@/core/maps';

// Criar viewport para marcadores
const viewport = mapViewportService.createViewportForMarkers(markers);

// Verificar se está no viewport
const isVisible = mapViewportService.isInViewport(coordinates, viewport);

// Calcular distância
const distance = mapViewportService.calculateDistance(coord1, coord2);
```

### MapUrlStateService

SSOT para serialização de estado em URL.

```typescript
import { mapUrlState } from '@/core/maps';

// Serializar para URL
const queryString = mapUrlState.serializeToUrl(mapState);

// Deserializar da URL
const state = mapUrlState.readFromCurrentUrl();

// Atualizar URL
mapUrlState.updateUrl(mapState);
```

### ProviderRegistryService

SSOT para gerenciamento de providers.

```typescript
import { providerRegistry } from '@/core/maps';

// Registrar provider
providerRegistry.registerTileProvider('osm', osmProvider);

// Ativar provider
providerRegistry.setActiveProviders({ tiles: 'osm' });

// Obter provider ativo
const tileProvider = providerRegistry.getTileProvider();
```

## Providers

### OSMTileProvider

Provider de tiles OpenStreetMap.

```typescript
import { osmTileProvider } from '@/integrations/maps';

const config = osmTileProvider.getTileConfig('streets');
// { name: 'osm-streets', styleUrl: '...', attribution: '...' }
```

### NominatimGeocodingProvider

Provider de geocoding Nominatim (via proxy Supabase).

```typescript
import { nominatimGeocodingProvider } from '@/integrations/maps';

// Geocoding
const results = await nominatimGeocodingProvider.geocode('Salvador, BA');

// Reverse geocoding
const results = await nominatimGeocodingProvider.reverseGeocode({
  latitude: -12.9714,
  longitude: -38.5014,
});
```

### MockRoutingProvider

Provider mock de routing (temporário).

```typescript
import { mockRoutingProvider } from '@/integrations/maps';

const response = await mockRoutingProvider.calculateRoute({
  origin: { latitude: -12.9714, longitude: -38.5014 },
  destination: { latitude: -12.9800, longitude: -38.5100 },
  options: { profile: 'driving' },
});
```

## Setup

Configurar providers padrão no início da aplicação:

```typescript
import { setupDefaultProviders } from '@/integrations/maps';

// No main.tsx ou App.tsx
setupDefaultProviders();
```

## Camadas Disponíveis

- `businesses`: Empresas
- `gastronomy`: Gastronomia
- `services`: Serviços
- `classifieds`: Classificados
- `events`: Eventos
- `alerts`: Alertas comunitários
- `professionals`: Profissionais
- `tourist_points`: Pontos turísticos
- `mobility`: Mobilidade (preparado)
- `user_location`: Localização do usuário
- `service_areas`: Áreas de atendimento
- `boundaries`: Limites territoriais

## Tipos de Entidades

- `business`: Empresas
- `service`: Serviços
- `classified`: Classificados
- `event`: Eventos
- `alert`: Alertas
- `professional`: Profissionais
- `tourist_point`: Pontos turísticos
- `driver`: Motoristas (mobilidade)
- `ride`: Corridas (mobilidade)
- `user_location`: Localização do usuário

## Preparação para Mobilidade

A arquitetura já está preparada para:

- ✅ Rotas e navegação
- ✅ ETA (Estimated Time of Arrival)
- ✅ Matriz de distâncias
- ✅ Isócronas (áreas de alcance)
- ✅ Map matching (snap to roads)
- ✅ Replay de trajeto
- ✅ Áreas de cobertura
- ✅ Posição de motoristas

Contratos definidos, sem acoplamento prematuro.

## Próximos Passos

1. ✅ Tipos e contratos
2. ✅ Services centrais
3. ✅ Providers (OSM, Nominatim, Mock)
4. ✅ Hooks React
5. ✅ Componentes de mapa
6. ✅ Página `/mapa/:state/:city`, `/mapa/:state/:city/:district` e `/mapa/:state/:city/area/:groupSlug`
7. ✅ Integração com módulos existentes (businesses, gastronomy, events, alerts, tourist points)
8. ⏳ Provider real de routing (OSRM/Valhalla)
9. ✅ Clustering nativo
10. ⏳ Paginação espacial (otimização futura)

## Regras de Importação

### ✅ PERMITIDO

```typescript
// Módulos podem importar de core/maps
import { mapLayerRegistry, MapMarker } from '@/core/maps';

// Core/maps pode importar de core/location
import { useActiveTerritory } from '@/core/location';

// Integrations/maps pode importar de core/maps
import type { GeocodingProvider } from '@/core/maps/types';
```

### ❌ PROIBIDO

```typescript
// NUNCA importar provider diretamente em módulo
import { nominatimGeocodingProvider } from '@/integrations/maps'; // ❌

// NUNCA importar Supabase em componente de mapa
import { supabase } from '@/integrations/supabase'; // ❌

// NUNCA duplicar lógica de projeção
function businessToMarker(business) { ... } // ❌ Usar mapEntityProjection
```

## Testes

```bash
# Rodar testes
npm test src/core/maps

# Testes específicos
npm test MapLayerRegistryService
npm test MapEntityProjectionService
npm test MapViewportService
```

## Contribuindo

1. Seguir SSOT rigorosamente
2. Nunca acoplar a provider específico
3. Sempre usar services para transformações
4. Documentar contratos públicos
5. Adicionar testes para novos services
