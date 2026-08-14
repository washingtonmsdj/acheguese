# REGRAS GEOESPACIAIS

**Data**: 2026-08-13
**Versão**: 1.1.0
**Status**: ✅ OFICIAL

---

## 1. FUNDAÇÃO

### PostGIS

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

- SRID 4326 (WGS84) para todas as geometrias
- Índices GiST para performance

### Geometrias

```
locations.boundary    → GEOMETRY(POLYGON, 4326)
addresses.point       → GEOMETRY(POINT, 4326)
```

---

## 2. RESOLUÇÃO PONTO → TERRITÓRIO

### Método 1: Boundary Containment (Prioridade)

```sql
SELECT * FROM locations
WHERE ST_Contains(boundary, ST_MakePoint(lng, lat))
  AND type = 'district'
  AND status = 'active'
  AND boundary IS NOT NULL;
```

**Características**:

- Confidence: 1.0
- Resolution method: 'boundary_containment'
- Requer boundary definido

### Método 2: Proximity Fallback

```sql
SELECT * FROM locations
WHERE type = 'district'
  AND status = 'active'
  AND metadata->>'canonical_lat' IS NOT NULL
ORDER BY ST_Distance(
  point::geography,
  ST_MakePoint(canonical_lng, canonical_lat)::geography
)
LIMIT 1;
```

**Características**:

- Confidence: 0.5
- Resolution method: 'proximity_fallback'
- Usa canonical_lat/lng de metadata
- Retorna distance_meters

---

## 3. SINCRONIZAÇÃO AUTOMÁTICA (ADDRESSES)

### Trigger

```sql
CREATE TRIGGER trigger_sync_address_point
BEFORE INSERT OR UPDATE OF latitude, longitude ON addresses
FOR EACH ROW
EXECUTE FUNCTION sync_address_point();
```

### Comportamento

```
latitude + longitude definidos → point = ST_MakePoint(lng, lat)
latitude ou longitude NULL      → point = NULL
```

**Importante**: Ordem é [longitude, latitude] no PostGIS.

---

## 4. VALIDAÇÕES

### Coordenadas

```typescript
latitude:  -90 a 90
longitude: -180 a 180
```

### Boundary (Polygon)

```typescript
- Tipo: 'Polygon'
- Mínimo: 4 pontos (incluindo ponto de fechamento)
- Fechado: primeiro ponto = último ponto
- Coordenadas: [[[lng, lat], [lng, lat], ...]]
```

**Exemplo válido**:

```typescript
{
  type: 'Polygon',
  coordinates: [[
    [-38.5000, -13.0000],
    [-38.4900, -13.0000],
    [-38.4900, -12.9900],
    [-38.5000, -12.9900],
    [-38.5000, -13.0000], // Fechado
  ]]
}
```

---

## 5. CONFIDENCE LEVELS

### 1.0 - Boundary Containment

- Ponto está dentro de boundary oficial
- Método mais preciso
- Requer boundary definido

### 0.5 - Proximity Fallback

- Território mais próximo por canonical_lat/lng
- Método aproximado
- Usado quando boundary não disponível

### null - Não Resolvido

- Nenhum território encontrado
- Coordenadas fora de cobertura

---

## 6. GEOESPACIAL NÃO SUBSTITUI GOVERNANÇA

### Regra Fundamental

**Geoespacial ajuda a resolver; não redefine SSOT territorial.**

```typescript
// ❌ ERRADO: criar location baseado em coordenadas
const newLocation = await createLocationFromCoordinates(lat, lng);

// ✅ CORRETO: resolver location existente
const result = await geospatialService.resolvePointToLocation({
  latitude,
  longitude,
});
if (result) {
  const location = await locationService.getLocationById(result.location_id);
}
```

### Hierarquia de Autoridade

```
1. Governança Territorial (core/location, core/governance)
   ↓
2. Geoespacial (core/geospatial)
   ↓
3. Providers Externos (integrations/maps)
```

---

## 7. CASOS DE USO

### Caso 1: Usuário Informa Endereço com Coordenadas

```typescript
// 1. Resolver território por coordenadas
const resolution = await geospatialService.resolvePointToLocationWithFallback({
  latitude: userInput.latitude,
  longitude: userInput.longitude,
});

// 2. Criar address vinculado ao território resolvido
if (resolution) {
  await addressService.createAddress({
    location_id: resolution.location_id,
    address_type: "exact",
    street: userInput.street,
    number: userInput.number,
    latitude: userInput.latitude,
    longitude: userInput.longitude,
    geocoding_source: "user_input",
    geocoding_confidence: resolution.confidence,
  });
}
```

### Caso 2: Validar se Endereço Está no Território Correto

```typescript
const address = await addressService.getAddressById(addressId);

const resolution = await geospatialService.resolvePointToLocation({
  latitude: address.latitude!,
  longitude: address.longitude!,
});

if (resolution && resolution.location_id !== address.location_id) {
  console.warn("Address location mismatch", {
    declared: address.location_id,
    resolved: resolution.location_id,
    confidence: resolution.confidence,
  });
}
```

### Caso 3: Buscar Addresses Próximos

```typescript
// Usar RPC ou query SQL direta
const { data } = await supabase.rpc("find_addresses_near_point", {
  lat: -12.975,
  lng: -38.475,
  radius_meters: 1000,
});
```

---

## 8. FORMATO GEOJSON

### Point

```json
{
  "type": "Point",
  "coordinates": [-38.475, -12.975]
}
```

**Ordem**: [longitude, latitude]

### Polygon

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [-38.5, -13.0],
      [-38.49, -13.0],
      [-38.49, -12.99],
      [-38.5, -12.99],
      [-38.5, -13.0]
    ]
  ]
}
```

**Regras**:

- Primeiro anel: exterior
- Anéis adicionais: buracos (opcional)
- Fechado: primeiro = último

---

## 9. PERFORMANCE

### Índices Espaciais

```sql
CREATE INDEX idx_locations_boundary_gist ON locations USING GIST(boundary);
CREATE INDEX idx_addresses_point_gist ON addresses USING GIST(point);
```

### Consultas Otimizadas

```sql
-- Containment (rápido com GiST)
WHERE ST_Contains(boundary, point)

-- Distância (rápido com GiST + geography)
ORDER BY ST_Distance(point1::geography, point2::geography)
```

---

## 10. MALHAS OFICIAIS PARA VISUALIZAÇÃO

O `BoundaryService` resolve geometrias para mapas nesta ordem:

1. `location_boundaries` quando habilitado;
2. `locations.boundary`;
3. `neighborhood_boundaries` para distrito/bairro;
4. fonte oficial declarada em metadata (`source_url` + `source_object_id`);
5. registro oficial versionado e lazy em `core/geospatial/data`;
6. somente o centro canônico, sem inventar polígono.

A malha municipal de Salvador (`IBGE 2927408`) usa o GeoJSON oficial de
qualidade intermediária, com 73 pontos e carregamento em chunk separado. Essa
fonte existe para visualização quando a geometria remota estiver ausente.

**Importante:** a malha versionada não cria território, não altera o banco e
não participa de autorização ou containment PostgreSQL. A hierarquia continua
em `core/location`, e as geometrias persistidas continuam tendo prioridade.

### Geocoding (NÃO implementado ainda)

```
Google Geocoding API → endereço → coordenadas
ViaCEP → CEP → endereço
```

### Reverse Geocoding (NÃO implementado ainda)

```
coordenadas → endereço completo
```

---

**Versão**: 1.1.0
**Status**: ✅ FUNDAÇÃO COMPLETA
