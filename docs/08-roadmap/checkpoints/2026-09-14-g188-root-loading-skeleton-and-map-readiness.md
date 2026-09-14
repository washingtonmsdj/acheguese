# G188 — Root loading skeleton and map readiness

Date: 2026-09-14  
Branch: `main`

## Scope

This checkpoint reconciles the public `/` loading contract with the runtime that is actually shipped. It does not redesign the page or introduce another loading surface.

## Generic app loader versus root skeleton

`src/shared/components/loading/PageLoader.tsx` still owns the generic full-app `FullScreenLoader`, including the copy `Preparando a casa para você se achegar...`, spinner and delayed recovery action. That surface belongs to the routed/full application shell and selected routed pages.

The lean public root does not use that loader. The normal `/` path goes through `LeanPublicRootRuntime -> RootRouteEntry -> TerritoryEntryPage`, and its map-loading surface is `TerritoryEntryMapArrival.tsx`: a CSS-only page-native skeleton that renders neutral composition blocks while MapLibre initializes underneath.

`tests/regression/public/root-entry-loader-boundary.test.ts` now ratchets that separation so the generic loader/copy cannot silently enter the lean root bootstrap.

## Map readiness semantics

`TerritoryEntryMapRuntime.tsx` now ends the map region's `aria-busy` state when the basemap is genuinely usable or the terminal fallback becomes final. Official-boundary enrichment continues through its own `role="status"` messages instead of keeping the entire map region semantically busy after the user can already proceed.

The visual treatment is unchanged by this accessibility correction. A final source pass restored the previously approved spacing on the post-map boundary messages after the structural prop cleanup, so the refactor does not carry an accidental visual delta.

## Skeleton contract cleanup

Caller census showed that `TerritoryEntryMap` has one runtime caller: `TerritoryEntryPage`. That caller always passed `isLoading={false}` because the versioned launch territory is resolved before the map component mounts.

The fake loading branch was removed atomically across the chain:

- `TerritoryEntryPage` no longer passes `isLoading={false}`;
- `TerritoryEntryMap` no longer owns an `isLoading` prop;
- `TerritoryEntryMapRuntime` no longer owns or interprets that prop;
- `TerritoryEntryMapArrival` no longer exposes `community` / `boundary` stages;
- the skeleton has one real pre-map state: `Abrindo mapa`;
- after the basemap is ready, official-boundary loading is represented only by the smaller post-map status surface.

This prevents the skeleton contract from pretending that community discovery or official-boundary resolution still gates map presentation.

## Regression reconciliation

Updated/added regressions:

- `tests/regression/public/root-entry-loader-boundary.test.ts`;
- `tests/regression/public/root-entry-launch-ssot.test.ts`;
- `tests/regression/public/territory-entry-map-arrival.test.ts`;
- `tests/regression/public/territory-entry-map-progressive-performance.test.ts`;
- `tests/regression/public/root-entry-community-first.test.ts`.

Stale assertions that required a local map timeout, hardcoded `Complexo` boundary copy, or `isLoading=false` were replaced with the current shared timeout, territorial label, and single loading-state contract.

## Relevant root commits

- `b7c9f4b3f15c36058a28faa188e5108eb1e6688e` — settle root map busy state when basemap is ready;
- `9b3edb9954f7ea49b2c3939c237e7b3287ce6819` — guard root map busy-state handoff;
- `01b2ce8822f70975c9e59d1ee881a5a6da67e23e` — guard public-root skeleton from generic app loader;
- `a659e4bf0207e1307fd56b2afe8594854eaa4bae` — make root map skeleton a single pre-map state;
- `b69610c9217900b33737cc93bad7c44deceecc5c` — remove dead root community-loading state;
- `6ef0a82972ab768ab78fd1882514cdc1a83ab5ac` — remove dead root map loading prop from runtime;
- `0863a7a72aaa7a77d82d32653d6960fc16563b44` — drop dead root map loading prop from page;
- `4205cb6aafdf1fd5ee3b43a6109ae8268234099c` — align progressive map gate with the single loading state;
- `71de226e3d18bb574ee5586c7896ef884870a3ca` — ratchet skeleton to the real single loading state;
- `308e4bad552942d073978f028557d8b1a46a2279` — retire fake root territory loading contract;
- `1c92732e762baa8f5686e3b81f663e5fb8dae44d` — preserve the approved root boundary spacing after the refactor.

## Still open on `/`

Physical consolidation of the two generations of root rules inside `src/index.css` remains open. The active mobile layout currently relies on one bounded inner scroll owner plus safe-area compensation in JSX while older and newer root CSS rules coexist.

This checkpoint intentionally does **not** add a second stylesheet, `!important`, inline visual patch, token alias, or another late override block. The physical CSS cleanup should be done as one source consolidation when the file can be patched/reconstructed safely.

## Validation status

Source/caller census and direct `main` file reads were performed before the removals. Regression source files were added/updated, but no Vitest, typecheck, lint, production build, browser E2E, Lighthouse or screenshot comparison was executed in this conversation.

At checkpoint time the repository HEAD had advanced concurrently with Account/Auth work. The published combined status observed on the contemporaneous main SHA contained only the known Vercel `build-rate-limit` failure target. That is provider quota evidence, not a source build PASS or FAIL.
