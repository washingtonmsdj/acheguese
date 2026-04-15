# PROPOSTA REVISADA: ETAPA 1.3

**Data**: 04/04/2026  
**Status**: 📋 PROPOSTA REVISADA

---

## 🎯 CONTEXTO

A ETAPA 1.2 auditou metadados e descobriu que:

1. ✅ Pontos turísticos TÊM base espacial completa
2. ✅ Classificados TÊM base espacial completa
3. ✅ Pontos turísticos TÊM metadados excelentes (9/10 campos obrigatórios)
4. ✅ RPC `search_entities_by_radius` JÁ SUPORTA ambos os tipos

**Conclusão**: Integração é viável e rápida (3-4 horas).

---

## 🎯 ETAPA 1.3: INTEGRAÇÃO DE PONTOS TURÍSTICOS E CLASSIFICADOS

### Objetivo

Adicionar pontos turísticos e classificados ao mapa (modo normal + modo raio).

### Justificativa

- Base espacial completa (coluna point, triggers, índices, RPCs)
- Metadados excelentes (especialmente tourist_points)
- Trabalho mínimo (apenas integração, sem infraestrutura)
- Valor imediato (mais conteúdo no mapa)

---

## 📋 IMPLEMENTAÇÃO DETALHADA

### 1. Criar Fetchers para Modo Normal (1h)

#### 1.1. Fetcher de Pontos Turísticos

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

**Implementação**:
```typescript
function makeTouristPointFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    try {
      // Usar serviço existente ou criar query direta
      const { data, error } = await supabase
        .from('tourist_points')
        .select('*')
        .eq('status', 'active')
        .gte('latitude', bounds[1])
        .lte('latitude', bounds[3])
        .gte('longitude', bounds[0])
        .lte('longitude', bounds[2])
        .limit(200);

      if (error) throw error;

      return mapEntityProjection.projectEntities(
        (data || []).map((t) => ({
          id: t.id,
          name: t.name,
          latitude: t.latitude,
          longitude: t.longitude,
          status: t.status,
          slug: t.slug,
          rating: t.rating,
          category: t.category,
        })),
        'tourist_point',
        { includeMetadata: true, calculateScore: true, baseUrl: '/pontos-turisticos' },
      );
    } catch {
      return [];
    }
  };
}
```

**Estimativa**: 30 minutos

---

#### 1.2. Fetcher de Classificados

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

**Implementação**:
```typescript
function makeClassifiedFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    try {
      const { data, error } = await supabase
        .from('classifieds')
        .select('*')
        .eq('status', 'active')
        .eq('is_active', true)
        .gte('latitude', bounds[1])
        .lte('latitude', bounds[3])
        .gte('longitude', bounds[0])
        .lte('longitude', bounds[2])
        .limit(200);

      if (error) throw error;

      return mapEntityProjection.projectEntities(
        (data || []).map((c) => ({
          id: c.id,
          name: c.title,
          latitude: c.latitude,
          longitude: c.longitude,
          status: c.status,
          price: c.price,
          category: c.category,
        })),
        'classified',
        { includeMetadata: true, baseUrl: '/classificados' },
      );
    } catch {
      return [];
    }
  };
}
```

**Estimativa**: 30 minutos

---

### 2. Integrar ao Modo Normal (1h)

#### 2.1. Adicionar ao useMapViewportFetch

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

**ANTES**:
```typescript
const fetchers = React.useMemo(
  () => ({
    businesses: makeBusinessFetcher(territoryFilter),
    alerts: makeAlertFetcher(territoryFilter),
    events: makeEventFetcher(territoryFilter),
  }),
  [filterKey],
);
```

**DEPOIS**:
```typescript
const fetchers = React.useMemo(
  () => ({
    businesses: makeBusinessFetcher(territoryFilter),
    alerts: makeAlertFetcher(territoryFilter),
    events: makeEventFetcher(territoryFilter),
    touristPoints: makeTouristPointFetcher(territoryFilter), // ⭐ NOVO
    classifieds: makeClassifiedFetcher(territoryFilter),     // ⭐ NOVO
  }),
  [filterKey],
);
```

**Estimativa**: 15 minutos

