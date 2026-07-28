# FEED-P0.D.2-REVIEW.md

Data: 2026-07-27

Sprint auditada: FEED.P0.D.2.REVIEW

Escopo: review exclusiva da implementacao de reacoes, saves e contadores por Feed Service.

## 1. Base obrigatoria

Documentos comparados:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-GOVERNANCE-CHANGELOG.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-P0.D.2-REPORT.md`

Arquivos de implementacao inspecionados:

- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/hooks/useFeedReactions.ts`
- `src/core/feed/hooks/useReactToFeedItem.ts`
- `src/core/feed/hooks/useSaveFeedItem.ts`
- `src/core/posts/hooks/usePostActions.ts`
- `src/core/community/hooks/posts/usePostInteractions.ts`
- `src/modules/mobility/hooks/useCommunityPosts.ts`
- `src/modules/profile/hooks/useSavedPosts.ts`
- `src/core/posts/services/posts.user.queries.ts`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `src/core/feed/__tests__/useFeedReactions.spec.tsx`
- `src/core/feed/__tests__/useFeedEngagementMutations.spec.tsx`

## 2. Conclusao executiva

A implementacao runtime da P0.D.2 esta majoritariamente aderente ao boundary do Feed:

- `FeedService.listReactions()`, `FeedService.react()` e `FeedService.saveItem()` existem.
- `PostEngagementService` foi removido dos caminhos publicos de like/save inspecionados.
- `FeedRepository` passou a ser o colaborador interno que acessa `PostEngagementService`.
- `FeedService` valida `FeedContext`, `ResolvedTerritory`, `TerritoryFilter`, Rollout e AccessPolicy antes de mutacoes.
- `useFeedReactions()` falha fechado e nao reapresenta cache antigo quando o contexto ou alvo deixam de estar prontos.

Porem a sprint ainda nao deve ser encerrada oficialmente porque a cobertura obrigatoria nao prova todos os cenarios exigidos pela review. Em especial, falta teste direto para item removido e falta teste direto de mismatch territorial nas mutations de reacao/save. A implementacao parece usar o caminho compartilhado de `getDetail()` e `resolveFeedItemVisibility()`, mas a review solicitou evidencia de cobertura desses cenarios para P0.D.2.

## 3. Respostas obrigatorias

### 1. Todo o escopo da P0.D.2 foi implementado?

Parcialmente.

O escopo runtime foi implementado: leitura de reactions, mutation de reaction, mutation de save, query keys territoriais, hooks publicos e migracao dos callers publicos principais. O escopo de evidencia/testes ainda esta incompleto para os criterios obrigatorios da review.

### 2. Existe alguma implementacao que pertence a P0.D.3 ou superior?

Nao foi identificada antecipacao funcional de P0.D.3 ou superior.

Share continua fora do Feed Service, como previsto para P0.D.3. Edicao, exclusao, replies, realtime, moderacao e notificacoes tambem permanecem fora do escopo.

### 3. Existe alguma violacao da GOVERNANCE?

Nao foi identificada violacao runtime no boundary publico de reacoes/saves.

A pendencia e de encerramento: a governanca exige validacao territorial e falha fechada, e a implementacao aponta para isso, mas a suite ainda nao comprova todos os cenarios pedidos para P0.D.2.

### 4. Ainda existe algum caminho publico acessando PostEngagementService diretamente?

Nao foi identificado caminho publico de reacao/save acessando `PostEngagementService` diretamente.

Chamadas restantes identificadas:

- `src/core/feed/repositories/FeedRepository.ts`: uso permitido como colaborador interno do Feed.
- `src/modules/profile/hooks/useSavedPosts.ts`: read model privado de Profile.
- `src/core/posts/services/posts.user.queries.ts`: read model de usuario/salvos.

Pela `Profile Activity Exception`, Profile pode consumir read models atomicos de Engagement para historico/visoes privadas, desde que qualquer abertura ou acao social publica continue passando pelo Feed.

### 5. Existe algum bypass ao FeedService para reacoes ou saves?

Nao foi identificado bypass publico para like/save.

Evidencias:

- `src/core/posts/hooks/usePostActions.ts` chama `feedService.react()` e `feedService.saveItem()`.
- `src/core/community/hooks/posts/usePostInteractions.ts` chama `feedService.react()` e `feedService.saveItem()`.
- `src/modules/mobility/hooks/useCommunityPosts.ts` chama `feedService.react()`.
- `src/core/feed/repositories/FeedRepository.ts` e o unico ponto inspecionado que chama `PostEngagementService.likePost`, `unlikePost`, `savePost` e `unsavePost`.

### 6. FeedContext, FeedTarget, Territory, Rollout e CommunityAccessPolicy sao sempre validados antes da operacao?

Para as operacoes runtime do Feed Service, sim.

`FeedService.react()` e `FeedService.saveItem()` chamam `validateEngagementTarget()` antes de chamar o repository. Esse fluxo:

- executa `validateFeedContext()`;
- rejeita `FeedTarget` invalido;
- chama `getDetail()` com `territoryFilter`;
- transforma `territory_mismatch` em falha fechada;
- transforma alvo oculto/removido/indisponivel em `target_not_visible`;
- aplica `canReact` ou `canSave` antes da mutation.

`FeedService.listReactions()` tambem passa por `validateEngagementTarget()`. Para leitura de reactions, a validacao de AccessPolicy ocorre pelo `canViewTimeline` dentro de `validateFeedContext()`.

### 7. Existe algum cenario onde likes ou saves possam reaparecer por cache quando FeedContext deixar de ser valido?

No hook canonico de reactions, nao.

`useFeedReactions()` desabilita a query quando `FeedContext` ou `FeedTarget` nao estao prontos e retorna estado vazio, ignorando `query.data`. Os testes cobrem cache pre-existente sem `FeedContext`, com `FeedTarget` invalido, rollout perdido, AccessPolicy perdida e mismatch de `TerritoryFilter`.

Risco residual: componentes legados que recebem um post por props ainda podem renderizar estado local inicial de like/save enquanto a acao falha fechado. Isso nao representa vazamento via cache canonico do Feed, mas deve ser limpo antes do Freeze visual/comportamental.

### 8. Os testes realmente cobrem os cenarios obrigatorios?

Parcialmente.

Coberto:

- `FeedContext` invalido: coberto em `FeedService.spec.ts` e `useFeedReactions.spec.tsx`.
- Rollout bloqueado/perdido: coberto em `FeedService.spec.ts` e `useFeedReactions.spec.tsx`.
- AccessPolicy bloqueada/perdida: coberto em `FeedService.spec.ts` e `useFeedReactions.spec.tsx`.
- `FeedTarget` invalido: coberto em `useFeedReactions.spec.tsx`.
- cache antigo: coberto em `useFeedReactions.spec.tsx`.
- item oculto: coberto para `saveItem()` em `FeedService.spec.ts`.
- mismatch territorial: coberto para leitura/cache de reactions via `useFeedReactions.spec.tsx` e no detalhe/repository.

Nao coberto de forma suficiente para P0.D.2:

- item removido em `react()` ou `saveItem()`;
- mismatch territorial direto em `react()` ou `saveItem()`;
- `FeedTarget` invalido direto nas mutations `react()` e `saveItem()`;
- item oculto direto em `react()`.

Observacao: existe um teste chamado "does not expose hidden or removed detail items", mas o fixture verificado usa `is_hidden: true` e `is_removed: false`. Ele nao prova o caso removido.

### 9. Existe algum risco de compatibilidade com P0.A, P0.B, P0.C, P0.E ou P0.D.1?

Sim, mas nao foi identificado risco que quebre os boundaries ja consolidados.

Riscos residuais:

- `UserPostsGrid` e `SavedPostsGrid` chamam `usePostActions()` sem `FeedContext`; as actions agora falham fechado. Isso preserva a governanca, mas pode afetar UX privada de Profile ate haver handoff territorial.
- `PostCard`/`UnifiedPostCard` ainda possuem caminhos que usam `usePostInteractions()` sem `FeedContext`; a action falha fechado, mas pode haver flicker por optimistic state antes do rollback.
- `saved-posts` continua sendo cache privado de Profile/Post. Isso e permitido como read model privado, mas nao deve virar superficie publica de Feed.

