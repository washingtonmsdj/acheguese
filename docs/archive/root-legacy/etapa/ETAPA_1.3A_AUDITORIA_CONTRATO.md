# ETAPA 1.3A - AUDITORIA DO CONTRATO REAL (PONTOS TURÍSTICOS)

**Data**: 04/04/2026  
**Status**: ✅ CONCLUÍDO

---

## 🎯 OBJETIVO

Auditar o contrato real de pontos turísticos antes de integrar ao mapa, seguindo rigorosamente o padrão SSOT.

---

## ✅ SSOT EXISTENTE

### Service Layer ✅

**Arquivo**: `src/core/tourist-points/services/TouristPointService.ts`

**Métodos Disponíveis**:
- `list(filters)` - Lista pontos turísticos com filtros
- `getById(id)` - Busca por ID
- `getBySlug(state, city, slug)` - Busca por slug
- `getByIds(ids)` - Busca múltiplos por IDs

**Características**:
- ✅ Métodos de leitura NUNCA lançam exceção
- ✅ Fallback para mock data em caso de erro
- ✅ Suporta joins com `locations` e `addresses`

---

### Hook Layer ✅

**Arquivo**: `src/core/tourist-points/hooks/useTouristPoints.ts`

**Hooks Disponíveis**:
- `useTouristPoints(filters)` - Lista com filtros
- `useTouristPoint(id)` - Busca por ID
- `useTouristPointBySlug(state, city, slug)` - Busca por slug
- `useNearbyTouristPoints(ids)` - Busca múltiplos

**Características**:
- ✅ Usa React Query
- ✅ Cache automático
- ✅ Stale time configurado

---

## 📊 CONTRATO DE DADOS

### Interface TouristPoint

```typescript
interface TouristPoint {
  // Identificação
  id: string;
  name: string;
  slug: string;
  
  // Descrição
  description: string;
  short_description: string | null;
  
  // Classificação
  category: TouristPointCategory; // 14 categorias validadas
  tags: string[];
  status: TouristPointStatus; // active, inactive, pending_review, archived
  
  // Localização (SSOT canônico)
  location_id: string | null;
  address_id: string | null;
  location?: { name, full_name, geographic_path };
  address?: { street, number, complement, postal_code, latitude, longitude };
  
  // Localização (legado - mantido para compatibilidade)
  neighborhood: string | null;
  address_text: string | null;
  latitude: number | null;  // ⭐ DISPONÍVEL
  longitude: number | null; // ⭐ DISPONÍVEL
  
  // Visual
  photo_url: string | null;
  gallery_urls: string[];
  icon_emoji: string;
  
  // Informações
  visiting_hours: string | null;
  entry_fee: string | null;
  website: string | null;
  phone: string | null;
  
  // Facilidades
  accessibility: boolean;
  has_parking: boolean;
  has_restaurant: boolean;
  has_guide: boolean;
  
  // Destaque
  is_featured: boolean;
  display_order: number;
  
  // Avaliação
  rating: number; // ⭐ DISPONÍVEL (default 0)
  total_reviews: number;
  
  // Metadados
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## 📊 CAMPOS PARA O MAPA

### Campos Obrigatórios ✅

| Campo | Tipo | Consistência | Notas |
|-------|------|--------------|-------|
| `id` | string | ✅ 100% | UUID |
| `name` | string | ✅ 100% | Obrigatório |
| `latitude` | number \| null | ✅ Alta | Legado, mas disponível |
| `longitude` | number \| null | ✅ Alta | Legado, mas disponível |
| `status` | string | ✅ 100% | Enum validado |

### Campos Opcionais Úteis ✅

| Campo | Tipo | Consistência | Uso no Mapa |
|-------|------|--------------|-------------|
| `slug` | string | ✅ 100% | URL pública |
| `category` | string | ✅ 100% | Filtro + ícone |
| `rating` | number | ✅ 100% | Exibição + filtro |
| `is_featured` | boolean | ✅ 100% | Destaque visual |
| `icon_emoji` | string | ✅ 100% | Ícone customizado |
| `photo_url` | string \| null | 🟡 Opcional | Thumbnail |

---

## 🎯 ESTRATÉGIA DE INTEGRAÇÃO

### Opção 1: Usar Service Existente (RECOMENDADO)

**Vantagem**: Segue SSOT, usa cache, fallback para mock.

**Implementação**:
```typescript
// 1. Criar fetcher que usa TouristPointService
function makeTouristPointFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    // Usar TouristPointService.list() com filtros
    const points = await TouristPointService.list({
      status: 'active',
      state: territoryFilter.state,
      city: territoryFilter.city,
      limit: 200,
    });
    
    // Filtrar por bounds no client-side
    const filtered = points.filter((p) =>
      isInsideBounds(p.latitude, p.longitude, bounds)
    );
    
    // Projetar para MapMarker
    return mapEntityProjection.projectEntities(filtered, 'tourist_point', options);
  };
}
```

**Problema**: Service não suporta filtro por bounds (apenas state/city).

---

### Opção 2: Usar RPC Espacial Existente (RECOMENDADO)

**Vantagem**: Usa base espacial completa, performance otimizada.

**Implementação**:
```typescript
// 1. Criar hook para busca por bounds
export function useTouristPointsByBounds(
  bounds: BoundingBox,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['tourist-points-by-bounds', bounds],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_entities_by_bounds', {
        p_west: bounds[0],
        p_south: bounds[1],
        p_east: bounds[2],
        p_north: bounds[3],
        p_entity_type: 'tourist_point',
        p_limit: 200,
      });
      
      if (error) throw error;
      return data as SpatialSearchResult[];
    },
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2,
  });
}

