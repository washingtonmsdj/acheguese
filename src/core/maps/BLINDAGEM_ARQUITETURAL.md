# Blindagem Arquitetural - Sistema de Mapas

## Regras de Importação Obrigatórias

### ❌ PROIBIDO

#### 1. Importar Providers Diretamente

```typescript
// ❌ ERRADO
import { osmTileProvider } from '@/integrations/maps/providers/OSMTileProvider';
import { nominatimGeocodingProvider } from '@/integrations/maps/providers/NominatimGeocodingProvider';

// ✅ CORRETO
import { providerRegistry } from '@/core/maps';
const tileProvider = providerRegistry.getTileProvider();
const geocodingProvider = providerRegistry.getGeocodingProvider();
```

#### 2. Usar Supabase Diretamente em Componentes de Mapa

```typescript
// ❌ ERRADO - em componente de mapa
import { supabase } from '@/integrations/supabase/client';
const { data } = await supabase.from('businesses').select('*');

// ✅ CORRETO - usar service
import { businessService } from '@/core/business';
const businesses = await businessService.getAll();
```

#### 3. Projetar Entidades Manualmente

```typescript
// ❌ ERRADO
function MyComponent({ business }) {
  const marker = {
    id: business.id,
    type: 'business',
    coordinates: {
      latitude: business.latitude,
      longitude: business.longitude,
    },
    title: business.name,
  };
  
  return <MapMarker marker={marker} />;
}

// ✅ CORRETO
import { mapEntityProjection } from '@/core/maps';

function MyComponent({ business }) {
  const marker = mapEntityProjection.projectBusiness(business);
  if (!marker) return null;
  
  return <MapMarker marker={marker} />;
}
```

#### 4. Duplicar Lógica de Transformação

```typescript
// ❌ ERRADO
function businessToMarker(business) {
  return {
    id: business.id,
    coordinates: { lat: business.latitude, lng: business.longitude },
    // ...
  };
}

// ✅ CORRETO
import { mapEntityProjection } from '@/core/maps';
const marker = mapEntityProjection.projectBusiness(business);
```

#### 5. Importar de integrations/maps em Módulos

```typescript
// ❌ ERRADO - em src/modules/business/
import { nominatimGeocodingProvider } from '@/integrations/maps';

// ✅ CORRETO
import { providerRegistry } from '@/core/maps';
const provider = providerRegistry.getGeocodingProvider();
```

#### 6. Importar de modules em integrations

```typescript
// ❌ ERRADO - em src/integrations/maps/
import { BusinessCard } from '@/modules/business';

// ✅ CORRETO
// integrations não deve importar de modules
// Mantenha separação de camadas
```

### ✅ PERMITIDO

#### 1. Importar de @/core/maps em Módulos

```typescript
// ✅ CORRETO
import {
  mapLayerRegistry,
  mapEntityProjection,
  mapViewportService,
  providerRegistry,
} from '@/core/maps';
```

#### 2. Importar de @/core/maps em integrations/maps

```typescript
// ✅ CORRETO - em src/integrations/maps/providers/
import type { GeocodingProvider } from '@/core/maps/types';
```

#### 3. Importar de @/core/location em core/maps

```typescript
// ✅ CORRETO
import { useActiveTerritory } from '@/core/location';
```

## Validação

### ESLint Rules

As regras estão definidas em `.eslintrc-maps-rules.json`.

Para aplicar:

```json
// eslint.config.js
import mapsRules from './.eslintrc-maps-rules.json';

export default [
  // ... outras configs
  mapsRules,
];
```

### CI/CD Check

```bash
# Validar imports
npm run lint

# Deve falhar se houver violações
```

## Exemplos de Violações

### Violação 1: Import Direto de Provider

```typescript
// src/modules/map/components/MapSearch.tsx
import { nominatimGeocodingProvider } from '@/integrations/maps'; // ❌ ERRO

// ESLint error:
// ❌ PROIBIDO: Não importe providers diretamente. Use providerRegistry de @/core/maps
```

