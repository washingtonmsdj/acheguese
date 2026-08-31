# G5 — Redundant UNIQUE-shadow indexes — 2026-08-31

## Authority

This checkpoint extends `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` and the G5 checkpoints already active on `main`.

- branch: `main`;
- HEAD immediately before this documentation write: `ee6c839334412574e11b768b01dc61e84e7a90ec`;
- Supabase project: `xhdowzacfujckjelqhtd`;
- phase: **G5 EM EXECUÇÃO**;
- this cut is an optimization/reconciliation improvement and does **not** create a new G5 launch blocker.

## 1. Finding class

The previous schema-integrity checkpoint reported zero **exact duplicate indexes** because uniqueness was part of the structural identity used by that audit. A new narrower check intentionally compared a different class:

> a normal non-UNIQUE B-tree index whose table, key columns, access method, operator classes, collations, options, expressions and predicate are identical to a healthy UNIQUE index on the same table.

When the UNIQUE index is owned by a UNIQUE constraint, the normal index does not add uniqueness authority and does not widen the query key/predicate coverage. It adds a second write-maintenance path and extra storage.

This finding must not be confused with `unused_index`: scan count alone was **not** used as removal authority.

## 2. Provenance-backed cuts

### 2.1 First cut

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

### 2.2 Second cut

Two additional cases were accepted only after direct source provenance and a fresh live structural comparison:

1. `site_settings.key`
   - historical migration `20260422000000_create_site_settings.sql` declares `key TEXT NOT NULL UNIQUE` and also creates `idx_site_settings_key` on `(key)`;
   - retained: `site_settings_key_key` — UNIQUE constraint-owned;
   - removed: `idx_site_settings_key`.

2. `notification_preferences.user_id`
   - historical migration `20260418170001_alter_notifications_system.sql` declares `user_id UUID NOT NULL UNIQUE` and also creates `idx_notification_preferences_user` on `(user_id)`;
   - retained: `notification_preferences_user_id_key` — UNIQUE constraint-owned;
   - removed: `idx_notification_preferences_user`.

Immediately before the second cut, the remote PostgreSQL catalog confirmed for both pairs:

- ordinary drop candidate: non-UNIQUE, valid and ready;
- retained index: UNIQUE, valid and ready, owned by a `contype = 'u'` constraint;
- drop candidate: not constraint-owned;
- exact equality of table, `indnatts`, `indnkeyatts`, `indkey`, `indclass`, `indcollation`, `indoption`, `indexprs`, `indpred` and index access method.

## 3. Migration lifecycle

Both cuts were applied through the official Supabase migration lifecycle.

### First cut

- remote version: `20260831120040`;
- name: `remove_redundant_unique_shadow_indexes_g5`;
- source commit: `6442db7c6a887544b72f9be60b8347dfdb071708` — `perf(g5): remove redundant unique shadow indexes`;
- source migration: `supabase/migrations/20260831120040_remove_redundant_unique_shadow_indexes_g5.sql`.

### Second cut

- remote version: `20260831170039`;
- name: `remove_more_redundant_unique_shadow_indexes_g5`;
- source commit: `ee6c839334412574e11b768b01dc61e84e7a90ec` — `perf(g5): remove more redundant unique shadow indexes`;
- source migration: `supabase/migrations/20260831170039_remove_more_redundant_unique_shadow_indexes_g5.sql`.

The migrations are fail-closed. For every candidate they verify before removal that:

- the target table and both index authorities exist;
- the retained index is UNIQUE and owned by a UNIQUE constraint;
- the drop candidate is not constraint-owned;
- both indexes are valid/ready;
- table, key count, key columns, operator classes, collations, options, expressions, predicate and access method match;
- only the intended uniqueness difference remains.

They then use ordinary `DROP INDEX` with default restrictive dependency behavior. They do not use `IF EXISTS`, `CASCADE`, data mutation or constraint removal.

Postconditions require every shadow index to be absent and every retained UNIQUE index to remain unique, valid, ready and constraint-owned.

## 4. Remote postcheck

After the second migration, the remote catalog confirmed:

