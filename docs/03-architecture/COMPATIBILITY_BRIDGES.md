# Compatibility Bridges Registry

Status: CANONICAL — zero live compatibility bridges  
Baseline reviewed: `67b70d6da3c7cab6a2956eb80d8b15e5bd6fcc1f`  
Plan authority: `/URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`

## Purpose

This file is the current compatibility-debt ledger for G2. No live compatibility bridge remains on `main` at the reviewed baseline.

The detailed historical retirement ledger that previously lived in this file remains preserved in Git history, including blob `5c1132f07786fc1fb1661eb7b872d49e779db819`. Retired paths must not be reintroduced merely because they are no longer repeated here.

## Rules

1. Every compatibility path is legacy → canonical owner only.
2. A canonical owner must never import a retired compatibility path.
3. No compatibility path may contain independent business, persistence, security-policy, or release logic.
4. A compatibility bridge may exist only with a current caller and explicit removal gate.
5. Retired compatibility roots and files are protected by architecture ratchets and must not be recreated.
6. Operational tooling is canonical under `tools/**`; the retired `scripts/**` root must not be recreated.
7. E2E specs/helpers are canonical under `tests/e2e/**`; the retired root `e2e/**` must not be recreated.
8. Global source configuration belongs to its responsible owner (`app`, `core`, or `shared`); the retired `src/config/**` compatibility root must not be recreated.

## Global source/config compatibility state

No global source/config compatibility bridge remains active. The historical `src/config/**` root is fully retired.

Canonical owners include:

- launch scope: `src/app/config/launchScope.ts`;
- module registry: `src/app/config/modules.ts`;
- module slugs: `src/shared/config/moduleSlugs.ts`;
- territory configuration: `src/core/routing/config/territory.ts`;
- community launch configuration: `src/core/community/config/communityLaunch.ts`.

`tests/architecture/repository-reorganization-contract.test.ts` ratchets both the absence of `src/config` and the absence of retired imports such as `@/config/territory`.

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

- `src/config/territory.ts` and the final `src/config/**` compatibility root → retired after all source callers migrated to `src/core/routing/config/territory.ts`; the unused `src/shared/components/landing/LandingFooter.tsx` caller was removed rather than introducing `shared → core`; root absence and legacy-import absence are ratcheted by `tests/architecture/repository-reorganization-contract.test.ts`.
- `src/config/launchScope.ts` → retired after all runtime and test callers migrated to `src/app/config/launchScope.ts`; bridge absence and legacy-import absence are ratcheted by `tests/architecture/repository-reorganization-contract.test.ts`, and the community security audit now reads the canonical owner directly.
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

## G2 closure conditions

The compatibility-debt portion of G2 is structurally clear only if all of the following hold on the reviewed SHA:

- `src/features`, `src/test`, `src/__tests__`, and `src/config` are absent;
- `scripts/` is absent and operational tooling is canonical in `tools/**`;
- `e2e/` is absent and E2E specs/helpers are canonical in `tests/e2e/**`;
- no canonical `tools/**` owner depends on a retired `scripts/**` path;
- no source file imports retired global compatibility paths;
- no `src/core/**` implementation depends on `src/modules/**`;
- module → integration runtime exceptions remain explicitly ratcheted and cannot grow;
- workflows/build/deploy guards observe canonical `tools/**` paths;
- architecture ratchets prevent retired bridges/namespaces from being recreated.
