# Guia de Migração - Core Geocoding

**Data**: 2026-04-06  
**Status**: ETAPA 2 IMPLEMENTADA

---

## Visão Geral

O novo módulo `core/geocoding` consolida funcionalidades que estavam espalhadas entre:
- `core/address/services/CepService.ts` (busca por CEP)
- `core/maps/services/GeocodingService.ts` (geocoding e boundaries)
- `core/geospatial` (algumas operações)

Este guia documenta como migrar consumidores existentes para o novo SSOT.

---

## Consumidores Identificados

### 1. `core/address` Module

#### Arquivos afetados:
- `src/core/address/hooks/useResidentAddress.ts`
- `src/core/address/services/ResidentAddressService.ts`

#### Métodos usados:
- `CepService.lookup()` → `geocodingService.lookupPostalCode()`
- `CepService.isValid()` → Validação interna do service
- `CepService.formatCep()` → `geocodingService` formata automaticamente

#### Exemplo de migração:

**Antes**:
```typescript
import { CepService } from '@/core/address/services/CepService';

const cepData = await CepService.lookup(cep);
const formattedCep = CepService.formatCep(cep);
const isValid = CepService.isValid(cep);
```

**Depois**:
```typescript
import { geocodingService } from '@/core/geocoding';
// ou
import { usePostalCodeLookup } from '@/core/geocoding';

// Via service
const result = await geocodingService.lookupPostalCode({
  postalCode: cep,
});
// result.postalCode já vem formatado

// Via hook React
const { lookupPostalCode, data } = usePostalCodeLookup();
```

### 2. `core/maps` Module

#### Arquivos afetados:
- `src/core/maps/hooks/useCityNeighborhoodsPolygons.ts`
- `src/core/maps/hooks/useTerritoryPolygon.ts`

#### Métodos usados:
- `GeocodingService.getNeighborhoodBounds()` → Será movido para `core/geospatial`
- `GeocodingService.getCityBounds()` → Será movido para `core/geospatial`

**Nota**: Estes métodos lidam com boundaries/polígonos, que são responsabilidade de `core/geospatial`. A migração será feita na ETAPA 3.

### 3. `modules/business` Module

#### Arquivos afetados:
- `src/modules/business/hooks/useNeighborhoodBounds.ts`

#### Métodos usados:
- `GeocodingService.getNeighborhoodBounds()` → `core/geospatial` (futuro)
- `GeocodingService.getBoundsByPostalCode()` → `geocodingService.lookupPostalCode()`

### 4. `core/location` Module

#### Arquivos afetados:
- `src/core/location/hooks/useGeolocation.ts`

#### Métodos usados:
- `GeocodingService.reverseGeocode()` → `geocodingService.reverseGeocode()`

#### Exemplo de migração:

**Antes**:
```typescript
import { GeocodingService } from '@/core/maps/services/GeocodingService';

const address = await GeocodingService.reverseGeocode(latitude, longitude);
const districtName = address.suburb;
```

**Depois**:
```typescript
import { geocodingService } from '@/core/geocoding';

const result = await geocodingService.reverseGeocode({
  latitude,
  longitude,
  detailLevel: 'suburb',
});

const districtName = result?.address.addressComponents.neighborhood;
```

### 5. `core/geospatial` Module

#### Arquivos afetados:
- `src/core/geospatial/hooks/useGeocoding.ts`

**Nota**: Este hook já usa a nova interface. É um exemplo de implementação correta.

---

## Passo a Passo da Migração

### Passo 1: Identificar imports
```typescript
// Buscar por:
import { CepService } from '@/core/address/services/CepService';
import { GeocodingService } from '@/core/maps/services/GeocodingService';
```

### Passo 2: Classificar uso

#### Categoria A: Busca por CEP
- Substituir `CepService.lookup()` por `geocodingService.lookupPostalCode()`
- Remover `CepService.isValid()` e `CepService.formatCep()` (service faz automaticamente)

#### Categoria B: Geocoding/Reverse Geocoding
- Substituir `GeocodingService.reverseGeocode()` por `geocodingService.reverseGeocode()`
- Ajustar formato do retorno (novo tipo tem mais dados)

