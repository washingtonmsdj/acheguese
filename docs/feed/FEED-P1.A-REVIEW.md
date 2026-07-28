# FEED.P1.A Review

Data: 2026-07-27

Sprint auditada: FEED.P1.A

Escopo desta review: auditoria documental e estatica da implementacao descrita em `docs/feed/FEED-P1.A-REPORT.md`, comparada contra `docs/feed/FEED-GOVERNANCE.md`, `docs/feed/FEED-ROADMAP.md`, `docs/feed/FEED-EXECUTION-PLAN.md` e `docs/feed/FEED-FREEZE-AUDIT.md`.

Nao houve alteracao de codigo, arquitetura, runtime ou funcionalidades.

## 1. Veredito Executivo

A implementacao remove os bypasses runtime identificados nos bloqueadores `FRZ-B1`, `FRZ-B3` e `FRZ-B5`.

Porem a Sprint ainda nao deve ser encerrada oficialmente porque a cobertura direta de testes dos novos metodos da P1.A nao comprova toda a matriz exigida pela review.

Finding principal:

- Bloqueador `P1A-R1`: cobertura direta insuficiente para `FeedService.updateItem()`, `FeedService.deleteItem()` e `FeedService.votePoll()` nos cenarios de `FeedTarget` invalido, item removido, rollout bloqueado e alguns caminhos de AccessPolicy/sem permissao.

## 2. Respostas Obrigatorias

### 1. Os bloqueadores FRZ-B1, FRZ-B3 e FRZ-B5 foram totalmente eliminados?

Parcialmente para encerramento oficial.

No runtime, sim:

- `FRZ-B1`: edicao e exclusao publicas foram migradas para `FeedService.updateItem()` e `FeedService.deleteItem()`.
- `FRZ-B3`: voto de enquete foi migrado para `FeedService.votePoll()`.
- `FRZ-B5`: enriquecimento publico de detalhe foi movido para `FeedRepository.getDetail()`.

Para encerramento oficial, ainda nao, porque a cobertura direta dos novos metodos P1.A nao prova toda a matriz exigida nesta review.

### 2. Existe ainda algum caller publico utilizando APIs proibidas fora do FeedRepository?

Nao foi encontrado caller publico runtime para os padroes auditados.

Busca estatica executada:

`rg 'postService\.updatePost|postService\.deletePost\(|postService\.deletePostByAuthor|PostsFacade\.mutations\.deletePostByAuthor|PostsFacade\.polls\.|postService\.getPostUserInteractions|postService\.getPollByPostId' src -n`

Ocorrencias restantes:

- `src/core/feed/repositories/FeedRepository.ts`;
- `src/core/feed/__tests__/FeedRepository.spec.ts`.

Conclusao: as ocorrencias runtime restantes estao no colaborador interno correto, `FeedRepository`.

### 3. Existe algum bypass restante para edicao?

Nao foi encontrado bypass runtime.

Evidencias:

- `src/core/community/components/composer/CreatePostModal.tsx:997` chama `updateFeedItem.mutateAsync(...)`.
- `src/core/feed/hooks/useUpdateFeedItem.ts` chama `feedService.updateItem(...)`.
- `src/core/feed/services/FeedService.ts:145` implementa `updateItem()` e valida o target via `validateEngagementTarget(...)`.
- `src/core/community/hooks/posts/useUpdatePost.ts` e apenas adapter fino para `useUpdateFeedItem()`.

### 4. Existe algum bypass restante para exclusao?

Nao foi encontrado bypass runtime.

Evidencias:

- `src/core/posts/hooks/usePostActions.ts:321` chama `deleteFeedItem.mutateAsync(...)`.
- `src/core/feed/hooks/useDeleteFeedItem.ts` chama `feedService.deleteItem(...)`.
- `src/core/feed/services/FeedService.ts:193` implementa `deleteItem()` e valida o target via `validateEngagementTarget(...)`.
- `src/core/community/hooks/posts/useDeletePost.ts` e apenas adapter fino para `useDeleteFeedItem()`.
- `src/modules/profile/components/UserPostsGrid.tsx` nao passa mais `onDelete` para `PostCard`.

