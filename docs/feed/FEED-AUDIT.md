# FEED.AUDIT.1 - Auditoria do Domínio Feed

Data: 2026-07-25

Status: auditoria estática do código e da documentação. Não houve implementação, alteração de banco, alteração de contratos, criação de componentes ou execução de migrations.

## Bases Obrigatórias

- `docs/domain/TERRITORY-GOVERNANCE.md`
- `docs/domain/TERRITORY-DATA-QUALITY-V2.md`
- `docs/FEATURE-MAP.md`
- `docs/SCREEN-MAP.md`

## Critério Usado

O Feed foi auditado contra a governança congelada do domínio Territory:

- toda superfície pública deve partir de um `ResolvedTerritory`;
- consultas de conteúdo territorial devem usar `TerritoryFilter` oficial;
- navegação deve usar URLs territoriais canônicas, não slugs manuais nem `LAUNCH_URLS` como caminho nominal;
- nenhum post deve vazar entre bairros, cidades ou grupos;
- o score operacional não substitui gates, rollout, blockers e evidência objetiva.

Esta auditoria não valida runtime em produção nem políticas RLS reais do banco. Quando uma política RLS pode reduzir risco, o ponto ainda permanece como finding se o contrato do domínio Feed não consegue provar isolamento territorial no próprio caminho de aplicação.

## Veredito Executivo

**O domínio Feed ainda precisa de reestruturação.**

O Feed possui uma base funcional para timeline territorial, criação de posts, comentários, reações, compartilhamento, denúncia, busca e moderação. Porém ainda não pode iniciar congelamento porque não existe um SSOT claro do domínio Feed e há caminhos críticos que não garantem `ResolvedTerritory`/`TerritoryFilter` de ponta a ponta.

O caminho principal de timeline em `ComunidadePage` -> `CommunityFeed` -> `useCommunityFeedSimple` está mais próximo do padrão correto. Mesmo assim, fluxos paralelos como `/novo-post`, leitura por `post_id`, comentários, engajamento, posts de mobilidade, compartilhamento e moderação ainda aceitam contratos por ID ou fallback global. Isso impede afirmar que qualquer bairro de Salvador, ou de outra cidade futura, teria isolamento territorial consistente apenas por rollout.

## Arquitetura Atual

| Camada | Estado | Evidência | Avaliação |
| --- | --- | --- | --- |
| Páginas | Parcialmente pronto | `src/app/pages/TerritoryFeedPage.tsx`, `src/core/community/pages/ComunidadePage.tsx`, `src/core/community/pages/NovoPostPage.tsx`, `src/app/pages/BuscaPage.tsx`, `src/app/pages/BuscarPage.tsx` | A página territorial principal resolve território. A rota direta `/novo-post` não recebe `ResolvedTerritory` da rota e depende de fallback do usuário/sessão. |
| Componentes | Parcialmente pronto | `CommunityFeed`, `UnifiedFeedWithMessages`, `UnifiedPostCard`, `CreatePostModal`, `PostCommentsPanel`, `CommunityOverviewSurface` | Há componentes modernos e componentes legados coexistindo. O componente principal usa filtro territorial, mas cards, modais e ações reutilizam serviços por ID. |
| Hooks | Parcialmente pronto | `useCommunityFeedSimple`, `useCommunityAccess`, `useCommunityRollout`, `usePostActions`, `useComments`, `useCommunityFiltersAAA`, hooks legados em `hooks/posts` | Hooks territoriais existem, mas nem todos os hooks de Feed exigem território. Há filtros que não se refletem completamente na consulta. |
| Services | Parcialmente pronto | `PostService`, `posts.feed.queries`, `posts.queries`, `posts.mutations`, `CommentService`, `PostEngagementService`, `CommunityRolloutService`, `SearchService` | Timeline tem serviço dedicado com localização obrigatória. Leitura por ID, comentários, engajamento e alguns serviços por tipo ainda não exigem `TerritoryFilter`. |
| Repositories | Não pronto | Não há repository dedicado do Feed; serviços chamam Supabase diretamente ou fachadas de outros domínios. | O domínio Feed não possui fronteira própria clara. |
| Queries | Parcialmente pronto | `posts.feed.queries.ts` exige `location_id`/`location_ids`; `posts.queries.ts` tem `getPostById` e `getPostsByType` mais permissivos. | A query de lista é boa. Queries auxiliares ainda podem ser usadas fora do contrato territorial. |
| Mutations | Parcialmente pronto | `createPost` exige `location_id`; `updatePost`/`deletePost` por ID coexistem com `deletePostByAuthor`. | Criação tem validação territorial mínima. Edição/exclusão ainda têm variantes inseguras por ID. |
| Providers | Parcialmente pronto | TanStack Query, sessão, perfil, Territory hooks e Search providers. | Não há `FeedProvider`/boundary próprio. O Feed depende de vários contextos externos sem contrato único. |