### Violação 2: Supabase em Componente

```typescript
// src/modules/map/components/MapMarkers.tsx
import { supabase } from '@/integrations/supabase/client'; // ❌ ERRO

async function loadMarkers() {
  const { data } = await supabase.from('businesses').select('*'); // ❌ ERRO
}

// ESLint error:
// ❌ PROIBIDO: Não use Supabase diretamente em componentes de mapa. Use services de @/core/maps
```

### Violação 3: Projeção Manual

```typescript
// src/modules/business/components/BusinessMap.tsx
function BusinessMap({ business }) {
  // ❌ ERRO: Projeção manual
  const marker = {
    id: business.id,
    coordinates: {
      latitude: business.latitude,
      longitude: business.longitude,
    },
  };
  
  return <MapMarker marker={marker} />;
}

// Correção:
import { mapEntityProjection } from '@/core/maps';

function BusinessMap({ business }) {
  const marker = mapEntityProjection.projectBusiness(business);
  if (!marker) return null;
  
  return <MapMarker marker={marker} />;
}
```

## Enforcement

### 1. Pre-commit Hook

```bash
# .husky/pre-commit
npm run lint
```

### 2. CI Pipeline

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: npm run lint
  
- name: Check Map Architecture
  run: npm run lint -- --rule 'no-restricted-imports'
```

### 3. Code Review Checklist

- [ ] Nenhum import direto de providers
- [ ] Nenhum uso direto de Supabase em componentes de mapa
- [ ] Nenhuma projeção manual de entidades
- [ ] Nenhuma duplicação de lógica de transformação
- [ ] Imports seguem hierarquia de camadas

## Exceções

### Única Exceção Permitida

**Arquivo**: `src/integrations/maps/setup.ts`

**Motivo**: Precisa importar providers para registrar

```typescript
// ✅ PERMITIDO apenas em setup.ts
import { osmTileProvider } from './providers/OSMTileProvider';
import { nominatimGeocodingProvider } from './providers/NominatimGeocodingProvider';
import { mockRoutingProvider } from './providers/MockRoutingProvider';

export function setupDefaultProviders() {
  providerRegistry.registerTileProvider('osm', osmTileProvider);
  // ...
}
```

## Consequências de Violação

### Desenvolvimento

- ❌ ESLint error
- ❌ Pre-commit hook falha
- ❌ CI pipeline falha
- ❌ Code review rejeitado

### Produção

- 🔴 Acoplamento a provider específico
- 🔴 Duplicação de lógica
- 🔴 Bugs difíceis de rastrear
- 🔴 Refactor custoso
- 🔴 Testes frágeis

## Monitoramento

### Métricas

1. **Violações por Sprint**
   - Meta: 0
   - Alerta: >0

2. **Imports Diretos de Providers**
   - Meta: 0 (exceto setup.ts)
   - Alerta: >0

3. **Projeções Manuais**
   - Meta: 0
   - Alerta: >0

### Auditoria Periódica

```bash
# Buscar violações potenciais
grep -r "from '@/integrations/maps/providers" src/modules/
grep -r "from '@/integrations/supabase/client'" src/modules/map/
grep -r "latitude.*longitude.*coordinates" src/modules/ | grep -v "mapEntityProjection"
```

## Educação do Time

### Onboarding

1. Ler este documento
2. Revisar exemplos de violações
3. Praticar correções
4. Code review com mentor

### Documentação

- README.md principal
- ARCHITECTURE.md
- Este documento (BLINDAGEM_ARQUITETURAL.md)

### Treinamento

- Workshop de arquitetura
- Pair programming
- Code review rigoroso

## Status

- [x] Regras definidas
- [x] Documentação criada
- [ ] ESLint configurado (próximo passo)
- [ ] Pre-commit hook configurado
- [ ] CI pipeline configurado
- [ ] Time treinado

## Próximos Passos

1. Integrar regras no eslint.config.js
2. Configurar pre-commit hook
3. Adicionar check no CI
4. Treinar time
5. Monitorar violações
