# G190 — Refresh first paint and CSP-safe theme bootstrap

Date: 2026-09-14  
Branch: `main`

## Scope

Closes the blank/dark frame observed on refresh after the generic `FullScreenLoader` was retired. The retired interstitial remains retired; this checkpoint fixes first paint without restoring spinner, copy, timer or another blocking loading screen.

## Root cause

Two independent conditions could expose a blank/dark frame while routed chunks loaded:

1. page-owning Suspense boundaries in `FullAppRuntimeShell` and `SessionProfileRuntimeShell` temporarily used `fallback={null}`;
2. the base `:root` design tokens are dark, while the product default is light and the `.light` class used to be applied only after React mounted.

An initial inline theme bootstrap was then found to be incompatible with the production CSP, whose `script-src` intentionally omits `'unsafe-inline'`.

## Final contract

- `FullScreenLoader` and the copy `Preparando a casa para você se achegar...` remain absent from active source;
- page-owning Suspense boundaries render `PassivePageFallback`, preserving the page surface without text, spinner, animation or recovery timer;
- overlay/modal/analytics Suspense boundaries may still use `fallback={null}` because the owning page is already visible underneath;
- `index.html` starts with the product default `class="light"` and declares the theme storage key once through `data-theme-storage-key`;
- `public/theme-init.js` is a tiny synchronous same-origin classic script loaded in `<head>` before the React module;
- the bootstrap reads the declared key and applies persisted dark/light classes before React starts;
- the production CSP remains strict: `script-src 'self' ...` is sufficient for `/theme-init.js`; no `'unsafe-inline'` was added;
- `useTheme` reads the same declared key and uses `useLayoutEffect`, avoiding a second hardcoded storage-key owner.

## Regression protection

- `tests/regression/public/first-paint-theme-fallback.test.ts` protects ordering, shared key ownership, passive routed fallbacks and CSP compatibility;
- `tests/regression/loading/full-screen-loader-retired.test.ts` protects retirement of the old interstitial while requiring the passive fallback for page-owning route Suspense.

## Relevant commits

- `dd6fd0ac00778799d07f5caff8f5e1a1dcd52916` — apply persisted theme before React first paint;
- `5b45a3b17edab618ba8126513c4fb7d13fe7121b` — align `useTheme` with shared theme-key ownership;
- `475340280a1bdcc81fd1018566d25fefe70f4ab0` — restore a passive surface in the full app shell;
- `bae335e1e34784679ebf2faa74589d3d0c32bc54` — restore a passive surface around routed pages;
- `20103ba6594039d05a6cb2fa72b278f36e831df7` — add first-paint regression;
- `8cfaf626ac7ea8bdeb14b4e4aa35e90ec9f255a2` — reconcile the retired-loader ratchet with passive fallbacks;
- `45c0a7a25958288a31feaeaa1439c8494ee08446` — move the theme bootstrap to a same-origin static script;
- `e3179c2fe8ec5155a0e835aab5d657207dd9e5fb` — replace inline theme code with the CSP-safe script reference;
- `a534da56debb58b00bcbcbee879a5957511186d8` — guard CSP-safe first paint.

## Relationship to G189

G189 correctly retired the generic full-screen interstitial, but its temporary statement that shell-level Suspense should use `fallback={null}` is superseded by this checkpoint. The final rule is: page-owning Suspense uses the passive surface; only non-page overlays may stay visually null while loading.

## Validation status

Current `main` files were read directly after each change and the conflicting regression was reconciled. Vitest, typecheck, lint, production build, browser E2E and screenshot comparison were not executed in this conversation. Vercel provider rate limiting remains separate from source correctness.