## Páginas e Rotas

| Rota / tela | Estado | Observação |
| --- | --- | --- |
| `/comunidade/:uf/:city/:hood/feed` | Parcialmente pronto | Mapeada em `SCREEN-MAP.md` como `TerritoryFeedPage`, mas o arquivo real é apenas alias para `ComunidadePage`. O caminho principal usa território. |
| `/comunidade/:uf/:city/:hood` | Parcialmente pronto | `CommunityOverviewSurface` usa `territoryFilter` para previews, mas contém fixture visual via query param e imagens hardcoded por slug. |
| `/novo-post` | Não pronto | Rota direta autentica o usuário, mas não resolve território da rota nem aplica explicitamente o gate de rollout/acesso do território alvo. |
| `?post=<id>` no Feed | Parcialmente pronto | O compartilhamento usa query param no caminho atual. A leitura por ID não recebe filtro territorial. |
| `/p/:slug/*` | Não pronto para Feed | `SCREEN-MAP.md` descreve como detalhe de post, mas a rota real é mini-site premium de empresa. O Feed não tem URL canônica de detalhe por post. |
| `/buscar` / busca federada | Parcialmente pronto | As páginas resolvem território e passam `TerritoryFilter`; resultados de post não possuem URL de detalhe. |

## Jornada Por Perfil

| Perfil | Estado | Avaliação |
| --- | --- | --- |
| Visitante | Parcialmente pronto | Pode ver preview/lista quando superfície permite. Ações sensíveis exigem login. Risco: detalhe por ID e compartilhamento não provam território. |
| Usuário autenticado | Parcialmente pronto | Pode publicar, comentar, reagir e salvar em alguns fluxos. `/novo-post` não garante o mesmo território da rota atual. |
| Moderador | Parcialmente pronto | Há denúncias e filas, mas a moderação é mais global/admin do que territorial por bairro/comunidade. |
| Administrador | Parcialmente pronto | Possui maior acesso às filas e ferramentas, mas falta visão territorial canônica para auditar Feed por bairro. |
| Empresa | Parcialmente pronto | `CreatePostModal` aceita perfil efetivo não pessoal, porém o contrato de permissão por território/rollout não está centralizado. |
| Prestador | Parcialmente pronto | Integrações com oportunidades/mobilidade existem, mas posts de mobilidade podem consultar globalmente sem território. |

## Funcionalidades

