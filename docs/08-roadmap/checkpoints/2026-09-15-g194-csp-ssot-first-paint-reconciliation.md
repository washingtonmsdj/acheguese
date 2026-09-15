# G194 — CSP SSOT and first-paint reconciliation

Date: 2026-09-15  
Branch: `main`

## Scope

Reconciles the first-paint theme bootstrap with the canonical security configuration after the short-lived G193 inline-hash optimization introduced a deployment-policy drift.

## What was found

G193 replaced the same-origin `/theme-init.js` bootstrap with a CSP-hashed inline script to remove one small blocking request. The browser policy was technically valid, but the project security contract is stricter than browser validity alone:

- `src/shared/config/security.config.ts` is the security SSOT;
- `tools/security/csp-contract.ts` requires the CSP in `vercel.json` to be byte-for-byte equal to `SECURITY_HEADERS["Content-Security-Policy"]`;
- the SSOT intentionally has no production inline script source/hash.

Therefore the G193 deployed CSP hash would fail the canonical security gate even though a browser could execute it safely.

## Final contract

- the default document still starts with `class="light"` and one declared theme storage key;
- `index.html` synchronously loads `/theme-init.js` before the React module;
- `public/theme-init.js` remains tiny, dependency-free and same-origin;
- production `script-src` stays derived from the existing security SSOT and contains no `'unsafe-inline'` and no one-off theme bootstrap hash;
- the inline bootstrap introduced by G193 is retired;
- `tools/security/validate-csp.ts` remains the release authority for exact deployed-CSP/SSOT equality and inline-hash validation if an inline script is deliberately introduced in the future;
- G190–G192 improvements remain intact: passive first paint, one routed shell loading step, in-flight multi-profile read deduplication and parallel session/multi-profile hydration.

## Relevant commits

- `dd03244775ddff382cd91d2efc02fd4359c6f21a` — restore the external theme bootstrap file;
- `07ee81145a4a57142e78c8b0881fd8b3c0b595a8` — restore the same-origin bootstrap reference in `index.html`;
- `ac42aad5fd1c4ed7806593edc9ffc9b0d7f22b56` — restore deployed CSP to the canonical security SSOT;
- `ae1e05ec6d2de1e7a559ecaeffdcf427699d4f17` — reconcile the first-paint regression with the final CSP contract.

## Relationship to G193

G193 is historical and superseded by this checkpoint. Its goal (removing one request) was smaller than the architectural cost of diverging from the security SSOT. No alias, compatibility hash or second CSP owner was introduced to preserve that optimization.

## Validation status

The source files and canonical CSP validator were read directly after the reconciliation. Vitest, typecheck, lint, production build, browser E2E and the release security command were not executed in this conversation, so this is source-level reconciliation rather than release certification.
