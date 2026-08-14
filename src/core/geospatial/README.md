# Core Geospatial Module

**Status**: ✅ FUNDAÇÃO COMPLETA  
**Versão**: 1.1.0
**Data**: 2026-08-13

---

## Visão Geral

Módulo responsável por **operações geoespaciais** com PostGIS.

**NÃO confundir com**:

- `core/location`: Hierarquia territorial oficial (SSOT)
- `core/address`: Endereços postais (SSOT de endereços)
- `integrations/maps`: Providers externos (Google, OSM)

---

## Responsabilidades

### O que este módulo faz ✅

- Resolver ponto geográfico para território (containment)
- Fallback por proximidade quando boundary não disponível
- Gerenciar boundaries de locations (polígonos)
- Resolver malhas oficiais versionadas para visualização quando o banco não possui geometria
- Sincronizar latitude/longitude com point geometry
- Consultas espaciais (ST_Contains, ST_Distance)

### O que este módulo NÃO faz ❌

- Gerenciar hierarquia territorial (use `core/location`)
- Gerenciar endereços postais (use `core/address`)
- Geocoding (use `integrations/maps` - etapa futura)
- Reverse geocoding (etapa futura)
- Usar malha visual como substituto da governança territorial ou da autorização
- Redefinir SSOT territorial

---

## Estrutura

```
src/core/geospatial/
├── data/
│   ├── officialBoundaryRegistry.ts
│   └── brBaSalvadorMunicipality.ts
├── services/
│   ├── GeospatialService.ts
│   └── __tests__/
│       └── GeospatialService.test.ts
├── repositories/
│   ├── IGeospatialRepository.ts
│   ├── GeospatialRepositoryMock.ts
│   ├── GeospatialRepositorySupabase.ts
│   └── createGeospatialRepository.ts
├── types/
│   └── index.ts
├── index.ts
└── README.md
```

---

## Uso Básico

### 1. Resolver Ponto para Território (Containment)

```typescript
import { geospatialService } from "@/core/geospatial";

const result = await geospatialService.resolvePointToLocation({
  latitude: -12.975,
  longitude: -38.475,
  location_type: "district", // Opcional, default 'district'
});

if (result) {
  console.log(result.location_id); // 'loc-nordeste-de-amaralina'
  console.log(result.resolution_method); // 'boundary_containment'
  console.log(result.confidence); // 1.0
}
```

### 2. Resolver Ponto com Fallback

```typescript
// Tenta boundary primeiro, depois proximidade
const result = await geospatialService.resolvePointToLocationWithFallback({
  latitude: -12.8,
  longitude: -38.3,
  location_type: "district",
});

if (result) {
  console.log(result.resolution_method); // 'proximity_fallback'
  console.log(result.confidence); // 0.5
  console.log(result.distance_meters); // 15234.56
}
```

### 3. Definir Boundary de Location

```typescript
await geospatialService.setLocationBoundary("loc-barra", {
  type: "Polygon",
  coordinates: [
    [
      [-38.52, -13.02],
      [-38.51, -13.02],
      [-38.51, -13.01],
      [-38.52, -13.01],
      [-38.52, -13.02], // Fechado (primeiro = último)
    ],
  ],
});
```

### 4. Verificar se Location Tem Boundary

```typescript
const hasBoundary = await geospatialService.hasBoundary("loc-barra");
// true ou false
```

### 5. Obter Boundary de Location

```typescript
const boundary = await geospatialService.getLocationBoundary("loc-barra");

if (boundary) {
  console.log(boundary.type); // 'Polygon'
  console.log(boundary.coordinates); // [[[lng, lat], ...]]
}
```

### 6. Converter Coordenadas para GeoJSON

```typescript
const point = geospatialService.coordinatesToGeoJSON({
  latitude: -12.975,
  longitude: -38.475,
});

// { type: 'Point', coordinates: [-38.4750, -12.9750] }
```

---

## Estrutura de Dados

### locations.boundary

```sql
boundary GEOMETRY(POLYGON, 4326)
```

- Representa limite territorial oficial
- SRID 4326 (WGS84)
- Índice espacial: GiST

### addresses.point

```sql
point GEOMETRY(POINT, 4326)
```

- Representa ponto exato ou aproximado do endereço
- SRID 4326 (WGS84)
- Índice espacial: GiST
- Sincronizado automaticamente com latitude/longitude (trigger)

---

## Funções SQL (RPCs)

### resolve_point_to_location

```sql
SELECT * FROM resolve_point_to_location(
  lat := -12.9750,
  lng := -38.4750,
  location_type := 'district'
);
```

**Retorna**:

- location_id
- location_name
- location_slug
- location_type
- resolution_method: 'boundary_containment'
- confidence: 1.0

### resolve_point_to_location_with_fallback

```sql
SELECT * FROM resolve_point_to_location_with_fallback(
  lat := -12.8000,
  lng := -38.3000,
  location_type := 'district'
);
```

