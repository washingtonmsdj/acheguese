# G5 — Hosted typecheck reconciliation — 2026-08-30

Status: **HOSTED TYPECHECK/PRODUCTION BUILD CLOSED**  
Branch: `main`  
Hosted proof commit: `b277e5fb7b560bdc9c540fff035eb21e49420de5`  
Current source HEAD at revalidation: `4a012fb9fd4d4fa7cc4613ee0aa1d6e27f28da29`

## Purpose

This evidence note records the hosted TypeScript/build reconciliation performed during G5. It preserves the earlier failure history while recording the later production proof that closed the hosted build blocker.

## Earlier hosted evidence

Vercel deployment `dpl_8uJ6nVkcCwdvXqX5U3qCVVwuUNAp` executed source commit:

- `f72bb35871b311780467da50a5cab7f9755ae8a1` — `fix(g5): migrate education marketing contracts`

That hosted typecheck reached TypeScript and reported exactly three remaining errors:

1. `src/modules/classifieds/jobs/pages/VagaDetailPublicPage.tsx` imported retired `@/config/territory`.
2. `src/modules/classifieds/jobs/pages/VagasPublicPage.tsx` imported retired `@/config/territory`.
3. `src/modules/community-events/pages/EventDetailPage.tsx` imported retired `../services/EventEngagementService`.

No Education, Business, Business Public, Gastronomy or Pizza owner error remained in that hosted error set. This was positive hosted evidence that the earlier owner migrations had already cleared their previous TypeScript failures.

## Source reconciliation after the failing hosted run

The three remaining hosted failures were corrected directly on `main`, without recreating compatibility bridges:

- `7c2a79ef57f8e5575f7e4f3af7e4f12c305b8e57` — `fix(g5): migrate jobs territory config owner`
  - `VagasPublicPage.tsx` imports `TERRITORY_CONFIG` from `@/core/routing/config/territory`.
- `554ee5001236d73954484762a7f4d7ae7fc742f6` — `fix(g5): migrate job detail territory owner`
  - `VagaDetailPublicPage.tsx` imports `TERRITORY_CONFIG` from `@/core/routing/config/territory`.
- `f78b1564ac94a5e86fbd3b06d0719946449bed0a` — `fix(g5): migrate event engagement owner`
  - `EventDetailPage.tsx` imports `EventEngagementService` from `@/core/community-events/services/EventEngagementService`.

These changes follow the existing compatibility governance:

- `src/config/**` is retired; territory configuration belongs to `src/core/routing/config/territory.ts`.
- module-local `src/modules/community-events/services/EventEngagementService.ts` is retired; engagement persistence belongs to `src/core/community-events/services/EventEngagementService.ts`.

## Earlier source fixes covered by hosted negative-error evidence

The failing `f72bb358...` run had already stopped reporting previous TypeScript failures from:

- Business create input ownership/type reconciliation (`6370d8f5fb821271e39deb5ce5e0c3d1cc450358`).
- Business canonical analytics UI reconciliation (`2fe9b8fad6776a729ad8d75d13327c6c6664f0bf`).
- Business public snapshot owner migration (`cb553b6918c271284d6da9765d2142a23d25ee08`).
- Pizza admin service owner migration (`33b2a45334456753346584d3b80f1b307e02e23d`).
- Education service dependencies to Core (`831661b55cbed00a086695f99bad706b0cdc1ee8`).
- Education programs/setup/events/explorer/marketing contracts to Core (`67f37641337a956e8e3d417e0c14bc0b7e556707`, `dc00973f3faf78eb08d926025392f73acc5111da`, `ff341189b4a15af6bb8d64e109f1bab10636d570`, `71ba6360c8f516a011ce8e8e847bad43307c23b2`, `f72bb35871b311780467da50a5cab7f9755ae8a1`).

## Final hosted production proof — CLOSED

The former Vercel `upgradeToPro=build-rate-limit` condition no longer blocks hosted proof.

Production deployment:

- deployment: `dpl_8X8g212hHmqvbSwN2aUoSf1iNvRY`;
- source: `b277e5fb7b560bdc9c540fff035eb21e49420de5` — `perf(g5): remove redundant orders admin SELECT`;
- target: `production`;
- state: `READY`;
- framework: Vite;
- source: GitHub `main`.

The production build cloned exactly `b277e5f` and executed the repository's canonical Vercel build chain:

`vercel.json` -> `node tools/release/run-vercel-production-build.mjs` -> `npm run build:vercel`.

The canonical `build:vercel` script includes:

1. production input validation;
2. CSP validation;
3. Turnstile production validation;
4. `npm run typecheck:app` (`tsc -p tsconfig.app.json --noEmit`);
5. lint;
6. Vite production build.

The outer production runner additionally executes security validation, security lint, upload SSOT validation, Core/Platform ownership validation, sitemap generation/validation, the canonical build above, and final sitemap validation.

Observed hosted result:

- security validation: PASS with the existing `.env.local` build-environment warning;
- application TypeScript gate completed successfully, otherwise the fail-fast runner could not have reached Vite output/deployment;
- Vite: `✓ built in 32.37s`;
- generated sitemap validation: valid index, `3 files`, `114302 URLs`;
- `Build Completed in /vercel/output [3m]`;
- deployment completed successfully;
- Vercel state: `READY`;
- error-only build-log query returned no source/typecheck/build error.

Therefore the old hosted TypeScript/build blocker is **CLOSED through `b277e5fb...`**.

## Coverage of current HEAD

A GitHub compare from hosted proof `b277e5fb...` to current HEAD `4a012fb9...` reports six commits and **zero `src/**` changes**.

Only these paths changed after the hosted production proof:

- four forward-only G5 SQL migrations removing redundant admin SELECT shadows;
- `tests/security/redundant-admin-select-shadow-ratchet.test.ts`;
- `.github/workflows/supabase-types-sync.yml` (`cancel-in-progress: true`).

Therefore the application source tree at current HEAD is the same application source tree that passed the hosted production build. The later SQL changes were already applied and revalidated against the live Supabase project independently.

## G5 consequence

The Vercel hosted typecheck/build item is no longer a central G5 blocker.

G5 still remains **EM EXECUÇÃO** because the independent blockers below remain open:

1. official Supabase generated-types materialization into the canonical `src/integrations/supabase/types.generated.ts` snapshot — source workflow governance is fixed, but the authorized GitHub runner has not produced the artifact;
2. official Storage API lifecycle removal of the empty orphan bucket `classified-images` — the connected capability still does not expose `emptyBucket/deleteBucket`, and raw SQL deletion remains forbidden;
3. actual GitHub Actions step execution for required gates — prior jobs failed before runner/step allocation and must not be treated as code failures or PASS.

Known provider/security exceptions such as native HIBP on the current Supabase plan and the PostGIS public-surface owner limitation remain governed by their existing security exceptions; they are not silently reclassified as fixed here.

## Do not repeat

- Do not recreate `src/config/**` or module-local Event engagement bridges.
- Do not re-open the already-cleared Education/Business/Gastronomy/Pizza owner errors unless a new hosted run reproduces them.
- Do not continue citing Vercel build-rate-limit as a current G5 blocker after this production proof.
- Do not require another hosted build solely for the SQL/test/workflow-only commits after `b277e5fb...`; require a new hosted build if application/build inputs change.
- Do not bypass generated-types authority with a manually reconstructed snapshot.
- Do not delete `classified-images` via raw SQL.
- Do not start G6 while the remaining G5 blockers stay open.