### 5. Existe algum bypass restante para voto em enquete?

Nao foi encontrado bypass runtime.

Evidencias:

- `src/core/community/hooks/usePollVote.ts:85` chama `feedService.votePoll(...)`.
- `src/core/feed/services/FeedService.ts:473` implementa `votePoll()` e valida o target via `validateEngagementTarget(...)`.
- `src/core/feed/repositories/FeedRepository.ts:473` valida que a enquete retornada por `getPollByPostId(input.target.id)` possui o mesmo `pollId` antes de votar.

### 6. Existe algum enriquecimento de detalhe fora do Feed?

Nao foi encontrado enriquecimento publico por `postService.getPostUserInteractions()` ou `postService.getPollByPostId()` fora do Feed.

Evidencias:

- `src/core/community/hooks/usePostById.ts:49` delega detalhe a `useFeedItemDetail(...)`.
- As ocorrencias de `postService.getPostUserInteractions()` e `postService.getPollByPostId()` restantes estao em `src/core/feed/repositories/FeedRepository.ts`.

### 7. FeedContext, FeedTarget, Territory, Rollout e CommunityAccessPolicy continuam obrigatorios?

Sim no runtime dos metodos migrados.

Evidencias:

- `FeedService.updateItem()` chama `validateEngagementTarget(...)` em `src/core/feed/services/FeedService.ts:146`.
- `FeedService.deleteItem()` chama `validateEngagementTarget(...)` em `src/core/feed/services/FeedService.ts:194`.
- `FeedService.votePoll()` chama `validateEngagementTarget(...)` em `src/core/feed/services/FeedService.ts:474`.
- `validateEngagementTarget(...)` chama `validateFeedContext(...)` e `isFeedTargetReady(...)`.
- `validateFeedContext(...)` exige territorio resolvido, `TerritoryFilter` coerente, Rollout pronto/ativo e AccessPolicy pronta com timeline visivel.

Observacao: `votePoll()` tambem exige `accessPolicyDecision.canReact === true`.

### 8. Os testes realmente cobrem os cenarios exigidos?

Parcialmente.

Cobertura direta existente para P1.A:

- Edicao valida por autor: coberta em `FeedService.spec.ts:1252`.
- Edicao bloqueada para ator nao autor/nao elevado: coberta em `FeedService.spec.ts:1278`.
- Exclusao valida por moderador: coberta em `FeedService.spec.ts:1297`.
- Exclusao com mismatch territorial: coberta em `FeedService.spec.ts:1324`.
- Voto bloqueado por `canReact: false`: coberto em `FeedService.spec.ts:1342`.
- Voto valido: coberto em `FeedService.spec.ts:1367`.

Cobertura indireta existente por validador compartilhado:

- `FeedTarget` invalido;
- item removido/oculto;
- rollout bloqueado;
- AccessPolicy de timeline bloqueada;
- mismatch territorial.

Problema: os cenarios acima nao estao cobertos diretamente para os novos metodos P1.A (`updateItem`, `deleteItem`, `votePoll`). Isso reduz a confianca de Freeze, porque uma regressao futura poderia remover ou alterar a chamada a `validateEngagementTarget(...)` em um desses metodos sem quebrar os testes que cobrem apenas `react`, `save`, `share`, `comments` ou `detail`.

### 9. Existe algum motivo tecnico para impedir o encerramento oficial da Sprint FEED.P1.A?

Sim.

Motivo tecnico: cobertura direta insuficiente dos novos metodos P1.A para os cenarios de falha fechada exigidos pela review. A implementacao runtime parece alinhada, mas a Sprint nao atende integralmente ao criterio de governanca "os testes realmente cobrem" antes do encerramento oficial.

## 3. Findings

### Bloqueador - P1A-R1 - Cobertura direta insuficiente dos novos metodos P1.A

Evidencia:

- `FeedService.updateItem()` possui testes de sucesso por autor e bloqueio por ator sem permissao, mas nao possui testes diretos para `FeedTarget` invalido, item removido, mismatch territorial, rollout bloqueado e AccessPolicy de timeline bloqueada.
- `FeedService.deleteItem()` possui teste de sucesso por moderador e mismatch territorial, mas nao possui testes diretos para delete por autor, ator sem permissao, `FeedTarget` invalido, item removido, rollout bloqueado e AccessPolicy bloqueada.
- `FeedService.votePoll()` possui teste de sucesso e `canReact: false`, mas nao possui testes diretos para `FeedTarget` invalido, item removido, mismatch territorial, rollout bloqueado, ausencia de usuario e `pollId` que nao pertence ao item validado.

Impacto:

Medio a alto para Freeze. A validacao compartilhada parece correta, mas a suite nao trava diretamente os contratos novos da P1.A.

Risco:

Uma regressao nos metodos P1.A pode passar despercebida se `validateEngagementTarget(...)` for removido, contornado ou chamado com target incorreto em `updateItem`, `deleteItem` ou `votePoll`.

Dependencias:

Nenhuma dependencia arquitetural nova. O hardening deve adicionar testes diretos sem alterar runtime, exceto se algum teste revelar defeito real.

Recomendacao de hardening:

- Adicionar testes diretos para `FeedService.updateItem()`:
  - `FeedTarget` invalido;
  - item removido;
  - mismatch territorial;
  - rollout bloqueado;
  - AccessPolicy bloqueada;
  - moderador autorizado, se esse comportamento for oficialmente esperado.
- Adicionar testes diretos para `FeedService.deleteItem()`:
  - autor autorizado;
  - ator sem permissao;
  - `FeedTarget` invalido;
  - item removido;
  - rollout bloqueado;
  - AccessPolicy bloqueada.
- Adicionar testes diretos para `FeedService.votePoll()`:
  - `FeedTarget` invalido;
  - item removido;
  - mismatch territorial;
  - rollout bloqueado;
  - usuario ausente;
  - `pollId` divergente do item validado;
  - garantia de que `FeedRepository.votePoll()` nao e chamado nos cenarios bloqueados.

### Recomendacao - P1A-R2 - Profile ainda renderiza actions que falham sem FeedContext

Evidencia:

- `src/modules/profile/components/UserPostsGrid.tsx` usa `usePostActions()` sem `FeedContext`, mas apenas para `likePost`, `savePost` e `sharePost`; `onDelete` nao esta mais presente.

Impacto:

Baixo para P1.A. Nao reabre `FRZ-B1`, `FRZ-B3` ou `FRZ-B5`.

Risco:

Actions de Perfil podem falhar fechado em runtime por ausencia de `FeedContext`. Isso pertence ao boundary Profile/Feed e deve ser tratado em sprint propria ou em UX de Profile, sem reabrir P1.A.

### Melhoria futura - P1A-R3 - Automatizar busca estatica proibida

Evidencia:

A review dependeu de busca manual por padroes proibidos.

Recomendacao:

Criar, em sprint futura, uma regra automatizada de auditoria para impedir chamadas publicas a:

- `postService.updatePost()`;
- `postService.deletePost()`;
- `postService.deletePostByAuthor()`;
- `PostsFacade.polls.*`;
- `postService.getPostUserInteractions()`;
- `postService.getPollByPostId()`.

## 4. Compatibilidade Com Sprints Anteriores

Nao foi identificado risco direto de compatibilidade com P0.A, P0.B, P0.C, P0.D.1, P0.D.2, P0.D.3 ou P0.E.

Os novos metodos reutilizam a mesma validacao territorial ja consolidada em P0.D.2/P0.D.3 para reactions/saves/share.

## 5. Rollback

O rollback descrito em `docs/feed/FEED-P1.A-REPORT.md` e tecnicamente plausivel, desde que preserve:

- guards territoriais ja consolidados em P0.B/P0.E;
- falha fechada sem `FeedContext`;
- proibicao de restaurar `PostService` direto em UI publica para os fluxos cobertos.

## 6. Conclusao

Runtime: os bloqueadores `FRZ-B1`, `FRZ-B3` e `FRZ-B5` foram removidos.

Governance/Freeze: a Sprint ainda nao deve ser encerrada porque a cobertura direta dos novos metodos P1.A nao comprova toda a matriz de falha fechada exigida nesta review.

Status final: a Sprint FEED.P1.A ainda nao atende aos criterios da governanca.
