# FUNDAÇÃO GEOGRÁFICA - REGRAS DE DEPENDÊNCIA

**Status**: ✅ ATIVO  
**Data**: 2026-03-24  
**Versão**: 1.0.0

> Este documento define as regras de dependência entre os módulos da fundação geográfica.

---

## 🔄 FLUXO DE DEPENDÊNCIAS

```
core/location
    ↓ depende de
shared/* (types, utils)

core/coverage
    ↓ depende de
core/location + shared/*

core/rollout
    ↓ depende de
core/location + shared/*

integrations/maps
    ↓ depende de
shared/* (types, utils)
```

---

## 📦 REGRAS POR MÓDULO

### `core/location`

#### ✅ PODE IMPORTAR
```typescript
import { slugify } from '@/shared/utils';
import { validateUUID } from '@/shared/utils';
import type { UUID } from '@/shared/types';
```

#### ❌ NÃO PODE IMPORTAR
```typescript
// ❌ Outros módulos de core
import { CoverageService } from '@/core/coverage';
import { RolloutService } from '@/core/rollout';
import { AuthService } from '@/core/auth';

// ❌ Integrations
import { mapsClient } from '@/integrations/maps';
import { supabase } from '@/integrations/supabase';

// ❌ Modules
import { BusinessService } from '@/modules/business';
```

#### Justificativa
`core/location` é a base da fundação geográfica. Não pode depender de nada além de `shared`.

---

### `core/coverage`

#### ✅ PODE IMPORTAR
```typescript
// Core
import { LocationService } from '@/core/location';
import type { LocationId, Location } from '@/core/location';

// Shared
import { validateUUID } from '@/shared/utils';
import type { UUID } from '@/shared/types';
```

#### ❌ NÃO PODE IMPORTAR
```typescript
// ❌ Outros módulos de core (exceto location)
import { RolloutService } from '@/core/rollout';
import { AuthService } from '@/core/auth';

// ❌ Integrations
import { mapsClient } from '@/integrations/maps';
import { supabase } from '@/integrations/supabase';

// ❌ Modules
import { BusinessService } from '@/modules/business';
import { MobilityService } from '@/modules/mobility';
```

#### Justificativa
`core/coverage` precisa de `location` para validar localizações, mas não precisa de `rollout` nem de integrações externas.

---

### `core/rollout`

#### ✅ PODE IMPORTAR
```typescript
// Core
import { LocationService } from '@/core/location';
import type { LocationId, Location } from '@/core/location';

// Shared
import { validateString } from '@/shared/utils';
import type { UUID } from '@/shared/types';
```

#### ❌ NÃO PODE IMPORTAR
```typescript
// ❌ Outros módulos de core (exceto location)
import { CoverageService } from '@/core/coverage';
import { AuthService } from '@/core/auth';

// ❌ Integrations
import { mapsClient } from '@/integrations/maps';
import { supabase } from '@/integrations/supabase';

// ❌ Modules
import { BusinessService } from '@/modules/business';
import { MobilityService } from '@/modules/mobility';
```

#### Justificativa
`core/rollout` precisa de `location` para herança de ativação, mas não precisa de `coverage` nem de integrações externas.

---

### `integrations/maps`

#### ✅ PODE IMPORTAR
```typescript
// Shared
import { formatCoordinates } from '@/shared/utils';
import { validateNumber } from '@/shared/utils';
import type { UUID } from '@/shared/types';
```

#### ❌ NÃO PODE IMPORTAR
```typescript
// ❌ Core
import { LocationService } from '@/core/location';
import { CoverageService } from '@/core/coverage';
import { RolloutService } from '@/core/rollout';

// ❌ Outras integrations
import { supabase } from '@/integrations/supabase';

// ❌ Modules
import { BusinessService } from '@/modules/business';
```

#### Justificativa
`integrations/maps` é uma camada de infraestrutura pura. Não pode depender de lógica de negócio.

---

## 🚫 REGRAS PARA MÓDULOS DE DOMÍNIO

### `modules/*` (business, mobility, services, etc)

