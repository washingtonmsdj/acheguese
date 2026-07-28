# FEED.P0.A - Final Report

Data: 2026-07-25

## Escopo

Esta finalizacao executou exclusivamente os ajustes apontados em `docs/feed/FEED-P0.A-REVIEW.md`.

Nao foram implementadas tarefas de P0.B ou superiores. Nao houve alteracao de governanca, roadmap, contratos fora do escopo, banco, migrations ou novas funcionalidades.

## Ajustes Implementados

### 1. `FeedTarget` canonico

Status: concluido.

Foi criado o tipo canonico `FeedTarget`, conforme governanca do dominio Feed.

Arquivos:

- `src/core/feed/types.ts`
- `src/core/feed/index.ts`

Observacao:

O tipo foi introduzido como contrato de dominio, sem antecipar detalhe, comentarios, reacoes, compartilhamento, denuncia ou moderacao.

### 2. Validacao fail-closed de `FeedContext`

Status: concluido.

Foi criada a validacao canonica de contexto da timeline migrada.

A timeline agora falha fechado quando:

- `ResolvedTerritory` esta ausente;
- `TerritoryFilter` esta ausente ou em `scope: "none"`;
- `TerritoryFilter` nao corresponde ao `ResolvedTerritory`;
- Rollout esta ausente, pendente, desconhecido ou bloqueado;
- AccessPolicy esta ausente, pendente, desconhecida ou bloqueada.

Arquivos:

- `src/core/feed/types.ts`
- `src/core/feed/services/FeedService.ts`
- `src/core/feed/hooks/useFeedTimeline.ts`

Resultado:

Nenhuma operacao migrada da timeline deve prosseguir apenas com `TerritoryFilter` quando o contrato exigir tambem `ResolvedTerritory`.

### 3. Remocao de defaults permissivos

Status: concluido.

Foram removidos os defaults que assumiam acesso liberado por padrao.

O `useFeedContext` agora:

- deriva Rollout a partir de `useTerritoryModuleRollouts`;
- deriva AccessPolicy a partir de `useCommunityAccess`;
- usa estado explicito `pending` quando a decisao ainda esta carregando;
- usa estado explicito `unknown` quando a decisao nao pode ser determinada;
- nao dispara consulta de rollout para territorios fallback nao persistidos com id nao UUID.

Arquivos:

- `src/core/feed/hooks/useFeedContext.ts`
- `src/core/community/hooks/feed/useCommunityFeed.ts`
- `src/core/community/components/feed/CommunityFeed.tsx`
- `src/core/community/pages/ComunidadePage.tsx`
- `src/app/pages/TerritoryHomePage.tsx`

Resultado:

O contexto nao presume `rollout active` ou `canViewTimeline` por padrao.

### 4. Cobertura de testes

Status: concluido.

Foram adicionados ou ajustados testes para:

- `ResolvedTerritory` ausente;
- mismatch entre `TerritoryFilter` e `ResolvedTerritory`;
- Rollout ausente/desconhecido;
- AccessPolicy ausente/desconhecida;
- `useFeedContext`;
- `useFeedTimeline`;
- query desabilitada quando o contexto nao atende os gates;
- delegacao para o repository apenas com contexto completo.

Arquivos:

- `src/core/feed/__tests__/FeedService.spec.ts`
- `src/core/feed/__tests__/useFeedContext.spec.tsx`
- `src/core/feed/__tests__/useFeedTimeline.spec.tsx`

Resultado:

`npm run test -- src/core/feed` passou com 5 arquivos e 17 testes.

### 5. Rollback corrigido

Status: concluido.

`docs/feed/FEED-P0.A-REPORT.md` foi atualizado para refletir o rollback tecnico real.

O rollback correto e:

