# G161 — Public root perceived performance

Date: 2026-09-14
Branch: `main`

## Objective

Make the community-first public root feel immediate without weakening the real territorial map, privacy handling, accessibility, or authenticated runtime.

## Implemented

- Map area never becomes visually empty while MapLibre, tiles, or the official boundary are loading.
- A semantic map skeleton occupies the final map geometry and never invents a territorial outline.
- The skeleton remains over the real map until MapLibre is loaded and the boundary request has settled; the real canvas then fades in.
- Map work is gated by viewport proximity plus browser idle time.
- The heavy MapLibre adapter and ESM worker are owned by a lazy runtime instead of the application bootstrap.
- `src/main.tsx` no longer has synchronous `maplibre-gl` or worker imports; compatibility warmup is idle-only.
- The public `/` route no longer mounts `SessionProvider`, `MultiProfileProvider`, `ModuleContextSync`, or `TerritoryModeInitializer`.
- Those authenticated/contextual owners now live in `SessionProfileRuntimeShell`, loaded only outside the normal public root.
- `AuthHashRedirect` is only mounted when the URL actually looks like an auth/recovery return.
- Anonymous consent stays local and no longer statically imports Supabase or the privacy RPC owner.
- AdSense bootstrap is `defer` and the external ads script is only injected after the window `load` event.
- Google Fonts origins are preconnected in `index.html`.

## Regression coverage

- `tests/regression/public/root-entry-community-first.test.ts`
- `tests/regression/public/territory-entry-map-skeleton.test.ts`
- `tests/regression/public/root-entry-bootstrap-performance.test.ts`

The tests guard the lazy root routing, map skeleton continuity, anonymous consent dependency graph, deferred ads startup, and MapLibre bootstrap boundary.

## Important invariant

Performance must not be obtained by replacing the map with a fake image or by drawing an approximate Complexo boundary. The real official territorial geometry remains the only boundary allowed on the entry map.

## Remaining work

1. Remove the legacy Google Fonts `@import` from `src/index.css` with a safe full-file patch and move font stylesheet discovery to the document head or a self-hosted font pipeline. Do not perform a destructive full CSS replacement only to remove one line.
2. Execute production build, regression suite, and real-device/browser measurements for LCP, INP, CLS, transferred JS, and main-thread blocking on the same SHA.
3. Continue migrating remaining direct legacy imports of the heavy `MapLibreAdapter` to the public lazy owner; the public root itself already uses the lazy owner and the idle worker warmup preserves compatibility meanwhile.

## Certification state

No green production certification is claimed here. Vercel continues returning `build-rate-limit`; that provider failure is neither a source build pass nor a source build failure.
