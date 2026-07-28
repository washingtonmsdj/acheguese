# FEED.P0.D.1 Report

Data: 2026-07-26

Status: pronto para review

## Escopo executado

A Sprint FEED.P0.D.1 implementou exclusivamente o boundary de comentarios de primeiro nivel do Feed.

Objetivo entregue:

- leitura de comentarios via `FeedService.listComments()`;
- criacao de comentarios via `FeedService.createComment()`;
- repository correspondente no `FeedRepository`;
- hooks publicos `useFeedComments()` e `useCreateFeedComment()`;
- `FeedQueryKeys` especificas para comentarios;
- uso de `FeedTarget` canonico para comentarios apontando para o post pai;
- validacao obrigatoria de `FeedContext`, `ResolvedTerritory`, `TerritoryFilter`, `Rollout`, `CommunityAccessPolicy` e `FeedTarget`;
- falha fechada quando qualquer validacao deixa de estar pronta;
- cache de comentarios mascarado quando o `FeedContext` deixa de ser valido.

Nao foram implementados replies, reactions, likes, saves, share, edicao, exclusao, moderacao, realtime ou notificacoes.

## Arquivos alterados

Core Feed:

- `src/core/feed/types.ts`
- `src/core/feed/queryKeys.ts`
- `src/core/feed/index.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/hooks/useFeedComments.ts`
- `src/core/feed/hooks/useCreateFeedComment.ts`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `src/core/feed/__tests__/queryKeys.spec.ts`
- `src/core/feed/__tests__/useFeedContext.spec.tsx`
- `src/core/feed/__tests__/createFeedContextForLocation.spec.ts`
- `src/core/feed/__tests__/useFeedComments.spec.tsx`
- `src/core/feed/__tests__/useCreateFeedComment.spec.tsx`

Community UI e hooks publicos:

- `src/core/community/components/CommentsModal.tsx`
- `src/core/community/components/comments/CommentItem.tsx`
- `src/core/community/components/comments/CommentsList.tsx`
- `src/core/community/components/comments/PostCommentsPanel.tsx`
- `src/core/community/components/modals/PostDetailModal.tsx`
- `src/core/community/components/page/CommunityModals.tsx`
- `src/core/community/pages/ComunidadePage.tsx`
- `src/core/community/hooks/useComments.ts`
- `src/core/community/hooks/useCommentActions.ts`
- `src/core/community/hooks/useCommentInteractions.ts`

Mobility:

- `src/modules/mobility/hooks/useCommunityPosts.ts`
- `src/modules/mobility/hooks/useCommunityPosts.spec.tsx`

## Responsabilidades migradas

Leitura de comentarios:

`PostCommentsPanel` -> `useFeedComments()` -> `FeedService.listComments()` -> `FeedRepository.listComments()` -> `CommentService.getCommentsByPost()`

Criacao de comentarios:

`PostCommentsPanel` -> `useCreateFeedComment()` -> `FeedService.createComment()` -> `FeedRepository.createComment()` -> `CommentService.createComment()`

Validacao territorial:

- o `FeedContext` continua sendo a fonte operacional recebida pela UI;
- `ResolvedTerritory` e `TerritoryFilter` sao validados antes de qualquer chamada ao repository;
- mismatch territorial falha fechado;
- o post pai e validado via `FeedService.getDetail()` antes de listar ou criar comentarios.

AccessPolicy:

- `CommunityAccessPolicy` permanece a regra canonica;
- `canCreateComment` passou a ser derivado no contexto do Feed;
- criacao falha fechado quando a decisao nao permite comentarios;
- nenhum caller publico pode fabricar permissao local para comentario.

## Callers removidos

Foram removidos os caminhos publicos que acessavam comentarios fora do Feed:

- `useComments()` deixou de consultar `CommentService.getCommentsByPost()` diretamente;
- `useCommentActions()` deixou de criar, atualizar ou remover comentarios via `CommentService` diretamente;
- `useCommentInteractions()` deixou de acionar likes/unlikes diretamente em comentarios;
- `PostCommentsPanel` deixou de usar os hooks legados para leitura/criacao/interacao direta;
- `useCommunityPosts.commentOnPost()` deixou de chamar `CommentService.createComment()` e passou a usar `FeedService.createComment()`.

`CommentService` permanece somente como colaborador interno do `FeedRepository` para os fluxos de Feed. A busca textual confirmou que, nos caminhos `src/core/community`, `src/modules/mobility` e `src/core/feed`, as ocorrencias restantes de `CommentService` estao restritas a:

- `src/core/feed/repositories/FeedRepository.ts`;
- `src/core/feed/__tests__/FeedRepository.spec.ts`.

## Aderencia a GOVERNANCE

1. Existe apenas um boundary publico para comentarios?
   - Sim, para leitura e criacao de comentarios do Feed: `FeedService`.

2. Toda UI publica usa FeedService?
   - Sim, os fluxos publicos de comentarios da timeline, detalhe/modal e Mobility agora entram pelo Feed.

3. CommentService passa a ser apenas colaborador interno?
   - Sim, no boundary do Feed ele ficou encapsulado no `FeedRepository`.

4. FeedRepository e o unico consumidor publico?
   - Sim, para os fluxos publicos de Feed. O repository e o unico ponto que consome `CommentService` dentro desse boundary.

5. Existe bypass?
   - Nao foi encontrado bypass nos caminhos publicos de Community, Mobility e Feed auditados nesta sprint.

6. Cache falha fechado?
   - Sim. `useFeedComments()` retorna `comments = []` e `total = 0` quando o contexto ou target deixam de estar prontos, mesmo com dados anteriores em cache.

7. Rollout e respeitado?
   - Sim. `FeedService.listComments()` e `FeedService.createComment()` passam por `validateFeedContext()` antes do repository.

