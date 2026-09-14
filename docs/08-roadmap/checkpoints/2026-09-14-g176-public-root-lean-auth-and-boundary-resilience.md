# G176 — Public Root Lean Auth and Boundary Resilience

Data: 2026-09-14  
Status: implementado em `main`; runner/build/deploy ainda não certificados

## Objetivo

Continuar o fechamento da entrada pública `/` após G175, reduzindo trabalho desnecessário no bootstrap, eliminando classificadores/fallbacks paralelos e tornando carregamento de boundaries previsível mesmo quando fontes externas ficam lentas.

Baseline documental: G175.

## Lean root: âncora comum não é callback de autenticação

`src/app/components/AppRuntime.tsx` tratava qualquer hash em `/` como possível retorno de autenticação. Assim, URLs comuns como `/#main-content` podiam abandonar o runtime enxuto e carregar o app roteado completo.

A correção evoluiu em duas etapas:

1. a detecção deixou de aceitar qualquer hash e passou a reconhecer somente marcadores reais de PKCE/recovery/erro;
2. após a consolidação concorrente de Auth criar um owner puro, a classificação local foi removida por completo.

Owners atuais:

- `src/core/auth/constants/authFlow.ts` — paths, query keys/values, storage keys e TTLs do fluxo de auth;
- `src/core/auth/utils/authCallback.ts` — classificação de callback/recovery/erro.

Foi adicionado `hasAuthCallbackMarker(search, hash)`, que reconhece `code` PKCE, `mode/type=recovery`, `access_token`/`refresh_token` e `error`/`error_code`. Âncoras ordinárias não são callbacks.

`AppRuntime` agora apenas chama esse classificador puro. O bootstrap enxuto continua sem `AuthService`, Supabase ou `SessionService`.

A própria página `/` também passou a reutilizar `AUTH_PATHS.login` e `AUTH_PATHS.signup`, eliminando strings paralelas para ações de conta.

## Root map: wrapper sem identidade de lançamento embutida

`src/app/components/territory-vivo/TerritoryEntryMap.tsx` ainda possuía `Complexo do Nordeste de Amaralina` como fallback interno de label.

O wrapper agora deriva o rótulo de group resolvido, location resolvido, cidade recebida ou fallback genérico `Território`. A identidade específica do lançamento permanece na configuração/entrada, não dentro de um componente de mapa reutilizável.

## Boundary lento deixou de bloquear a região

A `/` já abria o basemap antes do boundary oficial, mas o timeout de 8 segundos apenas mudava o texto; `aria-busy` e o estado pendente continuavam indefinidamente se a chain de boundary travasse.

Agora:

- até 8 s: a região informa que o limite oficial está carregando;
- após 8 s: o mapa é considerado utilizável e `aria-busy` deixa de bloquear a região;
- o boundary continua sendo buscado sem inventar contorno aproximado;
- se a geometria chegar, o mapa ainda pode renderizá-la.

## Loading global de polígonos agora é limitado

A causa compartilhada também foi fechada em `src/core/maps/hooks/useTerritoryPolygon.ts`.

Antes, uma promise de fonte oficial/BoundaryService podia deixar consumidores em `isLoading=true` indefinidamente. Agora existe `POLYGON_LOAD_TIMEOUT_MS = 12_000` e o owner compartilhado envolve a chain em `withPolygonLoadTimeout(...)`.

Em timeout, a promise compartilhada é rejeitada de forma controlada, `polygonPromises` é limpo em `finally`, o hook cai para lista vazia e encerra `isLoading`; nenhum boundary aproximado é fabricado.

## Requisição oficial agora também aborta na rede

`src/core/geospatial/data/officialFeatureServerBoundary.ts` passou a limitar o batch oficial em 7 segundos com `AbortController`.

Com isso:

- o primeiro caminho da fonte municipal não mantém conexão aberta indefinidamente;
- o abort acontece antes do limite global de 12 segundos do hook, deixando margem para a chain de fallback canônica;
- timeout/abort não grava `null` no cache oficial, portanto uma visita futura pode tentar novamente;
- timer é sempre limpo em `finally`.

A chain secundária dentro de `BoundaryService` ainda possui leitura própria da metadata FeatureServer. Ela continua protegida pelo timeout de estado do hook, mas ainda é candidata a consolidação futura para reutilizar o mesmo owner de fetch/abort em vez de manter segundo caminho de rede.

## Fallback universal de Salvador removido de bounds globais

A auditoria encontrou um P1 antigo ainda presente:

- `BoundaryService` usava `[-12.975, -38.476]` como fallback universal;
- `useNeighborhoodBounds` inicializava com o mesmo par.

