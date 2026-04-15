# Core Geocoding Module

**Status**: ✅ ETAPA 2 IMPLEMENTADA  
**Versão**: 1.0.0  
**Data**: 2026-04-06

---

## Visão Geral

Módulo SSOT para **geocoding unificado** no projeto. Consolida funcionalidades que estavam espalhadas entre `core/address`, `core/maps/services/GeocodingService` e `core/geospatial`.

**Responsabilidades**:
- Busca por CEP (postal code lookup)
- Geocoding direto (endereço → coordenada)
- Reverse geocoding (coordenada → endereço)
- Normalização de endereços
- Orquestração de múltiplos providers com fallback automático

**NÃO confundir com**:
- `core/geospatial`: Operações espaciais, containment, boundaries
- `core/address`: Endereços postais como entidade de domínio
- `core/maps`: Renderização e interação visual com mapas

---

## Estrutura

```
src/core/geocoding/
├── types/                    # Tipos SSOT
│   └── index.ts
├── providers/               # Implementações de providers
│   ├── BaseGeocodingProvider.ts
│   ├── ViaCepProvider.ts    (baseado em CepService existente)
│   └── NominatimProvider.ts (baseado em GeocodingService existente)
├── services/                # Serviço orquestrador
│   └── GeocodingService.ts
├── hooks/                   # Hooks React
│   └── useGeocoding.ts
├── instance.ts              # Singleton e configuração
├── index.ts                 # Barrel exports
└── README.md
```

---

## Uso Básico

### 1. Via Service (Node.js/SSR)

```typescript
import { geocodingService } from '@/core/geocoding';

// Busca por CEP
const cepResult = await geocodingService.lookupPostalCode({
  postalCode: '40000-000',
});

// Geocoding direto
const geocodeResults = await geocodingService.geocode({
  query: 'Avenida Paulista, 1000, São Paulo',
  city: 'São Paulo',
  state: 'SP',
});

// Reverse geocoding
const reverseResult = await geocodingService.reverseGeocode({
  latitude: -23.5505,
  longitude: -46.6333,
});
```

### 2. Via Hook React

```typescript
import { useGeocoding, usePostalCodeLookup } from '@/core/geocoding';

function MyComponent() {
  const { lookupPostalCode, data, isLoading, error } = usePostalCodeLookup();
  
  const handleCepSearch = async () => {
    try {
      const result = await lookupPostalCode({
        postalCode: '40000-000',
      });
      console.log('CEP encontrado:', result);
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    }
  };
  
  return (
    <div>
      {isLoading && <p>Buscando...</p>}
      {error && <p>Erro: {error.message}</p>}
      {data && (
        <p>
          {data.street}, {data.neighborhood}, {data.city} - {data.state}
        </p>
      )}
    </div>
  );
}
```

### 3. Configuração

```typescript
import { initializeGeocodingService } from '@/core/geocoding';

// Configuração personalizada (opcional)
initializeGeocodingService({
  defaultProvider: 'nominatim',
  fallbackProviders: ['viacep'],
  timeoutMs: 20000,
  enableCache: true,
  cacheTtlSeconds: 600,
});
```

---

## Providers Implementados

### 1. ViaCEP (`viacep`)
- **Funcionalidade**: Busca por CEP
- **Fonte**: API ViaCEP
- **Limitações**: Apenas CEP brasileiro, não faz geocoding direto
- **Baseado em**: `src/core/address/services/CepService.ts`

### 2. Nominatim (`nominatim`)
- **Funcionalidade**: Geocoding direto e reverse geocoding
- **Fonte**: OpenStreetMap Nominatim (via proxy Supabase)
- **Limitações**: Rate limiting, precisão variável
- **Baseado em**: `src/core/maps/services/GeocodingService.ts`

### 3. Fallback Automático
O serviço tenta providers na ordem configurada:
1. Provider padrão (`nominatim`)
2. Fallbacks (`viacep`)
3. Retorna erro se nenhum funcionar

---

## Integração com Módulos Existentes

### 1. `core/address` (Endereços Postais)
```typescript
// Antes (legado):
import { CepService } from '@/core/address/services/CepService';
const result = await CepService.lookup('40000000');

// Depois (novo SSOT):
import { geocodingService } from '@/core/geocoding';
const result = await geocodingService.lookupPostalCode({
  postalCode: '40000-000',
});
```

