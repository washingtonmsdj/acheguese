# Auditoria: NeighborhoodMap vs Mapa Central

## Funcionalidades que NeighborhoodMap TEM e MapaPageV4 NÃO TEM

### 1. ✅ Busca Local de Empresas
**NeighborhoodMap:**
```tsx
const [searchQuery, setSearchQuery] = useState('');
const filteredBusinesses = useMemo(() => {
  if (!searchQuery.trim()) return businesses;
  const query = searchQuery.toLowerCase();
  return businesses.filter(
    (b) => b.name.toLowerCase().includes(query) || 
           b.category?.toLowerCase().includes(query)
  );
}, [businesses, searchQuery]);
```

**MapaPageV4:**
- Tem `MapSearchPanel` mas é para busca de ENDEREÇOS (geocoding)
- NÃO filtra os marcadores localmente por nome/categoria

### 2. ✅ Contador de Resultados
**NeighborhoodMap:**
```tsx
{searchQuery && (
  <div>
    <span>{filteredBusinesses.length}</span>
    <span>{filteredBusinesses.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}</span>
  </div>
)}
```

**MapaPageV4:**
- Não mostra contador de resultados

### 3. ✅ Indicador de Precisão GPS
**NeighborhoodMap:**
```tsx
{userLocation && (
  <div>
    <div className={isHighAccuracy ? 'bg-success' : 'bg-warning'} />
    <span>Precisão: {Math.round(userLocation.accuracy)}m</span>
  </div>
)}
```

**MapaPageV4:**
- Tem `GeolocationStatusIndicator` mas não mostra precisão em metros
- Não tem indicador visual de alta/baixa precisão

### 4. ✅ Hook de Geolocalização Robusto
**NeighborhoodMap:**
```tsx
const { coords, loading, requestLocation, isHighAccuracy } = useRobustGeolocation({
  onSuccess: (coords) => {
    const zoom = coords.accuracy < 100 ? 16 : 14;
    adapterRef.current?.flyTo({ center: coords, zoom });
  },
});
```

**MapaPageV4:**
```tsx
const { coordinates, status, error, accuracy, requestLocation } = useUserLocation();
```
- Usa `useUserLocation` (mais simples)
- Não tem callback `onSuccess` para ajustar zoom baseado em precisão
- Não tem flag `isHighAccuracy`

### 5. ✅ Controles Visuais Integrados
**NeighborhoodMap:**
- Busca com ícone de lupa
- Botão X para limpar busca
- Botão de localização com spinner
- Feedback visual de precisão GPS
- Tudo em um único componente coeso

**MapaPageV4:**
- Controles espalhados em múltiplos componentes
- Menos integração visual

### 6. ✅ Prop `showControls`
**NeighborhoodMap:**
```tsx
showControls?: boolean; // Padrão: true
```
- Permite desabilitar controles quando usado como mini-mapa

**MapaPageV4:**
- Controles sempre visíveis

## Funcionalidades que MapaPageV4 TEM e NeighborhoodMap NÃO TEM

### 1. ✅ Múltiplas Camadas (Businesses, Events, Alerts)
**MapaPageV4:**
```tsx
const fetchers = {
  businesses: makeBusinessFetcher(territoryFilter),
  alerts: makeAlertFetcher(territoryFilter),
  events: makeEventFetcher(territoryFilter),
};
```

**NeighborhoodMap:**
- Apenas empresas (businesses)

### 2. ✅ Toggle de Camadas
**MapaPageV4:**
```tsx
<MapLayerToggle
  layerKeys={['businesses', 'events', 'alerts', 'services']}
  layout="vertical"
/>
```

**NeighborhoodMap:**
- Não tem controle de camadas

### 3. ✅ Busca de Endereços (Geocoding)
**MapaPageV4:**
```tsx
<MapSearchPanel
  onResultSelect={handleSearchResult}
  placeholder="Buscar lugar ou endereço..."
/>
```

**NeighborhoodMap:**
- Busca apenas filtra empresas localmente
- Não faz geocoding

