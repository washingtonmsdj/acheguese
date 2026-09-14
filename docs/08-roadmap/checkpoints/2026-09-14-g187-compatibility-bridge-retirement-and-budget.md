# G187 — Compatibility bridge retirement and bounded debt

Date: 2026-09-14  
Branch: `main`

## Scope

This checkpoint removes proven dead/replaceable compatibility surfaces and reconciles the canonical compatibility registry with the source that actually remains.

## Retired in source

- Removed the unused `startSentryTransaction` shim from `src/shared/config/sentry.config.ts`. No runtime caller existed; the legacy dynamic `startTransaction` lookup is now ratcheted against reintroduction.
- Removed `src/modules/business/services/BusinessService.ts`, which only re-exported the canonical `src/core/business/services/BusinessService.ts` owner. Module barrels no longer publish the duplicate path.
- Removed `src/modules/business/gastronomy/services/GastronomyUrlService.ts`. The Gastronomy barrel now points directly at `src/core/verticals/gastronomy/services/GastronomyUrlService.ts`.
- Migrated `OrderTrustFeedbackPanel` directly to `OperationalTrustCommandService.submitOrderFeedback()` and removed `src/modules/business/gastronomy/services/OrderTrustService.ts` plus its barrel export.

## Ratchets

- `tests/architecture/sentry-optional-telemetry-consent.test.ts` now blocks the retired Sentry transaction shim/API from returning.
- `tests/architecture/business-service-canonical-owner.test.ts` protects the retired Business/Gastronomy bridges and the direct Trust command ownership.
- `tests/architecture/live-compatibility-facade-budget.test.ts` freezes the caller budget of the compatibility facades that still have proven consumers.

## Remaining live compatibility debt

The previous registry incorrectly claimed zero live service/path compatibility facades. `docs/03-architecture/COMPATIBILITY_BRIDGES.md` now records the actual bounded debt:

1. `src/modules/guide/hooks/useGuideUrls.ts` — three runtime callers plus the module barrel; canonical owner is `src/core/guide/tourist-points/routes/useTouristPointPublicUrls.ts`.
2. `src/core/profiles/services/multi-profile/businessService.ts` — still used by the multi-profile editor/profile domain rules; canonical persistence owner is `src/core/business/services/business.profile-extension.ts`.
3. `MobilityRuntimeService.getRideWithAddresses()` — one UI caller (`BuscandoMotoristaPage`); canonical bounded read owner is `mobility.ride-read-queries.ts`.

These facades may not gain new callers. They should be removed only by migrating all current consumers atomically; this checkpoint deliberately does not create replacement aliases.

## Deferred work that was not hacked around

- Physical cleanup of the old `/` CSS in `src/index.css` remains pending because the current GitHub contents connector only supports whole-file replacement and there is no authenticated local checkout in this session. No second stylesheet, late override, `!important`, or inline-style bridge was introduced.
- The `SALVADOR_COMMUNITY_LAUNCH_*` nominal exports still have large callers. No partial rename/alias bridge was introduced.
- Large remaining compatibility callers are left explicit rather than being partially migrated through unsafe whole-file rewrites.

## Validation status

Source/caller census was performed through the connected GitHub repository before each retirement, and deleted bridge paths were re-searched afterward. Architecture regressions were created/updated but were **not executed in this conversation**.

The combined status checked on source SHA `057f23e94b5dd01cf54d3d212df7c627a8ff43e9` reports only the known Vercel `build-rate-limit` failure target. That is provider quota evidence, not a source build PASS or FAIL.

No Vitest, typecheck, lint, production build, E2E, Lighthouse, or same-SHA deploy certification is claimed by this checkpoint.
