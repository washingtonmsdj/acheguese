# FEED.P0.B - Implementation Report

Data: 2026-07-25

## Escopo

Sprint implementada seguindo:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`

Objetivo da P0.B: fazer detalhe/modal/deep-link de item buscar apenas via Feed Service e falhar fechado quando o item nao pertence ao Territory resolvido.

Nao foram implementadas tarefas de P0.C ou superiores.

## Revisao Antes Das Alteracoes

### Criterios de aceite da P0.B

- Item do mesmo Territory abre.
- Item de outro Territory nao abre e mostra erro/empty controlado.
- Item oculto/removido nao abre como publico.
- `getPostById(id)` nao e usado diretamente por UI publica para detalhe.
- Query param atual `?post=<id>` permanece como compatibilidade ate a URL canonica final.
- Comentarios e reacoes permanecem fora da migracao funcional, mas so aparecem depois do item validado.

### Dependencias satisfeitas pela P0.A

- `FeedContext` canonico existe.
- `FeedTarget` canonico existe.
- `validateFeedContext` falha fechado sem `ResolvedTerritory`, sem `TerritoryFilter`, em mismatch, Rollout pendente/bloqueado e AccessPolicy pendente/bloqueada.
- `useFeedContext` deriva Rollout e AccessPolicy por SSOT ou retorna estado explicito `pending/unknown`.
- Timeline nominal ja opera por `FeedService.listTimeline`.

## Implementacao

### 1. Contratos internos de detalhe

Arquivos:

- `src/core/feed/types.ts`
- `src/core/feed/index.ts`

Adicionado:

- `FeedDetailInput`
- `FeedItemDetail`
- `FeedDetailStatus`
- `isFeedTargetReady`
- `resolveFeedItemVisibility`
- `isFeedItemPubliclyVisible`

Visibilidades tratadas:

- `published`
- `hidden`
- `removed`
- `unavailable`

### 2. `FeedService.getDetail`

Arquivo:

- `src/core/feed/services/FeedService.ts`

Regras aplicadas:

- valida `FeedContext` antes de chamar repository;
- valida que o target e `kind: "item"`;
- chama `FeedRepository.getDetail` apenas com contexto pronto;
- bloqueia item inexistente;
- bloqueia item de outro Territory;
- bloqueia item oculto/removido/indisponivel;
- retorna item apenas quando status final e `ready`.

### 3. `FeedRepository.getDetail`

Arquivo:

- `src/core/feed/repositories/FeedRepository.ts`

Comportamento:

- `postService.getPostById()` passou a existir apenas como dependencia interna do repository;
- repository rejeita `TerritoryFilter.scope === "none"` sem consultar;
- repository valida `location_id` do item contra `TerritoryFilter`;
- `scope: "location"` exige match exato;
- `scope: "group"` exige que `location_id` esteja em `location_ids`.

### 4. `useFeedItemDetail`

Arquivo:

- `src/core/feed/hooks/useFeedItemDetail.ts`

Comportamento:

- query so habilita com `FeedContext` pronto;
- query so habilita com `FeedTarget` de item valido;
- query key inclui `TerritoryFilter` canonico e `FeedTarget`;
- contexto pendente mantem loading sem consultar detalhe;
- contexto invalido retorna estado controlado sem query.

### 5. Hooks publicos por post

Arquivos:

- `src/core/community/hooks/usePostById.ts`
- `src/core/community/hooks/usePost.ts`

Mudancas:

- `usePostById` virou adapter sobre `useFeedItemDetail`;
- `usePostById` nao chama mais `postService.getPostById`;
- enriquecimento de autor, enquete e interacoes so roda depois do item validado pelo Feed;
- `usePost` tambem deixou de consultar `PostService` por ID puro.

Observacao:

Comentarios, reacoes, saves e share nao foram migrados nesta sprint. Eles permanecem como P0.D, mas o modal de detalhe so monta esses fluxos depois do item validado pelo Feed.

### 6. Deep-link e modal

Arquivos:

- `src/core/community/pages/ComunidadePage.tsx`
- `src/core/community/hooks/page/useComunidadePage.ts`
- `src/core/community/components/page/CommunityModals.tsx`

Mudancas:

- `ComunidadePage` monta `feedDetailContext` via `useFeedContext`;
- `useComunidadePage` recebe `feedDetailContext` e passa para `usePostById`;
- abertura por `?post=<id>` passa pelo Feed Service;
- leitura usada para prefill de edicao tambem passa por `FeedService.getDetail`;
- quando o item nao pode ser exibido, `CommunityModals` mostra estado controlado `Publicacao indisponivel`.

## Evidencias De Escopo

### Sem chamada publica direta a `getPostById`

Busca executada:

`rg -n "postService\\.getPostById|getPostById\\(" src/core/community/hooks src/core/community/components src/core/community/pages/ComunidadePage.tsx src/core/feed --glob "*.ts" --glob "*.tsx"`

Resultado relevante:

- `src/core/feed/repositories/FeedRepository.ts`: uso interno autorizado;
- testes do Feed/adapter;
- nenhuma UI publica de Community consultando `postService.getPostById` para detalhe;
- `AchadoPerdidoDetailPage` usa `lostFoundService.getPostById`, que pertence a outro dominio e nao foi alterado.

### Sem antecipacao de P0.C+

Nao foi criado:

- `FeedService.createItem`;
- `useCreateFeedItem`;
- novo contrato de composer;
- migracao de `CreatePostModal`;
- migracao de comentarios;
- migracao de reacoes;
- migracao de share;
- migracao de denuncia;
- migracao de realtime;
- URL canonica final de post.

## Testes

### `npm run test -- src/core/feed`

Resultado: passou.

Resumo:

- 6 arquivos;
- 31 testes;
- 31 passed.

Cobertura adicionada:

- detalhe com contexto invalido;
- target nao item;
- item valido no mesmo Territory;
- item fora do Territory;
- item oculto/removido;
- repository detail com `location`;
- repository detail com `group`;
- query key de detalhe;
- `useFeedItemDetail` com contexto valido/invalido.

### `npm run test -- src/core/feed src/core/community/hooks/__tests__/usePostById.feed.spec.tsx`

Resultado: passou.

Resumo:

- 7 arquivos;
- 33 testes;
- 33 passed.

Cobertura adicional:

- `usePostById` delega validacao para `useFeedItemDetail`;
- `usePostById` nao chama `postService.getPostById`;
- enriquecimento so ocorre apos item validado pelo Feed.

## Validacao Obrigatoria

### `npm run typecheck`

Resultado: passou.

### `npm run lint`

Resultado: passou.

Detalhe:

- 0 erros;
- 13 warnings preexistentes de `maps/no-manual-entity-projection`;
- warnings fora do dominio Feed.

Arquivos com warnings fora do escopo:

- `src/app/pages/AchegueSeHomePage.tsx`
- `src/app/pages/AchegueSeHomePageMap.tsx`
- `src/app/pages/OnboardingPage.tsx`
- `src/app/pages/PreLaunchTerritoryMap.tsx`

### `npm run build`

Resultado: passou.

Resumo:

- Vite build concluido;
- 5939 modulos transformados;
- build finalizado em aproximadamente 59.59s.

### `npm run test:ssot:community`

Resultado: falhou, fora do escopo desta sprint.

Resumo:

- 4 arquivos executados;
- 3 arquivos passaram;
- 1 arquivo falhou;
- 11 testes totais;
- 9 passed;
- 2 failed.

Falhas persistentes:

- `src/core/community/__tests__/CommunityNavigationSSOT.test.ts`
  - `resolveCommunityFeedChannelFromTab("eventos")` retornou `"eventos"` em vez de `"para_voce"`;
  - `resolveCommunityFeedQueryTabFromChannel("vagas")` retornou `"oportunidades"` em vez de `null`.

Confirmacao:

Essas falhas ja estavam presentes antes da P0.B e foram registradas na P0.A como fora de escopo. Elas pertencem a regras de navegacao de abas pausadas, nao ao detalhe territorial do Feed.

## Rollback

Rollback tecnico da P0.B:

1. Reverter `usePostById` e `usePost` para os adapters anteriores apenas se links territoriais validos quebrarem.
2. Manter `FeedService.getDetail` e o bloqueio de cross-territory como guarda minima se possivel.
3. Remover o estado `Publicacao indisponivel` de `CommunityModals` somente se a abertura de modal retornar ao fluxo antigo.
4. Nao liberar exibicao de item fora do Territory como fallback de rollback.

## Auto-Review

### Nenhum requisito de P0.C foi antecipado?

Confirmado.

Nao houve criacao territorial, alteracao de composer, `FeedService.createItem`, novo contrato de upload, nem rollout aplicado a mutation de criacao.

### Nenhum contrato publico foi quebrado?

Confirmado para o escopo.

`usePostById` e `usePost` ganharam parametro opcional de `FeedContext`. Chamadas antigas continuam compilando, mas falham fechado sem contexto, conforme governanca da P0.B.

### Nenhuma regra da governanca foi violada?

Confirmado para P0.B.

- UI publica nao chama `PostService.getPostById` para detalhe;
- hooks publicos de detalhe entram pelo Feed;
- Feed Service valida contexto antes do repository;
- repository so usa ID atomico depois do service receber contexto validado;
- deep-link `?post=<id>` nao renderiza item fora do Territory.

### Algum item P0.D foi antecipado?

Nao.

Comentarios, reacoes, saves, share e denuncia continuam nos caminhos existentes. A unica mudanca e que o modal de detalhe so renderiza depois de um item validado territorialmente.

## Decisao

A Sprint `FEED.P0.B` esta implementada e pronta para review.
