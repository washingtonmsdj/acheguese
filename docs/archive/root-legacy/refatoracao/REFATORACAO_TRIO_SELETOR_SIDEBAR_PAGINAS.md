# Refatoração: Seletor + Sidebar + Páginas

## 🎯 Objetivo
Deixar o trio (TerritorySelectorV2, AppSidebar, Páginas) em perfeita sincronia, sem hardcoded, código limpo, robusto e profissional.

---

## 📊 Análise Atual

### ✅ O que JÁ está BEM:

#### 1. Navigation Config (SSOT)
**Arquivo**: `src/app/components/navigation/navigation.config.ts`
- ✅ Configuração centralizada de navegação
- ✅ Usa `LAUNCH_URLS` do `territory.ts`
- ✅ Seções organizadas (Explorar, Comunidade, Ferramentas)
- ✅ Sem hardcoded de URLs

#### 2. AppSidebar
**Arquivo**: `src/app/components/navigation/AppSidebar.tsx`
- ✅ Usa `useFriendlyModuleUrls()` para URLs dinâmicas
- ✅ Função `getDynamicHref()` mapeia IDs para URLs territoriais
- ✅ Botão "Início" dinâmico baseado em `lastTerritoryStore`
- ✅ Sem hardcoded de URLs

#### 3. TerritorySelectorV2
**Arquivo**: `src/core/location/components/TerritorySelectorV2.tsx`
- ✅ Usa `useFriendlyModuleUrls()` para navegação
- ✅ Detecta módulo da rota com `extractRouteContext()`
- ✅ Normaliza paths corretamente
- ✅ Sem hardcoded de URLs

---

## ❌ Problemas Identificados

### 1. CRÍTICO: Falta Inicialização do Modo Territorial

**Problema**: Quando usuário cadastrado acessa o site, `territoryMode` não é definido automaticamente.

**Impacto**: 
- Modo fica `null` mesmo para usuários cadastrados
- Comportamento inconsistente

**Onde**: Falta um `useEffect` que inicialize o modo

---

### 2. CRÍTICO: useTerritoryFilter não considera territoryMode

**Problema**: O hook que filtra conteúdo ignora o modo do usuário.

**Impacto**:
- Usuário em modo 'bairro' vê conteúdo de toda a cidade
- Modo não tem efeito real no conteúdo

**Onde**: `src/core/location/hooks/useTerritoryFilter.ts`

---

### 3. MÉDIO: Hardcoded em Páginas Legacy

**Arquivos com hardcoded**:
- `src/modules/gastronomy/pages/GastronomyDetailPage.tsx` - linha 76: `/gastronomia/ba/salvador`
- `src/modules/business/pages/BusinessStandalonePage.tsx` - linha 103: `/empresas/ba/salvador`
- `src/app/pages/EmpresasLandingPage.tsx` - linha 59: `/empresas/ba/salvador/pituba/`
- `src/app/pages/EmpresaDetailLandingPage.tsx` - múltiplos mocks com `/br/ba/salvador/pituba`

**Solução**: Substituir por `LAUNCH_URLS` ou `useFriendlyModuleUrls()`

---

### 4. BAIXO: Gastronomia não está em useFriendlyModuleUrls

**Problema**: AppSidebar tem um TODO para gastronomia

```typescript
case 'gastronomy':
  // TODO: Adicionar gastronomia no useFriendlyModuleUrls
  return item.href;
```

**Solução**: Adicionar `gastronomy` no hook

---

### 5. BAIXO: Falta validação de modo por tipo de usuário

**Problema**: Não há validação que impede visitantes de ter modo 'bairro'

**Onde**: `LocationContextStore.setTerritoryMode()`

---

## 🔧 Plano de Refatoração

### Fase 1: Inicialização do Modo (URGENTE)
- [ ] Criar hook `useTerritoryModeInitializer`
- [ ] Adicionar no layout principal
- [ ] Definir modo baseado em `hasHome` e localização

### Fase 2: Integração de Filtros (URGENTE)
- [ ] Modificar `useTerritoryFilter` para considerar `territoryMode`
- [ ] Se modo 'bairro' → forçar `homeDistrict.id`
- [ ] Se modo 'cidade' → permitir navegação por bairros

### Fase 3: Remover Hardcoded (IMPORTANTE)
- [ ] Substituir hardcoded em GastronomyDetailPage
- [ ] Substituir hardcoded em BusinessStandalonePage
- [ ] Substituir hardcoded em EmpresasLandingPage
- [ ] Substituir hardcoded em EmpresaDetailLandingPage

### Fase 4: Completar useFriendlyModuleUrls (IMPORTANTE)
- [ ] Adicionar `gastronomy` no hook
- [ ] Remover TODO do AppSidebar

