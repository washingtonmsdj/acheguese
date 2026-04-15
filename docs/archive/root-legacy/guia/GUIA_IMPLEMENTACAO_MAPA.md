# Guia de Implementação - Sistema de Mapas

## Status Atual

✅ **ETAPA 1 CONCLUÍDA** - Fundação Geográfica

A fundação robusta do sistema de mapas está implementada e validada:
- Tipos e contratos completos
- Services centrais funcionais
- Providers básicos implementados
- Testes unitários criados
- Documentação completa
- TypeCheck passando sem erros

## Próximas Etapas

### ETAPA 2: Hooks React (1-2 dias)

#### Objetivo
Criar hooks para consumir os services em componentes React.

#### Entregas

**1. useMapLayers** - Gerenciar camadas
```typescript
// src/core/maps/hooks/useMapLayers.ts
import { useState, useCallback } from 'react';
import { mapLayerRegistry } from '../services';
import type { MapLayerKey, MapLayersState } from '../types';

export function useMapLayers() {
  const [layersState, setLayersState] = useState<MapLayersState>(() =>
    mapLayerRegistry.getLayersState()
  );

  const toggleLayer = useCallback((key: MapLayerKey) => {
    const current = mapLayerRegistry.getLayer(key);
    if (current) {
      mapLayerRegistry.setLayerVisibility(key, !current.visible);
      setLayersState(mapLayerRegistry.getLayersState());
    }
  }, []);

  const setLayerVisibility = useCallback((key: MapLayerKey, visible: boolean) => {
    mapLayerRegistry.setLayerVisibility(key, visible);
    setLayersState(mapLayerRegistry.getLayersState());
  }, []);

  const resetLayers = useCallback(() => {
    mapLayerRegistry.reset();
    setLayersState(mapLayerRegistry.getLayersState());
  }, []);

  return {
    layersState,
    toggleLayer,
    setLayerVisibility,
    resetLayers,
    allLayers: mapLayerRegistry.getAllLayers(),
    visibleLayers: mapLayerRegistry.getVisibleLayers(),
  };
}
```

**2. useMapViewport** - Gerenciar viewport
```typescript
// src/core/maps/hooks/useMapViewport.ts
import { useState, useCallback } from 'react';
import { mapViewportService, DEFAULT_VIEWPORT } from '../services';
import type { MapViewport, Coordinates, MapMarker } from '../types';

export function useMapViewport(initialViewport?: MapViewport) {
  const [viewport, setViewport] = useState<MapViewport>(
    initialViewport || DEFAULT_VIEWPORT
  );

  const centerOn = useCallback((coordinates: Coordinates, zoom?: number) => {
    const newViewport = mapViewportService.createViewport(coordinates, zoom);
    setViewport(newViewport);
  }, []);

  const fitMarkers = useCallback((markers: MapMarker[], padding?: number) => {
    const newViewport = mapViewportService.createViewportForMarkers(markers, padding);
    setViewport(newViewport);
  }, []);

  const fitBounds = useCallback((bounds: [number, number, number, number], padding?: number) => {
    const newViewport = mapViewportService.createViewportFromBounds(bounds, padding);
    setViewport(newViewport);
  }, []);

  return {
    viewport,
    setViewport,
    centerOn,
    fitMarkers,
    fitBounds,
  };
}
```

**3. useMapMarkers** - Carregar marcadores
```typescript
// src/core/maps/hooks/useMapMarkers.ts
import { useMemo } from 'react';
import { mapEntityProjection } from '../services';
import type { MapMarker, MapEntityType } from '../types';

interface UseMapMarkersOptions {
  entities: any[];
  type: MapEntityType;
  includeMetadata?: boolean;
  calculateScore?: boolean;
}

export function useMapMarkers({
  entities,
  type,
  includeMetadata = false,
  calculateScore = false,
}: UseMapMarkersOptions) {
  const markers = useMemo(() => {
    return mapEntityProjection.projectEntities(entities, type, {
      includeMetadata,
      calculateScore,
    });
  }, [entities, type, includeMetadata, calculateScore]);

  const validMarkers = useMemo(() => {
    return markers.filter((m) => m !== null);
  }, [markers]);

  return {
    markers: validMarkers,
    count: validMarkers.length,
    hasMarkers: validMarkers.length > 0,
  };
}
```

