# FEED.P1.B.REVIEW

## Escopo Auditado

Documentos comparados:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-P1.B-REPORT.md`
- `docs/feed/FEED-FREEZE-AUDIT.md`
- `docs/FEATURE-MAP.md`
- `docs/SCREEN-MAP.md`

Arquivos de implementacao auditados:

- `src/core/feed/types.ts`
- `src/core/feed/utils/canonicalFeedUrl.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/repositories/FeedRepository.ts`
- `src/core/feed/hooks/useShareFeedItem.ts`
- `src/core/feed/queryKeys.ts`
- `src/core/posts/utils/postShare.ts`
- `src/core/search/contracts.ts`
- `src/core/search/providers/searchProviders.ts`
- `src/core/search/services/__tests__/SearchService.spec.ts`
- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/FeedRepository.spec.ts`
- `src/core/feed/__tests__/useShareFeedItem.spec.tsx`
- `src/app/pages/BuscaPage.tsx`

## Findings

### Bloqueador - P1B-R1 - Cobertura direta dos criterios obrigatorios da P1.B esta incompleta

Evidencias:

- `src/core/feed/services/FeedService.ts:583` adiciona `resolveCanonicalUrl()`.
- `src/core/feed/services/FeedService.ts:627` adiciona `searchItems()`.
- `src/core/feed/__tests__/FeedService.spec.ts:1996` cobre URL canonica valida.
- `src/core/feed/__tests__/FeedService.spec.ts:2021` cobre contexto invalido para `resolveCanonicalUrl()`.
- `src/core/feed/__tests__/FeedService.spec.ts:2042` cobre target invalido e item oculto para `resolveCanonicalUrl()`.
- `src/core/feed/__tests__/FeedService.spec.ts:2067` cobre `searchItems()` com URL canonica.
- `src/core/feed/__tests__/FeedService.spec.ts:2092` cobre `searchItems()` com contexto invalido.
- `src/core/search/services/__tests__/SearchService.spec.ts:469` cobre Search sem `FeedContext`.
- `src/core/feed/__tests__/FeedRepository.spec.ts:640` cobre bases `/comunidade` e `/comunidade/ba`.
- `src/core/feed/__tests__/useShareFeedItem.spec.tsx:152` e `src/core/feed/__tests__/useShareFeedItem.spec.tsx:175` cobrem bases invalidas no hook de share.

Problema:

Os testes comprovam o happy path, contexto invalido, target invalido, item oculto, Search sem `FeedContext` e bases invalidas. Porem a lista obrigatoria da review exige cobertura para `rollout bloqueado`, `AccessPolicy bloqueada` e `mismatch territorial` no contexto da P1.B. Esses cenarios aparecem cobertos em fluxos vizinhos do Feed, principalmente share/detail/engagement, mas nao ha teste direto demonstrando que `FeedService.resolveCanonicalUrl()` e `FeedService.searchItems()` falham fechado nesses casos antes de emitir URL ou expor `target_url`.

Impacto:

Medio. A implementacao reutiliza `validateFeedContext()` e `validateEngagementTarget()`, entao o comportamento de runtime aparenta estar correto. Mesmo assim, o criterio de aceite da review pede evidencia direta para os cenarios criticos da P1.B.

Risco:

Medio. Sem esses testes diretos, regressao futura poderia fazer Search voltar a emitir destino canonico com rollout/policy invalido ou item de outro Territory sem a suite acusar no ponto exato da P1.B.

Classificacao:

Bloqueador para encerramento oficial.

Acao necessaria:

Adicionar cobertura direta para:

- `FeedService.resolveCanonicalUrl()` com rollout bloqueado;
- `FeedService.resolveCanonicalUrl()` com AccessPolicy bloqueada;
- `FeedService.resolveCanonicalUrl()` com mismatch territorial;
- `FeedService.searchItems()` com rollout bloqueado garantindo que `FeedRepository.searchItems()` nao e chamado;
- `FeedService.searchItems()` com AccessPolicy bloqueada garantindo que `FeedRepository.searchItems()` nao e chamado;
- `FeedService.searchItems()` com mismatch entre `TerritoryFilter` e `ResolvedTerritory` garantindo que `FeedRepository.searchItems()` nao e chamado;
- ausencia explicita de fallback global em `postShare.ts` ou no helper canonico, preferencialmente com teste contra `LAUNCH_URLS.community`.