---

#### 2.2. Adicionar ao Layer Control

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

**ANTES**:
```typescript
layers: {
  enabled: true,
  position: 'bottom-left',
  layers: ['businesses', 'events', 'alerts'],
  layout: 'vertical',
},
```

**DEPOIS**:
```typescript
layers: {
  enabled: true,
  position: 'bottom-left',
  layers: ['businesses', 'events', 'alerts', 'touristPoints', 'classifieds'],
  layout: 'vertical',
},
```

**Estimativa**: 5 minutos

---

#### 2.3. Adicionar Configuração de Marcadores

**Arquivo**: `src/core/maps/config/markerConfig.ts`

**Verificar se já existe**:
```typescript
export const MARKER_CONFIGS = {
  // ...
  tourist_point: {
    emoji: '🏛️',
    label: 'Ponto Turístico',
    color: '#8B5CF6', // purple
  },
  classified: {
    emoji: '🏷️',
    label: 'Classificado',
    color: '#10B981', // green
  },
};
```

**Se não existir, adicionar**.

**Estimativa**: 10 minutos

---

### 3. Integrar ao Modo Raio (1h)

#### 3.1. Adicionar Hooks de Busca Espacial

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

**Implementação**:
```typescript
const { 
  data: nearbyTouristPoints,
  isLoading: isLoadingTouristPoints,
  isError: isErrorTouristPoints
} = useSpatialSearchByRadius({
  center: userLocation || { latitude: 0, longitude: 0 },
  radiusKm: searchRadius,
  entityType: 'tourist_point', // ⭐ Tipo já suportado pelo RPC
  locationId: resolved?.kind === 'location' ? resolved.location.id : undefined,
  limit: 200,
  enabled: radiusSearchEnabled && !!userLocation,
});

const { 
  data: nearbyClassifieds,
  isLoading: isLoadingClassifieds,
  isError: isErrorClassifieds
} = useSpatialSearchByRadius({
  center: userLocation || { latitude: 0, longitude: 0 },
  radiusKm: searchRadius,
  entityType: 'classified', // ⭐ Tipo já suportado pelo RPC
  locationId: resolved?.kind === 'location' ? resolved.location.id : undefined,
  limit: 200,
  enabled: radiusSearchEnabled && !!userLocation,
});
```

**Estimativa**: 15 minutos

---

#### 3.2. Atualizar Estados Agregados

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

**ANTES**:
```typescript
const isLoadingRadius = isLoadingBusinesses || isLoadingEvents || isLoadingAlerts;
const hasErrorRadius = isErrorBusinesses || isErrorEvents || isErrorAlerts;
```

**DEPOIS**:
```typescript
const isLoadingRadius = isLoadingBusinesses || isLoadingEvents || isLoadingAlerts || 
                        isLoadingTouristPoints || isLoadingClassifieds;
const hasErrorRadius = isErrorBusinesses || isErrorEvents || isErrorAlerts || 
                       isErrorTouristPoints || isErrorClassifieds;
```

**Estimativa**: 5 minutos

---

#### 3.3. Adicionar Marcadores ao Modo Raio

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

**Implementação**:
```typescript
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

const classifiedMarkers = mapEntityProjection.projectEntities(
  (nearbyClassifieds || []).map((result) => ({
    id: result.id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    status: 'active',
    location_id: result.location_id,
    distance_meters: result.distance_meters,
  })),
  'classified',
  { includeMetadata: true, baseUrl: '/classificados' },
);

// Combinar todos os marcadores
return [...businessMarkers, ...eventMarkers, ...alertMarkers, 
        ...touristPointMarkers, ...classifiedMarkers];
```

**Estimativa**: 15 minutos

---

#### 3.4. Atualizar Contadores

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

**ANTES**:
```typescript
counts: {
  businesses: nearbyBusinesses?.length || 0,
  events: nearbyEvents?.length || 0,
  alerts: nearbyAlerts?.length || 0,
},
```

**DEPOIS**:
```typescript
counts: {
  businesses: nearbyBusinesses?.length || 0,
  events: nearbyEvents?.length || 0,
  alerts: nearbyAlerts?.length || 0,
  touristPoints: nearbyTouristPoints?.length || 0, // ⭐ NOVO
  classifieds: nearbyClassifieds?.length || 0,     // ⭐ NOVO
},
```

