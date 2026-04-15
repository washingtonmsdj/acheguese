# Arquitetura do Sistema de Mapas

## Visão Geral

Sistema de mapas robusto, escalável e preparado para mobilidade, seguindo princípios SSOT e provider abstraction.

## Princípios Arquiteturais

### 1. SSOT (Single Source of Truth)

Fluxo unidirecional de dados:

```
Database → Services → Hooks → Components
```

**Proibido**:
- Chamar Supabase diretamente de componentes
- Duplicar lógica de transformação
- Criar mini-SSOTs locais

### 2. Provider Abstraction

Nenhum provider específico vaza para o domínio:

```
Domain (core/maps) → Contracts → Providers (integrations/maps)
```

**Benefícios**:
- Trocar OSM por Google Maps sem quebrar código
- Testar com mocks facilmente
- Adicionar novos providers sem refactor

### 3. Separation of Concerns

```
┌─────────────────────────────────────────┐
│  MODULES (UI)                           │
│  /modules/map, /modules/mobility        │
│  - Páginas, componentes visuais         │
│  - Hooks de UI                          │
└─────────────────────────────────────────┘
              ↓ usa
┌─────────────────────────────────────────┐
│  CORE (Domain)                          │
│  /core/maps                             │
│  - Types, Services, Contratos           │
│  - Lógica de negócio                    │
│  - Hooks de dados                       │
└─────────────────────────────────────────┘
              ↓ usa
┌─────────────────────────────────────────┐
│  INTEGRATIONS (Providers)               │
│  /integrations/maps                     │
│  - Implementações de providers          │
│  - Adaptação de APIs externas           │
└─────────────────────────────────────────┘
```

### 4. Domínio Antes de UI

Ordem de implementação:

1. ✅ Tipos e contratos
2. ✅ Services
3. ✅ Providers
4. ⏳ Hooks
5. ⏳ Componentes
6. ⏳ Páginas

## Camadas

### Types Layer

**Responsabilidade**: Definir contratos estáveis.

**Arquivos**:
- `types/core.ts` - Tipos fundamentais
- `types/routing.ts` - Tipos de mobilidade
- `types/providers.ts` - Contratos de providers

**Regras**:
- Tipos devem ser agnósticos de implementação
- Sem lógica, apenas definições
- Exportar validadores quando necessário

### Services Layer

**Responsabilidade**: Lógica de negócio centralizada.

**Services**:

1. **MapLayerRegistryService**
   - SSOT de configuração de camadas
   - Gerencia visibilidade
   - Filtra por zoom

2. **MapEntityProjectionService**
   - SSOT de transformação de entidades
   - Valida coordenadas
   - Calcula scores
   - Extrai metadados

3. **MapViewportService**
   - SSOT de cálculos espaciais
   - Cria viewports
   - Calcula distâncias
   - Filtra por viewport

4. **MapUrlStateService**
   - SSOT de serialização
   - Persiste estado em URL
   - Deep linking

5. **ProviderRegistryService**
   - SSOT de providers
   - Registro dinâmico
   - Ativação/troca

**Regras**:
- Services são singletons
- Sem estado mutável (exceto registry)
- Funções puras quando possível
- Sem dependências de UI

### Providers Layer

**Responsabilidade**: Implementar contratos de providers.

**Providers Implementados**:

1. **OSMTileProvider**
   - Tiles OpenStreetMap
   - Estilos: streets, light, dark
   - Sem API key

2. **NominatimGeocodingProvider**
   - Geocoding via Nominatim
   - Proxy Supabase
   - Autocomplete

3. **MockRoutingProvider**
   - Routing temporário
   - Linha reta
   - Deve ser substituído

**Regras**:
- Implementar interface completa
- Tratar erros internamente
- Retornar tipos do domínio
- Sem vazamento de tipos do provider

## Fluxo de Dados

### Carregamento de Marcadores

