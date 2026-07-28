# FEED.P0.C - Final Review

Data: 2026-07-25

## Escopo

Revisao final da Sprint FEED.P0.C apos a hardening.

Documentos comparados:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-P0.C-REPORT.md`
- `docs/feed/FEED-P0.C-REVIEW.md`
- `docs/feed/FEED-P0.C-HARDENING-REPORT.md`

Esta revisao nao alterou codigo e nao implementou nenhuma funcionalidade.

## Resultado Executivo

A hardening resolveu os dois bloqueadores tecnicos identificados na review anterior:

- os caminhos restantes de criacao via `postService.createPost()` foram migrados para `FeedService.createItem()`;
- a suite de `FeedService.createItem()` passou a cobrir rollout bloqueado, rollout inativo, mismatch de `TerritoryFilter` e garantia de que o repository nao e chamado nesses cenarios.

Tambem foi documentada a excecao atual de `TerritoryGroup` com primeiro membro como target. Essa decisao pode permanecer como tema de Produto/UX antes do Freeze, porque nao e fallback para bairro do perfil e nao cria bypass direto ao `FeedService.createItem()`.

Porem a revisao final encontrou uma violacao residual de GOVERNANCE relacionada a criacao: os novos adaptadores de Mobility, Work Opportunities e Jobs passam uma `FeedPolicyDecision` fixa com `canCreateItem: true`. Isso faz o Feed validar uma afirmacao permissiva do proprio caller, nao uma decisao real de AccessPolicy.

Por esse motivo, a P0.C ainda nao deve ser encerrada oficialmente.

## Evidencias De Fechamento Dos Bloqueadores Anteriores

### Criacao direta fora do FeedService

Status: resolvido para posts canonicos de Feed.

Varredura executada:

- `postService.createPost`
- `createPostWithImages`
- `PostsFacade.mutations.createPost`
- `mutations.createPost(`

Resultado:

- `src/core/feed/repositories/FeedRepository.ts` permanece como boundary interno permitido;
- `src/core/posts/services/post.service.runtime.ts` permanece como runtime interno de Posts;
- testes continuam mockando/verificando o boundary;
- nao foi encontrado caller publico de post canonico criando fora de `FeedService.createItem()`.

Observacao:

- `src/core/community-lost-found/services/LostFoundService.ts` possui metodo `createPost`, mas grava em `lost_found_posts`, nao em post canonico de Feed. Nao foi classificado como bypass da P0.C.

### Testes de bloqueio de criacao

Status: resolvido no nivel do `FeedService`.

Evidencia em `src/core/feed/__tests__/FeedService.spec.ts`:

- criacao sem `ResolvedTerritory` falha fechado;
- rollout bloqueado falha fechado;
- rollout inativo falha fechado;
- mismatch entre `TerritoryFilter` e `ResolvedTerritory` falha fechado;
- AccessPolicy sem `canCreateItem` falha fechado;
- target fora do Territory falha fechado;
- `FeedRepository.createItem()` nao e chamado nos cenarios bloqueados.

### TerritoryGroup

Status: documentado, nao encerrado como decisao de produto.

A hardening manteve o comportamento atual como excecao de compatibilidade. Isso nao bloqueia sozinho a P0.C porque:

- nao e fallback para bairro do perfil;
- o target continua restrito aos membros do TerritoryGroup resolvido;
- a mudanca para exigir selecao explicita alteraria UX, o que estava proibido na hardening.

Antes do Freeze, Produto/UX ainda precisa decidir se o primeiro membro pode continuar sendo target padrao ou se o usuario deve escolher explicitamente o bairro dentro do grupo.

## Finding Final

### P0.C-FINAL-01 - AccessPolicy permissiva fixa nos adaptadores migrados

Status: bloqueador de encerramento.

Evidencia:

- `src/modules/mobility/hooks/useCommunityPosts.ts:48` define `MOBILITY_FEED_CREATE_POLICY`.
- `src/modules/mobility/hooks/useCommunityPosts.ts:51` fixa `canCreateItem: true`.
- `src/core/work-opportunities/services/WorkOpportunitiesService.ts:29` define `WORK_OPPORTUNITY_FEED_CREATE_POLICY`.
- `src/core/work-opportunities/services/WorkOpportunitiesService.ts:32` fixa `canCreateItem: true`.
- `src/core/verticals/jobs/services/VagaPublicationDistributionService.ts:47` define `JOBS_FEED_CREATE_POLICY`.
- `src/core/verticals/jobs/services/VagaPublicationDistributionService.ts:50` fixa `canCreateItem: true`.
- `src/core/feed/services/createFeedContextForLocation.ts:15` exige `accessPolicyDecision` do caller, mas nao deriva a decisao de uma fonte oficial.

Analise:

- A migracao removeu o bypass tecnico ao `PostService`.
- O rollout e o `TerritoryFilter` agora passam pelo boundary do Feed.
- A AccessPolicy, porem, nao e uma decisao real de Community/AccessPolicy nesses fluxos.
- O `FeedService.createItem()` valida corretamente `canCreateItem`, mas o valor recebido ja vem permissivo do proprio adaptador.

Impacto:

- Um modulo satelite ainda consegue autorizar a propria criacao de Feed sem prova de permissao territorial real.
- Isso viola a GOVERNANCE, que exige AccessPolicy como decisao obrigatoria antes de mutation.
- Esse problema pertence a P0.C porque afeta diretamente a criacao de posts, nao comentarios, reacoes, saves, share, busca, realtime ou moderacao.

Correcao necessaria antes do encerramento:

- substituir as policies fixas por decisao real de AccessPolicy; ou
- formalizar uma excecao service-to-service auditavel, com contrato explicito, fonte de autorizacao e testes que provem que caller nao autorizado nao cria item de Feed.

## Respostas Obrigatorias

### 1. Todos os bloqueadores da review anterior foram resolvidos?

Sim quanto aos bloqueadores tecnicos explicitamente apontados:

- criacao direta por `postService.createPost()` nos paths de Mobility, Work Opportunities e Jobs foi removida;
- testes diretos de rollout bloqueado/inativo, mismatch territorial e repository nao chamado foram adicionados.

O item de `TerritoryGroup` foi documentado como excecao de compatibilidade e decisao de Produto/UX antes do Freeze.

### 2. Ainda existe algum caller publico criando posts fora do FeedService.createItem()?

Nao foi encontrado caller publico criando post canonico de Feed fora de `FeedService.createItem()`.

As ocorrencias restantes de `postService.createPost()` ficam no `FeedRepository`, runtime interno de Posts ou testes.

### 3. Ainda existe alguma violacao da GOVERNANCE relacionada a criacao de posts?

Sim.

Os adaptadores migrados para Mobility, Work Opportunities e Jobs usam `FeedPolicyDecision` fixa com `canCreateItem: true`. Isso nao comprova AccessPolicy real e permite que o caller satelite autorize a propria criacao.

### 4. A cobertura de testes agora atende aos criterios definidos para a P0.C?

Parcialmente.

Atende aos criterios diretos de `FeedService.createItem()` pedidos na hardening:

- rollout bloqueado;
- rollout inativo;
- mismatch de `TerritoryFilter`;
- repository nao chamado quando contexto falha.

Nao cobre o novo problema encontrado nesta final review:

- adaptadores satelites com AccessPolicy fixa e permissiva.

### 5. Os riscos remanescentes pertencem realmente a sprints futuras ou ao dominio de Produto/UX?

Parcialmente.

Pertencem a sprints futuras ou Produto/UX:

- edicao ainda via `postService.updatePost()`;
- comentarios, likes e leitura de Mobility fora do Feed Service;
- decisao de UX para target default em `TerritoryGroup`.

Nao pertence a sprint futura:

- AccessPolicy fixa e permissiva nos fluxos de criacao migrados. Isso e criterio central da P0.C.

### 6. Existe algum motivo tecnico para impedir o encerramento oficial da P0.C?

Sim.

Enquanto Mobility, Work Opportunities e Jobs puderem chamar `FeedService.createItem()` com policy permissiva fixa, a criacao passa pelo boundary tecnico do Feed, mas ainda nao respeita integralmente a GOVERNANCE de AccessPolicy.

## Decisao

A Sprint FEED.P0.C ainda nao pode ser encerrada.

Motivo exato: a hardening removeu os bypasses diretos de criacao, mas introduziu ou manteve autorizacao fixa nos adaptadores migrados. Antes do encerramento oficial, esses adaptadores precisam derivar AccessPolicy real ou ter uma excecao service-to-service formal, auditavel e testada.