**Retorna**:

- location_id
- location_name
- location_slug
- location_type
- resolution_method: 'boundary_containment' ou 'proximity_fallback'
- confidence: 1.0 (boundary) ou 0.5 (proximity)
- distance_meters: distância em metros (apenas proximity)

---

## Regras de Negócio

### 1. Prioridade de Resolução

```
1. Boundary Containment (confidence 1.0)
   ↓ se não encontrar
2. Proximity Fallback (confidence 0.5)
   ↓ se não encontrar
3. null
```

### 2. Sincronização Automática (addresses)

```sql
-- Trigger automático
latitude/longitude → point (GEOMETRY)
```

**Comportamento**:

- INSERT ou UPDATE de latitude/longitude → point atualizado automaticamente
- latitude ou longitude NULL → point NULL

### 3. Boundary vs Canonical Coordinates

```
locations.boundary           → Polígono oficial (precisão alta)
locations.metadata.canonical → Ponto representativo (fallback)
```

### 4. Geoespacial Não Substitui Governança

**Importante**: Geoespacial ajuda a resolver, mas não redefine SSOT territorial.

```typescript
// ❌ ERRADO: criar location baseado apenas em coordenadas
const location = await createLocationFromPoint(lat, lng);

// ✅ CORRETO: resolver location existente por coordenadas
const result = await geospatialService.resolvePointToLocation({
  latitude,
  longitude,
});
if (result) {
  const location = await locationService.getLocationById(result.location_id);
}
```

---

## Testes

**Arquivo**: `services/__tests__/GeospatialService.test.ts`

**Cobertura**: 17 testes

**Point Resolution** (5 testes):

- resolvePointToLocation: 3 testes (dentro boundary, fora boundary, coordenadas inválidas)
- resolvePointToLocationWithFallback: 2 testes (boundary disponível, fallback proximidade)

**Boundary Management** (9 testes):

- hasBoundary: 3 testes (com boundary, sem boundary, id vazio)
- setLocationBoundary: 4 testes (válido, location inexistente, polígono não fechado, menos de 4 pontos)
- getLocationBoundary: 2 testes (existente, não existente)

**Helpers** (3 testes):

- coordinatesToGeoJSON: 3 testes (válido, latitude inválida, longitude inválida)

**Status**: ✅ 17/17 passed

---

## Validações Implementadas

### Coordenadas

- ✅ Latitude: -90 a 90
- ✅ Longitude: -180 a 180

### Boundary

- ✅ Tipo deve ser 'Polygon'
- ✅ Deve ter coordenadas
- ✅ Polígono deve ter pelo menos 4 pontos
- ✅ Polígono deve ser fechado (primeiro = último)
- ✅ Location deve existir

### Resolution

- ✅ Boundary containment tem prioridade
- ✅ Proximity fallback quando boundary não disponível
- ✅ Retorna null quando não encontra

---

## Integração com Addresses

### Sincronização Automática

```typescript
// Ao criar/atualizar address com coordenadas
await addressService.createAddress({
  location_id: "loc-barra",
  address_type: "exact",
  street: "Rua Exemplo",
  number: "123",
  latitude: -13.01,
  longitude: -38.52,
  // point será criado automaticamente pelo trigger
});
```

### Consulta Espacial

```sql
-- Buscar addresses próximos a um ponto
SELECT *
FROM addresses
WHERE ST_DWithin(
  point::geography,
  ST_SetSRID(ST_MakePoint(-38.5200, -13.0100), 4326)::geography,
  1000  -- 1km
)
ORDER BY ST_Distance(
  point::geography,
  ST_SetSRID(ST_MakePoint(-38.5200, -13.0100), 4326)::geography
);
```

---

## Pendências Fora do Escopo (ETAPA 4)

**NÃO implementado ainda**:

- ❌ Pipeline global de importação/sincronização de malhas oficiais no banco
- ❌ Geocoding (Google, OSM)
- ❌ Reverse geocoding
- ❌ Integração com providers externos
- ❌ UI administrativa de mapas/polígonos
- ❌ Aplicação em formulários
- ❌ Migração de módulos de negócio
- ❌ Consultas espaciais avançadas (intersect, buffer, etc)

**Implementado**:

- ✅ Registro visual lazy da malha municipal oficial de Salvador (IBGE 2927408)
- ✅ PostGIS habilitado
- ✅ locations.boundary (POLYGON, índice GiST)
- ✅ addresses.point (POINT, índice GiST)
- ✅ Sincronização latitude/longitude → point (trigger)
- ✅ RPC resolve_point_to_location
- ✅ RPC resolve_point_to_location_with_fallback
- ✅ GeospatialService (5 métodos)
- ✅ Repositórios (Mock + Supabase)
- ✅ Testes (17 testes passando)

---

**Versão**: 1.0.0  
**Status**: ✅ FUNDAÇÃO COMPLETA