```
1. Component chama hook
   useMapMarkers({ layer: 'businesses' })

2. Hook usa service
   mapEntityProjection.projectEntities(businesses, 'business')

3. Service valida e transforma
   - Valida coordenadas
   - Normaliza status
   - Calcula score
   - Extrai metadados

4. Hook retorna MapMarker[]
   Component renderiza marcadores
```

### Geocoding

```
1. Component chama hook
   useGeocode({ query: 'Salvador, BA' })

2. Hook usa provider registry
   providerRegistry.getGeocodingProvider()

3. Provider faz requisição
   nominatimGeocodingProvider.geocode(query)

4. Provider retorna GeocodeResult[]
   Hook retorna para component
```

### Roteamento

```
1. Component chama hook
   useRoute({ origin, destination })

2. Hook usa provider registry
   providerRegistry.getRoutingProvider()

3. Provider calcula rota
   mockRoutingProvider.calculateRoute(request)

4. Provider retorna RouteResponse
   Hook retorna para component
```

## Padrões de Código

### Naming Conventions

**Services**:
```typescript
// Classe: PascalCase + Service
class MapLayerRegistryService { }

// Instância: camelCase
export const mapLayerRegistry = new MapLayerRegistryService();
```

**Types**:
```typescript
// Interfaces: PascalCase
interface MapMarker { }

// Types: PascalCase
type MapLayerKey = 'businesses' | 'events';

// Enums: PascalCase
enum MapEntityStatus { }
```

**Providers**:
```typescript
// Classe: PascalCase + Provider
class OSMTileProvider implements MapTileProvider { }

// Instância: camelCase + Provider
export const osmTileProvider = new OSMTileProvider();
```

### Error Handling

**Provider Errors**:
```typescript
try {
  const provider = providerRegistry.getTileProvider();
} catch (error) {
  if (error instanceof ProviderNotFoundError) {
    // Handle missing provider
  }
  if (error instanceof ProviderNotConfiguredError) {
    // Handle not configured
  }
}
```

**Validation**:
```typescript
// Validar antes de usar
if (!isValidCoordinates(coords)) {
  console.warn('Invalid coordinates');
  return null;
}
```

### Immutability

**Services devem ser stateless**:
```typescript
// ✅ BOM
class MapViewportService {
  calculateDistance(coord1, coord2) {
    // Função pura, sem estado
  }
}

// ❌ RUIM
class MapViewportService {
  private lastViewport: MapViewport; // Estado mutável
}
```

**Registry é exceção**:
```typescript
// ✅ OK - Registry precisa de estado
class MapLayerRegistryService {
  private layers: Map<MapLayerKey, MapLayerConfig>;
}
```

## Extensibilidade

### Adicionar Nova Camada

1. Adicionar key em `MapLayerKey`:
```typescript
export type MapLayerKey =
  | 'businesses'
  | 'my_new_layer'; // ← adicionar aqui
```

2. Adicionar configuração em `MapLayerRegistryService`:
```typescript
const DEFAULT_LAYERS: Record<MapLayerKey, MapLayerConfig> = {
  my_new_layer: {
    key: 'my_new_layer',
    label: 'Minha Nova Camada',
    icon: 'icon-name',
    color: '#hex',
    visible: false,
    supportsClustering: true,
  },
};
```

### Adicionar Novo Tipo de Entidade

1. Adicionar tipo em `MapEntityType`:
```typescript
export type MapEntityType =
  | 'business'
  | 'my_entity'; // ← adicionar aqui
```

2. Adicionar método em `MapEntityProjectionService`:
```typescript
projectMyEntity(entity: MappableEntity): MapMarker | null {
  return this.projectEntity(entity, 'my_entity', {
    baseUrl: '/my-entities',
  });
}
```

### Adicionar Novo Provider

1. Implementar interface:
```typescript
class MyTileProvider implements MapTileProvider {
  getTileConfig(style: TileStyle): TileProviderConfig {
    // implementação
  }
  
  getAvailableStyles(): TileStyle[] {
    // implementação
  }
  
  async validate(): Promise<boolean> {
    // implementação
  }
}
```