#### ✅ PODE IMPORTAR
```typescript
// Core - fundação geográfica
import { LocationService } from '@/core/location';
import { CoverageService } from '@/core/coverage';
import { RolloutService } from '@/core/rollout';

// Integrations
import { GeocodingService } from '@/integrations/maps';
import { DistanceService } from '@/integrations/maps';

// Shared
import { formatDate } from '@/shared/utils';
import type { UUID } from '@/shared/types';

// Types
import type { LocationId, Location } from '@/core/location';
import type { Coordinates, Address } from '@/integrations/maps';
```

#### ❌ NÃO PODE IMPORTAR
```typescript
// ❌ Outros módulos
import { BusinessService } from '@/modules/business';  // Em modules/mobility
import { MobilityService } from '@/modules/mobility';  // Em modules/business

// ❌ Acesso direto a clientes de integração
import { mapsClient } from '@/integrations/maps/client';
import { supabase } from '@/integrations/supabase/client';
```

#### ❌ NÃO PODE FAZER

##### 1. Manipular Hierarquia Geográfica
```typescript
// ❌ ERRADO
await supabase.from('locations').insert({ name: 'Nova Cidade' });

// ✅ CORRETO
// Apenas core/location pode criar/modificar localizações
```

##### 2. Definir Cobertura Inline
```typescript
// ❌ ERRADO
const isCovered = lat > -24 && lat < -23;

// ✅ CORRETO
const isCovered = await CoverageService.doesCover(entityId, locationId);
```

##### 3. Controlar Rollout Inline
```typescript
// ❌ ERRADO
const isActive = process.env.VITE_MOBILITY_ENABLED === 'true';

// ✅ CORRETO
const isActive = await RolloutService.isModuleActive('mobility', locationId);
```

##### 4. Implementar Cálculos Geoespaciais
```typescript
// ❌ ERRADO
const distance = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));

// ✅ CORRETO
const distance = DistanceService.calculateDistance(point1, point2);
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Para `core/location`
- [ ] Importa apenas de `shared`
- [ ] Não importa de `core/coverage`
- [ ] Não importa de `core/rollout`
- [ ] Não importa de `integrations/maps`
- [ ] Não importa de `modules/*`

### Para `core/coverage`
- [ ] Importa de `core/location`
- [ ] Importa de `shared`
- [ ] Não importa de `core/rollout`
- [ ] Não importa de `integrations/maps`
- [ ] Não importa de `modules/*`

### Para `core/rollout`
- [ ] Importa de `core/location`
- [ ] Importa de `shared`
- [ ] Não importa de `core/coverage`
- [ ] Não importa de `integrations/maps`
- [ ] Não importa de `modules/*`

### Para `integrations/maps`
- [ ] Importa apenas de `shared`
- [ ] Não importa de `core/*`
- [ ] Não importa de `modules/*`

### Para `modules/*`
- [ ] Importa de `core/location`, `core/coverage`, `core/rollout`
- [ ] Importa de `integrations/maps` (services públicos)
- [ ] Importa de `shared`
- [ ] Não importa de outros `modules/*`
- [ ] Não acessa clientes de integração diretamente

---

## 🔍 VALIDAÇÃO AUTOMÁTICA

### ESLint Rules (Futuro)

```javascript
// eslint.config.js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        // core/location não pode importar outros core
        {
          group: ['@/core/coverage', '@/core/rollout'],
          message: 'core/location cannot import other core modules'
        },
        // core/coverage não pode importar rollout
        {
          group: ['@/core/rollout'],
          message: 'core/coverage cannot import core/rollout'
        },
        // integrations/maps não pode importar core
        {
          group: ['@/core/*'],
          message: 'integrations/maps cannot import core modules'
        },
        // modules não podem importar outros modules
        {
          group: ['@/modules/*/*'],
          message: 'Cross-module imports are not allowed'
        }
      ]
    }]
  }
}
```

---

## 📚 REFERÊNCIAS

- [GEOGRAPHIC_FOUNDATION.md](./GEOGRAPHIC_FOUNDATION.md) - Documento principal
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura geral
- [CURRENT_RULES.md](./CURRENT_RULES.md) - Regras vigentes

---

**Versão**: 1.0.0  
**Status**: ✅ ATIVO  
**Última Atualização**: 2026-03-24