8. AccessPolicy e respeitada?
   - Sim. Criacao exige `accessPolicyDecision.canCreateComment === true`; ausencia ou negativa falha fechado.

9. Territory continua obrigatorio?
   - Sim. Operacoes exigem `ResolvedTerritory`, `TerritoryFilter` e compatibilidade entre ambos.

10. FeedTarget e validado?
    - Sim. Comentarios usam `FeedTarget` de item/post pai. Target ausente, invalido ou indisponivel falha fechado.

## Cobertura de testes

Cobertura adicionada ou atualizada:

- `FeedService.spec.ts`
  - `FeedContext` invalido;
  - `TerritoryFilter` mismatch;
  - rollout bloqueado;
  - AccessPolicy bloqueada;
  - target invalido;
  - post pai oculto/indisponivel;
  - sucesso em listagem;
  - sucesso em criacao;
  - garantia de que o repository nao e chamado antes das validacoes.

- `FeedRepository.spec.ts`
  - listagem de comentarios via colaborador interno `CommentService`;
  - criacao de comentarios via colaborador interno `CommentService`.

- `queryKeys.spec.ts`
  - chave territorial de comentarios.

- `useFeedComments.spec.tsx`
  - contexto valido;
  - `FeedContext` ausente;
  - target invalido;
  - rollout perdido;
  - AccessPolicy perdida;
  - mismatch territorial;
  - cache antigo nao reapresentado.

- `useCreateFeedComment.spec.tsx`
  - criacao via `FeedService`;
  - invalidacao correta em sucesso;
  - ausencia de invalidacao quando ha falha fechada.

- `useFeedContext.spec.tsx`
  - derivacao de `canCreateComment`.

- `createFeedContextForLocation.spec.ts`
  - mapeamento de `canCreateComment`.

- `useCommunityPosts.spec.tsx`
  - `commentOnPost()` usa `FeedService.createComment()`;
  - falha fechada quando nao ha `FeedContext` valido.

## Validacoes executadas

Executado com sucesso:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test -- src/core/feed`
- `npm run test -- src/modules/mobility/hooks/useCommunityPosts.spec.tsx src/modules/mobility/components/community/CommunityRideFeed.spec.tsx`
- `git diff --check -- <arquivos da sprint>`

Resultado dos testes relacionados:

- Feed: 9 arquivos, 80 testes aprovados.
- Mobility relacionado: 2 arquivos, 8 testes aprovados.

Observacoes de validacao:

- a primeira tentativa de `npm run test -- src/core/feed` estourou timeout local sem produzir falhas; a suite foi reexecutada com timeout maior e passou;
- `npm run typecheck` tambem precisou de timeout maior e passou apos correcao local de narrowing;
- `npm run lint` passou com 0 erros e 13 warnings pre-existentes relacionados a mapas;
- `git diff --check` nao encontrou erro de whitespace, apenas avisos de conversao LF/CRLF do Git no Windows.

## Compatibilidade

- A UI publica continua abrindo o painel/modal de comentarios existente.
- A leitura preserva o formato atual retornado pelo colaborador interno, sem introduzir novo contrato de replies.
- Criacao de replies nao foi implementada e nao foi exposta nesta sprint.
- Interacoes de comentario que pertencem a sprints futuras nao foram migradas para novo comportamento funcional.
- O fluxo existente de denuncia visual foi preservado sem ampliar moderacao; moderacao continua fora do escopo desta sprint.
- P0.A, P0.B, P0.C, P0.C.AUTHORITY, P0.E e Milestone 1 nao foram reabertos.

## Riscos remanescentes

- Contadores agregados de comentarios em cards de post pertencem a P0.D.2 quando envolverem counters/engagement; a P0.D.1 limita a invalidacao a comentarios e caminhos diretamente relacionados.
- Dominios de comentario que nao fazem parte do Feed publico, como civic/lost-found/admin/perfil, permanecem fora desta sprint.
- `CommentService` ainda existe e continua exportado para compatibilidade interna, mas nao deve ser usado por UI publica de Feed.
- Moderacao, denuncia formal, delete/update de comentarios, replies e reactions precisam de sprints proprias para nao quebrar a governanca.
- O worktree possui muitas alteracoes pre-existentes de outras sprints; esta entrega nao tentou reconciliar arquivos fora do escopo.

## Rollback

Rollback tecnico seguro:

1. Reverter `FeedService.listComments()` e `FeedService.createComment()`.
2. Reverter os metodos de comentarios adicionados ao `FeedRepository`.
3. Reverter `FeedQueryKeys.comments()`.
4. Remover `useFeedComments()` e `useCreateFeedComment()`.
5. Remover a propagacao de `FeedContext` para `PostCommentsPanel` somente se o componente voltar a um empty state fechado.
6. Manter a guarda territorial ativa: rollback nao pode restaurar listagem global nem criacao sem `FeedContext`.

Rollback proibido:

- restaurar acesso publico direto a `CommentService` sem `FeedContext`;
- restaurar criacao de comentario sem `ResolvedTerritory`;
- restaurar comentario por fallback territorial silencioso;
- reapresentar cache antigo quando o contexto deixar de estar valido.

## Observacoes fora do escopo

- Replies, reactions, likes, saves, share, edicao, exclusao, realtime, notificacoes e moderacao nao foram implementados.
- A sprint nao alterou banco, migrations, arquitetura, governanca ou roadmap.
- Falhas ou pendencias de dominios nao-Feed devem ser tratadas em suas respectivas sprints.

## Conclusao

A Sprint FEED.P0.D.1 atende ao escopo definido para comentarios de primeiro nivel do Feed e esta pronta para review.