| Funcionalidade | Estado | Evidência / motivo |
| --- | --- | --- |
| Criar post | Parcialmente pronto | `createPost` exige `location_id`, e o modal publica com `createPostWithImages`. Porém `/novo-post` e `CreatePostModal` podem depender de fallback de perfil/território global. |
| Editar post | Parcialmente pronto | Modal usa `postService.updatePost(editPostId, { content })`. A mutation de serviço atualiza por ID sem contrato explícito de autor/território no client. |
| Excluir post | Parcialmente pronto | O caminho principal de `usePostActions` usa `deletePostByAuthor`, mas hooks legados ainda chamam `deletePost(postId)`. |
| Comentários | Parcialmente pronto | `getCommentsByPost` filtra visibilidade do comentário, mas opera apenas por `post_id`; criação também recebe apenas `post_id`. |
| Respostas | Parcialmente pronto | UI e schema suportam `parent_id`; dependem do mesmo contrato frágil por `post_id`. |
| Reações | Parcialmente pronto | `PostEngagementService` opera por `post_id`. Funciona no caminho feliz, mas não valida território. |
| Compartilhamento | Parcialmente pronto | `postShare` preserva rota de comunidade quando já está nela, mas cai em `LAUNCH_URLS.community` fora dela. |
| Denúncia | Parcialmente pronto | `CommunityReportService` registra target por ID. Não há vínculo territorial obrigatório no payload do relatório. |
| Moderação | Parcialmente pronto | Existem filas e estatísticas, mas a fila não é claramente territorializada por `ResolvedTerritory`. |
| Anexos | Parcialmente pronto | Imagens no composer moderno existem; anexos genéricos e contrato de mídia do Feed ainda não estão consolidados. |
| Hashtags | Parcialmente pronto | Tags aparecem em UI e estado de filtro, mas não há evidência de aplicação completa na query principal. |
| Localização | Parcialmente pronto | Lista principal usa `TerritoryFilter`; criação e serviços auxiliares ainda aceitam fallback. |
| Filtros | Parcialmente pronto | Escopo, abas e sort existem. Alguns filtros parecem somente client/UI ou incompletos. |
| Ordenação | Parcialmente pronto | Ordenação client-side e engine de reequilíbrio operam sobre páginas já carregadas; pode não refletir ranking global real. |
| Paginação | Pronto com ressalvas | `useInfiniteQuery`, cursor e `InfiniteScrollTrigger` existem. Performance em cidade/grupo ainda depende de expansão territorial. |
| Realtime | Não pronto | Existe apenas `subscribeNewPost` local para highlight após criação. Não há assinatura realtime da timeline. |
| Notificações | Parcialmente pronto | Há migrations/serviços de notificação social, mas o Feed não expõe contrato de notificação domínio-a-domínio auditável. |

## Integração Com Territory

| Caminho | Estado | Análise |
| --- | --- | --- |
| `ComunidadePage` | Parcialmente pronto | Usa `useResolveTerritoryFromUrl`, `useModuleTerritoryFilter`, `resolveCommunityFeedTerritoryFilter` e `useCommunityAccess`. É o melhor caminho atual. |
| `CommunityFeed` | Parcialmente pronto | Recebe `territoryFilter` e passa para `useCommunityFeedSimple`. Depois filtra posts por launch surface global. |
| `useCommunityFeedSimple` | Pronto no caminho nominal | Só executa se o filtro estiver pronto e chama `postService.getFeed` com `location_id` ou `location_ids`. |
| `posts.feed.queries.getFeed` | Pronto no caminho nominal | Recusa query sem localização e filtra `is_published`, `is_hidden`, `is_removed`. |
| `posts.queries.getPostById` | Não pronto | Busca por ID sem `TerritoryFilter` e sem filtros de publicação/ocultação/remoção no client. |
| `comments.*` | Parcialmente pronto | Comentários dependem do post já ter sido autorizado; o contrato próprio não recebe território. |
| `PostEngagementService` | Parcialmente pronto | Ações por `post_id`; depende da origem da tela. |
| `/novo-post` | Não pronto | Não recebe território resolvido da rota; o modal usa `useTerritoryFilter()` sem parâmetro de rota. |
| `useCommunityPosts` de mobilidade | Não pronto | Busca `ride_share` por tipo com search, sem `location_id`; `getPostsByType` só filtra território se o chamador passar `location_id`. |
| Busca federada | Parcialmente pronto | `BuscaPage` e `BuscarPage` passam filtro territorial. `SearchService` e providers aceitam filtro, mas resultados de post não têm navegação canônica. |

### Risco de Vazamento Territorial

Existe risco real de vazamento territorial em serviços reutilizáveis:

- leitura de post por ID fora de `TerritoryFilter`;
- comentários e engajamento por `post_id` dependentes da autorização prévia do post;
- posts de mobilidade consultados sem `location_id`;
- compartilhamento fora de rota comunitária usando fallback global;
- `/novo-post` publicando a partir de contexto global/perfil, não do território resolvido da rota.

