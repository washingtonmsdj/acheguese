# Compatibility Bridges Registry

Status: CANONICAL — G2 in progress  
Baseline reviewed: `34e845a228e026133ac1ab369a23f1f4ea56917a`  
Plan authority: `/URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`

## Purpose

This registry makes temporary compatibility paths explicit during G2 physical reorganization.

Rules:

1. Every bridge is legacy → canonical owner only.
2. A canonical owner must never import a legacy bridge.
3. No bridge may contain independent business/persistence logic.
4. Removing a bridge requires proving its legacy path has no remaining callers/references that require compatibility.
5. A removed bridge must also be removed from this registry.
6. A new bridge must be added here in the same cut that introduces it; bridges are debt, not a permanent architecture surface.
7. `tools/**` must not depend on `scripts/**`.

## Global source/config bridges

| Legacy path | Canonical owner | Removal gate |
| --- | --- | --- |
| `src/config/communityLaunch.ts` | `src/core/community/config/communityLaunch.ts` | all callers import canonical owner directly |
| `src/config/launchScope.ts` | `src/app/config/launchScope.ts` | all callers import canonical owner directly |
| `src/config/moduleSlugs.ts` | `src/shared/config/moduleSlugs.ts` | all callers import canonical owner directly |
| `src/config/modules.ts` | `src/app/config/modules.ts` | all callers import canonical owner directly |
| `src/config/territory.ts` | `src/app/config/territory.ts` | all callers import canonical owner directly; then retire the app bridge in a separate guarded cut |
| `src/app/config/territory.ts` | `src/core/routing/config/territory.ts` | all app callers import canonical owner directly |
| `src/app/config/moduleSlugs.ts` | `src/shared/config/moduleSlugs.ts` | all app callers import canonical owner directly |

## Global test compatibility

| Legacy path | Canonical owner | Removal gate |
| --- | --- | --- |
| `e2e/helpers/auth.ts` | `tests/e2e/helpers/auth.ts` | all E2E specs use `tests/e2e/helpers/auth.ts` directly |

## Tooling bridges — scripts → tools

