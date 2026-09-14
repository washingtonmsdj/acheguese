# G189 — Generic loading interstitial retirement

Date: 2026-09-14  
Branch: `main`

## Scope

Retires the generic full-screen loading interstitial that displayed `Preparando a casa para você se achegar...` and replaces its active callers with either visually silent Suspense fallbacks or a dependency-free passive surface.

## Why

The retired `FullScreenLoader` was not a skeleton. It rendered a spinner, branded copy and an 8-second recovery timer through `PageLoader`, and statically pulled the loading module into callers that only needed a short Suspense fallback.

This did not make asynchronous work complete earlier, but it added an extra visual phase and extra dependencies in shell-loading paths, which could make navigation feel slower.

## Changes

- removed the `FullScreenLoader` export from `src/shared/components/loading/PageLoader.tsx`;
- removed `FullScreenLoader` imports from the full app shell and session/profile shell;
- shell-level Suspense boundaries now use `fallback={null}`;
- added `src/shared/components/loading/PassivePageFallback.tsx` for route states that must preserve page height while data/chunks resolve;
- migrated canonical and short classified routes to the passive fallback;
- migrated `TerritorialIndexPage` to the passive fallback;
- preserved context-specific `PageLoader` uses where a real recovery action is part of the UX;
- updated the public-root loading regression so it protects retirement of the interstitial instead of requiring its existence;
- added `tests/regression/loading/full-screen-loader-retired.test.ts` to reject reintroduction of the retired component or copy anywhere under `src/`.

## Root `/`

The public root remains on its own page-native map skeleton (`TerritoryEntryMapArrival`). This change does not replace or remove that skeleton. It only removes the unrelated generic full-app interstitial.

## Relevant commits

- `1055805293e55bd838142e471012b403744aad75` — add passive route loading fallback;
- `44c7d3cf743c25fc8a378cfb22995f8e878e051e` — retire generic full-screen loading interstitial;
- `40317c474480f84a7b576558633d2a74b292d852` — remove full-screen loader from app-shell Suspense;
- `23c2f1a3f6ae4b340143d3ca9c1338a05de759da` — remove full-screen loader from route-shell Suspense;
- `e0b46648eda7f5fa5327514bdf0da6805bc39cce` — use passive fallback for territorial landing chunks;
- `790a8556ea1b2fef35998c33df939868061eda43` — replace short classified route interstitial;
- `871bcd4ece9b0ff79401a4918cd02ac97eae42d3` — replace canonical classified route interstitial;
- `3f0982564bdd49c19080636e998503ae48b2b6bc` — guard retirement globally in source;
- `4258017992bd1f6038168e7c67590d3e0b347f04` — reconcile public-root loading guard.

## Validation status

Direct reads of the current `main` source confirmed that `PageLoader.tsx` no longer exports `FullScreenLoader` or contains the retired copy. The regression sources were created/updated, but Vitest, typecheck, lint, production build, browser E2E and screenshot comparison were not executed in this conversation.
