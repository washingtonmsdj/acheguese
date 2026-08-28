# Compatibility Bridges Registry

Status: CANONICAL — G2 closure review  
Baseline reviewed: `9bdf680c9321726e307f55def5487d6f1c79dee3`  
Plan authority: `/URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`

## Purpose

This file is the current live compatibility-debt ledger for G2. It lists only compatibility paths that still exist on `main` and therefore still require an explicit removal gate.

The detailed historical retirement ledger that previously lived in this file remains preserved in Git history, including blob `5c1132f07786fc1fb1661eb7b872d49e779db819`. Retired paths must not be reintroduced merely because they are no longer repeated here.

## Rules

1. Every bridge is legacy → canonical owner only.
2. A canonical owner must never import a legacy bridge.
3. No bridge may contain independent business, persistence, security-policy, or release logic.
4. A bridge may remain during G2 only when a current caller still requires the legacy path.
5. Removing the final live caller requires removing the bridge from this registry in the same structural cut.
6. Operational tooling is canonical under `tools/**`; the retired `scripts/**` root must not be recreated.
7. E2E specs/helpers are canonical under `tests/e2e/**`; the retired root `e2e/**` must not be recreated.
8. Historical module/service/config bridges already retired are protected by their architecture ratchets and must not be recreated.

## Global source/config bridges

| Legacy path | Canonical owner | Why it still exists | Removal gate |
| --- | --- | --- | --- |
| `src/config/launchScope.ts` | `src/app/config/launchScope.ts` | current callers still import the global compatibility path | migrate all current callers to the app owner |
| `src/config/territory.ts` | `src/core/routing/config/territory.ts` | current callers still import `@/config/territory` | migrate all current callers directly to `core/routing` |

## Global E2E compatibility state

No legacy root `e2e/**` compatibility path remains active. E2E specs and helpers are canonical under `tests/e2e/**`; `tests/architecture/repository-reorganization-contract.test.ts` prevents recreation of the retired root.

## Tooling bridge state

No `scripts/**` compatibility path remains active. Operational tooling is canonical under `tools/**` by responsibility. `package.json`, security regressions and the service-role boundary policy now point to canonical tooling owners, and `tests/architecture/compatibility-surface-cleanup.test.ts` blocks recreation of the retired root.

## Module bridge state

### Business

No Business public service/type compatibility bridge remains active. Canonical public snapshot ownership is in `src/core/business` and the Business boundary ratchet protects against recreation.

### Education

No Education persistence/service compatibility bridge remains active. Canonical ownership is in `src/core/education` and the Education boundary ratchet protects against recreation.

### Gastronomy

No Gastronomy persistence/service compatibility bridge remains active. Canonical ownership is in `src/core/business`; `validate-gastronomy-module-boundaries.ts` and its ratchet treat the historical paths as retired and forbid recreation.

The following module-local contract surfaces are intentional module contracts, not bridges:

| Module path | Canonical contracts reused | Module-owned responsibility |
| --- | --- | --- |
| `src/modules/business/gastronomy/types/gastronomy/index.ts` | `src/core/business/types/gastronomy` | product cuisine taxonomy |
| `src/modules/business/gastronomy/types/menu.ts` | `src/core/business/types/gastronomyMenu` | cart/checkout state contracts |
| `src/modules/business/gastronomy/niches/pizzaria/types.ts` | `src/core/business/niches/pizzaria/types` | pizza build/snapshot composition contracts |

### Community Events

No module-local Event service compatibility bridge remains active. UI/application ownership is `src/modules/community-events`; reusable contracts and services are canonical in `src/core/community-events`. Historical `src/features/events`, `src/core/verticals/events`, and the old Community runtime facade are retired and must not be recreated.

### Guide / Tourist Points

No legacy Guide routing compatibility bridge remains active. Public tourist-point route ownership is canonical in `src/core/guide/tourist-points/routes`; the historical `src/core/verticals/guide` namespace is retired and protected by `tests/architecture/compatibility-surface-cleanup.test.ts`.

## Recent retirements relevant to G2 closure

- `src/config/modules.ts` → retired after its final source caller (`src/core/location/components/TerritoryModeSelector.tsx`) migrated to `src/app/config/modules.ts`; bridge absence and legacy-import absence are ratcheted by `tests/architecture/repository-reorganization-contract.test.ts`.
- `src/config/moduleSlugs.ts` → retired after all source callers migrated to `src/shared/config/moduleSlugs.ts`; bridge absence and legacy-import absence are ratcheted by `tests/architecture/repository-reorganization-contract.test.ts`.
- `src/config/communityLaunch.ts` → retired after the final runtime caller (`src/core/community/pages/ComunidadePage.tsx`) migrated to `src/core/community/config/communityLaunch.ts`; bridge absence and legacy-import absence are ratcheted by `tests/architecture/community-launch-config-import-ratchet.test.ts` and `tests/architecture/repository-reorganization-contract.test.ts`.
- `e2e/**` → retired completely after all E2E callers migrated to `tests/e2e/helpers/auth.ts`; root absence is ratcheted by `tests/architecture/repository-reorganization-contract.test.ts`.
- `scripts/**` → retired completely after `tests/security/security-authority-migrations.test.ts`, `package.json` and service-role policy migrated to canonical `tools/**` owners; root absence is ratcheted by `tests/architecture/compatibility-surface-cleanup.test.ts`.
- `src/core/verticals/guide/routes/touristPointPublicRoutes.ts` and `src/core/verticals/guide/routes/useTouristPointPublicUrls.ts` → canonical owner `src/core/guide/tourist-points/routes`; final application caller migrated and the historical Guide vertical namespace was removed and ratcheted.
- `scripts/validate-project-taxonomy.ts` → canonical owner `tools/architecture/validate-project-taxonomy.ts`; final live test caller migrated and legacy path removed.
- `scripts/media-assets-cp016-backfill.ts` → canonical owner `tools/migrations/media-assets-cp016-backfill.ts`; architecture test migrated and legacy implementation removed.
- `src/modules/business/gastronomy/services/MenuService.ts` → canonical owner `src/core/business/services/MenuService.ts`; final Gastronomy compatibility service bridge removed and ratcheted as retired.
- `scripts/lib/**` → removed after consumers migrated to `tools/supabase`, `tools/migrations`, and `tools/architecture`.
- legacy Events owners `src/features/events/**` and `src/core/verticals/events/**` → removed; current owner is `src/core/community-events` / `src/modules/community-events`.

## G2 closure conditions for remaining bridges

G2 may close with the explicitly tracked compatibility debt above only if all of the following hold on the reviewed SHA:

- `src/features`, `src/test`, and `src/__tests__` are absent;
- `scripts/` is absent and operational tooling is canonical in `tools/**`;
- `e2e/` is absent and E2E specs/helpers are canonical in `tests/e2e/**`;
- no canonical `tools/**` owner depends on a retired `scripts/**` path;
- no `src/core/**` implementation depends on `src/modules/**`;
- module → integration runtime exceptions remain explicitly ratcheted and cannot grow;
- workflows/build/deploy guards observe canonical `tools/**` paths;
- every remaining bridge has a current caller and a concrete removal gate;
- architecture ratchets prevent retired bridges/namespaces from being recreated.