**4. useMapState** - Estado completo com URL
```typescript
// src/core/maps/hooks/useMapState.ts
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mapUrlState } from '../services';
import type { MapState } from '../types';

export function useMapState(defaultState: MapState) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [state, setState] = useState<MapState>(() => {
    const urlState = mapUrlState.deserializeFromUrl(searchParams);
    return mapUrlState.mergeWithDefaults(urlState, defaultState);
  });

  // Sincronizar com URL
  useEffect(() => {
    const queryString = mapUrlState.serializeToUrl(state);
    if (queryString) {
      setSearchParams(new URLSearchParams(queryString.slice(1)));
    }
  }, [state, setSearchParams]);

  const updateState = useCallback((updates: Partial<MapState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    state,
    setState,
    updateState,
  };
}
```

**5. useGeocode** - Busca de lugares
```typescript
// src/core/maps/hooks/useGeocode.ts
import { useState, useCallback } from 'react';
import { providerRegistry } from '../services';
import type { GeocodeResult, GeocodingOptions } from '../types';

export function useGeocode() {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const geocode = useCallback(async (address: string, options?: GeocodingOptions) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = providerRegistry.getGeocodingProvider();
      const results = await provider.geocode(address, options);
      setResults(results);
      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Geocoding failed');
      setError(error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (coordinates: Coordinates, options?: GeocodingOptions) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = providerRegistry.getGeocodingProvider();
      const results = await provider.reverseGeocode(coordinates, options);
      setResults(results);
      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Reverse geocoding failed');
      setError(error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    results,
    isLoading,
    error,
    geocode,
    reverseGeocode,
  };
}
```

**6. useUserLocation** - Localização do usuário
```typescript
// src/core/maps/hooks/useUserLocation.ts
import { useState, useEffect, useCallback } from 'react';
import type { Coordinates } from '../types';

interface UseUserLocationOptions {
  watch?: boolean;
  enableHighAccuracy?: boolean;
}

export function useUserLocation(options: UseUserLocationOptions = {}) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation not supported',
      } as GeolocationPositionError);
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (error) => {
        setError(error);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [options.enableHighAccuracy]);

  useEffect(() => {
    if (options.watch && location) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => setError(error)
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [options.watch, location]);

  return {
    location,
    isLoading,
    error,
    requestLocation,
    hasLocation: location !== null,
  };
}
```

#### Testes dos Hooks

Criar testes para cada hook usando `@testing-library/react-hooks`.

### ETAPA 3: Componentes Base (2-3 dias)

#### Objetivo
Criar componentes reutilizáveis de mapa.

#### Entregas

**1. MapContainer** - Container principal
```typescript
// src/core/maps/components/MapContainer.tsx
interface MapContainerProps {
  viewport: MapViewport;
  onViewportChange?: (viewport: MapViewport) => void;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  children?: React.ReactNode;
}

export function MapContainer({ ... }: MapContainerProps) {
  // Usar MapLibreMap existente
  // Adicionar controles
  // Renderizar marcadores
}
```

**2. MapMarkerLayer** - Camada de marcadores
```typescript
// src/core/maps/components/MapMarkerLayer.tsx
interface MapMarkerLayerProps {
  markers: MapMarker[];
  visible: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
  clustering?: boolean;
}

export function MapMarkerLayer({ ... }: MapMarkerLayerProps) {
  // Renderizar marcadores
  // Aplicar clustering se habilitado
  // Gerenciar eventos de clique
}
```

**3. MapControls** - Controles de zoom, layers
```typescript
// src/core/maps/components/MapControls.tsx
interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLayersToggle: () => void;
  onUserLocationClick: () => void;
}

export function MapControls({ ... }: MapControlsProps) {
  // Botões de controle
  // Estilo consistente
  // Acessibilidade
}
```

