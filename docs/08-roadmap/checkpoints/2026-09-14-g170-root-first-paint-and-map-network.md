# G170 — Root first paint and map network

Date: 2026-09-14

## Scope

This checkpoint consolidates the next performance pass over the public `/` after G169. The objective is to make the entry content paint first and let the map become useful as quickly as possible without weakening the official-boundary contract.

## Public root contract

- `/` remains community-first and independent from session/profile discovery.
- React Router remains outside the normal root bootstrap.
- The page-native map skeleton is only a visual Suspense/loading surface; it never gates MapLibre, style or boundary work.
- Community preview imagery is secondary to the map and must not compete with first-map network work.
- No approximate, partial or hand-drawn Complexo boundary is allowed.

## Map startup

`TerritoryEntryMap` now requests the lazy runtime on the first render. There is no `shouldMountRuntime`, IntersectionObserver or extra render before the runtime request.

After mount, the following independent pipelines are started without waiting on each other:

1. OpenFreeMap style preload;
2. lazy React map runtime;
3. passive MapLibre engine/worker/runtime preload;
4. official municipal boundary preload.

The passive map canvas is never hidden waiting for the official boundary.

## Territory-first camera

The initial camera is calculated from the official center metadata already attached to the launch territory members. The Complexo therefore starts around its own area instead of first requesting Salvador-wide tiles and later travelling to the territory.

The passive runtime camera/fit duration is capped at 180 ms. It also retains the passive render budget (`fadeDuration: 0`, DPR cap 2, no world copies and a reduced tile-cache zoom window).

## Official boundary network path

A backend-free canonical loader now exists at:

`src/core/geospatial/data/officialFeatureServerBoundary.ts`

For official FeatureServer-backed territories it:

- groups locations by `metadata.source_url`;
- batches the four Complexo OBJECTIDs in one `OBJECTID IN (...)` query;
- requests only `OBJECTID` attributes plus geometry;
- requests WGS84 GeoJSON;
- omits Z/M dimensions;
- limits transfer precision to six decimal places without geometry generalization;
- caches source/object results and deduplicates pending batch promises;
- has no Supabase dependency.

`useTerritoryPolygon` tries this official lightweight path first and dynamically imports the full `BoundaryService` only as fallback when the official path cannot provide a complete result.

`BoundaryService` remains the higher-level geospatial authority. Its older internal metadata-source HTTP implementation is still a deduplication follow-up; do not create a second competing service.

## Font / CSS first paint

The historical Google Fonts `@import` remains in source `index.css`, but the PostCSS pipeline removes only that remote at-rule from generated CSS.

`index.html` now discovers Plus Jakarta Sans as a low-priority style preload with `display=optional`. `public/font-bootstrap.js` activates the stylesheet after the first paint; `<noscript>` preserves a non-JS fallback. This keeps the external font stylesheet out of the render-blocking path.

## Monitoring / deferred helpers

`src/shared/utils/deferredInit.ts` no longer statically imports `logger`, which indirectly imported Sentry. Monitoring is loaded dynamically only if a deferred callback actually fails. This prevents the root bootstrap from paying monitoring code merely to use `deferLoad`/`deferIdle`.

## Community preview image

The ~138 KB desktop community preview keeps intrinsic dimensions and its low-priority/lazy attributes, but the `src` is assigned only after window load + browser idle on desktop. It is not requested on the normal mobile layout where the preview is hidden.

## Regressions

Source regressions protect:

- first-render lazy map runtime request;
- independent engine/runtime/boundary startup;
- official-source batch before backend fallback;
- backend-free official loader;
- territory-first initial camera;
- passive camera/render budget;
- non-blocking Google Fonts path;
- deferred monitoring import;
- delayed community preview image;
- page-native skeleton without icon/animation dependencies.

These regressions are committed source guards only. No runner execution is certified by this checkpoint.

## Certification state

This checkpoint does **not** certify build, tests, LCP, INP, CLS or deployment. Those require an actual runner/production measurement on the same SHA. Vercel provider rate-limit failures must continue to be treated as provider execution failures, not source certification.
