# ETAPA 1.3A - ARQUIVOS ALTERADOS

**Data**: 04/04/2026  
**Status**: ✅ CONCLUÍDO

---

## 📁 ARQUIVOS CRIADOS

### 1. `src/core/tourist-points/hooks/useTouristPointsSpatial.ts`

**Tipo**: Hook React Query  
**Linhas**: ~50  
**Propósito**: Busca espacial de pontos turísticos por bounds (viewport)

**Características**:
- ✅ Usa RPC `search_entities_by_bounds`
- ✅ Suporta filtro por `locationId`
- ✅ Fallback para array vazio em erro
- ✅ Cache de 2 minutos
- ✅ Retry desabilitado
- ✅ Tipagem forte com `SpatialSearchResult[]`

**Exports**:
- `useTouristPointsByBounds(bounds, options)`

---

## 📝 ARQUIVOS MODIFICADOS

### 1. `src/core/maps/pages/MapaPageV4.tsx`

**Linhas Modificadas**: ~30  
**Tipo de Mudança**: Integração de pontos turísticos

**Mudanças Detalhadas**:

#### 1.1. Imports
```typescript
// ADICIONADO
import { useTouristPointsByBounds } from '@/core/tourist-points/hooks/useTouristPointsSpatial';
```

#### 1.2. Estado
```typescript
// ADICIONADO
const [currentBounds, setCurrentBounds] = useState<BoundingBox>(SALVADOR_BOUNDS);
```

#### 1.3. Hooks de Busca Espacial
```typescript
// ADICIONADO - Modo Normal
const { data: touristPointsData } = useTouristPointsByBounds(
  {
    west: currentBounds[0],
    south: currentBounds[1],
    east: currentBounds[2],
    north: currentBounds[3],
  },
  { 
    locationId: resolved?.kind === 'location' ? resolved.location.id : undefined,
    enabled: !radiusSearchEnabled,
  }
);

// ADICIONADO - Modo Raio
const { 
  data: nearbyTouristPoints,
  isLoading: isLoadingTouristPoints,
  isError: isErrorTouristPoints
} = useSpatialSearchByRadius({
  center: userLocation || { latitude: 0, longitude: 0 },
  radiusKm: searchRadius,
  entityType: 'tourist_point',
  locationId: resolved?.kind === 'location' ? resolved.location.id : undefined,
  limit: 200,
  enabled: radiusSearchEnabled && !!userLocation,
});
```

#### 1.4. Estados Agregados
```typescript
// MODIFICADO
const isLoadingRadius = isLoadingBusinesses || isLoadingEvents || isLoadingAlerts || isLoadingTouristPoints;
const hasErrorRadius = isErrorBusinesses || isErrorEvents || isErrorAlerts || isErrorTouristPoints;
```

#### 1.5. Handler de Viewport
```typescript
// MODIFICADO
const handleViewportChange = useCallback(
  (viewport: MapViewport, bounds: BoundingBox) => {
    setCurrentBounds(bounds); // ⭐ ADICIONADO
    fetchByBounds(bounds, viewport.zoom);
  },
  [fetchByBounds],
);
```

#### 1.6. Lógica de Marcadores (Modo Raio)
```typescript
// ADICIONADO
const touristPointMarkers = mapEntityProjection.projectEntities(
  (nearbyTouristPoints || []).map((result) => ({
    id: result.id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    status: 'active',
    location_id: result.location_id,
    distance_meters: result.distance_meters,
  })),
  'tourist_point',
  { includeMetadata: true, calculateScore: true, baseUrl: '/pontos-turisticos' },
);

// MODIFICADO
return [...businessMarkers, ...eventMarkers, ...alertMarkers, ...touristPointMarkers];
```

#### 1.7. Lógica de Marcadores (Modo Normal)
```typescript
// ADICIONADO
const touristPointMarkers = mapEntityProjection.projectEntities(
  (touristPointsData || []).map((result) => ({
    id: result.id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    status: 'active',
    location_id: result.location_id,
  })),
  'tourist_point',
  { includeMetadata: true, calculateScore: true, baseUrl: '/pontos-turisticos' },
);

// MODIFICADO
return [...Object.values(layerData).flat(), ...touristPointMarkers];
```

#### 1.8. Dependencies do useMemo
```typescript
// MODIFICADO
}, [
  radiusSearchEnabled, 
  hasErrorRadius,
  isLoadingRadius,
  nearbyBusinesses, 
  nearbyEvents, 
  nearbyAlerts, 
  nearbyTouristPoints, // ⭐ ADICIONADO
  touristPointsData,   // ⭐ ADICIONADO
  layerData
]);
```

#### 1.9. Layer Control
```typescript
// MODIFICADO
layers: {
  enabled: true,
  position: 'bottom-left',
  layers: ['businesses', 'events', 'alerts', 'touristPoints'], // ⭐ ADICIONADO
  layout: 'vertical',
},
```