### Fase 5: Validações (DESEJÁVEL)
- [ ] Adicionar validação de modo no store
- [ ] Adicionar testes unitários

---

## 📝 Código de Implementação

### 1. Hook de Inicialização do Modo

**Arquivo**: `src/core/location/hooks/useTerritoryModeInitializer.ts`

```typescript
// @ts-nocheck
/**
 * useTerritoryModeInitializer
 * 
 * Inicializa o modo territorial automaticamente quando:
 * - Usuário faz login
 * - Usuário carrega a página
 * - Localização ativa muda
 */

import { useEffect, useRef } from 'react';
import { useUserTerritory } from './useUserTerritory';
import { useActiveTerritory } from './useActiveTerritory';

export function useTerritoryModeInitializer() {
  const { hasHome, homeDistrict, homeCity, loading } = useUserTerritory();
  const { activeLocation, territoryMode, setTerritoryMode } = useActiveTerritory();
  const initializedRef = useRef(false);

  useEffect(() => {
    // Aguardar carregamento
    if (loading) return;

    // Visitante: modo null
    if (!hasHome) {
      if (territoryMode !== null) {
        setTerritoryMode(null);
      }
      return;
    }

    // Usuário cadastrado: inicializar modo apenas uma vez
    if (!initializedRef.current && territoryMode === null) {
      // Se está no próprio bairro, modo bairro
      if (homeDistrict && activeLocation?.id === homeDistrict.id) {
        setTerritoryMode('bairro');
      } else {
        // Caso contrário, modo cidade
        setTerritoryMode('cidade');
      }
      initializedRef.current = true;
    }
  }, [hasHome, homeDistrict, homeCity, activeLocation, territoryMode, setTerritoryMode, loading]);
}
```

---

### 2. Modificação em useTerritoryFilter

**Arquivo**: `src/core/location/hooks/useTerritoryFilter.ts`

```typescript
// Adicionar no início do hook:
import { useActiveTerritory } from './useActiveTerritory';
import { useUserTerritory } from './useUserTerritory';

export function useTerritoryFilter(
  routeResolved?: ResolvedTerritory | null,
  activeMemberIds?: string[],
): TerritoryFilter {
  const { activeTerritory } = useLocationContext();
  const { territoryMode } = useActiveTerritory(); // NOVO
  const { hasHome, homeDistrict, homeCity } = useUserTerritory(); // NOVO

  return useMemo((): TerritoryFilter => {
    // ✅ PRIORIDADE 1: Modo Bairro (usuário cadastrado)
    if (hasHome && territoryMode === 'bairro' && homeDistrict) {
      console.log('[useTerritoryFilter] MODO BAIRRO:', homeDistrict.name);
      return { scope: 'location', location_id: homeDistrict.id };
    }

    // ✅ PRIORIDADE 2: Modo Cidade (usuário cadastrado)
    if (hasHome && territoryMode === 'cidade') {
      // Se está em um bairro específico da cidade, usar o bairro
      if (routeResolved?.kind === 'location' && 
          homeCity && 
          routeResolved.location.parent_id === homeCity.id) {
        console.log('[useTerritoryFilter] MODO CIDADE - Bairro:', routeResolved.location.name);
        return { scope: 'location', location_id: routeResolved.location.id };
      }
      
      // Se está na cidade, mostrar toda a cidade
      if (homeCity) {
        console.log('[useTerritoryFilter] MODO CIDADE - Toda:', homeCity.name);
        return { scope: 'location', location_id: homeCity.id };
      }
    }

    // Resto da lógica existente (grupos, visitantes, etc.)
    // ...
  }, [routeResolved, activeTerritory, activeMemberIds, territoryMode, homeDistrict, homeCity, hasHome]);
}
```

---

### 3. Adicionar Gastronomia em useFriendlyModuleUrls

**Arquivo**: `src/core/routing/hooks/useFriendlyModuleUrls.ts`

```typescript
// Adicionar no retorno:
return {
  base,
  landing,
  territoryName,
  community,
  business,
  services,
  classifieds,
  events,
  jobs,
  gastronomy, // NOVO
  touristPoints,
};

// E na função buildFallbackUrls:
export function buildFallbackUrls(): FriendlyModuleUrls {
  return {
    // ...
    gastronomy: LAUNCH_URLS.gastronomy, // NOVO
    // ...
  };
}
```

**Arquivo**: `src/config/territory.ts` (já existe)
```typescript
export const LAUNCH_URLS = {
  // ...
  gastronomy: `/gastronomia/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  // ...
} as const;
```

---

### 4. Remover Hardcoded em GastronomyDetailPage

**Arquivo**: `src/modules/gastronomy/pages/GastronomyDetailPage.tsx`

```typescript
// ANTES:
const backUrl = state && city
  ? `/gastronomia/${state}/${city}${district ? `/${district}` : ''}`
  : '/gastronomia/ba/salvador';

