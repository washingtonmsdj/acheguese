# DOMAIN-MAPPING.md — Territory / lifecycle atual

> **Atualizado em 2026-09-21.** Este documento descreve o mapeamento conceitual do domínio Territory, mas não possui autoridade para ativar domínio ou capability pública. O lifecycle executável pertence a `src/app/config/productModuleRegistry.ts`, `src/app/config/platformCapabilityRegistry.ts` e ao avaliador `src/app/config/lifecycleRegistry.ts`.

No MVP atual, **Business/Empresas** é o único domínio de produto ativo. **Mapa, Perto de mim, Busca e Mensagens (provider Business)** são capabilities horizontais ativas, junto de Auth, Perfis/Conta, Território, Localização, Notificações e Central. Community e os demais domínios de produto permanecem `paused`.

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
| `TerritoryHomePage.tsx` | `TerritoryHomePage` | ✅ Canônico | Home oficial de qualquer território. | `AppLayoutRoutes` / `TerritorialIndexPage`. | Manter. |
| `TerritoryFeedPage.tsx` | — | ✅ Removido | Re-export sem caller; o owner runtime já era `core/community-feed/pages/ComunidadePage.tsx`. | — | Não recriar. |
| `TerritoryUnavailablePage.tsx` | — | ✅ Removido | Re-export sem caller; misturava `coming_soon` territorial com kill-switch de módulo. | — | Não recriar. |
| `PublicCityLandingPage.tsx` (+ `.css`) | — | ✅ Removido | Segunda Home sem caller runtime; removida em 2026-09-09. | — | Não recriar. |
| `CidadeLandingPage.tsx` + família `CidadeLanding.*` | — | ✅ Removido | Shell pré-Territory sem responsabilidade no MVP modular. | — | Não recriar; Home/Business/Map/Nearby têm owners próprios. |
| `LaunchPausedPage.tsx` | — | ✅ Removido | Placeholder app-level sem caller runtime após o corte active-only; módulos pausados preservam owners/lifecycle, não uma tela substituta. | — | Não recriar no runtime MVP; URL sem owner ativo cai no `NotFound` canônico. |
| `ComunidadePage.tsx` (em `core/community-feed/pages`) | `ComunidadePage` | ⏸️ Owner preservado | Owner interno do domínio Community/Feed. O módulo está `paused` no MVP e não integra navegação, prefetch ou superfície pública ativa. | lifecycle + contratos internos de Community. | Preservar para pós-MVP; reativar somente após certificação e mudança explícita no registry. |
| `EmpresasLandingPage.tsx`, `EmpresaDetailLandingPage.tsx` | superfícies públicas Business | ✅ Canônico no domínio Business | Pertence a Business e não ao domínio Territory. | rotas `/empresas`. | Territory fornece contexto; Business mantém ownership da entidade e URLs. |

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

## 4. Rotas e URLs vigentes

| Padrão | Estado | Notas |
|--------|--------|-------|
| `/` | ✅ Canônico | Entrada pública do MVP via `TerritoryEntryPage`. |
| `/:uf/:city` | ✅ Canônico | Home territorial. |
| `/:uf/:city/:neighborhood` | ✅ Canônico | Home territorial de bairro/grupo resolvido. |
| `/empresas/:uf/:city[/:neighborhood]` | ✅ Ativo | Módulo Business. |
| `/mapa/:uf/:city[/:neighborhood]` | ✅ Ativo | Capability horizontal Map; consome apenas layers de domínios ativos. |
| `/perto-de-mim` | ✅ Ativo | Capability horizontal Nearby; depende de Map + Location + Business. |
| `/busca[/:uf/:city[/:neighborhood]]` | ✅ Ativo | Search canônica; consulta somente providers habilitados pelo lifecycle. |
| `/buscar[/:uf/:city[/:neighborhood]]` | ✅ Ativo | Experiência de busca assistida sob o mesmo lifecycle de Search. |
| `/inicio` | ⛔ Legado | Não é entrada canônica nem deve aparecer no sitemap do MVP. |
| `/comunidade/*` | ⏸️ Pausado | Owner preservado, mas Community não é superfície pública ativa do MVP. |
| `/cidade/*` | 🟨 Legado | Não criar redirect paliativo; compatibilidade só permanece com justificativa externa real. |

---

## 5. Termos proibidos em código novo

A partir desta sprint, novos módulos, componentes e tipos **não podem** introduzir:

- `Landing*` (usar `TerritoryExplorer*` ou `TerritorySelector*`)
- `Launch*` dentro do domínio Territory; placeholders app-level de módulo pausado não fazem parte do runtime MVP
- `Home*` genérico sem prefixo (usar `TerritoryHome*`)
- `City*`, `Cidade*`, `Neighborhood*`, `Bairro*`, `District*` como **tipos de domínio** (permitido apenas como *label* de UI ou valor de `TerritoryType`)
- `Community*` sem estar sob o subdomínio `community/` de Territory

---

## 6. Próximos passos (fora desta sprint)

1. **DOMAIN.2** — Introduzir re-exports `Territory = Location`, `TerritoryType = LocationType` em `core/location/index.ts`.
2. **DOMAIN.3** — Fundir `core/territorial` em `core/location` sob o namespace `territory/`.
3. **DOMAIN.4** — Continuar removendo aliases restantes; `AchegueSeHomePage`, `PublicCityLandingPage`, `TerritoryUnavailablePage` e `TerritoryFeedPage` já foram aposentados. `ComunidadePage` permanece owner interno preservado, mas Community continua `paused` no MVP.
4. **DOMAIN.5** — Redirecionar rotas legadas reais (`/cidade/*`) sem inventar aliases de indisponibilidade.
5. **DOMAIN.6** — Deprecar `core/city`, `core/landing`, `core/community-*` movendo para subpastas canônicas.
