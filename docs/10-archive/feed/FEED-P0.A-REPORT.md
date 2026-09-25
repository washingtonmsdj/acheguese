# FEED.P0.A - Implementation Report

Data: 2026-07-25

## Escopo Executado

Implementada exclusivamente a Sprint P0.A conforme `FEED-GOVERNANCE.md`, `FEED-ROADMAP.md` e `FEED-EXECUTION-PLAN.md`.

Esta sprint criou o boundary minimo do dominio Feed para a timeline nominal, sem antecipar composer, detail, comentarios, reacoes, moderacao, realtime, canonical URL ou deep-link.

## Implementacao

### Boundary Minimo

Arquivos criados:

- `src/core/feed/types.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/hooks/useFeedContext.ts`
- `src/core/feed/hooks/useFeedTimeline.ts`

Contratos criados:

- `FeedContext`
- `FeedItem`
- `FeedTimelineResult`
- `FeedTimelineInput`
- `FeedTimelineLocationScope`
- `FeedRequestSource`
- `FeedVisibility`
- `FeedRolloutDecision`
- `FeedPolicyDecision`

### Fail-closed Territorial

`FeedService.listTimeline()` e `FeedRepository.listTimeline()` nao executam consulta quando o `TerritoryFilter` esta em `scope: "none"`.

Resultado esperado sem territorio:

- `posts: []`
- `hasMore: false`
- nenhuma chamada ao `postService.getFeed()`

### Repository Wrapper

`FeedRepository` encapsula a conversao atual:

- `TerritoryFilter.scope === "location"` para `location_id` + `district_filter: true`
- `TerritoryFilter.scope === "group"` para `location_ids`
- `TerritoryFilter.scope === "none"` para empty result

Nenhuma query Supabase nova foi criada.

### Service

`FeedService.listTimeline()` passou a ser a porta de entrada da timeline nominal antes do reposititorio.

Nesta sprint, `rolloutDecision` e `accessPolicyDecision` entram no `FeedContext`, mas nao alteram comportamento de bloqueio da timeline. Isso preserva compatibilidade e evita antecipar regras de P0.B/P0.C.

### Query Keys

`feedQueryKeys.timeline()` agora deriva a chave do `TerritoryFilter` canonico via `territoryFilterKey()`.

A namespace legada foi preservada:

- raiz: `["community-feed"]`
- `communityFeedQueryKeys` continua exportada para invalidades existentes

### Migracao Nominal da Timeline

O hook `useCommunityFeedSimple()` deixou de montar `FeedParams` e deixou de chamar `postService.getFeed()` diretamente.

Fluxo atual:

`useCommunityFeedSimple()` -> `useFeedContext()` -> `useFeedTimeline()` -> `FeedService.listTimeline()` -> `FeedRepository.listTimeline()` -> `postService.getFeed()`

Superficies alinhadas para passar `routeResolved` quando ja disponivel:

- `CommunityFeed`
- `ComunidadePage`
- `CommunityOverviewSurface`
- `CidadeLandingPage`
- `TerritoryHomePage` ja passava `routeResolved`

## Fora de Escopo Mantido

Nao foi implementado:

- detalhe de post
- criacao, edicao ou exclusao
- comentarios ou respostas
- reacoes
- compartilhamento
- denuncia
- moderacao
- anexos
- hashtags
- busca do feed
- realtime
- notificacoes
- canonical URL
- novas tabelas
- migrations
- novo modulo
- redesign

## Testes Criados

Arquivos:

- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/queryKeys.spec.ts`

Cobertura:

- fail-closed sem territorio resolvido
- conversao de filtro `location` para parametros canonicos
- conversao de filtro `group` para `location_ids`
- delegacao do service para repository
- estabilidade de query keys por `TerritoryFilter`
- compatibilidade da namespace legada `communityFeedQueryKeys`

## Validacao Executada

### Testes relacionados do Feed

Comando:

`npm run test -- src/core/feed`

Resultado:

- Passou
- 3 arquivos
- 8 testes

### Typecheck

Comando:

`npm run typecheck`

Resultado:

- Passou

### Lint

Comando:

`npm run lint`

Resultado:

- Passou
- 0 erros
- 13 warnings preexistentes de `maps/no-manual-entity-projection` em arquivos de mapa fora do escopo desta sprint

### Build

Comando:

`npm run build`

Resultado:

- Passou

### Teste SSOT de comunidade

Comando:

`npm run test:ssot:community`

Resultado:

- Falhou em 2 asserts de `src/core/community/__tests__/CommunityNavigationSSOT.test.ts`
- Falhas observadas:
  - `resolveCommunityFeedChannelFromTab("eventos")` retornou `"eventos"` em vez de `"para_voce"`
  - `resolveCommunityFeedQueryTabFromChannel("vagas")` retornou `"oportunidades"` em vez de `null`

Observacao:

Essas falhas estao em regras de navegacao de abas pausadas e nao foram causadas por arquivos alterados nesta sprint. Nenhum arquivo de `communityFeedTab` foi modificado em FEED.P0.A.

## Respostas de Aceite

### Existe boundary minimo do Feed?

Sim.

### A timeline nominal usa Feed Service antes de chegar ao Post Service?

Sim.

### Algum componente passou a consultar Supabase diretamente?

Nao.

### O hook migrado continua usando TerritoryFilter canonico?

Sim.

### A operacao falha fechada sem territorio?

Sim, para `TerritoryFilter.scope === "none"`.

### Foi alterado contrato fora do escopo?

Nao. A API publica de `useCommunityFeedSimple()` foi mantida, e o prop novo `resolved` em `CommunityFeed` e opcional.

### Foi antecipada alguma tarefa P0.B+?

Nao. As decisoes de rollout e access policy foram carregadas no contexto, mas nao passaram a bloquear fluxo nesta sprint.

## Riscos Residuais

- Registro historico: este risco foi eliminado em `FEED.P0.A.FINALIZE` com validacao fail-closed para `ResolvedTerritory` ausente, mismatch entre `ResolvedTerritory` e `TerritoryFilter`, Rollout pendente/ausente e AccessPolicy pendente/ausente.
- O pacote `test:ssot:community` possui falha fora do escopo que deve ser tratada em sprint propria de navegacao/launch tabs ou ajustada na suite se a regra atual for intencional.

## Rollback Tecnico Correto

O rollback operacional correto nao e reverter `CommunityFeed` para `useCommunityFeedSimple`, porque `CommunityFeed` ja permanece chamando esse hook como API publica de compatibilidade.

Se for necessario desfazer a migracao da timeline nominal, o rollback deve:

1. Reverter `src/core/community/hooks/feed/useCommunityFeed.ts` para a implementacao anterior baseada diretamente em `useInfiniteQuery` e `postService.getFeed()`, ou introduzir temporariamente um adapter legado interno com o mesmo comportamento anterior.
2. Preservar a namespace `communityFeedQueryKeys` / `["community-feed"]` para nao quebrar invalidacoes existentes durante o rollback.
3. Remover ou ignorar apenas os pass-throughs opcionais de `resolvedLocationIds` e `activeMemberIds` nos callers caso eles deixem de ser usados pelo adapter legado.
4. Manter os arquivos novos de `src/core/feed/*` inertes se nao forem importados pela timeline rollbackada; eles nao possuem side effects fora do caminho migrado.
5. Nunca trocar a validacao fail-closed por defaults permissivos para contornar erro de contexto; se o rollback for usado por falha de contexto territorial, a causa deve permanecer visivel.

## Status

Sprint FEED.P0.A implementada.

O dominio Feed iniciou o boundary minimo da timeline, mas ainda nao esta congelado. O congelamento depende das proximas sprints P0 definidas no roadmap.
