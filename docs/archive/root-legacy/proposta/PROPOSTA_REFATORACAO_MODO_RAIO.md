# Proposta: Refatoração do Modo Raio

**Data**: 2026-04-04  
**Tipo**: Melhoria de Produto + Arquitetura

---

## Problema Identificado

O modo raio no mapa tem **valor de UX limitado**:

1. **Diferença visual pequena**: Usuário já controla área com zoom/pan
2. **Círculo pode confundir**: Não fica claro o que está dentro/fora
3. **Uso inadequado**: Raio é mais útil em listas ordenadas por distância

---

## Solução Proposta

Separar funcionalidades por contexto de uso:

### 1. Página "Perto de Mim" (Nova)
- **Rota**: `/perto-de-mim`
- **Formato**: Lista/Grid com distâncias
- **Ordenação**: Por proximidade
- **Filtros**: Tipo de entidade, raio, categorias

### 2. Filtro de Raio na Busca (Melhoria)
- **Contexto**: Páginas de busca existentes
- **Integração**: Complementa filtros de categoria, preço, etc
- **Formato**: Dropdown de raio + resultados ordenados

### 3. Mapa Normal (Simplificação)
- **Remover**: Controle de raio do mapa
- **Manter**: Zoom, pan, layer control
- **Foco**: Exploração espacial visual

---

## Arquitetura SSOT

### Camada 1: Database (Já existe)
```
✅ Coluna `point GEOMETRY(POINT, 4326)` em todas as tabelas
✅ Índices espaciais GIST
✅ RPC `search_entities_by_radius`
```

### Camada 2: Service (Já existe)
```typescript
// src/core/geospatial/services/SpatialSearchService.ts
✅ searchByRadius(center, radiusKm, entityType, options)
```

### Camada 3: Hooks (Já existe)
```typescript
// src/core/geospatial/hooks/useSpatialSearch.ts
✅ useSpatialSearchByRadius({ center, radiusKm, entityType, ... })
```

### Camada 4: Components (Refatorar)

**Criar:**
- `src/pages/NearbyPage.tsx` - Página "Perto de Mim"
- `src/components/NearbyList.tsx` - Lista com distâncias
- `src/components/RadiusFilter.tsx` - Filtro de raio reutilizável

**Remover:**
- Controle de raio do `MapaPageV4.tsx`
- `MapRadiusControl.tsx` (ou mover para NearbyPage)

---

## Implementação: Página "Perto de Mim"

### Estrutura de Arquivos

```
src/
├── pages/
│   └── NearbyPage.tsx                    # Página principal
├── features/nearby/
│   ├── components/
│   │   ├── NearbyList.tsx               # Lista de resultados
│   │   ├── NearbyCard.tsx               # Card de entidade
│   │   ├── NearbyFilters.tsx            # Filtros (raio, tipo, etc)
│   │   └── NearbyMap.tsx                # Mini mapa (opcional)
│   ├── hooks/
│   │   └── useNearbyEntities.ts         # Hook agregador
│   └── types/
│       └── nearby.types.ts              # Tipos específicos
```

### 1. Hook Agregador