Isso podia centralizar em Salvador um território sem centro válido em qualquer outra região.

Ambos agora derivam de `MAP_DEFAULT_COORDINATES`, owner compartilhado em `src/shared/config/mapDefaults.ts`. O contrato de retorno permanece igual; apenas a autoridade do fallback foi consolidada.

## Regressões adicionadas/atualizadas

- `tests/regression/public/root-entry-auth-marker-runtime.test.ts`: exige `hasAuthCallbackMarker`, proíbe classificador local no `AppRuntime`, protege ausência de AuthService/Supabase/SessionService no lean bootstrap e protege `AUTH_PATHS` na `/`.
- `src/core/auth/utils/__tests__/authCallback.test.ts`: prova que âncoras comuns não são callback e cobre PKCE, recovery, tokens e erros reais.
- `tests/regression/public/root-entry-launch-ssot.test.ts`: protege wrapper genérico do mapa e boundary lento como não bloqueante.
- `tests/architecture/boundary-map-defaults-ssot.test.ts`: impede retorno do par fixo de Salvador em BoundaryService/useNeighborhoodBounds.
- `tests/architecture/territory-polygon-resilience.test.ts`: exige timeout compartilhado/limpeza da promise, AbortController no FeatureServer oficial e degradação não bloqueante da `/`.

## Commits principais desta continuação

Entrada/mapa:

- `e66f1ba4781c46ee4debb6515647eba3f39b61e0` — `Keep ordinary root anchors on lean runtime`;
- `b6742ffff17aaf579ec796052bc0efd132d197b3` — `Remove launch-specific label fallback from root map wrapper`;
- `f7aab936718f76b35bff0fe3754a6d204686c3a0` — `Make slow root boundary non-blocking`;
- `ba28ac8a05ce74d565b7aba9aac91d40d9d46f48` — `Reuse auth route SSOT on public root`.

Auth SSOT/reconciliação:

- `9366363f55c0221d3a6d37807422419e309f86a1` — `Expose canonical auth callback marker classifier`;
- `a6d18092092c33d04896a0cea8068d5af3790f3a` — `Route lean root auth detection through canonical classifier`;
- `22991caba1f3ab490c0229f15c9972355cf00204` — `Test canonical generic auth callback markers`;
- `0cf47a5495f924c7fb3e8d40c7b348aaf24bf584` — `Guard lean root through canonical auth callback classifier`.

Boundaries globais:

- `a92e87bf04520007616b3965b5634218bc31111a` — `Remove Salvador fallback from neighborhood bounds hook`;
- `04d46b4918e6b81f9a5f6837d7410b742f4f46be` — `Route boundary fallback center through map defaults SSOT`;
- `9d3d876326507b7613eda6221e9e682005b7bc9e` — `Guard boundary fallback center through map defaults SSOT`;
- `1df342c13d488c41f9c858ec8e0f02ba80a35997` — `Bound territory polygon loading time`;
- `ffe8600d763156a37ffc8664499efe368dfed40e` — `Guard bounded territory polygon loading`;
- `c8bce36636226d24ddaee9a920abe442e3d3c94e` — `Abort stalled official boundary requests`;
- `5430f7c7543dace296204c12de747bea09389820` — `Guard official boundary network timeout`.

A `main` recebeu commits concorrentes de Auth/cadastro durante toda a rodada. Eles foram preservados e, quando introduziram owners melhores, esta linha foi reconciliada para consumi-los em vez de manter duplicação.

## Validação disponível

O status remoto foi consultado durante o fechamento e o Vercel continuava com `failure` apontando para `build-rate-limit`. Esse vermelho é indisponibilidade do provider, não evidência de erro de compilação e também não vale como aprovação de build/deploy.

Esta conversa continua sem runner local capaz de executar Vitest/typecheck/build no checkout final. Há evolução concorrente de CI de Auth versionada na `main`, mas ela não foi usada aqui como prova de certificação desta linha.

Portanto G176 declara consolidação estrutural no source, não certificação executável.

## Próximos cortes recomendados

1. executar regressões/arquitetura/typecheck/build no mesmo SHA quando houver runner;
2. consolidar a leitura metadata FeatureServer remanescente de `BoundaryService` no owner oficial de fetch/abort, removendo o segundo caminho de rede;
3. remover o `@import` histórico de Google Fonts de `src/index.css` e, após prova, aposentar o plugin PostCSS que hoje precisa removê-lo no build;
4. continuar a auditoria da `/` por dependências que forcem o runtime completo sem necessidade real;
5. preservar basemap-first e nunca substituir boundary oficial ausente por geometria aproximada.
