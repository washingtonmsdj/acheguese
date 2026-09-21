# NAVIGATION-MAPPING.md

Sprint TERRITORY.2 — padronização de nomenclatura das páginas para refletir a arquitetura baseada em Territory.

> Atualização Fase 4.5: o MVP entra diretamente pela primeira comunidade do
> Complexo do Nordeste de Amaralina. Home, Explorar e Community compartilham o
> sistema Território Vivo; a Community consolidou overview, Feed, Grupos e
> Discussões em uma única superfície. Regras históricas desta sprint ficam
> subordinadas aos contratos atuais abaixo e a `docs/05-ux/HOME-SPEC.md`.

Escopo desta etapa:

- consolidar responsabilidades canônicas sem recriar páginas paralelas;
- preservar rotas e owners válidos;
- remover comportamento legado somente quando o substituto já está comprovado;
- manter launch gates e policies como autoridade de disponibilidade.

Legenda de situação:

- **Migrado**: nome/owner canônico já está em uso pelas rotas;
- **Legado**: implementação antiga ainda possui caller real e deve ser removida somente após migração completa;
- **Futuro**: capacidade prevista, ainda não lançada.

---

## 1. TerritoryEntryPage

| Item             | Valor                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Nomes removidos  | `AchegueSeHomePage`, `AchegueSeHomePageMap`, `TerritorySelectorPage`                                                         |
| Nome canônico    | `TerritoryEntryPage`                                                                                                         |
| Responsabilidade | Apresentar a entrada pública community-first do MVP e conduzir ao Complexo. **Não é uma Home de conteúdo nem um seletor.**   |
| Rotas            | `/`; `/?trocar=territorio` permanece compatível, mas renderiza a mesma entrada enquanto só há uma comunidade lançada.       |
| Arquivo canônico | `src/app/pages/TerritoryEntryPage.tsx`                                                                                       |
| Dependências     | `TERRITORY_CONFIG`/`LAUNCH_URLS`, catálogo `locations`, boundary canônica e mapa territorial                                 |
| Situação         | **Migrado em G157/G159** — implementação única consumida por `RootRouteEntry`.                                               |
| Regra de retorno | `/` sempre mostra a entrada do MVP, salvo lockdown explícito de pré-lançamento; território lembrado não pode pular essa tela. |

### Regra vigente da raiz

Enquanto o lançamento público possui somente o Complexo como comunidade inicial:

- não existe busca por cidade na raiz;
- não existe botão de geolocalização na raiz;
- não existe seletor de múltiplas comunidades;
- `lastTerritoryStore` continua útil para preservar contexto **depois** que a pessoa entrou no produto, mas não controla mais o render de `/`;
- a navegação interna pode usar o último território para retornar de Conta/Atividade ao contexto anterior;
- criação de conta e indicação de outra comunidade são fluxos separados da entrada territorial.

Quando mais de uma comunidade estiver efetivamente lançada, a evolução da raiz deve reutilizar o SSOT territorial existente em vez de restaurar seletores legados.

---

## 2. Explorar território

O alias `TerritoryExplorerPage` e a implementação `PublicCityLandingPage`
foram aposentados em 2026-09-09 após prova de zero caller de rota.

Owners atuais do MVP:

- Home territorial: `TerritoryHomePage`;
- entrada pública: `TerritoryEntryPage`;
- Empresas: `EmpresasLandingPage` + owner `core/business`;
- Mapa: `MapaPageV4`;
- Perto de mim: `core/nearby/pages/NearbyPage.tsx`.

`BuscaPage` e Community permanecem preservadas para pós-MVP, mas estão
`paused` no lifecycle. `CidadeLandingPage` foi removida após migração dos
callers e não é compatibilidade ativa.

Não recriar uma segunda Home/Explorer monolítica.

---

## 3. TerritoryHomePage

| Item             | Valor                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Nome antigo      | (nenhum equivalente direto — antes era `PublicCityLandingPage` fazendo papel duplo)                                  |
| Novo nome        | `TerritoryHomePage`                                                                                                  |
| Responsabilidade | Home territorial útil de cidade/bairro/grupo. Blocos usam dados reais, estados reais e apenas superfícies lançadas. |
| Rotas            | `/:uf/:city`, `/:uf/:city/:district-or-group`                                                                        |
| Arquivo canônico | `src/app/pages/TerritoryHomePage.tsx`                                                                                |
| Dependências     | `TerritorialLayout`, URLs de módulo e lifecycle canônico em `productModuleRegistry.ts`                                      |
| Situação         | **Migrado**                                                                                                          |