// 2. Usar hook no MapaPageV4
const { data: touristPointsInBounds } = useTouristPointsByBounds(currentBounds);
```

**Vantagem**: Segue SSOT (Database → Hook → Component), usa RPC otimizado.

---

## ✅ DECISÃO DE IMPLEMENTAÇÃO

### Abordagem Escolhida: Opção 2 (RPC Espacial)

**Justificativa**:
1. ✅ Segue SSOT rigorosamente (Database → Hook → Component)
2. ✅ Usa base espacial completa (coluna `point`, índices GIST)
3. ✅ Performance otimizada (PostGIS)
4. ✅ Consistente com empresas, eventos, alertas
5. ✅ Suporta modo normal (bounds) e modo raio (radius)

**Camadas**:
1. **Database**: RPC `search_entities_by_bounds` e `search_entities_by_radius` (JÁ EXISTEM)
2. **Hook**: `useTouristPointsByBounds` (CRIAR)
3. **Component**: `MapaPageV4` usa hook (INTEGRAR)

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### 1. Criar Hook de Busca por Bounds (30min)

**Arquivo**: `src/core/tourist-points/hooks/useTouristPointsSpatial.ts` (NOVO)

**Conteúdo**:
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import type { BoundingBox } from '@/core/maps/types/core';
import type { SpatialSearchResult } from '@/core/geospatial/services/SpatialSearchService';

export function useTouristPointsByBounds(
  bounds: BoundingBox,
  options?: { locationId?: string; enabled?: boolean }
) {
  return useQuery({
    queryKey: ['tourist-points-spatial-bounds', bounds, options?.locationId],
    queryFn: async (): Promise<SpatialSearchResult[]> => {
      const { data, error } = await supabase.rpc('search_entities_by_bounds', {
        p_west: bounds[0],
        p_south: bounds[1],
        p_east: bounds[2],
        p_north: bounds[3],
        p_entity_type: 'tourist_point',
        p_location_id: options?.locationId ?? null,
        p_limit: 200,
      });
      
      if (error) {
        console.error('[useTouristPointsByBounds] error:', error);
        throw error;
      }
      
      return (data || []) as SpatialSearchResult[];
    },
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}
```

---

### 2. Integrar ao MapaPageV4 (30min)

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

**Mudanças**:

1. Importar hook:
```typescript
import { useTouristPointsByBounds } from '@/core/tourist-points/hooks/useTouristPointsSpatial';
```

2. Usar hook (modo normal):
```typescript
const { data: touristPointsData } = useTouristPointsByBounds(
  currentBounds,
  { 
    locationId: resolved?.kind === 'location' ? resolved.location.id : undefined,
    enabled: true 
  }
);
```

