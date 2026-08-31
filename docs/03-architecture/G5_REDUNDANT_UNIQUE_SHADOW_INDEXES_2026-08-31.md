# G5 — Redundant UNIQUE-shadow indexes — 2026-08-31

## Authority

This checkpoint extends `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` and the G5 checkpoints already active on `main`.

- branch: `main`;
- HEAD immediately before this documentation write: `6442db7c6a887544b72f9be60b8347dfdb071708`;
- Supabase project: `xhdowzacfujckjelqhtd`;
- phase: **G5 EM EXECUÇÃO**;
- this cut is an optimization/reconciliation improvement and does **not** create a new G5 launch blocker.

## 1. Finding class

The previous schema-integrity checkpoint reported zero **exact duplicate indexes** because uniqueness was part of the structural identity used by that audit. A new narrower check intentionally compared a different class:

> a normal non-UNIQUE B-tree index whose table, key columns, access method, operator classes, collations, options, expressions and predicate are identical to a healthy UNIQUE index on the same table.

When the UNIQUE index is owned by a UNIQUE constraint, the normal index does not add uniqueness authority and does not widen the query key/predicate coverage. It adds a second write-maintenance path and extra storage.

This finding must not be confused with `unused_index`: scan count alone was **not** used as removal authority.

## 2. First provenance-backed cut

Three cases had direct historical migration provenance showing that the table column was declared `UNIQUE` and a second ordinary index was then created on the same key:

1. `communication_channels.slug`
   - retained: `communication_channels_slug_key` — UNIQUE constraint-owned;
   - removed: `idx_communication_channels_slug`;
   - historical source: `20260515090000_create_communication_territorial_mvp.sql`.

2. `stripe_webhook_events.stripe_event_id`
   - retained: `stripe_webhook_events_stripe_event_id_key` — UNIQUE constraint-owned;
   - removed: `idx_stripe_webhook_events_stripe_id`;
   - historical source: `20260418160000_create_billing_webhooks.sql`.

3. `subscription_plans.plan_code`
   - retained: `subscription_plans_plan_code_key` — UNIQUE constraint-owned;
   - removed: `idx_subscription_plans_code`;
   - historical source: `20260416100001_create_subscription_plans.sql`.

## 3. Migration lifecycle

The change was applied through the official Supabase migration lifecycle.

Remote ledger:

- version: `20260831120040`;
- name: `remove_redundant_unique_shadow_indexes_g5`.

Source:

- commit: `6442db7c6a887544b72f9be60b8347dfdb071708` — `perf(g5): remove redundant unique shadow indexes`;
- migration: `supabase/migrations/20260831120040_remove_redundant_unique_shadow_indexes_g5.sql`.

The migration is fail-closed. For every candidate it verifies before removal that:

- both indexes exist;
- the retained index is UNIQUE and owned by a UNIQUE constraint;
- the drop candidate is not constraint-owned;
- both indexes are valid/ready;
- table, key count, key columns, operator classes, collations, options, expressions, predicate and access method match;
- only the intended uniqueness difference remains.

It then uses ordinary `DROP INDEX` with default restrictive dependency behavior. It does not use `IF EXISTS`, `CASCADE`, data mutation or constraint removal.

Postconditions require each shadow index to be absent and every retained UNIQUE index to remain unique, valid, ready and constraint-owned.

## 4. Remote postcheck

The remote catalog after migration confirmed all three retained indexes as:

- `indisunique = true`;
- `indisvalid = true`;
- `indisready = true`;
- still owned by their original UNIQUE constraints.

No application row was modified.

## 5. Hosted proof

The source commit triggered a real Vercel production build (`dpl_5UV4UyuoK8HXTEWmE6oKwWVZ6huQ`).

The build advanced through the existing source/security path and reached the same already-known dependency gate:

- `lint:security`: 0 errors, 93 warnings;
- first failing gate: `npm audit --omit=dev --audit-level=moderate`;
- failure remains the two known React Router findings inherited through `react-router-dom@6.30.4`.

Therefore this migration/source cut did **not** expose a new pre-B0 hosted regression. B0 remains the first real hosted source blocker.

GitHub Actions on the same SHA also continued to conclude before useful execution. This does not convert into source-failure evidence and B3 remains independent.

## 6. Remaining similar candidates

A live post-cut catalog query still identified roughly thirty normal indexes that are structurally shadowed by constraint-owned UNIQUE indexes.

These are **candidates, not an automatic drop list**.

Important exception already documented:

- `locations.idx_locations_geographic_path` must not be removed as part of a generic cleanup. The dedicated location-prefix performance checkpoint explicitly preserves the standard/UNIQUE indexes while using the separate `text_pattern_ops` index for prefix matching.

Other candidates must be handled only in small provenance-backed cuts, especially where an index name is referenced by a migration ratchet, operational proof, or domain-specific performance decision.

Do not mass-drop the remaining set merely because the structural detector can enumerate it.

## 7. G5 consequence

This finding class is **PARTIALLY CLEANED / NON-BLOCKING**.

The launch-blocking G5 set remains unchanged:

- **B0** — React Router v7.18.3 canonical npm/lockfile lifecycle + hosted proof;
- **B1** — complete official Supabase generated-types materialization;
- **B2** — official Storage API removal of empty orphan `classified-images`;
- **B3** — GitHub Actions with real runner allocation and executed steps.

Do not start G6 while B0–B3 remain open.

## 8. Do not repeat

- do not treat `idx_scan = 0` as sufficient drop authority;
- do not remove UNIQUE/constraint-owned indexes;
- do not use `DROP INDEX IF EXISTS` in new G5 cleanup migrations to hide missing preconditions;
- do not use `CASCADE`;
- do not remove `idx_locations_geographic_path` through a generic redundancy sweep;
- do not mass-drop every remaining shadow candidate without source/provenance review;
- do not let index cleanup distract from B0–B3, which remain the actual G5 exit blockers.