- `idx_site_settings_key`: absent;
- `idx_notification_preferences_user`: absent;
- `site_settings_key_key`: `indisunique = true`, `indisvalid = true`, `indisready = true`, constraint validated;
- `notification_preferences_user_id_key`: `indisunique = true`, `indisvalid = true`, `indisready = true`, constraint validated.

The first-cut retained indexes had already been confirmed with the same health properties.

No application row was modified by either cut.

## 5. Hosted proof

### First cut

The source commit triggered Vercel production deployment `dpl_5UV4UyuoK8HXTEWmE6oKwWVZ6huQ`. The build advanced through the existing source/security path and reached the already-known dependency gate:

- `lint:security`: 0 errors, 93 warnings;
- first failing gate: `npm audit --omit=dev --audit-level=moderate`;
- failure: the two known React Router advisories inherited through `react-router-dom@6.30.4`.

### Second cut — same-SHA

Commit `ee6c839334412574e11b768b01dc61e84e7a90ec` triggered Vercel production deployment `dpl_GhJQPaogH5pNVFnhF3H7XHJsfaZw`.

The hosted build cloned exactly commit `ee6c839`, then:

- package/lock consistency validator: PASS, 111 direct dependencies aligned;
- `npm ci`: completed, 758 packages installed;
- `security:validate`: passed with the already-known missing `.env.local` warning in hosted checkout;
- `lint:security`: 0 errors, 93 warnings;
- first failing gate again: `npm audit --omit=dev --audit-level=moderate`;
- findings again: `GHSA-wrjc-x8rr-h8h6` and `GHSA-337j-9hxr-rhxg` through React Router `< 7.18.0`.

Therefore the second database/source cut also introduced **no new pre-B0 hosted regression**. B0 remains the first real hosted source blocker.

## 6. GitHub Actions proof

Fresh push-triggered Actions runs were inspected on exact commit `ee6c839334412574e11b768b01dc61e84e7a90ec` without manual rerun.

Example `Security Check` run `33417275966` created four jobs. Every inspected job had:

- `conclusion = failure`;
- `steps = []`;
- `labels = ["ubuntu-latest"]`;
- `runner_id = 0`;
- empty `runner_name` and runner group.

This is failure before the first workflow step, not test/source failure evidence. B3 therefore remains an external runner/allocation/provider blocker. Repeated reruns are not useful while this state persists.

## 7. Remaining similar candidates

A live catalog query after the first cut identified roughly thirty normal indexes structurally shadowed by constraint-owned UNIQUE indexes. The second cut removed only two with direct provenance.

The remaining rows are **candidates, not an automatic drop list**.

Important exception already documented:

- `locations.idx_locations_geographic_path` must not be removed as part of a generic cleanup. The dedicated location-prefix performance checkpoint explicitly preserves the standard/UNIQUE indexes while using the separate `text_pattern_ops` index for prefix matching.

Other candidates must be handled only in small provenance-backed cuts, especially where an index name is referenced by a migration ratchet, operational proof, or domain-specific performance decision.

Do not mass-drop the remaining set merely because the structural detector can enumerate it.

## 8. G5 consequence

This finding class remains **PARTIALLY CLEANED / NON-BLOCKING**.

The launch-blocking G5 set remains unchanged:

- **B0** — React Router v7.18.3 canonical npm/lockfile lifecycle + hosted proof;
- **B1** — complete official Supabase generated-types materialization;
- **B2** — official Storage API removal of empty orphan `classified-images`;
- **B3** — GitHub Actions with real runner allocation and executed steps.

Do not start G6 while B0–B3 remain open.

## 9. Do not repeat

- do not treat `idx_scan = 0` as sufficient drop authority;
- do not remove UNIQUE/constraint-owned indexes;
- do not use `DROP INDEX IF EXISTS` in new G5 cleanup migrations to hide missing preconditions;
- do not use `CASCADE`;
- do not remove `idx_locations_geographic_path` through a generic redundancy sweep;
- do not mass-drop every remaining shadow candidate without source/provenance review;
- do not let index cleanup distract from B0–B3, which remain the actual G5 exit blockers.
