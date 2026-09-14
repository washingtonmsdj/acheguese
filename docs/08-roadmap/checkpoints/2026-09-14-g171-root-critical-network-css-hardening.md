# G171 — Root critical network and CSS hardening

Date: 2026-09-14
Branch: `main`
Baseline before this batch: G170
Implementation head before checkpoint: `b27caebb0bb1579be45245f7dc246364974b4829`

## Objective

Continue reducing the public `/` critical path without creating parallel owners, weakening accessibility, faking map geometry, or making the skeleton responsible for map progress.

## Map runtime

- `MapLibreAdapter` remains the single public owner.
- Worker configuration no longer imports `maplibre-gl` again; `loadMapLibreRuntime()` passes the already-loaded `runtime.setWorkerUrl` into the worker configurator.
- The public entry lazy loader now starts the React map runtime and passive MapLibre engine/worker/CSS together during the first render.
- The page-native skeleton remains only the Suspense/loading surface; it does not schedule or gate the map.
- Official boundary preload remains independent and post-paint, reusing the canonical official FeatureServer loader/cache.

## HTML and third-party bootstrap

- Removed `public/font-bootstrap.js` and `public/adsense-bootstrap.js`.
- `index.html` no longer downloads those bootstrap helpers during parsing.
- Plus Jakarta Sans remains a low-priority, `display=optional` style preload; `main.tsx` promotes it after the first frame.
- AdSense remains deferred until `load + idle`, now scheduled by the existing main bootstrap instead of a separate parser-time script request.
- Removed early Google Fonts preconnects so first-visit speculative connections prioritize OpenFreeMap and the official GeoSalvador boundary authority.

## CSS

- Source `src/index.css` remains the historical/global stylesheet; it was not replaced wholesale.
- Generated CSS now removes the duplicate Google Fonts `@import`.
- Generated CSS also prunes confirmed-dead selectors from the old public-entry concept while preserving active selectors in mixed selector rules.
- A regression test executes the PostCSS pruning plugin and proves active selectors such as `.entry-hero` / `.entry-map` survive while dead entry selectors are removed.
- No second root theme, Tailwind config, or design-token owner was introduced.

## Preserved contracts

- Official Complexo geometry only; no approximate/incomplete contour.
- Mobile and desktop page-native skeleton remain responsive and non-blocking.
- Root remains outside Router/React Query/full provider runtime.
- Consent remains post-load and available.
- Accessibility styles/preferences remain preserved.
- Concurrent authentication/cadastro work on `main` was compared and preserved.

## Validation status

Source regressions were updated/added, but no runner executed them in this chat. Do not claim tests, build, LCP, INP or CLS are green from this checkpoint alone.

Vercel has historically returned `build-rate-limit`; deploy state must be checked on the final checkpoint SHA and is not a substitute for a successful build.

## Next performance work

1. Obtain actual production bundle/Lighthouse measurements once a runner/deploy is available.
2. Use those measurements before attempting a separate root-critical CSS build; do not create a parallel token/theme SSOT speculatively.
3. Measure the official GeoSalvador batch payload before considering versioned same-origin neighborhood geometry.
4. Continue reducing post-load overlays only if measurements show they affect INP/LCP after the map path is stable.