// DEPOIS:
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';

const moduleUrls = useFriendlyModuleUrls();
const backUrl = state && city
  ? `/gastronomia/${state}/${city}${district ? `/${district}` : ''}`
  : moduleUrls.gastronomy;
```

---

### 5. Remover Hardcoded em BusinessStandalonePage

**Arquivo**: `src/modules/business/pages/BusinessStandalonePage.tsx`

```typescript
// ANTES:
const backUrl = business?.geographic_path
  ? buildBusinessUrl({
      slug: business.slug,
      geographic_path: (business as any).geographic_path ?? null,
    })
  : '/empresas/ba/salvador';

// DEPOIS:
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';

const moduleUrls = useFriendlyModuleUrls();
const backUrl = business?.geographic_path
  ? buildBusinessUrl({
      slug: business.slug,
      geographic_path: (business as any).geographic_path ?? null,
    })
  : moduleUrls.business;
```

---

### 6. Validação de Modo no Store

**Arquivo**: `src/core/location/stores/LocationContextStore.ts`

```typescript
setTerritoryMode(mode: TerritoryMode): void {
  // Validação: visitantes não podem ter modo 'bairro'
  // (Nota: hasHome não está disponível aqui, validação deve ser no hook)
  this.territoryMode = mode;
  this.notify();
}
```

**Melhor abordagem**: Validar no hook `useActiveTerritory`:

```typescript
// Em useActiveTerritory.ts
const setTerritoryModeWithValidation = useCallback((mode: TerritoryMode) => {
  const { hasHome } = useUserTerritory();
  
  // Visitantes não podem ter modo 'bairro'
  if (mode === 'bairro' && !hasHome) {
    console.warn('[setTerritoryMode] Visitantes não podem usar modo bairro');
    return;
  }
  
  locationContextStore.setTerritoryMode(mode);
}, []);
```

---

## ✅ Checklist de Implementação

### Urgente (Funcionalidade Quebrada)
- [ ] Criar `useTerritoryModeInitializer`
- [ ] Adicionar inicializador no layout principal
- [ ] Modificar `useTerritoryFilter` para considerar `territoryMode`
- [ ] Testar fluxo completo de modos

### Importante (Qualidade de Código)
- [ ] Adicionar `gastronomy` em `useFriendlyModuleUrls`
- [ ] Remover hardcoded em `GastronomyDetailPage`
- [ ] Remover hardcoded em `BusinessStandalonePage`
- [ ] Remover hardcoded em `EmpresasLandingPage`
- [ ] Remover hardcoded em `EmpresaDetailLandingPage`

### Desejável (Robustez)
- [ ] Adicionar validação de modo no hook
- [ ] Adicionar testes unitários
- [ ] Adicionar logs de debug
- [ ] Documentar fluxo completo

---

## 🎯 Resultado Esperado

Após a refatoração:

1. ✅ Seletor, Sidebar e Páginas em perfeita sincronia
2. ✅ Zero hardcoded de URLs
3. ✅ Modo territorial funciona corretamente
4. ✅ Filtros de conteúdo respeitam o modo
5. ✅ Código limpo, robusto e profissional
6. ✅ Fácil adicionar novos territórios ou módulos

---

## 📚 Arquitetura Final

```
┌─────────────────────────────────────────────────────────────┐
│                    SSOT: territory.ts                        │
│  - TERRITORY_CONFIG (país, estado, cidade de lançamento)    │
│  - LAUNCH_URLS (URLs base de cada módulo)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌─────────▼────────┐
│ navigation.    │          │ useFriendly      │
│ config.ts      │          │ ModuleUrls()     │
│ (Nav items)    │          │ (URLs dinâmicas) │
└───────┬────────┘          └─────────┬────────┘
        │                             │
        │                             │
┌───────▼────────┐          ┌─────────▼────────┐
│ AppSidebar     │◄─────────┤ Territory        │
│ (Desktop nav)  │          │ SelectorV2       │
└────────────────┘          └──────────────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
              ┌────────▼────────┐
              │ Páginas         │
              │ (Conteúdo)      │
              └─────────────────┘
                       │
              ┌────────▼────────┐
              │ useTerritoryFilter │
              │ (Filtros de conteúdo) │
              │ + territoryMode       │
              └───────────────────────┘
```

---

## 🚀 Ordem de Implementação

1. **Criar `useTerritoryModeInitializer`** (30 min)
2. **Modificar `useTerritoryFilter`** (45 min)
3. **Adicionar `gastronomy` em `useFriendlyModuleUrls`** (15 min)
4. **Remover hardcoded das páginas** (30 min)
5. **Testar fluxo completo** (30 min)
6. **Adicionar validações** (20 min)

**Tempo total estimado**: 2h 50min
