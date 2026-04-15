# Maps Integration

Camada de integração com serviços geoespaciais externos (Google Maps, OpenStreetMap, etc).

## Responsabilidades

- Geocoding: endereço → coordenadas
- Reverse geocoding: coordenadas → endereço
- GPS do browser: `getCurrentPosition()`, `watchPosition()`
- Cálculos geoespaciais: distância, raio, bounding box
- Renderização de mapas
- Tipos: `Coordinates`, `Address`, `GeocodingResult`

## Dependências

```typescript
// ✅ Pode usar
import { formatCoordinates } from '@/shared/utils';
import type { UUID } from '@/shared/types';

// ❌ NÃO pode usar
import { LocationService } from '@/core/location';
import { CoverageService } from '@/core/coverage';
import { RolloutService } from '@/core/rollout';
```

## Status

**Etapa 1**: ✅ Estrutura aprovada e congelada  
**Etapa 2**: 🔜 Contratos públicos (próxima)  
**Etapa 3**: ⏳ Schema de dados (N/A - sem banco)  
**Etapa 4**: ⏳ Migrations (N/A - sem banco)  
**Etapa 5**: ⏳ Implementação  

## Referências

- [GEOGRAPHIC_FOUNDATION.md](../../../docs/GEOGRAPHIC_FOUNDATION.md)