1. Reverter `src/core/community/hooks/feed/useCommunityFeed.ts` para a implementacao anterior baseada diretamente em `useInfiniteQuery` e `postService.getFeed()`, ou usar adapter legado interno temporario.
2. Preservar a namespace `communityFeedQueryKeys` / `["community-feed"]`.
3. Remover ou ignorar apenas pass-throughs opcionais de contexto se o adapter legado nao os usar.
4. Deixar `src/core/feed/*` inerte quando nao importado pela timeline rollbackada.
5. Nao substituir a validacao fail-closed por defaults permissivos.

### 6. Smoke visual da timeline principal

Status: concluido com fallback de captura.

Alvo testado:

`http://127.0.0.1:8081/comunidade/ba/salvador/nordeste-de-amaralina/feed?codex_feed_p0a_smoke=state`

Viewport:

- 390 x 844

Evidencia visual:

- `C:\Users\Casa\AppData\Local\Temp\feed-p0a-final-smoke-state.png`

Resultado observado:

- Shell territorial carregou para `Complexo`;
- aba `Feed` visivel;
- composer `Publicar no Complexo...` visivel;
- abas contextuais `Posts`, `Grupos`, `Discussoes` visiveis;
- ordenacao `Melhores`, `Recentes`, `Comentados` visivel;
- cards de contexto territorial renderizados;
- nenhum pageerror registrado na verificacao textual isolada;
- aviso de GPS fallback observado, fora do dominio Feed.

Observacao tecnica:

A captura via Browser/CDP falhou por timeout em `Page.captureScreenshot` na rota real da timeline. Foi usado fallback com Playwright CLI para capturar a evidencia visual. O DOM e o texto da pagina foram verificados separadamente antes da captura final.

## Validacao Executada

### `npm run typecheck`

Resultado: passou.

Observacao:

O script do projeto informa que pode demorar 10-30 minutos. A execucao final concluida retornou exit code 0.

### `npm run lint`

Resultado: passou.

Detalhe:

- 0 erros;
- 13 warnings preexistentes de `maps/no-manual-entity-projection`;
- warnings concentrados em arquivos de mapa fora do dominio Feed.

Arquivos com warnings fora do escopo:

- `src/app/pages/AchegueSeHomePage.tsx`
- `src/app/pages/AchegueSeHomePageMap.tsx`
- `src/app/pages/OnboardingPage.tsx`
- `src/app/pages/PreLaunchTerritoryMap.tsx`

### `npm run build`

Resultado: passou.

Build:

- Vite build concluido com sucesso;
- 5938 modulos transformados;
- build finalizado em aproximadamente 3m12s.

### `npm run test -- src/core/feed`

Resultado: passou.

Resumo:

- 5 arquivos de teste;
- 17 testes;
- 17 passed.

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

Confirmacao de escopo:

Essas falhas permanecem fora do escopo de `FEED.P0.A.FINALIZE`. Elas dizem respeito a regras de navegacao de abas pausadas em Community Navigation SSOT, nao ao boundary da timeline migrada do Feed.

## Criterios Da Review

### `FeedTarget` criado

Atendido.

### Timeline falha fechado sem `ResolvedTerritory`

Atendido.

### Timeline falha fechado em mismatch territorial

Atendido.

### Timeline nao usa apenas `TerritoryFilter`

Atendido.

### Rollout sem default permissivo

Atendido.

### AccessPolicy sem default permissivo

Atendido.

### Testes cobrem o boundary criado

Atendido para o escopo P0.A.

### Rollback documentado corretamente

Atendido.

### Smoke visual registrado

Atendido.

## Fora De Escopo Mantido

Nao foi implementado:

- detalhe de post;
- criacao, edicao ou exclusao de post;
- comentarios;
- respostas;
- reacoes;
- compartilhamento;
- denuncia;
- moderacao;
- anexos;
- hashtags;
- busca do Feed;
- realtime;
- notificacoes;
- canonical URL;
- novas tabelas;
- migrations;
- redesign.

## Decisao

A Sprint `FEED.P0.A` atende aos criterios de governanca para encerramento oficial do boundary minimo da timeline.

O dominio Feed ainda nao esta congelado como um todo. O congelamento depende das demais sprints P0 previstas em `docs/feed/FEED-ROADMAP.md`.