Mesmo que RLS bloqueie parte desses cenários, o domínio Feed ainda não cumpre a regra de governança: o caminho de aplicação não consegue demonstrar isolamento por território.

## UX

| Item | Estado | Observação |
| --- | --- | --- |
| Loading | Parcialmente pronto | Skeletons e loaders existem, mas são diferentes entre Feed, busca, overview e comentários. |
| Empty state | Parcialmente pronto | Há empty states oficiais em alguns pontos; outros usam mensagens locais. |
| Erro | Parcialmente pronto | Alertas existem, mas retry não é consistente no Feed principal. |
| Offline | Parcialmente pronto | Rascunho de post tem persistência/offline. A timeline não tem estado offline completo. |
| Skeleton | Parcialmente pronto | Existe skeleton de card e loading de feed, mas sem padrão único por domínio. |
| Retry | Parcialmente pronto | `FeedStates` possui retry, mas o caminho principal usa tratamento próprio. |
| Scroll | Parcialmente pronto | Infinite scroll existe; falta avaliação de virtualização para feeds longos. |
| Mobile | Parcialmente pronto | A experiência é mobile-first em várias telas, mas há componentes duplicados com padrões diferentes. |
| Desktop | Parcialmente pronto | Overview e sidebar existem; Feed independente não tem refinamento completo de densidade/layout. |
| Acessibilidade | Parcialmente pronto | Há `aria-label` em botões de busca e navegação, mas cards clicáveis, menus e ações duplicadas precisam de revisão completa. |

## Navegação

| Item | Estado | Observação |
| --- | --- | --- |
| Botões principais | Parcialmente pronto | Criar, comentar, reagir, salvar, compartilhar e denunciar existem. Nem todos respeitam o mesmo gate de acesso/território. |
| Links | Parcialmente pronto | Links de módulos usam helpers em parte; compartilhamento e rotas antigas ainda têm fallback global. |
| Rotas | Parcialmente pronto | Rotas comunitárias existem; `/p/:slug` está documentada como post mas implementada como premium business. |
| CTAs | Parcialmente pronto | CTAs de criar post podem abrir modal territorial no caminho principal, mas `/novo-post` é global. |
| FABs | Parcialmente pronto | Botões flutuantes existem em `CommunityFloatingButtons`, mas dependem de permissões passadas pela página. |
| Menus | Parcialmente pronto | Menu de post existe; ações precisam de contrato único para edição/exclusão/denúncia. |

## Findings P0

### FEED-P0-01 - Leitura de post por ID não é territorial

- Impacto: alto.
- Esforço estimado: médio.
- Risco: alto.
- Dependências: `PostService`, detalhe de post, compartilhamento, comentários, RLS, testes de isolamento.
- Evidência: `src/core/posts/services/posts.queries.ts:88`.
- Problema: `getPostById(postId)` consulta apenas por `id`. Não recebe `ResolvedTerritory`, `TerritoryFilter`, `location_id` ou flags de visibilidade no client.
- Consequência: qualquer tela, modal ou deep-link que use `post_id` não consegue provar que o post pertence ao território atual.

### FEED-P0-02 - `/novo-post` bypassa o território resolvido

- Impacto: alto.
- Esforço estimado: médio.
- Risco: alto.
- Dependências: rotas públicas, composer, access policy, rollout, URLs territoriais.
- Evidência: `src/core/community/pages/NovoPostPage.tsx:8`, `src/core/community/components/composer/CreatePostModal.tsx:436`.
- Problema: a rota direta exige autenticação, mas não resolve o território da URL nem injeta o `ResolvedTerritory` alvo no composer. O modal usa `useTerritoryFilter()` global e fallback de perfil.
- Consequência: o usuário pode criar post fora do território de navegação esperado ou em território cujo rollout específico não foi aplicado pelo caminho da rota.

### FEED-P0-03 - Posts de mobilidade podem vazar entre bairros

