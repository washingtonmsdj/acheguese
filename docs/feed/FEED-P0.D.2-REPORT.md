# FEED-P0.D.2-REPORT.md

Data: 2026-07-27

Sprint: FEED.P0.D.2

Status: pronta para review

## 1. Escopo implementado

Implementada exclusivamente a sprint P0.D.2: reacoes, likes, saves e contadores passam pelo boundary do Feed antes de acionar o colaborador interno de Engagement.

Nao foram implementados:

- replies;
- compartilhamento;
- notificacoes;
- realtime;
- moderacao;
- edicao;
- exclusao.

## 2. Arquivos alterados

- `src/core/feed/types.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/queryKeys.ts`
- `src/core/feed/index.ts`
- `src/core/feed/hooks/useFeedContext.ts`
- `src/core/feed/hooks/useFeedReactions.ts`
- `src/core/feed/hooks/useReactToFeedItem.ts`
- `src/core/feed/hooks/useSaveFeedItem.ts`
- `src/core/feed/services/createFeedContextForLocation.ts`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `src/core/feed/__tests__/useFeedContext.spec.tsx`
- `src/core/feed/__tests__/createFeedContextForLocation.spec.ts`
- `src/core/feed/__tests__/useFeedReactions.spec.tsx`
- `src/core/feed/__tests__/useFeedEngagementMutations.spec.tsx`
- `src/core/community/hooks/feed/useCommunityFeed.ts`
- `src/core/community/components/feed/CommunityFeed.tsx`
- `src/core/community/hooks/page/useComunidadePage.ts`
- `src/core/community/hooks/posts/usePostInteractions.ts`
- `src/core/community/components/modals/PostDetailModal.tsx`
- `src/core/posts/hooks/usePostActions.ts`
- `src/modules/mobility/hooks/useCommunityPosts.ts`

## 3. Responsabilidades migradas

### FeedService

Adicionado o boundary canonico para engagement:

- `FeedService.listReactions()`
- `FeedService.react()`
- `FeedService.saveItem()`

Cada operacao valida antes:

- `FeedContext`;
- `ResolvedTerritory`;
- `TerritoryFilter`;
- Rollout;
- `CommunityAccessPolicy`;
- `FeedTarget`;
- visibilidade publica do item pai via `FeedService.getDetail()`.

### FeedRepository

`PostEngagementService` passou a ser colaborador interno do `FeedRepository`, usado somente depois de o `FeedService` validar o contexto e o alvo.

### Feed hooks

Criados hooks canonicos:

- `useFeedReactions()`
- `useReactToFeedItem()`
- `useSaveFeedItem()`

`useFeedReactions()` falha fechado e nao reapresenta dados de cache quando `FeedContext` ou `FeedTarget` deixam de estar prontos.

### AccessPolicy

`FeedPolicyDecision` agora transporta as permissoes derivadas da `CommunityAccessPolicy` para P0.D.2:

- `canReact`
- `canSave`

Essas flags sao derivadas em:

- `useFeedContext()`
- `createFeedContextForLocation()`

Nenhum novo SSOT de autorizacao foi criado.

## 4. Callers removidos

Foram removidos acessos diretos publicos a `PostEngagementService` em:

- `src/core/posts/hooks/usePostActions.ts`
- `src/core/community/hooks/posts/usePostInteractions.ts`
- `src/modules/mobility/hooks/useCommunityPosts.ts`

Esses fluxos agora chamam:

- `FeedService.react()`
- `FeedService.saveItem()`

Chamadas restantes a `PostEngagementService` sao:

- internas ao `FeedRepository`;
- testes do proprio collaborator;
- read models privados de Profile/Posts fora da superficie publica do Feed.

## 5. Cache e falha fechada

`useFeedReactions()` usa query key territorial:

```text
community-feed -> reactions -> territoryFilter -> target
```

Quando o contexto ou target deixam de ser validos, o hook retorna:

- `isLiked = false`
- `isSaved = false`
- `likesCount = 0`

Dados previamente cacheados nao sao reapresentados.

As mutations invalidam:

- reactions do target territorial;
- detail do target territorial;
- raiz do Feed;
- `saved-posts` no caso de save.

## 6. Aderencia a GOVERNANCE

Resultado: aderente para o escopo P0.D.2.

- UI publica nao chama Engagement diretamente para like/save.
- Mobility nao chama Engagement diretamente para reagir em `ride_share`.
- `FeedService` e a porta publica para reacao/save.
- `FeedRepository` e o unico ponto que usa `PostEngagementService` como colaborador interno.
- Operacoes falham fechado sem contexto territorial valido.
- Rollout e AccessPolicy sao avaliados antes da mutation.
- Alvo oculto, removido, indisponivel ou fora do Territory nao pode receber reacao/save.

## 7. Compatibilidade

Mantido:

- shape visual dos cards;
- optimistic update de like/save;
- invalidacao de feed existente;
- share fora do escopo da P0.D.2;
- delete fora do escopo da P0.D.2;
- Profile read models privados sem migracao funcional.

Mudanca intencional:

- quando um caller legado tentar reagir/salvar sem `FeedContext`, a acao falha fechado em vez de chamar Engagement por ID puro.

## 8. Riscos

- `usePostActions()` ainda e usado por telas privadas de Profile sem `FeedContext`; essas acoes passam a falhar fechado ate que a abertura/acao social de Profile faca handoff territorial para Feed.
- `PostCard` legado ainda possui fallback por `usePostInteractions()`, mas sem `FeedContext` ele tambem falha fechado.
- Share permanece fora do Feed Service por decisao de escopo e deve ser tratado na P0.D.3.
- Edicao/exclusao permanecem fora do escopo e devem ser tratadas em P1.

## 9. Rollback

Rollback seguro deve ser feito por operacao:

1. Reverter apenas callers de like/save para o estado anterior se houver regressao critica.
2. Manter a guarda territorial em `FeedService.getDetail()` e nao reintroduzir abertura cross-territory.
3. Nao restaurar chamadas globais de Engagement em superficies publicas sem `FeedContext`.
4. Se necessario, desabilitar temporariamente botao de like/save quando `FeedContext` estiver ausente, retornando empty/bloqueio controlado.

Rollback nao pode restaurar:

- chamada publica a `PostEngagementService.likePost(postId)`;
- chamada publica a `PostEngagementService.savePost(postId)`;
- mutation por `post_id` sem alvo validado pelo Feed.

## 10. Testes e validacao

Executado:

- `npm run typecheck` - passou.
- `npm run lint` - passou com 13 warnings preexistentes de mapa fora do escopo.
- `npm run build` - passou.
- `npm run test -- src/core/feed` - passou, 11 arquivos e 102 testes.
- `npm run test -- src/modules/mobility` - falhou 1 teste fora do escopo, passou 37/38.

Falha fora do escopo:

- `src/modules/mobility/delivery/__tests__/DeliverySSOTGuard.test.ts`
- O teste espera a string ASCII `Entrega por rede de motoboy ainda nao esta disponivel neste lancamento.`
- O arquivo fonte contem a mensagem acentuada `Entrega por rede de motoboy ainda nao esta disponivel neste lancamento` com caracteres acentuados equivalentes.
- A falha nao envolve `useCommunityPosts`, Feed, reacoes, saves ou P0.D.2.

## 11. Observacoes fora do escopo

- `useSavedPosts()` em Profile continua consultando um read model privado de salvos/likes. Isso nao e superficie publica do Feed e deve seguir a excecao de Profile Activity/Account, ou receber decisao especifica em uma sprint de Profile se Produto desejar que a tela de salvos faca handoff territorial imediato.
- `posts.user.queries.ts` ainda possui leitura interna de interacoes para montar dados de usuario/post. Nao foi alterado porque a sprint P0.D.2 proibiu ampliar escopo e focou em callers publicos de Feed.

## 12. Conclusao

A Sprint FEED.P0.D.2 implementou o boundary publico de reacoes e saves pelo Feed, preservando `PostEngagementService` apenas como colaborador interno do `FeedRepository`.

Status final: A Sprint FEED.P0.D.2 esta pronta para review.
