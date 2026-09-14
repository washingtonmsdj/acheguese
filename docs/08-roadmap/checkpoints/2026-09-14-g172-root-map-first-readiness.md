# G172 — Root map-first readiness and critical bootstrap isolation

Date: 2026-09-14
Branch: `main`
Baseline for this checkpoint: `0e82e22bedc0e2c21538e70139ce425c190b01ca`

## Objective

Make the public `/` explicitly prioritize the first usable territorial map over optional typography, overlays, observability and advertising, while preserving accessibility, official-boundary integrity and bounded fallbacks.

## Changes consolidated

### Map-first readiness owner

`src/shared/utils/publicRootReadiness.ts` is the single owner for non-critical work that may wait for the first usable public-root map.

- `markPublicRootMapReady()` is emitted from the real MapLibre `onLoad` callback;
- `scheduleAfterPublicRootMap()` waits for the map event or a bounded timeout;
- after the event/timeout, work still goes through browser idle scheduling;
- cancellation is preserved for React effects.

The loading skeleton remains presentation-only and has no authority over this readiness state.

### Optional work no longer competes with the map

On the normal public `/`:

- public overlays/consent wait for `load` + first-map readiness/timeout + idle;
- Sentry initialization waits for `load` + first-map readiness/timeout + idle;
- AdSense waits for `load` + first-map readiness/timeout + idle;
- Plus Jakarta Sans is not requested during HTML parsing and is loaded only after the map-priority window (or bounded timeout).

Web Vitals measurement remains lightweight and starts independently so LCP/INP/CLS are not intentionally lost.

### Web Vitals decoupled from Sentry

`src/shared/utils/webVitals.ts` no longer imports logger or Sentry.

- metrics are measured with `web-vitals`;
- production reports are kept in a small bounded in-memory queue until telemetry is attached;
- `src/shared/utils/webVitalsSentryReporter.ts` attaches Sentry later and flushes the queue.

This prevents observability vendor code from entering solely because performance measurement started.

### Accessibility CSS split

The public bootstrap now imports only `src/styles/accessibility-core.css`, containing the rules the `/` actually needs:

- screen-reader-only helpers;
- high-contrast mode;
- saved large-font modes;
- focus visibility;
- 44px control targets;
- reduced-motion behavior;
- skip-link behavior.

Full-app-only rules such as table/fieldset formatting, generic loading spinner and document typography remain in `src/styles/accessibility.css`, imported from `FullAppRuntimeShell`.

No accessibility capability was intentionally removed from the public root.

### Map style discovered before React render

`src/main.tsx` uses canonical `DEFAULT_TILE_STYLE` to create the root style preload before `root.render(<App />)`.

The later duplicate style-preload path was removed from `TerritoryEntryMap`.

MapLibre runtime + passive engine/worker/CSS continue to start from the map component's first lazy render, while the official boundary is requested progressively after the first paint.

### Worker ownership corrected

The obsolete standalone worker warmup was removed from `FullAppRuntimeShell`.

`maplibreWorkerRuntime` now receives `runtime.setWorkerUrl` only from the canonical MapLibre loader. Routes that never render a map do not need to warm the worker.

This also removes the stale call-site that still assumed the previous zero-argument worker-config signature.

## Regression coverage added/updated

- `tests/regression/public/root-entry-accessibility-css-performance.test.ts`
- `tests/regression/public/root-entry-readiness-performance.test.ts`
- `tests/regression/public/root-entry-bootstrap-performance.test.ts`
- `tests/regression/public/territory-entry-map-progressive-performance.test.ts`
- `tests/regression/public/territory-entry-map-arrival.test.ts`
- `tests/regression/public/root-entry-boundary-font-performance.test.ts`

The tests are committed source contracts. They have **not** been claimed as executed/passing in this chat.

## Current performance contract

The intended first-load priority is now:

1. HTML + root React + critical CSS;
2. map style discovery + root content render;
3. passive MapLibre runtime/engine/worker/CSS;
4. official municipal boundary progressively;
5. optional font / consent overlays / Sentry / advertising only after map readiness or bounded fallback.

## Certification state

No green certification is asserted here.

A successful same-SHA runner/build/deploy and real production metrics are still required before claiming the target LCP/INP/CLS or transferred-JS improvements.

The known Vercel provider condition remains a build-rate-limit until a newer status proves otherwise.
