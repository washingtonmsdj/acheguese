# NAVIGATION-MAPPING.md

Sprint TERRITORY.2 — padronização de nomenclatura das páginas para refletir a arquitetura baseada em Territory.

> Atualizacao Fase 4.4: entrada, Home, Explorar e Community compartilham o
> sistema Territorio Vivo. A Community consolidou overview, Feed, Grupos e
> Discussoes em uma unica superficie; as regras historicas desta sprint ficam
> subordinadas aos contratos atuais abaixo.

Escopo desta etapa:

- Apenas renomear/consolidar responsabilidades conceitualmente.
- **Nenhuma** página antiga foi removida.
- **Nenhuma** rota existente foi alterada.
- Cada novo nome canônico existe como arquivo alias (`export { default } from "..."`), para permitir migração incremental de imports sem quebrar comportamento.

Legenda de situação:

- **Migrado**: novo nome já em uso pelas rotas.
- **Legado**: página antiga ainda em uso; deve ser removida após migração completa dos imports.
- **Futuro**: alias criado, mas ainda não referenciado pelas rotas — aguardando refatoração dedicada.

---

## 1. TerritoryEntryPage

| Item             | Valor                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Nomes removidos  | `AchegueSeHomePage`, `AchegueSeHomePageMap`, `TerritorySelectorPage`                          |
| Nome canônico    | `TerritoryEntryPage`                                                                          |
| Responsabilidade | Resolver localização, cidade ou bairro antes da Home. **Não é uma Home de conteúdo.**         |
| Rotas            | `/`; `/?trocar=territorio` para escolha explícita                                             |
| Arquivo canônico | `src/app/pages/TerritoryEntryPage.tsx`                                                        |
| Dependências     | catálogo `locations`, boundary canônica, Nominatim complementar e `LastTerritoryStore`        |
| Situação         | **Migrado na Fase 4.3** — implementação única consumida por `RootRouteEntry`.                 |
| Regra de retorno | contexto anterior válido redireciona; troca explícita mostra o último território como atalho. |

---

## 2. Explorar território

O alias `TerritoryExplorerPage` e a implementação `PublicCityLandingPage`
foram aposentados em 2026-09-09 após prova de zero caller de rota.

Owners atuais:

- Home de cidade/bairro/grupo: `TerritoryHomePage`;
- entrada/troca: `TerritoryEntryPage`;
- descoberta/busca: `BuscaPage`;
- mapa: `MapaPageV4`;
- `CidadeLandingPage` permanece somente como compatibilidade do portal
  Community enquanto módulos embutidos ainda dependem dessa moldura.

Não recriar uma segunda Home/Explorer monolítica.

---

## 3. TerritoryHomePage

| Item             | Valor                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Nome antigo      | (nenhum equivalente direto — antes era `PublicCityLandingPage` fazendo papel duplo)                                |
| Novo nome        | `TerritoryHomePage`                                                                                                |
| Responsabilidade | Home territorial util de cidade ou bairro. Blocos: Agora, Vale saber, acoes, servicos, oportunidades e descoberta. |
| Rotas            | `/:uf/:city`, `/:uf/:city/:district`                                                                               |
| Arquivo canônico | `src/app/pages/TerritoryHomePage.tsx`                                                                              |
| Dependências     | `useActiveTerritory`, `useUnifiedNotifications`, `useSessionContext`, `LAUNCH_URLS`                                |
| Situação         | **Migrado**                                                                                                        |

---

## 4. TerritoryFeedPage

| Item             | Valor                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Nome antigo      | `ComunidadePage`                                                                                                                 |
| Novo nome        | `TerritoryFeedPage`                                                                                                              |
| Responsabilidade | Overview e timeline da Community persistida, com Feed, Grupos e Discussoes no mesmo contexto.                                    |
| Rotas            | `/comunidade/:alias`, variantes territoriais, `/feed`, `/grupos` e `?view=...`                                                   |
| Arquivo canônico | `src/app/pages/TerritoryFeedPage.tsx` (alias → `@/core/community/pages/ComunidadePage`)                                          |
| Dependências     | `useCommunityFeed`, `useTerritoryFilter`, cards do `@/core/community/*`                                                          |
| Situação         | **Migrado visualmente na Fase 4.4** — `ComunidadePage` e a implementacao tecnica canonica; o alias publico permanece compativel. |
| Remoção prevista | Nenhuma. `ComunidadePage` permanece como implementação; apenas o _nome público_ migra para `TerritoryFeedPage`.                  |

---

## 5. PostPage

| Item             | Valor                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Nome antigo      | `PostDetailPage` / rotas de post existentes                                                      |
| Novo nome        | `PostPage`                                                                                       |
| Responsabilidade | Discussão completa de um post do território.                                                     |
| Rotas            | `/comunidade/post/:postId` (e variantes territoriais existentes)                                 |
| Arquivo canônico | (mantido no core — sem alias criado nesta etapa)                                                 |
| Situação         | **Legado ativo** — nome canônico já é `PostPage` conceitualmente; nenhuma renomeação necessária. |

---

## 6. TerritoryUnavailablePage

| Item             | Valor                                                                                                                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nome antigo      | `LaunchPausedPage`                                                                                                                                                                                                                                  |
| Novo nome        | `TerritoryUnavailablePage`                                                                                                                                                                                                                          |
| Responsabilidade | Cidade/território ainda não suportado — tela de pré-lançamento futura. No release atual, cadastro municipal permanece fail-closed até existir contrato próprio de city/territory interest; a waitlist vigente exige Community de bairro persistida. |
| Rotas            | Fallback territorial via `createLaunchPausedRoute(...)`                                                                                                                                                                                             |
| Arquivo canônico | `src/app/pages/TerritoryUnavailablePage.tsx` (alias → `LaunchPausedPage`)                                                                                                                                                                           |
| Dependências     | Explorador territorial no release atual; `CommunityInterestPage` e Turnstile somente para Community persistida autorizada pelo contrato D-008.                                                                                                      |
| Situação         | **Futuro** — alias criado; `createLaunchPausedRoute` ainda referencia `LaunchPausedPage`.                                                                                                                                                           |

---

## Páginas legadas a remover após migração completa

Removidos em 2026-09-09:

- `src/app/pages/PublicCityLandingPage.tsx`;
- `src/app/pages/PublicCityLandingPage.css`;
- `src/app/pages/TerritoryExplorerPage.tsx`.

Ainda candidato futuro:

- `src/app/pages/CidadeLandingPage.tsx` + `CidadeLanding.*` — somente quando as seções `feed/grupos/business/...` migrarem para páginas dedicadas de módulo.
- `src/app/pages/LaunchPausedPage.tsx` — quando `createLaunchPausedRoute` migrar para `TerritoryUnavailablePage`.

## Regras da migração

1. Nenhuma rota publica pode ser removida sem compatibilidade explicita.
2. Nenhum arquivo antigo pode ser deletado enquanto houver import ativo.
3. Nova refatoracao deve importar sempre o **nome canonico** (`TerritoryHomePage`, `TerritoryEntryPage`, etc.), nunca o legado.
4. A navegacao global e adaptativa: bottom navigation no mobile, rail no tablet
   e sidebar + contexto no desktop. Community nao monta shell global paralelo.