3. Projetar para marcadores:
```typescript
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
```

4. Adicionar ao layerData:
```typescript
const layerData = {
  businesses: businessMarkers,
  events: eventMarkers,
  alerts: alertMarkers,
  touristPoints: touristPointMarkers, // ⭐ NOVO
};
```

---

### 3. Integrar ao Modo Raio (30min)

**Usar hook existente**: `useSpatialSearchByRadius` (JÁ SUPORTA 'tourist_point')

```typescript
const { 
  data: nearbyTouristPoints,
  isLoading: isLoadingTouristPoints,
  isError: isErrorTouristPoints
} = useSpatialSearchByRadius({
  center: userLocation || { latitude: 0, longitude: 0 },
  radiusKm: searchRadius,
  entityType: 'tourist_point', // ⭐ JÁ SUPORTADO
  locationId: resolved?.kind === 'location' ? resolved.location.id : undefined,
  limit: 200,
  enabled: radiusSearchEnabled && !!userLocation,
});
```

---

### 4. Adicionar ao Layer Control (5min)

```typescript
layers: {
  enabled: true,
  position: 'bottom-left',
  layers: ['businesses', 'events', 'alerts', 'touristPoints'], // ⭐ NOVO
  layout: 'vertical',
},
```

---

### 5. Atualizar Contadores (5min)

```typescript
counts: {
  businesses: nearbyBusinesses?.length || 0,
  events: nearbyEvents?.length || 0,
  alerts: nearbyAlerts?.length || 0,
  touristPoints: nearbyTouristPoints?.length || 0, // ⭐ NOVO
},
```

---

## ✅ VALIDAÇÃO DO CONTRATO

### Campos Disponíveis para o Mapa

| Campo | Disponível | Fonte | Notas |
|-------|-----------|-------|-------|
| `id` | ✅ | RPC | UUID |
| `name` | ✅ | RPC | Título do ponto |
| `latitude` | ✅ | RPC | Coordenada |
| `longitude` | ✅ | RPC | Coordenada |
| `distance_meters` | ✅ | RPC (modo raio) | Distância do usuário |
| `location_id` | ✅ | RPC | Território |

### Campos NÃO Disponíveis no RPC

| Campo | Disponível | Solução |
|-------|-----------|---------|
| `slug` | ❌ | Buscar depois via `TouristPointService.getById()` |
| `category` | ❌ | Buscar depois via `TouristPointService.getById()` |
| `rating` | ❌ | Buscar depois via `TouristPointService.getById()` |
| `icon_emoji` | ❌ | Buscar depois via `TouristPointService.getById()` |

**Decisão**: Aceitar limitação inicial. RPC retorna apenas campos básicos (id, name, lat, lng, distance). Metadados completos podem ser carregados ao clicar no marcador.

---

## 🎯 ESTIMATIVA REVISADA

| Tarefa | Estimativa |
|--------|-----------|
| 1. Criar hook `useTouristPointsByBounds` | 30min |
| 2. Integrar ao modo normal | 30min |
| 3. Integrar ao modo raio | 30min |
| 4. Adicionar ao layer control | 5min |
| 5. Atualizar contadores | 5min |
| 6. Validação | 20min |
| **TOTAL** | **2h** |

---

## ✅ CRITÉRIO DE ACEITE

**ETAPA 1.3A é considerada CONCLUÍDA quando**:

- [ ] Hook `useTouristPointsByBounds` criado
- [ ] Pontos turísticos aparecem no modo normal
- [ ] Pontos turísticos aparecem no modo raio
- [ ] Layer control tem opção "Pontos Turísticos"
- [ ] Contadores mostram pontos turísticos
- [ ] Distância aparece no popup (modo raio)
- [ ] Sem erros de diagnóstico
- [ ] Segue SSOT rigorosamente (Database → Hook → Component)
- [ ] Zero acesso direto ao Supabase na página

---

**Elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Status**: ✅ AUDITORIA CONCLUÍDA, PRONTO PARA IMPLEMENTAÇÃO
