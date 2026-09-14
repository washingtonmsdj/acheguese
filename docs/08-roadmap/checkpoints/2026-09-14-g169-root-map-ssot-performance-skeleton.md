# G169 — Root map SSOT, performance and page-native skeleton

Date: 2026-09-14

## Scope

This checkpoint consolidates the public `/` map-loading and bootstrap work after G168.

## Root `/`

- Launch territory comes from the versioned public fallback contract; no database discovery is required before rendering the entry.
- The public root is isolated from the full app provider tree.
- React Router is not required by the initial public-root render; native links are used on the landing and the router is loaded only by the full app or delayed overlays.
- Consent/analytics remain delayed until after `window.load` plus browser idle.
- The community preview uses the existing lightweight `complexo-cultura.jpg` asset with lazy/async/low-priority loading.
- Lucide is not part of the root page/map loading path.

## Map SSOT

- `MapLibreAdapter.tsx` is the public lazy owner.
- Passive maps automatically use `MapLibrePassiveRuntime`; interactive maps keep the full runtime.
- MapLibre engine, CSS and worker are loaded through the canonical runtime loader.
- Boundary loading is lazy and deduplicated by promise/cache.
- Official source preconnects are derived from `metadata.source_url`; no GeoSalvador hostname is hardcoded in the map wrapper.

## Entry map performance

- The map runtime mounts immediately after the first placeholder paint; no IntersectionObserver/idle gate delays WebGL.
- Style JSON is preloaded with high fetch priority.
- MapLibre engine and official boundary preload concurrently.
- The passive map canvas is never hidden behind `opacity: 0`; early map pixels may appear as soon as MapLibre renders them.
- Official boundary remains progressive and never blocks the basemap.
- Passive runtime excludes geolocation, search, clustering and interactive controls.
- Passive-map logging imports the shared logger/Sentry path only on an actual error.
- Passive runtime uses conservative rendering options: no label fade, no world copies, reduced zoom cache and device-pixel-ratio cap only above 2x.

## Page-native skeleton

The previous conceptual/globe Arrival has been replaced by a lightweight interface skeleton inspired by social-feed loading patterns:

- neutral tile/card composition instead of fake streets or geography;
- one status chip and one compact bottom card;
- one global shimmer only;
- CSS-only, no icons/SVGs/timers/animation libraries;
- responsive across 10.5–12rem mobile map heights and the full desktop map column;
- translucent so MapLibre can become visible beneath it while loading;
- 150ms exit fade;
- no fake or partial territorial boundary.

## Regression guards

Source regressions protect:

- immediate post-paint map mounting;
- concurrent engine + boundary preload;
- visible passive map canvas;
- official-only boundary rendering;
- page-native dependency-free skeleton;
- no Lucide in root/map loading path;
- no database territory discovery on `/`;
- router/query/state vendor separation;
- passive-runtime dependency budget.

## Certification status

These source changes are committed to `main`, but this checkpoint does **not** claim runner, build, Core Web Vitals or deployment certification unless an external runner executes the same SHA successfully. Vercel provider rate-limit remains distinct from source correctness.
