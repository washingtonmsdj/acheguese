# ETAPA 2 + MIGRAÇÃO PARCIAL - RELATÓRIO ATUALIZADO
## CRIAR `core/geocoding` UNIFICADO + MIGRAÇÃO DE CONSUMIDORES

**Data**: 2026-04-06  
**Status**: ✅ IMPLEMENTADA COM CORREÇÕES  
**Tempo**: ~3 horas

---

## CORREÇÕES APLICADAS (conforme solicitado)

### 1. ✅ Narrativa Ajustada
- `core/geocoding` foi criado como SSOT
- Compatibilidade foi preservada
- **Migração dos consumidores reais ainda está pendente** (parcialmente feita)

### 2. ✅ Fallback por Capacidade (não genérico cego)
Implementado fallback explícito por operação:

```typescript
// CEP lookup: ViaCEP (primário) → Nominatim (secundário)
const providers = this.getProvidersForCapability('postal_code_lookup');
// ViaCEP tem priority: 1, Nominatim tem priority: 2

// Address geocoding: Nominatim (único com essa capacidade)
const providers = this.getProvidersForCapability('address_geocoding');

// Reverse geocoding: Nominatim (único com essa capacidade)
const providers = this.getProvidersForCapability('reverse_geocoding');
```

Cada operação usa apenas providers com a capacidade correspondente.

### 3. ✅ Serviços Legados Marcados como Transição
- `CepService`: marcado como `DEPRECATED` com warnings
- `GeocodingService` (maps): refatorado para emitir warnings e redirecionar
- Barrel export de `core/address` documenta depreciação

### 4. ✅ Migração Real de Consumidores
**Migrados**:
- `src/core/address/hooks/useResidentAddress.ts` → usa `geocodingService.lookupPostalCode()`
- `src/core/address/services/ResidentAddressService.ts` → usa `geocodingService.lookupPostalCode()`
- `src/core/location/hooks/useGeolocation.ts` → usa `geocodingService.reverseGeocode()`

**Pendentes** (usam boundaries, serão movidos para `core/geospatial`):
- `src/modules/business/hooks/useNeighborhoodBounds.ts`
- `src/core/maps/hooks/useTerritoryPolygon.ts`
- `src/core/maps/hooks/useCityNeighborhoodsPolygons.ts`

---

## EVIDÊNCIA OBJETIVA

### 1. TypeScript Check
```
src/core/address/hooks/useResidentAddress.ts: No diagnostics found
src/core/address/services/ResidentAddressService.ts: No diagnostics found
src/core/location/hooks/useGeolocation.ts: No diagnostics found
src/core/geocoding/services/GeocodingService.ts: No diagnostics found
```

### 2. Consumidores Migrados
| Arquivo | Método Antigo | Método Novo | Status |
|---------|---------------|-------------|--------|
| `useResidentAddress.ts` | `CepService.lookup()` | `geocodingService.lookupPostalCode()` | ✅ MIGRADO |
| `ResidentAddressService.ts` | `CepService.lookup()` | `geocodingService.lookupPostalCode()` | ✅ MIGRADO |
| `useGeolocation.ts` | `GeocodingService.reverseGeocode()` | `geocodingService.reverseGeocode()` | ✅ MIGRADO |

### 3. Consumidores Legados Restantes
| Arquivo | Método | Status | Ação |
|---------|--------|--------|------|
| `useNeighborhoodBounds.ts` | `getNeighborhoodBounds()` | ⚠️ PENDENTE | Mover para `core/geospatial` |
| `useTerritoryPolygon.ts` | `getNeighborhoodBounds()`, `getCityBounds()` | ⚠️ PENDENTE | Mover para `core/geospatial` |
| `useCityNeighborhoodsPolygons.ts` | `getNeighborhoodBounds()` | ⚠️ PENDENTE | Mover para `core/geospatial` |

### 4. SSOT Paralelo Detectado
- `src/core/geospatial/services/GeocodingService.ts` - **DUPLICADO**
- Este é um service de geocoding paralelo ao novo `core/geocoding`
- **Ação necessária**: Remover ou refatorar para usar `core/geocoding`

---

## ARQUIVOS CRIADOS

### Estrutura do Módulo (`src/core/geocoding/`)
```
types/index.ts                    # Tipos SSOT completos
providers/BaseGeocodingProvider.ts # Classe base
providers/ViaCepProvider.ts       # Provider ViaCEP
providers/NominatimProvider.ts    # Provider Nominatim
services/GeocodingService.ts      # Serviço orquestrador (fallback por capacidade)
hooks/useGeocoding.ts            # Hooks React
instance.ts                      # Singleton
index.ts                         # Barrel exports
README.md                        # Documentação
MIGRATION_GUIDE.md               # Guia de migração
examples/BasicUsage.tsx          # Exemplos
```

---

## ARQUIVOS ALTERADOS

1. `src/core/address/hooks/useResidentAddress.ts`
   - Migrado de `CepService` para `geocodingService`
   - Tipos atualizados para `PostalCodeLookupResult`

2. `src/core/address/services/ResidentAddressService.ts`
   - Migrado de `CepService` para `geocodingService`
   - Método `lookupCep()` marcado como deprecated

3. `src/core/location/hooks/useGeolocation.ts`
   - Migrado de `GeocodingService.reverseGeocode()` para `geocodingService.reverseGeocode()`

4. `src/core/address/index.ts`
   - `CepService` marcado como deprecated no barrel export

5. `src/core/address/services/CepService.ts`
   - Marcado como `DEPRECATED`
   - Adicionado `lookupWithMigration()` para compatibilidade

6. `src/core/maps/services/GeocodingService.ts`
   - Refatorado para emitir warnings
   - Redireciona para novo SSOT quando disponível

---

## PENDÊNCIAS REAIS

### 1. SSOT Paralelo em `core/geospatial`
- `src/core/geospatial/services/GeocodingService.ts` é duplicado
- **Ação**: Remover ou refatorar para usar `core/geocoding`

### 2. Boundaries/Polígonos
- `getNeighborhoodBounds()`, `getCityBounds()` ainda em `GeocodingService` legado
- **Ação**: Mover para `core/geospatial` na ETAPA 3

### 3. Testes Automatizados
- Unit tests para providers
- Integration tests para service
- E2E tests para hooks

---

## PRÓXIMOS PASSOS (ETAPA 3)

1. **Remover SSOT paralelo** em `core/geospatial/services/GeocodingService.ts`
2. **Mover boundaries** para `core/geospatial`
3. **Implementar `core/tracking`** conforme planejado
4. **Testes automatizados** para validar migração

---

**Status**: ✅ ETAPA 2 CONCLUÍDA COM CORREÇÕES  
**Migração parcial**: 3 consumidores migrados, 3 pendentes (boundaries)  
**Próximo**: ETAPA 3 - `core/tracking` + resolver SSOT paralelo