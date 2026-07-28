# FEED.P0.B - Review

Data: 2026-07-25

## Escopo da review

Esta review auditou exclusivamente a implementacao da Sprint `FEED.P0.B`, comparando:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-P0.B-REPORT.md`

Nao houve alteracao de codigo, banco, contratos ou arquitetura nesta review.

## Criterio da P0.B

Objetivo auditado: fazer detalhe, modal e deep-link de item buscarem apenas via `FeedService.getDetail`, validando que o item pertence ao Territory resolvido antes de renderizar.

O criterio de aceite da P0.B exige:

- item do mesmo Territory abre;
- item de outro Territory nao abre;
- item oculto/removido nao abre como publico;
- `getPostById(id)` nao e usado diretamente por UI publica;
- `?post=<id>` falha fechado quando o item nao pertence ao Territory atual.

## Findings

### P2-R1 - Cobertura de testes nao prova a rota completa `?post=<id>`

Status: nao bloqueante para a conclusao da P0.B, mas bloqueia confianca plena de regressao visual/roteamento.

Evidencia:

- `src/core/community/pages/ComunidadePage.tsx:209` injeta `feedDetailContext` em `useComunidadePage`.
- `src/core/community/hooks/page/useComunidadePage.ts:165` le `postId` de `searchParams`.
- `src/core/community/hooks/page/useComunidadePage.ts:166` chama `usePostById(postId, feedDetailContext)`.
- `src/core/community/hooks/usePostById.ts:44` chama `useFeedItemDetail`.
- `src/core/feed/hooks/useFeedItemDetail.ts:64` chama `feedService.getDetail`.

A cadeia estatica confirma que o deep-link passa pelo Feed. Porem a estrategia da P0.B previa teste de integracao de `?post=<id>` em rota territorial e regressao de abertura a partir do card. A suite atual cobre service, repository e hooks, mas nao encontrou teste de integracao renderizando `ComunidadePage`/`CommunityModals` com Router e query param real.

Impacto:

- Um refactor futuro pode quebrar a passagem de contexto da pagina para o hook sem ser detectado por teste de integracao.
- O boundary territorial principal esta coberto em camadas inferiores, entao nao ha evidencia de vazamento funcional atual.

Esforco estimado: S.

Risco: baixo.

Dependencia: harness de teste da pagina territorial com React Router/query param.

### P2-R2 - Teste de visibilidade cobre `hidden`, mas nao exercita explicitamente `is_removed=true` e `is_published=false`

Status: nao bloqueante para a conclusao da P0.B, mas deve ser fechado antes de Freeze completo.

Evidencia:

- `src/core/feed/types.ts:20` define `FeedVisibility` com `published`, `hidden`, `removed` e `unavailable`.
- `src/core/feed/services/FeedService.ts:74` resolve visibilidade antes de retornar detalhe publico.
- `src/core/feed/services/FeedService.ts:76` bloqueia qualquer visibilidade diferente de `published`.
- `src/core/feed/__tests__/FeedService.spec.ts:264` declara teste para hidden/removed, mas o fixture efetivamente usa `is_hidden: true` e `is_removed: false`.

Impacto:

- A implementacao trata `removed` e `unavailable`, mas a suite nao prova explicitamente os dois estados por fixture dedicada.
- O risco funcional e baixo porque a regra esta centralizada em `resolveFeedItemVisibility`, mas a cobertura nao esta completa contra regressao.

Esforco estimado: S.

Risco: baixo.

Dependencia: nenhuma.

### P3-R1 - Rollback documentado e suficiente em principio, mas nao lista todos os callers alterados

Status: nao bloqueante.

Evidencia:

- `docs/feed/FEED-P0.B-REPORT.md` descreve rollback tecnico mantendo o bloqueio de cross-territory.
- O rollback cita adapters/hook/modal, mas nao enumera explicitamente todos os callers tocados: `ComunidadePage`, `useComunidadePage`, `usePostById`, `usePost`, `CommunityModals`.

Impacto:

- Em rollback emergencial, o operador precisaria consultar o diff para restaurar exatamente os pontos de integracao.
- A regra principal de nao liberar item fora do Territory esta preservada no rollback documentado.

Esforco estimado: XS.

Risco: baixo.

Dependencia: nenhuma.

## Auditoria de escopo

### Implementado dentro da P0.B

- `FeedService.getDetail` foi criado e valida `FeedContext` antes de consultar repository.
- `FeedRepository.getDetail` encapsula `postService.getPostById` e aplica `TerritoryFilter` antes de retornar item.
- `useFeedItemDetail` foi criado como hook de Feed para detalhe territorial.
- `usePostById` foi migrado para usar `useFeedItemDetail`.
- `usePost` tambem passa pelo hook de Feed.
- `ComunidadePage` injeta `FeedContext` no fluxo de detalhe.
- `CommunityModals` renderiza estado indisponivel quando o detalhe nao pode ser exibido.
- `handleEditPost` passou a validar leitura de prefill via `FeedService.getDetail`.

### Nao implementado fora do escopo

Nao foi encontrada implementacao de P0.C ou superior antecipada:

- nao ha `FeedService.createItem`;
- nao ha rollout novo para criacao;
- nao ha migracao completa de comentarios/reacoes/saves/share para Feed Service;
- nao ha migracao de update/delete/hide para Feed Service;
- nao ha novo contrato de share canonico;
- nao ha nova arquitetura ou modulo.

### Residuos conhecidos fora da P0.B

Ainda existem operacoes publicas de Feed fora do Feed Service em areas que o roadmap deixou para P0.D, P1.A e sprints posteriores:

- `src/core/community/hooks/usePostById.ts:70` consulta interacoes do usuario via `postService.getPostUserInteractions` depois que o item ja foi validado pelo Feed.
- `src/core/community/hooks/usePostById.ts:82` consulta poll via `postService.getPollByPostId` depois que o item ja foi validado pelo Feed.
- `src/core/community/hooks/page/useComunidadePage.ts:151` ainda usa `usePostActions` para like/save/share/delete, conforme escopo futuro de P0.D/P1.A.

Esses residuos nao sao bypass de `getPostById` para detalhe e nao introduzem abertura de item fora do Territory na P0.B, mas continuam impedindo o congelamento total do dominio Feed ate as sprints correspondentes.

## Respostas obrigatorias

### 1. Todo o escopo da P0.B foi implementado?

Sim, para o comportamento funcional exigido: detalhe/modal/deep-link agora passam por `FeedService.getDetail` antes de renderizar item publico.

Ha lacuna nao bloqueante de cobertura de teste de integracao da rota `?post=<id>`, registrada como P2-R1.

### 2. Existe algo implementado que pertence a P0.C ou superior?

Nao foi encontrada implementacao funcional de P0.C ou superior.

O ajuste em `handleEditPost` usa `FeedService.getDetail` apenas para leitura segura de prefill antes da edicao. Ele nao implementa `FeedService.updateItem`, `deleteItem`, `createItem`, comments, reactions, share ou report.

### 3. Existe alguma violacao da GOVERNANCE?

No escopo especifico da P0.B, nao.

O detalhe territorial cumpre a porta oficial `FeedService.getDetail`. Os residuos de comments/reactions/share/delete continuam existindo, mas estao mapeados para P0.D/P1.A e nao foram antecipados nem agravados pela P0.B.

### 4. Alguma UI publica ainda consulta PostService diretamente para detalhe?

Nao para buscar o item de detalhe.

Busca de item por ID esta encapsulada em `FeedRepository.getDetail` (`src/core/feed/repositories/FeedRepository.ts:123`) e nao aparece em UI publica. A busca publica passa por:

`ComunidadePage` -> `useComunidadePage` -> `usePostById` -> `useFeedItemDetail` -> `FeedService.getDetail`.

### 5. Existe algum bypass ao FeedService.getDetail()?

Nao foi encontrado bypass para abertura de detalhe de post.

O unico `postService.getPostById` em codigo de Feed/Community auditado esta dentro de `FeedRepository.getDetail`, que e a dependencia interna autorizada pelo Service.

### 6. O deep-link (?post=<id>) sempre passa pelo Feed?

Sim no caminho publico territorial auditado.

`searchParams.get("post")` alimenta `usePostById`, que chama `useFeedItemDetail`, que chama `FeedService.getDetail`. Nao foi encontrado caminho alternativo que renderize o modal de detalhe sem passar por esse fluxo.

Lacuna: falta teste de integracao da rota real com `?post=<id>`.

### 7. Existe algum cenario onde um item de outro Territory ainda possa ser aberto?

Nao foi encontrado no fluxo migrado de detalhe.

O bloqueio ocorre em duas camadas:

- `validateFeedContext` exige coerencia entre `ResolvedTerritory`, `TerritoryFilter`, rollout e access policy.
- `FeedRepository.getDetail` rejeita item cujo `location_id` nao pertence ao `TerritoryFilter`.

### 8. Os estados hidden, removed e unavailable sao tratados corretamente?

Sim no codigo.

`FeedService.getDetail` chama `resolveFeedItemVisibility` e retorna `not_visible` sem item quando a visibilidade nao e `published`.

Cobertura de teste:

- `hidden`: coberto.
- `removed`: regra existe, mas falta fixture dedicada com `is_removed=true`.
- `unavailable`: coberto para contexto/target/mismatch; falta fixture dedicada para `is_published=false`.

### 9. Os testes realmente cobrem os cenarios criticos da governanca?

Cobrem parcialmente.

Coberto:

- contexto invalido falha fechado;
- target invalido falha fechado;
- item do mesmo Territory abre;
- item de outro Territory nao abre;
- filtro `group` aceita membro correto;
- filtro `none` nao consulta detalhe;
- `usePostById` nao chama `postService.getPostById` diretamente.

Nao coberto:

- integracao real de `?post=<id>` em rota territorial;
- abertura a partir do card ate modal;
- fixture explicita para `is_removed=true`;
- fixture explicita para `is_published=false`.

Essas lacunas reduzem confianca de regressao, mas nao contradizem a implementacao auditada.

### 10. O rollback descrito e suficiente para restaurar o comportamento anterior sem quebrar a arquitetura?

Parcialmente.

Ele e suficiente em principio porque preserva a regra de nao liberar item fora do Territory. Porem deveria listar todos os pontos alterados para rollback operacional completo:

- `FeedService.getDetail`;
- `FeedRepository.getDetail`;
- `useFeedItemDetail`;
- `usePostById`;
- `usePost`;
- `useComunidadePage`;
- `ComunidadePage`;
- `CommunityModals`.

## Veredito

A Sprint `FEED.P0.B` pode ser considerada oficialmente concluida para o escopo funcional de detalhe territorial e deep-link seguro.

Pendencias registradas nao bloqueantes:

- adicionar teste de integracao da rota `?post=<id>`;
- adicionar fixtures dedicadas para `is_removed=true` e `is_published=false`;
- detalhar rollback operacional completo.

Essas pendencias devem ser tratadas antes do congelamento completo do dominio Feed, mas nao impedem a conclusao oficial da P0.B porque o boundary funcional exigido foi implementado e nao foi encontrado vazamento territorial no detalhe migrado.