#### Categoria C: Boundaries/Polígonos
- Manter uso atual por enquanto
- Será migrado para `core/geospatial` na ETAPA 3
- Adicionar comentário `// TODO: Migrate to core/geospatial`

### Passo 3: Atualizar imports
```typescript
// Antes
import { CepService } from '@/core/address/services/CepService';
import { GeocodingService } from '@/core/maps/services/GeocodingService';

// Depois
import { geocodingService } from '@/core/geocoding';
// ou para hooks React
import { usePostalCodeLookup, useReverseGeocoding } from '@/core/geocoding';
```

### Passo 4: Atualizar chamadas

#### Exemplo completo:
```typescript
// ANTES
const cepData = await CepService.lookup(cep);
if (cepData) {
  const formattedCep = CepService.formatCep(cep);
  const street = cepData.logradouro;
  const neighborhood = cepData.bairro;
}

// DEPOIS
const result = await geocodingService.lookupPostalCode({
  postalCode: cep,
});
if (result) {
  const formattedCep = result.postalCode; // Já formatado
  const street = result.street;
  const neighborhood = result.neighborhood;
}
```

---

## Compatibilidade

### 1. Backward Compatibility
- `CepService.lookupWithMigration()` fornece compatibilidade
- `GeocodingService` mantém interface com warnings
- Fallback para implementação legada se novo SSOT falhar

### 2. Warnings no Console
- Todos os métodos deprecated emitem warnings
- Incluem instruções de migração
- Podem ser desabilitados em produção

### 3. Timeline de Remoção
- **ETAPA 2 (agora)**: Implementação do novo SSOT + warnings
- **ETAPA 3 (próxima)**: Migração de boundaries para `core/geospatial`
- **ETAPA 4 (futuro)**: Remoção completa dos serviços legados

---

## Testes de Migração

### 1. Testar busca por CEP
```typescript
// Teste básico
const result = await geocodingService.lookupPostalCode({
  postalCode: '40000-000',
});
console.assert(result?.city === 'Salvador');
```

### 2. Testar reverse geocoding
```typescript
const result = await geocodingService.reverseGeocode({
  latitude: -12.975,
  longitude: -38.476,
});
console.assert(result?.address.addressComponents.city === 'Salvador');
```

### 3. Testar geocoding direto
```typescript
const results = await geocodingService.geocode({
  query: 'Avenida Paulista, 1000',
  city: 'São Paulo',
  state: 'SP',
});
console.assert(results.length > 0);
```

---

## Problemas Conhecidos

### 1. Dependencia Circular
- `core/geocoding` nao deve importar `core/address` ou `core/maps`.
- Integracoes devem consumir o contrato canonico diretamente, sem adaptadores antigos.

### 2. Coordenadas Opcionais
- ViaCEP nao fornece coordenadas.
- `PostalCodeLookupResult.coordinates` e opcional.
- Consumidores devem tratar `undefined`.

---

## Suporte

### 1. Logs de Migração
```bash
# Verificar warnings
grep -r "DEPRECATED\|deprecated" src/ --include="*.ts" --include="*.tsx"
```

### 2. Métricas
```typescript
import { getGeocodingMetrics } from '@/core/geocoding';
console.log('Geocoding metrics:', getGeocodingMetrics());
```

### 3. Status
```typescript
import { isGeocodingAvailable, getGeocodingStatus } from '@/core/geocoding';
console.log('Available:', isGeocodingAvailable());
console.log('Status:', getGeocodingStatus());
```

---

## Próximos Passos

1. **Migrar `useResidentAddress.ts`** (prioridade alta)
2. **Migrar `ResidentAddressService.ts`** (prioridade alta)
3. **Migrar `useGeolocation.ts`** (prioridade média)
4. **Planejar migração de boundaries** para `core/geospatial` (ETAPA 3)
5. **Remover serviços legados** após migração completa (ETAPA 4)

---

**Documentação**: `src/core/geocoding/README.md`  
**Código**: `src/core/geocoding/`  
**Exemplos**: Ver `src/core/geocoding/hooks/useGeocoding.ts`