- Impacto: alto.
- Esforço estimado: baixo a médio.
- Risco: alto.
- Dependências: módulo Mobility, PostService, TerritoryFilter.
- Evidência: `src/modules/mobility/hooks/useCommunityPosts.ts:43`, `src/core/posts/services/posts.queries.ts:212`.
- Problema: `useCommunityPosts` chama `getPostsByType("ride_share", { search })` sem `location_id`. `getPostsByType` só aplica território se `filters.location_id` existir.
- Consequência: caronas/solicitações locais podem aparecer globalmente entre bairros, contrariando a regra "nenhum post pode vazar entre bairros".

### FEED-P0-04 - Comentários e engajamento dependem de autorização externa do post

- Impacto: alto.
- Esforço estimado: médio.
- Risco: alto.
- Dependências: comentários, reações, salvos, compartilhamento, detalhe de post.
- Evidência: `src/core/comments/services/comments.queries.ts:108`, `src/core/comments/services/comments.mutations.ts:58`, `src/core/engagement/services/PostEngagementService.ts`.
- Problema: comentários e reações operam por `post_id`, sem receber território resolvido. Isso só é seguro se todo caminho anterior de acesso ao post já for territorialmente seguro.
- Consequência: enquanto `getPostById` e deep-links não forem territorializados, comentários/reações herdam o mesmo risco.

## Findings P1

### FEED-P1-01 - O Feed não possui SSOT claro

- Impacto: alto.
- Esforço estimado: médio a alto.
- Risco: médio.
- Dependências: `core/community`, `core/posts`, `core/comments`, `core/engagement`, `core/search`, `modules/mobility`.
- Problema: a timeline, o modelo de post, comentários, engajamento, busca, moderação e mobilidade estão distribuídos entre domínios diferentes sem um boundary explícito de Feed.
- Consequência: fica difícil congelar o domínio, pois novas features podem escolher serviços permissivos por ID em vez do caminho territorial canônico.

### FEED-P1-02 - Existem mutations seguras e inseguras coexistindo

- Impacto: alto.
- Esforço estimado: médio.
- Risco: médio.
- Dependências: PostService, hooks legados, composer, RLS.
- Evidência: `src/core/posts/services/posts.mutations.ts:258`, `src/core/posts/services/posts.mutations.ts:305`, `src/core/posts/services/posts.mutations.ts:328`.
- Problema: `deletePostByAuthor` é mais seguro, mas `updatePost` e `deletePost` por ID continuam disponíveis e hooks legados ainda os usam.
- Consequência: o domínio não possui contrato único para edição/exclusão com autor, território e visibilidade.

### FEED-P1-03 - Rollout não é universal em todos os caminhos do Feed

- Impacto: alto.
- Esforço estimado: médio.
- Risco: médio.
- Dependências: RolloutService, CommunityAccessPolicy, rotas, composer.
- Evidência: `CommunityRolloutService` aceita `ResolvedTerritory`, mas `CommunityRolloutGate` usa hook global e `/novo-post` não injeta rota resolvida.
- Problema: o caminho principal usa access policy, mas rotas e componentes auxiliares não obrigam o rollout territorial.
- Consequência: ativar/desativar um bairro por rollout não é garantia suficiente para todos os módulos do Feed.

### FEED-P1-04 - Compartilhamento e detalhe não têm URL canônica de Feed

- Impacto: médio a alto.
- Esforço estimado: médio.
- Risco: médio.
- Dependências: roteamento, SEO/social share, detalhe de post, docs.
- Evidência: `src/core/posts/utils/postShare.ts:42`, `docs/SCREEN-MAP.md`, `src/app/routes/sections/AppLayoutRoutes.tsx:400`.
- Problema: `postShare` cai em `LAUNCH_URLS.community` fora de rota comunitária. A documentação aponta `/p/:slug` como detalhe de post, mas a rota real é mini-site premium.
- Consequência: compartilhamento pode perder território e o domínio não tem contrato de deep-link para post.

### FEED-P1-05 - Moderação não é claramente territorial

- Impacto: médio a alto.
- Esforço estimado: médio.
- Risco: médio.
- Dependências: CommunityReportService, filas admin, roles territoriais.
- Problema: denúncias e filas operam por target e painéis globais. Não há evidência de fila por `ResolvedTerritory`/comunidade no contrato principal.
- Consequência: moderadores territoriais podem não ter fronteira clara por bairro/comunidade.

