# DOMAIN-MAPPING.md — Sprint DOMAIN.1

Consolidação do domínio **Territory**. Nesta etapa **não há renomeação de arquivos, rotas ou imports**. Este documento é o SSOT conceitual do mapeamento entre nomes atuais e nomes canônicos.

## Legenda de status

| Status | Significado |
|--------|-------------|
| ✅ **Canônico** | Nome oficial no domínio Territory. Manter. |
| 🟦 **Alias temporário** | Nome ativo em produção; permitido enquanto aponta para o canônico. Meta: remover após migração completa de referências. |
| 🟨 **Legado** | Ainda funcional, mas fora do domínio Territory. Não usar em código novo. |
| 🟥 **Remover futuramente** | Deprecar em sprints seguintes (após atualização de imports/rotas). |

---

## 1. Páginas (`src/app/pages/`)

| Nome atual | Nome canônico | Status | Motivo | Dependências | Plano de migração |
|------------|---------------|--------|--------|--------------|-------------------|
| `TerritoryEntryPage.tsx` | `TerritoryEntryPage` | ✅ Canônico | Entrada e resolução territorial pública. | `RootRouteEntry`, rota `/`. | Manter como implementação única. |
| `TerritoryExplorerPage.tsx` | — | ✅ Removido | Alias sem caller de rota; descoberta pertence a Busca/Mapa e Home a `TerritoryHomePage`. | — | Não recriar. |
| `TerritoryHomePage.tsx` | `TerritoryHomePage` | ✅ Canônico | Home oficial de qualquer território. | `TerritorialModulePages`. | Manter. |
| `TerritoryFeedPage.tsx` | `TerritoryFeedPage` | ✅ Canônico | Timeline completa do território. | `lazyImports`. | Manter. |
| `TerritoryUnavailablePage.tsx` | `TerritoryUnavailablePage` | ✅ Canônico | Território sem suporte. | rotas. | Manter. |
| `PublicCityLandingPage.tsx` (+ `.css`) | — | ✅ Removido | Segunda Home sem caller runtime; removida em 2026-09-09. | — | Não recriar. |
| `CidadeLandingPage.tsx` (+ `.css`, `*.sections.tsx`, `*.neighborhood-*.tsx`, `*.constants.ts`, `*.utils.ts`) | `TerritoryExplorerPage` (sections) | 🟨 Legado | Versão pré-Territory da landing de cidade. | Rotas legadas `/cidade/*`. | Mover partes reutilizáveis para `territory/sections/`; deprecar. |
| `LaunchPausedPage.tsx` | `TerritoryUnavailablePage` | 🟦 Alias temporário | Implementação real do unavailable. | `TerritoryUnavailablePage.tsx`. | Consolidar em `TerritoryUnavailablePage`. |
| `ComunidadePage.tsx` (em `core/community/pages`) | `TerritoryFeedPage` | 🟦 Alias temporário | Implementação real do feed territorial. | `TerritoryFeedPage.tsx`. | Consolidar em `TerritoryFeedPage`. |
| `EmpresasLandingPage.tsx`, `EmpresaDetailLandingPage.tsx` | `BusinessDirectoryPage`, `BusinessDetailPage` | 🟨 Legado (fora do domínio Territory) | Pertence ao domínio Business. | rotas `/empresas`. | Fora do escopo desta sprint. |

---

## 2. Módulos (`src/core/`)

| Nome atual | Domínio canônico | Status | Motivo | Plano |
|------------|------------------|--------|--------|-------|
| `core/location` | **Territory** (SSOT hierárquico) | ✅ Canônico interno | Já modela country→state→city→district→neighborhood. | Renomear conceitualmente para `territory` sem mover arquivos ainda. Ver `TERRITORY-DOMAIN.md`. |
| `core/city` | `Territory` (TerritoryType=city) | 🟨 Legado | City é um `TerritoryType`, não um domínio. | Absorver por `core/location` (futuro `core/territory`). |
| `core/community` | `Community` (subdomínio social de Territory) | ✅ Canônico | Community é a camada social sobre um Territory. | Manter, mas depender de `Territory` explicitamente. |
| `core/community-experience` | `Community` | 🟦 Alias temporário | Serviços de agregação de experiência comunitária. | Reagrupar sob `core/community/experience/`. |
| `core/community-groups` | `Community` | 🟦 Alias temporário | Sub-recurso. | Mover para `core/community/groups/`. |
| `core/community-issues` | `Community` | 🟦 Alias temporário | Sub-recurso. | Mover para `core/community/issues/`. |
| `core/community-lost-found` | `Community` | 🟦 Alias temporário | Sub-recurso. | Mover para `core/community/lost-found/`. |
| `core/community-recommendations` | `Community` | 🟦 Alias temporário | Sub-recurso. | Mover para `core/community/recommendations/`. |
| `core/communication-territorial` | `Community` (canal editorial) | 🟨 Legado nomenclatural | Nome longo e ambíguo. | Renomear para `core/community/communication/`. |
| `core/landing` | `Territory` (queries de descoberta) | 🟨 Legado | "Landing" descreve página, não domínio. | Mover serviços úteis para `core/territory/discovery/`. |
| `core/territorial` | `Territory` (admin/tree) | 🟦 Alias temporário | Coabita com `core/location`. | Fundir em `core/territory` (Sprint DOMAIN.3). |
| `core/routing` (`CommunityPublicAliasService`, `communityNavigationContext`, `territoryUrls`) | `Territory` (URL layer) | 🟦 Alias temporário | URL builder é do Territory. | Concentrar em `core/territory/urls/`. |

