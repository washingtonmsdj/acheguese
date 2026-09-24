# NAVIGATION-MAPPING.md

Sprint TERRITORY.2 — padronização de nomenclatura das páginas para refletir a arquitetura baseada em Territory.

> Atualização 2026-09-22: o MVP público possui **Empresas + Mapa + Perto de mim
> + Busca**. Home/Território e Conta são plataforma. Community e demais módulos
> pós-MVP permanecem `paused`. O lifecycle executável em
> `productModuleRegistry.ts` prevalece sobre descrições históricas deste mapa.

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
| Responsabilidade | Apresentar a entrada territorial do MVP e os quatro módulos ativos. **Não é Home de conteúdo nem catálogo de módulos pausados.** |
| Rotas            | `/`; a entrada deriva URLs territoriais de Empresas/Mapa e mantém Perto de mim como capacidade própria. |
| Arquivo canônico | `src/app/pages/TerritoryEntryPage.tsx`                                                                                       |
| Dependências     | `TERRITORY_CONFIG`/`LAUNCH_URLS`, catálogo `locations`, boundary canônica e mapa territorial                                 |
| Situação         | **Migrado em G157/G159** — implementação única consumida por `RootRouteEntry`.                                               |
| Regra de retorno | `/` sempre mostra a entrada do MVP, salvo lockdown explícito de pré-lançamento; território lembrado não pode pular essa tela. |

### Regra vigente da raiz

No MVP atual:

- a raiz apresenta Empresas, Mapa, Perto de mim e Busca;
- não usa Community ou módulos pausados para completar a experiência;
- `lastTerritoryStore` pode preservar contexto territorial, mas não ativa módulo;
- criação de conta permanece fluxo de plataforma;
- futuras experiências multi-community só retornam após reativação formal do módulo Community.

---

## 2. Explorar território

O alias `TerritoryExplorerPage` e a implementação `PublicCityLandingPage`
foram aposentados em 2026-09-09 após prova de zero caller de rota.

Owners atuais do MVP:

- Home territorial: `TerritoryHomePage`;
- entrada pública: `TerritoryEntryPage`;
- Empresas: `EmpresasLandingPage` + owner `core/business`;
- Mapa: `MapaPageV4`;
- Perto de mim: `core/nearby/pages/NearbyPage.tsx`;
- Busca: `BuscaPage` + owner `core/search`, com `/buscar` assistida sob o mesmo lifecycle.

`BuscaPage` permanece ativa no MVP e consome somente providers habilitados pelo lifecycle. Community permanece preservada para pós-MVP e `paused` no lifecycle. `CidadeLandingPage` foi removida após migração dos
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

- a Home expõe somente Empresas, Mapa, Perto de mim e Busca no MVP; dentro de cidade/bairro, todos os quatro preservam o mesmo `baseUrl` territorial;
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
| Situação         | **Owner preservado / Community pausada** — o detalhe de post não integra o MVP ativo e só volta após reativação formal do módulo. |

---

## 6. Superfícies indisponíveis: contratos separados

Módulos `paused` **não recebem placeholder de rota no runtime MVP**. O antigo `LaunchPausedPage` e a factory `launchPausedComponent.ts` foram aposentados quando perderam o último caller após a adoção do grafo active-only.

`CommunityInterestPage` permanece apenas como owner preservado do fluxo **`coming_soon`** de Community para uma futura reativação formal; ele não integra o runtime enquanto Community estiver `paused`.

`TerritoryUnavailablePage` também foi aposentada: era um re-export sem caller e misturava indisponibilidade territorial com lifecycle de módulo. Não existe rota pública `/territory/unavailable`.

No estado atual, módulo pausado precisa permanecer ausente de navegação, prefetch, lazy imports e composição `<Route>`. URL sem owner ativo cai no `NotFound` canônico; reativação futura exige mudança explícita de lifecycle + certificação + conexão ao boundary ativo.

---

## 7. Navegação Território Vivo

O registry de apresentação é `src/core/navigation/territoryNavigationModes.ts`
e o lifecycle de produto pertence a
`src/app/config/productModuleRegistry.ts`.

Os seis destinos primários do MVP são:

1. Home;
2. Mapa;
3. Empresas;
4. Perto de mim;
5. Busca;
6. Conta / Entrar.

`TerritoryAdaptiveNavigation` e `BottomNav` são renderers; não possuem
autoridade própria para ativar módulos.

Regras:

- um destino de módulo só aparece quando seu lifecycle efetivo está ativo;
- `nearby` depende formalmente de `map + business` e, quando há contexto territorial na URL, usa `/perto-de-mim/:uf/:cidade[/:bairro]` em vez de descartar esse contexto;
- rotas não territoriais podem preservar o último território válido apenas como
  contexto, nunca como autorização para reativar módulo pausado;
- Search aparece como módulo ativo; Community e demais módulos pós-MVP não aparecem na navegação primária;
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

### Rotas privadas canônicas

- Conta privada: `/conta/*`;
- perfil público: `/u/:username`;
- `/perfil/*` foi aposentado e não possui redirect;
- Notificações: capability horizontal `active`; Inbox canônica em `/notificacoes` e preferências em `/conta/notificacoes`. Aliases antigos continuam removidos, sem redirects paliativos.
- rota desconhecida termina em 404, nunca em redirect silencioso para `/`.

## Regras da migração

1. O corte MVP não mantém redirect de compatibilidade. Rota antiga sem contrato externo público comprovado é removida e retorna 404. Navegação de guard para login/autorização é controle de acesso, não alias.
2. Arquivo antigo só é removido após prova de ausência de import/caller ativo.
3. Nova refatoração deve importar sempre o owner canônico (`TerritoryHomePage`, `TerritoryEntryPage`, etc.), nunca recriar alias como autoridade.
4. A navegação global é adaptativa: bottom navigation no mobile, rail no tablet e sidebar no desktop; todos consomem o mesmo registry global.
5. Community não monta shell global paralelo.
6. Módulos pausados ficam invisíveis na navegação **e** bloqueados em URL direta.
