# Compatibility Bridges Registry

Status: CANONICAL — G2 in progress  
Baseline reviewed: `3755ac6828db6e8a286188d92a748feb2cb14837`  
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
| `scripts/security/supabase-edge-admin-canary-deploy.mjs` | `tools/release/supabase-edge-admin-canary-deploy.mjs` | tests/deploy callers use canonical release guard directly; legacy entrypoint no longer required |
| `scripts/verify-deploy-ready.mjs` | `tools/release/verify-deploy-ready.mjs` | package/docs/callers point to canonical deploy gate; legacy entrypoint no longer required |
| `scripts/validate-supabase-advisor-residuals.ts` | `tools/supabase/validate-supabase-advisor-residuals.ts` | package/tests/docs use canonical validator directly; legacy CLI/module compatibility no longer required |
| `scripts/validate-supabase-remote-migration-drift.ts` | `tools/supabase/validate-supabase-remote-migration-drift.ts` | package/docs/callers use canonical remote drift gate directly; legacy entrypoint no longer required |
| `scripts/location/municipal-neighborhood-sources.ts` | `tools/seeds/municipal-neighborhood-sources.ts` | all callers/docs use canonical manifest directly; legacy re-export no longer required |
| `scripts/validate-project-taxonomy.ts` | `tools/architecture/validate-project-taxonomy.ts` | package/docs/callers use canonical owner directly; legacy CLI/source-inspection compatibility no longer required |
| `scripts/security/entity-private-data-exposure-probe.mjs` | `tools/security/entity-private-data-exposure-probe.mjs` | package/docs use canonical probe directly; legacy entrypoint no longer required |
| `scripts/security/community-feed-anon-probe.mjs` | `tools/security/community-feed-anon-probe.mjs` | package/authorization-map callers use canonical mutating probe directly; legacy entrypoint no longer required |
| `scripts/security/reviews-core-authz-probe.mjs` | `tools/security/reviews-core-authz-probe.mjs` | package command uses canonical guarded mutating probe directly; legacy entrypoint no longer required |
| `scripts/security/community-direct-messaging-authz-probe.mjs` | `tools/security/community-direct-messaging-authz-probe.mjs` | package command uses canonical guarded mutating probe directly; legacy entrypoint no longer required |
| `scripts/security/moderation-audit-authz-probe.mjs` | `tools/security/moderation-audit-authz-probe.mjs` | package command uses canonical guarded mutating probe directly; legacy entrypoint no longer required |
| `scripts/security/supabase-auth-hibp.mjs` | `tools/security/supabase-auth-hibp.mjs` | package/tests use canonical security tooling directly; legacy CLI/module compatibility no longer required |
| `scripts/security/edge-function-auth-config.mjs` | `tools/security/edge-function-auth-config.mjs` | security validators/tests import canonical auth config helper directly |
| `scripts/security/edge-function-auth-policy.mjs` | `tools/security/edge-function-auth-policy.mjs` | security validators/tests import canonical auth policy helper directly |
| `scripts/security/edge-function-broker-boundary.mjs` | `tools/security/edge-function-broker-boundary.mjs` | security validators/tests import canonical boundary helper directly |
| `scripts/security/service-role-boundary.mjs` | `tools/security/service-role-boundary.mjs` | security validators/tests import canonical boundary helper directly |
| `scripts/security/supabase-access-boundary.mjs` | `tools/security/supabase-access-boundary.mjs` | security validators/tests import canonical boundary helper directly |
| `scripts/security/validate-security.mjs` | `tools/security/validate-security.mjs` | package/docs/callers use canonical security orchestrator directly; legacy command no longer required |
| `scripts/security/supabase-postgis-owner-preflight.mjs` | `tools/security/supabase-postgis-owner-preflight.mjs` | package/tests use canonical preflight owner directly; legacy CLI/import entrypoint no longer required |
| `scripts/validate-architecture-governance.ts` | `tools/architecture/validate-architecture-governance.ts` | npm/docs/callers point to canonical path; legacy CLI/module compatibility no longer required |
| `scripts/validate-architecture-boundaries-incremental.mjs` | `tools/architecture/validate-architecture-boundaries-incremental.mjs` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/validate-community-transversal-boundaries.ts` | `tools/architecture/validate-community-transversal-boundaries.ts` | package/docs/callers point to canonical path; legacy command no longer required |
| `scripts/lib/supabase-client.ts` | `tools/supabase/supabase-client.ts` | `scripts/media-assets-cp016-backfill.ts` must be moved or retargeted to the canonical client without weakening its existing project/apply confirmation guards |

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
- `scripts/lib/migration-statement-fingerprint.mjs` → provenance tooling/test migrated to `tools/migrations/migration-statement-fingerprint.mjs`; old bridge removed.
- `scripts/lib/remote-mutation-safety.mjs` → runtime tooling already used `tools/supabase/remote-mutation-safety.mjs`; old bridge removed.
- `scripts/lib/remote-mutation-safety.ts` → typed tooling already used `tools/supabase/remote-mutation-safety.ts`; old bridge removed.
- `scripts/lib/supabase-cli-json.mjs` → CLI parsing consumers already used `tools/supabase/supabase-cli-json.mjs`; old bridge removed.
- `scripts/lib/supabase-cli-query-json.mjs` → query parsing consumers already used `tools/supabase/supabase-cli-query-json.mjs`; old bridge removed.
- `scripts/lib/supabase-cli-validation-state.mjs` → validation-state consumers already used `tools/supabase/supabase-cli-validation-state.mjs`; old bridge removed.
- `scripts/lib/architecture-registry.ts` → architecture validator already targets `tools/architecture/architecture-registry.ts`; old bridge removed.
- `scripts/lib/supabase-client.mjs` → mutating `.mjs` validators now import `tools/supabase/supabase-client.mjs` directly; old runtime bridge removed.
- `scripts/lib/supabase-client.d.mts` → no remaining consumer required legacy declaration resolution after the runtime bridge retirement; old declaration bridge removed.
- `scripts/sanitize-secrets.ts` → security tooling and policy references use `tools/security/sanitize-secrets.ts`; old bridge removed.
- `scripts/ci/run-preview-e2e.ps1` → workflow/callers already use `tools/release/run-preview-e2e.ps1`; old PowerShell bridge removed.
- `scripts/devops/push-to-github.ps1` → manual release helper is canonical at `tools/release/push-to-github.ps1`; old bridge removed.
- `scripts/deploy-security-updates.sh` → security deploy helper is canonical at `tools/release/deploy-security-updates.sh`; old bridge removed.
- `scripts/generate-violations-report.ts` → architecture callers use `tools/architecture/generate-violations-report.ts`; old bridge removed.
- `scripts/compare-economic-benchmark.mjs` → economic tooling uses `tools/release/compare-economic-benchmark.mjs`; old bridge removed.
- `scripts/finalize-economic-benchmark.mjs` → economic tooling uses `tools/release/finalize-economic-benchmark.mjs`; old bridge removed.
- `scripts/generate-economic-staging-report.mjs` → economic tooling uses `tools/release/generate-economic-staging-report.mjs`; old bridge removed.
- `scripts/core-platform/access-analyzer.mjs` → architecture tests and ownership fixtures now use `tools/architecture/core-platform/access-analyzer.mjs`; old bridge removed.
- `scripts/security/csp-contract.ts` → Turnstile CSP contract test and validator use `tools/security/csp-contract.ts`; old bridge removed.
- `scripts/security/account-operational-edge-policy.mjs` → account operational Edge policy test imports `tools/security/account-operational-edge-policy.mjs` directly; old bridge removed.
- `scripts/build-fast.mjs` → npm `build:fast` now calls `tools/release/build-fast.mjs` directly; historical typecheck docs remain archival only; old bridge removed.
- `scripts/security/validate-csp.ts` → npm `validate:csp` now calls `tools/security/validate-csp.ts` directly; old bridge removed.
- `scripts/security/validate-turnstile-production-config.mjs` → npm `validate:turnstile:production` now calls the canonical security validator directly; old bridge removed.
- `scripts/validate-vercel-build-inputs.mjs` → npm `validate:vercel:inputs` now calls `tools/release/validate-vercel-build-inputs.mjs` directly; old bridge removed.
- `scripts/validate-maps-architecture.mjs` → npm `validate:maps` and the Maps fixture README now use `tools/architecture/validate-maps-architecture.mjs`; old bridge removed.
- `scripts/diagnose-typecheck.mjs` → npm `typecheck:diagnose` now calls `tools/architecture/diagnose-typecheck.mjs` directly; remaining references are archived typecheck documentation; old bridge removed.
- `scripts/validate-critical-file-sizes.ts` → npm `validate:architecture:file-sizes` now calls `tools/architecture/validate-critical-file-sizes.ts` directly; remaining reference is archived architecture history; old bridge removed.
- `scripts/validate-security-fixes.ts` → npm `security:scan` now calls `tools/security/validate-security-fixes.ts` directly; old bridge removed.
- `scripts/validate-security-config.ts` → npm `security:config:validate` now calls `tools/security/validate-security-config.ts` directly; old bridge removed.
- `scripts/generate-hardening-architecture-report.ts` → npm `report:architecture:hardening` now calls `tools/architecture/generate-hardening-architecture-report.ts` directly; old bridge removed.
- `scripts/generate-architecture-audit.ts` → npm `audit:architecture` now calls `tools/architecture/generate-architecture-audit.ts` directly; old bridge removed.
- `scripts/validate-architecture-phase1.mjs` → npm `validate:architecture:phase1` now calls `tools/architecture/validate-architecture-phase1.mjs` directly; old bridge removed.
- `scripts/generate-service-template.ts` → npm `generate:service` now calls `tools/architecture/generate-service-template.ts` directly; archived docs keep historical commands only; old bridge removed.
- `scripts/generate-migration-template.ts` → npm `generate:migration` now calls `tools/migrations/generate-migration-template.ts` directly; archived docs keep historical commands only; old bridge removed.
- `scripts/generate-supabase-types.ts` → npm `generate:types` now calls `tools/supabase/generate-supabase-types.ts` directly; old bridge removed.
- `scripts/validate-dependencies.ts` → npm `validate:deps` now calls `tools/architecture/validate-dependencies.ts` directly; remaining reference is archived audit history; old bridge removed.
- `scripts/validate-ssot-hardcodes.ts` → npm `validate:hardcodes` now calls the canonical validator, whose owner preserves direct-execution behavior; remaining references are archived audits; old bridge removed.
- `scripts/validate-public-url-ssot.ts` → npm `validate:url:ssot` now calls `tools/architecture/validate-public-url-ssot.ts` directly; old bridge removed.
- `scripts/validate-upload-ssot.ts` → npm `validate:upload:ssot` now calls `tools/architecture/validate-upload-ssot.ts` directly; old bridge removed.
- `scripts/validate-ssot-compliance.ts` → npm SSOT commands now call `tools/architecture/validate-ssot-compliance.ts` directly; canonical owner preserves direct-execution behavior; old bridge removed.
- `scripts/security/validate-free-release-governance.mjs` → package/test callers use `tools/security/validate-free-release-governance.mjs` directly; old bridge removed.
- `scripts/security/validate-free-release-governance-remote.mjs` → npm remote governance gate now calls `tools/security/validate-free-release-governance-remote.mjs` directly; old bridge removed.
- `scripts/validate-e2e-setup.ts` → npm `validate:e2e` uses `tools/release/validate-e2e-setup.ts` directly; old bridge removed.
- `scripts/generate-vercel-config.ts` → npm Vercel config generators use `tools/security/generate-vercel-config.ts` directly; old bridge removed.
- `scripts/diagnose-economic-db-connectivity.mjs` → npm economic DB diagnostic calls `tools/release/diagnose-economic-db-connectivity.mjs` directly; old bridge removed.
- `scripts/generate-economic-benchmark-blocker-report.mjs` → npm blocker-report command uses `tools/release/generate-economic-benchmark-blocker-report.mjs` directly; old bridge removed.
- `scripts/run-economic-benchmark-all.mjs` → npm economic run-all command uses `tools/release/run-economic-benchmark-all.mjs` directly; old bridge removed.
- `scripts/security/audit-privileged-rpc-browser-callers.mjs` → npm security audit uses `tools/security/audit-privileged-rpc-browser-callers.mjs` directly; old bridge removed.
- `scripts/security/profile-pii-exposure-probe.mjs` → npm profile PII probe uses `tools/security/profile-pii-exposure-probe.mjs` directly; old bridge removed.
- `scripts/security/classified-messaging-inbox-authz-probe.mjs` → npm classified messaging probe uses the canonical security tool directly; old bridge removed.
- `scripts/security/community-feed-authz-probe.mjs` → npm community authz probe uses the canonical security tool directly; old bridge removed.
- `scripts/security/trust-operational-authz-probe.mjs` → npm trust probe uses the canonical security tool directly; old bridge removed.
- `scripts/validate-delivery-architecture-boundaries.ts` → npm delivery architecture validation calls the canonical tool directly; old bridge removed.
- `scripts/validate-communication-territorial-boundaries.ts` → npm communication architecture validation calls the canonical tool directly; old bridge removed.
- `scripts/run-vercel-production-build.mjs` → `vercel.json` now invokes `tools/release/run-vercel-production-build.mjs` directly; old bridge removed.
- `scripts/validate-production-sitemap.mjs` → production build tooling already uses `tools/release/validate-production-sitemap.mjs`; old bridge removed.
- `scripts/validate-migration-provenance.mjs` → npm migration provenance gate calls `tools/migrations/validate-migration-provenance.mjs` directly; old bridge removed.
- `scripts/validate-core-platform-ownership.mjs` → npm and the validator regression test now use `tools/architecture/validate-core-platform-ownership.mjs`; legacy fixture reference was decoupled; old bridge removed.
- `scripts/community-staging-load-test.mjs` → load-harness unit/security callers now use `tools/release/community-staging-load-test.mjs`; old bridge removed.
- `scripts/community-interest-preflight.mjs` → npm and unit tests now use `tools/supabase/community-interest-preflight.mjs`; old bridge removed.
- `scripts/poll-preflight.mjs` → npm and unit tests now use `tools/supabase/poll-preflight.mjs`; old bridge removed.
- `scripts/salvador-preflight.mjs` → npm Salvador preflight commands call `tools/supabase/salvador-preflight.mjs` directly; canonical owner preserves CLI execution; old bridge removed.
- `scripts/restore-storage.ts` → no live caller required the maintenance compatibility entrypoint; canonical owner remains `tools/maintenance/restore-storage.ts`.
- `scripts/validate-business-module-boundaries.ts` → Business docs and npm callers use `tools/architecture/validate-business-module-boundaries.ts`; old bridge removed.
- `scripts/validate-gastronomy-module-boundaries.ts` → Gastronomy docs/workflow use `tools/architecture/validate-gastronomy-module-boundaries.ts`; old bridge removed.
- `src/modules/community-events/services/EventEngagementService.ts` → zero runtime callers; architecture regression tests now require the bridge to remain absent and the canonical owner stays in `src/core/community-events/services/EventEngagementService.ts`.
- `src/modules/business/public/services/PublicSnapshotRpcService.ts` → callers/tests now use `src/core/business/services/PublicSnapshotRpcService.ts`; Business boundary ratchet blocks bridge recreation.
- `src/modules/business/public/types/publicSnapshots.ts` → runtime callers now import `src/core/business/types/publicSnapshots.ts`; Business boundary ratchet blocks bridge recreation.
- `scripts/validate-education-module-boundaries.ts` → workflow/docs use `tools/architecture/validate-education-module-boundaries.ts`; old bridge removed.
- `src/modules/business/education/types/index.ts` → zero runtime callers; contracts remain canonical at `src/core/education/contracts.ts`; Education ratchet blocks bridge recreation.
- `src/modules/business/education/services/education.queries.ts` → zero runtime callers; read model remains canonical at `src/core/education/services/education.queries.ts`; Education ratchet blocks bridge recreation.
- `src/modules/business/education/services/education.mutations.ts` → zero runtime callers; write model remains canonical at `src/core/education/services/education.mutations.ts`; Education ratchet blocks bridge recreation.
- `src/modules/business/education/constants/schoolStageOptions.ts` → zero runtime callers; shared domain options remain canonical at `src/core/education/constants/schoolStageOptions.ts`; Education ratchet blocks bridge recreation.
- `src/modules/business/education/services/EducationTrackingService.ts` → zero runtime callers; tracking remains canonical at `src/core/education/services/EducationTrackingService.ts`; Education ratchet blocks bridge recreation.
- `src/modules/business/education/services/EducationObservabilityService.ts` → zero runtime callers; observability remains canonical at `src/core/education/services/EducationObservabilityService.ts`; Education ratchet blocks bridge recreation.
- `scripts/validate-session-context.ts` → no live runtime caller remained; historical session-context specs preserve the old path only as history; canonical owner remains `tools/architecture/validate-session-context.ts`.
- `scripts/security/validate-poll-rpc-advisor-mappings.mjs` → Poll security test now imports `tools/security/validate-poll-rpc-advisor-mappings.mjs` directly; old bridge removed.
- `scripts/generate-sitemap.ts` → current decision documentation and npm tooling use `tools/release/generate-sitemap.ts`; old bridge removed.
- `scripts/validate-docs-structure.ts` → current decision documentation uses `tools/architecture/validate-docs-structure.ts`; old bridge removed.
- `scripts/validate-doc-live-links.ts` → canonical owner remains `tools/architecture/validate-doc-live-links.ts`; the only non-registry legacy reference is in a document explicitly marked substituted/historical.
- `scripts/check-ssot-compliance.ts` → Husky and current SSOT documentation now call `tools/architecture/check-ssot-compliance.ts`; old bridge removed.
- `scripts/economic-benchmark-ssot.mjs` → current SSOT documentation and package benchmark commands use `tools/release/economic-benchmark-ssot.mjs`; remaining old-path mentions are historical fingerprints/fixtures only.

## G2 closure condition for bridges

G2 is not complete merely because the canonical owners exist. Before G2 closure:

- every compatibility path must either be removed or remain explicitly justified here;
- no canonical owner may depend back on a legacy path;
- no bridge may contain independent implementation;
- bridge chains should be collapsed to point directly to the final canonical owner;
- remaining bridge count must be treated as tracked migration debt, not accepted architecture.
