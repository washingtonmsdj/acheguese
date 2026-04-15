# Coverage Module

Sistema transversal que gerencia áreas de cobertura/atuação de entidades do produto (businesses, services, professionals).

## Responsabilidades

- Entidade `ServiceArea` (cobertura de uma entidade)
- Cobertura por district: entidade cobre district específico
- Cobertura por city: entidade cobre cidade inteira
- Cobertura por radius: entidade cobre raio a partir de ponto
- Verificar se entidade cobre uma localização
- Listar entidades que cobrem localização
- Área primária de cobertura

## Dependências

```typescript
// ✅ Pode usar
import { LocationService } from '@/core/location';
import type { LocationId } from '@/core/location';

// ❌ NÃO pode usar
import { RolloutService } from '@/core/rollout';
import { mapsClient } from '@/integrations/maps';
```

## Status

**Etapa 1**: ✅ Estrutura aprovada e congelada  
**Etapa 2**: 🔜 Contratos públicos (próxima)  
**Etapa 3**: ⏳ Schema de dados  
**Etapa 4**: ⏳ Migrations  
**Etapa 5**: ⏳ Implementação  

## Referências

- [GEOGRAPHIC_FOUNDATION.md](../../../docs/GEOGRAPHIC_FOUNDATION.md)