2. Registrar e ativar:
```typescript
providerRegistry.registerTileProvider('my-provider', myTileProvider);
providerRegistry.setActiveProviders({ tiles: 'my-provider' });
```

## Performance

### Otimizações Implementadas

✅ **Singletons**
- Services são instâncias únicas
- Sem overhead de criação

✅ **Validação Early**
- Coordenadas validadas antes de processar
- Retorno rápido para dados inválidos

✅ **Cálculos Eficientes**
- Haversine otimizado
- Bounds calculados uma vez

### Otimizações Futuras

⏳ **Clustering**
- Supercluster para agrupamento
- Web Worker para processamento

⏳ **Memoization**
- Cache de cálculos pesados
- React.memo em componentes

⏳ **Lazy Loading**
- Providers carregados sob demanda
- Code splitting por camada

⏳ **Viewport Fetching**
- Carregar apenas marcadores visíveis
- Paginação espacial

## Segurança

### Validação de Entrada

✅ **Coordenadas**:
```typescript
if (!isValidCoordinates(coords)) {
  return null; // Rejeitar silenciosamente
}
```

✅ **Bounds**:
```typescript
if (!isValidBoundingBox(bbox)) {
  return DEFAULT_VIEWPORT;
}
```

✅ **Zoom**:
```typescript
clampZoom(zoom: number): number {
  return Math.max(MIN, Math.min(MAX, zoom));
}
```

### Sanitização

✅ **URL State**:
- Validar todos os parâmetros
- Usar valores padrão para inválidos
- Não confiar em query string

✅ **Provider Responses**:
- Validar estrutura de resposta
- Tratar erros de API
- Não vazar dados sensíveis

## Testes

### Estratégia

**Unit Tests**:
- Services (100% coverage desejado)
- Validadores
- Transformações

**Integration Tests**:
- Providers com mocks
- Fluxos completos

**E2E Tests**:
- Interações de usuário
- Deep linking
- Sincronização mapa/lista

### Exemplo

```typescript
describe('MapViewportService', () => {
  it('should calculate distance correctly', () => {
    const distance = service.calculateDistance(coord1, coord2);
    expect(distance).toBeCloseTo(expectedDistance, 1);
  });
});
```

## Monitoramento

### Métricas Importantes

1. **Performance**
   - Tempo de carregamento de marcadores
   - Tempo de geocoding
   - Tempo de roteamento

2. **Erros**
   - Falhas de provider
   - Coordenadas inválidas
   - Timeouts

3. **Uso**
   - Camadas mais usadas
   - Buscas mais comuns
   - Viewports mais acessados

### Logging

```typescript
// Provider errors
console.error('[NominatimGeocoding] Error:', error);

// Validation warnings
console.warn('[MapEntityProjection] Invalid coordinates:', entity.id);

// Info
console.log('[Maps] Default providers configured');
```

## Migração e Compatibilidade

### Legacy Support

Exports legados mantidos para compatibilidade:

```typescript
// Legacy (manter por enquanto)
export { MapsService } from './services/MapsService';

// Novo (usar em código novo)
export { mapViewportService } from './services';
```

### Deprecation Path

1. Marcar como deprecated
2. Adicionar warning no console
3. Documentar alternativa
4. Remover após 2 versões

## Próximos Passos Arquiteturais

### Curto Prazo (1-2 sprints)

1. **Hooks Layer**
   - useMapLayers
   - useMapViewport
   - useMapMarkers
   - useMapState

2. **Components Layer**
   - MapContainer
   - MapMarkerLayer
   - MapControls

### Médio Prazo (3-6 sprints)

1. **Clustering**
   - Supercluster integration
   - Web Worker processing

2. **Real Routing**
   - OSRM provider
   - Fallback strategy

3. **Advanced Features**
   - Heatmaps
   - Service areas
   - Isochrones

### Longo Prazo (6+ sprints)

1. **Mobilidade**
   - Driver tracking
   - Ride matching
   - Real-time updates

2. **Offline Support**
   - Tile caching
   - Offline routing

3. **Analytics**
   - Usage tracking
   - Performance monitoring
