# G5 closure / G6 continuation — 2026-09-04

## Authority

This checkpoint is a delta to `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`; it does not replace the permanent root plan.

- execution branch: `main` only;
- checkpoint source HEAD before this document: `d1671fd47e5aef51cdad76dc658fca1fa3abe7f2`;
- canonical Supabase project: `xhdowzacfujckjelqhtd`;
- current phase: **G6 — Module Certification / Empresas base**.

The root plan header was reconciled on 2026-09-04 to `G6 Certificação de módulos / Empresas base`. This checkpoint remains the detailed transition evidence and must be used with current `main` and the closed blocker issues.

## G5 closure state

The historical G5 operational blockers are no longer active:

- **B0 / Issue #86 — CLOSED:** React Router was upgraded to the approved v7 line with canonical lock lifecycle and hosted evidence recorded in the issue.
- **B1 / Issue #87 — CLOSED:** the canonical Supabase generated snapshot was materialized from the official generator; later source drift exposed by that snapshot was corrected rather than patching generated types manually.
- **B2 / Issue #88 — CLOSED:** `classified-images` is absent from the live Storage catalog while `classified_images` remains distinct. The historical deletion-mechanism log is not retained, so do not invent provenance beyond the postcondition evidence already recorded.
- **B3 / Issue #89 — CLOSED:** hosted runners have repeatedly executed real jobs. Intermittent pre-step allocation failures can still occur and must be classified as infrastructure when `steps = null`, not as source regressions.

A live migration provenance drift discovered on 2026-09-04 was reconciled by `d6b01fd5b6039cfbc1ce8fb9d1089b663041e554`, restoring `20260904062734_reconcile_driver_locations_gps_columns_provenance.sql` to source. The remote migration ledger contains that version.

Decision: **do not restart the global G5 inventory/audit campaign.** New source↔DB drift discovered by current generated types or live evidence should be fixed as a focused regression, but G6 is the active execution phase.

## G6 Business work already completed

Do not repeat the completed Business slices #90–#98. They include create-flow fail-closed behavior, slug preflight ordering, rename synchronization, removal of legacy Admin CRUD/edit surfaces, read-only plan authority, and replacement of the active overview dashboard placeholders with real Business/Analytics metrics.

Additional G6 consolidation on 2026-09-04:

### `435da7f8ee670d7246620ac24a29502405f25569`

`refactor(g6): retire duplicate business dashboard`

- removed `src/modules/business/components/EmpresaDashboardTab.tsx`;
- removed the dead `tabs/DashboardTab.tsx` wrapper and `DashboardTabProps`;
- preserved the routed owner `src/core/business/components/EmpresaDashboardTab.tsx`;
- added `tests/architecture/business-dashboard-owner.test.ts` to prevent recreation of the competing implementation.

### `1f39f45fbae2f0fb91a6b9a38ef6d5ad8f1ed3fc`

`fix(g6): promote real business analytics dashboard`

- replaced the active core placeholder `Analytics em breve` with the existing real analytics implementation;
- metrics are sourced through `getBusinessAnalyticsSummary` and the Business Analytics SSOT;
- removed `src/modules/business/components/AnalyticsDashboard.tsx` after caller census showed no external caller;
- added `tests/architecture/business-analytics-dashboard-owner.test.ts`.

### `755d8fcdbdb7b5a6688204ab7fd1b5c0a8a70a7d`

`fix(g6): clarify canonical business coupon boundary`

- replaced the active generic `Gerenciador de cupons em breve` placeholder with the fail-closed domain explanation already present in the retired module copy;
- no `business_id`, RPC, writer, RLS exception or migration was invented;
- the UI explicitly refuses per-business coupon CRUD until the canonical coupon model has a business identity;
- removed the module duplicate and added `tests/architecture/business-coupon-manager-owner.test.ts`.

### `d1671fd47e5aef51cdad76dc658fca1fa3abe7f2`

`fix(g6): promote billing-backed business plans`

- replaced the active `Planos de assinatura em breve` placeholder with the Billing-backed plan catalog implementation;
- the component consumes `useBillingPlans`, so price/features/featured state remain owned by Billing rather than Business UI constants;
- removed the module duplicate and added `tests/architecture/business-subscription-plans-owner.test.ts`.

### `db1cc3e6ce2250b55584b8917fff5992ddd18295`

`refactor(g6): retire business network bridge`

- removed the unused `src/modules/business/components/NetworkTab.tsx` compatibility bridge;
- the active dashboard already imports `NetworkTab` from the canonical `@/core/business` barrel;
- removed the legacy module-barrel export;
- added `tests/architecture/business-network-owner.test.ts` to prevent recreation of the bridge.

### `73fb8142839fc624ed560a8365dbbda3bfbf369a`

`refactor(g6): retire simulated appointment surface`

- removed the orphaned `BusinessTabs -> QuickActions -> BookingButton` chain;
- removed the orphaned appointment-management chain and `src/shared/hooks/useAppointments.ts`;
- retired the fake submit path that used `setTimeout` and reported successful scheduling without persistence;
- removed related public barrel exports;
- added `tests/architecture/business-appointments-surface.test.ts`.

