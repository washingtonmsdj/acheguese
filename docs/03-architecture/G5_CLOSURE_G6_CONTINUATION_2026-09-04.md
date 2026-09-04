# G5 closure / G6 continuation — 2026-09-04

## Authority

This checkpoint is a delta to `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`; it does not replace the permanent root plan.

- execution branch: `main` only;
- checkpoint source HEAD before this document: `d1671fd47e5aef51cdad76dc658fca1fa3abe7f2`;
- canonical Supabase project: `xhdowzacfujckjelqhtd`;
- current phase: **G6 — Module Certification / Empresas base**.

The root plan header still carries the historical `G5 EM EXECUÇÃO` wording. Future agents must use this checkpoint together with the closed blocker issues and current `main` instead of reopening G5 work already resolved.

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

For the later G6 source commits, GitHub again intermittently returned jobs with `steps = null`, including a single targeted rerun. Those results are **INFRASTRUCTURE / PRE-STEP**, not source failures. Do not repeatedly rerun or weaken workflows to obtain a green badge. The new G6 commits require the next naturally allocated hosted execution for same-SHA proof.

## Current next action

Continue **G6 Empresas base** from the active routed surfaces and their canonical owners. Priorities:

1. inspect remaining core↔module duplicate Business components by caller census before any removal;
2. replace active placeholders only when a real canonical implementation already exists or when a focused, authority-correct implementation can be proven;
3. characterize Business create/update/delete partial-state boundaries and add compensation only through proven canonical owners—never ad-hoc destructive writes;
4. keep coupons fail-closed until the schema has an approved business identity contract;
5. obtain hosted same-SHA proof when GitHub allocates real steps again;
6. only after Empresas base is certified move to the next module in the G6 order.

## Do not repeat

- do not reopen G5 B0–B3 without new contradictory evidence;
- do not manually patch `types.generated.ts`;
- do not delete Storage buckets through SQL;
- do not restore module copies of `EmpresaDashboardTab`, `AnalyticsDashboard`, `CouponManager` or `SubscriptionPlans`;
- do not manufacture coupon ownership by business name or another non-canonical field;
- do not hardcode Billing plan prices/features inside Business UI;
- do not interpret `steps = null` jobs as failing lint/typecheck/tests;
- do not run repeated workflow retries for allocation-only failures;
- do not declare G7/MVP until same-SHA release/deploy/smoke evidence satisfies the permanent root plan.
