# FEED.P0.A - Review

Data: 2026-07-25

## Escopo Da Review

Esta review audita exclusivamente a implementacao da Sprint `FEED.P0.A`.

Documentos comparados:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-P0.A-REPORT.md`

Arquivos de implementacao analisados:

- `src/core/feed/types.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/hooks/useFeedContext.ts`
- `src/core/feed/hooks/useFeedTimeline.ts`
- `src/core/feed/queryKeys.ts`
- `src/core/feed/index.ts`
- `src/core/community/hooks/feed/useCommunityFeed.ts`
- `src/core/community/components/feed/CommunityFeed.tsx`
- `src/core/community/pages/ComunidadePage.tsx`
- `src/core/community/components/page/CommunityOverviewSurface.tsx`
- `src/app/pages/CidadeLandingPage.tsx`
- `src/core/feed/__tests__/*`

Nenhum codigo foi alterado nesta review.

## Findings

### P0.A-R1 - Validacao de contexto nao exige `ResolvedTerritory`

Status: desvio de criterio de aceite da P0.A.

Evidencia:

- `FEED-EXECUTION-PLAN.md` exige helper que falha fechado sem `ResolvedTerritory` e `TerritoryFilter`.
- `FEED-ROADMAP.md` define como criterio de aceite: nenhuma operacao migrada executa sem `ResolvedTerritory` e `TerritoryFilter`.
- `src/core/feed/types.ts` permite `resolvedTerritory: ResolvedTerritory | null`.
- `isFeedContextReady()` valida apenas `territoryFilter`.
- `FeedService.listTimeline()` usa `isFeedContextReady()` e, portanto, pode chamar o repository mesmo com `resolvedTerritory: null`, desde que o `TerritoryFilter` esteja pronto.
- `useCommunityFeedSimple()` cria `FeedContext` com `resolvedTerritory: routeResolved ?? null`.

Impacto:

O boundary reduz o risco de timeline global, mas ainda nao prova que o filtro territorial pertence ao `ResolvedTerritory` atual. Isso deixa uma abertura conceitual para mismatch entre rota e filtro.

Conclusao:

P0.A nao cumpre integralmente a regra "falha fechado sem `ResolvedTerritory` e `TerritoryFilter`".

### P0.A-R2 - `useFeedContext` nao compoe Rollout e AccessPolicy reais

Status: implementacao parcial do item 6 da P0.A.

Evidencia:

- `FEED-EXECUTION-PLAN.md` exige criar `useFeedContext` para compor Territory, Rollout e AccessPolicy.
- `src/core/feed/hooks/useFeedContext.ts` aceita `rolloutDecision` e `accessPolicyDecision`, mas quando nao sao fornecidos cria defaults permissivos.
- Defaults atuais:
  - rollout: `isBlocked: false`, `isActive: true`
  - access: `canViewTimeline: true`
- Nao ha leitura real de Community Rollout ou AccessPolicy dentro do hook.

Impacto:

O contexto carrega campos de rollout e access, mas a implementacao nao garante que uma decisao real exista. Isso nao antecipa P0.C/P1.3, mas fica abaixo do contrato descrito para a P0.A.

Conclusao:

O modelo estrutural existe, mas a composicao real de Rollout e AccessPolicy nao foi implementada.

### P0.A-R3 - `FeedTarget` nao foi criado

Status: item previsto nao implementado.

Evidencia:

- `FEED-EXECUTION-PLAN.md` lista `FeedTarget` entre os tipos internos da P0.A.
- `FEED-GOVERNANCE.md` define `FeedTarget` como entidade canonica do Feed.
- `src/core/feed/types.ts` criou `FeedContext`, `FeedItem`, `FeedVisibility` e `FeedPolicyDecision`, mas nao criou `FeedTarget`.

Impacto:

Para a timeline, a ausencia de `FeedTarget` nao quebra runtime. Para as proximas sprints, porem, detalhe, comentarios, reacoes, compartilhamento e denuncia dependerao desse conceito.

Conclusao:

Escopo de tipos da P0.A esta incompleto.

### P1-R1 - Testes nao cobrem todos os gates do boundary

Status: cobertura parcial.

Evidencia:

- Testes cobrem:
  - fail-closed por `TerritoryFilter.scope === "none"`;
  - location filter;
  - group filter no repository;
  - query keys territoriais;
  - compatibilidade da namespace legada.
- Testes nao cobrem:
  - contexto com `resolvedTerritory: null` e `TerritoryFilter` pronto;
  - mismatch entre `ResolvedTerritory` e `TerritoryFilter`;
  - Rollout ausente versus rollout real;
  - AccessPolicy ausente versus policy real;
  - hook `useFeedContext`;
  - hook `useFeedTimeline` com query disabled por contexto invalido;
  - smoke visual manual da timeline principal.

Impacto:

Os testes provam parte do boundary, mas nao provam o criterio normativo mais importante da P0.A: operar somente com contexto territorial completo.

Conclusao:

Cobertura suficiente para o wrapper tecnico, insuficiente para declarar a sprint oficialmente fechada.

### P1-R2 - Rollback documentado no report esta impreciso

Status: risco operacional documental.

Evidencia:

- `FEED-P0.A-REPORT.md` diz que o rollback seria "Reverter `CommunityFeed` para `useCommunityFeedSimple`".
- No codigo atual, `CommunityFeed` ja continua usando `useCommunityFeedSimple`.
- O rollback real seria reverter `useCommunityFeedSimple()` para a implementacao anterior com `useInfiniteQuery` e `postService.getFeed()`, ou criar um adapter legado temporario.

Impacto:

O rollback tecnico e viavel, porque a namespace de cache foi preservada e a API publica do hook foi mantida. Mas o procedimento descrito no report nao e preciso.

Conclusao:

Rollback funciona tecnicamente, mas precisa ser descrito corretamente antes de considerar a sprint pronta para governanca oficial.

## Pontos Conformes

### Boundary de timeline criado

Conforme.

`FeedService.listTimeline()` existe e passou a ser usado pelo caminho nominal da timeline.

### Repository wrapper criado

Conforme.

`FeedRepository` encapsula a conversao `TerritoryFilter -> FeedParams` e e o unico ponto de chamada a `postService.getFeed()` para a timeline migrada.

### Query keys territoriais criadas

Conforme.

`feedQueryKeys.timeline()` deriva chave a partir do `TerritoryFilter`, e `communityFeedQueryKeys` preserva compatibilidade de invalidacao.

### Timeline nominal migrada

Conforme com ressalvas.

`useCommunityFeedSimple()` deixou de montar `FeedParams` e deixou de chamar `postService.getFeed()` diretamente. Ele agora usa `useFeedContext()` e `useFeedTimeline()`.

Ressalva: a migracao ainda permite `resolvedTerritory: null` com `TerritoryFilter` pronto.

### Nao houve implementacao funcional de P0.B+

Conforme.

Nao foram migrados detalhe, composer, comentarios, reacoes, compartilhamento, denuncia, moderacao, realtime, busca ou Mobility.

## Respostas Obrigatorias

### 1. Todo o escopo da P0.A foi implementado?

Nao.

Foi implementada a parte principal da timeline:

- `FeedService.listTimeline`;
- `FeedRepository`;
- `useFeedTimeline`;
- `useFeedContext`;
- query keys territoriais;
- migracao nominal de `useCommunityFeedSimple`;
- testes unitarios focados.

Ficaram pendentes ou parciais:

- `FeedTarget` nao foi criado;
- a validacao nao falha fechado sem `ResolvedTerritory`;
- Rollout e AccessPolicy foram modelados como campos, mas nao compostos de forma real;
- testes nao cobrem `ResolvedTerritory` ausente/mismatch nem rollout/access reais;
- smoke visual manual nao foi evidenciado no report.

### 2. Existe algo implementado que pertence a P0.B ou superior?

Nao ha evidencia de implementacao funcional de P0.B ou superior.

Campos como `canonicalFeedUrl`, `requestSource`, `FeedVisibility` e placeholders de policy existem como estrutura de contexto prevista pela governanca, mas nao implementam detalhe, share, busca, notificacao, moderacao ou realtime.

### 3. Existe alguma violacao da GOVERNANCE?

Sim, parcial.

Violacoes ou nao conformidades:

- `FeedContext` permite `resolvedTerritory: null`;
- `isFeedContextReady()` ignora `ResolvedTerritory`;
- timeline pode executar com `TerritoryFilter` pronto mesmo sem `ResolvedTerritory`;
- `useFeedContext` cria defaults permissivos para Rollout e AccessPolicy.

Nao foi encontrada violacao de componente chamando Supabase diretamente para a timeline migrada.

### 4. Existe algum bypass ao FeedService?

Para a timeline nominal migrada, nao.

Busca estatica encontrou `postService.getFeed()` apenas em:

- `src/core/feed/repositories/FeedRepository.ts`;
- testes do Feed;
- comentarios/documentacao de exemplo;
- implementacao interna do proprio PostService.

Isso esta compativel com a excecao de repository interno.

### 5. Alguma chamada publica ainda acessa PostService diretamente na timeline?

Nao foi encontrada chamada publica direta a `postService.getFeed()` na timeline.

`useCommunityFeedSimple()` nao chama mais `postService.getFeed()` diretamente.

### 6. Existe duplicacao entre `useCommunityFeedSimple` e `useFeedTimeline`?

Duplicacao relevante, nao.

`useCommunityFeedSimple()` virou um adapter de compatibilidade que:

- resolve/recebe `TerritoryFilter`;
- cria `FeedContext`;
- chama `useFeedTimeline`;
- preserva o shape antigo de retorno.

A logica de query, query key, paginacao e chamada ao service ficou em `useFeedTimeline`.

### 7. Existe risco de regressao?

Sim, medio.

Riscos principais:

- contexto pode executar com `resolvedTerritory: null`;
- defaults permissivos podem esconder falta de Rollout ou AccessPolicy;
- testes nao cobrem mismatch entre rota e filtro;
- chamadas de preview com apenas `TerritoryFilter` continuam possiveis;
- o pacote `test:ssot:community` reportado falhou em asserts de navegacao fora do escopo.

Risco reduzido:

- API publica de `useCommunityFeedSimple()` foi preservada;
- namespace de cache `community-feed` foi preservada;
- comportamento visual da timeline nao foi redesenhado.

### 8. O rollback realmente funciona?

Parcialmente sim.

Funciona tecnicamente porque:

- os arquivos novos podem ficar inativos;
- `communityFeedQueryKeys` manteve a namespace anterior;
- `useCommunityFeedSimple()` preservou shape de retorno;
- os callers publicos podem continuar chamando o mesmo hook.

Mas o rollback descrito no report esta impreciso. O rollback correto nao e "reverter `CommunityFeed` para `useCommunityFeedSimple`", porque isso ja ocorre. O rollback correto seria:

- reverter `src/core/community/hooks/feed/useCommunityFeed.ts` para a implementacao anterior;
- ou introduzir temporariamente um adapter legado interno para a timeline;
- remover ou ignorar o prop opcional `resolved` em `CommunityFeed` se necessario.

### 9. Os testes cobrem o boundary criado?

Cobrem parcialmente.

Cobrem:

- repository wrapper;
- service fail-closed por `TerritoryFilter.scope === "none"`;
- query keys territoriais;
- compatibilidade de namespace antiga.

Nao cobrem:

- falha fechada sem `ResolvedTerritory`;
- mismatch `ResolvedTerritory` x `TerritoryFilter`;
- composicao real de Rollout;
- composicao real de AccessPolicy;
- hooks React do Feed;
- city/neighborhood como tipos de `ResolvedTerritory`;
- smoke visual manual.

### 10. A Sprint pode ser considerada oficialmente concluida?

Nao.

A Sprint pode ser considerada funcionalmente encaminhada para a timeline nominal, mas nao oficialmente concluida pela governanca porque ha desvios nos criterios centrais da P0.A.

## Decisao Final

FEED.P0.A nao deve ser marcada como oficialmente concluida ainda.

Para concluir oficialmente, sem ampliar escopo para P0.B+, os ajustes necessarios seriam:

1. Criar `FeedTarget` como tipo canonico previsto, mesmo que ainda nao usado por detalhe/actions.
2. Ajustar a validacao de `FeedContext` para falhar fechado quando `ResolvedTerritory` estiver ausente nas operacoes migradas que exigem contexto completo.
3. Garantir que `useFeedContext` receba ou derive decisoes reais de Rollout e AccessPolicy, ou documentar explicitamente uma excecao auditavel para a timeline P0.A.
4. Adicionar testes para:
   - `resolvedTerritory: null` com `TerritoryFilter` pronto;
   - contexto valido com `ResolvedTerritory` e `TerritoryFilter`;
   - Rollout/AccessPolicy ausentes;
   - hooks de timeline;
   - group/city quando aplicavel.
5. Corrigir a descricao de rollback no report ou registrar rollback operacional correto.
6. Registrar ou executar smoke visual da timeline principal, se o plano continuar exigindo essa evidencia.

Status: a implementacao de P0.A esta parcialmente pronta, mas ainda precisa de ajustes antes de virar marco oficial do dominio Feed.