### FEED-P1-06 - Realtime do Feed não está implementado

- Impacto: médio.
- Esforço estimado: médio.
- Risco: baixo a médio.
- Dependências: Supabase Realtime, query invalidation, políticas de visibilidade.
- Evidência: `CommunityFeed` usa `subscribeNewPost` local.
- Problema: há apenas evento local para highlight após criação no mesmo cliente.
- Consequência: novos posts de outros usuários não entram em tempo real sem refresh/refetch.

### FEED-P1-07 - Busca de posts é territorial no caller principal, mas incompleta como experiência de Feed

- Impacto: médio.
- Esforço estimado: baixo a médio.
- Risco: médio.
- Dependências: SearchService, SearchDocumentMapper, roteamento de post.
- Evidência: `BuscaPage` passa `territoryFilter`, `searchProviders` chama `searchPublicPosts`, mas posts mapeados têm `target_url: null`.
- Problema: a busca respeita território no caminho principal, mas resultado de post não navega para detalhe canônico.
- Consequência: o usuário encontra posts, mas não há jornada de Feed completa.

## Findings P2

### FEED-P2-01 - Filtros e hashtags não estão completamente aplicados

- Impacto: médio.
- Esforço estimado: médio.
- Risco: baixo.
- Dependências: `useCommunityFiltersAAA`, query de feed, UI de tags.
- Problema: estado de filtro de tag/tipo existe, mas não há evidência de que todos os filtros sejam aplicados na consulta principal.

### FEED-P2-02 - Ordenação e engine de ranking são client-side

- Impacto: médio.
- Esforço estimado: médio.
- Risco: médio.
- Dependências: `useUnifiedFeed`, `territorialFeedEngine`, query de posts.
- Problema: ordenar/rebalancear depois da paginação pode mostrar uma ordem parcial, não o ranking real do território inteiro.

### FEED-P2-03 - Componentes de post duplicados

- Impacto: médio.
- Esforço estimado: médio.
- Risco: médio.
- Dependências: UI do Feed, cards legados, testes visuais.
- Problema: existem `UnifiedPostCard`, `core/community/components/PostCard`, `core/community/components/cards/PostCard` e `core/posts/components/PostCard`.
- Consequência: inconsistência visual e risco de ações divergentes por card.

### FEED-P2-04 - Estados de UX estão fragmentados

- Impacto: médio.
- Esforço estimado: baixo a médio.
- Risco: baixo.
- Dependências: Feed states, shared EmptyState, Alert, skeletons.
- Problema: há `FeedStates` com retry e estados locais no `CommunityFeed`; busca, comentários e overview seguem padrões próprios.

### FEED-P2-05 - Hardcodes visuais permanecem na superfície de Feed/Community

- Impacto: médio.
- Esforço estimado: baixo.
- Risco: baixo.
- Dependências: metadata territorial, assets, CommunityOverview.
- Evidência: `communityOverviewHelpers.ts` contém mapa de imagens por slug; `CommunityOverviewSurface` habilita fixture visual via `?visualMock=community-concept`.
- Problema: não afeta o caminho nominal do feed listado, mas viola a direção de SSOT visual/territorial se for mantido como padrão evolutivo.

### FEED-P2-06 - Performance precisa de validação com dados reais

- Impacto: médio.
- Esforço estimado: médio.
- Risco: médio.
- Dependências: índices, volume de posts, cidades com muitos bairros, grupos territoriais.
- Problema: cidade/grupo expandem localização e o front faz merge/rebalanceamento. A paginação existe, mas não há evidência nesta auditoria de teste com volume real.

## Findings P3

### FEED-P3-01 - `LAUNCH_URLS` ainda aparece em código próximo ao Feed

- Impacto: baixo a médio.
- Esforço estimado: baixo.
- Risco: baixo.
- Evidência: `postShare`, hooks de URL, navegação antiga.
- Problema: alguns usos são fallback, mas a governança pede evitar fallback global como caminho nominal.