### 10. Existe algum motivo tecnico para impedir o encerramento oficial da Sprint FEED.P0.D.2?

Sim.

O motivo tecnico e a cobertura obrigatoria incompleta dos cenarios de governanca para P0.D.2. A implementacao parece correta, mas a sprint exigiu prova explicita de falha fechada para item removido, mismatch territorial, FeedTarget invalido e cache antigo. A parte de cache esta coberta; a parte de item removido e algumas mutations nao estao cobertas diretamente.

## 4. Findings

### Bloqueador - P0D2-R1 - Cobertura obrigatoria incompleta para alvo removido e mismatch nas mutations

Impacto: Alto.

A suite atual nao prova diretamente que `FeedService.react()` e `FeedService.saveItem()` bloqueiam item removido e mismatch territorial antes de chamar o repository. O codigo usa `validateEngagementTarget()` e o caminho compartilhado de detalhe, mas a review exige cobertura objetiva desses cenarios dentro da P0.D.2.

Evidencia:

- `src/core/feed/services/FeedService.ts`: `react()` e `saveItem()` passam por `validateEngagementTarget()`.
- `src/core/feed/types.ts`: `resolveFeedItemVisibility()` trata `is_removed === true` como `removed`.
- `src/core/feed/__tests__/FeedService.spec.ts`: ha teste para `saveItem()` com `is_hidden: true`; nao ha teste equivalente com `is_removed: true`.
- `src/core/feed/__tests__/FeedService.spec.ts`: ha teste de mismatch em detalhe/comentarios, mas nao teste direto de mismatch em `react()` ou `saveItem()`.

Esforco estimado: S.

Risco de quebra ao corrigir: Baixo.

Dependencias: nenhuma sprint futura; deve ser resolvido antes do encerramento oficial da P0.D.2.

### Recomendacao - P0D2-R2 - Profile actions sem FeedContext devem receber handoff territorial futuro

Impacto: Medio.

`UserPostsGrid` e `SavedPostsGrid` usam `usePostActions()` sem `FeedContext`. Isso nao cria bypass porque as actions falham fechado, mas gera risco de UX quebrada em Profile quando o usuario tentar curtir/salvar por uma superficie privada.

Esta recomendacao nao reabre P0.D.2 porque Profile Activity foi definido como boundary de Profile, nao superficie publica do Feed. Ainda assim, qualquer acao social a partir de Profile deve abrir ou resolver um alvo territorial pelo Feed.

Esforco estimado: M.

Dominio responsavel: Profile + Feed Routing.

### Melhoria futura - P0D2-R3 - Reduzir fallbacks legados de usePostInteractions sem contexto

Impacto: Baixo a medio.

`PostCard` e `UnifiedPostCard` ainda possuem uso de `usePostInteractions()` que pode operar sem `FeedContext`. A mutation nao passa pelo Engagement diretamente e falha fechado, portanto nao e violacao de governanca. O residuo e comportamental: optimistic state pode alterar UI local antes do rollback.

Esforco estimado: M.

Dominio responsavel: Feed UI.

## 5. Rollback

O rollback descrito no report e suficiente em direcao geral, porque nao autoriza retorno a chamadas globais de Engagement. Porem, enquanto P0D2-R1 estiver aberto, o rollback tambem deve manter como requisito a inclusao dos testes de alvo removido/mismatch antes de qualquer encerramento formal.

Rollback aceitavel:

- reverter uma action por vez;
- manter detalhe territorial como guarda minima;
- manter bloqueio territorial mesmo em fallback;
- nao restaurar `PostEngagementService.likePost(postId)` ou `savePost(postId)` em UI publica.

## 6. Status final

A Sprint FEED.P0.D.2 ainda nao atende integralmente aos criterios da governanca por falta de cobertura obrigatoria direta para alguns cenarios de falha fechada em reacoes/saves.

Status: nao concluida oficialmente.