---

## 3. Tipos e conceitos

| Nome atual | Nome canônico | Status | Motivo |
|------------|---------------|--------|--------|
| `LocationType` (`country`, `state`, `city`, `district`, `neighborhood`) | `TerritoryType` | 🟦 Alias temporário | Location é implementação; Territory é domínio. Manter enum, adicionar tipo `TerritoryType = LocationType` como export canônico. |
| `Location` (interface) | `Territory` | 🟦 Alias temporário | Idem acima. |
| `ActiveTerritory` | `ActiveTerritory` | ✅ Canônico | Já correto. |
| `TerritoryMode` (`bairro` \| `cidade`) | `TerritoryMode` | ✅ Canônico | Manter, mas documentar que `bairro`/`cidade` são valores de `TerritoryType`. |
| `TerritoryFilter` | `TerritoryFilter` | ✅ Canônico | Manter. |
| `TerritorialGroup` | `TerritoryGroup` | 🟦 Alias temporário | Padronizar para `Territory*`. |
| `TerritoryNode` (`core/territorial`) | `TerritoryNode` | ✅ Canônico | Manter. |
| `CommunityContext`, `CommunityNavigationContext` | `TerritoryNavigationContext` | 🟨 Legado | Comunidade é subdomínio; contexto de navegação é do Territory. |
| `Cidade`, `Bairro` (labels em UI) | `Territory` + `TerritoryType` | 🟨 Legado semântico | Manter como *labels* de apresentação; nunca como estrutura. |

---

## 4. Rotas e URLs (não alterar nesta sprint — apenas classificar)

| Padrão atual | Canônico futuro | Status | Notas |
|--------------|-----------------|--------|-------|
| `/inicio` | `/inicio` | ✅ Canônico | Selector. |
| `/:uf/:city` | `/:uf/:city` | ✅ Canônico | Explorer. |
| `/:uf/:city/:neighborhood` | `/:uf/:city/:neighborhood` | ✅ Canônico | Territory Home. |
| `/comunidade/*` | `/:territory/comunidade` (subrota) | 🟦 Alias | Manter alias público. |
| `/cidade/*` | `/:uf/:city` | 🟨 Legado | Redirecionar futuramente. |
| `/lancamento-pausado`, `/launch-paused` | `/territorio-indisponivel` | 🟨 Legado | Renomear em DOMAIN.4. |

---

## 5. Termos proibidos em código novo

A partir desta sprint, novos módulos, componentes e tipos **não podem** introduzir:

- `Landing*` (usar `TerritoryExplorer*` ou `TerritorySelector*`)
- `Launch*` (usar `Territory*Unavailable` / `Territory*Rollout`)
- `Home*` genérico sem prefixo (usar `TerritoryHome*`)
- `City*`, `Cidade*`, `Neighborhood*`, `Bairro*`, `District*` como **tipos de domínio** (permitido apenas como *label* de UI ou valor de `TerritoryType`)
- `Community*` sem estar sob o subdomínio `community/` de Territory

---

## 6. Próximos passos (fora desta sprint)

1. **DOMAIN.2** — Introduzir re-exports `Territory = Location`, `TerritoryType = LocationType` em `core/location/index.ts`.
2. **DOMAIN.3** — Fundir `core/territorial` em `core/location` sob o namespace `territory/`.
3. **DOMAIN.4** — Continuar removendo aliases restantes (`AchegueSeHomePage`, `LaunchPausedPage`, `ComunidadePage`); `PublicCityLandingPage` já foi aposentada.
4. **DOMAIN.5** — Redirecionar rotas legadas (`/cidade/*`, `/launch-paused`).
5. **DOMAIN.6** — Deprecar `core/city`, `core/landing`, `core/community-*` movendo para subpastas canônicas.
