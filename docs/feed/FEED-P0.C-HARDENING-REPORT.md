# FEED.P0.C - Hardening Report

Data: 2026-07-25

## Escopo

Hardening executado exclusivamente para encerrar os bloqueadores apontados em:

- `docs/feed/FEED-P0.C-REVIEW.md`
- `docs/feed/FEED-P0.C-REPORT.md`
- `docs/feed/FEED-GOVERNANCE.md`

Esta etapa nao implementou funcionalidades de P0.D, P0.E ou superiores. Comentarios, reacoes, saves, share, realtime, busca, nova Mobility e moderacao permaneceram fora do escopo.

## Bloqueadores Tratados

### P0.C-REV-01 - Criacoes publicas/verticais fora do FeedService

Status: resolvido.

Foram migrados os caminhos restantes de criacao de post apontados pela review:

- `src/modules/mobility/hooks/useCommunityPosts.ts`
- `src/modules/mobility/components/community/CommunityRideFeed.tsx`
- `src/core/work-opportunities/services/WorkOpportunitiesService.ts`
- `src/core/verticals/jobs/services/VagaPublicationDistributionService.ts`

As criacoes agora passam por `FeedService.createItem()` antes de chegar ao repository. O comportamento existente foi preservado usando o `location_id` ja recebido por cada fluxo como alvo territorial, sem fallback para bairro do perfil.

### P0.C-REV-02 - Lacunas de testes de criacao

Status: resolvido.

Foram adicionados testes diretos em `src/core/feed/__tests__/FeedService.spec.ts` cobrindo:

- rollout bloqueado;
- rollout inativo;
- mismatch entre `TerritoryFilter` e `ResolvedTerritory`;
- garantia de que `FeedRepository.createItem()` nao e chamado quando o contexto falha fechado.

### P0.C-REV-03 - TerritoryGroup com primeiro membro como target

Status: documentado como excecao de compatibilidade.

O comportamento atual foi mantido porque esta hardening nao pode alterar UX nem criar nova decisao de produto. A escolha do primeiro membro do `TerritoryGroup` continua sendo uma excecao operacional restrita ao grupo resolvido, nao um fallback para bairro do perfil.

Decisao registrada:

- para P0.C, o comportamento pode permanecer porque o target continua limitado aos membros do Territory resolvido;
- antes do Freeze, Produto/UX deve decidir se publicacoes em `TerritoryGroup` exigirao selecao explicita de bairro ou se o grupo tera semantica propria de publicacao;
- nenhuma mudanca de UX foi feita nesta hardening.

## Arquivos Alterados

- `src/core/feed/index.ts`
- `src/core/feed/services/createFeedContextForLocation.ts`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/modules/mobility/hooks/useCommunityPosts.ts`
- `src/modules/mobility/components/community/CommunityRideFeed.tsx`
- `src/core/work-opportunities/services/WorkOpportunitiesService.ts`
- `src/core/verticals/jobs/services/VagaPublicationDistributionService.ts`

## Implementacao

### Contexto de Feed para fluxos por location_id

Foi criado `createFeedContextForLocation()` para montar um `FeedContext` a partir de um `locationId` canonico.

Responsabilidades:

- resolver a location via repository oficial;
- montar `ResolvedTerritory` do tipo `location`;
- montar `TerritoryFilter` consistente com a location;
- derivar rollout real do modulo Community para a location;
- aceitar `AccessPolicy` explicita do caller;
- falhar fechado com rollout `unknown` quando a location ou rollout nao puderem ser resolvidos.

O helper nao cria default permissivo de acesso. Cada fluxo migrado precisa declarar sua decisao de acesso explicitamente.

### Mobility

`useCommunityPosts.createPost()` deixou de chamar `postService.createPost()` diretamente e passou a publicar por `feedService.createItem()`.

Mantido fora do escopo:

- leitura por `getPostsByType`;
- comentarios;
- likes;
- qualquer nova funcionalidade de Mobility.

### Work Opportunities

`WorkOpportunitiesService.publishOpportunity()` deixou de chamar `postService.createPost()` diretamente e passou a publicar por `feedService.createItem()`.

O post criado continua associado ao `territoryLocationId` recebido pelo fluxo existente.

### Jobs/Vagas

`VagaPublicationDistributionService.distributeToCommunityFeed()` deixou de chamar `postService.createPost()` diretamente e passou a publicar por `feedService.createItem()`.

O post criado continua associado ao `territoryLocationId` da vaga.

## Validacao Contra GOVERNANCE

- Criacao publica migrada para `FeedService.createItem()`: atendido.
- Criacao sem `ResolvedTerritory` falha fechado: atendido.
- Criacao com rollout bloqueado/inativo falha fechado: atendido.
- Criacao com mismatch territorial falha fechado: atendido.
- Repository nao e chamado quando o contexto e invalido: atendido por teste.
- Fallback para bairro do perfil: nao identificado nos caminhos migrados.
- `PostService` permanece apenas atras do boundary interno do `FeedRepository` ou em operacoes fora do escopo da P0.C.

## Varredura

Foi executada varredura por criacoes diretas com:

- `postService.createPost`
- `createPostWithImages`
- `PostsFacade.mutations.createPost`
- `mutations.createPost(`

Resultado relevante:

- nao restou bypass publico de criacao nos caminhos apontados pela review;
- ocorrencias restantes ficam em testes estaticos, runtime interno de posts ou `FeedRepository`, que e o boundary permitido.

## Testes E Build

Executado:

- `npm run test -- src/core/feed`
  - Resultado: passou
  - Cobertura executada: 6 arquivos, 41 testes

- `npm run typecheck`
  - Resultado: passou

- `npm run lint`
  - Resultado: passou com 0 erros
  - Observacao: 13 warnings pre-existentes de `maps/no-manual-entity-projection` em home/onboarding/mapas, fora do escopo Feed.

- `npm run build`
  - Resultado: passou

## Riscos Residuais

- `CreatePostModal` ainda possui edicao via `postService.updatePost()`. Isso nao pertence a P0.C, que trata exclusivamente criacao.
- Mobility ainda possui leitura, comentarios e likes fora do Feed Service. Esses itens pertencem a sprints futuras e nao foram migrados nesta hardening.
- `TerritoryGroup` ainda usa primeiro membro como target padrao em callers existentes. Mantido como excecao de compatibilidade ate decisao de Produto/UX antes do Freeze.

## Rollback

Rollback tecnico desta hardening:

1. Remover `createFeedContextForLocation()` e seu export.
2. Reverter Mobility, Work Opportunities e Jobs para os respectivos calls anteriores de `postService.createPost()`.
3. Remover os testes adicionados em `FeedService.spec.ts`.

Impacto do rollback:

- reabriria os bypasses identificados em `FEED-P0.C-REVIEW.md`;
- nao deveria afetar P0.A/P0.B se limitado aos arquivos desta hardening;
- restauraria o comportamento anterior dos fluxos verticais.

## Resultado

Os bloqueadores da review da P0.C foram tratados dentro do escopo permitido. A Sprint FEED.P0.C esta pronta para nova review.
