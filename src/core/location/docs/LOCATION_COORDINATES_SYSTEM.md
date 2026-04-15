# Sistema Profissional de Coordenadas de Locations

## Visão Geral

Sistema AAA (nível profissional) que garante que TODOS os locations tenham coordenadas geográficas precisas, incluindo os futuros.

## Arquitetura

### 1. Camada de Banco de Dados (PostgreSQL)

#### Validação Automática
- **Trigger de validação**: Garante que locations do tipo `city` e `district` tenham coordenadas
- **Trigger de auto-população**: Herda coordenadas do parent quando não fornecidas
- **Constraint de formato**: Valida que coordenadas sejam números válidos (-90 a 90 para lat, -180 a 180 para lng)

#### Funções Disponíveis

```sql
-- Verificar status de cobertura
SELECT * FROM locations_coordinates_status;

-- Backfill de coordenadas faltantes
SELECT * FROM backfill_missing_coordinates();

-- Habilitar validação estrita (após backfill)
SELECT enable_strict_coordinate_validation();

-- Buscar coordenadas herdadas do parent
SELECT * FROM get_inherited_coordinates('parent-uuid');
```

### 2. Camada de Serviço (TypeScript)

#### LocationGeocodingService

Serviço profissional para geocoding automático:

```typescript
import { LocationGeocodingService } from '@/core/location/services/LocationGeocodingService';

// Buscar locations sem coordenadas
const missing = await LocationGeocodingService.getLocationsWithoutCoordinates();

// Geocodificar usando Nominatim (OpenStreetMap)
const result = await LocationGeocodingService.geocodeWithNominatim(location);

// Processar batch com rate limiting
const stats = await LocationGeocodingService.processBatch(locations, onProgress);

// Validar coordenadas para Brasil
const valid = LocationGeocodingService.validateCoordinatesForBrazil(lat, lng);
```

### 3. Script CLI

```bash
# Geocodificar locations sem coordenadas
npm run geocode-locations

# Refinar coordenadas existentes marcadas como needs_refinement
npm run geocode-locations -- --refine
```

## Fluxo de Trabalho

### Para Locations Existentes

1. **Executar migração profissional**:
   ```sql
   -- Aplica no Supabase SQL Editor
   docs/MIGRATION_LOCATION_CENTERS_PROFESSIONAL.sql
   ```

2. **Verificar cobertura**:
   ```sql
   SELECT * FROM locations_coordinates_status;
   ```

3. **Geocodificar faltantes** (se houver):
   ```bash
   npm run geocode-locations
   ```

4. **Habilitar validação estrita**:
   ```sql
   SELECT enable_strict_coordinate_validation();
   ```

### Para Novos Locations

#### Opção 1: Fornecer Coordenadas Manualmente (Recomendado)

```typescript
await supabase.from('locations').insert({
  parent_id: cityId,
  type: 'district',
  slug: 'novo-bairro',
  name: 'Novo Bairro',
  full_name: 'Novo Bairro, Salvador',
  metadata: {
    center_latitude: -12.9876,
    center_longitude: -38.4567,
    coordinates_source: 'manual',
    coordinates_confidence: 'high'
  }
});
```

#### Opção 2: Deixar Auto-Popular (Fallback)

```typescript
// Sem coordenadas - trigger herda do parent automaticamente
await supabase.from('locations').insert({
  parent_id: cityId,
  type: 'district',
  slug: 'novo-bairro',
  name: 'Novo Bairro',
  full_name: 'Novo Bairro, Salvador',
  metadata: {}
});

// Depois refinar via geocoding
// npm run geocode-locations -- --refine
```

## Estrutura da Metadata

```json
{
  "center_latitude": -12.971111,
  "center_longitude": -38.510833,
  "coordinates_source": "nominatim" | "google" | "manual" | "inherited_from_parent",
  "coordinates_confidence": "high" | "medium" | "low",
  "coordinates_needs_refinement": false,
  "coordinates_updated_at": "2026-04-05T10:30:00Z"
}
```

## Fontes de Geocoding

### 1. Nominatim (OpenStreetMap) - Padrão
- **Gratuito** e open source
- **Rate limit**: 1 requisição/segundo
- **Cobertura**: Excelente para Brasil
- **Precisão**: Alta para cidades, média para bairros

### 2. Google Geocoding API - Futuro
- **Pago** (requer API key)
- **Rate limit**: Generoso
- **Cobertura**: Excelente
- **Precisão**: Muito alta

### 3. Manual - Sempre Disponível
- **Precisão**: Máxima
- **Uso**: Para locations críticos ou quando APIs falham

## Monitoramento

### View de Status

```sql
SELECT * FROM locations_coordinates_status;
```

Retorna:
```
type     | total | with_coordinates | missing | needs_refinement | coverage_%
---------|-------|------------------|---------|------------------|------------
country  |     1 |                1 |       0 |                0 |     100.00
state    |     1 |                1 |       0 |                0 |     100.00
city     |     2 |                2 |       0 |                0 |     100.00
district |    45 |               45 |       0 |                3 |     100.00
```

### Locations que Precisam Refinamento

```sql
SELECT name, type, full_name, 
       metadata->>'coordinates_source' as source
FROM locations 
WHERE (metadata->>'coordinates_needs_refinement')::boolean = true;
```

## Integração com useResolvedUserLocation

O hook `useResolvedUserLocation` usa automaticamente as coordenadas da metadata:

```typescript
const { coords, status, sourceMessage } = useResolvedUserLocation();

// Se GPS negado e território "Pituba" selecionado:
// coords = { latitude: -13.0050, longitude: -38.4650 }
// status = 'territory'
// sourceMessage = 'Mostrando resultados em Pituba'
```

## Garantias do Sistema

✅ **Todos os locations do tipo city/district TÊM coordenadas**
✅ **Novos locations herdam do parent automaticamente**
✅ **Validação no banco impede inserções sem coordenadas**
✅ **Geocoding automático disponível via CLI**
✅ **Monitoramento em tempo real via views**
✅ **Múltiplas fontes de geocoding (Nominatim, Google, manual)**
✅ **Rate limiting respeitado**
✅ **Logs detalhados de todas as operações**

## Troubleshooting

### Location sem coordenadas após inserção

1. Verificar se trigger está ativo:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trg_auto_populate_location_coordinates';
   ```

2. Verificar se parent tem coordenadas:
   ```sql
   SELECT name, metadata->>'center_latitude' 
   FROM locations 
   WHERE id = 'parent-uuid';
   ```

3. Executar backfill manual:
   ```sql
   SELECT * FROM backfill_missing_coordinates();
   ```

### Geocoding falhando

1. Verificar conectividade com Nominatim
2. Verificar rate limiting (1 req/segundo)
3. Tentar geocoding manual via Nominatim web
4. Adicionar coordenadas manualmente se necessário

## Roadmap

- [ ] Integração com Google Geocoding API
- [ ] Cache de resultados de geocoding
- [ ] Validação de qualidade de coordenadas
- [ ] Interface admin para refinamento manual
- [ ] Webhook para geocoding assíncrono
- [ ] Suporte a polígonos de bairros (além de pontos centrais)

## Arquivos do Sistema

- `docs/MIGRATION_LOCATION_CENTERS_PROFESSIONAL.sql` - Migração completa
- `src/core/location/services/LocationGeocodingService.ts` - Serviço de geocoding
- `scripts/geocode-locations.ts` - Script CLI
- `./LOCATION_COORDINATES_SYSTEM.md` - Esta documentação