**Estimativa**: 5 minutos

---

#### 3.5. Atualizar Indicadores Visuais

**Arquivo**: `src/core/maps/components/v3/controls/MapRadiusControl.tsx`

**Atualizar aviso**:
```tsx
<p className="text-xs text-blue-700">
  📍 Mostrando <strong>empresas, eventos, alertas, pontos turísticos e classificados</strong> em {radius} km
</p>
```

**Estimativa**: 5 minutos

---

### 4. Validação (30min)

#### 4.1. Teste de Modo Normal

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Verificar layer control
3. Ativar/desativar "Pontos Turísticos"
4. Ativar/desativar "Classificados"
5. Verificar marcadores aparecem/desaparecem

**Resultado Esperado**:
- [ ] Opções aparecem no layer control
- [ ] Marcadores 🏛️ aparecem (pontos turísticos)
- [ ] Marcadores 🏷️ aparecem (classificados)
- [ ] Filtros funcionam corretamente

---

#### 4.2. Teste de Modo Raio

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider para 10 km
4. Verificar contadores
5. Verificar marcadores

**Resultado Esperado**:
- [ ] Contador "🏛️ X" aparece
- [ ] Contador "🏷️ X" aparece
- [ ] Marcadores aparecem no mapa
- [ ] Distância aparece no popup

---

#### 4.3. Teste de Zero Resultados

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider para 1 km (muito pequeno)
4. Verificar mensagem

**Resultado Esperado**:
- [ ] Mensagem: "Não há empresas, eventos, alertas, pontos turísticos ou classificados em um raio de 1 km"
- [ ] Contadores mostram 0 para todos os tipos

---

## 📊 ESTIMATIVA TOTAL

| Tarefa | Estimativa |
|--------|-----------|
| 1. Criar fetchers | 1h |
| 2. Integrar ao modo normal | 1h |
| 3. Integrar ao modo raio | 1h |
| 4. Validação | 30min |
| **TOTAL** | **3h 30min** |

---

## 🎯 VALOR ENTREGUE

### Usuário Final

- ✅ Vê pontos turísticos no mapa (🏛️)
- ✅ Vê classificados no mapa (🏷️)
- ✅ Pode filtrar por tipo (layer control)
- ✅ Vê contadores no modo raio
- ✅ Vê distância de cada ponto

### Desenvolvedor

- ✅ 5 tipos integrados (empresas, eventos, alertas, tourist_points, classifieds)
- ✅ Base espacial completa utilizada
- ✅ Código consistente e escalável

### Product Manager

- ✅ Mais conteúdo no mapa (valor imediato)
- ✅ Base para filtros avançados (próxima etapa)
- ✅ Metadados excelentes (especialmente tourist_points)

---

## 🚀 PRÓXIMA ETAPA (APÓS 1.3)

### ETAPA 1.4: Filtros Avançados

**Prioridade**: Pontos Turísticos (metadados excelentes)

**Filtros Propostos**:
1. Por categoria (14 categorias validadas)
2. Por rating (sempre presente)
3. Por facilidades (acessibilidade, estacionamento, restaurante, guia)
4. Destaque (is_featured)

**Estimativa**: 4-6 horas

**Justificativa**: Pontos turísticos têm os melhores metadados (9/10 campos obrigatórios).

---

## ✅ CRITÉRIO DE ACEITE

**ETAPA 1.3 é considerada CONCLUÍDA quando**:

- [ ] Pontos turísticos aparecem no modo normal
- [ ] Pontos turísticos aparecem no modo raio
- [ ] Classificados aparecem no modo normal
- [ ] Classificados aparecem no modo raio
- [ ] Layer control tem opções para ambos os tipos
- [ ] Contadores mostram ambos os tipos
- [ ] Distância aparece no popup
- [ ] Sem erros de diagnóstico
- [ ] Validação objetiva executada

---

**Elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Status**: 📋 PROPOSTA REVISADA BASEADA EM DADOS REAIS