### Recomendacao - P1B-R2 - `SCREEN-MAP` documenta apenas deep-link de bairro, mas a implementacao aceita cidade

Evidencias:

- `src/core/feed/utils/canonicalFeedUrl.ts:23` aceita bases com pelo menos tres segmentos: `/comunidade/:uf/:city`.
- `docs/SCREEN-MAP.md:17` documenta apenas `/comunidade/:uf/:city/:hood?post=:postId`.

Problema:

A implementacao permite URL canonica de post em contexto de cidade, o que e coerente com Territory amplo. O mapa de telas, porem, declara apenas o formato de bairro. Isso nao contradiz diretamente a implementacao, mas deixa a capacidade de deep-link em cidade subdocumentada.

Classificacao:

Recomendacao.

Acao sugerida:

Escolher uma das duas direcoes antes do Freeze:

- documentar tambem `/comunidade/:uf/:city?post=:postId` como deep-link territorial de cidade;
- ou restringir oficialmente URL canonica de post a bairro se Produto decidir que post nunca deve abrir em contexto de cidade.

### Melhoria futura - P1B-M1 - `postShare.ts` legado permanece no codigo

Evidencias:

- `src/core/posts/utils/postShare.ts:13` importa `normalizeCanonicalFeedBasePath`.
- `src/core/posts/utils/postShare.ts:35` usa a normalizacao canonica.
- `src/core/posts/utils/postShare.ts:39` retorna vazio quando nao ha base territorial.
- A varredura nao encontrou import publico ativo de `postShare.ts` em `src/core/community`, `src/modules` ou `src/app`.

Analise:

O fallback global foi removido. O util legado nao foi encontrado como caller publico ativo. Mesmo assim, ele permanece dentro de `core/posts` e agora depende de helper do Feed, o que e uma relacao arquitetural pouco ideal para um util legado.

Classificacao:

Melhoria futura, nao bloqueante.

Acao sugerida:

Remover ou depreciar `postShare.ts` depois que P1.B for encerrada, mantendo `useShareFeedItem()` e `FeedService.shareItem()` como unicos caminhos publicos.

## Respostas Obrigatorias

### 1. O bloqueador FRZ-B4 foi totalmente eliminado?

Parcialmente.

No runtime, os dois pontos principais de FRZ-B4 foram eliminados:

- `src/core/search/providers/searchProviders.ts:278` usa `FeedService.searchItems()` para posts.
- `src/core/search/providers/searchProviders.ts` nao emite mais `target_url: null` para posts.
- `src/core/posts/utils/postShare.ts:39` falha fechado quando nao ha base territorial valida.

Porem, a sprint ainda nao pode ser considerada oficialmente encerrada porque a cobertura obrigatoria de testes da P1.B esta incompleta para rollout, AccessPolicy e mismatch territorial nos novos caminhos de URL/Search.

### 2. Existe ainda algum caller publico utilizando `searchPublicPosts()`, `LAUNCH_URLS.community`, `target_url` global ou URL nominal fora do Feed?

Nao foi encontrado caller publico de Feed usando `searchPublicPosts()` diretamente.

`searchPublicPosts()` permanece em `src/core/feed/repositories/FeedRepository.ts:557` apenas como colaborador interno do Feed Repository.

Nao foi encontrado `target_url: null` para posts no provider de Search.

Nao foi encontrado fallback global de post em `postShare.ts`.

Existem usos de `LAUNCH_URLS.community` fora do Feed em navegacao geral, como routing/home/prefetch. Eles nao sao callers de URL de post, Search de post ou share de Feed; portanto nao reabrem FRZ-B4.

### 3. Search acessa posts exclusivamente por `FeedService.searchItems()`?

Sim.