| Legacy path | Canonical owner | Removal gate |
| --- | --- | --- |
| `scripts/backup-storage.ts` | `tools/maintenance/backup-storage.ts` | docs/policies/callers migrated to canonical path |
| `scripts/restore-storage.ts` | `tools/maintenance/restore-storage.ts` | docs/policies/callers migrated to canonical path |
| `scripts/build-fast.mjs` | `tools/release/build-fast.mjs` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/run-vercel-production-build.mjs` | `tools/release/run-vercel-production-build.mjs` | Vercel/build callers point to canonical path; legacy production entrypoint no longer required |
| `scripts/validate-production-sitemap.mjs` | `tools/release/validate-production-sitemap.mjs` | release/build callers point to canonical path; legacy command no longer required |
| `scripts/generate-sitemap.ts` | `tools/release/generate-sitemap.ts` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-vercel-build-inputs.mjs` | `tools/release/validate-vercel-build-inputs.mjs` | package/build callers point to canonical path; legacy command no longer required |
| `scripts/ci/run-preview-e2e.ps1` | `tools/release/run-preview-e2e.ps1` | workflow/callers point to canonical path; legacy PowerShell entrypoint no longer required |
| `scripts/devops/push-to-github.ps1` | `tools/release/push-to-github.ps1` | manual callers use canonical path; legacy helper entrypoint no longer required |
| `scripts/generate-service-template.ts` | `tools/architecture/generate-service-template.ts` | public npm command and docs point to canonical path |
| `scripts/generate-migration-template.ts` | `tools/migrations/generate-migration-template.ts` | public npm command and docs point to canonical path |
| `scripts/generate-supabase-types.ts` | `tools/supabase/generate-supabase-types.ts` | public npm command and callers point to canonical path |
| `scripts/generate-hardening-architecture-report.ts` | `tools/architecture/generate-hardening-architecture-report.ts` | npm/docs/callers point to canonical path; legacy command no longer required |
| `scripts/generate-architecture-audit.ts` | `tools/architecture/generate-architecture-audit.ts` | npm/docs/callers point to canonical path; legacy command no longer required |
| `scripts/generate-violations-report.ts` | `tools/architecture/generate-violations-report.ts` | callers point to canonical report owner; legacy entrypoint no longer required |
| `scripts/diagnose-typecheck.mjs` | `tools/architecture/diagnose-typecheck.mjs` | package/docs/callers point to canonical path; legacy diagnostic entrypoint no longer required |
| `scripts/validate-maps-architecture.mjs` | `tools/architecture/validate-maps-architecture.mjs` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/core-platform/access-analyzer.mjs` | `tools/architecture/core-platform/access-analyzer.mjs` | validator/tests/callers use canonical owner directly; legacy module compatibility no longer required |
| `scripts/validate-core-platform-ownership.mjs` | `tools/architecture/validate-core-platform-ownership.mjs` | package/tests/callers use canonical owner directly; legacy CLI/module compatibility no longer required |
| `scripts/validate-critical-file-sizes.ts` | `tools/architecture/validate-critical-file-sizes.ts` | npm/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-architecture-governance.ts` | `tools/architecture/validate-architecture-governance.ts` | npm/docs/callers point to canonical path; legacy CLI/module compatibility no longer required |
| `scripts/validate-architecture-phase1.mjs` | `tools/architecture/validate-architecture-phase1.mjs` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-architecture-boundaries-incremental.mjs` | `tools/architecture/validate-architecture-boundaries-incremental.mjs` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-dependencies.ts` | `tools/architecture/validate-dependencies.ts` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/check-ssot-compliance.ts` | `tools/architecture/check-ssot-compliance.ts` | Husky/package/docs point to canonical path; legacy checker entrypoint no longer required |
| `scripts/validate-ssot-compliance.ts` | `tools/architecture/validate-ssot-compliance.ts` | package/callers point to canonical path; legacy CLI/module compatibility no longer required |
| `scripts/validate-ssot-hardcodes.ts` | `tools/architecture/validate-ssot-hardcodes.ts` | package/docs/callers point to canonical path; legacy CLI/module compatibility no longer required |
| `scripts/validate-business-module-boundaries.ts` | `tools/architecture/validate-business-module-boundaries.ts` | workflows/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-education-module-boundaries.ts` | `tools/architecture/validate-education-module-boundaries.ts` | workflows/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-gastronomy-module-boundaries.ts` | `tools/architecture/validate-gastronomy-module-boundaries.ts` | workflows/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-delivery-architecture-boundaries.ts` | `tools/architecture/validate-delivery-architecture-boundaries.ts` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-community-transversal-boundaries.ts` | `tools/architecture/validate-community-transversal-boundaries.ts` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-communication-territorial-boundaries.ts` | `tools/architecture/validate-communication-territorial-boundaries.ts` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-docs-structure.ts` | `tools/architecture/validate-docs-structure.ts` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-doc-live-links.ts` | `tools/architecture/validate-doc-live-links.ts` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/lib/architecture-registry.ts` | `tools/architecture/architecture-registry.ts` | architecture validators/readers use canonical owner directly |
| `scripts/lib/migration-statement-fingerprint.mjs` | `tools/migrations/migration-statement-fingerprint.mjs` | all migration tooling imports canonical owner directly |
| `scripts/lib/remote-mutation-safety.mjs` | `tools/supabase/remote-mutation-safety.mjs` | all runtime tooling imports canonical owner directly |
| `scripts/lib/remote-mutation-safety.ts` | `tools/supabase/remote-mutation-safety.ts` | all TS tooling imports canonical owner directly |
| `scripts/lib/supabase-cli-json.mjs` | `tools/supabase/supabase-cli-json.mjs` | all CLI tooling imports canonical owner directly |
| `scripts/lib/supabase-cli-query-json.mjs` | `tools/supabase/supabase-cli-query-json.mjs` | all CLI tooling imports canonical owner directly |
| `scripts/lib/supabase-cli-runner.mjs` | `tools/supabase/supabase-cli-runner.mjs` | all CLI tooling/tests import canonical owner directly |
| `scripts/lib/supabase-cli-validation-state.mjs` | `tools/supabase/supabase-cli-validation-state.mjs` | all CLI tooling imports canonical owner directly |
| `scripts/lib/supabase-client.d.mts` | `tools/supabase/supabase-client.d.mts` | no consumer needs legacy declaration resolution |
| `scripts/lib/supabase-client.mjs` | `tools/supabase/supabase-client.mjs` | all runtime tooling imports canonical owner directly |
| `scripts/lib/supabase-client.ts` | `tools/supabase/supabase-client.ts` | all TS tooling imports canonical owner directly |
| `scripts/lib/supabase-migration-list-parser.mjs` | `tools/migrations/supabase-migration-list-parser.mjs` | all migration tooling/tests import canonical owner directly |

## Business public module-local bridges

These bridges are explicitly required by the Business boundary guard and expose canonical core-owned public snapshot contracts.

| Legacy path | Canonical owner |
| --- | --- |
| `src/modules/business/public/types/publicSnapshots.ts` | `src/core/business/types/publicSnapshots` |
| `src/modules/business/public/services/PublicSnapshotRpcService.ts` | `src/core/business/services/PublicSnapshotRpcService` |

Removal gate for both Business public bridges: zero legacy-path callers plus Business boundary/regression tests passing on the same SHA.

## Education module-local bridges

All Education persistence/contracts are owned by `src/core/education`.

| Legacy path | Canonical owner |
| --- | --- |
| `src/modules/business/education/types/index.ts` | `src/core/education/contracts` |
| `src/modules/business/education/services/education.queries.ts` | `src/core/education/services/education.queries` |
| `src/modules/business/education/services/education.mutations.ts` | `src/core/education/services/education.mutations` |
| `src/modules/business/education/constants/schoolStageOptions.ts` | `src/core/education/constants/schoolStageOptions` |
| `src/modules/business/education/services/EducationTrackingService.ts` | `src/core/education/services/EducationTrackingService` |
| `src/modules/business/education/services/EducationObservabilityService.ts` | `src/core/education/services/EducationObservabilityService` |

Removal gate for every Education bridge: zero legacy-path callers plus Education boundary/regression tests passing on the same SHA.

## Gastronomy module-local bridges

All persistence/domain ownership below is canonical in `src/core/business`. The complete set includes every bridge enforced by `validate-gastronomy-module-boundaries.ts`, not only files discoverable by comment-text search.

| Legacy path | Canonical owner |
| --- | --- |
| `src/modules/business/gastronomy/types/gastronomy/index.ts` | `src/core/business/types/gastronomy` |
| `src/modules/business/gastronomy/types/menu.ts` | `src/core/business/types/gastronomyMenu` |
| `src/modules/business/gastronomy/services/gastronomy.queries.ts` | `src/core/business/services/gastronomy.queries` |
| `src/modules/business/gastronomy/services/menu.queries.ts` | `src/core/business/services/menu.queries` |
| `src/modules/business/gastronomy/services/review.queries.ts` | `src/core/business/services/gastronomy.review.queries` |
| `src/modules/business/gastronomy/services/favorites.queries.ts` | `src/core/business/services/gastronomy.favorites.queries` |
| `src/modules/business/gastronomy/services/DeliveryAreaService.ts` | `src/core/business/services/GastronomyDeliveryAreaService` |
| `src/modules/business/gastronomy/services/resolveGastronomyBusinessId.ts` | `src/core/business/services/resolveGastronomyBusinessId` |
| `src/modules/business/gastronomy/services/gastronomy-runtime.queries.ts` | `src/core/business/services/gastronomy-runtime.queries` |
| `src/modules/business/gastronomy/services/activity.queries.ts` | `src/core/business/services/gastronomy.activity.queries` |
| `src/modules/business/gastronomy/services/GastronomyProfileService.ts` | `src/core/business/services/GastronomyProfileService` |
| `src/modules/business/gastronomy/services/MenuService.ts` | `src/core/business/services/MenuService` |
| `src/modules/business/gastronomy/niches/types.ts` | `src/core/business/niches/types` |
| `src/modules/business/gastronomy/niches/versioning/types.ts` | `src/core/business/niches/versioning/types` |
| `src/modules/business/gastronomy/niches/versioning/NicheVersioningService.ts` | `src/core/business/niches/versioning/NicheVersioningService` |
| `src/modules/business/gastronomy/niches/pizzaria/types.ts` | `src/core/business/niches/pizzaria/types` |
| `src/modules/business/gastronomy/niches/pizzaria/PizzaAdminService.ts` | `src/core/business/niches/pizzaria/PizzaAdminService` |

Removal gate for every Gastronomy bridge: zero legacy-path callers plus Gastronomy/Business boundary and regression tests passing on the same SHA.

## Community Events module-local bridge

| Legacy path | Canonical owner | Removal gate |
| --- | --- | --- |
| `src/modules/community-events/services/EventEngagementService.ts` | `src/core/community-events/services/EventEngagementService` | zero legacy-path callers plus Community Events regression tests |

## Already retired during this G2 execution

These paths were not kept as bridges because no compatibility caller required them at the cut:

- `scripts/community-staging-load-test.spec.ts` → moved to `tests/scripts/community-staging-load-test.spec.ts` and old path removed.
- `scripts/backup-config.ts` → moved to `tools/maintenance/backup-config.ts` and old path removed.

## G2 closure condition for bridges

G2 is not complete merely because the canonical owners exist. Before G2 closure:

- every compatibility path must either be removed or remain explicitly justified here;
- no canonical owner may depend back on a legacy path;
- no bridge may contain independent implementation;
- bridge chains should be collapsed to point directly to the final canonical owner;
- remaining bridge count must be treated as tracked migration debt, not accepted architecture.
