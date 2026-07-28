# FEED.P1.A Report

Data: 2026-07-27

Sprint: FEED.P1.A

Status: pronta para review

## 1. Escopo

Implementada exclusivamente a Sprint P1.A prevista em `docs/feed/FEED-ROADMAP.md` e `docs/feed/FEED-EXECUTION-PLAN.md`.

Objetivo executado: consolidar o Feed como unica porta publica para mutations remanescentes e enriquecimento de detalhe, eliminando os bloqueadores `FRZ-B1`, `FRZ-B3` e `FRZ-B5`.

Nao foram implementados:

- moderacao;
- `reportTarget`;
- URL canonica nova;
- Search;
- notificacoes;
- realtime;
- novas regras de produto.

## 2. Arquivos Alterados

### Feed Core

- `src/core/feed/types.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/queryKeys.ts`
- `src/core/feed/index.ts`
- `src/core/feed/hooks/useFeedItemDetail.ts`
- `src/core/feed/hooks/useUpdateFeedItem.ts`
- `src/core/feed/hooks/useDeleteFeedItem.ts`
- `src/core/feed/hooks/useReactToFeedItem.ts`
- `src/core/feed/hooks/useSaveFeedItem.ts`
- `src/core/feed/hooks/useShareFeedItem.ts`

### Community / Posts / Profile Callers

- `src/core/community/components/composer/CreatePostModal.tsx`
- `src/core/community/components/PollCard.tsx`
- `src/core/community/components/modals/PostDetailModal.tsx`
- `src/core/community/components/detail-modal/DetailModalContent.tsx`
- `src/core/community/hooks/usePollVote.ts`
- `src/core/community/hooks/usePostById.ts`
- `src/core/community/hooks/posts/useUpdatePost.ts`
- `src/core/community/hooks/posts/useDeletePost.ts`
- `src/core/posts/hooks/usePostActions.ts`
- `src/modules/profile/components/UserPostsGrid.tsx`

### Testes

- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/queryKeys.spec.ts`
- `src/core/feed/__tests__/useFeedItemDetail.spec.tsx`
- `src/core/community/hooks/__tests__/usePostById.feed.spec.tsx`

## 3. Responsabilidades Migradas

### `FeedService.updateItem()`

Criado como boundary oficial para edicao publica de item.

Validacoes obrigatorias antes da mutation:

- `FeedContext`;
- `ResolvedTerritory`;
- `TerritoryFilter`;
- `Rollout`;
- `AccessPolicy`;
- `FeedTarget`;
- ator por `actorProfileId`;
- autoria ou ator elevado.

A operacao falha fechado antes do `FeedRepository` quando qualquer validacao falha.

### `FeedService.deleteItem()`

Criado como boundary oficial para exclusao publica de item.

Validacoes obrigatorias antes da mutation:

- `FeedContext`;
- `ResolvedTerritory`;
- `TerritoryFilter`;
- `Rollout`;
- `AccessPolicy`;
- `FeedTarget`;
- ator por `actorProfileId`;
- autoria ou ator elevado.

O `FeedRepository` decide entre colaborador interno de exclusao por autor ou exclusao elevada, sem expor `PostService` para UI publica.

### `FeedService.votePoll()`

Criado como boundary oficial para voto publico em enquete.

Validacoes obrigatorias antes da mutation:

- `FeedContext`;
- `ResolvedTerritory`;
- `TerritoryFilter`;
- `Rollout`;
- `CommunityAccessPolicy.canReact`;
- `FeedTarget`;
- existencia de usuario;
- enquete pertencente ao item validado.

### Enriquecimento de Detalhe

`FeedRepository.getDetail()` passou a concentrar o enriquecimento de detalhe:

- interacoes do usuario (`is_liked`, `is_saved`, `has_user_confirmed`);
- dados de enquete;
- voto do usuario na enquete.

`usePostById()` nao chama mais `postService.getPostUserInteractions()` nem `postService.getPollByPostId()`.

## 4. Callers Removidos ou Migrados

### FRZ-B1

Resolvido.

- `CreatePostModal` nao chama mais `postService.updatePost()` para edicao.
- Edicao agora usa `useUpdateFeedItem()` -> `FeedService.updateItem()`.
- `usePostActions` nao chama mais `PostsFacade.mutations.deletePostByAuthor()`.
- Exclusao agora usa `useDeleteFeedItem()` -> `FeedService.deleteItem()`.
- `UserPostsGrid` nao dispara mais exclusao a partir do Profile sem `FeedContext`; a superficie permanece read-only para essa mutation.

### FRZ-B3

Resolvido.

- `usePollVote()` nao usa mais `PostsFacade.polls.votePoll()` nem `PostsFacade.polls.updatePollVoteCounts()`.
- `PollCard` recebe `targetPostId` e `feedContext`.
- Voto de enquete passa por `FeedService.votePoll()`.

### FRZ-B5

Resolvido.

- `usePostById()` delega detalhe para `useFeedItemDetail()`.
- O enriquecimento de detalhe ficou concentrado em `FeedRepository`.
- A query key de detalhe inclui `viewerUserId` ou `anonymous`, evitando mistura de estado enriquecido entre usuarios.
- Mutations que afetam detalhe invalidam/removem o prefixo territorial do item, cobrindo todas as variantes por usuario.

## 5. Aderencia A GOVERNANCE

Resultado: aderente ao escopo P1.A.

- Nenhuma UI publica migrada cria, edita, exclui, vota ou enriquece detalhe por `PostService` diretamente.
- Operacoes publicas migradas passam pelo `FeedService`.
- O `FeedRepository` e o unico ponto do Feed que consome colaboradores internos (`postService`, `CommentService`, `PostEngagementService`).
- Mutations falham fechado quando `FeedContext`, rollout, policy, target ou territorio nao estao validos.
- Nao foi criado novo SSOT.
- Nao houve alteracao de GOVERNANCE, ROADMAP ou arquitetura.

## 6. Auditoria Estatica

Busca executada:

`rg 'postService\\.updatePost|postService\\.deletePost|postService\\.deletePostByAuthor|PostsFacade\\.mutations\\.deletePostByAuthor|PostsFacade\\.polls\\.votePoll|PostsFacade\\.polls\\.updatePollVoteCounts|postService\\.getPostUserInteractions|postService\\.getPollByPostId' src -n`

Resultado: ocorrencias restantes apenas em:

- `src/core/feed/repositories/FeedRepository.ts`;
- `src/core/feed/__tests__/FeedRepository.spec.ts`.

Observacao fora do escopo: ainda existem leituras atomicas privadas no dominio `Profile` e widgets auxiliares legados usando `postService`/`PostsFacade`. Esses casos nao correspondem aos bloqueadores `FRZ-B1`, `FRZ-B3` e `FRZ-B5` e permanecem cobertos pela excecao de Profile ou por sprints futuras.

## 7. Testes Executados

| Comando | Resultado |
| --- | --- |
| `npm run lint` | Passou com 13 warnings pre-existentes de mapas, sem erros. |
| `npm run build` | Passou. |
| `npm run typecheck` | Passou. |
| `npm run test -- src/core/feed` | Passou: 12 arquivos, 135 testes. |
| `npm run test -- src/core/feed/__tests__/FeedRepository.spec.ts src/core/feed/__tests__/FeedService.spec.ts src/core/feed/__tests__/useFeedItemDetail.spec.tsx src/core/feed/__tests__/useFeedEngagementMutations.spec.tsx src/core/feed/__tests__/useShareFeedItem.spec.tsx src/core/community/hooks/__tests__/usePostById.feed.spec.tsx` | Passou: 6 arquivos, 105 testes. |

## 8. Riscos

Risco baixo a medio.

Pontos de atencao:

- `Profile` nao possui `ResolvedTerritory` natural; por isso a exclusao no grid de posts do perfil foi removida em vez de fabricar contexto territorial.
- Enquetes sem `poll.id` real continuam renderizando, mas a mutation falha fechada se o id nao corresponder a enquete do item validado.
- O enriquecimento de detalhe agora depende do `FeedRepository`; qualquer nova necessidade de detalhe deve ser adicionada nesse boundary, nao em hooks publicos.

## 9. Rollback

Rollback tecnico seguro:

1. Reverter `useUpdateFeedItem`, `useDeleteFeedItem`, `FeedService.updateItem`, `FeedService.deleteItem` e `FeedService.votePoll`.
2. Reverter a migracao dos callers de edicao, exclusao e voto.
3. Manter, mesmo em rollback, a guarda territorial de detalhe introduzida em P0.B/P0.D/P0.E.

Rollback proibido:

- restaurar leitura ou mutation publica por ID puro;
- restaurar `PostService` direto em UI publica para os fluxos cobertos;
- restaurar `PostsFacade.polls` em voto publico de enquete;
- restaurar enriquecimento de detalhe fora do Feed.

## 10. Compatibilidade

- Contratos publicos existentes foram preservados onde possivel.
- Hooks legados `useUpdatePost()` e `useDeletePost()` permanecem como adapters finos para os hooks canonicos do Feed.
- `useFeedItemDetail()` continua aceitando chamadas anonimas, mas agora separa cache por visualizador.
- P0.A, P0.B, P0.C, P0.D.1, P0.D.2, P0.D.3 e P0.E permanecem compativeis.

## 11. Conclusao

A Sprint FEED.P1.A elimina os bloqueadores `FRZ-B1`, `FRZ-B3` e `FRZ-B5` dentro do escopo definido.

O dominio Feed agora e a porta publica para:

- edicao de item;
- exclusao de item;
- voto em enquete;
- enriquecimento de detalhe publico.

Status final: pronta para review.