`src/core/search/providers/searchProviders.ts:278` chama `feedService.searchItems()`. A varredura nao encontrou `searchPublicPosts()` em `src/core/search`.

### 4. Toda URL de post e obrigatoriamente territorial?

Sim no runtime auditado.

`src/core/feed/utils/canonicalFeedUrl.ts:18` divide o pathname em segmentos, `src/core/feed/utils/canonicalFeedUrl.ts:23` rejeita bases com menos de `/comunidade/:uf/:city`, e `src/core/feed/utils/canonicalFeedUrl.ts:49` gera URL apenas apos validar target `item`.

### 5. `FeedContext` continua obrigatorio para Search?

Sim para posts.

`src/core/search/providers/searchProviders.ts:273` retorna lista vazia quando `filters.feedContext` esta ausente. Outros buckets de Search continuam independentes, o que esta alinhado ao escopo da P1.B.

### 6. Existe algum cenario onde `/comunidade`, `/comunidade/ba`, rota sem territorio ou `FeedContext` ausente gere URL de post?

Nao foi encontrado.

- `/comunidade` e `/comunidade/ba` sao rejeitados pelo helper canonico e pelos testes em `FeedRepository`/`useShareFeedItem`.
- rota sem territorio leva a `FeedContext` invalido via `BuscaPage`/`useFeedContext`, e o provider de posts falha fechado.
- `FeedContext` ausente em Search retorna posts vazios sem chamar `FeedService.searchItems()`.

### 7. Deep links continuam preservando Territory?

Sim.

O deep-link de post continua usando `?post=<id>` sobre base territorial. `docs/FEATURE-MAP.md:45` e `docs/SCREEN-MAP.md:17` foram alinhados para remover `/p/:slug` como detalhe do Feed.

Ressalva: `SCREEN-MAP` documenta apenas bairro, enquanto o helper aceita cidade e bairro.

### 8. Os testes realmente cobrem os cenarios exigidos?

Parcialmente.

Cobrem:

- URL canonica valida;
- FeedContext invalido;
- target invalido;
- Search sem FeedContext;
- bases territoriais invalidas;
- ausencia de fallback global no caminho publico de share;
- item oculto;
- colaborador interno `searchPublicPosts()` no FeedRepository.

Nao cobrem diretamente nos novos caminhos P1.B:

- `resolveCanonicalUrl()` com rollout bloqueado;
- `resolveCanonicalUrl()` com AccessPolicy bloqueada;
- `resolveCanonicalUrl()` com mismatch territorial;
- `searchItems()` com rollout bloqueado;
- `searchItems()` com AccessPolicy bloqueada;
- `searchItems()` com mismatch territorial;
- teste explicito contra retorno a `LAUNCH_URLS.community` no util legado ou helper canonico.

### 9. `FEATURE-MAP` e `SCREEN-MAP` permanecem consistentes com a implementacao?

Quase totalmente.

`FEATURE-MAP` esta consistente ao apontar detalhe por `PostDetailModal` via `FeedService.getDetail()` e share por SSOT Feed.

`SCREEN-MAP` esta correto ao remover `/p/:slug` do Feed e registrar `/p/:slug/*` como `PremiumBusinessSiteRoute`. A ressalva e que documenta apenas deep-link de bairro, enquanto a implementacao tambem permite contexto de cidade.

### 10. Existe algum motivo tecnico para impedir o encerramento oficial da Sprint FEED.P1.B?

Sim.

O motivo tecnico e a cobertura incompleta dos cenarios obrigatorios da review para os novos caminhos da P1.B. A implementacao parece aderente a GOVERNANCE, mas os testes ainda nao provam diretamente todos os gates exigidos para URL canonica e Search.

## Conclusao

A Sprint FEED.P1.B ainda nao atende integralmente aos criterios da governanca.

O runtime auditado elimina o bypass principal de FRZ-B4, mas o encerramento oficial deve aguardar hardening de testes para `resolveCanonicalUrl()` e `searchItems()` cobrindo rollout bloqueado, AccessPolicy bloqueada, mismatch territorial e ausencia explicita de fallback global.
