# Compatibility Bridges Registry

Status: CANONICAL — G2 in progress  
Baseline reviewed: `9eadedbdd657c806db4cbc2eab6757f06e2ff25e`  
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
| `scripts/deploy-security-updates.sh` | `tools/release/deploy-security-updates.sh` | manual/docs callers use canonical release helper; legacy shell entrypoint no longer required |
| `scripts/compare-economic-benchmark.mjs` | `tools/release/compare-economic-benchmark.mjs` | economic SSOT/callers use canonical owner directly; legacy entrypoint no longer required |
| `scripts/finalize-economic-benchmark.mjs` | `tools/release/finalize-economic-benchmark.mjs` | economic SSOT/callers use canonical owner directly; legacy entrypoint no longer required |
| `scripts/generate-economic-benchmark-blocker-report.mjs` | `tools/release/generate-economic-benchmark-blocker-report.mjs` | package/callers use canonical owner directly; legacy entrypoint no longer required |
| `scripts/generate-economic-staging-report.mjs` | `tools/release/generate-economic-staging-report.mjs` | economic SSOT uses canonical owner directly; legacy entrypoint no longer required |
| `scripts/run-economic-benchmark-all.mjs` | `tools/release/run-economic-benchmark-all.mjs` | package command points to canonical runner; legacy entrypoint no longer required |
| `scripts/economic-benchmark-ssot.mjs` | `tools/release/economic-benchmark-ssot.mjs` | package/economic benchmark callers use canonical SSOT directly; legacy entrypoint no longer required |
| `scripts/community-staging-load-test.mjs` | `tools/release/community-staging-load-test.mjs` | package/tests/callers use canonical staging harness directly; legacy CLI/module compatibility no longer required |
| `scripts/diagnose-economic-db-connectivity.mjs` | `tools/release/diagnose-economic-db-connectivity.mjs` | package/economic benchmark callers use canonical diagnostic directly; legacy entrypoint no longer required |
| `scripts/security/supabase-edge-admin-canary-deploy.mjs` | `tools/release/supabase-edge-admin-canary-deploy.mjs` | tests/deploy callers use canonical release guard directly; legacy entrypoint no longer required |
| `scripts/validate-e2e-setup.ts` | `tools/release/validate-e2e-setup.ts` | package/manual E2E validation callers use canonical validator directly; legacy entrypoint no longer required |
| `scripts/verify-deploy-ready.mjs` | `tools/release/verify-deploy-ready.mjs` | package/docs/callers point to canonical deploy gate; legacy entrypoint no longer required |
| `scripts/generate-vercel-config.ts` | `tools/security/generate-vercel-config.ts` | package/docs/callers use canonical generator directly; legacy entrypoint no longer required |
| `scripts/sanitize-secrets.ts` | `tools/security/sanitize-secrets.ts` | manual callers/security governance point to canonical sanitizer; legacy entrypoint no longer required |
| `scripts/community-interest-preflight.mjs` | `tools/supabase/community-interest-preflight.mjs` | package/tests use canonical preflight owner directly; legacy CLI/import entrypoint no longer required |
| `scripts/poll-preflight.mjs` | `tools/supabase/poll-preflight.mjs` | package/tests use canonical preflight owner directly; legacy CLI/import entrypoint no longer required |
| `scripts/salvador-preflight.mjs` | `tools/supabase/salvador-preflight.mjs` | package/tests/callers use canonical preflight owner directly; legacy CLI/module compatibility no longer required |
| `scripts/validate-supabase-advisor-residuals.ts` | `tools/supabase/validate-supabase-advisor-residuals.ts` | package/tests/docs use canonical validator directly; legacy CLI/module compatibility no longer required |
| `scripts/validate-supabase-remote-migration-drift.ts` | `tools/supabase/validate-supabase-remote-migration-drift.ts` | package/docs/callers use canonical remote drift gate directly; legacy entrypoint no longer required |
| `scripts/location/municipal-neighborhood-sources.ts` | `tools/seeds/municipal-neighborhood-sources.ts` | all callers/docs use canonical manifest directly; legacy re-export no longer required |
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
| `scripts/validate-session-context.ts` | `tools/architecture/validate-session-context.ts` | package/docs/callers use canonical owner directly; legacy CLI/module compatibility no longer required |
| `scripts/validate-project-taxonomy.ts` | `tools/architecture/validate-project-taxonomy.ts` | package/docs/callers use canonical owner directly; legacy CLI/source-inspection compatibility no longer required |
| `scripts/validate-public-url-ssot.ts` | `tools/architecture/validate-public-url-ssot.ts` | package/docs/callers use canonical owner directly; legacy command no longer required |
| `scripts/validate-upload-ssot.ts` | `tools/architecture/validate-upload-ssot.ts` | package/docs/callers use canonical owner directly; legacy command no longer required |
| `scripts/validate-security-config.ts` | `tools/security/validate-security-config.ts` | package/docs/callers use canonical owner directly; legacy command no longer required |
| `scripts/validate-security-fixes.ts` | `tools/security/validate-security-fixes.ts` | package/docs/callers use canonical owner directly; legacy command no longer required |
| `scripts/security/audit-privileged-rpc-browser-callers.mjs` | `tools/security/audit-privileged-rpc-browser-callers.mjs` | package command uses canonical audit directly; legacy entrypoint no longer required |
| `scripts/security/entity-private-data-exposure-probe.mjs` | `tools/security/entity-private-data-exposure-probe.mjs` | package/docs use canonical probe directly; legacy entrypoint no longer required |
| `scripts/security/classified-messaging-inbox-authz-probe.mjs` | `tools/security/classified-messaging-inbox-authz-probe.mjs` | package command uses canonical read-only probe directly; legacy entrypoint no longer required |
| `scripts/security/profile-pii-exposure-probe.mjs` | `tools/security/profile-pii-exposure-probe.mjs` | package command uses canonical read-only probe directly; legacy entrypoint no longer required |
| `scripts/security/community-feed-anon-probe.mjs` | `tools/security/community-feed-anon-probe.mjs` | package/authorization-map callers use canonical mutating probe directly; legacy entrypoint no longer required |
| `scripts/security/community-feed-authz-probe.mjs` | `tools/security/community-feed-authz-probe.mjs` | package command uses canonical guarded mutating probe directly; legacy entrypoint no longer required |
| `scripts/security/reviews-core-authz-probe.mjs` | `tools/security/reviews-core-authz-probe.mjs` | package command uses canonical guarded mutating probe directly; legacy entrypoint no longer required |
| `scripts/security/trust-operational-authz-probe.mjs` | `tools/security/trust-operational-authz-probe.mjs` | package command uses canonical guarded mutating probe directly; legacy entrypoint no longer required |
| `scripts/security/community-direct-messaging-authz-probe.mjs` | `tools/security/community-direct-messaging-authz-probe.mjs` | package command uses canonical guarded mutating probe directly; legacy entrypoint no longer required |
| `scripts/security/moderation-audit-authz-probe.mjs` | `tools/security/moderation-audit-authz-probe.mjs` | package command uses canonical guarded mutating probe directly; legacy entrypoint no longer required |
| `scripts/security/supabase-auth-hibp.mjs` | `tools/security/supabase-auth-hibp.mjs` | package/tests use canonical security tooling directly; legacy CLI/module compatibility no longer required |
| `scripts/security/csp-contract.ts` | `tools/security/csp-contract.ts` | validator/tests import canonical security contract directly |
| `scripts/security/validate-csp.ts` | `tools/security/validate-csp.ts` | package/docs/callers use canonical owner directly; legacy command no longer required |
| `scripts/security/validate-turnstile-production-config.mjs` | `tools/security/validate-turnstile-production-config.mjs` | package/build callers point to canonical owner directly; legacy command no longer required |
| `scripts/security/account-operational-edge-policy.mjs` | `tools/security/account-operational-edge-policy.mjs` | security validators/tests import canonical policy helper directly |
| `scripts/security/edge-function-auth-config.mjs` | `tools/security/edge-function-auth-config.mjs` | security validators/tests import canonical auth config helper directly |
| `scripts/security/edge-function-auth-policy.mjs` | `tools/security/edge-function-auth-policy.mjs` | security validators/tests import canonical auth policy helper directly |
| `scripts/security/edge-function-broker-boundary.mjs` | `tools/security/edge-function-broker-boundary.mjs` | security validators/tests import canonical boundary helper directly |
| `scripts/security/service-role-boundary.mjs` | `tools/security/service-role-boundary.mjs` | security validators/tests import canonical boundary helper directly |
| `scripts/security/supabase-access-boundary.mjs` | `tools/security/supabase-access-boundary.mjs` | security validators/tests import canonical boundary helper directly |
| `scripts/security/validate-security.mjs` | `tools/security/validate-security.mjs` | package/docs/callers use canonical security orchestrator directly; legacy command no longer required |
| `scripts/security/validate-free-release-governance.mjs` | `tools/security/validate-free-release-governance.mjs` | package/test/remote wrapper import canonical local governance validator directly |
| `scripts/security/validate-free-release-governance-remote.mjs` | `tools/security/validate-free-release-governance-remote.mjs` | package command uses canonical remote read-only gate directly; legacy CLI/import entrypoint no longer required |
| `scripts/security/supabase-postgis-owner-preflight.mjs` | `tools/security/supabase-postgis-owner-preflight.mjs` | package/tests use canonical preflight owner directly; legacy CLI/import entrypoint no longer required |
| `scripts/security/validate-poll-rpc-advisor-mappings.mjs` | `tools/security/validate-poll-rpc-advisor-mappings.mjs` | package/tests import canonical local mappings validator directly |
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
| `scripts/lib/supabase-cli-validation-state.mjs` | `tools/supabase/supabase-cli-validation-state.mjs` | all CLI tooling imports canonical owner directly |
| `scripts/lib/supabase-client.d.mts` | `tools/supabase/supabase-client.d.mts` | no consumer needs legacy declaration resolution |
| `scripts/lib/supabase-client.mjs` | `tools/supabase/supabase-client.mjs` | all runtime tooling imports canonical owner directly |
| `scripts/lib/supabase-client.ts` | `tools/supabase/supabase-client.ts` | all TS tooling imports canonical owner directly |

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
- `scripts/security/supabase-edge-secrets-preflight.mjs` → moved to `tools/security/supabase-edge-secrets-preflight.mjs`; security test updated to canonical path and old path removed.
- `scripts/security/supabase-edge-runtime-auth-drift.mjs` → moved to `tools/security/supabase-edge-runtime-auth-drift.mjs`; security test updated to canonical path and old path removed.
- `scripts/security/supabase-lgpd-edge-rollout-preflight.mjs` → moved to `tools/security/supabase-lgpd-edge-rollout-preflight.mjs`; security test updated to canonical path and old path removed.
- `scripts/security/Import-LocalSupabaseSecrets.ps1` → moved to `tools/security/Import-LocalSupabaseSecrets.ps1`; docs/runtime guidance updated and old path removed.
- `scripts/security/Save-LocalSupabaseSecrets.ps1` → moved to `tools/security/Save-LocalSupabaseSecrets.ps1`; docs updated and old path removed.
- `scripts/geocode-locations.ts` → moved to `tools/seeds/geocode-locations.ts`; package/security policy/docs updated and old path removed.
- `scripts/sync-national-districts-ibge.ts` → moved to `tools/seeds/sync-national-districts-ibge.ts`; package/security policy updated and old path removed.
- `scripts/sync-municipal-neighborhoods.ts` → moved to `tools/seeds/sync-municipal-neighborhoods.ts`; package/security policy/docs updated and old path removed.
- `scripts/seed-e2e-users.ts` → moved to `tools/seeds/seed-e2e-users.ts`; package/workflow/security guards/policy updated and old path removed.
- `scripts/seed-e2e-network.ts` → moved to `tools/seeds/seed-e2e-network.ts`; package/security guards/policy updated and old path removed.
- `scripts/validate-slug-history-final.ts` → moved to `tools/supabase/validate-slug-history-final.ts`; mutation-safety tests/policy updated and old path removed.
- `scripts/validate-reconciliation-final.ts` → moved to `tools/supabase/validate-reconciliation-final.ts`; policy updated and old path removed.
- `scripts/validate-gate3-metadata.mjs` → moved to `tools/supabase/validate-gate3-metadata.mjs`; policy updated and old path removed.
- `scripts/validate-etapa12-remote.ts` → moved to `tools/supabase/validate-etapa12-remote.ts`; policy updated and old path removed.
- `scripts/validate-implementation.ts` → moved to `tools/supabase/validate-implementation.ts`; canonical read-only validator now imports `tools/supabase/supabase-client.ts` directly and old path removed.
- `scripts/validate-business-district-required.ts` → moved to `tools/supabase/validate-business-district-required.ts`; canonical read-only validator now imports `tools/supabase/supabase-client.ts` directly and old path removed.
- `scripts/lib/supabase-cli-runner.mjs` → tests/tooling migrated to `tools/supabase/supabase-cli-runner.mjs`; old bridge removed.
- `scripts/lib/supabase-migration-list-parser.mjs` → migration tooling/test migrated to `tools/migrations/supabase-migration-list-parser.mjs`; old bridge removed.

## G2 closure condition for bridges

G2 is not complete merely because the canonical owners exist. Before G2 closure:

- every compatibility path must either be removed or remain explicitly justified here;
- no canonical owner may depend back on a legacy path;
- no bridge may contain independent implementation;
- bridge chains should be collapsed to point directly to the final canonical owner;
- remaining bridge count must be treated as tracked migration debt, not accepted architecture.