Regras adicionais:

- a Home expõe somente Empresas, Mapa e Perto de mim no MVP;
- o lifecycle pertence a `productModuleRegistry.ts`;
- módulos pausados não são consultados para preencher previews escondidos;
- produção não substitui dados ausentes por conteúdo conceitual;
- mocks visuais só podem existir sob gate explícito de desenvolvimento.

---

## 4. Community / Territory Feed

| Item             | Valor                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Conceito produto | `Territory Feed`                                                                                           |
| Owner técnico    | `ComunidadePage`                                                                                           |
| Responsabilidade | Overview e timeline da Community persistida, com Feed, Grupos e Discussões no mesmo contexto.              |
| Rotas            | `/comunidade/:alias`, variantes territoriais, `/feed`, `/grupos` e `?view=...`                             |
| Arquivo canônico | `src/core/community-feed/pages/ComunidadePage.tsx`                                                         |
| Dependências     | `useCommunityFeed`, `useTerritoryFilter`, componentes de `core/community-feed` e domínios relacionados |
| Situação         | **Owner preservado / módulo pausado no MVP** — reativação futura passa pelo lifecycle canônico.             |
| Alias aposentado | `src/app/pages/TerritoryFeedPage.tsx` foi removido por não ter caller de runtime.                          |

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

## 6. Superfícies indisponíveis: contratos separados

`LaunchPausedPage` é o owner canônico do **kill-switch de módulos**. Ele recebe `moduleName` e é renderizado pelos gates de `launchScope` quando uma superfície preservada está fora do lançamento.

`CommunityInterestPage` é o owner do fluxo territorial **`coming_soon`** quando existe Community persistida e identidade territorial inequívoca. Esse caso segue D-008 e leva ao registro de interesse; não reutiliza o kill-switch de módulos.

`TerritoryUnavailablePage` foi aposentada: era apenas um re-export sem caller e misturava dois estados de produto diferentes. Não existe rota pública `/territory/unavailable`.

No estado atual, ocultar um módulo da navegação não é suficiente. Educação, Mobilidade e qualquer outra superfície pausada também precisam permanecer interceptadas por rota direta.

---

## 7. Navegação Território Vivo

O registry de apresentação é `src/core/navigation/territoryNavigationModes.ts`
e o lifecycle de produto pertence a
`src/app/config/productModuleRegistry.ts`.

Os cinco destinos primários do MVP são:

1. Home;
2. Mapa;
3. Empresas;
4. Perto de mim;
5. Conta / Entrar.

`TerritoryAdaptiveNavigation` e `BottomNav` são renderers; não possuem
autoridade própria para ativar módulos.

Regras:

- um destino de módulo só aparece quando seu lifecycle efetivo está ativo;
- `nearby` depende formalmente de `map + business`;
- rotas não territoriais podem preservar o último território válido apenas como
  contexto, nunca como autorização para reativar módulo pausado;
- Search, Community e demais módulos pós-MVP não aparecem na navegação primária;
- pausar um módulo precisa removê-lo também de rota funcional, prefetch,
  discovery e layers públicas, não apenas do menu.

---

## Páginas legadas a remover após migração completa

Removidos após migração e prova de ausência de caller:

- `src/app/pages/PublicCityLandingPage.tsx`;
- `src/app/pages/PublicCityLandingPage.css`;
- `src/app/pages/TerritoryExplorerPage.tsx`;
- `src/app/pages/TerritoryFeedPage.tsx`;
- `src/app/pages/CidadeLandingPage.tsx` e a família `CidadeLanding.*`.

Esses arquivos não são camadas de compatibilidade e não devem ser recriados.

## Regras da migração

1. Rota antiga só recebe redirect quando existe contrato externo legítimo de URL canônica; módulo pausado ou código quebrado não justifica redirect.
2. Arquivo antigo só é removido após prova de ausência de import/caller ativo.
3. Nova refatoração deve importar sempre o owner canônico (`TerritoryHomePage`, `TerritoryEntryPage`, etc.), nunca recriar alias como autoridade.
4. A navegação global é adaptativa: bottom navigation no mobile, rail no tablet e sidebar no desktop; todos consomem o mesmo registry global.
5. Community não monta shell global paralelo.
6. Módulos pausados ficam invisíveis na navegação **e** bloqueados em URL direta.