### 2. `core/maps` (Geocoding Service)
```typescript
// Antes (legado):
import { GeocodingService } from '@/core/maps/services/GeocodingService';
const bounds = await GeocodingService.getNeighborhoodBounds(...);

// Depois (responsabilidade movida):
// GeocodingService antigo será marcado como deprecated
// Nova responsabilidade: core/geocoding + core/geospatial
```

### 3. `core/geospatial` (Operações Espaciais)
```typescript
// Separação clara de responsabilidades:
// - core/geocoding: Transforma CEP/endereço/coordenada em dados de localização
// - core/geospatial: Operações espaciais (containment, boundaries, etc.)

import { geocodingService } from '@/core/geocoding';
import { geospatialService } from '@/core/geospatial';

// 1. Geocoding primeiro
const geocodeResult = await geocodingService.geocode({
  query: 'Rua Exemplo, 123',
});

// 2. Resolução territorial depois
if (geocodeResult.length > 0) {
  const { latitude, longitude } = geocodeResult[0].coordinates;
  const territory = await geospatialService.resolvePointToLocation({
    latitude,
    longitude,
  });
}
```

---

## Migração de Código Legado

### Arquivos Afetados

#### 1. `src/core/address/services/CepService.ts`
- **Status**: Será marcado como deprecated
- **Ação**: Consumidores devem migrar para `core/geocoding`
- **Compatibilidade**: Service mantido por transição

#### 2. `src/core/maps/services/GeocodingService.ts`
- **Status**: Será refatorado para usar `core/geocoding`
- **Responsabilidade mantida**: Apenas integração com mapas
- **Responsabilidade movida**: Geocoding para `core/geocoding`

#### 3. Consumidores Existentes
- Módulos que usam `CepService`: migrar para `usePostalCodeLookup`
- Módulos que usam `GeocodingService`: avaliar se precisam de `core/geocoding` ou `core/geospatial`

---

## Regras de Negócio

### 1. Separação de Responsabilidades
```
core/geocoding: CEP → Endereço → Coordenada
                Endereço → Coordenada
                Coordenada → Endereço
                
core/geospatial: Coordenada → Território (containment)
                 Boundaries, polígonos, operações espaciais
                 
core/address: Entidade de domínio "Endereço Postal"
              Persistência, validação, lifecycle
```

### 2. Ordem de Fallback
```
1. Provider configurado como default
2. Providers na lista de fallback (em ordem)
3. Erro "NO_RESULTS" se nenhum provider retornar dados
```

### 3. Cache
- Cache em memória no service (TTL configurável)
- Cache opcional no hook React
- Cache por provider individual

### 4. Validação
- CEP: 8 dígitos, formato brasileiro
- Coordenadas: -90 a 90 (lat), -180 a 180 (lng)
- Endereço: sanitização básica

---

## Testes (Pendente)

**Cobertura planejada**:
- ✅ GeocodingService (orquestração, fallback, cache)
- ✅ ViaCepProvider (busca por CEP, validação)
- ✅ NominatimProvider (geocoding, reverse geocoding)
- ✅ useGeocoding hook (estados, cache, erro)

**Integração**:
- ❌ Integração com `core/geospatial`
- ❌ Migração de consumidores legados
- ❌ Performance em produção

---

## Próximos Passos (ETAPA 3)

1. **Refatorar consumidores legados**
   - Migrar `CepService` calls para `core/geocoding`
   - Refatorar `GeocodingService` para usar novo SSOT

2. **Integrar com `core/geospatial`**
   - Adicionar resolução territorial automática
   - Unificar fluxo: CEP → Endereço → Coordenada → Território

3. **Adicionar novos providers**
   - Google Maps Geocoding API
   - Mapbox Geocoding
   - IBGE APIs

4. **Monitoramento e métricas**
   - Dashboard de uso
   - Alertas de rate limiting
   - Logs estruturados

---

**Versão**: 1.0.0  
**Status**: ✅ ESTRUTURA SSOT COMPLETA  
**Próximo**: Migração de consumidores legados