```typescript
// src/features/nearby/hooks/useNearbyEntities.ts

import { useSpatialSearchByRadius } from '@/core/geospatial/hooks/useSpatialSearch';
import { useRobustGeolocation } from '@/shared/hooks';

export interface NearbyEntity {
  id: string;
  type: 'business' | 'event' | 'alert' | 'tourist_point';
  name: string;
  distance: number; // metros
  latitude: number;
  longitude: number;
  metadata?: Record<string, any>;
}

export interface UseNearbyEntitiesOptions {
  radiusKm: number;
  entityTypes: Array<'business' | 'event' | 'alert' | 'tourist_point'>;
  locationId?: string;
  limit?: number;
}

export function useNearbyEntities(options: UseNearbyEntitiesOptions) {
  const { coords: userLocation, loading: geoLoading } = useRobustGeolocation({ 
    useCache: true 
  });

  // Buscar cada tipo de entidade
  const businesses = useSpatialSearchByRadius({
    center: userLocation || { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm,
    entityType: 'business',
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!userLocation && options.entityTypes.includes('business'),
  });

  const events = useSpatialSearchByRadius({
    center: userLocation || { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm,
    entityType: 'event',
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!userLocation && options.entityTypes.includes('event'),
  });

  const alerts = useSpatialSearchByRadius({
    center: userLocation || { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm,
    entityType: 'alert',
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!userLocation && options.entityTypes.includes('alert'),
  });

  const touristPoints = useSpatialSearchByRadius({
    center: userLocation || { latitude: 0, longitude: 0 },
    radiusKm: options.radiusKm,
    entityType: 'tourist_point',
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!userLocation && options.entityTypes.includes('tourist_point'),
  });

  // Agregar e ordenar por distância
  const entities = React.useMemo(() => {
    const all: NearbyEntity[] = [];

    if (businesses.data) {
      all.push(...businesses.data.map(b => ({
        id: b.id,
        type: 'business' as const,
        name: b.name,
        distance: b.distance_meters,
        latitude: b.latitude,
        longitude: b.longitude,
        metadata: b,
      })));
    }

    if (events.data) {
      all.push(...events.data.map(e => ({
        id: e.id,
        type: 'event' as const,
        name: e.name,
        distance: e.distance_meters,
        latitude: e.latitude,
        longitude: e.longitude,
        metadata: e,
      })));
    }

    if (alerts.data) {
      all.push(...alerts.data.map(a => ({
        id: a.id,
        type: 'alert' as const,
        name: a.name,
        distance: a.distance_meters,
        latitude: a.latitude,
        longitude: a.longitude,
        metadata: a,
      })));
    }

    if (touristPoints.data) {
      all.push(...touristPoints.data.map(t => ({
        id: t.id,
        type: 'tourist_point' as const,
        name: t.name,
        distance: t.distance_meters,
        latitude: t.latitude,
        longitude: t.longitude,
        metadata: t,
      })));
    }

    // Ordenar por distância
    return all.sort((a, b) => a.distance - b.distance);
  }, [businesses.data, events.data, alerts.data, touristPoints.data]);

  return {
    entities,
    userLocation,
    isLoading: geoLoading || businesses.isLoading || events.isLoading || alerts.isLoading || touristPoints.isLoading,
    isError: businesses.isError || events.isError || alerts.isError || touristPoints.isError,
  };
}
```

### 2. Componente de Card

```typescript
// src/features/nearby/components/NearbyCard.tsx

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import type { NearbyEntity } from '../hooks/useNearbyEntities';

interface NearbyCardProps {
  entity: NearbyEntity;
  onNavigate: (url: string) => void;
}

const ENTITY_CONFIG = {
  business: { emoji: '🏢', label: 'Empresa', baseUrl: '/empresas' },
  event: { emoji: '📅', label: 'Evento', baseUrl: '/eventos' },
  alert: { emoji: '⚠️', label: 'Alerta', baseUrl: '/alertas' },
  tourist_point: { emoji: '🏛️', label: 'Ponto Turístico', baseUrl: '/pontos-turisticos' },
};

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

function getWalkingTime(meters: number): string {
  // Velocidade média: 5 km/h = 83 m/min
  const minutes = Math.round(meters / 83);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
}

export function NearbyCard({ entity, onNavigate }: NearbyCardProps) {
  const config = ENTITY_CONFIG[entity.type];
  const distance = formatDistance(entity.distance);
  const walkingTime = getWalkingTime(entity.distance);
  const url = `${config.baseUrl}/${entity.id}`;

  return (
    <Card 
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onNavigate(url)}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className="text-3xl">{config.emoji}</div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{entity.name}</h3>
          <p className="text-sm text-gray-500">{config.label}</p>
        </div>

        {/* Distância */}
        <div className="text-right">
          <p className="font-bold text-primary">{distance}</p>
          <p className="text-xs text-gray-500">🚶 {walkingTime}</p>
        </div>
      </div>
    </Card>
  );
}
```

### 3. Página Principal

