# Location Module

SSOT (Single Source of Truth) territorial do produto. Gerencia a hierarquia geográfica canônica e contexto de localização da aplicação.

## Responsabilidades

- Entidade `Location` (country → state → city → district)
- Hierarquia geográfica: `location_id`, `parent_id`, `type`, `slug`
- Caminho geográfico: `geographic_path` (padrão: `/br/ba/salvador/pituba`)
- Resolução por ID, path, slug
- Navegação de árvore: ancestors, descendants, children
- Contexto geográfico do app
- Validação de localização ativa
- Integridade da árvore geográfica

## Padrão `geographic_path`

```
/{country_code}/{state_code}/{city_slug}/{district_slug}
```

Exemplos:
- `/br` - País: Brasil
- `/br/ba` - Estado: Bahia
- `/br/ba/salvador` - Cidade: Salvador
- `/br/ba/salvador/pituba` - Bairro: Pituba

## Dependências

```typescript
// ✅ Pode usar
import { slugify } from '@/shared/utils';
import type { UUID } from '@/shared/types';

// ❌ NÃO pode usar
import { CoverageService } from '@/core/coverage';
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
