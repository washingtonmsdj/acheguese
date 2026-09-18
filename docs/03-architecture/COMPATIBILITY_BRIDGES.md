# Compatibility Bridges Registry

**Status:** CANONICAL — zero live runtime compatibility facades  
**Reviewed:** 2026-09-18

## Purpose

This registry defines the repository rule for compatibility code.

Historical migrations, checkpoints and archived documents may describe retired
bridges. Active source must not preserve path/service aliases after all callers
have migrated to the canonical owner.

## Current state

There are **no approved live runtime compatibility facades**.

New compatibility facades are not an extension mechanism. A transitional bridge
requires an explicit migration plan, current caller evidence and a removal gate;
it must not become a second owner of persistence, authorization, routing or
business rules.

## Retired on 2026-09-18

The final caller-backed facades were removed atomically:

- `src/modules/guide/hooks/useGuideUrls.ts` → callers now use
  `src/core/guide/tourist-points/routes/useTouristPointPublicUrls.ts`;
- `src/core/profiles/services/multi-profile/businessService.ts` → profile
  editor/domain rules now call
  `src/core/business/services/business.profile-extension.ts` directly;
- `MobilityRuntimeService.getRideWithAddresses()` → passenger search now calls
  `src/core/mobility/services/mobility.ride-read-queries.ts` directly;
- `src/core/business/services/gastronomy.mutations.ts` → Gastronomy writes use
  `GastronomyProfileService` directly.

The Business extension owner was also corrected to use `maybeSingle()` for its
nullable read contract, so facade removal did not replace a missing row with a
fabricated error path.

## Rules

1. Canonical owners must never import compatibility facades.
2. No alias may exist solely to preserve an old import path.
3. No facade may duplicate persistence, authorization, route identity or
   business rules.
4. Once callers are migrated, remove the export and physical file in the same
   change.
5. Persisted-data normalization at a canonical read boundary is not a
   compatibility facade.
6. Historical references in `docs/08-roadmap/checkpoints/**` and
   `docs/10-archive/**` do not authorize recreation of retired code.

## Structural roots that remain retired

These roots remain absent and must not be recreated:

- `src/config/**`;
- `scripts/**` as a runtime/tooling root (operational tooling belongs under
  `tools/**`);
- `e2e/**` (tests belong under `tests/e2e/**`);
- `plans/**`;
- `.kiro/**`;
- `src/features/**`;
- `src/test/**`;
- `src/__tests__/**`.

## Guardrails

- `tests/architecture/compatibility-facade-retirement.test.ts`;
- `tests/architecture/compatibility-surface-cleanup.test.ts`;
- `tests/architecture/repository-reorganization-contract.test.ts`;
- domain-specific SSOT tests for Business/Gastronomy, Mobility and Guide.

Compatibility debt is considered closed only while these guards remain green and
architecture search shows no replacement alias.
