# G193 — Zero-round-trip first-paint theme bootstrap

Date: 2026-09-14  
Branch: `main`

## Scope

Removes the extra blocking HTTP request introduced by the first CSP-safe theme bootstrap while keeping the refresh free of the old black frame and preserving a strict script CSP.

## Previous state

G190 moved theme initialization out of React so the product default/persisted theme could be applied before first paint. To avoid weakening CSP, that bootstrap was temporarily served as synchronous `/theme-init.js` from `<head>`.

That was secure, but a synchronous external script in the parser-critical head adds a separate request before HTML parsing can continue on a cold load.

## Final contract

`index.html` now contains one minified inline bootstrap immediately after the viewport/theme metadata and before the React module.

The script:

- reads the canonical storage key from `document.documentElement.dataset.themeStorageKey`;
- defaults to the static `class="light"` already present on `<html>`;
- switches to `dark` only when the persisted value is exactly `dark`;
- restores light mode if storage is unavailable;
- performs no network request, module import, timer or async work.

## CSP

The script is **not** enabled through `'unsafe-inline'`.

`vercel.json` authorizes only the exact bootstrap body using:

`'sha256-NMhNu8+ZTwbwnYOvKO99F5THCajyYq+BOYluhrqT+4s='`

The SHA-256 was mechanically recalculated from the exact script body in `index.html` and matches the CSP token.

Any textual change to the bootstrap must update the hash or the browser will refuse to execute it.

`public/theme-init.js` was deleted because it is no longer referenced.

## Regression protection

`tests/regression/public/first-paint-theme-fallback.test.ts` now:

- extracts the inline bootstrap directly from `index.html`;
- recalculates its SHA-256 at test time;
- requires the resulting CSP hash in `script-src`;
- continues forbidding `'unsafe-inline'`;
- requires the bootstrap to appear before the React module;
- requires the obsolete `/theme-init.js` reference/file to remain absent;
- continues protecting shared theme-key ownership through `useTheme`.

## Relevant commits

- `45b8661c4b9dac5aff9aad81c49cb65f73ede3f8` — inline the first-paint bootstrap;
- `5dda782a315bfb7b58d37722f0c562636ee89b38` — authorize the exact script hash in production CSP;
- `258ec4d8f65c0730518cfe2c80b200b3c9f9a309` — remove the obsolete external bootstrap file;
- `b171302b72ca3ecf1229fcc97ce746dc4dcacb74` — ratchet the bootstrap hash against the actual HTML.

## Relationship to G190

G190 remains historical evidence of the blank-frame diagnosis and initial CSP-safe external-script solution. This checkpoint supersedes only the transport mechanism: the theme still resolves before React, but without an additional parser-blocking HTTP request.

## Validation status

The current `index.html` body was read directly and its SHA-256 was recalculated mechanically; it matches the production CSP token. Vitest, typecheck, lint, production build, browser E2E, network waterfall capture and screenshot comparison were not executed in this conversation.
