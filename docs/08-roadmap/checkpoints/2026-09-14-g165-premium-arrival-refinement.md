# G165 — Premium arrival refinement

Data: 2026-09-14
Branch: `main`

## Objetivo

Refinar o loading da entrada territorial para uma experiência premium, responsiva e ligada ao estado real do carregamento.

## Mudanças

- `TerritoryEntryMapArrival.tsx` agora usa layout compacto no mobile e composição ampla no desktop.
- O globo possui órbitas sutis; `prefers-reduced-motion` é respeitado.
- O progresso deixou de usar timer artificial e passou a refletir três estados reais: `community`, `map` e `boundary`.
- Etapas concluídas recebem check; a etapa atual fica destacada; o progresso não regride.
- Copy principal: `Encontrando sua comunidade`, `Preparando a casa para você se achegar`, `Conectando você ao território` e `Seu território está quase pronto`.
- Nenhuma geometria territorial aproximada é exibida durante o loading.
- O mapa real só aparece após `mapReady && !isBoundaryLoading`.
- O timeout de indisponibilidade continua em 8 segundos.

## Regressão

`tests/regression/public/territory-entry-map-arrival.test.ts` protege owner único, estados reais, responsividade, progresso monotônico, ausência de geometria falsa e revelação do mapa somente quando pronto.

## Commits

- `9b60f7bcdbed93927f4f370d1fea856920101d38`
- `3b2ffcb9ccc63f7ac926af0c0037c86bb9e7654f`
- `aab7f193c7343fac9cdc9fa704c81bbb21f9c7fa`
- `a6d3dd65a0025f1059b86bc6617309e33b261c97`

## Certificação

Não considerar testes, build ou deploy certificados sem execução real do mesmo SHA.
