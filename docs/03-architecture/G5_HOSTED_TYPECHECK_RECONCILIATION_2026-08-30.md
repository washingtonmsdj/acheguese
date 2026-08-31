# G5 — Hosted typecheck reconciliation — 2026-08-30

Status: **SOURCE RECONCILED / HOSTED FINAL RETEST BLOCKED**  
Branch: `main`  
Source HEAD reconciled: `f78b1564ac94a5e86fbd3b06d0719946449bed0a`

## Purpose

This evidence note records the hosted TypeScript/build reconciliation performed during G5 without converting provider failures into source PASS. It is intentionally narrow: it covers the concrete TypeScript/module-owner failures exposed by Vercel and the source commits that removed them.

## Hosted evidence

Vercel deployment `dpl_8uJ6nVkcCwdvXqX5U3qCVVwuUNAp` executed source commit:

- `f72bb35871b311780467da50a5cab7f9755ae8a1` — `fix(g5): migrate education marketing contracts`

The hosted typecheck reached TypeScript and reported exactly three remaining errors:

1. `src/modules/classifieds/jobs/pages/VagaDetailPublicPage.tsx` imported retired `@/config/territory`.
2. `src/modules/classifieds/jobs/pages/VagasPublicPage.tsx` imported retired `@/config/territory`.
3. `src/modules/community-events/pages/EventDetailPage.tsx` imported retired `../services/EventEngagementService`.

No Education, Business, Business Public, Gastronomy or Pizza owner error remained in that hosted error set. This is positive hosted evidence that the earlier owner migrations had cleared the TypeScript failures that previously appeared for those domains.

## Source reconciliation after that hosted run

The three remaining hosted failures were corrected directly on `main`, without recreating compatibility bridges:

- `7c2a79ef57f8e5575f7e4f3af7e4f12c305b8e57` — `fix(g5): migrate jobs territory config owner`
  - `VagasPublicPage.tsx` now imports `TERRITORY_CONFIG` from `@/core/routing/config/territory`.
- `554ee5001236d73954484762a7f4d7ae7fc742f6` — `fix(g5): migrate job detail territory owner`
  - `VagaDetailPublicPage.tsx` now imports `TERRITORY_CONFIG` from `@/core/routing/config/territory`.
- `f78b1564ac94a5e86fbd3b06d0719946449bed0a` — `fix(g5): migrate event engagement owner`
  - `EventDetailPage.tsx` now imports `EventEngagementService` from `@/core/community-events/services/EventEngagementService`.

These changes follow the existing compatibility governance:

- `src/config/**` is retired; territory configuration belongs to `src/core/routing/config/territory.ts`.
- module-local `src/modules/community-events/services/EventEngagementService.ts` is retired and must remain absent; engagement persistence belongs to `src/core/community-events/services/EventEngagementService.ts`.

Repository search after the source fixes returned no runtime caller for `../services/EventEngagementService`; search for `@/config/territory` returned documentation/ratchet references rather than the two runtime job-page callers.

## Earlier source fixes validated by the same hosted run

Because deployment `f72bb358...` no longer reported their previous TypeScript failures, the following source reconciliations are covered by hosted negative-error evidence:

- Business create input ownership/type reconciliation (`6370d8f5fb821271e39deb5ce5e0c3d1cc450358`).
- Business canonical analytics UI reconciliation (`2fe9b8fad6776a729ad8d75d13327c6c6664f0bf`).
- Business public snapshot owner migration (`cb553b6918c271284d6da9765d2142a23d25ee08`).
- Pizza admin service owner migration (`33b2a45334456753346584d3b80f1b307e02e23d`).
- Education service dependencies to Core (`831661b55cbed00a086695f99bad706b0cdc1ee8`).
- Education programs/setup/events/explorer/marketing contracts to Core (`67f37641337a956e8e3d417e0c14bc0b7e556707`, `dc00973f3faf78eb08d926025392f73acc5111da`, `ff341189b4a15af6bb8d64e109f1bab10636d570`, `71ba6360c8f516a011ce8e8e847bad43307c23b2`, `f72bb35871b311780467da50a5cab7f9755ae8a1`).

This does **not** mean the full production build is PASS; it means those previously observed TypeScript errors were absent from the hosted run that reached the next residual failures.

## Final hosted retest blocker

GitHub combined status for source HEAD `f78b1564ac94a5e86fbd3b06d0719946449bed0a` reports Vercel failure with target URL indicating:

- `upgradeToPro=build-rate-limit`

Therefore the source HEAD has not received a final hosted TypeScript/build execution after the last three fixes. Treat this as a provider proof blocker, not as source PASS and not as source regression.

## G5 consequence

G5 remains **EM EXECUÇÃO**. Do not start G6.

Even after a future hosted build validates this source reconciliation, the known central G5 blockers remain independent:

1. full official Supabase generated-types materialization and canonical snapshot reconciliation;
2. official Storage API lifecycle removal of the empty orphan bucket `classified-images`;
3. actual GitHub Actions step execution for required gates (current jobs have failed before steps/runner allocation).

## Do not repeat

- Do not recreate `src/config/**` or module-local Event engagement bridges.
- Do not re-open the already-cleared Education/Business/Gastronomy owner errors unless a new hosted run reproduces them.
- Do not interpret Vercel build-rate-limit as a source regression.
- Do not mark the final build/typecheck PASS until a post-`f78b1564...` hosted execution actually runs.
- Do not start G6 while G5 blockers remain.
