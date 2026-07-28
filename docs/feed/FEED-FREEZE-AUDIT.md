# FEED.FREEZE.AUDIT

Data: 2026-07-27

Status: o dominio Feed ainda nao pode entrar em Freeze.

## Base obrigatoria

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-GOVERNANCE-CHANGELOG.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-MILESTONE-1.md`
- `docs/architecture/PROJECT-MILESTONE-1.md`
- relatorios P0.A, P0.B, P0.C, P0.D.1, P0.D.2, P0.D.3 e P0.E, incluindo reviews e hardenings existentes.

## Metodo

A auditoria foi estatica e documental.

Foram inspecionados os boundaries de `src/core/feed`, os hooks publicos de Community, Mobility, Profile e Search, os residuos de `PostService`, `PostsFacade`, `CommentService`, `PostEngagementService`, `CommunityReportService`, `postShare.ts`, query keys e caminhos de deep-link.

Nao foram executadas suites de runtime porque esta sprint nao altera codigo. A evidencia desta auditoria vem de leitura de arquivos, `rg`, `Select-String` e comparacao com os documentos oficiais.

## Resultado executivo

O nucleo P0 do Feed esta consistente para os fluxos ja migrados:

- timeline territorial;
- detalhe e deep-link `?post=<id>`;
- criacao publica de novo post;
- comentarios de primeiro nivel em item validado;
- reacoes de like;
- saves;
- share minimo sem `/comunidade` global;
- leitura publica de `ride_share`;
- cache com falha fechada nos hooks canonicos;
- `FeedContext` sem defaults permissivos de Rollout ou AccessPolicy.

Entretanto, Freeze completo ainda nao e possivel.

O proprio `FEED-ROADMAP.md` declara que todos os P0 concluidos nao bastam para Freeze. O congelamento depende de P1 para SSOT completo, mutations seguras, rollout universal, URL canonica, moderacao territorial e busca de posts com destino canonico. A auditoria encontrou esses pontos ainda materializados no codigo.

## Matriz de auditoria

| Area | Status | Evidencia |
| --- | --- | --- |
| FeedService | Parcial para Freeze | Possui `listTimeline`, `getDetail`, `createItem`, `listComments`, `createComment`, `listReactions`, `react`, `saveItem`, `shareItem` e `listRideShareItems`. Nao possui `updateItem`, `deleteItem`, `hideItem` ou `reportTarget`, previstos pela GOVERNANCE. |
| FeedRepository | Parcial para Freeze | Encapsula Posts/Comments/Engagement para fluxos P0 migrados. Ainda nao cobre mutations restantes nem denuncia/moderacao. |
| FeedContext | Pronto no escopo P0 | `validateFeedContext()` exige `ResolvedTerritory`, `TerritoryFilter`, Rollout e AccessPolicy por padrao. Estados unknown/pending falham fechado. |
| FeedTarget | Parcial para Freeze | Existe como tipo canonico e valida `item`. Ainda nao cobre de forma completa targets operacionais de denuncia, poll vote, update/delete ou moderation target. |
| FeedQueryKeys | Parcial para Freeze | Chaves canonicas cobrem timeline, detail, ride_share, comments, reactions e share por `TerritoryFilter`. Busca, notificacoes e algumas queries legadas nao estao integradas. |
| Timeline | Pronta no escopo P0 | `useFeedTimeline()` retorna `posts=[]` e `total=0` quando `FeedContext` deixa de estar pronto. |
| Detail | Parcial para Freeze | A abertura passa por `useFeedItemDetail()`/`FeedService.getDetail()`. O enriquecimento em `usePostById()` ainda consulta interacoes e poll via `postService` fora do Feed. |
| Create | Pronta para criacao nova; parcial para Freeze | Novo post passa por `FeedService.createItem()`. Edicao ainda chama `postService.updatePost()` diretamente. |
| Comments | Parcial para Freeze | Leitura/criacao em painel/modal passam pelo Feed. Denuncia de comentario ainda passa por `CommunityReportService` fora do Feed. Profile read-only esta coberto pela excecao oficial. |
| Reactions | Parcial para Freeze | Like passa pelo Feed. Voto de poll ainda usa `PostsFacade.polls` diretamente, embora GOVERNANCE inclua "votar" no boundary de Reacoes. |
| Saves | Pronto no escopo P0 | `saveItem()` e hooks publicos migrados falham fechado com context/target invalidos. |
| Share | Parcial para Freeze | Share minimo passa pelo Feed e rejeita `/comunidade` raiz. URL canonica completa e busca/notificacao ainda seguem P1.B/P1.04/P1.07. |
| Mobility | Pronto no escopo P0.E | `ride_share` read usa `FeedService.listRideShareItems()` e cria via FeedContext operacional. Mobility completo nao esta congelado como dominio. |
| Rollout | Parcial para Freeze | Fluxos migrados respeitam Rollout. Roadmap ainda exige P1 rollout universal para todo caminho publico. |
| AccessPolicy | Parcial para Freeze | Fluxos migrados usam `CommunityAccessPolicy`/authority. Mutations e denuncias restantes ainda nao passam por AccessPolicy de Feed. |
| Territory Integration | Parcial para Freeze | Fluxos P0 validam `ResolvedTerritory` x `TerritoryFilter`. Busca, denuncia e mutations restantes ainda nao carregam todo contexto territorial. |
| Cache | Pronto no core migrado | Timeline, detail, comments, reactions e ride_share nao reapresentam cache quando `FeedContext` fica invalido. Nao ha garantia equivalente para caminhos legados fora do Feed. |
| Deep Links | Parcial para Freeze | `?post=<id>` funciona sobre base territorial validada. URL canonica final ainda nao esta congelada. |
| Boundaries | Parcial para Freeze | Boundary P0 existe, mas o boundary completo definido na GOVERNANCE ainda nao foi implementado para edicao, exclusao, denuncia, poll vote, busca e notificacao. |

## Findings

### Bloqueador - FRZ-B1 - Edicao e exclusao publicas ainda bypassam o Feed

Evidencias:

- `src/core/community/components/composer/CreatePostModal.tsx:972` chama `postService.updatePost(editPostId, { content: payload.content })`.
- `src/core/posts/hooks/usePostActions.ts:297` chama `PostsFacade.mutations.deletePostByAuthor(postId, profileContext.id)`.
- `src/core/community/hooks/page/useComunidadePage.ts` conecta `deletePost()` ao fluxo publico de confirmacao de exclusao.
- `src/modules/profile/components/UserPostsGrid.tsx` usa `usePostActions()` sem `FeedContext` e repassa `deletePost` para posts do proprio perfil.

Impacto:

Alto. Edicao/exclusao por ID puro nao provam autor, territorio, rollout, access policy nem visibilidade atual dentro do Feed Service.

Governance afetada:

- F2: componente/hook publico nao pode chamar Posts para operacao publica de Feed.
- F5: servico publico de Feed nao pode operar apenas por `post_id`.
- Criterio de Freeze: unica porta publica para edicao e exclusao.

Dependencias:

- P1.A / P1-02: mutations seguras como unico caminho publico.

### Bloqueador - FRZ-B2 - Denuncias e moderacao territorial ainda bypassam o Feed

Evidencias:

- `src/core/community/hooks/useModeration.ts:28` reporta post via `communityReportService.report(...)`.
- `src/core/community/hooks/useModeration.ts:52` reporta comentario via `communityReportService.report(...)`.
- `src/core/community/moderation/CommunityReportService.ts:72` insere em `community_reports` diretamente por `target_id`.
- `src/core/community/components/comments/PostCommentsPanel.tsx` usa `reportCommentAsync`.
- `src/core/community/hooks/page/useComunidadePage.ts` usa `reportPostAsync`.

Impacto:

Alto. Denuncia por `post_id` ou `comment_id` nao prova que o alvo pertence ao Territory atual e nao envia ao dominio Moderation o contexto territorial exigido.

Governance afetada:

- F15: nenhuma denuncia pode ser registrada sem contexto territorial do alvo.
- `FeedService.reportTarget` esta definido como SSOT esperado, mas ainda nao existe no runtime.

Dependencias:

- P1.C / P1-05: moderacao territorial de Feed.

### Bloqueador - FRZ-B3 - Poll vote continua fora do boundary de Reacoes do Feed

Evidencias:

- `src/core/community/components/PollCard.tsx:34` usa `usePollVote`.
- `src/core/community/hooks/usePollVote.ts:85` chama `PostsFacade.polls.votePoll(...)`.
- `src/core/community/hooks/usePollVote.ts:88` chama `PostsFacade.polls.updatePollVoteCounts(...)`.

Impacto:

Medio a alto. A GOVERNANCE define Reacoes como porta publica para curtir, salvar, votar, reagir ou desfazer reacao em item de Feed. O voto de poll hoje opera por `pollId` sem `FeedContext`, `FeedTarget`, Rollout ou AccessPolicy de Feed.

Governance afetada:

- F2, F5 e boundary `Feed x Engagement`.

Dependencias:

- P1.A ou hardening especifico de Engagement/Poll dentro do Feed.

### Bloqueador - FRZ-B4 - Busca de posts ainda nao possui destino canonico territorial

Evidencias:

- `src/core/search/providers/searchProviders.ts:274` chama `searchPublicPosts(...)`.
- `src/core/search/providers/searchProviders.ts:279` mapeia posts com `target_url: null`.

Impacto:

Medio a alto. Search nao consegue abrir resultado de post em destino territorial validado, e tambem nao prova que o provider pesquisavel de Feed e o boundary oficial. O roadmap declara `FEED-P1-07` como bloqueador de Freeze quando busca de posts estiver habilitada como superficie publica.

Governance afetada:

- Regra `Feed x Search`.
- Criterio de Freeze: search result de Feed deve preservar ou revalidar Territory.

Dependencias:

- P1.B / P1-04: URL canonica.
- P1-07: busca de posts com destino canonico.

### Bloqueador - FRZ-B5 - Detalhe publico ainda possui enriquecimento fora do Feed

Evidencias:

- `src/core/community/hooks/usePostById.ts:44` abre detalhe via `useFeedItemDetail()`.
- Depois do detalhe validado, `src/core/community/hooks/usePostById.ts:70` chama `postService.getPostUserInteractions(...)`.
- `src/core/community/hooks/usePostById.ts:82` chama `postService.getPollByPostId(...)`.

Impacto:

Medio. O item pai ja foi validado pelo Feed, entao nao foi observado vazamento direto de detalhe. Ainda assim, a auditoria estatica nao fica limpa: hook publico de detalhe continua consultando Posts para dados de interacao/poll fora do Feed Repository.

Governance afetada:

- F2 e criterio de Freeze "auditoria estatica limpa".
- `FEED-ROADMAP.md` ja registra este item no hardening obrigatorio antes do Freeze.

Dependencias:

- P1.A: SSOT completo do Feed ou excecao auditavel de read model.

## Recomendacoes

### Recomendacao - FRZ-R1 - Hooks legados de update/delete continuam exportados

Evidencias:

- `src/core/community/hooks/posts/useUpdatePost.ts` chama `postService.updatePost`.
- `src/core/community/hooks/posts/useDeletePost.ts` chama `postService.deletePost`.
- `src/core/community/hooks/index.ts` ainda exporta ambos.

Nao foi encontrado caller ativo desses hooks durante a auditoria, mas a exportacao permanece como risco de reintroducao de bypass. Deve ser removida, depreciada ou migrada em P1.A.

### Recomendacao - FRZ-R2 - Widgets legados ainda consultam Posts diretamente

Evidencias:

- `src/core/community/hooks/useTrendingTopics.ts:34` chama `postService.getTopPosts`.
- `src/core/community/components/TopPostsWidget.tsx:31` chama `postService.getTopPosts`.
- `src/core/community/components/PopularTagsWidget.tsx:34` chama `postService.getPopularTags`.
- `src/core/community/components/CommunityRightSidebar.lazy.tsx` renderiza `TrendingWidget` sem `TerritoryFilter`.

Nao foi encontrado uso ativo nominal dos widgets legados principais no sidebar atual. Mesmo assim, eles devem ser removidos, migrados ou marcados como legado antes do Freeze, porque possuem fallback para territorio do usuario/perfil e nao recebem `FeedContext`.

### Recomendacao - FRZ-R3 - Util legado de share ainda contem fallback global

Evidencias:

- `src/core/posts/utils/postShare.ts` ainda usa `LAUNCH_URLS.community` quando nao esta em rota `/comunidade/...`.

Nao foi encontrado import publico ativo para esse util no fluxo atual de share. O `useShareFeedItem()` corrigido deve permanecer como unico caminho publico. O arquivo legado deve ser removido ou depreciado em P1.B/P3 para impedir regressao.

### Recomendacao - FRZ-R4 - Realtime e notificacoes ainda nao estao congelados

Evidencia documental:

- `FEED-MILESTONE-1.md` e `PROJECT-MILESTONE-1.md` mantem realtime e notification links como pendencias antes de um Freeze completo ou como excecoes auditaveis.

Nao foi identificado bloqueador novo de runtime nesta auditoria, mas Freeze completo exige implementacao ou excecao formal.

## Melhorias futuras

### Melhoria futura - FRZ-M1 - Roadmap oficial esta parcialmente defasado em status textual

`FEED-ROADMAP.md` ainda contem trechos historicos como "Proxima sprint oficial: P0.C", apesar de P0.C, P0.E, P0.D.1, P0.D.2 e P0.D.3 terem sido executadas depois. Isso nao muda a arquitetura, mas dificulta auditorias futuras.

### Melhoria futura - FRZ-M2 - Encoding degradado em textos historicos

Alguns arquivos fonte e documentos exibem caracteres degradados. Nao bloqueia o boundary do Feed, mas deveria entrar na limpeza P3 para reduzir ruido de auditoria.

## Respostas obrigatorias

### 1. Existe algum bypass restante ao Feed?

Sim.

Bypasses ativos encontrados:

- edicao por `postService.updatePost`;
- exclusao por `PostsFacade.mutations.deletePostByAuthor`;
- denuncia de post/comentario por `CommunityReportService`;
- voto de poll por `PostsFacade.polls`;
- enriquecimento de detalhe por `postService.getPostUserInteractions` e `postService.getPollByPostId`;
- busca de posts por `searchPublicPosts` sem destino canonico de Feed.

### 2. Existe algum acesso direto aos servicos internos?

Sim.

Foram encontrados acessos diretos a `postService`, `PostsFacade`, `CommunityReportService` e `searchPublicPosts` em superficies ou hooks publicos relacionados ao Feed.

`CommentService` em Profile read-only esta coberto pela `Profile Activity Exception`, desde que permaneca sem mutation e sem abrir alvo social fora do Feed.

### 3. Existe algum fallback territorial?

Sim, como residuo.

Nos hooks canonicos do Feed nao foi encontrado fallback territorial silencioso. Entretanto widgets legados como `useTrendingTopics`, `TopPostsWidget` e `PopularTagsWidget` podem cair no territorio do usuario/perfil quando nao recebem `TerritoryFilter`. Como nao foi encontrado uso ativo nominal desses widgets no sidebar atual, a classificacao e recomendacao, nao blocker principal.

### 4. Existe algum fallback global?

Sim, como residuo legado.

`src/core/posts/utils/postShare.ts` ainda contem fallback para `LAUNCH_URLS.community`. O fluxo publico atual de share usa `useShareFeedItem()` e rejeita `/comunidade` raiz, mas o util legado ainda deve ser eliminado/depreciado antes do Freeze.

### 5. Existe alguma violacao da GOVERNANCE?

Sim.

As violacoes mais relevantes sao:

- edicao/exclusao por ID puro fora do Feed;
- denuncia sem contexto territorial validado;
- poll vote fora do boundary de Reacoes do Feed;
- busca de posts sem destino canonico territorial;
- hooks publicos ainda consultando Posts para enriquecimento de detalhe.

### 6. Existe alguma violacao da arquitetura?

Sim.

A arquitetura oficial e Pages -> Hooks -> Feed Service -> Feed Repository -> Supabase/colaboradores internos. Os paths de edicao, exclusao, denuncia, poll vote e busca ainda pulam essa sequencia.

### 7. Existe duplicacao escondida?

Sim.

A duplicacao aparece principalmente em:

- `usePostById()` enriquecendo detalhe fora do Feed depois de `useFeedItemDetail()`;
- `usePostActions()` misturando actions migradas pelo Feed com delete legado por `PostsFacade`;
- widgets legados de top posts/tags/trending replicando leitura social fora de `FeedService`;
- Search consultando posts diretamente em vez de um provider canonico do Feed.

### 8. Existe cache que possa reapresentar dados sem FeedContext?

Nao foi encontrado esse problema nos hooks canonicos migrados.

`useFeedTimeline`, `useFeedItemDetail`, `useFeedComments`, `useFeedReactions`, `useShareFeedItem` e leitura de `ride_share` falham fechado quando `FeedContext`/`FeedTarget` ficam invalidos.

O risco residual esta em caminhos fora do Feed, porque eles nao usam as query keys territoriais canonicas e nao podem ser garantidos pelo boundary.

### 9. Existe algum modulo ainda usando APIs legadas?

Sim.

Community, Profile, Search e alguns widgets legados ainda possuem chamadas diretas a APIs antigas de Posts/Engagement/Moderation em cenarios relacionados ao Feed.

### 10. O dominio Feed pode ser considerado Freeze Candidate?

Nao.

O dominio esta avancado e os P0 principais consolidaram o nucleo social territorial, mas ainda nao e Freeze Candidate porque existem blockers ativos de P1 e criterios oficiais de Freeze ainda nao atendidos.

## Decisao final

O dominio Feed nao pode entrar em Freeze neste momento.

Para virar Freeze Candidate, os itens minimos sao:

1. Implementar P1.A ou sprint equivalente para remover callers publicos restantes por ID puro, incluindo edicao, exclusao, poll vote e enriquecimentos de detalhe.
2. Implementar P1.C para denuncia/moderacao territorial por `FeedService.reportTarget`.
3. Implementar P1.B/P1-07 para URL canonica e busca de posts com destino territorial validado.
4. Remover/depreciar residuos de share global e widgets legados ou registrar excecoes auditaveis.
5. Formalizar realtime/notification links como implementados ou excecao auditavel antes do Freeze completo.

Status final: o dominio Feed ainda nao pode entrar em Freeze.