**4. MapSearch** - Busca geográfica
```typescript
// src/core/maps/components/MapSearch.tsx
interface MapSearchProps {
  onResultSelect: (result: GeocodeResult) => void;
  placeholder?: string;
}

export function MapSearch({ ... }: MapSearchProps) {
  const { geocode, results, isLoading } = useGeocode();
  
  // Input com autocomplete
  // Lista de resultados
  // Debounce de busca
}
```

**5. MapItemList** - Lista sincronizada
```typescript
// src/core/maps/components/MapItemList.tsx
interface MapItemListProps {
  markers: MapMarker[];
  selectedId?: string;
  onItemClick: (marker: MapMarker) => void;
}

export function MapItemList({ ... }: MapItemListProps) {
  // Lista de itens
  // Sincronização com mapa
  // Scroll to selected
}
```

### ETAPA 4: Página /mapa (3-4 dias)

#### Objetivo
Criar página canônica de mapa.

#### Estrutura

```typescript
// src/modules/map/pages/MapPage.tsx
export function MapPage() {
  const { activeLocation } = useActiveTerritory();
  const { layersState, toggleLayer } = useMapLayers();
  const { viewport, setViewport, fitMarkers } = useMapViewport();
  const { state, updateState } = useMapState(defaultState);
  
  // Carregar marcadores por camada
  const { markers: businessMarkers } = useMapMarkers({
    entities: businesses,
    type: 'business',
  });
  
  // Renderizar mapa + lista
  return (
    <div className="map-page">
      <MapContainer
        viewport={viewport}
        onViewportChange={setViewport}
        markers={allMarkers}
      >
        <MapControls />
        <MapSearch />
      </MapContainer>
      
      <MapItemList
        markers={visibleMarkers}
        selectedId={state.selectedMarkerId}
        onItemClick={handleItemClick}
      />
    </div>
  );
}
```

#### Rota

```typescript
// src/app/pages/routes.tsx
<Route path="/mapa/:uf/:cidade" element={<MapPage />} />
<Route path="/mapa/:uf/:cidade/:bairro" element={<MapPage />} />
```

### ETAPA 5: Integração com Módulos (2-3 dias)

#### Objetivo
Integrar mapa com módulos existentes.

#### Entregas

**1. Botão "Ver no Mapa"**
```typescript
// src/shared/components/ViewOnMapButton.tsx
interface ViewOnMapButtonProps {
  entity: { id: string; coordinates: Coordinates };
  type: MapEntityType;
}

export function ViewOnMapButton({ entity, type }: ViewOnMapButtonProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    const { latitude, longitude } = entity.coordinates;
    navigate(`/mapa/ba/salvador?lat=${latitude}&lng=${longitude}&selected=${entity.id}`);
  };
  
  return <Button onClick={handleClick}>Ver no Mapa</Button>;
}
```

**2. Mapa em Detalhes**
```typescript
// src/modules/business/components/BusinessDetailMap.tsx
export function BusinessDetailMap({ business }: { business: Business }) {
  const marker = mapEntityProjection.projectBusiness(business);
  
  return (
    <MapContainer
      viewport={mapViewportService.createViewport(business.coordinates, 16)}
      markers={marker ? [marker] : []}
    />
  );
}
```

**3. Filtro "Perto de Mim"**
```typescript
// src/modules/business/components/BusinessFilters.tsx
export function BusinessFilters() {
  const { location, requestLocation } = useUserLocation();
  
  const handleNearMe = () => {
    requestLocation();
    if (location) {
      // Filtrar por raio
      const nearby = businesses.filter((b) =>
        mapViewportService.calculateDistance(location, b.coordinates) < 5000
      );
    }
  };
  
  return <Button onClick={handleNearMe}>Perto de Mim</Button>;
}
```

### ETAPA 6: Routing Real (3-5 dias)

#### Objetivo
Substituir MockRoutingProvider por OSRM.