### `d2b48cf7516fc01b4dc5fa5efe43eea6c8371404`

`refactor(g6): retire orphaned business tab stack`

- removed the seven legacy Business tab wrappers after caller census showed no runtime owner;
- removed their exclusive dead children `DigitalMenu`, `BusinessStats`, `PhotoGallery` and `PromoBanner`;
- removed inert add/edit/delete CTAs that had no command authority;
- removed the now-unused `src/modules/business/types/components.ts`;
- added `tests/architecture/business-legacy-tabs-retired.test.ts`.

### `2c9e45899a5f6d991d1f4e7085fd9a3645975f6f`

`refactor(g6): move demo business fixtures to tests`

- removed the runtime Toné Pizzaria / `tone-cos-loja` exceptions from `BusinessUrlService`, `PublicBusinessSnapshotService` and `EmpresaDetailLandingPage`;
- removed the three runtime fixture files and obsolete `public/images/mock-tone-pizzaria` assets;
- migrated the deterministic business used by Playwright to `tests/e2e/support/businessRouteFixtures.ts`, using browser-only request interception;
- updated community SEO/territorial/mobile E2E callers to the test-only fixture;
- added `tests/architecture/business-test-fixture-boundary.test.ts`.

### `b3591b819e4292e4953c0a4b2f1708ae5d402a82`

`refactor(g6): retire orphaned business base components`

- caller census proved the old Business base presentation components had no runtime consumers;
- removed the callerless About/Gallery/Hours/Products/Reviews/Services/sidebar/share/section-manager components and orphaned `useBusinessSidebar`;
- cleaned both Business public barrels while preserving active hooks, pages, `ContactLink`, company sections and canonical core owners;
- added `tests/architecture/business-base-orphans-retired.test.ts`.

## Hosted validation classification

Before the recent allocation degradation, `f92bee10a3133c56d37d34949a750429dfe24f73` had real hosted proof for the important executable gates:

- Security: Lint and Type Check = success;
- Security: No Hardcoded Credentials = success;
- Security: Maps Architecture = success;
- Territorial: Phase Core Gate = success;
- Territorial: Runtime Vitest = success;
- Territorial: fixture-backed E2E = success;
- Territorial: authenticated Account E2E = success;
- Territorial: Regression Check = success.

The aggregate `All Tests Passed` job on that run failed separately even though its authoritative dependencies above were successful.

For the later G6 source commits, GitHub again intermittently returned jobs with `steps = null`, including the full Security/SSOT/Territorial set observed for `2c9e45899a5f6d991d1f4e7085fd9a3645975f6f`. Those results are **INFRASTRUCTURE / PRE-STEP**, not source failures. Do not repeatedly rerun or weaken workflows to obtain a green badge.

Vercel remains an independent build signal. `db1cc3e6ce2250b55584b8917fff5992ddd18295` and `d2b48cf7516fc01b4dc5fa5efe43eea6c8371404` reached `READY`. At the latest observation used for this checkpoint, `2c9e45899a5f6d991d1f4e7085fd9a3645975f6f` was `BUILDING` and `b3591b819e4292e4953c0a4b2f1708ae5d402a82` was `QUEUED`. Do not interpret queueing/cancellation caused by superseding Git commits as a source failure.

## Current next action

Continue **G6 Empresas base** with certification rather than more speculative refactor:

1. obtain a hosted execution with real steps for the current Business source and classify only actual failing steps;
2. certify create -> edit -> public page -> management and negative authorization without runtime demo data;
3. revisit create/update/delete partial state only if a canonical transaction/compensation owner exists; otherwise prefer a separately designed idempotency/retry slice over ad-hoc destructive cleanup;
4. keep coupons fail-closed until the schema has an approved business identity contract;
5. require same-SHA build/deploy/smoke before Business READY;
6. only then move to the next module in the G6 order.

## Do not repeat

- do not reopen G5 B0–B3 without new contradictory evidence;
- do not manually patch `types.generated.ts`;
- do not delete Storage buckets through SQL;
- do not restore module copies of `EmpresaDashboardTab`, `AnalyticsDashboard`, `CouponManager` or `SubscriptionPlans`;\n- do not restore the retired module `NetworkTab` bridge, simulated appointment surface, `BusinessTabs` wrapper, legacy tab stack or callerless Business base components;\n- do not restore Toné Pizzaria / `tone-cos-loja` or any equivalent demo-business exception inside runtime `src/`; Playwright fixtures belong under `tests/`;
- do not manufacture coupon ownership by business name or another non-canonical field;
- do not hardcode Billing plan prices/features inside Business UI;
- do not interpret `steps = null` jobs as failing lint/typecheck/tests;
- do not run repeated workflow retries for allocation-only failures;
- do not declare G7/MVP until same-SHA release/deploy/smoke evidence satisfies the permanent root plan.