#### 1.10. Contadores
```typescript
// MODIFICADO
counts: {
  businesses: nearbyBusinesses?.length || 0,
  events: nearbyEvents?.length || 0,
  alerts: nearbyAlerts?.length || 0,
  touristPoints: nearbyTouristPoints?.length || 0, // ⭐ ADICIONADO
},
```

#### 1.11. Mensagens de Loading
```typescript
// MODIFICADO
<p className="text-sm text-gray-600 mt-1">
  Procurando empresas, eventos, alertas e pontos turísticos em {searchRadius} km
</p>
```

#### 1.12. Mensagens de Zero Resultados
```typescript
// MODIFICADO
{radiusSearchEnabled && 
 !isLoadingRadius &&
 !hasErrorRadius &&
 nearbyBusinesses && nearbyEvents && nearbyAlerts && nearbyTouristPoints && // ⭐ ADICIONADO
 nearbyBusinesses.length === 0 && nearbyEvents.length === 0 && nearbyAlerts.length === 0 && nearbyTouristPoints.length === 0 && ( // ⭐ ADICIONADO

// MODIFICADO
<p className="text-sm text-gray-600 mt-1">
  Não há empresas, eventos, alertas ou pontos turísticos em um raio de {searchRadius} km da sua localização.
</p>
```

---

## 📊 ESTATÍSTICAS

| Métrica | Valor |
|---------|-------|
| Arquivos criados | 1 |
| Arquivos modificados | 1 |
| Linhas adicionadas | ~80 |
| Linhas modificadas | ~30 |
| Imports adicionados | 1 |
| Hooks adicionados | 2 |
| Estados adicionados | 1 |
| Funções modificadas | 3 |

---

## 🎯 IMPACTO NO CÓDIGO

### Complexidade Adicionada

| Aspecto | Antes | Depois | Impacto |
|---------|-------|--------|---------|
| Tipos de entidade no mapa | 3 | 4 | +33% |
| Hooks de busca espacial | 3 | 5 | +67% |
| Estados de loading | 3 | 4 | +33% |
| Estados de erro | 3 | 4 | +33% |
| Layers no layer control | 3 | 4 | +33% |

### Manutenibilidade

| Aspecto | Status | Justificativa |
|---------|--------|---------------|
| Código duplicado | ✅ Baixo | Padrão consistente com outros tipos |
| Acoplamento | ✅ Baixo | Hooks isolados, componente consome |
| Testabilidade | ✅ Alta | Hooks podem ser testados isoladamente |
| Legibilidade | ✅ Alta | Código segue padrão existente |

---

## 🔄 PADRÃO DE INTEGRAÇÃO

### Template para Próximos Tipos

A integração de pontos turísticos estabelece um padrão claro para adicionar novos tipos ao mapa:

```typescript
// 1. Criar hook espacial
export function useEntityByBounds(bounds, options) {
  return useQuery({
    queryKey: ['entity-spatial-bounds', bounds, options?.locationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_entities_by_bounds', {
        p_west: bounds.west,
        p_south: bounds.south,
        p_east: bounds.east,
        p_north: bounds.north,
        p_entity_type: 'entity_type',
        p_location_id: options?.locationId ?? null,
        p_limit: 200,
      });
      if (error) return [];
      return data || [];
    },
    enabled: options?.enabled !== false && bounds !== null,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
}

// 2. Integrar ao MapaPageV4
const { data: entityData } = useEntityByBounds(
  { west, south, east, north },
  { locationId, enabled: !radiusSearchEnabled }
);

const { data: nearbyEntities, isLoading, isError } = useSpatialSearchByRadius({
  center: userLocation || { latitude: 0, longitude: 0 },
  radiusKm: searchRadius,
  entityType: 'entity_type',
  locationId,
  limit: 200,
  enabled: radiusSearchEnabled && !!userLocation,
});

// 3. Projetar marcadores
const entityMarkers = mapEntityProjection.projectEntities(
  (entityData || []).map((result) => ({
    id: result.id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    status: 'active',
    location_id: result.location_id,
    distance_meters: result.distance_meters,
  })),
  'entity_type',
  { includeMetadata: true, calculateScore: true, baseUrl: '/entities' },
);

// 4. Adicionar ao layer control
layers: ['businesses', 'events', 'alerts', 'touristPoints', 'entities']

// 5. Adicionar aos contadores
counts: { ..., entities: nearbyEntities?.length || 0 }
```

---

## ✅ VALIDAÇÃO DE ARQUIVOS

| Arquivo | Existe | Sem Erros | Tipado | Testável |
|---------|--------|-----------|--------|----------|
| `useTouristPointsSpatial.ts` | ✅ | ✅ | ✅ | ✅ |
| `MapaPageV4.tsx` | ✅ | ✅ | ✅ | ✅ |

**Resultado**: ✅ Todos os arquivos validados

---

**Elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Método**: Análise automatizada de diff