#### Passos

**1. Configurar OSRM**
- Instalar servidor OSRM local ou usar serviço público
- Configurar dados do Brasil
- Testar endpoints

**2. Implementar OSRMRoutingProvider**
```typescript
// src/integrations/maps/providers/OSRMRoutingProvider.ts
export class OSRMRoutingProvider implements RoutingProvider {
  private baseUrl = 'http://router.project-osrm.org';
  
  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    const { origin, destination, options } = request;
    
    const url = `${this.baseUrl}/route/v1/${options.profile}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return this.mapToRouteResponse(data);
  }
  
  // ... implementar ETA e validate
}
```

**3. Registrar e Ativar**
```typescript
// src/integrations/maps/setup.ts
import { osrmRoutingProvider } from './providers/OSRMRoutingProvider';

providerRegistry.registerRoutingProvider('osrm', osrmRoutingProvider);
providerRegistry.setActiveProviders({ routing: 'osrm' });
```

**4. Fallback Strategy**
```typescript
// Tentar OSRM, fallback para mock
try {
  const route = await osrmProvider.calculateRoute(request);
} catch (error) {
  console.warn('OSRM failed, using mock');
  const route = await mockProvider.calculateRoute(request);
}
```

## Checklist de Implementação

### ETAPA 2: Hooks
- [ ] useMapLayers
- [ ] useMapViewport
- [ ] useMapMarkers
- [ ] useMapState
- [ ] useGeocode
- [ ] useUserLocation
- [ ] Testes dos hooks
- [ ] Documentação

### ETAPA 3: Componentes
- [ ] MapContainer
- [ ] MapMarkerLayer
- [ ] MapControls
- [ ] MapSearch
- [ ] MapItemList
- [ ] Testes dos componentes
- [ ] Storybook (opcional)

### ETAPA 4: Página
- [ ] MapPage
- [ ] Rota /mapa/:uf/:cidade
- [ ] Integração com território
- [ ] Filtros por camada
- [ ] Lista + mapa sincronizados
- [ ] Deep linking
- [ ] Mobile responsive

### ETAPA 5: Integração
- [ ] ViewOnMapButton
- [ ] BusinessDetailMap
- [ ] Filtro "Perto de Mim"
- [ ] Links em listagens
- [ ] Breadcrumbs

### ETAPA 6: Routing
- [ ] OSRMRoutingProvider
- [ ] Configurar servidor
- [ ] Testes de roteamento
- [ ] Fallback strategy
- [ ] Documentação

## Estimativas

| Etapa | Dias | Complexidade |
|-------|------|--------------|
| 2. Hooks | 1-2 | Baixa |
| 3. Componentes | 2-3 | Média |
| 4. Página | 3-4 | Alta |
| 5. Integração | 2-3 | Média |
| 6. Routing | 3-5 | Alta |
| **TOTAL** | **11-17 dias** | - |

## Riscos e Mitigações

### Risco: Performance com muitos marcadores
**Mitigação**: Implementar clustering na Etapa 3

### Risco: OSRM não disponível
**Mitigação**: Manter MockRoutingProvider como fallback

### Risco: Coordenadas inválidas
**Mitigação**: Validação já implementada nos services

### Risco: Mobile UX ruim
**Mitigação**: Testar em dispositivos reais desde Etapa 3

## Recursos Necessários

### Desenvolvimento
- 1 desenvolvedor full-time
- Acesso a servidor OSRM (Etapa 6)
- Dispositivos móveis para teste

### Infraestrutura
- Servidor OSRM (pode ser público inicialmente)
- CDN para tiles (já configurado com OSM)
- Monitoramento de erros

### Design
- Ícones de marcadores por tipo
- Cores de camadas
- UI de controles

## Conclusão

A fundação está sólida. As próximas etapas são incrementais e bem definidas.

**Prioridade**: Começar pela Etapa 2 (Hooks) para desbloquear desenvolvimento de UI.

**Meta**: MVP funcional em 2-3 semanas.
