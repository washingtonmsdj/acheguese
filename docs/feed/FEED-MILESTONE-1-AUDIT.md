# FEED-MILESTONE-1-AUDIT.md

Sprint: FEED.MILESTONE.1.AUDIT

Status: auditoria arquitetural pos-Milestone 1

Base obrigatoria:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-MILESTONE-1.md`

Regra de escopo: este documento nao revisa as sprints P0 ja concluidas, nao implementa codigo, nao altera arquitetura, nao altera governanca, nao altera roadmap e nao modifica documentacao existente. Ele registra exclusivamente se existe fundamento arquitetural ausente antes do inicio da P0.D.1 de comentarios.

## 1. Veredito arquitetural

O dominio Feed ainda precisa de um ajuste antes de iniciar comentarios.

Existe um bloqueador arquitetural em Feed Cache: os hooks canonicos de timeline e detalhe desabilitam a query quando o `FeedContext` fica invalido, mas ainda retornam dados previamente existentes em cache para a mesma `queryKey`.

Esse comportamento enfraquece a premissa da P0.D.1, porque comentarios devem herdar um item pai validado pelo Feed. Se o detalhe ou timeline puder reapresentar um item depois de rollout/access/contexto ficarem invalidos, a migracao de comentarios pode nascer sobre um gate instavel.

## 2. Matriz de auditoria

| Area auditada | Estado | Classificacao | Evidencia |
| --- | --- | --- | --- |
| FeedService | Parcialmente pronto | Recomendacao | `listTimeline`, `getDetail`, `createItem` e `listRideShareItems` existem e validam contexto; metodos de comentarios ainda nao existem, como previsto para P0.D.1. |
| FeedRepository | Parcialmente pronto | Recomendacao | Encapsula Posts para timeline, detalhe, criacao e `ride_share`; ainda nao possui adapter interno para `CommentService`, previsto para P0.D.1. |
| FeedContext | Parcialmente pronto | Recomendacao | Contem `ResolvedTerritory`, `TerritoryFilter`, rollout e policy; policy ainda tem apenas `canViewTimeline` e `canCreateItem`. |
| FeedTarget | Parcialmente pronto | Recomendacao | Tipo aceita `item`, `comment`, `reply` e `attachment`, mas `isFeedTargetReady()` valida apenas `item`. |
| FeedQueryKeys | Parcialmente pronto | Bloqueador em cache | Timeline e detalhe possuem chave territorial, mas hooks nao mascaram dados de cache quando o contexto fica invalido. |
| Feed Authority | Parcialmente pronto | Recomendacao | `CommunityAccessAuthority` atende fluxos nao-React de criacao; comentarios ainda precisam mapear policy por acao. |
| Feed Rollout | Pronto para operacoes migradas | Melhoria futura | `validateFeedContext()` bloqueia rollout pendente/inativo; comentarios devem reutilizar a mesma validacao. |
| Feed AccessPolicy | Parcialmente pronto | Recomendacao | Community ja possui `can.comment`, mas `FeedPolicyDecision` ainda nao expõe decisao granular de comentario. |
| Feed Cache | Nao pronto | Bloqueador | `useFeedTimeline` e `useFeedItemDetail` podem retornar `query.data` mesmo com `queryEnabled=false`. |
| Feed URLs | Parcialmente pronto | Melhoria futura | Deep-link atual por `?post=<id>` e suficiente para P0.D.1; URL canonica final continua em P1.B. |
| Feed Deep Links | Parcialmente pronto | Recomendacao | Detalhe passa pelo Feed, mas comments modal separado ainda recebe apenas `postId`. |
| Feed Mutations | Parcialmente pronto | Recomendacao | Criacao esta no Feed; comentarios, reacoes, share, edicao e delete seguem em sprints futuras. |
| Feed Timeline | Parcialmente pronto | Bloqueador em cache | Boundary esta correto, mas o hook precisa falhar fechado tambem no retorno derivado de cache. |
| Feed Detail | Parcialmente pronto | Bloqueador em cache | `FeedService.getDetail()` e correto; o hook pode expor detail cacheado com contexto invalido. |
| Feed Create | Pronto para o Milestone 1 | Melhoria futura | `FeedService.createItem()` e authority nao-React estao consolidados para criacao. |
| Feed Mobility | Pronto para leitura `ride_share` | Melhoria futura | `useCommunityPosts()` ja mascara cache invalido; comentarios/reacoes de Mobility seguem fora da P0.E. |
| Territory Integration | Parcialmente pronto | Recomendacao | `ResolvedTerritory` e `TerritoryFilter` sao usados; P0.D deve manter item pai validado antes de acessar Comments. |

## 3. Achados classificados

### FMA-B1 - Cache canonico nao falha fechado em timeline e detalhe

Classificacao: Bloqueador.

Evidencia:

- `src/core/feed/hooks/useFeedTimeline.ts:21` valida contexto.
- `src/core/feed/hooks/useFeedTimeline.ts:35` desabilita query quando contexto nao esta pronto.
- `src/core/feed/hooks/useFeedTimeline.ts:40` ainda monta `posts` a partir de `query.data`.
- `src/core/feed/hooks/useFeedItemDetail.ts:46` valida contexto.
- `src/core/feed/hooks/useFeedItemDetail.ts:66` desabilita query quando contexto/target nao estao prontos.
- `src/core/feed/hooks/useFeedItemDetail.ts:73` ainda retorna `query.data ?? unavailableDetail`.

Impacto:

- Se o mesmo `territoryFilter` e target ja tiverem dados em cache e depois rollout/access/contexto ficarem invalidos, o hook pode continuar expondo dados anteriores.
- P0.D.1 depende do item pai validado para listar/criar comentarios. Se o detalhe cacheado puder aparecer sem contexto valido, comentarios podem ser migrados sobre um gate incompleto.
- O Milestone 1 ja definiu que nenhum cache territorial pode reapresentar conteudo quando o contexto deixar de ser valido; Mobility ja aplicou esse hardening em `useCommunityPosts`.

Correcao esperada antes da P0.D:

- `useFeedTimeline()` deve retornar lista vazia quando `contextValidation.isReady` for falso, independentemente do cache.
- `useFeedItemDetail()` deve retornar `unavailableDetail` quando `contextValidation.isReady` for falso ou `targetReady` for falso, independentemente do cache.
- Adicionar testes com cache pre-existente + `FeedContext` invalido para timeline e detalhe.

### FMA-R1 - FeedPolicyDecision ainda nao possui granularidade para comentarios

Classificacao: Recomendacao.

Evidencia:

- `src/core/feed/types.ts:50` define `FeedPolicyDecision`.
- `src/core/feed/types.ts:52-53` possui `canViewTimeline` e `canCreateItem`.
- `src/core/community/pages/ComunidadePage.tsx:352` usa `communityAccess.can.comment` fora do Feed para bloquear UI.
- `src/core/community/access/CommunityAccessPolicy.ts` ja possui decisoes como `can.comment`, `can.react`, `can.save` e `can.report`.

Impacto:

- P0.D.1 precisa decidir se `FeedPolicyDecision` sera estendido com `canComment`, `canReply`, `canUpdateComment` e `canDeleteComment`, ou se cada operacao recebera uma `FeedOperation` que extrai a decisao da policy.
- Se essa decisao nao for tomada no inicio da P0.D, ha risco de duplicar regras entre Community UI, FeedService e Comment hooks.

Encaminhamento:

- Nao bloqueia isoladamente o inicio da P0.D se for tratado como primeira decisao tecnica da sprint.
- Deve ser resolvido antes de implementar `FeedService.createComment()`.

### FMA-R2 - Comments modal ainda abre por `postId` cru

Classificacao: Recomendacao.

Evidencia:

- `src/core/community/components/page/CommunityModals.tsx:198-205` passa `postId` para `CommentsModal`.
- `src/core/community/components/CommentsModal.tsx:45-50` passa `postId` para `PostCommentsPanel`.
- `src/core/community/components/comments/PostCommentsPanel.tsx:61-64` inicializa hooks de comentarios por `postId`.

Impacto:

- A P0.D.1 deve trocar o contrato publico do painel/modal para receber `FeedContext` + `FeedTarget` validado, ou um objeto de detalhe validado pelo Feed, antes de chamar Comments internamente.
- Manter `postId` como unico contrato perpetua o risco descrito na GOVERNANCE para `getCommentsByPost(postId)` e `createComment({ post_id })`.

Encaminhamento:

- E exatamente o trabalho esperado de P0.D.1, nao uma sprint previa separada.
- Deve ser implementado antes de migrar `CommentService` para adapter interno.

### FMA-R3 - Query key de comentarios ainda nao e territorial

Classificacao: Recomendacao.

Evidencia:

- `src/core/community/hooks/useCommentInteractions.ts:153` invalida `["comments", postId]`.
- Os hooks de comentarios mantem estado local e nao usam `feedQueryKeys`.

Impacto:

- Comentarios podem ter invalidacao por `postId` sem distinguir Territory, rota, target validado ou contexto.
- Para P0.D.1, o cache de comentarios deve ser derivado de `feedQueryKeys.detail()` ou de uma nova chave canonica `feedQueryKeys.comments(territoryFilter, target)`.

Encaminhamento:

- Deve ser parte da implementacao da P0.D.1.
- Nao exige decisao fora da governanca existente.

### FMA-R4 - Acoes de post e share continuam fora do Feed

Classificacao: Recomendacao.

Evidencia:

- `src/core/posts/hooks/usePostActions.ts:102-114` usa `PostEngagementService` por `postId`.
- `src/core/posts/hooks/usePostActions.ts:219-228` usa share com `postService.recordPostShare(postId)`.
- `src/core/posts/utils/postShare.ts:42` ainda possui fallback para `LAUNCH_URLS.community`.
- `src/core/posts/hooks/usePostActions.ts:246` usa `PostsFacade.mutations.deletePostByAuthor(postId, profileContext.id)`.

Impacto:

- Risco direto para P0.D.2, P0.D.3 e P1, nao para comentarios P0.D.1.
- O componente de detalhe usa o item validado pelo Feed, mas as acoes ainda nao usam `FeedTarget` validado.

Encaminhamento:

- Nao deve ser antecipado em P0.D.1.
- Deve permanecer registrado para P0.D.2/P0.D.3/P1 conforme roadmap.

### FMA-M1 - CommentService continua sendo SSOT atomico de comentarios

Classificacao: Melhoria futura.

Evidencia:

- `src/core/comments/services/CommentService.ts` expoe consultas e mutations atomicas.
- `src/core/comments/services/comments.queries.ts:108` lista comentarios por `postId`.
- `src/core/comments/services/comments.mutations.ts:58` cria comentario por `post_id`.

Impacto:

- Isso nao e erro no dominio Comments; e o desenho esperado: Comments e colaborador atomico.
- O erro arquitetural so acontece quando UI/hooks publicos chamam Comments diretamente para experiencia de Feed.

Encaminhamento:

- P0.D.1 deve preservar `CommentService` como dependencia interna do Feed Repository ou adapter de Feed.

## 4. Respostas obrigatorias

### 1. Existe algum bloqueador arquitetural antes da P0.D?

Sim.

O bloqueador e o cache fail-closed incompleto em `useFeedTimeline()` e `useFeedItemDetail()`. Antes de comentarios, o item pai validado pelo Feed precisa ser confiavel mesmo quando rollout, AccessPolicy ou Territory deixam de estar prontos.

### 2. Existe algum boundary ainda incompleto?

Sim.

O boundary de comentarios ainda esta incompleto por definicao do roadmap. UI e hooks ainda usam `CommentService` por `postId`; P0.D.1 deve migrar esse caminho para `FeedService.listComments()` e `FeedService.createComment()` com target validado.

Tambem seguem incompletos, mas fora de P0.D.1:

- reacoes;
- saves;
- share;
- edicao/exclusao;
- denuncias;
- busca;
- realtime.

### 3. Existe alguma duplicacao escondida?

Sim.

Ha duplicacao de decisao de access no nivel de UI:

- `CommunityAccessPolicy` possui `can.comment`;
- `ComunidadePage` bloqueia comentario por `communityAccess.can.comment`;
- `FeedPolicyDecision` ainda nao representa permissao granular de comentario.

Se P0.D.1 nao centralizar isso no Feed, a regra pode ficar duplicada entre UI e service.

### 4. Existe algum acoplamento inadequado entre Feed e Community?

Parcialmente.

O acoplamento atual com Community e aceitavel enquanto Feed consome `CommunityAccessPolicy` como autoridade. O risco aparece se Feed passar a importar detalhes de UI ou replicar regras de membership.

Para P0.D.1, Feed deve continuar consumindo a decisao de Community, nao recriar regras de comunidade.

### 5. Existe algum risco para comentarios, reacoes ou share?

Sim.

Para comentarios:

- risco bloqueador de cache em detalhe/timeline;
- risco de manter `postId` cru em `PostCommentsPanel`;
- risco de cache `["comments", postId]` nao territorial.

Para reacoes:

- `usePostActions` e `useCommentInteractions` ainda usam services atomicos por ID, previsto para P0.D.2.

Para share:

- `postShare` ainda tem fallback global, previsto para P0.D.3/P1.B.

### 6. Existe alguma decisao de arquitetura que deveria ser tomada agora?

Sim.

Antes de codar comentarios, a sprint P0.D.1 deve fixar a decisao de contrato:

- comentario publico recebe `FeedContext` + `FeedTarget` do item pai;
- `FeedService` valida item pai via detalhe/target antes de chamar Comments;
- `CommentService` fica apenas como colaborador interno;
- query key de comentarios passa a ser territorial;
- AccessPolicy granular de comentario deve vir da autoridade Community, sem regra fabricada no Feed.

Essa decisao nao exige alterar GOVERNANCE, porque ja esta prevista nela.

### 7. O Milestone 1 realmente permite iniciar a implementacao de comentarios sem retrabalho?

Ainda nao.

O Milestone 1 fornece o boundary, target, contexto e detalhe necessarios, mas o hardening de cache precisa ser feito antes da P0.D.1 para evitar retrabalho no gate do item pai.

Depois desse ajuste, a P0.D.1 pode iniciar sem redesenhar a arquitetura.

## 5. Checklist minimo antes da P0.D.1

Obrigatorio antes de iniciar comentarios:

- Corrigir `useFeedTimeline()` para nao retornar dados cacheados quando `FeedContext` for invalido.
- Corrigir `useFeedItemDetail()` para nao retornar detail cacheado quando `FeedContext` ou `FeedTarget` forem invalidos.
- Adicionar testes de cache pre-existente + contexto invalido para timeline e detalhe.

Primeiro passo dentro da P0.D.1:

- Definir `FeedCommentInput`, `FeedCommentResult` e query key territorial de comentarios.
- Estender ou adaptar `FeedPolicyDecision` para decisao granular de comentario.
- Migrar `PostCommentsPanel` para receber contexto/target validado, nao apenas `postId`.

Nao antecipar agora:

- reacoes;
- saves;
- share;
- URL canonica final;
- moderacao;
- realtime;
- edicao/exclusao.

## 6. Conclusao

O dominio Feed possui a base arquitetural correta para comentarios, mas ainda nao deve iniciar P0.D.1 enquanto timeline/detalhe puderem reapresentar cache com `FeedContext` invalido.

Status final: o dominio Feed ainda precisa de ajustes.