### 4. ✅ Seletor Territorial
**MapaPageV4:**
```tsx
<TerritorySelectorV2 compact />
<TerritoryIndicator resolved={resolved} />
```

**NeighborhoodMap:**
- Não tem seletor territorial
- Território é passado via props

### 5. ✅ Viewport Fetch Dinâmico
**MapaPageV4:**
```tsx
const { layerData, loadingLayers, fetchByBounds } = useMapViewportFetch({
  fetchers,
  debounceMs: 400,
  minZoom: 10,
});

onViewportChange={(viewport, bounds) => {
  fetchByBounds(bounds, viewport.zoom);
}}
```

**NeighborhoodMap:**
- Recebe empresas via props
- Não busca dados dinamicamente ao mover o mapa

### 6. ✅ Filtro Territorial SSOT
**MapaPageV4:**
```tsx
const territoryFilter = useTerritoryFilter(resolved, activeMemberIds);
```

**NeighborhoodMap:**
- Não usa filtro territorial
- Apenas renderiza o que recebe via props

## Problema Arquitetural

### Situação Atual (ERRADA)
```
NeighborhoodMap (módulo business)
├── Lógica de busca local
├── Controles de UI
├── Hook de geolocalização
├── Renderização de marcadores
└── MapLibreAdapter

MapaPageV4 (core/maps)
├── Lógica de múltiplas camadas
├── Viewport fetch dinâmico
├── Filtro territorial
├── Busca de endereços
└── MapLibreAdapter
```

**Problemas:**
1. Duplicação de lógica de mapa
2. NeighborhoodMap não aproveita camadas múltiplas
3. MapaPageV4 não tem busca local de empresas
4. Dois componentes fazendo coisas similares de formas diferentes

### Arquitetura Correta (SSOT)

```
MapaCore (core/maps) - SSOT
├── Lógica de múltiplas camadas
├── Viewport fetch dinâmico
├── Filtro territorial
├── Busca de endereços + busca local
├── Controles de UI completos
├── Hook de geolocalização robusto
└── MapLibreAdapter

NeighborhoodMap (módulo business) - WRAPPER FINO
├── Props simplificadas para empresas
├── Converte businesses[] para formato do MapaCore
└── <MapaCore mode="neighborhood" businesses={businesses} />

MapaPageV4 - USA MapaCore
└── <MapaCore mode="full" />
```

## Plano de Refatoração

### Etapa 1: Criar MapaCore (componente base)
- Mesclar funcionalidades de NeighborhoodMap + MapaPageV4
- Suportar múltiplos modos: 'full', 'neighborhood', 'mini'
- Props configuráveis para cada modo

### Etapa 2: Refatorar NeighborhoodMap
- Tornar wrapper fino do MapaCore
- Apenas converter props e passar para MapaCore
- Manter interface pública inalterada

### Etapa 3: Refatorar MapaPageV4
- Usar MapaCore diretamente
- Remover lógica duplicada
- Manter funcionalidades específicas da página

### Etapa 4: Adicionar funcionalidades faltantes
- Busca local no MapaCore
- Contador de resultados
- Indicador de precisão GPS
- Hook robusto de geolocalização

## Benefícios da Refatoração

1. ✅ SSOT - Uma única fonte de verdade para lógica de mapa
2. ✅ Reutilização - Todos os mapas usam o mesmo core
3. ✅ Consistência - Comportamento uniforme em toda a aplicação
4. ✅ Manutenibilidade - Correções em um lugar beneficiam todos
5. ✅ Testabilidade - Testar um componente testa todos os mapas
6. ✅ Performance - Otimizações compartilhadas

## Próximos Passos

1. Criar `MapaCore.tsx` em `src/core/maps/components/`
2. Migrar funcionalidades de ambos os componentes
3. Refatorar `NeighborhoodMap` para usar `MapaCore`
4. Refatorar `MapaPageV4` para usar `MapaCore`
5. Deprecar lógica duplicada
6. Adicionar testes E2E para garantir paridade
