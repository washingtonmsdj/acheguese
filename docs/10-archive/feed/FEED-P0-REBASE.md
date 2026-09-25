# FEED.P0.REBASE

Data: 2026-07-25

## Escopo

Esta reavaliacao considera as Sprints `FEED.P0.A` e `FEED.P0.B` oficialmente concluidas.

Base obrigatoria utilizada:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-P0.A-REPORT.md`
- `docs/feed/FEED-P0.B-REPORT.md`
- `docs/feed/FEED-P0.B-REVIEW.md`

Nao houve implementacao de codigo, alteracao de arquitetura, alteracao de governanca ou alteracao automatica do roadmap.

## Estado consolidado apos P0.A e P0.B

### P0.A concluida

Entregue:

- `FeedContext` canonico;
- `FeedTarget` canonico;
- `FeedService.listTimeline`;
- `FeedRepository.listTimeline`;
- `useFeedContext`;
- `useFeedTimeline`;
- query keys territoriais;
- fail-closed para timeline sem `ResolvedTerritory`, sem `TerritoryFilter`, com mismatch territorial, rollout pendente/bloqueado ou access policy pendente/bloqueada.

Impacto para proximas sprints:

- o boundary minimo existe;
- a timeline nominal ja possui porta pelo Feed Service;
- rollout e access policy ja entram no contexto como decisoes explicitas.

### P0.B concluida

Entregue:

- `FeedService.getDetail`;
- `FeedRepository.getDetail`;
- `useFeedItemDetail`;
- migracao de `usePostById`;
- migracao de `usePost`;
- detalhe por `?post=<id>` passando pelo Feed;
- bloqueio de item fora do Territory;
- bloqueio de item hidden/removed/unavailable no service;
- estado controlado para publicacao indisponivel.

Impacto para proximas sprints:

- detalhe ja valida o alvo antes de renderizar;
- `PostService.getPostById` nao aparece como porta publica de detalhe;
- actions do modal continuam fora da P0.B e permanecem como escopo de P0.D/P1.

### Lacunas nao bloqueantes herdadas

Registradas em `FEED-P0.B-REVIEW.md`:

- falta teste de integracao real para `?post=<id>` em rota territorial;
- falta fixture dedicada para `is_removed=true`;
- falta fixture dedicada para `is_published=false`;
- rollback da P0.B poderia listar todos os callers alterados.

Essas lacunas nao reabrem P0.B, mas devem entrar como hardening antes do Freeze completo.

## Reavaliacao da P0.C

### Dependencias satisfeitas

As dependencias estruturais da P0.C estao satisfeitas:

- `FeedContext` existe;
- `validateFeedContext` falha fechado;
- `useFeedContext` deriva rollout e access policy;
- `FeedService` e `FeedRepository` existem;
- `FeedTarget` existe para acoes futuras;
- timeline e detalhe ja usam o boundary do Feed.

Nao ha necessidade de nova sprint preparatoria antes da P0.C.

### O que a P0.C ainda precisa criar

A P0.C continua precisando implementar seus proprios contratos e callers:

- `FeedCreateItemInput`;
- `FeedCreateItemResult`;
- `FeedService.createItem`;
- repository/adapter interno para criacao via Posts;
- `useCreateFeedItem`;
- passagem de `FeedContext` para `CreatePostModal`;
- adaptacao de `/novo-post`;
- bloqueio de criacao sem Territory;
- bloqueio de criacao por rollout de bairro;
- bloqueio por AccessPolicy de criacao.

Esses itens nao sao dependencias ausentes: sao o proprio escopo da P0.C.

### Ponto tecnico importante

O `FeedPolicyDecision` atual expressa `canViewTimeline`, mas criacao exige decisao de mutation.

Isso nao exige alterar governanca nem arquitetura, mas a P0.C deve representar a permissao de criacao de forma explicita. O caminho recomendado e:

- manter `FeedContext` como contexto territorial;
- criar validacao/decisao especifica da operacao de criacao dentro do Feed Service;
- nao transformar `canViewTimeline` em atalho para `canCreate`;
- nao deixar `CreatePostModal` decidir sozinho se a mutation pode ocorrer.

## Parcialmente implementado de P0.C

Algumas pecas de UI ja existem, mas nao cumprem P0.C como boundary de dominio.

### Gating visual em `ComunidadePage`

Ja existe bloqueio de abertura do composer quando `communityAccess.can.create_post` e falso.

Isso ajuda UX, mas nao e suficiente para P0.C porque a regra de dominio precisa estar no `FeedService.createItem`, antes da mutation.

### Props de permissao em `CreatePostModal`

`CreatePostModal` ja recebe flags como `canCreatePost`, `canCreateAlert`, `canCreateIssue` e mensagens de bloqueio.

Isso pode ser reaproveitado como camada visual, mas nao deve continuar sendo o enforcement principal.

### Criacao ainda fora do Feed

O caminho nominal de publicacao ainda chama `postService.createPostWithImages` diretamente dentro de `CreatePostModal`.

O modal tambem ainda resolve `location_id` a partir do filtro ou do perfil. Isso e exatamente o risco que a P0.C precisa eliminar: quando a rota tiver Territory resolvido, a criacao nao pode cair silenciosamente no bairro do perfil.

### `/novo-post` ainda sem contexto territorial

`NovoPostPage` abre `CreatePostModal` sem `FeedContext`.

Esse e um ponto obrigatorio da P0.C: `/novo-post` precisa receber/resolver Territory ou falhar fechado/direcionar para selecao oficial.

## Respostas obrigatorias

### 1. Todas as dependencias da P0.C estao satisfeitas?

Sim, as dependencias estruturais estao satisfeitas.

P0.C pode iniciar sem nova sprint preparatoria porque P0.A entregou boundary/contexto e P0.B entregou detalhe seguro. A P0.C ainda precisa criar os contratos de criacao, mas isso pertence ao escopo dela.

Risco de atencao:

- `FeedPolicyDecision` atual e orientado a leitura (`canViewTimeline`);
- criacao precisa de validacao propria de mutation;
- `/novo-post` ainda nao possui contexto territorial.

### 2. Algum item originalmente previsto para P0.C ja foi parcialmente implementado?

Sim, parcialmente na camada visual:

- `ComunidadePage` ja usa `communityAccess.can.create_post` antes de abrir o composer;
- `CreatePostModal` ja possui props de permissao e mensagens de bloqueio;
- alguns componentes ja passam `locationId` para modais relacionados.

Nao esta implementado o nucleo da P0.C:

- nao existe `FeedService.createItem`;
- nao existe `useCreateFeedItem`;
- `CreatePostModal` ainda chama `postService.createPostWithImages`;
- o fallback para perfil ainda existe;
- `/novo-post` ainda nao opera por Territory resolvido;
- rollout/access policy ainda nao sao enforcement de dominio para a mutation.

### 3. Existe alguma oportunidade de simplificar as proximas sprints?

Sim.

Oportunidades:

- P0.C deve reaproveitar `useFeedContext` existente em vez de criar novo resolvedor paralelo.
- O gating visual ja existente em `ComunidadePage` pode permanecer como UX, mas o enforcement deve ser centralizado em `FeedService.createItem`.
- `CreatePostModal` pode receber um `FeedContext` e uma action/hook de criacao em vez de continuar resolvendo Territory por conta propria.
- A invalidacao de cache deve continuar usando query keys territoriais ja criadas em P0.A, evitando novo namespace.
- As lacunas de teste da P0.B podem ser resolvidas como hardening junto ao inicio da P0.C, sem alterar comportamento.

Nao simplificar:

- nao fundir criacao com comentarios/reacoes;
- nao migrar share canonico dentro da P0.C;
- nao transformar permissao visual do modal em decisao de dominio.

### 4. Alguma sprint pode ser fundida sem aumentar o risco?

Nao ha fusao recomendada entre P0.C, P0.D e P0.E.

Motivo:

- P0.C altera criacao e composer;
- P0.D altera comentarios, reacoes, saves e shares;
- P0.E altera Mobility e risco de feed global por tipo.

Fundir esses escopos aumentaria risco de regressao e dificultaria rollback.

O que pode ser feito sem aumentar risco:

- P0.E pode rodar em paralelo com uma parte da P0.D, desde que nao compartilhem os mesmos arquivos no mesmo momento.
- P0.D deve ser formalmente dividida em sub-sprints operacionais se a implementacao confirmar a complexidade ja prevista no execution plan.

### 5. Existe alguma ordem melhor de implementacao?

Sim, ha uma ordem recomendada mais precisa para o restante do P0.

Ordem recomendada:

1. `P0.C - Criacao territorial e rollout`
2. `P0.E - Mobility sem vazamento territorial`
3. `P0.D.1 - Comentarios e respostas por Feed Service`
4. `P0.D.2 - Reacoes, saves e contadores por Feed Service`
5. `P0.D.3 - Share action minimo sem fallback global`

Justificativa:

- P0.C deve continuar imediatamente apos P0.B porque impede criacao nova no Territory errado.
- P0.E e menor e remove um vazamento territorial confirmado em Mobility; pode entregar reducao de risco antes da sprint longa de engajamento.
- P0.D e a sprint de maior regressao comportamental e deve ser dividida para preservar rollback por operacao.
- Share canonico completo continua em P1.B, mas o share action minimo de P0.D deve impedir acao por alvo nao validado.

Se o time preferir manter a ordem oficial atual, ela ainda e valida. A recomendacao acima e uma melhoria de execucao, nao uma exigencia arquitetural.

### 6. Existe alguma divida tecnica criada pelas duas primeiras sprints?

Sim, mas nenhuma reabre P0.A ou P0.B.

Dividas herdadas:

- duplicacao temporaria entre adapters legados e Feed hooks;
- `usePostById` ainda enriquece item validado com interacoes/poll fora do Feed Service;
- `usePostActions` ainda controla like/save/share/delete por caminhos legados;
- teste de integracao de `?post=<id>` ainda nao existe;
- fixtures de `removed` e `unavailable` ainda nao estao completas;
- rollback da P0.B precisa de lista operacional mais precisa;
- `test:ssot:community` ainda falha por regras de navegacao fora do escopo.

Essas dividas sao esperadas pela estrategia incremental do roadmap, mas devem ser consumidas antes de Freeze.

### 7. O roadmap ainda representa a melhor sequencia de evolucao?

Parcialmente.

O roadmap ainda representa corretamente a cadeia de governanca:

`boundary -> detalhe -> criacao -> comentarios/reacoes -> mobility -> SSOT completo -> URL/share/search/moderacao/realtime`.

Porem, apos P0.A e P0.B, ha tres ajustes recomendados:

1. marcar P0.A e P0.B como concluidas no estado oficial do roadmap;
2. formalizar a divisao de P0.D em comentarios, engajamento e share action minimo;
3. permitir que P0.E suba antes de P0.D ou rode em paralelo controlado, por ser menor e tratar vazamento territorial confirmado.

## Rebase recomendado

### Sequencia recomendada de P0 restante

```text
P0.C
  Criacao territorial e rollout

P0.E
  Mobility sem vazamento territorial

P0.D.1
  Comentarios e respostas por Feed Service

P0.D.2
  Reacoes, saves e contadores por Feed Service

P0.D.3
  Share action minimo sem fallback global
```

### Hardening recomendado sem virar nova feature

Antes ou durante P0.C, executar como itens de baixo risco:

- adicionar teste de integracao de `?post=<id>` em rota territorial;
- adicionar teste de detalhe com `is_removed=true`;
- adicionar teste de detalhe com `is_published=false`;
- complementar rollback operacional da P0.B em relatorio futuro, sem alterar a implementacao.

Esses itens nao devem bloquear o inicio da P0.C, mas devem ser fechados antes de Freeze.

## Decisao

Roadmap recomendado para atualizacao.

Motivos tecnicos:

- P0.C esta pronta para iniciar e deve continuar como proxima sprint;
- P0.D ficou grande demais para permanecer como uma sprint unica de baixo controle;
- P0.E pode reduzir vazamento territorial antes da sprint longa de engajamento;
- P0.B deixou lacunas pequenas de teste/rollback que devem ser carregadas como hardening;
- a governanca e a arquitetura continuam corretas, mas o plano de execucao deve refletir o estado real apos duas sprints concluidas.
