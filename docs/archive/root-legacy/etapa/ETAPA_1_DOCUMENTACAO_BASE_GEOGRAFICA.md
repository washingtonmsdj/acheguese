# DOCUMENTAÇÃO CANÔNICA - BASE GEOGRÁFICA ETAPA 1

**Data**: 04/04/2026  
**Versão**: 1.0  
**Status**: ✅ IMPLEMENTADO

---

## 📚 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Busca Espacial](#busca-espacial)
3. [Sistema de Cobertura](#sistema-de-cobertura)
4. [Geocoding](#geocoding)
5. [Padrões de Consumo](#padrões-de-consumo)
6. [Exemplos de Uso](#exemplos-de-uso)
7. [Anti-Padrões](#anti-padrões)

---

## VISÃO GERAL

### Fonte Única de Verdade (SSOT)

A ETAPA 1 estabelece três fontes únicas de verdade para operações geográficas:

1. **SpatialSearchService** - Busca por distância, raio, proximidade
2. **CoverageService** - Área de cobertura de entidades
3. **GeocodingService** - Geocoding e reverse geocoding

### Arquitetura

```
Database (PostGIS)
    ↓
Services (Business Logic)
    ↓
Hooks (React Query)
    ↓
Components (UI)
```

**Regras**:
- ✅ Sempre usar services através de hooks
- ❌ Nunca acessar banco diretamente de hooks/componentes
- ❌ Nunca duplicar lógica geográfica
- ❌ Nunca usar `any` sem justificativa

---

## BUSCA ESPACIAL

### SpatialSearchService

**Localização**: `src/core/geospatial/services/SpatialSearchService.ts`

**Responsabilidades**:
- Busca por raio (distância)
- Busca por bounding box (viewport)
- Busca híbrida (raio + território)
- Cálculo de distâncias
- Ordenação por proximidade

### Métodos Disponíveis

#### 1. searchByRadius

Busca entidades dentro de um raio específico.

```typescript
const results = await spatialSearchService.searchByRadius({
  center: { latitude: -12.9714, longitude: -38.5014 },
  radiusKm: 2,
  entityType: 'business',
  locationId: 'loc-pituba', // opcional
  limit: 20
});
```

**Parâmetros**:
- `center`: Coordenadas do ponto central
- `radiusKm`: Raio em quilômetros (máximo 100 km)
- `entityType`: Tipo de entidade ('business', 'classified', 'event', 'alert', 'tourist_point')
- `locationId`: Filtro opcional por território
- `limit`: Limite de resultados (padrão 50)
- `offset`: Offset para paginação (padrão 0)

**Retorno**:
```typescript
interface SpatialSearchResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
  location_id?: string;
}
```

#### 2. searchByBounds

Busca entidades dentro de um bounding box (viewport do mapa).

```typescript
const results = await spatialSearchService.searchByBounds({
  bounds: { 
    west: -38.52, 
    south: -12.98, 
    east: -38.48, 
    north: -12.96 
  },
  entityType: 'business',
  limit: 100
});
```

**Uso**: Renderização de marcadores no mapa.

#### 3. searchHybrid

Busca híbrida que combina raio com priorização territorial.

```typescript
const results = await spatialSearchService.searchHybrid({
  center: { latitude: -12.9714, longitude: -38.5014 },
  radiusKm: 5,
  entityType: 'business',
  locationIds: ['loc-pituba', 'loc-barra'],
  limit: 30
});
```

**Comportamento**: Entidades dentro do território aparecem primeiro, seguidas por proximidade.

#### 4. calculateDistance

Calcula distância em metros entre dois pontos.

```typescript
const distance = await spatialSearchService.calculateDistance(
  { latitude: -12.9714, longitude: -38.5014 },
  { latitude: -12.9800, longitude: -38.5100 }
);

console.log(`${(distance / 1000).toFixed(2)} km`);
```

### Hooks Disponíveis

**Localização**: `src/core/geospatial/hooks/useSpatialSearch.ts`

#### useSpatialSearchByRadius

```tsx
const { data: businesses, isLoading } = useSpatialSearchByRadius({
  center: { latitude: -12.9714, longitude: -38.5014 },
  radiusKm: 2,
  entityType: 'business',
  limit: 20
});
```

#### useSpatialSearchByBounds

```tsx
const { data: markers } = useSpatialSearchByBounds({
  bounds: mapBounds,
  entityType: 'business',
  limit: 100
});
```

#### useSpatialSearchHybrid

```tsx
const { data: results } = useSpatialSearchHybrid({
  center: userLocation,
  radiusKm: 5,
  entityType: 'business',
  locationIds: territoryIds,
  limit: 30
});
```

#### useNearbyEntities

Hook conveniente para buscar entidades próximas ao usuário.

```tsx
const { coords } = useRobustGeolocation();
const { data: nearby } = useNearbyEntities({
  userLocation: coords,
  entityType: 'business',
  radiusKm: 2
});
```

---

## SISTEMA DE COBERTURA

### CoverageService

**Localização**: `src/core/geospatial/services/CoverageService.ts`

**Responsabilidades**:
- Verificar se entidade atende uma localização
- Gerenciar áreas de cobertura
- Listar entidades que atendem uma localização

### Tipos de Cobertura

1. **location**: Cobertura por bairro/localidade
2. **radius**: Cobertura por raio (km)
3. **polygon**: Cobertura por polígono customizado (futuro)

### Métodos Disponíveis

#### 1. checkCoverage

Verifica se entidade atende uma localização.

```typescript
const result = await coverageService.checkCoverage({
  entityType: 'business',
  entityId: 'biz-123',
  userLocation: { latitude: -12.9714, longitude: -38.5014 }
});

if (result.has_coverage) {
  console.log('Atende sua região!');
}
```

**Retorno**:
```typescript
interface CoverageCheckResult {
  has_coverage: boolean;
  coverage_type?: 'location' | 'radius' | 'polygon';
  distance_meters?: number;
  location_id?: string;
}
```

#### 2. getCoverageAreas

Lista áreas de cobertura de uma entidade.

```typescript
const areas = await coverageService.getCoverageAreas('business', 'biz-123');

areas.forEach(area => {
  if (area.coverage_type === 'radius') {
    console.log(`Raio de ${area.radius_km} km`);
  } else if (area.coverage_type === 'location') {
    console.log(`Bairro: ${area.location_name}`);
  }
});
```

#### 3. addCoverageByRadius

Adiciona cobertura por raio.

```typescript
const areaId = await coverageService.addCoverageByRadius({
  entityType: 'business',
  entityId: 'biz-123',
  center: { latitude: -12.9714, longitude: -38.5014 },
  radiusKm: 5
});
```

#### 4. addCoverageByLocation

Adiciona cobertura por bairro.

```typescript
const areaId = await coverageService.addCoverageByLocation({
  entityType: 'business',
  entityId: 'biz-123',
  locationId: 'loc-pituba'
});
```

#### 5. removeCoverage

Remove (desativa) área de cobertura.

```typescript
await coverageService.removeCoverage('area-123');
```

#### 6. getCoverageDescription

Gera texto descritivo da cobertura.

```typescript
const text = await coverageService.getCoverageDescription('business', 'biz-123');
// "Atende Pituba, Barra e raio de 5 km"
```

### Hooks Disponíveis

**Localização**: `src/core/geospatial/hooks/useCoverage.ts`

#### useCheckCoverage

```tsx
const { data: coverage } = useCheckCoverage({
  entityType: 'business',
  entityId: business.id,
  userLocation: coords
});

{coverage?.has_coverage && (
  <Badge variant="success">Atende sua região</Badge>
)}
```

#### useEntityCoverage

```tsx
const { data: areas } = useEntityCoverage({
  entityType: 'business',
  entityId: business.id
});
```

#### useCoverageDescription

```tsx
const { data: description } = useCoverageDescription({
  entityType: 'business',
  entityId: business.id
});

<Text>{description}</Text>
```

#### useAddCoverageByRadius

```tsx
const addCoverage = useAddCoverageByRadius();

await addCoverage.mutateAsync({
  entityType: 'business',
  entityId: business.id,
  center: businessLocation,
  radiusKm: 5
});
```

#### useAddCoverageByLocation

```tsx
const addCoverage = useAddCoverageByLocation();

await addCoverage.mutateAsync({
  entityType: 'business',
  entityId: business.id,
  locationId: 'loc-pituba'
});
```

#### useRemoveCoverage

```tsx
const removeCoverage = useRemoveCoverage();

await removeCoverage.mutateAsync({
  areaId: 'area-123',
  entityType: 'business',
  entityId: business.id
});
```

---

## GEOCODING

### GeocodingService

**Localização**: `src/core/maps/services/GeocodingService.ts`

**Responsabilidades**:
- Geocoding (endereço → coordenadas)
- Reverse geocoding (coordenadas → endereço)
- Busca de polígonos de bairros/cidades

### Métodos Disponíveis

#### 1. reverseGeocode

Converte coordenadas em endereço.

```typescript
const address = await GeocodingService.reverseGeocode(-12.9714, -38.5014);

console.log(address.suburb);  // "Pituba"
console.log(address.city);    // "Salvador"
console.log(address.state);   // "Bahia"
```

#### 2. getNeighborhoodBounds

Busca polígono de um bairro.

```typescript
const { rings, center } = await GeocodingService.getNeighborhoodBounds(
  'Pituba',
  'Salvador',
  'Bahia',
  'loc-pituba' // opcional
);
```

**Estratégia**:
1. Tenta buscar polígono customizado no banco
2. Se não encontrar, busca no Nominatim (OpenStreetMap)

#### 3. getCityBounds

Busca polígono de uma cidade.

```typescript
const { rings, center } = await GeocodingService.getCityBounds(
  'Salvador',
  'Bahia'
);
```

#### 4. getBoundsByPostalCode

Busca localização por CEP.

```typescript
const result = await GeocodingService.getBoundsByPostalCode('40140-110');

if (result) {
  console.log(result.center);  // [lat, lng]
  console.log(result.radius);  // 500 (metros)
}
```

---

## PADRÕES DE CONSUMO

### 1. Busca Espacial em Listagens

```tsx
function BusinessList() {
  const { coords } = useRobustGeolocation();
  const { activeLocation } = useActiveTerritory();
  
  const { data: businesses } = useSpatialSearchHybrid({
    center: coords || { latitude: -12.9714, longitude: -38.5014 },
    radiusKm: 5,
    entityType: 'business',
    locationIds: activeLocation ? [activeLocation.id] : undefined,
    limit: 20
  });

  return (
    <div>
      {businesses?.map(biz => (
        <BusinessCard 
          key={biz.id} 
          business={biz}
          distance={biz.distance_meters}
        />
      ))}
    </div>
  );
}
```

### 2. Badge de Cobertura

```tsx
function CoverageBadge({ entityType, entityId }) {
  const { coords } = useRobustGeolocation();
  
  const { data: coverage } = useCheckCoverage({
    entityType,
    entityId,
    userLocation: coords
  });

  if (!coverage?.has_coverage) {
    return <Badge variant="warning">Fora da área de cobertura</Badge>;
  }

  return <Badge variant="success">Atende sua região</Badge>;
}
```

### 3. Mapa com Busca por Viewport

```tsx
function MapWithSpatialSearch() {
  const [viewport, setViewport] = useState(null);
  
  const { data: markers } = useSpatialSearchByBounds({
    bounds: viewport,
    entityType: 'business',
    limit: 100,
    enabled: !!viewport
  });

  return (
    <MapLibreAdapter
      onViewportChange={(vp, bounds) => {
        setViewport({
          west: bounds[0],
          south: bounds[1],
          east: bounds[2],
          north: bounds[3]
        });
      }}
      markers={markers}
    />
  );
}
```

### 4. Filtro de Distância

```tsx
function DistanceFilter() {
  const [radiusKm, setRadiusKm] = useState(2);
  const { coords } = useRobustGeolocation();
  
  const { data: results } = useSpatialSearchByRadius({
    center: coords,
    radiusKm,
    entityType: 'business',
    enabled: !!coords
  });

  return (
    <div>
      <label>
        Raio: {radiusKm} km
        <input
          type="range"
          min="1"
          max="10"
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
        />
      </label>
      
      <p>{results?.length || 0} resultados encontrados</p>
    </div>
  );
}
```

---

## EXEMPLOS DE USO

### Exemplo 1: Busca "Perto de Mim"

```tsx
function NearbyBusinesses() {
  const { coords, loading } = useRobustGeolocation();
  
  const { data: nearby, isLoading } = useNearbyEntities({
    userLocation: coords,
    entityType: 'business',
    radiusKm: 2
  });

  if (loading || isLoading) {
    return <Spinner />;
  }

  if (!coords) {
    return <Alert>Ative a localização para ver empresas próximas</Alert>;
  }

  return (
    <div>
      <h2>Perto de você ({nearby?.length || 0})</h2>
      {nearby?.map(biz => (
        <BusinessCard 
          key={biz.id}
          business={biz}
          distance={biz.distance_meters}
        />
      ))}
    </div>
  );
}
```

### Exemplo 2: Configurar Cobertura de Empresa

```tsx
function BusinessCoverageSettings({ businessId }) {
  const addByRadius = useAddCoverageByRadius();
  const addByLocation = useAddCoverageByLocation();
  const { data: areas } = useEntityCoverage({
    entityType: 'business',
    entityId: businessId
  });

  const handleAddRadius = async () => {
    await addByRadius.mutateAsync({
      entityType: 'business',
      entityId: businessId,
      center: businessLocation,
      radiusKm: 5
    });
  };

  const handleAddLocation = async (locationId: string) => {
    await addByLocation.mutateAsync({
      entityType: 'business',
      entityId: businessId,
      locationId
    });
  };

  return (
    <div>
      <h3>Áreas de Cobertura</h3>
      {areas?.map(area => (
        <CoverageAreaCard key={area.id} area={area} />
      ))}
      
      <Button onClick={handleAddRadius}>
        Adicionar Raio de 5 km
      </Button>
    </div>
  );
}
```

### Exemplo 3: Ordenar por Proximidade

```tsx
function SortByProximity() {
  const { coords } = useRobustGeolocation();
  const [sortBy, setSortBy] = useState<'relevance' | 'distance'>('relevance');
  
  const { data: businesses } = useSpatialSearchByRadius({
    center: coords,
    radiusKm: 5,
    entityType: 'business',
    enabled: !!coords && sortBy === 'distance'
  });

  return (
    <div>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="relevance">Relevância</option>
        <option value="distance">Proximidade</option>
      </select>
      
      {sortBy === 'distance' && businesses?.map(biz => (
        <BusinessCard 
          key={biz.id}
          business={biz}
          distance={biz.distance_meters}
        />
      ))}
    </div>
  );
}
```

---

## ANTI-PADRÕES

### ❌ NÃO FAZER

#### 1. Acesso Direto ao Banco

```tsx
// ❌ ERRADO
const { data } = useQuery({
  queryFn: async () => {
    const { data } = await supabase
      .from('business_data')
      .select('*')
      .eq('latitude', lat);
    return data;
  }
});
```

```tsx
// ✅ CORRETO
const { data } = useSpatialSearchByRadius({
  center: { latitude: lat, longitude: lng },
  radiusKm: 2,
  entityType: 'business'
});
```

#### 2. Cálculo de Distância Manual

```tsx
// ❌ ERRADO
function calculateDistance(lat1, lng1, lat2, lng2) {
  // Fórmula de Haversine manual
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  // ...
}
```

```tsx
// ✅ CORRETO
const distance = await spatialSearchService.calculateDistance(
  { latitude: lat1, longitude: lng1 },
  { latitude: lat2, longitude: lng2 }
);
```

#### 3. Lógica de Cobertura Duplicada

```tsx
// ❌ ERRADO
function checkIfBusinessCoversLocation(business, userLat, userLng) {
  // Lógica duplicada de cobertura
  if (business.coverage_radius) {
    const dist = calculateDistance(...);
    return dist <= business.coverage_radius * 1000;
  }
}
```

```tsx
// ✅ CORRETO
const { data: coverage } = useCheckCoverage({
  entityType: 'business',
  entityId: business.id,
  userLocation: { latitude: userLat, longitude: userLng }
});
```

#### 4. Uso de `any` Desnecessário

```tsx
// ❌ ERRADO
const results: any = await spatialSearchService.searchByRadius(...);
```

```tsx
// ✅ CORRETO
const results: SpatialSearchResult[] = await spatialSearchService.searchByRadius(...);
```

#### 5. Ignorar Validação de Coordenadas

```tsx
// ❌ ERRADO
await spatialSearchService.searchByRadius({
  center: { latitude: userInput, longitude: userInput2 },
  radiusKm: 2,
  entityType: 'business'
});
```

```tsx
// ✅ CORRETO
if (isValidLatitude(userInput) && isValidLongitude(userInput2)) {
  await spatialSearchService.searchByRadius({
    center: { latitude: userInput, longitude: userInput2 },
    radiusKm: 2,
    entityType: 'business'
  });
}
```

---

## PRÓXIMOS PASSOS

### ETAPA 2 (Futuro)

- Clustering de marcadores no mapa
- Isócronas (áreas acessíveis em X minutos)
- Heatmap de densidade
- Rotas e ETA
- Realtime no mapa

### ETAPA 3 (Futuro)

- Escala multi-cidade
- Otimização de performance
- Cache distribuído
- Analytics geográficos

---

**Documentação elaborada por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Versão**: 1.0