### FEED-P3-02 - Documentação de tela está defasada para detalhe de post

- Impacto: baixo.
- Esforço estimado: baixo.
- Risco: baixo.
- Problema: `SCREEN-MAP.md` descreve `/p/:slug` como detalhe do post, mas a rota real é premium business.

### FEED-P3-03 - Textos e comentários com encoding degradado

- Impacto: baixo.
- Esforço estimado: baixo.
- Risco: baixo.
- Problema: alguns arquivos exibem mojibake em textos/comentários. Não bloqueia função, mas reduz qualidade e manutenção.

## Respostas Obrigatórias

### 1. O Feed possui um SSOT claro?

**Não.** O caminho de timeline tem um núcleo mais canônico, mas o domínio como um todo está dividido entre Community, Posts, Comments, Engagement, Search e Mobility, sem boundary único.

### 2. Existe duplicação de lógica?

**Sim.** Há múltiplos cards de post, múltiplos hooks de ações/filtros e variantes seguras/inseguras de mutation.

### 3. Existe acoplamento desnecessário?

**Sim.** Feed depende diretamente de Community, Posts, Comments, Engagement, Search, Mobility, Session, MultiProfile e Territory sem uma fachada única do domínio Feed.

### 4. Existe código legado?

**Sim.** Hooks como `useUpdatePost`, `useDeletePost`, cards duplicados e rotas/documentação antigas indicam legado ativo ou semiativo.

### 5. Existe hardcode?

**Sim.** Há `LAUNCH_URLS` em caminhos próximos ao Feed, imagens por slug na superfície Community e fixture visual ativável por query param.

### 6. Existe vazamento territorial?

**Sim, ou pelo menos o contrato atual permite vazamento.** O caso mais objetivo é mobilidade usando `getPostsByType` sem `location_id`. Também há risco estrutural por leitura/ações baseadas apenas em `post_id`.

### 7. Existe funcionalidade incompleta?

**Sim.** Realtime, detalhe canônico de post, filtros/hashtags, moderação territorial e notificação de Feed não estão completos.

### 8. Existe inconsistência visual?

**Sim.** Cards, estados, composer, overview e componentes legados seguem padrões diferentes.

### 9. Existe débito técnico?

**Sim.** O débito principal é de fronteira de domínio e contrato territorial, não apenas UI.

### 10. O Feed pode ser considerado um domínio independente?

**Não.** Hoje ele é uma composição de Community + Posts + Comments + Engagement + Search + módulos satélites. Ainda não tem independência suficiente para congelamento.

## Prontidão Por Bloco

| Bloco | Estado |
| --- | --- |
| Timeline territorial principal | Parcialmente pronto |
| Criação de post no contexto correto | Parcialmente pronto |
| Criação por rota direta `/novo-post` | Não pronto |
| Detalhe/deep-link de post | Não pronto |
| Comentários/respostas | Parcialmente pronto |
| Reações/salvos | Parcialmente pronto |
| Compartilhamento | Parcialmente pronto |
| Denúncia/moderação | Parcialmente pronto |
| Busca de posts | Parcialmente pronto |
| Mobilidade usando posts | Não pronto |
| Realtime | Não pronto |
| Notificações | Parcialmente pronto |
| UX base | Parcialmente pronto |
| Acessibilidade | Parcialmente pronto |
| Performance | Parcialmente pronto |

## Conclusão

O caminho principal do Feed já demonstra intenção correta de SSOT territorial, mas o domínio ainda não está pronto para congelamento. O bloqueio não é a falta de componentes visuais; é a existência de múltiplos caminhos que operam por `post_id`, perfil ou fallback global sem exigir o território resolvido.

Antes de congelar o Feed, o projeto precisa definir um boundary único para leitura, criação, detalhe, comentários, engajamento, compartilhamento e moderação de posts territoriais. Todo caminho público deve receber ou derivar `ResolvedTerritory` de forma oficial, e todo serviço reutilizável precisa falhar fechado quando o território não estiver presente.

**O domínio Feed ainda precisa de reestruturação.**
