# Rollout Module

Sistema transversal que controla a ativação de módulos do produto por localização geográfica.

## Responsabilidades

- Entidade `ModuleRollout` (module_key + location_id)
- Ativação de módulo por localização
- Herança de ativação: filho herda do pai se não tiver override
- Override local: localização específica pode sobrescrever herança
- Default false: módulo desativado por padrão
- Config opcional: metadados de configuração por módulo/localização

## Dependências

```typescript
// ✅ Pode usar
import { LocationService } from '@/core/location';
import type { LocationId } from '@/core/location';

// ❌ NÃO pode usar
import { CoverageService } from '@/core/coverage';
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
