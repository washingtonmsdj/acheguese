# G167 — Root speed and entry UX

Data: 2026-09-14

## Objetivo

Reduzir o caminho crítico da `/` e simplificar a entrada community-first sem remover capacidades válidas do restante do app.

## UX da entrada

- o card da comunidade deixou de competir com o CTA principal;
- `Explorar o Complexo` é a ação dominante;
- hero e expansão receberam copy mais direta e humana;
- logo volta para `/` sem query de troca territorial no MVP de comunidade única;
- menu mobile agora alterna Menu/X, fecha por Escape e clique fora, move foco ao abrir e restaura foco ao fechar;
- skip link nativo aponta para `#main-content`;
- preview JPEG preserva loading lazy/decoding async/fetch priority low e declara dimensões intrínsecas 1920x1080 para estabilidade de layout.

## Caminho crítico da `/`

- `AppRuntime` renderiza `RootRouteEntry` diretamente na raiz pública normal;
- React Query, Helmet, AccessibilityProvider, sessão/perfis e AppRoutes completo saíram do caminho crítico da `/`;
- preferências salvas de alto contraste/tamanho de fonte são reaplicadas por lógica mínima na raiz, sem carregar o provider completo;
- consentimento/analytics da raiz entram somente após `window.load` + browser idle;
- `PublicRootOverlays` não carrega Sonner nem UI offline;
- o ErrorBoundary completo saiu da raiz; `BootstrapErrorBoundary` continua protegendo a inicialização e o boundary rico fica no shell completo.

## Bootstrap e terceiros

- removido `public/service-worker-bootstrap.js`; a limpeza de SW/cache em desenvolvimento já pertence a `main.tsx`;
- AdSense passa a entrar após `load` e browser idle;
- web vitals e Sentry não competem com a primeira pintura da raiz;
- CapabilityPreview, providers globais de mapa e warmup do worker MapLibre foram movidos para o shell completo e inicializam em idle.

## Rede e bundle

- HTML antecipa descoberta da Plus Jakarta Sans;
- `preconnect`/`dns-prefetch` adicionados para `tiles.openfreemap.org`, usado pelo mapa da entrada;
- `AppRoutes` lazy-loads `RootRouteEntry` e `LaunchPausedPage` quando o runtime completo é usado;
- vendor chunk antigo que misturava router + React Query + Zustand foi dissolvido;
- chunks separados: `vendor-router`, `vendor-query`, `vendor-state`, `vendor-ui-utils`, `vendor-date`, `vendor-validation`, `vendor-lodash`.

## Regressões

Atualizados:

- `tests/regression/public/root-entry-bootstrap-performance.test.ts`
- `tests/regression/public/root-entry-community-first.test.ts`

As regressões agora protegem o runtime enxuto, overlays pós-load, ausência do bootstrap legado de SW, terceiros deferidos, resource hints, split de vendors, menu mobile e CTA único.

## Certificação

Os testes/build não foram executados por runner nesta conversa. Não considerar este checkpoint green apenas por estar na `main`.

O status Vercel deve ser verificado no HEAD. `build-rate-limit` continua sendo falha de provider, não aprovação/reprovação do source.

## Próximos passos de performance

1. executar build/analyze e medir os chunks reais da `/`;
2. medir LCP, INP, CLS e long tasks em mobile e desktop;
3. gerar uma versão WebP/AVIF menor do preview 1920x1080 quando houver caminho binário validado para commit;
4. remover o `@import` legado da fonte em `index.css` quando for possível editar esse arquivo grande com patch seguro;
5. só apertar novos budgets depois de dados reais, evitando otimização especulativa.
