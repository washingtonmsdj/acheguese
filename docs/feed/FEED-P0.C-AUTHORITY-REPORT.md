# FEED.P0.C.AUTHORITY - Implementation Report

Data: 2026-07-25

## Escopo

Sprint implementada exclusivamente para concluir a P0.C.

Base obrigatoria:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-P0.C-FINAL-REVIEW.md`
- `docs/feed/FEED-AUTHORITY-AUDIT.md`

Nao foram implementadas funcionalidades novas. Comentarios, reacoes, share, realtime, busca, moderacao e novas regras de negocio permaneceram fora do escopo.

## Objetivo

Eliminar o bloqueador final da P0.C: policies permissivas fabricadas por modulos satelite em fluxos de criacao de posts.

## Decisao Tecnica

`CommunityAccessPolicy.resolveCommunityAccess()` permanece como a unica regra canonica de AccessPolicy social territorial.

Foi criado um adaptador operacional fino para fluxos nao-React:

- `src/core/community/access/CommunityAccessAuthority.ts`

Esse adaptador nao cria nova matriz de permissoes. Ele apenas:

- recebe `profileId`, Territory resolvido, action, rollout e origem;
- carrega dados reais de perfil, roles, residencia, comunidade persistida e membership;
- chama `resolveCommunityAccess()`;
- retorna uma `CommunityAccessDecision` com auditoria de origem.

`CapabilityPreviewService` permaneceu fora da autoridade porque e explicitamente apenas hint de UI.

## Arquivos Alterados

- `src/core/community/access/CommunityAccessAuthority.ts`
- `src/core/community/access/index.ts`
- `src/core/community/access/__tests__/CommunityAccessAuthority.spec.ts`
- `src/core/feed/types.ts`
- `src/core/feed/services/createFeedContextForLocation.ts`
- `src/core/feed/__tests__/createFeedContextForLocation.spec.ts`
- `src/modules/mobility/hooks/useCommunityPosts.ts`
- `src/core/work-opportunities/services/WorkOpportunitiesService.ts`
- `src/core/verticals/jobs/services/VagaPublicationDistributionService.ts`

## Implementacao

### Community Access Authority

Criado `resolveCommunityAccessForService()`.

Responsabilidades:

- usar `profileService.getAccessibleProfileById()`;
- usar `adminRolesService.getUserRoles()`;
- usar `residenceService.getPrimaryResidence()`;
- usar `CommunityExperienceService.getCommunityProfile()`;
- usar `CommunityMembershipService.findByCommunityAndProfile()`;
- chamar `resolveCommunityAccess()` como unica regra;
- retornar `CommunityAccessAuthorityResult` com `audit.source = community-access-authority`.

Falha fechada:

- se o perfil nao existir, a decisao nao autoriza criacao;
- se a autoridade falhar, o resultado fica `unknown` e `isAllowed = false`;
- modulos nao conseguem passar `canCreateItem: true` ao adaptador.

### Feed Context para location_id

`createFeedContextForLocation()` deixou de aceitar `accessPolicyDecision` fabricada pelo caller.

Nova entrada:

- `locationId`;
- `authorProfileId`;
- `requestSource`;
- `canonicalFeedUrl`.

O helper agora:

- resolve a location real;
- resolve rollout real do modulo Community;
- chama `resolveCommunityAccessForService()`;
- converte a `CommunityAccessDecision` em `FeedPolicyDecision`;
- inclui `source` e `authority` auditaveis na policy do Feed.

### Mobility

Removida policy fixa permissiva.

`useCommunityPosts.createPost()` agora usa:

- `createFeedContextForLocation({ locationId, authorProfileId })`;
- `feedService.createItem()`.

Mantido fora do escopo:

- leitura de Mobility;
- likes;
- comentarios;
- nova UX de Mobility.

### Work Opportunities

Removida policy fixa permissiva.

`WorkOpportunitiesService.publishOpportunity()` agora usa `authorProfileId` para derivar AccessPolicy pela autoridade Community antes de chamar `feedService.createItem()`.

### Jobs/Vagas

Removida policy fixa permissiva.

`VagaPublicationDistributionService.distributePublishedVaga()` agora usa `owner_profile_id` para derivar AccessPolicy pela autoridade Community antes de chamar `feedService.createItem()`.

## Varredura

Foi executada varredura por:

- `canCreateItem: true`;
- `FEED_CREATE_POLICY`;
- `accessPolicyDecision` com constante permissiva;
- `postService.createPost`;
- `createPostWithImages`;
- `PostsFacade.mutations.createPost`;
- `mutations.createPost(`.

Resultado:

- nenhum hardcode `canCreateItem: true` permaneceu em fluxo publico migrado;
- ocorrencias restantes de `canCreateItem: true` ficam em testes;
- ocorrencias restantes de `postService.createPost()` ficam no `FeedRepository`, runtime interno de Posts ou testes;
- nenhum modulo satelite migrado cria post canonico fora de `FeedService.createItem()`.

## Testes

Executado:

- `npm run test -- src/core/community/access/__tests__/CommunityAccessAuthority.spec.ts`
  - Resultado: passou
  - Cobertura: 1 arquivo, 4 testes

- `npm run test -- src/core/feed/__tests__/createFeedContextForLocation.spec.ts`
  - Resultado: passou
  - Cobertura: 1 arquivo, 2 testes

- `npm run test -- src/core/feed`
  - Resultado: passou
  - Cobertura: 7 arquivos, 43 testes

Os testes cobrem:

- caller autorizado;
- caller nao autorizado;
- AccessPolicy derivada da autoridade Community;
- impossibilidade de modulo satelite autorizar propria criacao por policy fabricada.

## Validacoes Obrigatorias

- `npm run typecheck`
  - Resultado: passou

- `npm run lint`
  - Resultado: passou com 0 erros
  - Observacao: 13 warnings pre-existentes de mapas/home/onboarding, fora do escopo Feed.

- `npm run build`
  - Resultado: passou

- testes do Feed
  - Resultado: passou

## Aderencia A GOVERNANCE

- Feed continua sendo a porta publica de criacao.
- Community continua sendo a autoridade de permissao social.
- CommunityAccessPolicy continua sendo a unica regra canonica.
- Nenhum modulo satelite decide `canCreateItem` por conta propria.
- AccessPolicy e avaliada antes da mutation.
- Rollout e Territory continuam validados antes da mutation.
- Nenhuma regra nova de produto foi criada.

## Riscos Remanescentes

Riscos fora da P0.C:

- edicao de post ainda pertence a sprint futura;
- comentarios, reacoes, saves e share continuam em sprints futuras;
- leitura/social actions de Mobility ainda precisam de sprints posteriores;
- decisao de Produto/UX sobre target padrao em `TerritoryGroup` continua antes do Freeze.

Risco operacional:

- fluxos de Jobs/Oportunidades que antes publicavam por policy permissiva agora podem falhar fechado quando o perfil autor nao tiver autoridade comunitaria real. Isso e intencional para cumprir a GOVERNANCE; qualquer excecao service-to-service futura deve ser formal, auditavel e testada.

## Resultado

O bloqueador final da P0.C foi eliminado. A Sprint FEED.P0.C esta pronta para encerramento.
