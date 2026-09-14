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

Owners atuais:

- Home de cidade/bairro/grupo: `TerritoryHomePage`;
- entrada pública do MVP: `TerritoryEntryPage`;
- descoberta/busca: `BuscaPage`;
- mapa: `MapaPageV4`;
- `CidadeLandingPage` permanece somente como compatibilidade do portal
  Community enquanto módulos embutidos ainda dependem dessa moldura.

`BuscaPage` é uma busca **interna ao território atual**. No MVP ela é acessada após a entrada no Complexo; não deve ser promovida novamente a campo de cidade/bairro na primeira tela.

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
| Dependências     | `TerritorialLayout`, `useModuleTerritoryFilter`, `useTerritoryHomeData`, `useCommunityAccess`, `launchScope`        |
| Situação         | **Migrado**                                                                                                          |

Regras adicionais:

- quick actions passam por `isLaunchSurfaceEnabled(...)`;
- Mobilidade e Educação não aparecem enquanto seus gates estiverem `false`;
- `Publicar` é CTA contextual e depende de `CommunityAccessPolicy.can.create_post`;
- Production não substitui dados ausentes por conteúdo conceitual;
- mocks visuais só podem existir sob gate explícito de desenvolvimento.

---

## 4. TerritoryFeedPage

| Item             | Valor                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Nome antigo      | `ComunidadePage`                                                                                                                 |
| Novo nome        | `TerritoryFeedPage`                                                                                                              |
| Responsabilidade | Overview e timeline da Community persistida, com Feed, Grupos e Discussões no mesmo contexto.                                    |
| Rotas            | `/comunidade/:alias`, variantes territoriais, `/feed`, `/grupos` e `?view=...`                                                   |
| Arquivo canônico | `src/app/pages/TerritoryFeedPage.tsx` (alias → `@/core/community/pages/ComunidadePage`)                                          |
| Dependências     | `useCommunityFeed`, `useTerritoryFilter`, cards do `@/core/community/*`                                                          |
| Situação         | **Migrado visualmente na Fase 4.4** — `ComunidadePage` é a implementação técnica canônica; o alias público permanece compatível. |
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
| Responsabilidade | Superfície ou território ainda não lançado. No release atual, módulos `launch-paused` devem falhar fechados também em URL direta.                                                                                                                   |
| Rotas            | Gates em `AppLayoutRoutes` / `DIRECT_PAUSED_ROUTES` e fallbacks territoriais correspondentes.                                                                                                                                                       |
| Arquivo canônico | `src/app/pages/TerritoryUnavailablePage.tsx` (alias → `LaunchPausedPage`)                                                                                                                                                                           |
| Dependências     | `launchScope`; `CommunityInterestPage`/registro de interesse somente quando o contrato de expansão permitir.                                                                                                                                        |
| Situação         | **Compatibilidade ativa** — `LaunchPausedPage` continua sendo a implementação renderizada pelos gates atuais.                                                                                                                                       |

No estado atual, ocultar um módulo da navegação não é suficiente. Educação, Mobilidade e qualquer outra superfície pausada também precisam permanecer interceptadas por rota direta.

---

## 7. Navegação Território Vivo

O registry global canônico é `src/core/navigation/territoryNavigationModes.ts`.

Os cinco modos globais são:

1. `Hoje`;
2. `Explorar`;
3. `Community`;
4. `Atividade`;
5. `Conta` / `Entrar`.

`TerritoryAdaptiveNavigation` e `BottomNav` são renderers desse registry, não autoridades paralelas.

Regras:

- `Publicar` não é modo global; aparece somente em contexto autorizado por policy;
- módulos como Empresas, Serviços, Gastronomia, Classificados, Eventos etc. são destinos contextuais de Home/Explorar, não novos modos globais;
- um território presente na URL sempre prevalece;
- em rotas não territoriais, o último território válido da sessão pode preservar o contexto de retorno;
- sem último território válido, o fallback do MVP é o território de lançamento configurado;
- esse contexto interno não pode voltar a fazer `/` pular a entrada pública;
- toda superfície pausada continua sujeita a `launchScope` e ao gate de rota.

---

## Páginas legadas a remover após migração completa

Removidos em 2026-09-09:

- `src/app/pages/PublicCityLandingPage.tsx`;
- `src/app/pages/PublicCityLandingPage.css`;
- `src/app/pages/TerritoryExplorerPage.tsx`.

Ainda candidato futuro:

- `src/app/pages/CidadeLandingPage.tsx` + `CidadeLanding.*` — somente quando as seções `feed/grupos/business/...` migrarem para páginas dedicadas de módulo;
- `src/app/pages/LaunchPausedPage.tsx` — quando todos os callers migrarem de fato para `TerritoryUnavailablePage`.

## Regras da migração

1. Nenhuma rota pública pode ser removida sem compatibilidade explícita.
2. Nenhum arquivo antigo pode ser deletado enquanto houver import ativo.
3. Nova refatoração deve importar sempre o owner canônico (`TerritoryHomePage`, `TerritoryEntryPage`, etc.), nunca recriar alias como autoridade.
4. A navegação global é adaptativa: bottom navigation no mobile, rail no tablet e sidebar no desktop; todos consomem o mesmo registry global.
5. Community não monta shell global paralelo.
6. Módulos pausados ficam invisíveis na navegação **e** bloqueados em URL direta.