```typescript
// src/pages/NearbyPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNearbyEntities } from '@/features/nearby/hooks/useNearbyEntities';
import { NearbyCard } from '@/features/nearby/components/NearbyCard';

const RADIUS_OPTIONS = [1, 2, 5, 10, 15, 20];
const ENTITY_TYPES = ['business', 'event', 'alert', 'tourist_point'] as const;

export default function NearbyPage() {
  const navigate = useNavigate();
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState<typeof ENTITY_TYPES[number][]>([...ENTITY_TYPES]);

  const { entities, userLocation, isLoading, isError } = useNearbyEntities({
    radiusKm,
    entityTypes: selectedTypes,
    limit: 50,
  });

  if (!userLocation && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-lg text-gray-600">
            Precisamos da sua localização para mostrar o que está perto de você.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg"
          >
            Permitir Localização
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Perto de Mim</h1>
        <p className="text-gray-600 mt-1">
          Descubra o que está próximo da sua localização
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 space-y-4">
        {/* Raio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Raio de busca
          </label>
          <div className="flex gap-2">
            {RADIUS_OPTIONS.map((radius) => (
              <button
                key={radius}
                onClick={() => setRadiusKm(radius)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  radiusKm === radius
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {radius}km
              </button>
            ))}
          </div>
        </div>

        {/* Tipos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mostrar
          </label>
          <div className="flex gap-2 flex-wrap">
            {[
              { type: 'business', label: '🏢 Empresas' },
              { type: 'event', label: '📅 Eventos' },
              { type: 'alert', label: '⚠️ Alertas' },
              { type: 'tourist_point', label: '🏛️ Pontos Turísticos' },
            ].map(({ type, label }) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedTypes(prev =>
                    prev.includes(type as any)
                      ? prev.filter(t => t !== type)
                      : [...prev, type as any]
                  );
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTypes.includes(type as any)
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resultados */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Buscando...</p>
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-red-600">Erro ao buscar entidades próximas.</p>
        </div>
      )}

      {!isLoading && !isError && entities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            Nenhum resultado encontrado em {radiusKm}km.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Tente aumentar o raio de busca.
          </p>
        </div>
      )}

      {!isLoading && !isError && entities.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            {entities.length} resultado{entities.length !== 1 ? 's' : ''} encontrado{entities.length !== 1 ? 's' : ''}
          </p>
          {entities.map((entity) => (
            <NearbyCard
              key={`${entity.type}-${entity.id}`}
              entity={entity}
              onNavigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4. Rota

```typescript
// src/App.tsx ou routes.tsx

import NearbyPage from '@/pages/NearbyPage';

// Adicionar rota
{
  path: '/perto-de-mim',
  element: <NearbyPage />,
}
```

---

## Implementação: Remover Raio do Mapa

### 1. Simplificar MapaPageV4

```typescript
// src/core/maps/pages/MapaPageV4.tsx

// REMOVER:
- const [searchRadius, setSearchRadius] = useState<number>(5);
- const [previewRadius, setPreviewRadius] = useState<number | null>(null);
- const [radiusSearchEnabled, setRadiusSearchEnabled] = useState<boolean>(false);
- useSpatialSearchByRadius hooks
- handleRadiusPreview
- handleRadiusChange
- handleDisableRadius
- circleConfig
- radiusControl prop

// MANTER:
- Modo normal (busca por bounds)
- Layer control
- Geolocalização (para marcador de usuário)
```

### 2. Remover MapRadiusControl

```bash
# Deletar arquivo (não é mais necessário)
rm src/core/maps/components/v3/controls/MapRadiusControl.tsx
```

---

## Benefícios da Refatoração

### UX
- ✅ Página dedicada com foco em proximidade
- ✅ Lista ordenada por distância (mais útil que mapa)
- ✅ Tempo de caminhada estimado
- ✅ Filtros claros e intuitivos
- ✅ Mapa simplificado (sem confusão)

### Arquitetura
- ✅ Separação de responsabilidades
- ✅ SSOT mantido (mesmos services/hooks)
- ✅ Componentes reutilizáveis
- ✅ Código mais limpo e focado

### Performance
- ✅ Menos estado no mapa
- ✅ Menos re-renders desnecessários
- ✅ Carregamento sob demanda (página separada)

---

## Cronograma Sugerido

1. **Fase 1**: Criar página "Perto de Mim" (2-3 dias)
2. **Fase 2**: Remover raio do mapa (1 dia)
3. **Fase 3**: Testes e ajustes (1 dia)
4. **Fase 4**: Documentação e homologação (1 dia)

**Total**: 5-6 dias

---

## Decisão

Esta proposta aguarda aprovação para prosseguir com implementação.

**Alternativas:**
1. Manter modo raio no mapa (status quo)
2. Implementar apenas página "Perto de Mim" (sem remover raio do mapa)
3. Implementar proposta completa (recomendado)

---

**Próximo passo**: Aguardando decisão de produto.
